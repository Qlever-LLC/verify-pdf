import { describe, expect, it } from "@jest/globals";

import * as testHelpers from "../testHelpers/index.js";
import {
	isCertsExpired,
	sortCertificateChain,
	verifyCaBundle,
	verifyRootCert,
} from "./index.js";

/**
 * @import forge from 'node-forge'
 */

const {
	createCertificateChain,
	validitySamples: { validDates, expiredNotAfter },
} = testHelpers;

describe("Verfications", () => {
	it("should verify CA bundle and return true if the chain is valid", async () => {
		const certs = createCertificateChain({
			clientValidity: validDates,
			intermediateValidity: validDates,
			rootValidity: validDates,
		});
		const sortedCertificateChain = sortCertificateChain(certs);
		const valid = verifyCaBundle(sortedCertificateChain);
		expect(valid).toBe(true);
	});

	it("should verify CA bundle and return false if the chain is not valid", async () => {
		const certs = createCertificateChain({
			clientValidity: validDates,
			intermediateValidity: validDates,
			rootValidity: validDates,
		});
		const valid = verifyCaBundle(certs);
		expect(valid).toBe(false);
	});

	it("should verify root CA and return false if the root certificate is not recognized", async () => {
		const certs = createCertificateChain({
			clientValidity: validDates,
			intermediateValidity: validDates,
			rootValidity: validDates,
		});
		/**
		 * @type {forge.pki.Certificate}
		 */
		// @ts-expect-error not-null
		const root = certs.at(-1);
		const valid = verifyRootCert(root);
		expect(valid).toBe(false);
	});

	it("should verify if the certs expired and return false if all the chain dates is not expired", async () => {
		const certs = createCertificateChain({
			clientValidity: validDates,
			intermediateValidity: validDates,
			rootValidity: validDates,
		});
		const expired = isCertsExpired(certs);
		expect(expired).toBe(false);
	});

	it("should verify if the certs expired and return true if the clientCertificate is expired", async () => {
		const certs = createCertificateChain({
			clientValidity: expiredNotAfter,
			intermediateValidity: validDates,
			rootValidity: validDates,
		});
		const expired = isCertsExpired(certs);
		expect(expired).toBe(true);
	});
});
