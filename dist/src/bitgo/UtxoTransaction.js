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
            case networks_1.networks.zelcash:
            case networks_1.networks.flux:
            case networks_1.networks.zero:
            case networks_1.networks.snowgem:
            case networks_1.networks.safecoin:
            case networks_1.networks.komodo:
            case networks_1.networks.gemlink:
            case networks_1.networks.commercium:
            case networks_1.networks.zclassic:
            case networks_1.networks.bzedge:
            case networks_1.networks.bitcoinz:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXR4b1RyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL1V0eG9UcmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx1Q0FBc0M7QUFFdEMsMENBQXdGO0FBRXhGLFNBQWdCLFlBQVksQ0FBQyxLQUFhO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUNqRCxDQUFDO0FBSEQsb0NBR0M7QUFFRCxNQUFhLGVBQTBELFNBQVEsU0FBUyxDQUFDLFdBQW9CO0lBTTNHLFlBQ1MsT0FBZ0IsRUFDdkIsV0FBb0QsRUFDcEQsVUFBZ0M7UUFFaEMsS0FBSyxFQUFFLENBQUM7UUFKRCxZQUFPLEdBQVAsT0FBTyxDQUFTO1FBS3ZCLElBQUksV0FBVyxFQUFFO1lBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1lBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxJQUFJLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDM0IsNENBQTRDO2dCQUM1QyxNQUFNLFlBQVksR0FBRyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsWUFBWSxLQUFL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QUFTLENBQUMsS0FBSyxDQUFDO1FBQ2xELE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFFRCxLQUFLLENBQXdDLFVBQWdDO1FBQzNFLDZEQUE2RDtRQUM3RCxPQUFPLElBQUksZUFBZSxDQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7O0FBaElILDBDQWlJQztBQWhJaUIsOEJBQWMsR0FBRyxJQUFJLENBQUM7QUFDdEIsa0NBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQzFDLHFDQUFxQztBQUM5Qix5Q0FBeUIsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCAqIGFzIGJpdGNvaW5qcyBmcm9tICdiaXRjb2luanMtbGliJztcclxuaW1wb3J0ICogYXMgdmFydWludCBmcm9tICd2YXJ1aW50LWJpdGNvaW4nO1xyXG5pbXBvcnQgeyB0b1ROdW1iZXIgfSBmcm9tICcuL3RudW1iZXInO1xyXG5cclxuaW1wb3J0IHsgbmV0d29ya3MsIE5ldHdvcmssIGdldE1haW5uZXQsIGlzQml0Y29pbkdvbGQsIGlzQml0aGVyZXVtIH0gZnJvbSAnLi4vbmV0d29ya3MnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhclNsaWNlU2l6ZShzbGljZTogQnVmZmVyKTogbnVtYmVyIHtcclxuICBjb25zdCBsZW5ndGggPSBzbGljZS5sZW5ndGg7XHJcbiAgcmV0dXJuIHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgobGVuZ3RoKSArIGxlbmd0aDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiBleHRlbmRzIGJpdGNvaW5qcy5UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgc3RhdGljIHJlYWRvbmx5IFNJR0hBU0hfRk9SS0lEID0gMHg0MDtcclxuICBzdGF0aWMgcmVhZG9ubHkgU0lHSEFTSF9GT1JLSURfQlRIID0gMHgxMDtcclxuICAvKiogQGRlcHJlY2F0ZWQgdXNlIFNJR0hBU0hfRk9SS0lEICovXHJcbiAgc3RhdGljIFNJR0hBU0hfQklUQ09JTkNBU0hCSVAxNDMgPSBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSUQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHVibGljIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgICB0cmFuc2FjdGlvbj86IGJpdGNvaW5qcy5UcmFuc2FjdGlvbjxiaWdpbnQgfCBudW1iZXI+LFxyXG4gICAgYW1vdW50VHlwZT86ICdiaWdpbnQnIHwgJ251bWJlcidcclxuICApIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBpZiAodHJhbnNhY3Rpb24pIHtcclxuICAgICAgdGhpcy52ZXJzaW9uID0gdHJhbnNhY3Rpb24udmVyc2lvbjtcclxuICAgICAgdGhpcy5sb2NrdGltZSA9IHRyYW5zYWN0aW9uLmxvY2t0aW1lO1xyXG4gICAgICB0aGlzLmlucyA9IHRyYW5zYWN0aW9uLmlucy5tYXAoKHYpID0+ICh7IC4uLnYsIHdpdG5lc3M6IFsuLi52LndpdG5lc3NdIH0pKTtcclxuICAgICAgaWYgKHRyYW5zYWN0aW9uLm91dHMubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gYW1vdW50VHlwZSBvbmx5IG1hdHRlcnMgaWYgdGhlcmUgYXJlIG91dHNcclxuICAgICAgICBjb25zdCBpbkFtb3VudFR5cGUgPSB0eXBlb2YgdHJhbnNhY3Rpb24ub3V0c1swXS52YWx1ZTtcclxuICAgICAgICBhc3NlcnQoaW5BbW91bnRUeXBlID09PSAnbnVtYmVyJyB8fCBpbkFtb3VudFR5cGUgPT09ICdiaWdpbnQnKTtcclxuICAgICAgICBjb25zdCBvdXRBbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnID0gYW1vdW50VHlwZSB8fCBpbkFtb3VudFR5cGU7XHJcbiAgICAgICAgdGhpcy5vdXRzID0gdHJhbnNhY3Rpb24ub3V0cy5tYXAoKHYpID0+ICh7IC4uLnYsIHZhbHVlOiB0b1ROdW1iZXIodi52YWx1ZSwgb3V0QW1vdW50VHlwZSkgfSkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3RhdGljIG5ld1RyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgbmV0d29yazogTmV0d29yayxcclxuICAgIHRyYW5zYWN0aW9uPzogYml0Y29pbmpzLlRyYW5zYWN0aW9uPGJpZ2ludCB8IG51bWJlcj4sXHJcbiAgICBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50J1xyXG4gICk6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICByZXR1cm4gbmV3IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPihuZXR3b3JrLCB0cmFuc2FjdGlvbiwgYW1vdW50VHlwZSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICAgIGJ1ZjogQnVmZmVyLFxyXG4gICAgbm9TdHJpY3Q6IGJvb2xlYW4sXHJcbiAgICBhbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnID0gJ251bWJlcicsXHJcbiAgICBuZXR3b3JrPzogTmV0d29yayxcclxuICAgIHByZXZPdXRwdXQ/OiBiaXRjb2luanMuVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4gICk6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICBpZiAoIW5ldHdvcmspIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgbmV0d29ya2ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMubmV3VHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgIG5ldHdvcmssXHJcbiAgICAgIGJpdGNvaW5qcy5UcmFuc2FjdGlvbi5mcm9tQnVmZmVyPFROdW1iZXI+KGJ1Ziwgbm9TdHJpY3QsIGFtb3VudFR5cGUpLFxyXG4gICAgICBhbW91bnRUeXBlXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYWRkRm9ya0lkKGhhc2hUeXBlOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgLypcclxuICAgICAgYGBUaGUgc2lnaGFzaCB0eXBlIGlzIGFsdGVyZWQgdG8gaW5jbHVkZSBhIDI0LWJpdCBmb3JrIGlkIGluIGl0cyBtb3N0IHNpZ25pZmljYW50IGJpdHMuJydcclxuICAgICAgV2UgYWxzbyB1c2UgdW5zaWduZWQgcmlnaHQgc2hpZnQgb3BlcmF0b3IgYD4+PmAgdG8gY2FzdCB0byBVSW50MzJcclxuICAgICAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvT3BlcmF0b3JzL1Vuc2lnbmVkX3JpZ2h0X3NoaWZ0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGlzQnRoRmlkID0gaXNCaXRoZXJldW0odGhpcy5uZXR3b3JrKSAmJiAoaGFzaFR5cGUgJiBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSURfQlRIKTsgLy8gQml0aGVyZXVtIFNJR0hBU0hfRk9SS0lEXHJcbiAgICBpZiAoKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEKSB8fCBpc0J0aEZpZCkge1xyXG4gICAgICBsZXQgZm9ya0lkID0gaXNCaXRjb2luR29sZCh0aGlzLm5ldHdvcmspID8gNzkgOiAwO1xyXG4gICAgICBpZiAoaXNCdGhGaWQpIGZvcmtJZCA9IDg1OyAvLyBCaXRoZXJldW0gZm9yayBpZFxyXG4gICAgICByZXR1cm4gKGhhc2hUeXBlIHwgKGZvcmtJZCA8PCA4KSkgPj4+IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhhc2hUeXBlO1xyXG4gIH1cclxuXHJcbiAgaGFzaEZvcldpdG5lc3NWMChpbkluZGV4OiBudW1iZXIsIHByZXZPdXRTY3JpcHQ6IEJ1ZmZlciwgdmFsdWU6IFROdW1iZXIsIGhhc2hUeXBlOiBudW1iZXIpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHN1cGVyLmhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleCwgcHJldk91dFNjcmlwdCwgdmFsdWUsIHRoaXMuYWRkRm9ya0lkKGhhc2hUeXBlKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUgdGhlIGhhc2ggdG8gdmVyaWZ5IHRoZSBzaWduYXR1cmUgYWdhaW5zdFxyXG4gICAqL1xyXG4gIGhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsoXHJcbiAgICBpbkluZGV4OiBudW1iZXIsXHJcbiAgICBwcmV2b3V0U2NyaXB0OiBCdWZmZXIsXHJcbiAgICB2YWx1ZTogVE51bWJlciB8IHVuZGVmaW5lZCxcclxuICAgIGhhc2hUeXBlOiBudW1iZXJcclxuICApOiBCdWZmZXIge1xyXG4gICAgc3dpdGNoIChnZXRNYWlubmV0KHRoaXMubmV0d29yaykpIHtcclxuICAgICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaWxsZWdhbCBzdGF0ZWApO1xyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgICAgLypcclxuICAgICAgICAgIEJpdGNvaW4gQ2FzaCBzdXBwb3J0cyBhIEZPUktJRCBmbGFnLiBXaGVuIHNldCwgd2UgaGFzaCB1c2luZyBoYXNoaW5nIGFsZ29yaXRobVxyXG4gICAgICAgICAgIHRoYXQgaXMgdXNlZCBmb3Igc2VncmVnYXRlZCB3aXRuZXNzIHRyYW5zYWN0aW9ucyAoZGVmaW5lZCBpbiBCSVAxNDMpLlxyXG5cclxuICAgICAgICAgIFRoZSBmbGFnIGlzIGFsc28gdXNlZCBieSBCaXRjb2luU1YgYW5kIEJpdGNvaW5Hb2xkXHJcblxyXG4gICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL3JlcGxheS1wcm90ZWN0ZWQtc2lnaGFzaC5tZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IGFkZEZvcmtJZCA9IChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCkgPiAwO1xyXG4gICAgICAgIGNvbnN0IGlzQnRoRmlkID0gaXNCaXRoZXJldW0odGhpcy5uZXR3b3JrKSAmJiAoKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEX0JUSCkgPiAwKTsgLy8gQml0aGVyZXVtIFNJR0hBU0hfRk9SS0lEXHJcbiAgICAgICAgaWYgKGFkZEZvcmtJZCB8fCBpc0J0aEZpZCkge1xyXG4gICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgdmFsdWVgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBzdXBlci5oYXNoRm9yV2l0bmVzc1YwKGluSW5kZXgsIHByZXZvdXRTY3JpcHQsIHZhbHVlLCB0aGlzLmFkZEZvcmtJZChoYXNoVHlwZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VwZXIuaGFzaEZvclNpZ25hdHVyZShpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCBoYXNoVHlwZSk7XHJcbiAgfVxyXG5cclxuICBoYXNoRm9yU2lnbmF0dXJlKGluSW5kZXg6IG51bWJlciwgcHJldk91dFNjcmlwdDogQnVmZmVyLCBoYXNoVHlwZTogbnVtYmVyLCB2YWx1ZT86IFROdW1iZXIpOiBCdWZmZXIge1xyXG4gICAgdmFsdWUgPSB2YWx1ZSA/PyAodGhpcy5pbnNbaW5JbmRleF0gYXMgYW55KS52YWx1ZTtcclxuICAgIHJldHVybiB0aGlzLmhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsoaW5JbmRleCwgcHJldk91dFNjcmlwdCwgdmFsdWUsIGhhc2hUeXBlKTtcclxuICB9XHJcblxyXG4gIGNsb25lPFROMiBleHRlbmRzIGJpZ2ludCB8IG51bWJlciA9IFROdW1iZXI+KGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnKTogVXR4b1RyYW5zYWN0aW9uPFROMj4ge1xyXG4gICAgLy8gTm8gbmVlZCB0byBjbG9uZS4gRXZlcnl0aGluZyBpcyBjb3BpZWQgaW4gdGhlIGNvbnN0cnVjdG9yLlxyXG4gICAgcmV0dXJuIG5ldyBVdHhvVHJhbnNhY3Rpb248VE4yPih0aGlzLm5ldHdvcmssIHRoaXMsIGFtb3VudFR5cGUpO1xyXG4gIH1cclxufVxyXG4iXX0=