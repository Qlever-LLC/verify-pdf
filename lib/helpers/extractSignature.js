import { Buffer } from "node:buffer";

import { VerifyPDFError } from "../VerifyPDFError.js";
import { getSignatureMeta, preparePDF } from "./general.js";

const DEFAULT_BYTE_RANGE_PLACEHOLDER = "**********";

/**
 * @param {Uint8Array} pdfBuffer
 */
const getByteRange = (pdfBuffer) => {
	const byteRangeStrings = pdfBuffer
		.toString()
		.match(
			/\/ByteRange\s*\[{1}\s*(?:(?:\d*|\/\*{10})\s+){3}(?:\d+|\/\*{10}){1}\s*\]{1}/g,
		);
	if (!byteRangeStrings) {
		throw new VerifyPDFError(
			"Failed to locate ByteRange.",
			VerifyPDFError.Type.TYPE_PARSE,
		);
	}

	const byteRangePlaceholder = byteRangeStrings.find((s) =>
		s.includes(`/${DEFAULT_BYTE_RANGE_PLACEHOLDER}`),
	);
	const strByteRanges = byteRangeStrings.map(
		(brs) => brs.match(/[^[\s]*(?:\d|\/\*{10})/g) ?? [],
	);

	/**
	 * @type {[number, number, number, number][]}
	 */
	// @ts-expect-error IDK
	const byteRanges = strByteRanges.map((n) => n.map(Number));

	return {
		byteRangePlaceholder,
		byteRanges,
	};
};

/**
 * @param {Uint8Array} pdf
 */
const extractSignature = (pdf) => {
	const pdfBuffer = preparePDF(pdf);

	const { byteRanges } = getByteRange(pdfBuffer);
	const byteRange = byteRanges.at(-1) ?? [0, 0, 0, 0];
	const endOfByteRange = byteRange[2] + byteRange[3];

	if (pdfBuffer.length > endOfByteRange) {
		throw new VerifyPDFError(
			"Failed byte range verification.",
			VerifyPDFError.Type.TYPE_BYTE_RANGE,
		);
	}

	/**
	 * @type {string[]}
	 */
	const signatureStr = [];
	/**
	 * @type {Uint8Array[]}
	 */
	const signedData = [];
	for (const byteRange of byteRanges) {
		signedData.push(
			Buffer.concat([
				pdfBuffer.subarray(byteRange[0], byteRange[0] + byteRange[1]),
				pdfBuffer.subarray(byteRange[2], byteRange[2] + byteRange[3]),
			]),
		);

		const signatureHex = pdfBuffer
			.subarray(byteRange[0] + byteRange[1] + 1, byteRange[2])
			.toString("latin1");
		signatureStr.push(Buffer.from(signatureHex, "hex").toString("latin1"));
	}

	const signatureMeta = signedData.map((sd) => getSignatureMeta(sd));

	return {
		byteRanges,
		signatureStr,
		signedData,
		signatureMeta,
	};
};

export default extractSignature;
