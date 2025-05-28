import forge from "node-forge";

import { caStore } from "./certificateAuthorities.js";

/**
 * @param {readonly forge.pki.Certificate[]} certs
 */
export const isCertsExpired = (certs) =>
	!!certs.find(
		({ validity: { notAfter, notBefore } }) =>
			notAfter.getTime() < Date.now() || notBefore.getTime() > Date.now(),
	);

/**
 * @param {forge.pki.Certificate[]} certs
 */
export const authenticateSignature = (certs) => {
	try {
		return forge.pki.verifyCertificateChain(caStore, certs);
	} catch (error) {
		console.warn(error, "Failed to verify certificate chain");
		return false;
	}
};
