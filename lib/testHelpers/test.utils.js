import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pdfkitAddPlaceholder } from "@signpdf/placeholder-pdfkit010";
import forge from "node-forge";
import PDFDocument from "pdfkit";

import * as testData from "./test.data.js";
const {
	attrs: { rootCaAttrs, intermediateCaAttrs, clientAttrs },
} = testData;

/**
 * Creates a Buffer containing a PDF.
 * Returns a Promise that is resolved with the resulting Buffer of the PDFDocument.
 *
 * @param {Uint8Array} [params]
 * @returns {Promise<Buffer>}
 */
export const createPDF = async (params) =>
	new Promise((resolve) => {
		const requestParams = {
			placeholder: {},
			text: "node-signpdf",
			addSignaturePlaceholder: true,
			pages: 1,
			...params,
		};

		const pdf = new PDFDocument({
			autoFirstPage: false,
			size: "A4",
			layout: "portrait",
			bufferPages: true,
		});
		// pdf.info.CreationDate = new Date();

		if (requestParams.pages < 1) {
			requestParams.pages = 1;
		}

		// Add some content to the page(s)
		for (let i = 0; i < requestParams.pages; i += 1) {
			pdf
				.addPage()
				.fillColor("#333")
				.fontSize(25)
				.moveDown()
				.text(requestParams.text)
				.save();
		}

		// Collect the ouput PDF
		// and, when done, resolve with it stored in a Buffer
		/**
		 * @type {Uint8Array[]}
		 */
		const pdfChunks = [];
		pdf.on("data", (data) => {
			pdfChunks.push(data);
		});
		pdf.on("end", () => {
			resolve(Buffer.concat(pdfChunks));
		});

		if (requestParams.addSignaturePlaceholder) {
			// Externally (to PDFKit) add the signature placeholder.
			const refs = pdfkitAddPlaceholder({
				contactInfo: "test",
				name: "test",
				location: "test",
				pdf,
				pdfBuffer: Buffer.from(
					// @ts-expect-error IDK
					[pdf],
				),
				reason: "I am the author",
				...requestParams.placeholder,
			});
			// Externally end the streams of the created objects.
			// PDFKit doesn't know much about them, so it won't .end() them.
			for (const ref of Object.values(refs)) {
				ref.end();
			}
		}

		// Also end the PDFDocument stream.
		// See pdf.on('end'... on how it is then converted to Buffer.
		pdf.end();
	});

const __dirname = dirname(fileURLToPath(import.meta.url));
export const getResourceAbsolutePath = (resourceRelativePath = "") =>
	join(__dirname, "../../test-resources", resourceRelativePath);

/**
 * @typedef Cert
 * @property {forge.pki.CertificateField[]} subjectAttrs
 * @property {forge.pki.CertificateField[]} issuerAttrs
 * @property {string} serialNumber
 * @property {boolean} [selfSignedCertificate]
 * @property {forge.pki.rsa.PrivateKey} [privateKey]
 * @property {string} password
 * @property {Date} notBefore
 * @property {Date} notAfter
 */

/**
 * @param {Cert} params
 */
export const createCertificate = ({
	subjectAttrs,
	issuerAttrs,
	serialNumber,
	selfSignedCertificate,
	privateKey,
	password,
	notBefore,
	notAfter,
}) => {
	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();
	cert.publicKey = keys.publicKey;
	cert.serialNumber = serialNumber;
	cert.validity.notBefore = notBefore;
	cert.validity.notAfter = notAfter;
	cert.setSubject(subjectAttrs);
	cert.setIssuer(issuerAttrs);
	/**
	 * @type {forge.pki.rsa.PrivateKey}
	 */
	// @ts-expect-error not-null
	const signingKey = selfSignedCertificate ? keys.privateKey : privateKey;
	cert.sign(signingKey);
	const pkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
		keys.privateKey,
		[cert],
		password,
		{
			generateLocalKeyId: true,
			friendlyName: "test",
		},
	);
	return {
		pkcs12Cert: forge.asn1.toDer(pkcs12Asn1).getBytes(),
		publicKey: keys.publicKey,
		privateKey: keys.privateKey,
		pemCertificate: forge.pki.certificateToPem(cert),
	};
};

/**
 * @typedef Attr
 * @property {string} [name]
 * @property {unknown} value
 * @property {string} [shortName]
 */

/**
 * @param {readonly Attr[]} attrs
 */
export const parseAttrs = (attrs) =>
	attrs.reduce((agg, ele) => {
		const key =
			ele.name ||
			(ele.shortName === "ST" && "stateOrProvinceName") ||
			ele.shortName === "OU" ||
			"organizationalUnitName";
		// biome-ignore lint/performance/noAccumulatingSpread: <explanation>
		return { ...agg, [`${key}`]: ele.value };
	}, {});

/**
 * @typedef Validity
 * @property {forge.pki.rsa.PrivateKey} [privateKey]
 * @property {Date} notBefore
 * @property {Date} notAfter
 */

/**
 * @param {{clientValidity: Validity; intermediateValidity: Validity; rootValidity: Validity}} params
 */
export const createCertificateChain = ({
	clientValidity,
	intermediateValidity,
	rootValidity,
}) => {
	const {
		pki: { certificateFromPem },
	} = forge;
	const passphrase = "password";
	const { pemCertificate: rootPemCertificate, privateKey: rootPrivateKey } =
		createCertificate({
			subjectAttrs: rootCaAttrs,
			issuerAttrs: rootCaAttrs,
			serialNumber: "01",
			selfSignedCertificate: true,
			password: passphrase,
			...rootValidity,
		});
	const {
		pemCertificate: intermediatePemCertificate,
		privateKey: intermediatePrivateKey,
	} = createCertificate({
		subjectAttrs: intermediateCaAttrs,
		issuerAttrs: rootCaAttrs,
		serialNumber: "02",
		password: passphrase,
		...intermediateValidity,
		privateKey: rootPrivateKey,
	});
	const { pemCertificate: clientPemCertificate } = createCertificate({
		subjectAttrs: clientAttrs,
		issuerAttrs: intermediateCaAttrs,
		serialNumber: "03",
		password: passphrase,
		...clientValidity,
		privateKey: intermediatePrivateKey,
	});
	return [
		certificateFromPem(intermediatePemCertificate),
		certificateFromPem(clientPemCertificate),
		certificateFromPem(rootPemCertificate),
	];
};
