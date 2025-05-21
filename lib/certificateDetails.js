import forge from "node-forge";

import {
	extractSignature,
	getMessageFromSignature,
	preparePDF,
} from "./helpers";

const mapEntityAtrributes = (attrs) =>
	attrs.reduce((agg, { name, value }) => {
		if (!name) return agg;
		agg[name] = value;
		return agg;
	}, {});

const extractSingleCertificateDetails = (cert) => {
	const { issuer, subject, validity } = cert;
	return {
		issuedBy: mapEntityAtrributes(issuer.attributes),
		issuedTo: mapEntityAtrributes(subject.attributes),
		validityPeriod: validity,
		pemCertificate: forge.pki.certificateToPem(cert),
	};
};

const extractCertificatesDetails = (certs) =>
	certs.map(extractSingleCertificateDetails).map((cert, i) => {
		if (i) return cert;
		return {
			clientCertificate: true,
			...cert,
		};
	});

const getCertificatesInfoFromPDF = (pdf) => {
	const pdfBuffer = preparePDF(pdf);
	const { signatureStr } = extractSignature(pdfBuffer);

	return signatureStr.map((signature) => {
		const { certificates } = getMessageFromSignature(signature);
		return extractCertificatesDetails(certificates);
	});
};

export { extractCertificatesDetails, getCertificatesInfoFromPDF };
