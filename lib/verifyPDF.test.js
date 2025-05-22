import { describe, expect, it } from "@jest/globals";

import { readFileSync } from "node:fs";
import { P12Signer } from "@signpdf/signer-p12";
import signpdf from "@signpdf/signpdf";

import { VerifyPDFError } from "./VerifyPDFError.js";
import { extractSignature } from "./helpers/index.js";
import {
	createPDF,
	getResourceAbsolutePath,
	pdfSamples,
} from "./testHelpers/index.js";
import verifyPDF from "./verifyPDF.js";

describe("Test verification", () => {
	it("expects PDF to be Buffer", () => {
		expect(() =>
			verifyPDF(
				// @ts-expect-error test
				1,
			),
		).toThrow(/PDF expected as Buffer/);
	});
	it("return { verified: true, integrity: true, authenticity: false } if input is valid", async () => {
		const p12Buffer = readFileSync(getResourceAbsolutePath("certificate.p12"));
		const signer = new P12Signer(p12Buffer);
		const pdfBuffer = await createPDF();
		const signedPdfBuffer = await signpdf.default.sign(pdfBuffer, signer);
		const verifyResult = verifyPDF(signedPdfBuffer);
		expect(verifyResult.verified).toBe(false);
		expect(verifyResult.integrity).toBe(true);
		expect(verifyResult.authenticity).toBe(false);
	});
	for (const [sampleName, pdfSample] of Object.entries(pdfSamples)) {
		const signedPdfBuffer = readFileSync(
			getResourceAbsolutePath(`samples/${sampleName}`),
		);
		if (pdfSample.notSupported) {
			it(`expects sample: '${sampleName}' to be notSupported}`, () => {
				let thrownError;
				try {
					verifyPDF(signedPdfBuffer);
				} catch (error) {
					thrownError = error;
				}
				expect(
					// @ts-expect-error test
					thrownError.type,
				).toEqual(VerifyPDFError.Type.UNSUPPORTED_SUBFILTER);
			});
		} else {
			const verifyResult = verifyPDF(signedPdfBuffer);

			it(`expects sample: '${sampleName}' to be ${!pdfSample.verified && "not"} valid`, () => {
				expect(verifyResult.verified).toBe(pdfSample.verified);
				expect(verifyResult.integrity).toBe(pdfSample.integrity);
				expect(verifyResult.authenticity).toBe(pdfSample.authenticity);
				expect(verifyResult.expired).toBe(pdfSample.expired);
				expect(typeof verifyResult.signatures).toBe("object");
			});
			if (pdfSample.totalSignatures) {
				it(`expects sample: '${sampleName}' to have ${verifyResult.signatures?.length} signatures`, () => {
					expect(verifyResult.signatures?.length).toBe(
						pdfSample.totalSignatures,
					);
				});
			}
		}
	}
	it("return { verified: false } if pdf data is changed", async () => {
		const p12Buffer = readFileSync(getResourceAbsolutePath("certificate.p12"));
		const signer = new P12Signer(p12Buffer);
		const pdfBuffer = await createPDF();
		const signedPdfBuffer = await signpdf.default.sign(pdfBuffer, signer);
		const { byteRanges } = extractSignature(signedPdfBuffer);
		const byteRange = byteRanges[0] ?? [0, 0, 0, 0];
		// manipulate data byte
		const bytePosition = byteRange[1] + byteRange[2] + 100;
		const originalByte = signedPdfBuffer[bytePosition];
		// @ts-expect-error test
		signedPdfBuffer[bytePosition] = originalByte + 1;
		const { verified, integrity, authenticity, expired } =
			verifyPDF(signedPdfBuffer);
		expect(verified).toBe(false);
		expect(integrity).toBe(false);
		expect(authenticity).toBe(false);
		expect(expired).toBe(false);
	});
	it("return { verified: false } if bytes are added to the end of the PDF", async () => {
		const signedPdfBuffer = readFileSync(
			getResourceAbsolutePath("samples/bytes-added.pdf"),
		);
		let valid;

		try {
			extractSignature(signedPdfBuffer);
			valid = true;
		} catch (e) {
			valid = false;
		}

		expect(valid).toBe(false);
	});
	it("return { verified: false } if signature is changed", async () => {
		const p12Buffer = readFileSync(getResourceAbsolutePath("certificate.p12"));
		const signer = new P12Signer(p12Buffer);
		const pdfBuffer = await createPDF();
		const signedPdfBuffer = await signpdf.default.sign(pdfBuffer, signer);
		const { byteRanges } = extractSignature(signedPdfBuffer);
		const byteRange = byteRanges[0] ?? [0, 0, 0, 0];
		// manipulate signture byte
		const bytePosition = byteRange[1] + 2500;
		const originalByte = signedPdfBuffer[bytePosition];
		// @ts-expect-error test
		signedPdfBuffer[bytePosition] = originalByte + 1;
		const { verified, integrity, authenticity, expired } =
			verifyPDF(signedPdfBuffer);
		expect(verified).toBe(false);
		expect(integrity).toBe(undefined);
		expect(authenticity).toBe(undefined);
		expect(expired).toBe(undefined);
	});
});
