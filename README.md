# verify-pdf

Verify pdf files in JavaScript (supports both node.js & browser).

## Verifying PDF signature

The signed PDF file has the public certificate embedded in it, so all we need to
verify a PDF file is the file itself.

## Installation

```sh
npm i @qlever-llc/verify-pdf
```

## Importing

```typescript
// CommonJS require
const verifyPDF = require("@qlever-llc/verify-pdf");

// ES6 imports
import verifyPDF from "@qlever-llc/verify-pdf";
```

## Verifying

Verify the digital signature of the PDF and extract the certificate details

### Node.js

```typescript
import { verifyPDF } from "@qlever-llc/verify-pdf";
const signedPdfBuffer = await fs.readFile("yourPdf");

const { verified, authenticity, integrity, expired, signatures } = verifyPDF(
  signedPdfBuffer,
);
```

### Browser

```typescript
import { verifyPDF } from "@qlever-llc/verify-pdf";

const readFile = (e) => {
  const file = e.target.files[0];
  let reader = new FileReader();
  reader.onload = function (e) {
    const { verified } = verifyPDF(reader.result);
  };
  reader.readAsArrayBuffer(file);
};
```

- `signedPdfBuffer`: signed PDF as buffer.
- `verified`: The overall status of verification process.
- `authenticity`: Indicates if the validity of the certificate chain and the
  root CA (overall in case of multiple signatures).
- `integrity`: Indicates if the pdf has been tampered with or not (overall in
  case of multiple signatures).
- `expired`: Indicates if any of the certificates has expired.
- `signatures`: Array that contains the certificate details and `signatureMeta`
  (Reason, ContactInfo, Location and Name) for each signature.

## Certificates

You can get the details of the certificate chain by using the following api.

```typescript
const { getCertificatesInfoFromPDF } = require("@qlever-llc/verify-pdf"); // require

import { getCertificatesInfoFromPDF } from "@qlever-llc/verify-pdf"; // ES6
```

```typescript
const certs = getCertificatesInfoFromPDF(signedPdfBuffer);
```

- `signedPdfBuffer`: signed PDF as buffer.

- certs:

  - `issuedBy`: The issuer of the certificate.
  - `issuedTo`: The owner of the certificate.
  - `validityPeriod`: The start and end date of the certificate.
  - `pemCertificate`: Certificate in PEM format.
  - `clientCertificate`: true for the client certificate.

## Dependencies

[node-forge](https://github.com/digitalbazaar/forge) is used for working with
signatures.

## Credits

- The process of signing and verifying a document is described in the
  [Digital Signatures in PDF](https://www.adobe.com/devnet-docs/acrobatetk/tools/DigSigDC/Acrobat_DigitalSignatures_in_PDF.pdf)
  document.
- This incredible
  [Stack Overflow answer](https://stackoverflow.com/questions/15969733/verify-pkcs7-pem-signature-unpack-data-in-node-js/16148331#16148331)
  for describing the whole process of verifying PKCS7 signatures.
