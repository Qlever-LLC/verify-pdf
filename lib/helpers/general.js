import { Buffer } from "node:buffer";

import forge from "node-forge";

import VerifyPDFError, {
	TYPE_INPUT,
	TYPE_PARSE,
	UNSUPPORTED_SUBFILTER,
} from "../VerifyPDFError";

const preparePDF = (pdf) => {
	try {
		if (Buffer.isBuffer(pdf)) return pdf;
		return Buffer.from(pdf);
	} catch (error) {
		throw new VerifyPDFError("PDF expected as Buffer.", TYPE_INPUT);
	}
};

const checkForSubFilter = (pdfBuffer) => {
	const matches = pdfBuffer.toString().match(/\/SubFilter\s*\/([\w.]*)/);
	const subFilter = Array.isArray(matches) && matches[1];
	if (!subFilter) {
		throw new VerifyPDFError("cannot find subfilter", TYPE_PARSE);
	}
	const supportedTypes = ["adbe.pkcs7.detached", "etsi.cades.detached"];
	if (!supportedTypes.includes(subFilter.trim().toLowerCase()))
		throw new VerifyPDFError(
			`subFilter ${subFilter} not supported`,
			UNSUPPORTED_SUBFILTER,
		);
};
const getMessageFromSignature = (signature) => {
	const p7Asn1 = forge.asn1.fromDer(signature, { parseAllBytes: false });
	return forge.pkcs7.messageFromAsn1(p7Asn1);
};

const getMetaRegexMatch = (keyName) => (str) => {
	const regex = new RegExp(`/${keyName}\\s*\\(([\\w.\\s@,]*)`, "g");
	const matches = [...str.matchAll(regex)];
	const meta = matches.length ? matches[matches.length - 1][1] : null;

	return meta;
};

const getSignatureMeta = (signedData) => {
	const str = Buffer.isBuffer(signedData) ? signedData.toString() : signedData;
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
