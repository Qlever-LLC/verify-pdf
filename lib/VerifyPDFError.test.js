import VerifyPDFError, {
	TYPE_UNKNOWN,
	TYPE_INPUT,
	TYPE_PARSE,
} from "./VerifyPDFError";

describe("VerifyPDFError", () => {
	it("VerifyPDFError extends Error", () => {
		const instance = new VerifyPDFError("Whatever message");
		expect(instance instanceof Error).toBe(true);
	});
	it("type defaults to UNKNOWN", () => {
		const instance = new VerifyPDFError("Whatever message");
		expect(instance.type).toBe(TYPE_UNKNOWN);
	});
	it("type can be specified", () => {
		for (const type of [TYPE_UNKNOWN, TYPE_INPUT, TYPE_PARSE]) {
			const instance = new VerifyPDFError("Whatever message", type);
			expect(instance.type).toBe(type);
		}
	});
});
