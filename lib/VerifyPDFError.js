const TYPE_UNKNOWN = "TYPE_UNKNOWN";
const TYPE_INPUT = "TYPE_INPUT";
const TYPE_PARSE = "TYPE_PARSE";
const TYPE_BYTE_RANGE = "TYPE_BYTE_RANGE";
const VERIFY_SIGNATURE = "VERIFY_SIGNATURE";
const UNSUPPORTED_SUBFILTER = "UNSUPPORTED_SUBFILTER";

export class VerifyPDFError extends Error {
	constructor(msg, type = TYPE_UNKNOWN) {
		super(msg);
		this.type = type;
	}
}

// Shorthand
export {
	TYPE_UNKNOWN,
	TYPE_INPUT,
	TYPE_PARSE,
	TYPE_BYTE_RANGE,
	VERIFY_SIGNATURE,
	UNSUPPORTED_SUBFILTER,
};

export default VerifyPDFError;
