import { describe, expect, it } from "@jest/globals";

import * as testHelpers from "../testHelpers/index.js";
import { isCertsExpired } from "./index.js";

const {
	createCertificateChain,
	validitySamples: { validDates, expiredNotAfter },
} = testHelpers;

describe("Verfications", () => {
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
