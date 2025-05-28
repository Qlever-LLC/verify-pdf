import forge from "node-forge";

import { VerifyPDFError } from "./VerifyPDFError.js";
import { extractCertificatesDetails } from "./certificateDetails.js";
import {
	authenticateSignature,
	checkForSubFilter,
	extractSignature,
	getClientCertificate,
	getMessageFromSignature,
	isCertsExpired,
	preparePDF,
	sortCertificateChain,
} from "./helpers/index.js";

/**
 * @typedef SignatureMeta
 * @property {string|null} [contactInfo]
 * @property {string|null} [reason]
 * @property {string|null} [location]
 * @property {string|null} [name]
 */

/**
 * @typedef {import("./certificateDetails.js").CertificateDetails} CertificateDetails
 */

/**
 * @typedef SignautreValidation
 * @property {boolean} verified Overall validity of signature
 * @property {boolean} authenticity Signature cert is from a trusted CA
 * @property {boolean} integrity Signature hash is valid
 * @property {boolean} expired Signature is expired
 * @property {{certs: CertificateDetails[], signatureMeta?: SignatureMeta}} meta
 */

/**
 * @param {forge.Bytes} signature
 * @param {Uint8Array} signedData
 * @param {SignatureMeta} [signatureMeta]
 * @returns {SignautreValidation}
 */
const verify = (signature, signedData, signatureMeta) => {
	const message = getMessageFromSignature(signature);
	const {
		certificates,
		rawCapture: {
			signature: sig,
			authenticatedAttributes: attrs,
			digestAlgorithm,
		},
	} = message;
	const hashAlgorithmOid = forge.asn1.derToOid(digestAlgorithm);
	/**
	 * @type {keyof typeof forge.md.algorithms}
	 */
	// @ts-expect-error IDK
	const hashAlgorithm = forge.pki.oids[hashAlgorithmOid].toLowerCase();
	const set = forge.asn1.create(
		forge.asn1.Class.UNIVERSAL,
		forge.asn1.Type.SET,
		true,
		attrs,
	);
	const clientCertificate = getClientCertificate(certificates);
	const digest = forge.md[hashAlgorithm]
		.create()
		.update(forge.asn1.toDer(set).data)
		.digest()
		.getBytes();
	/**
	 * @type {forge.pki.rsa.PublicKey | undefined}
	 */
	// @ts-expect-error IDK
	const publicKey = clientCertificate?.publicKey;
	const validAuthenticatedAttributes = publicKey?.verify(digest, sig);
	if (!validAuthenticatedAttributes) {
		throw new VerifyPDFError(
			"Wrong authenticated attributes",
			VerifyPDFError.Type.VERIFY_SIGNATURE,
		);
	}
	const messageDigestAttr = forge.pki.oids.messageDigest;
	const fullAttrDigest = attrs.find(
		/**
		 * @param {forge.pki.Attribute} attr
		 */
		(attr) => forge.asn1.derToOid(attr.value[0].value) === messageDigestAttr,
	);
	const attrDigest = fullAttrDigest.value[1].value[0].value;
	const dataDigest = forge.md[hashAlgorithm]
		.create()
		.update(Buffer.from(signedData).toString("latin1"))
		.digest()
		.getBytes();
	const integrity = dataDigest === attrDigest;
	const sortedCerts = sortCertificateChain(certificates);
	const parsedCerts = extractCertificatesDetails(sortedCerts);
	const authenticity = authenticateSignature(sortedCerts);
	const expired = isCertsExpired(sortedCerts);
	return {
		/** Overall validity of signature */
		verified: integrity && authenticity && !expired,
		/** Signature cert is from a trusted CA */
		authenticity,
		/** Signature hash is valid */
		integrity,
		/** Signature is expired */
		expired,
		meta: { certs: parsedCerts, signatureMeta },
	};
};

/**
 * @typedef SignautresValidation
 * @property {boolean} verified Overall validity of _all_ signatures
 * @property {boolean} [authenticity] _All_ signature certs are from trusted CA(s)
 * @property {boolean} [integrity] _All_ signature hashes are valid
 * @property {boolean} [expired] _Any_ Signatures are expired
 * @property {readonly SignautreValidation[]} [signatures]
 * @property {string} [message] Error message if verification failed
 * @property {unknown} [error] Error object if verification failed
 */

/**
 * @param {Uint8Array} pdf
 * @returns {SignautresValidation}
 */
export function verifyPDF(pdf) {
	const pdfBuffer = preparePDF(pdf);
	checkForSubFilter(pdfBuffer);
	try {
		const { signatureStr, signedData, signatureMeta } =
			extractSignature(pdfBuffer);

		const signatures = signedData.map((signed, index) => {
			return verify(signatureStr[index] ?? "", signed, signatureMeta[index]);
		});

		return {
			verified: signatures.every((sig) => sig.verified === true),
			authenticity: signatures.every((sig) => sig.authenticity === true),
			integrity: signatures.every((sig) => sig.integrity === true),
			expired: signatures.some((sig) => sig.expired === true),
			signatures,
		};
	} catch (error) {
		return {
			verified: false,
			message:
				// @ts-expect-error error
				error.message,
			error,
		};
	}
}

export default verifyPDF;
