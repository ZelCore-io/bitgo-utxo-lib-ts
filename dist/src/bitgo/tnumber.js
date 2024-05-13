"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTNumber = void 0;
/**
 * Convert input to bigint or number.
 * Throws error if input cannot be converted to a safe integer number.
 * @param value - input value
 * @param amountType - desired output type
 * @return value converted to amountType
 */
function toTNumber(value, amountType) {
    if (typeof value === amountType) {
        return value;
    }
    if (value === undefined) {
        throw new Error('input value cannot be undefined');
    }
    if (amountType === 'number') {
        const numberValue = Number(value);
        if (!Number.isSafeInteger(numberValue)) {
            throw new Error('input value cannot be converted to safe integer number');
        }
        return Number(value);
    }
    if (amountType === 'bigint') {
        return BigInt(value);
    }
    throw new Error('amountType must be either "number" or "bigint"');
}
exports.toTNumber = toTNumber;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG51bWJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaXRnby90bnVtYmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7Ozs7R0FNRztBQUNILFNBQWdCLFNBQVMsQ0FDdkIsS0FBK0IsRUFDL0IsVUFBK0I7SUFFL0IsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVLEVBQUU7UUFDL0IsT0FBTyxLQUFnQixDQUFDO0tBQ3pCO0lBQ0QsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztLQUNwRDtJQUNELElBQUksVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUMzQixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1NBQzNFO1FBQ0QsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFZLENBQUM7S0FDakM7SUFDRCxJQUFJLFVBQVUsS0FBSyxRQUFRLEVBQUU7UUFDM0IsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFZLENBQUM7S0FDakM7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQXJCRCw4QkFxQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29udmVydCBpbnB1dCB0byBiaWdpbnQgb3IgbnVtYmVyLlxyXG4gKiBUaHJvd3MgZXJyb3IgaWYgaW5wdXQgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBhIHNhZmUgaW50ZWdlciBudW1iZXIuXHJcbiAqIEBwYXJhbSB2YWx1ZSAtIGlucHV0IHZhbHVlXHJcbiAqIEBwYXJhbSBhbW91bnRUeXBlIC0gZGVzaXJlZCBvdXRwdXQgdHlwZVxyXG4gKiBAcmV0dXJuIHZhbHVlIGNvbnZlcnRlZCB0byBhbW91bnRUeXBlXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9UTnVtYmVyPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHZhbHVlOiBudW1iZXIgfCBiaWdpbnQgfCBzdHJpbmcsXHJcbiAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50J1xyXG4pOiBUTnVtYmVyIHtcclxuICBpZiAodHlwZW9mIHZhbHVlID09PSBhbW91bnRUeXBlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgYXMgVE51bWJlcjtcclxuICB9XHJcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignaW5wdXQgdmFsdWUgY2Fubm90IGJlIHVuZGVmaW5lZCcpO1xyXG4gIH1cclxuICBpZiAoYW1vdW50VHlwZSA9PT0gJ251bWJlcicpIHtcclxuICAgIGNvbnN0IG51bWJlclZhbHVlID0gTnVtYmVyKHZhbHVlKTtcclxuICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobnVtYmVyVmFsdWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW5wdXQgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBzYWZlIGludGVnZXIgbnVtYmVyJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTnVtYmVyKHZhbHVlKSBhcyBUTnVtYmVyO1xyXG4gIH1cclxuICBpZiAoYW1vdW50VHlwZSA9PT0gJ2JpZ2ludCcpIHtcclxuICAgIHJldHVybiBCaWdJbnQodmFsdWUpIGFzIFROdW1iZXI7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcignYW1vdW50VHlwZSBtdXN0IGJlIGVpdGhlciBcIm51bWJlclwiIG9yIFwiYmlnaW50XCInKTtcclxufVxyXG4iXX0=