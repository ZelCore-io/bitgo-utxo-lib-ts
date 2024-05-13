"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unspentSum = exports.addToTransactionBuilder = exports.toPrevOutputWithPrevTx = exports.toPrevOutput = exports.getOutputIdForInput = exports.formatOutputId = exports.parseOutputId = exports.fromOutputWithPrevTx = exports.fromOutput = exports.toOutput = exports.isUnspentWithPrevTx = void 0;
const address_1 = require("../address");
function isUnspentWithPrevTx(u) {
    return Buffer.isBuffer(u.prevTx);
}
exports.isUnspentWithPrevTx = isUnspentWithPrevTx;
/**
 * @return TxOutput from Unspent
 */
function toOutput(u, network) {
    return {
        script: (0, address_1.toOutputScript)(u.address, network),
        value: u.value,
    };
}
exports.toOutput = toOutput;
/**
 * @return Unspent from TxOutput
 */
function fromOutput(tx, vout) {
    const o = tx.outs[vout];
    if (!o) {
        throw new Error(`invalid vout`);
    }
    return {
        id: formatOutputId({ txid: tx.getId(), vout }),
        address: (0, address_1.fromOutputScript)(o.script, tx.network),
        value: o.value,
    };
}
exports.fromOutput = fromOutput;
function fromOutputWithPrevTx(tx, vout) {
    return {
        ...fromOutput(tx, vout),
        prevTx: tx.toBuffer(),
    };
}
exports.fromOutputWithPrevTx = fromOutputWithPrevTx;
/**
 * @param outputId
 * @return TxOutPoint
 */
function parseOutputId(outputId) {
    const parts = outputId.split(':');
    if (parts.length !== 2) {
        throw new Error(`invalid outputId, must have format txid:vout`);
    }
    const [txid, voutStr] = parts;
    const vout = Number(voutStr);
    if (txid.length !== 64) {
        throw new Error(`invalid txid ${txid} ${txid.length}`);
    }
    if (Number.isNaN(vout) || vout < 0 || !Number.isSafeInteger(vout)) {
        throw new Error(`invalid vout: must be integer >= 0`);
    }
    return { txid, vout };
}
exports.parseOutputId = parseOutputId;
/**
 * @param txid
 * @param vout
 * @return outputId
 */
function formatOutputId({ txid, vout }) {
    return `${txid}:${vout}`;
}
exports.formatOutputId = formatOutputId;
function getOutputIdForInput(i) {
    return {
        txid: Buffer.from(i.hash).reverse().toString('hex'),
        vout: i.index,
    };
}
exports.getOutputIdForInput = getOutputIdForInput;
/**
 * @return PrevOutput from Unspent
 */
function toPrevOutput(u, network) {
    return {
        ...parseOutputId(u.id),
        ...toOutput(u, network),
    };
}
exports.toPrevOutput = toPrevOutput;
/**
 * @return PrevOutput with prevTx from Unspent
 */
function toPrevOutputWithPrevTx(u, network) {
    let prevTx;
    if (typeof u.prevTx === 'string') {
        prevTx = Buffer.from(u.prevTx, 'hex');
    }
    else if (Buffer.isBuffer(u.prevTx)) {
        prevTx = u.prevTx;
    }
    else if (u.prevTx !== undefined) {
        throw new Error(`Invalid prevTx type for unspent ${u.prevTx}`);
    }
    return {
        ...parseOutputId(u.id),
        ...toOutput(u, network),
        prevTx,
    };
}
exports.toPrevOutputWithPrevTx = toPrevOutputWithPrevTx;
/**
 * @param txb
 * @param u
 * @param sequence - sequenceId
 */
