import { describe, expect, it } from "@jest/globals";

import { VerifyPDFError } from "./VerifyPDFError.js";

describe("VerifyPDFError", () => {
	it("VerifyPDFError extends Error", () => {
		const instance = new VerifyPDFError("Whatever message");
		expect(instance instanceof Error).toBe(true);
	});
	it("type defaults to UNKNOWN", () => {
		const instance = new VerifyPDFError("Whatever message");
		expect(instance.type).toBe(VerifyPDFError.Type.TYPE_UNKNOWN);
	});
	it("type can be specified", () => {
		for (const type of [
			VerifyPDFError.Type.TYPE_UNKNOWN,
			VerifyPDFError.Type.TYPE_INPUT,
			VerifyPDFError.Type.TYPE_PARSE,
		]) {
			const instance = new VerifyPDFError("Whatever message", type);
			expect(instance.type).toBe(type);
		}
	});
});
