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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXR4b1RyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL1V0eG9UcmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx1Q0FBc0M7QUFFdEMsMENBQXdGO0FBRXhGLFNBQWdCLFlBQVksQ0FBQyxLQUFhO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUNqRCxDQUFDO0FBSEQsb0NBR0M7QUFFRCxNQUFhLGVBQTBELFNBQVEsU0FBUyxDQUFDLFdBQW9CO0lBTTNHLFlBQ1MsT0FBZ0IsRUFDdkIsV0FBb0QsRUFDcEQsVUFBZ0M7UUFFaEMsS0FBSyxFQUFFLENBQUM7UUFKRCxZQUFPLEdBQVAsT0FBTyxDQUFTO1FBS3ZCLElBQUksV0FBVyxFQUFFO1lBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1lBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxJQUFJLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDM0IsNENBQTRDO2dCQUM1QyxNQUFNLFlBQVksR0FBRyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsWUFBWSxLQUFL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Y2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcclxuaW1wb3J0ICogYXMgYml0Y29pbmpzIGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgKiBhcyB2YXJ1aW50IGZyb20gJ3ZhcnVpbnQtYml0Y29pbic7XHJcbmltcG9ydCB7IHRvVE51bWJlciB9IGZyb20gJy4vdG51bWJlcic7XHJcblxyXG5pbXBvcnQgeyBuZXR3b3JrcywgTmV0d29yaywgZ2V0TWFpbm5ldCwgaXNCaXRjb2luR29sZCwgaXNCaXRoZXJldW0gfSBmcm9tICcuLi9uZXR3b3Jrcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFyU2xpY2VTaXplKHNsaWNlOiBCdWZmZXIpOiBudW1iZXIge1xyXG4gIGNvbnN0IGxlbmd0aCA9IHNsaWNlLmxlbmd0aDtcclxuICByZXR1cm4gdmFydWludC5lbmNvZGluZ0xlbmd0aChsZW5ndGgpICsgbGVuZ3RoO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVXR4b1RyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+IGV4dGVuZHMgYml0Y29pbmpzLlRyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICBzdGF0aWMgcmVhZG9ubHkgU0lHSEFTSF9GT1JLSUQgPSAweDQwO1xyXG4gIHN0YXRpYyByZWFkb25seSBTSUdIQVNIX0ZPUktJRF9CVEggPSAweDEwO1xyXG4gIC8qKiBAZGVwcmVjYXRlZCB1c2UgU0lHSEFTSF9GT1JLSUQgKi9cclxuICBzdGF0aWMgU0lHSEFTSF9CSVRDT0lOQ0FTSEJJUDE0MyA9IFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwdWJsaWMgbmV0d29yazogTmV0d29yayxcclxuICAgIHRyYW5zYWN0aW9uPzogYml0Y29pbmpzLlRyYW5zYWN0aW9uPGJpZ2ludCB8IG51bWJlcj4sXHJcbiAgICBhbW91bnRUeXBlPzogJ2JpZ2ludCcgfCAnbnVtYmVyJ1xyXG4gICkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIGlmICh0cmFuc2FjdGlvbikge1xyXG4gICAgICB0aGlzLnZlcnNpb24gPSB0cmFuc2FjdGlvbi52ZXJzaW9uO1xyXG4gICAgICB0aGlzLmxvY2t0aW1lID0gdHJhbnNhY3Rpb24ubG9ja3RpbWU7XHJcbiAgICAgIHRoaXMuaW5zID0gdHJhbnNhY3Rpb24uaW5zLm1hcCgodikgPT4gKHsgLi4udiwgd2l0bmVzczogWy4uLnYud2l0bmVzc10gfSkpO1xyXG4gICAgICBpZiAodHJhbnNhY3Rpb24ub3V0cy5sZW5ndGgpIHtcclxuICAgICAgICAvLyBhbW91bnRUeXBlIG9ubHkgbWF0dGVycyBpZiB0aGVyZSBhcmUgb3V0c1xyXG4gICAgICAgIGNvbnN0IGluQW1vdW50VHlwZSA9IHR5cGVvZiB0cmFuc2FjdGlvbi5vdXRzWzBdLnZhbHVlO1xyXG4gICAgICAgIGFzc2VydChpbkFtb3VudFR5cGUgPT09ICdudW1iZXInIHx8IGluQW1vdW50VHlwZSA9PT0gJ2JpZ2ludCcpO1xyXG4gICAgICAgIGNvbnN0IG91dEFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCcgPSBhbW91bnRUeXBlIHx8IGluQW1vdW50VHlwZTtcclxuICAgICAgICB0aGlzLm91dHMgPSB0cmFuc2FjdGlvbi5vdXRzLm1hcCgodikgPT4gKHsgLi4udiwgdmFsdWU6IHRvVE51bWJlcih2LnZhbHVlLCBvdXRBbW91bnRUeXBlKSB9KSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBzdGF0aWMgbmV3VHJhbnNhY3Rpb248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gICAgdHJhbnNhY3Rpb24/OiBiaXRjb2luanMuVHJhbnNhY3Rpb248YmlnaW50IHwgbnVtYmVyPixcclxuICAgIGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnXHJcbiAgKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICAgIHJldHVybiBuZXcgVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+KG5ldHdvcmssIHRyYW5zYWN0aW9uLCBhbW91bnRUeXBlKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBmcm9tQnVmZmVyPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgYnVmOiBCdWZmZXIsXHJcbiAgICBub1N0cmljdDogYm9vbGVhbixcclxuICAgIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCcgPSAnbnVtYmVyJyxcclxuICAgIG5ldHdvcms/OiBOZXR3b3JrLFxyXG4gICAgcHJldk91dHB1dD86IGJpdGNvaW5qcy5UeE91dHB1dDxUTnVtYmVyPltdXHJcbiAgKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICAgIGlmICghbmV0d29yaykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYG11c3QgcHJvdmlkZSBuZXR3b3JrYCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5uZXdUcmFuc2FjdGlvbjxUTnVtYmVyPihcclxuICAgICAgbmV0d29yayxcclxuICAgICAgYml0Y29pbmpzLlRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oYnVmLCBub1N0cmljdCwgYW1vdW50VHlwZSksXHJcbiAgICAgIGFtb3VudFR5cGVcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBhZGRGb3JrSWQoaGFzaFR5cGU6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAvKlxyXG4gICAgICBgYFRoZSBzaWdoYXNoIHR5cGUgaXMgYWx0ZXJlZCB0byBpbmNsdWRlIGEgMjQtYml0IGZvcmsgaWQgaW4gaXRzIG1vc3Qgc2lnbmlmaWNhbnQgYml0cy4nJ1xyXG4gICAgICBXZSBhbHNvIHVzZSB1bnNpZ25lZCByaWdodCBzaGlmdCBvcGVyYXRvciBgPj4+YCB0byBjYXN0IHRvIFVJbnQzMlxyXG4gICAgICBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9PcGVyYXRvcnMvVW5zaWduZWRfcmlnaHRfc2hpZnRcclxuICAgICAqL1xyXG4gICAgY29uc3QgaXNCdGhGaWQgPSBpc0JpdGhlcmV1bSh0aGlzLm5ldHdvcmspICYmIChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRF9CVEgpOyAvLyBCaXRoZXJldW0gU0lHSEFTSF9GT1JLSURcclxuICAgIGlmICgoaGFzaFR5cGUgJiBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSUQpIHx8IGlzQnRoRmlkKSB7XHJcbiAgICAgIGxldCBmb3JrSWQgPSBpc0JpdGNvaW5Hb2xkKHRoaXMubmV0d29yaykgPyA3OSA6IDA7XHJcbiAgICAgIGlmIChpc0J0aEZpZCkgZm9ya0lkID0gODU7IC8vIEJpdGhlcmV1bSBmb3JrIGlkXHJcbiAgICAgIHJldHVybiAoaGFzaFR5cGUgfCAoZm9ya0lkIDw8IDgpKSA+Pj4gMDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFzaFR5cGU7XHJcbiAgfVxyXG5cclxuICBoYXNoRm9yV2l0bmVzc1YwKGluSW5kZXg6IG51bWJlciwgcHJldk91dFNjcmlwdDogQnVmZmVyLCB2YWx1ZTogVE51bWJlciwgaGFzaFR5cGU6IG51bWJlcik6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gc3VwZXIuaGFzaEZvcldpdG5lc3NWMChpbkluZGV4LCBwcmV2T3V0U2NyaXB0LCB2YWx1ZSwgdGhpcy5hZGRGb3JrSWQoaGFzaFR5cGUpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGN1bGF0ZSB0aGUgaGFzaCB0byB2ZXJpZnkgdGhlIHNpZ25hdHVyZSBhZ2FpbnN0XHJcbiAgICovXHJcbiAgaGFzaEZvclNpZ25hdHVyZUJ5TmV0d29yayhcclxuICAgIGluSW5kZXg6IG51bWJlcixcclxuICAgIHByZXZvdXRTY3JpcHQ6IEJ1ZmZlcixcclxuICAgIHZhbHVlOiBUTnVtYmVyIHwgdW5kZWZpbmVkLFxyXG4gICAgaGFzaFR5cGU6IG51bWJlclxyXG4gICk6IEJ1ZmZlciB7XHJcbiAgICBzd2l0Y2ggKGdldE1haW5uZXQodGhpcy5uZXR3b3JrKSkge1xyXG4gICAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaWxsZWdhbCBzdGF0ZWApO1xyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgICAgLypcclxuICAgICAgICAgIEJpdGNvaW4gQ2FzaCBzdXBwb3J0cyBhIEZPUktJRCBmbGFnLiBXaGVuIHNldCwgd2UgaGFzaCB1c2luZyBoYXNoaW5nIGFsZ29yaXRobVxyXG4gICAgICAgICAgIHRoYXQgaXMgdXNlZCBmb3Igc2VncmVnYXRlZCB3aXRuZXNzIHRyYW5zYWN0aW9ucyAoZGVmaW5lZCBpbiBCSVAxNDMpLlxyXG5cclxuICAgICAgICAgIFRoZSBmbGFnIGlzIGFsc28gdXNlZCBieSBCaXRjb2luU1YgYW5kIEJpdGNvaW5Hb2xkXHJcblxyXG4gICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL3JlcGxheS1wcm90ZWN0ZWQtc2lnaGFzaC5tZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IGFkZEZvcmtJZCA9IChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCkgPiAwO1xyXG4gICAgICAgIGNvbnN0IGlzQnRoRmlkID0gaXNCaXRoZXJldW0odGhpcy5uZXR3b3JrKSAmJiAoKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEX0JUSCkgPiAwKTsgLy8gQml0aGVyZXVtIFNJR0hBU0hfRk9SS0lEXHJcbiAgICAgICAgaWYgKGFkZEZvcmtJZCB8fCBpc0J0aEZpZCkge1xyXG4gICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgdmFsdWVgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBzdXBlci5oYXNoRm9yV2l0bmVzc1YwKGluSW5kZXgsIHByZXZvdXRTY3JpcHQsIHZhbHVlLCB0aGlzLmFkZEZvcmtJZChoYXNoVHlwZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VwZXIuaGFzaEZvclNpZ25hdHVyZShpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCBoYXNoVHlwZSk7XHJcbiAgfVxyXG5cclxuICBoYXNoRm9yU2lnbmF0dXJlKGluSW5kZXg6IG51bWJlciwgcHJldk91dFNjcmlwdDogQnVmZmVyLCBoYXNoVHlwZTogbnVtYmVyLCB2YWx1ZT86IFROdW1iZXIpOiBCdWZmZXIge1xyXG4gICAgdmFsdWUgPSB2YWx1ZSA/PyAodGhpcy5pbnNbaW5JbmRleF0gYXMgYW55KS52YWx1ZTtcclxuICAgIHJldHVybiB0aGlzLmhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsoaW5JbmRleCwgcHJldk91dFNjcmlwdCwgdmFsdWUsIGhhc2hUeXBlKTtcclxuICB9XHJcblxyXG4gIGNsb25lPFROMiBleHRlbmRzIGJpZ2ludCB8IG51bWJlciA9IFROdW1iZXI+KGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnKTogVXR4b1RyYW5zYWN0aW9uPFROMj4ge1xyXG4gICAgLy8gTm8gbmVlZCB0byBjbG9uZS4gRXZlcnl0aGluZyBpcyBjb3BpZWQgaW4gdGhlIGNvbnN0cnVjdG9yLlxyXG4gICAgcmV0dXJuIG5ldyBVdHhvVHJhbnNhY3Rpb248VE4yPih0aGlzLm5ldHdvcmssIHRoaXMsIGFtb3VudFR5cGUpO1xyXG4gIH1cclxufVxyXG4iXX0=