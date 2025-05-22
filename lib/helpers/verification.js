import { rootCertificates } from "node:tls";
import forge from "node-forge";

import rootCAs from "./rootCAs.json" with { type: "json" };

const getRootCAs = () => rootCertificates ?? rootCAs;

/**
 * @param {forge.pki.Certificate} chainRootInForgeFormat
 */
const verifyRootCert = (chainRootInForgeFormat) =>
	!!getRootCAs().find((rootCAInPem) => {
		try {
			const rootCAInForgeCert = forge.pki.certificateFromPem(rootCAInPem);
			return (
				forge.pki.certificateToPem(chainRootInForgeFormat) === rootCAInPem ||
				rootCAInForgeCert.issued(chainRootInForgeFormat)
			);
		} catch (e) {
			return false;
		}
	});

/**
 * @param {readonly forge.pki.Certificate[]} certs
 */
const verifyCaBundle = (certs) =>
	!!certs.find((cert, i) => certs[i + 1] && certs[i + 1]?.issued(cert));

/**
 * @param {readonly forge.pki.Certificate[]} certs
 */
const isCertsExpired = (certs) =>
	!!certs.find(
		({ validity: { notAfter, notBefore } }) =>
			notAfter.getTime() < Date.now() || notBefore.getTime() > Date.now(),
	);

/**
 * @param {readonly forge.pki.Certificate[]} certs
 */
const authenticateSignature = (certs) => {
	const root = certs.at(-1);
	return verifyCaBundle(certs) && root ? verifyRootCert(root) : false;
};

export {
	authenticateSignature,
	verifyCaBundle,
	verifyRootCert,
	isCertsExpired,
};
