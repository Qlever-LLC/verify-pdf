import { describe, expect, it } from "@jest/globals";

import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";

import { P12Signer } from "@signpdf/signer-p12";
import signpdf from "@signpdf/signpdf";

import { VerifyPDFError } from "../VerifyPDFError.js";
import { createPDF, getResourceAbsolutePath } from "../testHelpers/index.js";
import { extractSignature } from "./index.js";

describe("Helpers", () => {
	it("extract signature from signed pdf", async () => {
		const p12Buffer = readFileSync(getResourceAbsolutePath("certificate.p12"));
		const signer = new P12Signer(p12Buffer);
		const pdfBuffer = await createPDF();
		const signedPdfBuffer = await signpdf.default.sign(pdfBuffer, signer);
		const originalSignature = signpdf.default.lastSignature;

		const { signatureStr } = extractSignature(signedPdfBuffer);
		expect(
			Buffer.from(
				// @ts-expect-error test
				signatureStr[0],
				"latin1",
			)
				.toString("hex")
				.replace(/(?:00)+$/, ""),
		).toBe(originalSignature);
	});

	it("expects PDF to contain a ByteRange placeholder", () => {
		try {
			extractSignature(Buffer.from("No BR placeholder"));
			expect("here").not.toBe("here");
		} catch (e) {
			expect(e instanceof VerifyPDFError).toBe(true);
			expect(
				// @ts-expect-error
				e.type,
			).toBe(VerifyPDFError.Type.TYPE_PARSE);
		}
	});

	it("expects PDF to contain a byteRangeEnd", () => {
		try {
			extractSignature(Buffer.from("/ByteRange [   No End"));
			expect("here").not.toBe("here");
		} catch (e) {
			expect(e instanceof VerifyPDFError).toBe(true);
			expect(
				// @ts-expect-error
				e.type,
			).toBe(VerifyPDFError.Type.TYPE_PARSE);
		}
	});
});
