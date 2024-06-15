"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtxoTransaction = exports.varSliceSize = void 0;
const assert = require("assert");
const bitcoinjs = require("bitcoinjs-lib");
const varuint = require("varuint-bitcoin");
const tnumber_1 = require("./tnumber");
const networks_1 = require("../networks");
const grsTx = require("./groestlcoin");
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
            case networks_1.networks.groestlcoin:
                if ((hashType & UtxoTransaction.SIGHASH_FORKID) > 0) {
                    if (value === undefined) {
                        throw new Error(`must provide value`);
                    }
                    return grsTx.hashForWitnessV0(inIndex, prevoutScript, value, this.addForkId(hashType), super.clone());
                }
                return grsTx.hashForSignature(inIndex, prevoutScript, hashType, value, super.clone());
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
            case networks_1.networks.hush:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXR4b1RyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL1V0eG9UcmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx1Q0FBc0M7QUFFdEMsMENBQXdGO0FBQ3hGLHVDQUF1QztBQUV2QyxTQUFnQixZQUFZLENBQUMsS0FBYTtJQUN4QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzVCLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDakQsQ0FBQztBQUhELG9DQUdDO0FBRUQsTUFBYSxlQUEwRCxTQUFRLFNBQVMsQ0FBQyxXQUFvQjtJQU0zRyxZQUNTLE9BQWdCLEVBQ3ZCLFdBQW9ELEVBQ3BELFVBQWdDO1FBRWhDLEtBQUssRUFBRSxDQUFDO1FBSkQsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUt2QixJQUFJLFdBQVcsRUFBRTtZQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztZQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDckMsSUFBSSxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQzNCLDRDQUE0QztnQkFDNUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDdEQsTUFBTSxD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QUFDLENBQUMsQ0FBQywyQkFBMkI7Z0JBQ2hJLElBQUksU0FBUyxJQUFJLFFBQVEsRUFBRTtvQkFDekIsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO3dCQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7cUJBQ3ZDO29CQUNELE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztpQkFDeEY7U0FDSjtRQUVELE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELGdCQUFnQixDQUFDLE9BQWUsRUFBRSxhQUFxQixFQUFFLFFBQWdCLEVBQUUsS0FBZTtRQUN4RixLQUFLLEdBQUcsS0FBSyxhQUFMLEtBQUssY0FBTCxLQUFLLEdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQVMsQ0FBQyxLQUFLLENBQUM7UUFDbEQsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVELEtBQUssQ0FBd0MsVUFBZ0M7UUFDM0UsNkRBQTZEO1FBQzdELE9BQU8sSUFBSSxlQUFlLENBQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbEUsQ0FBQzs7QUF6SUgsMENBMElDO0FBeklpQiw4QkFBYyxHQUFHLElBQUksQ0FBQztBQUN0QixrQ0FBa0IsR0FBRyxJQUFJLENBQUM7QUFDMUMscUNBQXFDO0FBQzlCLHlDQUF5QixHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcclxuaW1wb3J0ICogYXMgYml0Y29pbmpzIGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgKiBhcyB2YXJ1aW50IGZyb20gJ3ZhcnVpbnQtYml0Y29pbic7XHJcbmltcG9ydCB7IHRvVE51bWJlciB9IGZyb20gJy4vdG51bWJlcic7XHJcblxyXG5pbXBvcnQgeyBuZXR3b3JrcywgTmV0d29yaywgZ2V0TWFpbm5ldCwgaXNCaXRjb2luR29sZCwgaXNCaXRoZXJldW0gfSBmcm9tICcuLi9uZXR3b3Jrcyc7XHJcbmltcG9ydCAqIGFzIGdyc1R4IGZyb20gJy4vZ3JvZXN0bGNvaW4nO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhclNsaWNlU2l6ZShzbGljZTogQnVmZmVyKTogbnVtYmVyIHtcclxuICBjb25zdCBsZW5ndGggPSBzbGljZS5sZW5ndGg7XHJcbiAgcmV0dXJuIHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgobGVuZ3RoKSArIGxlbmd0aDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiBleHRlbmRzIGJpdGNvaW5qcy5UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgc3RhdGljIHJlYWRvbmx5IFNJR0hBU0hfRk9SS0lEID0gMHg0MDtcclxuICBzdGF0aWMgcmVhZG9ubHkgU0lHSEFTSF9GT1JLSURfQlRIID0gMHgxMDtcclxuICAvKiogQGRlcHJlY2F0ZWQgdXNlIFNJR0hBU0hfRk9SS0lEICovXHJcbiAgc3RhdGljIFNJR0hBU0hfQklUQ09JTkNBU0hCSVAxNDMgPSBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSUQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHVibGljIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgICB0cmFuc2FjdGlvbj86IGJpdGNvaW5qcy5UcmFuc2FjdGlvbjxiaWdpbnQgfCBudW1iZXI+LFxyXG4gICAgYW1vdW50VHlwZT86ICdiaWdpbnQnIHwgJ251bWJlcidcclxuICApIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBpZiAodHJhbnNhY3Rpb24pIHtcclxuICAgICAgdGhpcy52ZXJzaW9uID0gdHJhbnNhY3Rpb24udmVyc2lvbjtcclxuICAgICAgdGhpcy5sb2NrdGltZSA9IHRyYW5zYWN0aW9uLmxvY2t0aW1lO1xyXG4gICAgICB0aGlzLmlucyA9IHRyYW5zYWN0aW9uLmlucy5tYXAoKHYpID0+ICh7IC4uLnYsIHdpdG5lc3M6IFsuLi52LndpdG5lc3NdIH0pKTtcclxuICAgICAgaWYgKHRyYW5zYWN0aW9uLm91dHMubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gYW1vdW50VHlwZSBvbmx5IG1hdHRlcnMgaWYgdGhlcmUgYXJlIG91dHNcclxuICAgICAgICBjb25zdCBpbkFtb3VudFR5cGUgPSB0eXBlb2YgdHJhbnNhY3Rpb24ub3V0c1swXS52YWx1ZTtcclxuICAgICAgICBhc3NlcnQoaW5BbW91bnRUeXBlID09PSAnbnVtYmVyJyB8fCBpbkFtb3VudFR5cGUgPT09ICdiaWdpbnQnKTtcclxuICAgICAgICBjb25zdCBvdXRBbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnID0gYW1vdW50VHlwZSB8fCBpbkFtb3VudFR5cGU7XHJcbiAgICAgICAgdGhpcy5vdXRzID0gdHJhbnNhY3Rpb24ub3V0cy5tYXAoKHYpID0+ICh7IC4uLnYsIHZhbHVlOiB0b1ROdW1iZXIodi52YWx1ZSwgb3V0QW1vdW50VHlwZSkgfSkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3RhdGljIG5ld1RyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgbmV0d29yazogTmV0d29yayxcclxuICAgIHRyYW5zYWN0aW9uPzogYml0Y29pbmpzLlRyYW5zYWN0aW9uPGJpZ2ludCB8IG51bWJlcj4sXHJcbiAgICBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50J1xyXG4gICk6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICByZXR1cm4gbmV3IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPihuZXR3b3JrLCB0cmFuc2FjdGlvbiwgYW1vdW50VHlwZSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICAgIGJ1ZjogQnVmZmVyLFxyXG4gICAgbm9TdHJpY3Q6IGJvb2xlYW4sXHJcbiAgICBhbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnID0gJ251bWJlcicsXHJcbiAgICBuZXR3b3JrPzogTmV0d29yayxcclxuICAgIHByZXZPdXRwdXQ/OiBiaXRjb2luanMuVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4gICk6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICBpZiAoIW5ldHdvcmspIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgbmV0d29ya2ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMubmV3VHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgIG5ldHdvcmssXHJcbiAgICAgIGJpdGNvaW5qcy5UcmFuc2FjdGlvbi5mcm9tQnVmZmVyPFROdW1iZXI+KGJ1Ziwgbm9TdHJpY3QsIGFtb3VudFR5cGUpLFxyXG4gICAgICBhbW91bnRUeXBlXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYWRkRm9ya0lkKGhhc2hUeXBlOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgLypcclxuICAgICAgYGBUaGUgc2lnaGFzaCB0eXBlIGlzIGFsdGVyZWQgdG8gaW5jbHVkZSBhIDI0LWJpdCBmb3JrIGlkIGluIGl0cyBtb3N0IHNpZ25pZmljYW50IGJpdHMuJydcclxuICAgICAgV2UgYWxzbyB1c2UgdW5zaWduZWQgcmlnaHQgc2hpZnQgb3BlcmF0b3IgYD4+PmAgdG8gY2FzdCB0byBVSW50MzJcclxuICAgICAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvT3BlcmF0b3JzL1Vuc2lnbmVkX3JpZ2h0X3NoaWZ0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGlzQnRoRmlkID0gaXNCaXRoZXJldW0odGhpcy5uZXR3b3JrKSAmJiAoaGFzaFR5cGUgJiBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSURfQlRIKTsgLy8gQml0aGVyZXVtIFNJR0hBU0hfRk9SS0lEXHJcbiAgICBpZiAoKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEKSB8fCBpc0J0aEZpZCkge1xyXG4gICAgICBsZXQgZm9ya0lkID0gaXNCaXRjb2luR29sZCh0aGlzLm5ldHdvcmspID8gNzkgOiAwO1xyXG4gICAgICBpZiAoaXNCdGhGaWQpIGZvcmtJZCA9IDg1OyAvLyBCaXRoZXJldW0gZm9yayBpZFxyXG4gICAgICByZXR1cm4gKGhhc2hUeXBlIHwgKGZvcmtJZCA8PCA4KSkgPj4+IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhhc2hUeXBlO1xyXG4gIH1cclxuXHJcbiAgaGFzaEZvcldpdG5lc3NWMChpbkluZGV4OiBudW1iZXIsIHByZXZPdXRTY3JpcHQ6IEJ1ZmZlciwgdmFsdWU6IFROdW1iZXIsIGhhc2hUeXBlOiBudW1iZXIpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHN1cGVyLmhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleCwgcHJldk91dFNjcmlwdCwgdmFsdWUsIHRoaXMuYWRkRm9ya0lkKGhhc2hUeXBlKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUgdGhlIGhhc2ggdG8gdmVyaWZ5IHRoZSBzaWduYXR1cmUgYWdhaW5zdFxyXG4gICAqL1xyXG4gIGhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsoXHJcbiAgICBpbkluZGV4OiBudW1iZXIsXHJcbiAgICBwcmV2b3V0U2NyaXB0OiBCdWZmZXIsXHJcbiAgICB2YWx1ZTogVE51bWJlciB8IHVuZGVmaW5lZCxcclxuICAgIGhhc2hUeXBlOiBudW1iZXJcclxuICApOiBCdWZmZXIge1xyXG4gICAgc3dpdGNoIChnZXRNYWlubmV0KHRoaXMubmV0d29yaykpIHtcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5ncm9lc3RsY29pbjpcclxuICAgICAgICBpZiAoKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEKSA+IDApIHtcclxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgbXVzdCBwcm92aWRlIHZhbHVlYCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gZ3JzVHguaGFzaEZvcldpdG5lc3NWMChpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCB2YWx1ZSwgdGhpcy5hZGRGb3JrSWQoaGFzaFR5cGUpLCBzdXBlci5jbG9uZSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdyc1R4Lmhhc2hGb3JTaWduYXR1cmUoaW5JbmRleCwgcHJldm91dFNjcmlwdCwgaGFzaFR5cGUsIHZhbHVlLCBzdXBlci5jbG9uZSgpKVxyXG4gICAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGlsbGVnYWwgc3RhdGVgKTtcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICBCaXRjb2luIENhc2ggc3VwcG9ydHMgYSBGT1JLSUQgZmxhZy4gV2hlbiBzZXQsIHdlIGhhc2ggdXNpbmcgaGFzaGluZyBhbGdvcml0aG1cclxuICAgICAgICAgICB0aGF0IGlzIHVzZWQgZm9yIHNlZ3JlZ2F0ZWQgd2l0bmVzcyB0cmFuc2FjdGlvbnMgKGRlZmluZWQgaW4gQklQMTQzKS5cclxuXHJcbiAgICAgICAgICBUaGUgZmxhZyBpcyBhbHNvIHVzZWQgYnkgQml0Y29pblNWIGFuZCBCaXRjb2luR29sZFxyXG5cclxuICAgICAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luY2FzaG9yZy9iaXRjb2luY2FzaC5vcmcvYmxvYi9tYXN0ZXIvc3BlYy9yZXBsYXktcHJvdGVjdGVkLXNpZ2hhc2gubWRcclxuICAgICAgICAgKi9cclxuICAgICAgICBjb25zdCBhZGRGb3JrSWQgPSAoaGFzaFR5cGUgJiBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSUQpID4gMDtcclxuICAgICAgICBjb25zdCBpc0J0aEZpZCA9IGlzQml0aGVyZXVtKHRoaXMubmV0d29yaykgJiYgKChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRF9CVEgpID4gMCk7IC8vIEJpdGhlcmV1bSBTSUdIQVNIX0ZPUktJRFxyXG4gICAgICAgIGlmIChhZGRGb3JrSWQgfHwgaXNCdGhGaWQpIHtcclxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgbXVzdCBwcm92aWRlIHZhbHVlYCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gc3VwZXIuaGFzaEZvcldpdG5lc3NWMChpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCB2YWx1ZSwgdGhpcy5hZGRGb3JrSWQoaGFzaFR5cGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN1cGVyLmhhc2hGb3JTaWduYXR1cmUoaW5JbmRleCwgcHJldm91dFNjcmlwdCwgaGFzaFR5cGUpO1xyXG4gIH1cclxuXHJcbiAgaGFzaEZvclNpZ25hdHVyZShpbkluZGV4OiBudW1iZXIsIHByZXZPdXRTY3JpcHQ6IEJ1ZmZlciwgaGFzaFR5cGU6IG51bWJlciwgdmFsdWU/OiBUTnVtYmVyKTogQnVmZmVyIHtcclxuICAgIHZhbHVlID0gdmFsdWUgPz8gKHRoaXMuaW5zW2luSW5kZXhdIGFzIGFueSkudmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcy5oYXNoRm9yU2lnbmF0dXJlQnlOZXR3b3JrKGluSW5kZXgsIHByZXZPdXRTY3JpcHQsIHZhbHVlLCBoYXNoVHlwZSk7XHJcbiAgfVxyXG5cclxuICBjbG9uZTxUTjIgZXh0ZW5kcyBiaWdpbnQgfCBudW1iZXIgPSBUTnVtYmVyPihhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50Jyk6IFV0eG9UcmFuc2FjdGlvbjxUTjI+IHtcclxuICAgIC8vIE5vIG5lZWQgdG8gY2xvbmUuIEV2ZXJ5dGhpbmcgaXMgY29waWVkIGluIHRoZSBjb25zdHJ1Y3Rvci5cclxuICAgIHJldHVybiBuZXcgVXR4b1RyYW5zYWN0aW9uPFROMj4odGhpcy5uZXR3b3JrLCB0aGlzLCBhbW91bnRUeXBlKTtcclxuICB9XHJcbn1cclxuIl19