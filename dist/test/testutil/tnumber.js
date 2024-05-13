"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalCoinsToSats = void 0;
/**
 * Multiply a decimal amount by 1e8 to convert from coins to sats
 * (optionally to a bigint converting to bigint)
 *
 * This function really shouldn't exist, but is used by some test code. At some
 * point we should fix those functions to use strings or integers only to
 * represent monetary values.
 *
 * Throws error if resulting value is not a safe integer number
 *
 * @param value - decimal amount of coins
 * @param amountType - desired output type
 * @return value * 1e8, as amountType
 */
function decimalCoinsToSats(value, amountType = 'number') {
    if (amountType === 'number') {
        const scaledValue = value * 1e8;
        if (!Number.isSafeInteger(scaledValue)) {
            throw new Error('input value cannot be scaled to safe integer number');
        }
        return scaledValue;
    }
    else {
        const [integerString, decimalString] = value.toFixed(8).split('.');
        return (BigInt(integerString) * BigInt(1e8) + BigInt(decimalString));
    }
}
exports.decimalCoinsToSats = decimalCoinsToSats;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG51bWJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvdGVzdHV0aWwvdG51bWJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsU0FBZ0Isa0JBQWtCLENBQ2hDLEtBQWEsRUFDYixhQUFrQyxRQUFRO0lBRTFDLElBQUksVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUMzQixNQUFNLFdBQVcsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQztTQUN4RTtRQUNELE9BQU8sV0FBc0IsQ0FBQztLQUMvQjtTQUFNO1FBQ0wsTUFBTSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQVksQ0FBQztLQUNqRjtBQUNILENBQUM7QUFkRCxnREFjQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBNdWx0aXBseSBhIGRlY2ltYWwgYW1vdW50IGJ5IDFlOCB0byBjb252ZXJ0IGZyb20gY29pbnMgdG8gc2F0c1xyXG4gKiAob3B0aW9uYWxseSB0byBhIGJpZ2ludCBjb252ZXJ0aW5nIHRvIGJpZ2ludClcclxuICpcclxuICogVGhpcyBmdW5jdGlvbiByZWFsbHkgc2hvdWxkbid0IGV4aXN0LCBidXQgaXMgdXNlZCBieSBzb21lIHRlc3QgY29kZS4gQXQgc29tZVxyXG4gKiBwb2ludCB3ZSBzaG91bGQgZml4IHRob3NlIGZ1bmN0aW9ucyB0byB1c2Ugc3RyaW5ncyBvciBpbnRlZ2VycyBvbmx5IHRvXHJcbiAqIHJlcHJlc2VudCBtb25ldGFyeSB2YWx1ZXMuXHJcbiAqXHJcbiAqIFRocm93cyBlcnJvciBpZiByZXN1bHRpbmcgdmFsdWUgaXMgbm90IGEgc2FmZSBpbnRlZ2VyIG51bWJlclxyXG4gKlxyXG4gKiBAcGFyYW0gdmFsdWUgLSBkZWNpbWFsIGFtb3VudCBvZiBjb2luc1xyXG4gKiBAcGFyYW0gYW1vdW50VHlwZSAtIGRlc2lyZWQgb3V0cHV0IHR5cGVcclxuICogQHJldHVybiB2YWx1ZSAqIDFlOCwgYXMgYW1vdW50VHlwZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRlY2ltYWxDb2luc1RvU2F0czxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB2YWx1ZTogbnVtYmVyLFxyXG4gIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCcgPSAnbnVtYmVyJ1xyXG4pOiBUTnVtYmVyIHtcclxuICBpZiAoYW1vdW50VHlwZSA9PT0gJ251bWJlcicpIHtcclxuICAgIGNvbnN0IHNjYWxlZFZhbHVlID0gdmFsdWUgKiAxZTg7XHJcbiAgICBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKHNjYWxlZFZhbHVlKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2lucHV0IHZhbHVlIGNhbm5vdCBiZSBzY2FsZWQgdG8gc2FmZSBpbnRlZ2VyIG51bWJlcicpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNjYWxlZFZhbHVlIGFzIFROdW1iZXI7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IFtpbnRlZ2VyU3RyaW5nLCBkZWNpbWFsU3RyaW5nXSA9IHZhbHVlLnRvRml4ZWQoOCkuc3BsaXQoJy4nKTtcclxuICAgIHJldHVybiAoQmlnSW50KGludGVnZXJTdHJpbmcpICogQmlnSW50KDFlOCkgKyBCaWdJbnQoZGVjaW1hbFN0cmluZykpIGFzIFROdW1iZXI7XHJcbiAgfVxyXG59XHJcbiJdfQ==