import forge from "node-forge";

import {
	extractSignature,
	getMessageFromSignature,
	preparePDF,
} from "./helpers/index.js";

/**
 * @param {readonly forge.pki.CertificateField[]} attrs
 */
const mapEntityAtrributes = (attrs) =>
	attrs.reduce(
		/**
		 * @param {Record<string, unknown>} agg
		 */
		(agg, { name, value }) => {
			if (!name) return agg;
			agg[name] = value;
			return agg;
		},
		{},
	);

/**
 * @typedef CertificateDetails
 * @property {boolean} [clientCertificate]
 * @property {Record<string, unknown>} issuedBy
 * @property {Record<string, unknown>} issuedTo]
 * @property {{notBefore: Date, notAfter: Date}} validityPeriod
 * @property {string} pemCertificate
 */

/**
 * @param {forge.pki.Certificate} cert
 * @returns {CertificateDetails}
 */
const extractSingleCertificateDetails = (cert) => {
	const { issuer, subject, validity } = cert;
	return {
		issuedBy: mapEntityAtrributes(issuer.attributes),
		issuedTo: mapEntityAtrributes(subject.attributes),
		validityPeriod: validity,
		pemCertificate: forge.pki.certificateToPem(cert),
	};
};

/**
 * @param {readonly forge.pki.Certificate[]} certs
 * @returns {CertificateDetails[]}
 */
const extractCertificatesDetails = (certs) =>
	certs.map(extractSingleCertificateDetails).map((cert, i) => {
		if (i) return cert;
		return {
			clientCertificate: true,
			...cert,
		};
	});

/**
 * @param {Uint8Array} pdf
 */
const getCertificatesInfoFromPDF = (pdf) => {
	const pdfBuffer = preparePDF(pdf);
	const { signatureStr } = extractSignature(pdfBuffer);

	return signatureStr.map((signature) => {
		const { certificates } = getMessageFromSignature(signature);
		return extractCertificatesDetails(certificates);
	});
};

export { extractCertificatesDetails, getCertificatesInfoFromPDF };
