"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUnsafeNonSegwit = exports.isPsbt = exports.isPsbtInputFinalized = exports.getPsbtInputSignatureCount = exports.getPsbtInputProprietaryKeyVals = exports.ProprietaryKeySubtype = exports.PSBT_PROPRIETARY_IDENTIFIER = void 0;
const proprietaryKeyVal_1 = require("bip174/src/lib/proprietaryKeyVal");
/**
 * bitgo proprietary key identifier
 */
exports.PSBT_PROPRIETARY_IDENTIFIER = 'BITGO';
/**
 * subtype for proprietary keys that bitgo uses
 */
var ProprietaryKeySubtype;
(function (ProprietaryKeySubtype) {
    ProprietaryKeySubtype[ProprietaryKeySubtype["ZEC_CONSENSUS_BRANCH_ID"] = 0] = "ZEC_CONSENSUS_BRANCH_ID";
    ProprietaryKeySubtype[ProprietaryKeySubtype["MUSIG2_PARTICIPANT_PUB_KEYS"] = 1] = "MUSIG2_PARTICIPANT_PUB_KEYS";
    ProprietaryKeySubtype[ProprietaryKeySubtype["MUSIG2_PUB_NONCE"] = 2] = "MUSIG2_PUB_NONCE";
    ProprietaryKeySubtype[ProprietaryKeySubtype["MUSIG2_PARTIAL_SIG"] = 3] = "MUSIG2_PARTIAL_SIG";
})(ProprietaryKeySubtype = exports.ProprietaryKeySubtype || (exports.ProprietaryKeySubtype = {}));
/**
 * Search any data from psbt proprietary key value against keydata.
 * Default identifierEncoding is utf-8 for identifier.
 */
function getPsbtInputProprietaryKeyVals(input, keySearch) {
    var _a;
    if (!((_a = input.unknownKeyVals) === null || _a === void 0 ? void 0 : _a.length)) {
        return [];
    }
    if (keySearch && keySearch.subtype === undefined && Buffer.isBuffer(keySearch.keydata)) {
        throw new Error('invalid proprietary key search filter combination. subtype is required');
    }
    const keyVals = input.unknownKeyVals.map(({ key, value }, i) => {
        return { key: (0, proprietaryKeyVal_1.decodeProprietaryKey)(key), value };
    });
    return keyVals.filter((keyVal) => {
        return (keySearch === undefined ||
            (keySearch.identifier === keyVal.key.identifier &&
                (keySearch.subtype === undefined ||
                    (keySearch.subtype === keyVal.key.subtype &&
                        (!Buffer.isBuffer(keySearch.keydata) || keySearch.keydata.equals(keyVal.key.keydata))))));
    });
}
exports.getPsbtInputProprietaryKeyVals = getPsbtInputProprietaryKeyVals;
/**
 * @return partialSig/tapScriptSig/MUSIG2_PARTIAL_SIG count iff input is not finalized
 */
function getPsbtInputSignatureCount(input) {
    if (isPsbtInputFinalized(input)) {
        throw new Error('Input is already finalized');
    }
    return Math.max(Array.isArray(input.partialSig) ? input.partialSig.length : 0, Array.isArray(input.tapScriptSig) ? input.tapScriptSig.length : 0, getPsbtInputProprietaryKeyVals(input, {
        identifier: exports.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
    }).length);
}
exports.getPsbtInputSignatureCount = getPsbtInputSignatureCount;
/**
 * @return true iff PSBT input is finalized
 */
function isPsbtInputFinalized(input) {
    return Buffer.isBuffer(input.finalScriptSig) || Buffer.isBuffer(input.finalScriptWitness);
}
exports.isPsbtInputFinalized = isPsbtInputFinalized;
/**
 * @return true iff data starts with magic PSBT byte sequence
 * @param data byte array or hex string
 * */
function isPsbt(data) {
    // https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#specification
    // 0x70736274 - ASCII for 'psbt'. 0xff - separator
    if (typeof data === 'string') {
        if (data.length < 10) {
            return false;
        }
        data = Buffer.from(data.slice(0, 10), 'hex');
    }
    return 5 <= data.length && data.readUInt32BE(0) === 0x70736274 && data.readUInt8(4) === 0xff;
}
exports.isPsbt = isPsbt;
/**
 * This function allows signing or validating a psbt with non-segwit inputs those do not contain nonWitnessUtxo.
 */
