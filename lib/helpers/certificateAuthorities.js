import tls from "node:tls";

import forge from "node-forge";

/**
 * Attempt to find system CAs
 * (as PEM encoded strings)
 * @type {readonly string[]}
 */
export const defaultCACertificates =
	tls.getCACertificates?.() ?? tls.rootCertificates ?? [];

/**
 * CA Store for validating PDF certs
 */
export const caStore = forge.pki.createCaStore();

// Load Default CA certificates into the store
for (const ca of defaultCACertificates) {
	try {
		caStore.addCertificate(ca);
	} catch (error) {
		// console.warn(error, "Failed to add CA certificate");
	}
}
