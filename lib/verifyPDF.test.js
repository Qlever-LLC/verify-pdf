import { readFileSync } from "node:fs";
import signpdf from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";

import { UNSUPPORTED_SUBFILTER } from "./VerifyPDFError";
import { extractSignature } from "./helpers";
import { createPDF, getResourceAbsolutePath, pdfSamples } from "./testHelpers";
import verifyPDF from "./verifyPDF";

describe("Test verification", () => {
	it("expects PDF to be Buffer", () => {
		expect(() => verifyPDF(1)).toThrow(/PDF expected as Buffer/);
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
	for (const [sampleName, { notSupported }] of Object.entries(pdfSamples)) {
		const signedPdfBuffer = readFileSync(
			getResourceAbsolutePath(`samples/${sampleName}`),
		);
		if (notSupported) {
			it(`expects sample: '${sampleName}' to be notSupported}`, () => {
				let thrownError;
				try {
					verifyPDF(signedPdfBuffer);
				} catch (error) {
					thrownError = error;
				}
				expect(thrownError.type).toEqual(UNSUPPORTED_SUBFILTER);
			});
		} else {
			const verifyResult = verifyPDF(signedPdfBuffer);

			it(`expects sample: '${sampleName}' to be ${!pdfSamples[sampleName].verified && "not"} valid`, () => {
				expect(verifyResult.verified).toBe(pdfSamples[sampleName].verified);
				expect(verifyResult.integrity).toBe(pdfSamples[sampleName].integrity);
				expect(verifyResult.authenticity).toBe(
					pdfSamples[sampleName].authenticity,
				);
				expect(verifyResult.expired).toBe(pdfSamples[sampleName].expired);
				expect(typeof verifyResult.signatures).toBe("object");
			});
			if (pdfSamples[sampleName].totalSignatures) {
				it(`expects sample: '${sampleName}' to have ${verifyResult.signatures?.length} signatures`, () => {
					expect(verifyResult.signatures.length).toBe(
						pdfSamples[sampleName].totalSignatures,
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
		// manipulate data byte
		const bytePosition = byteRanges[0][1] + byteRanges[0][2] + 100;
		const originalByte = signedPdfBuffer[bytePosition];
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
		// manipulate signture byte
		const bytePosition = byteRanges[0][1] + 2500;
		const originalByte = signedPdfBuffer[bytePosition];
		signedPdfBuffer[bytePosition] = originalByte + 1;
		const { verified, integrity, authenticity, expired } =
			verifyPDF(signedPdfBuffer);
		expect(verified).toBe(false);
		expect(integrity).toBe(undefined);
		expect(authenticity).toBe(undefined);
		expect(expired).toBe(undefined);
	});
});
