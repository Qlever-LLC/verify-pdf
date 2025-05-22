export class VerifyPDFError extends Error {
	/**
	 * Enum for VerifyPDFError types
	 * @readonly
	 * @enum {string}
	 */
	static Type = {
		TYPE_UNKNOWN: "TYPE_UNKNOWN",
		TYPE_INPUT: "TYPE_INPUT",
		TYPE_PARSE: "TYPE_PARSE",
		TYPE_BYTE_RANGE: "TYPE_BYTE_RANGE",
		VERIFY_SIGNATURE: "VERIFY_SIGNATURE",
		UNSUPPORTED_SUBFILTER: "UNSUPPORTED_SUBFILTER",
	};

	/**
	 * @param {string} msg
	 * @param {Type} type
	 */
	constructor(msg, type = VerifyPDFError.Type.TYPE_UNKNOWN) {
		super(msg);
		this.type = type;
	}
}

export default VerifyPDFError;
