/**
 * @import forge from "node-forge";
 */

/**
 * @param {forge.pki.Certificate} cert
 */
const issued =
	(cert) =>
	/**
	 * @param {forge.pki.Certificate} anotherCert
	 */
	(anotherCert) =>
		cert !== anotherCert && anotherCert.issued(cert);

/**
 * @param {readonly forge.pki.Certificate[]} certsArray
 */
const getIssuer =
	(certsArray) =>
	/**
	 * @param {forge.pki.Certificate} cert
	 */
	(cert) =>
		certsArray.find(issued(cert));

/**
 * @template T
 * @param {(x: T)=>unknown}f
 */
const inverse =
	(f) =>
	/**
	 * @param {T} x
	 */
	(x) =>
		!f(x);

/**
 * @param {readonly forge.pki.Certificate[]} certsArray
 */
const hasNoIssuer = (certsArray) => inverse(getIssuer(certsArray));

/**
 * @param {readonly forge.pki.Certificate[]} certsArray
 */
const getChainRootCertificateIdx = (certsArray) =>
	certsArray.findIndex(hasNoIssuer(certsArray));

/**
 * @param {forge.pki.Certificate} cert
 */
const isIssuedBy =
	(cert) =>
	/**
	 * @param {forge.pki.Certificate} anotherCert
	 */
	(anotherCert) =>
		cert !== anotherCert && cert.issued(anotherCert);

/**
 * @param {readonly forge.pki.Certificate[]} certsArray
 */
const getChildIdx =
	(certsArray) =>
	/**
	 * @param {forge.pki.Certificate} parent
	 */
	(parent) =>
		certsArray.findIndex(isIssuedBy(parent));

/**
 * @param {readonly forge.pki.Certificate[]} certs
 */
const sortCertificateChain = (certs) => {
	const certsArray = Array.from(certs);
	const rootCertIndex = getChainRootCertificateIdx(certsArray);
	const certificateChain = certsArray.splice(rootCertIndex, 1);
	while (certsArray.length) {
		/**
		 * @type {forge.pki.Certificate}
		 */
		// @ts-expect-error not-null
		const lastCert = certificateChain[0];
		const childCertIdx = getChildIdx(certsArray)(lastCert);
		if (childCertIdx === -1) certsArray.splice(childCertIdx, 1);
		else {
			/**
			 * @type {[forge.pki.Certificate]}
			 */
			// @ts-expect-error not-null
			const [childCert] = certsArray.splice(childCertIdx, 1);
			certificateChain.unshift(childCert);
		}
	}
	return certificateChain;
};

/**
 * @param {readonly forge.pki.Certificate[]} certs
 */
const getClientCertificate = (certs) => sortCertificateChain(certs)[0];

export { sortCertificateChain, getClientCertificate };