function withUnsafeNonSegwit(psbt, fn, unsafe = true) {
    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = unsafe;
    psbt.__CACHE.__WARN_UNSAFE_SIGN_NONSEGWIT = !unsafe;
    try {
        return fn();
    }
    finally {
        psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
        psbt.__CACHE.__WARN_UNSAFE_SIGN_NONSEGWIT = true;
    }
}
exports.withUnsafeNonSegwit = withUnsafeNonSegwit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHNidFV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vUHNidFV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0VBQXdGO0FBSXhGOztHQUVHO0FBQ1UsUUFBQSwyQkFBMkIsR0FBRyxPQUFPLENBQUM7QUFFbkQ7O0dBRUc7QUFDSCxJQUFZLHFCQUtYO0FBTEQsV0FBWSxxQkFBcUI7SUFDL0IsdUdBQThCLENBQUE7SUFDOUIsK0dBQWtDLENBQUE7SUFDbEMseUZBQXVCLENBQUE7SUFDdkIsNkZBQXlCLENBQUE7QUFDM0IsQ0FBQyxFQUxXLHFCQUFxQixHQUFyQiw2QkFBcUIsS0FBckIsNkJBQXFCLFFBS2hDO0FBdUJEOzs7R0FHRztBQUNILFNBQWdCLDhCQUE4QixDQUM1QyxLQUFnQixFQUNoQixTQUFnQzs7SUFFaEMsSUFBSSxDQUFDLENBQUEsTUFBQSxLQUFLLENBQUMsY0FBYywwQ0FBRSxNQUFNLENBQUEsRUFBRTtRQUNqQyxPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE9BQU8sS0FBSyxTQUFTLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDdEYsTUFBTSxJQUFJLEtBQUssQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO0tBQzNGO0lBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM3RCxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUEsd0NBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDbkQsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUMvQixPQUFPLENBQ0wsU0FB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OlsiaW1wb3J0IHsgZGVjb2RlUHJvcHJpZXRhcnlLZXksIFByb3ByaWV0YXJ5S2V5IH0gZnJvbSAnYmlwMTc0L3NyYy9saWIvcHJvcHJpZXRhcnlLZXlWYWwnO1xyXG5pbXBvcnQgeyBQc2J0SW5wdXQgfSBmcm9tICdiaXAxNzQvc3JjL2xpYi9pbnRlcmZhY2VzJztcclxuaW1wb3J0IHsgUHNidCB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3BzYnQnO1xyXG5cclxuLyoqXHJcbiAqIGJpdGdvIHByb3ByaWV0YXJ5IGtleSBpZGVudGlmaWVyXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSID0gJ0JJVEdPJztcclxuXHJcbi8qKlxyXG4gKiBzdWJ0eXBlIGZvciBwcm9wcmlldGFyeSBrZXlzIHRoYXQgYml0Z28gdXNlc1xyXG4gKi9cclxuZXhwb3J0IGVudW0gUHJvcHJpZXRhcnlLZXlTdWJ0eXBlIHtcclxuICBaRUNfQ09OU0VOU1VTX0JSQU5DSF9JRCA9IDB4MDAsXHJcbiAgTVVTSUcyX1BBUlRJQ0lQQU5UX1BVQl9LRVlTID0gMHgwMSxcclxuICBNVVNJRzJfUFVCX05PTkNFID0gMHgwMixcclxuICBNVVNJRzJfUEFSVElBTF9TSUcgPSAweDAzLFxyXG59XHJcblxyXG4vKipcclxuICogUHNidCBwcm9wcmlldGFyeSBrZXlkYXRhIG9iamVjdC5cclxuICogPGNvbXBhY3Qgc2l6ZSB1aW50IGlkZW50aWZpZXIgbGVuZ3RoPiA8Ynl0ZXMgaWRlbnRpZmllcj4gPGNvbXBhY3Qgc2l6ZSB1aW50IHN1YnR5cGU+IDxieXRlcyBzdWJrZXlkYXRhPlxyXG4gKiA9PiA8Ynl0ZXMgdmFsdWVkYXRhPlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBQcm9wcmlldGFyeUtleVZhbHVlIHtcclxuICBrZXk6IFByb3ByaWV0YXJ5S2V5O1xyXG4gIHZhbHVlOiBCdWZmZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQc2J0IHByb3ByaWV0YXJ5IGtleWRhdGEgb2JqZWN0IHNlYXJjaCBmaWVsZHMuXHJcbiAqIDxjb21wYWN0IHNpemUgdWludCBpZGVudGlmaWVyIGxlbmd0aD4gPGJ5dGVzIGlkZW50aWZpZXI+IDxjb21wYWN0IHNpemUgdWludCBzdWJ0eXBlPiA8Ynl0ZXMgc3Via2V5ZGF0YT5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHJvcHJpZXRhcnlLZXlTZWFyY2gge1xyXG4gIGlkZW50aWZpZXI6IHN0cmluZztcclxuICBzdWJ0eXBlPzogbnVtYmVyO1xyXG4gIGtleWRhdGE/OiBCdWZmZXI7XHJcbiAgaWRlbnRpZmllckVuY29kaW5nPzogQnVmZmVyRW5jb2Rpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZWFyY2ggYW55IGRhdGEgZnJvbSBwc2J0IHByb3ByaWV0YXJ5IGtleSB2YWx1ZSBhZ2FpbnN0IGtleWRhdGEuXHJcbiAqIERlZmF1bHQgaWRlbnRpZmllckVuY29kaW5nIGlzIHV0Zi04IGZvciBpZGVudGlmaWVyLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBzYnRJbnB1dFByb3ByaWV0YXJ5S2V5VmFscyhcclxuICBpbnB1dDogUHNidElucHV0LFxyXG4gIGtleVNlYXJjaD86IFByb3ByaWV0YXJ5S2V5U2VhcmNoXHJcbik6IFByb3ByaWV0YXJ5S2V5VmFsdWVbXSB7XHJcbiAgaWYgKCFpbnB1dC51bmtub3duS2V5VmFscz8ubGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIGlmIChrZXlTZWFyY2ggJiYga2V5U2VhcmNoLnN1YnR5cGUgPT09IHVuZGVmaW5lZCAmJiBCdWZmZXIuaXNCdWZmZXIoa2V5U2VhcmNoLmtleWRhdGEpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcHJvcHJpZXRhcnkga2V5IHNlYXJjaCBmaWx0ZXIgY29tYmluYXRpb24uIHN1YnR5cGUgaXMgcmVxdWlyZWQnKTtcclxuICB9XHJcbiAgY29uc3Qga2V5VmFscyA9IGlucHV0LnVua25vd25LZXlWYWxzLm1hcCgoeyBrZXksIHZhbHVlIH0sIGkpID0+IHtcclxuICAgIHJldHVybiB7IGtleTogZGVjb2RlUHJvcHJpZXRhcnlLZXkoa2V5KSwgdmFsdWUgfTtcclxuICB9KTtcclxuICByZXR1cm4ga2V5VmFscy5maWx0ZXIoKGtleVZhbCkgPT4ge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAga2V5U2VhcmNoID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgKGtleVNlYXJjaC5pZGVudGlmaWVyID09PSBrZXlWYWwua2V5LmlkZW50aWZpZXIgJiZcclxuICAgICAgICAoa2V5U2VhcmNoLnN1YnR5cGUgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgICAgKGtleVNlYXJjaC5zdWJ0eXBlID09PSBrZXlWYWwua2V5LnN1YnR5cGUgJiZcclxuICAgICAgICAgICAgKCFCdWZmZXIuaXNCdWZmZXIoa2V5U2VhcmNoLmtleWRhdGEpIHx8IGtleVNlYXJjaC5rZXlkYXRhLmVxdWFscyhrZXlWYWwua2V5LmtleWRhdGEpKSkpKVxyXG4gICAgKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm4gcGFydGlhbFNpZy90YXBTY3JpcHRTaWcvTVVTSUcyX1BBUlRJQUxfU0lHIGNvdW50IGlmZiBpbnB1dCBpcyBub3QgZmluYWxpemVkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHNidElucHV0U2lnbmF0dXJlQ291bnQoaW5wdXQ6IFBzYnRJbnB1dCk6IG51bWJlciB7XHJcbiAgaWYgKGlzUHNidElucHV0RmluYWxpemVkKGlucHV0KSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnB1dCBpcyBhbHJlYWR5IGZpbmFsaXplZCcpO1xyXG4gIH1cclxuICByZXR1cm4gTWF0aC5tYXgoXHJcbiAgICBBcnJheS5pc0FycmF5KGlucHV0LnBhcnRpYWxTaWcpID8gaW5wdXQucGFydGlhbFNpZy5sZW5ndGggOiAwLFxyXG4gICAgQXJyYXkuaXNBcnJheShpbnB1dC50YXBTY3JpcHRTaWcpID8gaW5wdXQudGFwU2NyaXB0U2lnLmxlbmd0aCA6IDAsXHJcbiAgICBnZXRQc2J0SW5wdXRQcm9wcmlldGFyeUtleVZhbHMoaW5wdXQsIHtcclxuICAgICAgaWRlbnRpZmllcjogUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSLFxyXG4gICAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BBUlRJQUxfU0lHLFxyXG4gICAgfSkubGVuZ3RoXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm4gdHJ1ZSBpZmYgUFNCVCBpbnB1dCBpcyBmaW5hbGl6ZWRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1BzYnRJbnB1dEZpbmFsaXplZChpbnB1dDogUHNidElucHV0KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcihpbnB1dC5maW5hbFNjcmlwdFNpZykgfHwgQnVmZmVyLmlzQnVmZmVyKGlucHV0LmZpbmFsU2NyaXB0V2l0bmVzcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIHRydWUgaWZmIGRhdGEgc3RhcnRzIHdpdGggbWFnaWMgUFNCVCBieXRlIHNlcXVlbmNlXHJcbiAqIEBwYXJhbSBkYXRhIGJ5dGUgYXJyYXkgb3IgaGV4IHN0cmluZ1xyXG4gKiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNQc2J0KGRhdGE6IEJ1ZmZlciB8IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpcHMvYmxvYi9tYXN0ZXIvYmlwLTAxNzQubWVkaWF3aWtpI3NwZWNpZmljYXRpb25cclxuICAvLyAweDcwNzM2Mjc0IC0gQVNDSUkgZm9yICdwc2J0Jy4gMHhmZiAtIHNlcGFyYXRvclxyXG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcclxuICAgIGlmIChkYXRhLmxlbmd0aCA8IDEwKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGRhdGEgPSBCdWZmZXIuZnJvbShkYXRhLnNsaWNlKDAsIDEwKSwgJ2hleCcpO1xyXG4gIH1cclxuICByZXR1cm4gNSA8PSBkYXRhLmxlbmd0aCAmJiBkYXRhLnJlYWRVSW50MzJCRSgwKSA9PT0gMHg3MDczNjI3NCAmJiBkYXRhLnJlYWRVSW50OCg0KSA9PT0gMHhmZjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHNpZ25pbmcgb3IgdmFsaWRhdGluZyBhIHBzYnQgd2l0aCBub24tc2Vnd2l0IGlucHV0cyB0aG9zZSBkbyBub3QgY29udGFpbiBub25XaXRuZXNzVXR4by5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB3aXRoVW5zYWZlTm9uU2Vnd2l0PFQ+KHBzYnQ6IFBzYnQsIGZuOiAoKSA9PiBULCB1bnNhZmUgPSB0cnVlKTogVCB7XHJcbiAgKHBzYnQgYXMgYW55KS5fX0NBQ0hFLl9fVU5TQUZFX1NJR05fTk9OU0VHV0lUID0gdW5zYWZlO1xyXG4gIChwc2J0IGFzIGFueSkuX19DQUNIRS5fX1dBUk5fVU5TQUZFX1NJR05fTk9OU0VHV0lUID0gIXVuc2FmZTtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGZuKCk7XHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIChwc2J0IGFzIGFueSkuX19DQUNIRS5fX1VOU0FGRV9TSUdOX05PTlNFR1dJVCA9IGZhbHNlO1xyXG4gICAgKHBzYnQgYXMgYW55KS5fX0NBQ0hFLl9fV0FSTl9VTlNBRkVfU0lHTl9OT05TRUdXSVQgPSB0cnVlO1xyXG4gIH1cclxufVxyXG4iXX0=