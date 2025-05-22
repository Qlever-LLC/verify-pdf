import { Buffer } from "node:buffer";

import forge from "node-forge";

import { VerifyPDFError } from "../VerifyPDFError.js";

/**
 * @param {Uint8Array} pdf
 */
const preparePDF = (pdf) => {
	try {
		if (Buffer.isBuffer(pdf)) return pdf;
		return Buffer.from(pdf);
	} catch (error) {
		throw new VerifyPDFError(
			"PDF expected as Buffer.",
			VerifyPDFError.Type.TYPE_INPUT,
		);
	}
};

/**
 * @param {Uint8Array} pdfBuffer
 */
const checkForSubFilter = (pdfBuffer) => {
	const matches = pdfBuffer.toString().match(/\/SubFilter\s*\/([\w.]*)/);
	const subFilter = Array.isArray(matches) && matches[1];
	if (!subFilter) {
		throw new VerifyPDFError(
			"cannot find subfilter",
			VerifyPDFError.Type.TYPE_PARSE,
		);
	}
	const supportedTypes = ["adbe.pkcs7.detached", "etsi.cades.detached"];
	if (!supportedTypes.includes(subFilter.trim().toLowerCase()))
		throw new VerifyPDFError(
			`subFilter ${subFilter} not supported`,
			VerifyPDFError.Type.UNSUPPORTED_SUBFILTER,
		);
};

/**
 * @param {forge.Bytes} signature
 */
const getMessageFromSignature = (signature) => {
	const p7Asn1 = forge.asn1.fromDer(
		signature,
		// @ts-expect-error secret parameter
		{ parseAllBytes: false },
	);
	const message = forge.pkcs7.messageFromAsn1(p7Asn1);
	return {
		/**
		 * @type {forge.pki.Certificate[]}
		 */
		// @ts-expect-error Types are wrong maybe?
		certificates: message.certificates,
		...message,
	};
};

/**
 * @param {string} keyName
 */
const getMetaRegexMatch =
	(keyName) =>
	/**
	 * @param {string} str
	 */
	(str) => {
		const regex = new RegExp(`/${keyName}\\s*\\(([\\w.\\s@,]*)`, "g");
		const matches = [...str.matchAll(regex)];
		const meta = matches.length ? matches[matches.length - 1]?.[1] : null;

		return meta;
	};

/**
 * @param {Uint8Array | string} signedData
 */
const getSignatureMeta = (signedData) => {
	const str =
		signedData instanceof Uint8Array ? signedData.toString() : signedData;
	return {
		reason: getMetaRegexMatch("Reason")(str),
		contactInfo: getMetaRegexMatch("ContactInfo")(str),
		location: getMetaRegexMatch("Location")(str),
		name: getMetaRegexMatch("Name")(str),
	};
};

export {
	checkForSubFilter,
	getSignatureMeta,
	getMessageFromSignature,
	preparePDF,
};
