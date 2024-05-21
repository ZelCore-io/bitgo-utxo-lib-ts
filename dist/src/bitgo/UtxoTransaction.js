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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXR4b1RyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL1V0eG9UcmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx1Q0FBc0M7QUFFdEMsMENBQXdGO0FBQ3hGLHVDQUF1QztBQUV2QyxTQUFnQixZQUFZLENBQUMsS0FBYTtJQUN4QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzVCLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDakQsQ0FBQztBQUhELG9DQUdDO0FBRUQsTUFBYSxlQUEwRCxTQUFRLFNBQVMsQ0FBQyxXQUFvQjtJQU0zRyxZQUNTLE9BQWdCLEVBQ3ZCLFdBQW9ELEVBQ3BELFVBQWdDO1FBRWhDLEtBQUssRUFBRSxDQUFDO1FBSkQsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUt2QixJQUFJLFdBQVcsRUFBRTtZQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztZQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDckMsSUFBSSxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQzNCLDRDQUE0QztnQkFDNUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDdEQsTUFBTSxDQUFDLFlBQVksS0FBSyxRQUFRLElBQUksWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLGFBQWEsR0FBd0IsVUFBVSxJQUFJLFlBQVksQ0FBQztnQkFDdEUsSUFBSSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLG1CQUFTLEVBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUMvRjtTQUNGO0lBQ0gsQ0FBQztJQUVTLE1BQU0sQ0FBQyxjQUFjLENBQzdCLE9BQWdCLEVBQ2hCLFdBQW9ELEVBQ3BELFVBQWdDO1FBRWhDLE9BQU8sSUFBSSxlQUFlLENBQVUsT0FBTyxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsTUFBTSxDQUFDLFVBQVUsQ0FDZixHQUFXLEVBQ1gsUUFBaUIsRUFDakIsYUFBa0MsUUFBUSxFQUMxQyxPQUFpQixFQUNqQixVQUEwQztRQUUxQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1NBQ3pDO1FBQ0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUN4QixPQUFPLEVBQ1AsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQVUsR0FBRyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsRUFDcEUsVUFBVSxDQUNYLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUyxDQUFDLFFBQWdCO1FBQ3hCOzs7O1dBSUc7UUFDSCxNQUFNLFFBQVEsR0FBRyxJQUFBLHNCQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO1FBQzFILElBQUksQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxJQUFJLFFBQVEsRUFBRTtZQUMzRCxJQUFJLE1BQU0sR0FBRyxJQUFBLHdCQUFhLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRCxJQUFJLFFBQVE7Z0JBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQjtZQUMvQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELGdCQUFnQixDQUFDLE9BQWUsRUFBRSxhQUFxQixFQUFFLEtBQWMsRUFBRSxRQUFnQjtRQUN2RixPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDekYsQ0FBQztJQUVEOztPQUVHO0lBQ0gseUJBQXlCLENBQ3ZCLE9BQWUsRUFDZixhQUFxQixFQUNyQixLQUEwQixFQUMxQixRQUFnQjtRQUVoQixRQUFRLElBQUEscUJBQVUsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDaEMsS0FBSyxtQkFBUSxDQUFDLFdBQVc7Z0JBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDbkQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO3dCQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7cUJBQ3ZDO29CQUNELE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQ3ZHO2dCQUNELE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQTtZQUN2RixLQUFLLG1CQUFRLENBQUMsT0FBTyxDQUFDO1lBQ3RCLEtBQUssbUJBQVEsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxtQkFBUSxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLG1CQUFRLENBQUMsT0FBTyxDQUFDO1lBQ3RCLEtBQUssbUJBQVEsQ0FBQyxRQUFRLENBQUM7WUFDdkIsS0FBSyxtQkFBUSxDQUFDLE1BQU0sQ0FBQztZQUNyQixLQUFLLG1CQUFRLENBQUMsT0FBTyxDQUFDO1lBQ3RCLEtBQUssbUJBQVEsQ0FBQyxVQUFVLENBQUM7WUFDekIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztZQUN2QixLQUFLLG1CQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3JCLEtBQUssbUJBQVEsQ0FBQyxRQUFRLENBQUM7WUFDdkIsS0FBSyxtQkFBUSxDQUFDLEtBQUs7Z0JBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDbkMsS0FBSyxtQkFBUSxDQUFDLFdBQVcsQ0FBQztZQUMxQixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1lBQ3hCLEtBQUssbUJBQVEsQ0FBQyxXQUFXLENBQUM7WUFDMUIsS0FBSyxtQkFBUSxDQUFDLFNBQVMsQ0FBQztZQUN4QixLQUFLLG1CQUFRLENBQUMsS0FBSztnQkFDakI7Ozs7Ozs7bUJBT0c7Z0JBQ0gsTUFBTSxTQUFTLEdBQUcsQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxRQUFRLEdBQUcsSUFBQSxzQkFBVyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO2dCQUNoSSxJQUFJLFNBQVMsSUFBSSxRQUFRLEVBQUU7b0JBQ3pCLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTt3QkFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO3FCQUN2QztvQkFDRCxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7aUJBQ3hGO1NBQ0o7UUFFRCxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxPQUFlLEVBQUUsYUFBcUIsRUFBRSxRQUFnQixFQUFFLEtBQWU7UUFDeEYsS0FBSyxHQUFHLEtBQUssYUFBTCxLQUFLLGNBQUwsS0FBSyxHQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFTLENBQUMsS0FBSyxDQUFDO1FBQ2xELE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFFRCxLQUFLLENBQXdDLFVBQWdDO1FBQzNFLDZEQUE2RDtRQUM3RCxPQUFPLElBQUksZUFBZSxDQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7O0FBeElILDBDQXlJQztBQXhJaUIsOEJBQWMsR0FBRyxJQUFJLENBQUM7QUFDdEIsa0NBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQzFDLHFDQUFxQztBQUM5Qix5Q0FBeUIsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCAqIGFzIGJpdGNvaW5qcyBmcm9tICdiaXRjb2luanMtbGliJztcclxuaW1wb3J0ICogYXMgdmFydWludCBmcm9tICd2YXJ1aW50LWJpdGNvaW4nO1xyXG5pbXBvcnQgeyB0b1ROdW1iZXIgfSBmcm9tICcuL3RudW1iZXInO1xyXG5cclxuaW1wb3J0IHsgbmV0d29ya3MsIE5ldHdvcmssIGdldE1haW5uZXQsIGlzQml0Y29pbkdvbGQsIGlzQml0aGVyZXVtIH0gZnJvbSAnLi4vbmV0d29ya3MnO1xyXG5pbXBvcnQgKiBhcyBncnNUeCBmcm9tICcuL2dyb2VzdGxjb2luJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJTbGljZVNpemUoc2xpY2U6IEJ1ZmZlcik6IG51bWJlciB7XHJcbiAgY29uc3QgbGVuZ3RoID0gc2xpY2UubGVuZ3RoO1xyXG4gIHJldHVybiB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKGxlbmd0aCkgKyBsZW5ndGg7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBVdHhvVHJhbnNhY3Rpb248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4gZXh0ZW5kcyBiaXRjb2luanMuVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gIHN0YXRpYyByZWFkb25seSBTSUdIQVNIX0ZPUktJRCA9IDB4NDA7XHJcbiAgc3RhdGljIHJlYWRvbmx5IFNJR0hBU0hfRk9SS0lEX0JUSCA9IDB4MTA7XHJcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBTSUdIQVNIX0ZPUktJRCAqL1xyXG4gIHN0YXRpYyBTSUdIQVNIX0JJVENPSU5DQVNIQklQMTQzID0gVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHB1YmxpYyBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gICAgdHJhbnNhY3Rpb24/OiBiaXRjb2luanMuVHJhbnNhY3Rpb248YmlnaW50IHwgbnVtYmVyPixcclxuICAgIGFtb3VudFR5cGU/OiAnYmlnaW50JyB8ICdudW1iZXInXHJcbiAgKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgaWYgKHRyYW5zYWN0aW9uKSB7XHJcbiAgICAgIHRoaXMudmVyc2lvbiA9IHRyYW5zYWN0aW9uLnZlcnNpb247XHJcbiAgICAgIHRoaXMubG9ja3RpbWUgPSB0cmFuc2FjdGlvbi5sb2NrdGltZTtcclxuICAgICAgdGhpcy5pbnMgPSB0cmFuc2FjdGlvbi5pbnMubWFwKCh2KSA9PiAoeyAuLi52LCB3aXRuZXNzOiBbLi4udi53aXRuZXNzXSB9KSk7XHJcbiAgICAgIGlmICh0cmFuc2FjdGlvbi5vdXRzLmxlbmd0aCkge1xyXG4gICAgICAgIC8vIGFtb3VudFR5cGUgb25seSBtYXR0ZXJzIGlmIHRoZXJlIGFyZSBvdXRzXHJcbiAgICAgICAgY29uc3QgaW5BbW91bnRUeXBlID0gdHlwZW9mIHRyYW5zYWN0aW9uLm91dHNbMF0udmFsdWU7XHJcbiAgICAgICAgYXNzZXJ0KGluQW1vdW50VHlwZSA9PT0gJ251bWJlcicgfHwgaW5BbW91bnRUeXBlID09PSAnYmlnaW50Jyk7XHJcbiAgICAgICAgY29uc3Qgb3V0QW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9IGFtb3VudFR5cGUgfHwgaW5BbW91bnRUeXBlO1xyXG4gICAgICAgIHRoaXMub3V0cyA9IHRyYW5zYWN0aW9uLm91dHMubWFwKCh2KSA9PiAoeyAuLi52LCB2YWx1ZTogdG9UTnVtYmVyKHYudmFsdWUsIG91dEFtb3VudFR5cGUpIH0pKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHN0YXRpYyBuZXdUcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICAgIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgICB0cmFuc2FjdGlvbj86IGJpdGNvaW5qcy5UcmFuc2FjdGlvbjxiaWdpbnQgfCBudW1iZXI+LFxyXG4gICAgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuICApOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgcmV0dXJuIG5ldyBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4obmV0d29yaywgdHJhbnNhY3Rpb24sIGFtb3VudFR5cGUpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZyb21CdWZmZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgICBidWY6IEJ1ZmZlcixcclxuICAgIG5vU3RyaWN0OiBib29sZWFuLFxyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInLFxyXG4gICAgbmV0d29yaz86IE5ldHdvcmssXHJcbiAgICBwcmV2T3V0cHV0PzogYml0Y29pbmpzLlR4T3V0cHV0PFROdW1iZXI+W11cclxuICApOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgaWYgKCFuZXR3b3JrKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbXVzdCBwcm92aWRlIG5ldHdvcmtgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm5ld1RyYW5zYWN0aW9uPFROdW1iZXI+KFxyXG4gICAgICBuZXR3b3JrLFxyXG4gICAgICBiaXRjb2luanMuVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcjxUTnVtYmVyPihidWYsIG5vU3RyaWN0LCBhbW91bnRUeXBlKSxcclxuICAgICAgYW1vdW50VHlwZVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGFkZEZvcmtJZChoYXNoVHlwZTogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIC8qXHJcbiAgICAgIGBgVGhlIHNpZ2hhc2ggdHlwZSBpcyBhbHRlcmVkIHRvIGluY2x1ZGUgYSAyNC1iaXQgZm9yayBpZCBpbiBpdHMgbW9zdCBzaWduaWZpY2FudCBiaXRzLicnXHJcbiAgICAgIFdlIGFsc28gdXNlIHVuc2lnbmVkIHJpZ2h0IHNoaWZ0IG9wZXJhdG9yIGA+Pj5gIHRvIGNhc3QgdG8gVUludDMyXHJcbiAgICAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL09wZXJhdG9ycy9VbnNpZ25lZF9yaWdodF9zaGlmdFxyXG4gICAgICovXHJcbiAgICBjb25zdCBpc0J0aEZpZCA9IGlzQml0aGVyZXVtKHRoaXMubmV0d29yaykgJiYgKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEX0JUSCk7IC8vIEJpdGhlcmV1bSBTSUdIQVNIX0ZPUktJRFxyXG4gICAgaWYgKChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCkgfHwgaXNCdGhGaWQpIHtcclxuICAgICAgbGV0IGZvcmtJZCA9IGlzQml0Y29pbkdvbGQodGhpcy5uZXR3b3JrKSA/IDc5IDogMDtcclxuICAgICAgaWYgKGlzQnRoRmlkKSBmb3JrSWQgPSA4NTsgLy8gQml0aGVyZXVtIGZvcmsgaWRcclxuICAgICAgcmV0dXJuIChoYXNoVHlwZSB8IChmb3JrSWQgPDwgOCkpID4+PiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYXNoVHlwZTtcclxuICB9XHJcblxyXG4gIGhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleDogbnVtYmVyLCBwcmV2T3V0U2NyaXB0OiBCdWZmZXIsIHZhbHVlOiBUTnVtYmVyLCBoYXNoVHlwZTogbnVtYmVyKTogQnVmZmVyIHtcclxuICAgIHJldHVybiBzdXBlci5oYXNoRm9yV2l0bmVzc1YwKGluSW5kZXgsIHByZXZPdXRTY3JpcHQsIHZhbHVlLCB0aGlzLmFkZEZvcmtJZChoYXNoVHlwZSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsY3VsYXRlIHRoZSBoYXNoIHRvIHZlcmlmeSB0aGUgc2lnbmF0dXJlIGFnYWluc3RcclxuICAgKi9cclxuICBoYXNoRm9yU2lnbmF0dXJlQnlOZXR3b3JrKFxyXG4gICAgaW5JbmRleDogbnVtYmVyLFxyXG4gICAgcHJldm91dFNjcmlwdDogQnVmZmVyLFxyXG4gICAgdmFsdWU6IFROdW1iZXIgfCB1bmRlZmluZWQsXHJcbiAgICBoYXNoVHlwZTogbnVtYmVyXHJcbiAgKTogQnVmZmVyIHtcclxuICAgIHN3aXRjaCAoZ2V0TWFpbm5ldCh0aGlzLm5ldHdvcmspKSB7XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuZ3JvZXN0bGNvaW46XHJcbiAgICAgICAgaWYgKChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCkgPiAwKSB7XHJcbiAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG11c3QgcHJvdmlkZSB2YWx1ZWApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGdyc1R4Lmhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleCwgcHJldm91dFNjcmlwdCwgdmFsdWUsIHRoaXMuYWRkRm9ya0lkKGhhc2hUeXBlKSwgc3VwZXIuY2xvbmUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBncnNUeC5oYXNoRm9yU2lnbmF0dXJlKGluSW5kZXgsIHByZXZvdXRTY3JpcHQsIGhhc2hUeXBlLCB2YWx1ZSwgc3VwZXIuY2xvbmUoKSlcclxuICAgICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaWxsZWdhbCBzdGF0ZWApO1xyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgICAgLypcclxuICAgICAgICAgIEJpdGNvaW4gQ2FzaCBzdXBwb3J0cyBhIEZPUktJRCBmbGFnLiBXaGVuIHNldCwgd2UgaGFzaCB1c2luZyBoYXNoaW5nIGFsZ29yaXRobVxyXG4gICAgICAgICAgIHRoYXQgaXMgdXNlZCBmb3Igc2VncmVnYXRlZCB3aXRuZXNzIHRyYW5zYWN0aW9ucyAoZGVmaW5lZCBpbiBCSVAxNDMpLlxyXG5cclxuICAgICAgICAgIFRoZSBmbGFnIGlzIGFsc28gdXNlZCBieSBCaXRjb2luU1YgYW5kIEJpdGNvaW5Hb2xkXHJcblxyXG4gICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL3JlcGxheS1wcm90ZWN0ZWQtc2lnaGFzaC5tZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IGFkZEZvcmtJZCA9IChoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCkgPiAwO1xyXG4gICAgICAgIGNvbnN0IGlzQnRoRmlkID0gaXNCaXRoZXJldW0odGhpcy5uZXR3b3JrKSAmJiAoKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEX0JUSCkgPiAwKTsgLy8gQml0aGVyZXVtIFNJR0hBU0hfRk9SS0lEXHJcbiAgICAgICAgaWYgKGFkZEZvcmtJZCB8fCBpc0J0aEZpZCkge1xyXG4gICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgdmFsdWVgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBzdXBlci5oYXNoRm9yV2l0bmVzc1YwKGluSW5kZXgsIHByZXZvdXRTY3JpcHQsIHZhbHVlLCB0aGlzLmFkZEZvcmtJZChoYXNoVHlwZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VwZXIuaGFzaEZvclNpZ25hdHVyZShpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCBoYXNoVHlwZSk7XHJcbiAgfVxyXG5cclxuICBoYXNoRm9yU2lnbmF0dXJlKGluSW5kZXg6IG51bWJlciwgcHJldk91dFNjcmlwdDogQnVmZmVyLCBoYXNoVHlwZTogbnVtYmVyLCB2YWx1ZT86IFROdW1iZXIpOiBCdWZmZXIge1xyXG4gICAgdmFsdWUgPSB2YWx1ZSA/PyAodGhpcy5pbnNbaW5JbmRleF0gYXMgYW55KS52YWx1ZTtcclxuICAgIHJldHVybiB0aGlzLmhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsoaW5JbmRleCwgcHJldk91dFNjcmlwdCwgdmFsdWUsIGhhc2hUeXBlKTtcclxuICB9XHJcblxyXG4gIGNsb25lPFROMiBleHRlbmRzIGJpZ2ludCB8IG51bWJlciA9IFROdW1iZXI+KGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnKTogVXR4b1RyYW5zYWN0aW9uPFROMj4ge1xyXG4gICAgLy8gTm8gbmVlZCB0byBjbG9uZS4gRXZlcnl0aGluZyBpcyBjb3BpZWQgaW4gdGhlIGNvbnN0cnVjdG9yLlxyXG4gICAgcmV0dXJuIG5ldyBVdHhvVHJhbnNhY3Rpb248VE4yPih0aGlzLm5ldHdvcmssIHRoaXMsIGFtb3VudFR5cGUpO1xyXG4gIH1cclxufVxyXG4iXX0=