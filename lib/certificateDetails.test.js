import signpdf from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import VerifyPDFError, { TYPE_INPUT } from "./VerifyPDFError";
import { getCertificatesInfoFromPDF } from "./certificateDetails";
import * as testHelpers from "./testHelpers";

const {
	createPDF,
	createCertificate,
	attrs: { rootCaAttrs },
	parseAttrs,
} = testHelpers;

describe("Test signature details", () => {
	it("expects PDF to be Buffer", () => {
		try {
			getCertificatesInfoFromPDF(1);
			expect("here").not.toBe("here");
		} catch (e) {
			expect(e instanceof VerifyPDFError).toBe(true);
			expect(e.type).toBe(TYPE_INPUT);
		}
	});

	it("return certificates details if input is valid", async () => {
		const passphrase = "password";
		const notBefore = new Date("2015");
		const notAfter = new Date("2020");
		const { pkcs12Cert, pemCertificate } = createCertificate({
			subjectAttrs: rootCaAttrs,
			issuerAttrs: rootCaAttrs,
			serialNumber: "01",
			selfSignedCertificate: true,
			password: passphrase,
			notBefore,
			notAfter,
		});
		const signer = new P12Signer(Buffer.from(pkcs12Cert, "latin1"), {
			passphrase,
		});
		const pdfBuffer = await createPDF();
		const signedPdfBuffer = await signpdf.default.sign(pdfBuffer, signer);
		const certs = getCertificatesInfoFromPDF(signedPdfBuffer);
		const expectedCerts = [
			{
				issuedBy: parseAttrs(rootCaAttrs),
				issuedTo: parseAttrs(rootCaAttrs),
				clientCertificate: true,
				pemCertificate,
				validityPeriod: {
					notBefore,
					notAfter,
				},
			},
		];
		expect(expectedCerts).toEqual(certs[0]);
	});
});