function addToTransactionBuilder(txb, u, sequence) {
    const { txid, vout, script, value } = toPrevOutput(u, txb.network);
    txb.addInput(txid, vout, sequence, script, value);
}
exports.addToTransactionBuilder = addToTransactionBuilder;
/**
 * Sum the values of the unspents.
 * Throws error if sum is not a safe integer value, or if unspent amount types do not match `amountType`
 * @param unspents - array of unspents to sum
 * @param amountType - expected value type of unspents
 * @return unspentSum - type matches amountType
 */
function unspentSum(unspents, amountType = 'number') {
    if (amountType === 'bigint') {
        return unspents.reduce((sum, u) => sum + u.value, BigInt(0));
    }
    else {
        const sum = unspents.reduce((sum, u) => sum + u.value, Number(0));
        if (!Number.isSafeInteger(sum)) {
            throw new Error('unspent sum is not a safe integer number, consider using bigint');
        }
        return sum;
    }
}
exports.unspentSum = unspentSum;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVW5zcGVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaXRnby9VbnNwZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHdDQUE4RDtBQTRCOUQsU0FBZ0IsbUJBQW1CLENBQ2pDLENBQW1CO0lBRW5CLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBRSxDQUFnQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25FLENBQUM7QUFKRCxrREFJQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFrQyxDQUFtQixFQUFFLE9BQWdCO0lBQzdGLE9BQU87UUFDTCxNQUFNLEVBQUUsSUFBQSx3QkFBYyxFQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQzFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSztLQUNmLENBQUM7QUFDSixDQUFDO0FBTEQsNEJBS0M7QUFFRDs7R0FFRztBQUNILFNBQWdCLFVBQVUsQ0FDeEIsRUFBNEIsRUFDNUIsSUFBWTtJQUVaLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDakM7SUFDRCxPQUFPO1FBQ0wsRUFBRSxFQUFFLGNBQWMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDOUMsT0FBTyxFQUFFLElBQUEsMEJBQWdCLEVBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQy9DLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSztLQUNmLENBQUM7QUFDSixDQUFDO0FBYkQsZ0NBYUM7QUFFRCxTQUFnQixvQkFBb0IsQ0FDbEMsRUFBNEIsRUFDNUIsSUFBWTtJQUVaLE9BQU87UUFDTCxHQUFHLFVBQVUsQ0FBQyxF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aUI7SUFFakIsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLFlBQVksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQWtCLENBQUMsQ0FBQztJQUM5RSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBUEQsMERBT0M7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixVQUFVLENBQ3hCLFFBQThCLEVBQzlCLGFBQWtDLFFBQVE7SUFFMUMsSUFBSSxVQUFVLEtBQUssUUFBUSxFQUFFO1FBQzNCLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBSSxDQUFDLENBQUMsS0FBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQVksQ0FBQztLQUNyRjtTQUFNO1FBQ0wsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBSSxDQUFDLENBQUMsS0FBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7U0FDcEY7UUFDRCxPQUFPLEdBQWMsQ0FBQztLQUN2QjtBQUNILENBQUM7QUFiRCxnQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFR4T3V0cHV0IH0gZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcbmltcG9ydCB7IE5ldHdvcmsgfSBmcm9tICcuLic7XHJcbmltcG9ydCB7IGZyb21PdXRwdXRTY3JpcHQsIHRvT3V0cHV0U2NyaXB0IH0gZnJvbSAnLi4vYWRkcmVzcyc7XHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL1V0eG9UcmFuc2FjdGlvbkJ1aWxkZXInO1xyXG5pbXBvcnQgeyBVdHhvVHJhbnNhY3Rpb24gfSBmcm9tICcuL1V0eG9UcmFuc2FjdGlvbic7XHJcblxyXG4vKipcclxuICogUHVibGljIHVuc3BlbnQgZGF0YSBpbiBCaXRHby1zcGVjaWZpYyByZXByZXNlbnRhdGlvbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgVW5zcGVudDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiB7XHJcbiAgLyoqXHJcbiAgICogRm9ybWF0OiAke3R4aWR9OiR7dm91dH0uXHJcbiAgICogVXNlIGBwYXJzZU91dHB1dElkKGlkKWAgdG8gcGFyc2UuXHJcbiAgICovXHJcbiAgaWQ6IHN0cmluZztcclxuICAvKipcclxuICAgKiBUaGUgbmV0d29yay1zcGVjaWZpYyBlbmNvZGVkIGFkZHJlc3MuXHJcbiAgICogVXNlIGB0b091dHB1dFNjcmlwdChhZGRyZXNzLCBuZXR3b3JrKWAgdG8gb2J0YWluIHNjcmlwdFB1YktleS5cclxuICAgKi9cclxuICBhZGRyZXNzOiBzdHJpbmc7XHJcbiAgLyoqXHJcbiAgICogVGhlIGFtb3VudCBpbiBzYXRvc2hpLlxyXG4gICAqL1xyXG4gIHZhbHVlOiBUTnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFVuc3BlbnRXaXRoUHJldlR4PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+IGV4dGVuZHMgVW5zcGVudDxUTnVtYmVyPiB7XHJcbiAgcHJldlR4OiBCdWZmZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Vuc3BlbnRXaXRoUHJldlR4PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQsIFRVbnNwZW50IGV4dGVuZHMgVW5zcGVudDxUTnVtYmVyPj4oXHJcbiAgdTogVW5zcGVudDxUTnVtYmVyPlxyXG4pOiB1IGlzIFRVbnNwZW50ICYgeyBwcmV2VHg6IEJ1ZmZlciB9IHtcclxuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKCh1IGFzIFVuc3BlbnRXaXRoUHJldlR4PFROdW1iZXI+KS5wcmV2VHgpO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybiBUeE91dHB1dCBmcm9tIFVuc3BlbnRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0b091dHB1dDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50Pih1OiBVbnNwZW50PFROdW1iZXI+LCBuZXR3b3JrOiBOZXR3b3JrKTogVHhPdXRwdXQ8VE51bWJlcj4ge1xyXG4gIHJldHVybiB7XHJcbiAgICBzY3JpcHQ6IHRvT3V0cHV0U2NyaXB0KHUuYWRkcmVzcywgbmV0d29yayksXHJcbiAgICB2YWx1ZTogdS52YWx1ZSxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybiBVbnNwZW50IGZyb20gVHhPdXRwdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tT3V0cHV0PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4OiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgdm91dDogbnVtYmVyXHJcbik6IFVuc3BlbnQ8VE51bWJlcj4ge1xyXG4gIGNvbnN0IG8gPSB0eC5vdXRzW3ZvdXRdO1xyXG4gIGlmICghbykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHZvdXRgKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBmb3JtYXRPdXRwdXRJZCh7IHR4aWQ6IHR4LmdldElkKCksIHZvdXQgfSksXHJcbiAgICBhZGRyZXNzOiBmcm9tT3V0cHV0U2NyaXB0KG8uc2NyaXB0LCB0eC5uZXR3b3JrKSxcclxuICAgIHZhbHVlOiBvLnZhbHVlLFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tT3V0cHV0V2l0aFByZXZUeDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB0eDogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gIHZvdXQ6IG51bWJlclxyXG4pOiBVbnNwZW50V2l0aFByZXZUeDxUTnVtYmVyPiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIC4uLmZyb21PdXRwdXQodHgsIHZvdXQpLFxyXG4gICAgcHJldlR4OiB0eC50b0J1ZmZlcigpLFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gb3V0cHV0SWRcclxuICogQHJldHVybiBUeE91dFBvaW50XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPdXRwdXRJZChvdXRwdXRJZDogc3RyaW5nKTogVHhPdXRQb2ludCB7XHJcbiAgY29uc3QgcGFydHMgPSBvdXRwdXRJZC5zcGxpdCgnOicpO1xyXG4gIGlmIChwYXJ0cy5sZW5ndGggIT09IDIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBvdXRwdXRJZCwgbXVzdCBoYXZlIGZvcm1hdCB0eGlkOnZvdXRgKTtcclxuICB9XHJcbiAgY29uc3QgW3R4aWQsIHZvdXRTdHJdID0gcGFydHM7XHJcbiAgY29uc3Qgdm91dCA9IE51bWJlcih2b3V0U3RyKTtcclxuICBpZiAodHhpZC5sZW5ndGggIT09IDY0KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdHhpZCAke3R4aWR9ICR7dHhpZC5sZW5ndGh9YCk7XHJcbiAgfVxyXG4gIGlmIChOdW1iZXIuaXNOYU4odm91dCkgfHwgdm91dCA8IDAgfHwgIU51bWJlci5pc1NhZmVJbnRlZ2VyKHZvdXQpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdm91dDogbXVzdCBiZSBpbnRlZ2VyID49IDBgKTtcclxuICB9XHJcbiAgcmV0dXJuIHsgdHhpZCwgdm91dCB9O1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHR4aWRcclxuICogQHBhcmFtIHZvdXRcclxuICogQHJldHVybiBvdXRwdXRJZFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE91dHB1dElkKHsgdHhpZCwgdm91dCB9OiBUeE91dFBvaW50KTogc3RyaW5nIHtcclxuICByZXR1cm4gYCR7dHhpZH06JHt2b3V0fWA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRPdXRwdXRJZEZvcklucHV0KGk6IHsgaGFzaDogQnVmZmVyOyBpbmRleDogbnVtYmVyIH0pOiBUeE91dFBvaW50IHtcclxuICByZXR1cm4ge1xyXG4gICAgdHhpZDogQnVmZmVyLmZyb20oaS5oYXNoKS5yZXZlcnNlKCkudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgdm91dDogaS5pbmRleCxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogUmVmZXJlbmNlIHRvIG91dHB1dCBvZiBhbiBleGlzdGluZyB0cmFuc2FjdGlvblxyXG4gKi9cclxuZXhwb3J0IHR5cGUgVHhPdXRQb2ludCA9IHtcclxuICB0eGlkOiBzdHJpbmc7XHJcbiAgdm91dDogbnVtYmVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE91dHB1dCByZWZlcmVuY2UgYW5kIHNjcmlwdCBkYXRhLlxyXG4gKiBTdWl0YWJsZSBmb3IgdXNlIGZvciBgdHhiLmFkZElucHV0KClgXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBQcmV2T3V0cHV0PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+ID0gVHhPdXRQb2ludCAmXHJcbiAgVHhPdXRwdXQ8VE51bWJlcj4gJiB7XHJcbiAgICBwcmV2VHg/OiBCdWZmZXI7XHJcbiAgfTtcclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIFByZXZPdXRwdXQgZnJvbSBVbnNwZW50XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9QcmV2T3V0cHV0PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHU6IFVuc3BlbnQ8VE51bWJlcj4sXHJcbiAgbmV0d29yazogTmV0d29ya1xyXG4pOiBQcmV2T3V0cHV0PFROdW1iZXI+IHtcclxuICByZXR1cm4ge1xyXG4gICAgLi4ucGFyc2VPdXRwdXRJZCh1LmlkKSxcclxuICAgIC4uLnRvT3V0cHV0KHUsIG5ldHdvcmspLFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIFByZXZPdXRwdXQgd2l0aCBwcmV2VHggZnJvbSBVbnNwZW50XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9QcmV2T3V0cHV0V2l0aFByZXZUeDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB1OiBVbnNwZW50PFROdW1iZXI+ICYgeyBwcmV2VHg/OiB1bmtub3duIH0sXHJcbiAgbmV0d29yazogTmV0d29ya1xyXG4pOiBQcmV2T3V0cHV0PFROdW1iZXI+IHtcclxuICBsZXQgcHJldlR4O1xyXG4gIGlmICh0eXBlb2YgdS5wcmV2VHggPT09ICdzdHJpbmcnKSB7XHJcbiAgICBwcmV2VHggPSBCdWZmZXIuZnJvbSh1LnByZXZUeCwgJ2hleCcpO1xyXG4gIH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKHUucHJldlR4KSkge1xyXG4gICAgcHJldlR4ID0gdS5wcmV2VHg7XHJcbiAgfSBlbHNlIGlmICh1LnByZXZUeCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcHJldlR4IHR5cGUgZm9yIHVuc3BlbnQgJHt1LnByZXZUeH1gKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIC4uLnBhcnNlT3V0cHV0SWQodS5pZCksXHJcbiAgICAuLi50b091dHB1dCh1LCBuZXR3b3JrKSxcclxuICAgIHByZXZUeCxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHR4YlxyXG4gKiBAcGFyYW0gdVxyXG4gKiBAcGFyYW0gc2VxdWVuY2UgLSBzZXF1ZW5jZUlkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHhiOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+LFxyXG4gIHU6IFVuc3BlbnQ8VE51bWJlcj4sXHJcbiAgc2VxdWVuY2U/OiBudW1iZXJcclxuKTogdm9pZCB7XHJcbiAgY29uc3QgeyB0eGlkLCB2b3V0LCBzY3JpcHQsIHZhbHVlIH0gPSB0b1ByZXZPdXRwdXQodSwgdHhiLm5ldHdvcmsgYXMgTmV0d29yayk7XHJcbiAgdHhiLmFkZElucHV0KHR4aWQsIHZvdXQsIHNlcXVlbmNlLCBzY3JpcHQsIHZhbHVlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFN1bSB0aGUgdmFsdWVzIG9mIHRoZSB1bnNwZW50cy5cclxuICogVGhyb3dzIGVycm9yIGlmIHN1bSBpcyBub3QgYSBzYWZlIGludGVnZXIgdmFsdWUsIG9yIGlmIHVuc3BlbnQgYW1vdW50IHR5cGVzIGRvIG5vdCBtYXRjaCBgYW1vdW50VHlwZWBcclxuICogQHBhcmFtIHVuc3BlbnRzIC0gYXJyYXkgb2YgdW5zcGVudHMgdG8gc3VtXHJcbiAqIEBwYXJhbSBhbW91bnRUeXBlIC0gZXhwZWN0ZWQgdmFsdWUgdHlwZSBvZiB1bnNwZW50c1xyXG4gKiBAcmV0dXJuIHVuc3BlbnRTdW0gLSB0eXBlIG1hdGNoZXMgYW1vdW50VHlwZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVuc3BlbnRTdW08VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdW5zcGVudHM6IHsgdmFsdWU6IFROdW1iZXIgfVtdLFxyXG4gIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCcgPSAnbnVtYmVyJ1xyXG4pOiBUTnVtYmVyIHtcclxuICBpZiAoYW1vdW50VHlwZSA9PT0gJ2JpZ2ludCcpIHtcclxuICAgIHJldHVybiB1bnNwZW50cy5yZWR1Y2UoKHN1bSwgdSkgPT4gc3VtICsgKHUudmFsdWUgYXMgYmlnaW50KSwgQmlnSW50KDApKSBhcyBUTnVtYmVyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBzdW0gPSB1bnNwZW50cy5yZWR1Y2UoKHN1bSwgdSkgPT4gc3VtICsgKHUudmFsdWUgYXMgbnVtYmVyKSwgTnVtYmVyKDApKTtcclxuICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIoc3VtKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc3BlbnQgc3VtIGlzIG5vdCBhIHNhZmUgaW50ZWdlciBudW1iZXIsIGNvbnNpZGVyIHVzaW5nIGJpZ2ludCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN1bSBhcyBUTnVtYmVyO1xyXG4gIH1cclxufVxyXG4iXX0=