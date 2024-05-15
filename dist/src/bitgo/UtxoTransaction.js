"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtxoTransaction = exports.varSliceSize = void 0;
const assert = require("assert");
const bitcoinjs = require("bitcoinjs-lib");
const varuint = require("varuint-bitcoin");
const tnumber_1 = require("./tnumber");
const networks_1 = require("../networks");
function varSliceSize(slice) {
    const length = slice.length;
    return varuint.encodingLength(length) + length;
}
exports.varSliceSize = varSliceSize;
class UtxoTransaction extends bitcoinjs.Transaction {
    constructor(network, transaction, amountType) {
        super();
        this.network = network;
        if (transaction) {
            this.version = transaction.version;
            this.locktime = transaction.locktime;
            this.ins = transaction.ins.map((v) => ({ ...v, witness: [...v.witness] }));
            if (transaction.outs.length) {
                // amountType only matters if there are outs
                const inAmountType = typeof transaction.outs[0].value;
                assert(inAmountType === 'number' || inAmountType === 'bigint');
                const outAmountType = amountType || inAmountType;
                this.outs = transaction.outs.map((v) => ({ ...v, value: (0, tnumber_1.toTNumber)(v.value, outAmountType) }));
            }
        }
    }
    static newTransaction(network, transaction, amountType) {
        return new UtxoTransaction(network, transaction, amountType);
    }
    static fromBuffer(buf, noStrict, amountType = 'number', network, prevOutput) {
        if (!network) {
            throw new Error(`must provide network`);
        }
        return this.newTransaction(network, bitcoinjs.Transaction.fromBuffer(buf, noStrict, amountType), amountType);
    }
    addForkId(hashType) {
        /*
          ``The sighash type is altered to include a 24-bit fork id in its most significant bits.''
          We also use unsigned right shift operator `>>>` to cast to UInt32
          https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
         */
        const isBthFid = (0, networks_1.isBithereum)(this.network) && (hashType & UtxoTransaction.SIGHASH_FORKID_BTH); // Bithereum SIGHASH_FORKID
        if ((hashType & UtxoTransaction.SIGHASH_FORKID) || isBthFid) {
            let forkId = (0, networks_1.isBitcoinGold)(this.network) ? 79 : 0;
            if (isBthFid)
                forkId = 85; // Bithereum fork id
            return (hashType | (forkId << 8)) >>> 0;
        }
        return hashType;
    }
    hashForWitnessV0(inIndex, prevOutScript, value, hashType) {
        return super.hashForWitnessV0(inIndex, prevOutScript, value, this.addForkId(hashType));
    }
    /**
     * Calculate the hash to verify the signature against
     */
    hashForSignatureByNetwork(inIndex, prevoutScript, value, hashType) {
        switch ((0, networks_1.getMainnet)(this.network)) {
            case networks_1.networks.zcash:
                throw new Error(`illegal state`);
            case networks_1.networks.bitcoincash:
            case networks_1.networks.bitcoinsv:
            case networks_1.networks.bitcoingold:
            case networks_1.networks.bithereum:
            case networks_1.networks.ecash:
                /*
                  Bitcoin Cash supports a FORKID flag. When set, we hash using hashing algorithm
                   that is used for segregated witness transactions (defined in BIP143).
        
                  The flag is also used by BitcoinSV and BitcoinGold
        
                  https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/replay-protected-sighash.md
                 */
                const addForkId = (hashType & UtxoTransaction.SIGHASH_FORKID) > 0;
                const isBthFid = (0, networks_1.isBithereum)(this.network) && ((hashType & UtxoTransaction.SIGHASH_FORKID_BTH) > 0); // Bithereum SIGHASH_FORKID
                if (addForkId || isBthFid) {
                    if (value === undefined) {
                        throw new Error(`must provide value`);
                    }
                    return super.hashForWitnessV0(inIndex, prevoutScript, value, this.addForkId(hashType));
                }
        }
        return super.hashForSignature(inIndex, prevoutScript, hashType);
    }
    hashForSignature(inIndex, prevOutScript, hashType, value) {
        value = value !== null && value !== void 0 ? value : this.ins[inIndex].value;
        return this.hashForSignatureByNetwork(inIndex, prevOutScript, value, hashType);
    }
    clone(amountType) {
        // No need to clone. Everything is copied in the constructor.
        return new UtxoTransaction(this.network, this, amountType);
    }
}
exports.UtxoTransaction = UtxoTransaction;
UtxoTransaction.SIGHASH_FORKID = 0x40;
UtxoTransaction.SIGHASH_FORKID_BTH = 0x10;
/** @deprecated use SIGHASH_FORKID */
UtxoTransaction.SIGHASH_BITCOINCASHBIP143 = UtxoTransaction.SIGHASH_FORKID;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXR4b1RyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL1V0eG9UcmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx1Q0FBc0M7QUFFdEMsMENBQXdGO0FBRXhGLFNBQWdCLFlBQVksQ0FBQyxLQUFhO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUNqRCxDQUFDO0FBSEQsb0NBR0M7QUFFRCxNQUFhLGVBQTBELFNBQVEsU0FBUyxDQUFDLFdBQW9CO0lBTTNHLFlBQ1MsT0FBZ0IsRUFDdkIsV0FBb0QsRUFDcEQsVUFBZ0M7UUFFaEMsS0FBSyxFQUFFLENBQUM7UUFKRCxZQUFPLEdBQVAsT0FBTyxDQUFTO1FBS3ZCLElBQUksV0FBVyxFQUFFO1lBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1lBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxJQUFJLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDM0IsNENBQTRDO2dCQUM1QyxNQUFNLFlBQVksR0FBRyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsWUFBWSxLQUFL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ZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgKiBhcyBiaXRjb2luanMgZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcbmltcG9ydCAqIGFzIHZhcnVpbnQgZnJvbSAndmFydWludC1iaXRjb2luJztcclxuaW1wb3J0IHsgdG9UTnVtYmVyIH0gZnJvbSAnLi90bnVtYmVyJztcclxuXHJcbmltcG9ydCB7IG5ldHdvcmtzLCBOZXR3b3JrLCBnZXRNYWlubmV0LCBpc0JpdGNvaW5Hb2xkLCBpc0JpdGhlcmV1bSB9IGZyb20gJy4uL25ldHdvcmtzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJTbGljZVNpemUoc2xpY2U6IEJ1ZmZlcik6IG51bWJlciB7XHJcbiAgY29uc3QgbGVuZ3RoID0gc2xpY2UubGVuZ3RoO1xyXG4gIHJldHVybiB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKGxlbmd0aCkgKyBsZW5ndGg7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBVdHhvVHJhbnNhY3Rpb248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4gZXh0ZW5kcyBiaXRjb2luanMuVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gIHN0YXRpYyBTSUdIQVNIX0ZPUktJRCA9IDB4NDA7XHJcbiAgc3RhdGljIFNJR0hBU0hfRk9SS0lEX0JUSCA9IDB4MTA7XHJcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBTSUdIQVNIX0ZPUktJRCAqL1xyXG4gIHN0YXRpYyBTSUdIQVNIX0JJVENPSU5DQVNIQklQMTQzID0gVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHB1YmxpYyBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gICAgdHJhbnNhY3Rpb24/OiBiaXRjb2luanMuVHJhbnNhY3Rpb248YmlnaW50IHwgbnVtYmVyPixcclxuICAgIGFtb3VudFR5cGU/OiAnYmlnaW50JyB8ICdudW1iZXInXHJcbiAgKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgaWYgKHRyYW5zYWN0aW9uKSB7XHJcbiAgICAgIHRoaXMudmVyc2lvbiA9IHRyYW5zYWN0aW9uLnZlcnNpb247XHJcbiAgICAgIHRoaXMubG9ja3RpbWUgPSB0cmFuc2FjdGlvbi5sb2NrdGltZTtcclxuICAgICAgdGhpcy5pbnMgPSB0cmFuc2FjdGlvbi5pbnMubWFwKCh2KSA9PiAoeyAuLi52LCB3aXRuZXNzOiBbLi4udi53aXRuZXNzXSB9KSk7XHJcbiAgICAgIGlmICh0cmFuc2FjdGlvbi5vdXRzLmxlbmd0aCkge1xyXG4gICAgICAgIC8vIGFtb3VudFR5cGUgb25seSBtYXR0ZXJzIGlmIHRoZXJlIGFyZSBvdXRzXHJcbiAgICAgICAgY29uc3QgaW5BbW91bnRUeXBlID0gdHlwZW9mIHRyYW5zYWN0aW9uLm91dHNbMF0udmFsdWU7XHJcbiAgICAgICAgYXNzZXJ0KGluQW1vdW50VHlwZSA9PT0gJ251bWJlcicgfHwgaW5BbW91bnRUeXBlID09PSAnYmlnaW50Jyk7XHJcbiAgICAgICAgY29uc3Qgb3V0QW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9IGFtb3VudFR5cGUgfHwgaW5BbW91bnRUeXBlO1xyXG4gICAgICAgIHRoaXMub3V0cyA9IHRyYW5zYWN0aW9uLm91dHMubWFwKCh2KSA9PiAoeyAuLi52LCB2YWx1ZTogdG9UTnVtYmVyKHYudmFsdWUsIG91dEFtb3VudFR5cGUpIH0pKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHN0YXRpYyBuZXdUcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICAgIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgICB0cmFuc2FjdGlvbj86IGJpdGNvaW5qcy5UcmFuc2FjdGlvbjxiaWdpbnQgfCBudW1iZXI+LFxyXG4gICAgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuICApOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgcmV0dXJuIG5ldyBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4obmV0d29yaywgdHJhbnNhY3Rpb24sIGFtb3VudFR5cGUpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZyb21CdWZmZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgICBidWY6IEJ1ZmZlcixcclxuICAgIG5vU3RyaWN0OiBib29sZWFuLFxyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInLFxyXG4gICAgbmV0d29yaz86IE5ldHdvcmssXHJcbiAgICBwcmV2T3V0cHV0PzogYml0Y29pbmpzLlR4T3V0cHV0PFROdW1iZXI+W11cclxuICApOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgaWYgKCFuZXR3b3JrKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbXVzdCBwcm92aWRlIG5ldHdvcmtgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm5ld1RyYW5zYWN0aW9uPFROdW1iZXI+KFxyXG4gICAgICBuZXR3b3JrLFxyXG4gICAgICBiaXRjb2luanMuVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcjxUTnVtYmVyPihidWYsIG5vU3RyaWN0LCBhbW91bnRUeXBlKSxcclxuICAgICAgYW1vdW50VHlwZVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGFkZEZvcmtJZChoYXNoVHlwZTogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIC8qXHJcbiAgICAgIGBgVGhlIHNpZ2hhc2ggdHlwZSBpcyBhbHRlcmVkIHRvIGluY2x1ZGUgYSAyNC1iaXQgZm9yayBpZCBpbiBpdHMgbW9zdCBzaWduaWZpY2FudCBiaXRzLicnXHJcbiAgICAgIFdlIGFsc28gdXNlIHVuc2lnbmVkIHJpZ2h0IHNoaWZ0IG9wZXJhdG9yIGA+Pj5gIHRvIGNhc3QgdG8gVUludDMyXHJcbiAgICAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL09wZXJhdG9ycy9VbnNpZ25lZF9yaWdodF9zaGlmdFxyXG4gICAgICovXHJcbiAgICBjb25zdCBpc0J0aEZpZCA9IGlzQml0aGVyZXVtKHRoaXMubmV0d29yaykgJiYgKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEX0JUSCk7IC8vIEJpdGhlcmV1bSBTSUdIQVNIX0ZPUktJRFxyXG4gICAgaWYgKChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCkgfHwgaXNCdGhGaWQpIHtcclxuICAgICAgbGV0IGZvcmtJZCA9IGlzQml0Y29pbkdvbGQodGhpcy5uZXR3b3JrKSA/IDc5IDogMDtcclxuICAgICAgaWYgKGlzQnRoRmlkKSBmb3JrSWQgPSA4NTsgLy8gQml0aGVyZXVtIGZvcmsgaWRcclxuICAgICAgcmV0dXJuIChoYXNoVHlwZSB8IChmb3JrSWQgPDwgOCkpID4+PiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYXNoVHlwZTtcclxuICB9XHJcblxyXG4gIGhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleDogbnVtYmVyLCBwcmV2T3V0U2NyaXB0OiBCdWZmZXIsIHZhbHVlOiBUTnVtYmVyLCBoYXNoVHlwZTogbnVtYmVyKTogQnVmZmVyIHtcclxuICAgIHJldHVybiBzdXBlci5oYXNoRm9yV2l0bmVzc1YwKGluSW5kZXgsIHByZXZPdXRTY3JpcHQsIHZhbHVlLCB0aGlzLmFkZEZvcmtJZChoYXNoVHlwZSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsY3VsYXRlIHRoZSBoYXNoIHRvIHZlcmlmeSB0aGUgc2lnbmF0dXJlIGFnYWluc3RcclxuICAgKi9cclxuICBoYXNoRm9yU2lnbmF0dXJlQnlOZXR3b3JrKFxyXG4gICAgaW5JbmRleDogbnVtYmVyLFxyXG4gICAgcHJldm91dFNjcmlwdDogQnVmZmVyLFxyXG4gICAgdmFsdWU6IFROdW1iZXIgfCB1bmRlZmluZWQsXHJcbiAgICBoYXNoVHlwZTogbnVtYmVyXHJcbiAgKTogQnVmZmVyIHtcclxuICAgIHN3aXRjaCAoZ2V0TWFpbm5ldCh0aGlzLm5ldHdvcmspKSB7XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbGxlZ2FsIHN0YXRlYCk7XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgQml0Y29pbiBDYXNoIHN1cHBvcnRzIGEgRk9SS0lEIGZsYWcuIFdoZW4gc2V0LCB3ZSBoYXNoIHVzaW5nIGhhc2hpbmcgYWxnb3JpdGhtXHJcbiAgICAgICAgICAgdGhhdCBpcyB1c2VkIGZvciBzZWdyZWdhdGVkIHdpdG5lc3MgdHJhbnNhY3Rpb25zIChkZWZpbmVkIGluIEJJUDE0MykuXHJcblxyXG4gICAgICAgICAgVGhlIGZsYWcgaXMgYWxzbyB1c2VkIGJ5IEJpdGNvaW5TViBhbmQgQml0Y29pbkdvbGRcclxuXHJcbiAgICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbmNhc2hvcmcvYml0Y29pbmNhc2gub3JnL2Jsb2IvbWFzdGVyL3NwZWMvcmVwbGF5LXByb3RlY3RlZC1zaWdoYXNoLm1kXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uc3QgYWRkRm9ya0lkID0gKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEKSA+IDA7XHJcbiAgICAgICAgY29uc3QgaXNCdGhGaWQgPSBpc0JpdGhlcmV1bSh0aGlzLm5ldHdvcmspICYmICgoaGFzaFR5cGUgJiBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSURfQlRIKSA+IDApOyAvLyBCaXRoZXJldW0gU0lHSEFTSF9GT1JLSURcclxuICAgICAgICBpZiAoYWRkRm9ya0lkIHx8IGlzQnRoRmlkKSB7XHJcbiAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG11c3QgcHJvdmlkZSB2YWx1ZWApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHN1cGVyLmhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleCwgcHJldm91dFNjcmlwdCwgdmFsdWUsIHRoaXMuYWRkRm9ya0lkKGhhc2hUeXBlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdXBlci5oYXNoRm9yU2lnbmF0dXJlKGluSW5kZXgsIHByZXZvdXRTY3JpcHQsIGhhc2hUeXBlKTtcclxuICB9XHJcblxyXG4gIGhhc2hGb3JTaWduYXR1cmUoaW5JbmRleDogbnVtYmVyLCBwcmV2T3V0U2NyaXB0OiBCdWZmZXIsIGhhc2hUeXBlOiBudW1iZXIsIHZhbHVlPzogVE51bWJlcik6IEJ1ZmZlciB7XHJcbiAgICB2YWx1ZSA9IHZhbHVlID8/ICh0aGlzLmluc1tpbkluZGV4XSBhcyBhbnkpLnZhbHVlO1xyXG4gICAgcmV0dXJuIHRoaXMuaGFzaEZvclNpZ25hdHVyZUJ5TmV0d29yayhpbkluZGV4LCBwcmV2T3V0U2NyaXB0LCB2YWx1ZSwgaGFzaFR5cGUpO1xyXG4gIH1cclxuXHJcbiAgY2xvbmU8VE4yIGV4dGVuZHMgYmlnaW50IHwgbnVtYmVyID0gVE51bWJlcj4oYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCcpOiBVdHhvVHJhbnNhY3Rpb248VE4yPiB7XHJcbiAgICAvLyBObyBuZWVkIHRvIGNsb25lLiBFdmVyeXRoaW5nIGlzIGNvcGllZCBpbiB0aGUgY29uc3RydWN0b3IuXHJcbiAgICByZXR1cm4gbmV3IFV0eG9UcmFuc2FjdGlvbjxUTjI+KHRoaXMubmV0d29yaywgdGhpcywgYW1vdW50VHlwZSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==