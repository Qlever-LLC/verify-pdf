import { rootCertificates } from "node:tls";
import forge from "node-forge";
import rootCAs from "./rootCAs";

const getRootCAs = () => rootCertificates || rootCAs;

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

const verifyCaBundle = (certs) =>
	!!certs.find((cert, i) => certs[i + 1] && certs[i + 1].issued(cert));

const isCertsExpired = (certs) =>
	!!certs.find(
		({ validity: { notAfter, notBefore } }) =>
			notAfter.getTime() < Date.now() || notBefore.getTime() > Date.now(),
	);

const authenticateSignature = (certs) =>
	verifyCaBundle(certs) && verifyRootCert(certs[certs.length - 1]);

export {
	authenticateSignature,
	verifyCaBundle,
	verifyRootCert,
	isCertsExpired,
};
