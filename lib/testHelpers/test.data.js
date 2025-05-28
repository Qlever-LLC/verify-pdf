const attrs = {
	rootCaAttrs: [
		{
			name: "commonName",
			value: "root-ca.com",
		},
		{
			name: "countryName",
			value: "US",
		},
		{
			shortName: "ST",
			value: "Virginia",
		},
		{
			name: "localityName",
			value: "Blacksburg",
		},
		{
			name: "organizationName",
			value: "Test",
		},
		{
			shortName: "OU",
			value: "Test",
		},
	],
	intermediateCaAttrs: [
		{
			name: "commonName",
			value: "intermediate-ca.com",
		},
		{
			name: "countryName",
			value: "US",
		},
		{
			shortName: "ST",
			value: "Virginia",
		},
		{
			name: "localityName",
			value: "Blacksburg",
		},
		{
			name: "organizationName",
			value: "Test",
		},
		{
			shortName: "OU",
			value: "Test",
		},
	],
	clientAttrs: [
		{
			name: "commonName",
			value: "client-ca.com",
		},
		{
			name: "countryName",
			value: "US",
		},
		{
			shortName: "ST",
			value: "Virginia",
		},
		{
			name: "localityName",
			value: "Blacksburg",
		},
		{
			name: "organizationName",
			value: "Test",
		},
		{
			shortName: "OU",
			value: "Test",
		},
	],
};

/**
 * @typedef PDFSample
 * @property {number} [totalSignatures]
 * @property {boolean} [verified]
 * @property {boolean} [integrity]
 * @property {boolean} [authenticity]
 * @property {boolean} [expired]
 * @property {boolean} [notSupported]
 */

/**
 * @type {Record<string, PDFSample>}
 */
const pdfSamples = {
	"samplecertifiedpdf.pdf": {
		verified: false,
		integrity: true,
		authenticity: false,
		expired: true,
	},
	"pdf_digital_signature_timestamp.pdf": {
		verified: false,
		integrity: true,
		authenticity: false,
		expired: true,
	},
	"25-certificado-firmado.pdf": {
		verified: false,
		integrity: true,
		authenticity: false,
		expired: true,
	},
	"blank_signed.pdf": {
		verified: false,
		integrity: true,
		authenticity: false,
		expired: true,
	},
	"signed-twice.pdf": {
		totalSignatures: 2,
		verified: false,
		authenticity: false,
		integrity: true,
		expired: true,
	},
	"signed-three-times.pdf": {
		totalSignatures: 3,
		verified: false,
		authenticity: false,
		integrity: true,
		expired: false,
	},
	"sample01.notSupported.pdf": {
		notSupported: true,
	},
};

const sampleDates = {
	futureDate: new Date(`${new Date().getFullYear() + 1}`),
	oldDate: new Date(`${new Date().getFullYear() - 1}`),
};

const validitySamples = {
	expiredNotBefore: {
		notBefore: sampleDates.futureDate,
		notAfter: sampleDates.futureDate,
	},
	expiredNotAfter: {
		notBefore: sampleDates.oldDate,
		notAfter: sampleDates.oldDate,
	},
	validDates: {
		notBefore: sampleDates.oldDate,
		notAfter: sampleDates.futureDate,
	},
};

export { attrs, pdfSamples, validitySamples };
