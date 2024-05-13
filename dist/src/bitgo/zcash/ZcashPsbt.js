"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZcashPsbt = void 0;
const UtxoPsbt_1 = require("../UtxoPsbt");
const ZcashTransaction_1 = require("./ZcashTransaction");
const __1 = require("../../");
const bip174_1 = require("bip174");
const types = require("bitcoinjs-lib/src/types");
const PsbtUtil_1 = require("../PsbtUtil");
const typeforce = require('typeforce');
const CONSENSUS_BRANCH_ID_KEY = Buffer.concat([
    Buffer.of(0xfc),
    Buffer.of(0x05),
    Buffer.from(PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER),
    Buffer.of(PsbtUtil_1.ProprietaryKeySubtype.ZEC_CONSENSUS_BRANCH_ID),
]);
class ZcashPsbt extends UtxoPsbt_1.UtxoPsbt {
    static transactionFromBuffer(buffer, network) {
        return ZcashTransaction_1.ZcashTransaction.fromBuffer(buffer, false, 'bigint', network);
    }
    static createPsbt(opts, data) {
        return new ZcashPsbt(opts, data || new bip174_1.Psbt(new __1.PsbtTransaction({ tx: new ZcashTransaction_1.ZcashTransaction(opts.network) })));
    }
    /**
     * In version < 5 of Zcash transactions, the consensus branch ID is not serialized in the transaction
     * whereas in version 5 it is. If the transaction is less than a version 5, set the consensus branch id
     * in the global map in the psbt. If it is a version 5 transaction, throw an error if the consensus
     * branch id is set in the psbt (because it should be on the transaction already).
     * @param buffer Psbt buffer
     * @param opts options
     */
    static fromBuffer(buffer, opts) {
        var _a;
        const psbt = super.fromBuffer(buffer, opts);
        // Read `consensusBranchId` from the global-map
        let consensusBranchId = undefined;
        (_a = psbt.data.globalMap.unknownKeyVals) === null || _a === void 0 ? void 0 : _a.forEach(({ key, value }, i) => {
            if (key.equals(CONSENSUS_BRANCH_ID_KEY)) {
                consensusBranchId = value.readUint32LE();
            }
        });
        switch (psbt.tx.version) {
            case 4:
            case ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_CANOPY:
            case ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_NU5:
                if (!consensusBranchId || !psbt.data.globalMap.unknownKeyVals) {
                    throw new Error('Could not find consensus branch id on psbt for version 4 Zcash transaction');
                }
                psbt.tx.consensusBranchId = consensusBranchId;
                psbt.data.globalMap.unknownKeyVals = psbt.data.globalMap.unknownKeyVals.filter(({ key }) => key !== CONSENSUS_BRANCH_ID_KEY);
                // Delete consensusBranchId from globalMap so that if we were to serialize the psbt again
                // we would not add a duplicate key into the global map
                psbt.data.globalMap.unknownKeyVals.pop();
                return psbt;
            case 5:
            case ZcashTransaction_1.ZcashTransaction.VERSION5_BRANCH_NU5:
                if (consensusBranchId) {
                    throw new Error('Found consensus branch id in psbt global-map for version 5 Zcash transaction');
                }
                return psbt;
            default:
                throw new Error(`Unsupported transaction version ${psbt.tx.version}`);
        }
    }
    /**
     * If it is a version 4 transaction, add the consensus branch id to
     * the global map. If it is a version 5 transaction, just return the
     * buffer because the consensus branch id is already serialized in
     * the transaction.
     */
    toBuffer() {
        if (this.tx.version === 5 || this.tx.version === ZcashTransaction_1.ZcashTransaction.VERSION5_BRANCH_NU5) {
            return super.toBuffer();
        }
        const value = Buffer.alloc(4);
        value.writeUint32LE(this.tx.consensusBranchId);
        this.addUnknownKeyValToGlobal({ key: CONSENSUS_BRANCH_ID_KEY, value });
        if (!this.data.globalMap.unknownKeyVals) {
            throw new Error('Failed adding consensus branch id to unknownKeyVals');
        }
        const buff = super.toBuffer();
        this.data.globalMap.unknownKeyVals.pop();
        return buff;
    }
    setVersion(version, overwinter = true) {
        typeforce(types.UInt32, version);
        this.tx.overwintered = overwinter ? 1 : 0;
        this.tx.version = version;
        return this;
    }
    setDefaultsForVersion(network, version) {
        switch (version) {
            case 4:
            case ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_CANOPY:
            case ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_NU5:
                this.setVersion(4);
                break;
            case 5:
            case ZcashTransaction_1.ZcashTransaction.VERSION5_BRANCH_NU5:
                this.setVersion(5);
                break;
            default:
                throw new Error(`invalid version ${version}`);
        }
        this.tx.versionGroupId = (0, ZcashTransaction_1.getDefaultVersionGroupIdForVersion)(version);
        this.tx.consensusBranchId = (0, ZcashTransaction_1.getDefaultConsensusBranchIdForVersion)(network, version);
    }
    // For Zcash transactions, we do not have to have non-witness UTXO data for non-segwit
    // transactions because zcash hashes the value directly. Thus, it is unnecessary to have
    // the previous transaction hash on the unspent.
    signInput(inputIndex, keyPair, sighashTypes) {
        return (0, PsbtUtil_1.withUnsafeNonSegwit)(this, super.signInput.bind(this, inputIndex, keyPair, sighashTypes));
    }
    validateSignaturesOfInput(inputIndex, validator, pubkey) {
        return (0, PsbtUtil_1.withUnsafeNonSegwit)(this, super.validateSignaturesOfInput.bind(this, inputIndex, validator, pubkey));
    }
    setPropertyCheckSignatures(propName, value) {
        if (this.tx[propName] === value) {
            return;
        }
        this.checkForSignatures(propName);
        this.tx[propName] = value;
    }
    setConsensusBranchId(consensusBranchId) {
        typeforce(types.UInt32, consensusBranchId);
        this.setPropertyCheckSignatures('consensusBranchId', consensusBranchId);
    }
    setVersionGroupId(versionGroupId) {
        typeforce(types.UInt32, versionGroupId);
        this.setPropertyCheckSignatures('versionGroupId', versionGroupId);
    }
    setExpiryHeight(expiryHeight) {
        typeforce(types.UInt32, expiryHeight);
        this.setPropertyCheckSignatures('expiryHeight', expiryHeight);
    }
}
exports.ZcashPsbt = ZcashPsbt;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWmNhc2hQc2J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpdGdvL3pjYXNoL1pjYXNoUHNidC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwwQ0FBaUQ7QUFDakQseURBSTRCO0FBQzVCLDhCQUEwRDtBQUMxRCxtQ0FBMEM7QUFDMUMsaURBQWlEO0FBRWpELDBDQUFzRztBQUN0RyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFdkMsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzVDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ2YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7SUFDZixNQUFNLENBQUMsSUFBSSxDQUFDLHNDQUEyQixDQUFDO0lBQ3hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0NBQXFCLENBQUMsdUJBQXVCLENBQUM7Q0FDekQsQ0FBQyxDQUFDO0FBRUgsTUFBYSxTQUFVLFNBQVEsbUJBQWtDO0lBQ3JELE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsT0FBZ0I7UUFDckUsT0FBTyxtQ0FBZ0IsQ0FBQyxVQUFVLENBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0UsQ0FBQztJQUVELE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBYyxFQUFFLElBQWU7UUFDL0MsT0FBTyxJQUFJLFNBQVMsQ0FDbEIsSUFBSSxFQUNKLElBQUksSUFBSSxJQUFJLGFBQVEsQ0FBQyxJQUFJLG1CQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxtQ0FBZ0IsQ0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQzlGLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBYyxFQUFFLElBQWM7O1FBQzlD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b1BzYnQgfSBmcm9tICcuLi9VdHhvUHNidCc7XHJcbmltcG9ydCB7XHJcbiAgZ2V0RGVmYXVsdENvbnNlbnN1c0JyYW5jaElkRm9yVmVyc2lvbixcclxuICBnZXREZWZhdWx0VmVyc2lvbkdyb3VwSWRGb3JWZXJzaW9uLFxyXG4gIFpjYXNoVHJhbnNhY3Rpb24sXHJcbn0gZnJvbSAnLi9aY2FzaFRyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgTmV0d29yaywgUHNidFRyYW5zYWN0aW9uLCBTaWduZXIgfSBmcm9tICcuLi8uLi8nO1xyXG5pbXBvcnQgeyBQc2J0IGFzIFBzYnRCYXNlIH0gZnJvbSAnYmlwMTc0JztcclxuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvdHlwZXMnO1xyXG5pbXBvcnQgeyBWYWxpZGF0ZVNpZ0Z1bmN0aW9uIH0gZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvcHNidCc7XHJcbmltcG9ydCB7IFByb3ByaWV0YXJ5S2V5U3VidHlwZSwgUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSLCB3aXRoVW5zYWZlTm9uU2Vnd2l0IH0gZnJvbSAnLi4vUHNidFV0aWwnO1xyXG5jb25zdCB0eXBlZm9yY2UgPSByZXF1aXJlKCd0eXBlZm9yY2UnKTtcclxuXHJcbmNvbnN0IENPTlNFTlNVU19CUkFOQ0hfSURfS0VZID0gQnVmZmVyLmNvbmNhdChbXHJcbiAgQnVmZmVyLm9mKDB4ZmMpLFxyXG4gIEJ1ZmZlci5vZigweDA1KSxcclxuICBCdWZmZXIuZnJvbShQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIpLFxyXG4gIEJ1ZmZlci5vZihQcm9wcmlldGFyeUtleVN1YnR5cGUuWkVDX0NPTlNFTlNVU19CUkFOQ0hfSUQpLFxyXG5dKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBaY2FzaFBzYnQgZXh0ZW5kcyBVdHhvUHNidDxaY2FzaFRyYW5zYWN0aW9uPGJpZ2ludD4+IHtcclxuICBwcm90ZWN0ZWQgc3RhdGljIHRyYW5zYWN0aW9uRnJvbUJ1ZmZlcihidWZmZXI6IEJ1ZmZlciwgbmV0d29yazogTmV0d29yayk6IFpjYXNoVHJhbnNhY3Rpb248YmlnaW50PiB7XHJcbiAgICByZXR1cm4gWmNhc2hUcmFuc2FjdGlvbi5mcm9tQnVmZmVyPGJpZ2ludD4oYnVmZmVyLCBmYWxzZSwgJ2JpZ2ludCcsIG5ldHdvcmspO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNyZWF0ZVBzYnQob3B0czogUHNidE9wdHMsIGRhdGE/OiBQc2J0QmFzZSk6IFpjYXNoUHNidCB7XHJcbiAgICByZXR1cm4gbmV3IFpjYXNoUHNidChcclxuICAgICAgb3B0cyxcclxuICAgICAgZGF0YSB8fCBuZXcgUHNidEJhc2UobmV3IFBzYnRUcmFuc2FjdGlvbih7IHR4OiBuZXcgWmNhc2hUcmFuc2FjdGlvbjxiaWdpbnQ+KG9wdHMubmV0d29yaykgfSkpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW4gdmVyc2lvbiA8IDUgb2YgWmNhc2ggdHJhbnNhY3Rpb25zLCB0aGUgY29uc2Vuc3VzIGJyYW5jaCBJRCBpcyBub3Qgc2VyaWFsaXplZCBpbiB0aGUgdHJhbnNhY3Rpb25cclxuICAgKiB3aGVyZWFzIGluIHZlcnNpb24gNSBpdCBpcy4gSWYgdGhlIHRyYW5zYWN0aW9uIGlzIGxlc3MgdGhhbiBhIHZlcnNpb24gNSwgc2V0IHRoZSBjb25zZW5zdXMgYnJhbmNoIGlkXHJcbiAgICogaW4gdGhlIGdsb2JhbCBtYXAgaW4gdGhlIHBzYnQuIElmIGl0IGlzIGEgdmVyc2lvbiA1IHRyYW5zYWN0aW9uLCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgY29uc2Vuc3VzXHJcbiAgICogYnJhbmNoIGlkIGlzIHNldCBpbiB0aGUgcHNidCAoYmVjYXVzZSBpdCBzaG91bGQgYmUgb24gdGhlIHRyYW5zYWN0aW9uIGFscmVhZHkpLlxyXG4gICAqIEBwYXJhbSBidWZmZXIgUHNidCBidWZmZXJcclxuICAgKiBAcGFyYW0gb3B0cyBvcHRpb25zXHJcbiAgICovXHJcbiAgc3RhdGljIGZyb21CdWZmZXIoYnVmZmVyOiBCdWZmZXIsIG9wdHM6IFBzYnRPcHRzKTogVXR4b1BzYnQ8WmNhc2hUcmFuc2FjdGlvbjxiaWdpbnQ+PiB7XHJcbiAgICBjb25zdCBwc2J0ID0gc3VwZXIuZnJvbUJ1ZmZlcihidWZmZXIsIG9wdHMpIGFzIFpjYXNoUHNidDtcclxuXHJcbiAgICAvLyBSZWFkIGBjb25zZW5zdXNCcmFuY2hJZGAgZnJvbSB0aGUgZ2xvYmFsLW1hcFxyXG4gICAgbGV0IGNvbnNlbnN1c0JyYW5jaElkOiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcbiAgICBwc2J0LmRhdGEuZ2xvYmFsTWFwLnVua25vd25LZXlWYWxzPy5mb3JFYWNoKCh7IGtleSwgdmFsdWUgfSwgaSkgPT4ge1xyXG4gICAgICBpZiAoa2V5LmVxdWFscyhDT05TRU5TVVNfQlJBTkNIX0lEX0tFWSkpIHtcclxuICAgICAgICBjb25zZW5zdXNCcmFuY2hJZCA9IHZhbHVlLnJlYWRVaW50MzJMRSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHN3aXRjaCAocHNidC50eC52ZXJzaW9uKSB7XHJcbiAgICAgIGNhc2UgNDpcclxuICAgICAgY2FzZSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT040X0JSQU5DSF9DQU5PUFk6XHJcbiAgICAgIGNhc2UgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfTlU1OlxyXG4gICAgICAgIGlmICghY29uc2Vuc3VzQnJhbmNoSWQgfHwgIXBzYnQuZGF0YS5nbG9iYWxNYXAudW5rbm93bktleVZhbHMpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgY29uc2Vuc3VzIGJyYW5jaCBpZCBvbiBwc2J0IGZvciB2ZXJzaW9uIDQgWmNhc2ggdHJhbnNhY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHNidC50eC5jb25zZW5zdXNCcmFuY2hJZCA9IGNvbnNlbnN1c0JyYW5jaElkO1xyXG4gICAgICAgIHBzYnQuZGF0YS5nbG9iYWxNYXAudW5rbm93bktleVZhbHMgPSBwc2J0LmRhdGEuZ2xvYmFsTWFwLnVua25vd25LZXlWYWxzLmZpbHRlcihcclxuICAgICAgICAgICh7IGtleSB9KSA9PiBrZXkgIT09IENPTlNFTlNVU19CUkFOQ0hfSURfS0VZXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gRGVsZXRlIGNvbnNlbnN1c0JyYW5jaElkIGZyb20gZ2xvYmFsTWFwIHNvIHRoYXQgaWYgd2Ugd2VyZSB0byBzZXJpYWxpemUgdGhlIHBzYnQgYWdhaW5cclxuICAgICAgICAvLyB3ZSB3b3VsZCBub3QgYWRkIGEgZHVwbGljYXRlIGtleSBpbnRvIHRoZSBnbG9iYWwgbWFwXHJcbiAgICAgICAgcHNidC5kYXRhLmdsb2JhbE1hcC51bmtub3duS2V5VmFscy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gcHNidDtcclxuICAgICAgY2FzZSA1OlxyXG4gICAgICBjYXNlIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjVfQlJBTkNIX05VNTpcclxuICAgICAgICBpZiAoY29uc2Vuc3VzQnJhbmNoSWQpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRm91bmQgY29uc2Vuc3VzIGJyYW5jaCBpZCBpbiBwc2J0IGdsb2JhbC1tYXAgZm9yIHZlcnNpb24gNSBaY2FzaCB0cmFuc2FjdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHNidDtcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHRyYW5zYWN0aW9uIHZlcnNpb24gJHtwc2J0LnR4LnZlcnNpb259YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiBpdCBpcyBhIHZlcnNpb24gNCB0cmFuc2FjdGlvbiwgYWRkIHRoZSBjb25zZW5zdXMgYnJhbmNoIGlkIHRvXHJcbiAgICogdGhlIGdsb2JhbCBtYXAuIElmIGl0IGlzIGEgdmVyc2lvbiA1IHRyYW5zYWN0aW9uLCBqdXN0IHJldHVybiB0aGVcclxuICAgKiBidWZmZXIgYmVjYXVzZSB0aGUgY29uc2Vuc3VzIGJyYW5jaCBpZCBpcyBhbHJlYWR5IHNlcmlhbGl6ZWQgaW5cclxuICAgKiB0aGUgdHJhbnNhY3Rpb24uXHJcbiAgICovXHJcbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcclxuICAgIGlmICh0aGlzLnR4LnZlcnNpb24gPT09IDUgfHwgdGhpcy50eC52ZXJzaW9uID09PSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT041X0JSQU5DSF9OVTUpIHtcclxuICAgICAgcmV0dXJuIHN1cGVyLnRvQnVmZmVyKCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB2YWx1ZSA9IEJ1ZmZlci5hbGxvYyg0KTtcclxuICAgIHZhbHVlLndyaXRlVWludDMyTEUodGhpcy50eC5jb25zZW5zdXNCcmFuY2hJZCk7XHJcbiAgICB0aGlzLmFkZFVua25vd25LZXlWYWxUb0dsb2JhbCh7IGtleTogQ09OU0VOU1VTX0JSQU5DSF9JRF9LRVksIHZhbHVlIH0pO1xyXG4gICAgaWYgKCF0aGlzLmRhdGEuZ2xvYmFsTWFwLnVua25vd25LZXlWYWxzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIGFkZGluZyBjb25zZW5zdXMgYnJhbmNoIGlkIHRvIHVua25vd25LZXlWYWxzJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBidWZmID0gc3VwZXIudG9CdWZmZXIoKTtcclxuICAgIHRoaXMuZGF0YS5nbG9iYWxNYXAudW5rbm93bktleVZhbHMucG9wKCk7XHJcbiAgICByZXR1cm4gYnVmZjtcclxuICB9XHJcblxyXG4gIHNldFZlcnNpb24odmVyc2lvbjogbnVtYmVyLCBvdmVyd2ludGVyID0gdHJ1ZSk6IHRoaXMge1xyXG4gICAgdHlwZWZvcmNlKHR5cGVzLlVJbnQzMiwgdmVyc2lvbik7XHJcbiAgICB0aGlzLnR4Lm92ZXJ3aW50ZXJlZCA9IG92ZXJ3aW50ZXIgPyAxIDogMDtcclxuICAgIHRoaXMudHgudmVyc2lvbiA9IHZlcnNpb247XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHNldERlZmF1bHRzRm9yVmVyc2lvbihuZXR3b3JrOiBOZXR3b3JrLCB2ZXJzaW9uOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN3aXRjaCAodmVyc2lvbikge1xyXG4gICAgICBjYXNlIDQ6XHJcbiAgICAgIGNhc2UgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfQ0FOT1BZOlxyXG4gICAgICBjYXNlIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX05VNTpcclxuICAgICAgICB0aGlzLnNldFZlcnNpb24oNCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgNTpcclxuICAgICAgY2FzZSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT041X0JSQU5DSF9OVTU6XHJcbiAgICAgICAgdGhpcy5zZXRWZXJzaW9uKDUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uICR7dmVyc2lvbn1gKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnR4LnZlcnNpb25Hcm91cElkID0gZ2V0RGVmYXVsdFZlcnNpb25Hcm91cElkRm9yVmVyc2lvbih2ZXJzaW9uKTtcclxuICAgIHRoaXMudHguY29uc2Vuc3VzQnJhbmNoSWQgPSBnZXREZWZhdWx0Q29uc2Vuc3VzQnJhbmNoSWRGb3JWZXJzaW9uKG5ldHdvcmssIHZlcnNpb24pO1xyXG4gIH1cclxuXHJcbiAgLy8gRm9yIFpjYXNoIHRyYW5zYWN0aW9ucywgd2UgZG8gbm90IGhhdmUgdG8gaGF2ZSBub24td2l0bmVzcyBVVFhPIGRhdGEgZm9yIG5vbi1zZWd3aXRcclxuICAvLyB0cmFuc2FjdGlvbnMgYmVjYXVzZSB6Y2FzaCBoYXNoZXMgdGhlIHZhbHVlIGRpcmVjdGx5LiBUaHVzLCBpdCBpcyB1bm5lY2Vzc2FyeSB0byBoYXZlXHJcbiAgLy8gdGhlIHByZXZpb3VzIHRyYW5zYWN0aW9uIGhhc2ggb24gdGhlIHVuc3BlbnQuXHJcbiAgc2lnbklucHV0KGlucHV0SW5kZXg6IG51bWJlciwga2V5UGFpcjogU2lnbmVyLCBzaWdoYXNoVHlwZXM/OiBudW1iZXJbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHdpdGhVbnNhZmVOb25TZWd3aXQodGhpcywgc3VwZXIuc2lnbklucHV0LmJpbmQodGhpcywgaW5wdXRJbmRleCwga2V5UGFpciwgc2lnaGFzaFR5cGVzKSk7XHJcbiAgfVxyXG5cclxuICB2YWxpZGF0ZVNpZ25hdHVyZXNPZklucHV0KGlucHV0SW5kZXg6IG51bWJlciwgdmFsaWRhdG9yOiBWYWxpZGF0ZVNpZ0Z1bmN0aW9uLCBwdWJrZXk/OiBCdWZmZXIpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB3aXRoVW5zYWZlTm9uU2Vnd2l0KHRoaXMsIHN1cGVyLnZhbGlkYXRlU2lnbmF0dXJlc09mSW5wdXQuYmluZCh0aGlzLCBpbnB1dEluZGV4LCB2YWxpZGF0b3IsIHB1YmtleSkpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRQcm9wZXJ0eUNoZWNrU2lnbmF0dXJlcyhwcm9wTmFtZToga2V5b2YgWmNhc2hUcmFuc2FjdGlvbjxiaWdpbnQ+LCB2YWx1ZTogdW5rbm93bikge1xyXG4gICAgaWYgKHRoaXMudHhbcHJvcE5hbWVdID09PSB2YWx1ZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmNoZWNrRm9yU2lnbmF0dXJlcyhwcm9wTmFtZSk7XHJcbiAgICB0aGlzLnR4W3Byb3BOYW1lXSA9IHZhbHVlIGFzIGFueTtcclxuICB9XHJcblxyXG4gIHNldENvbnNlbnN1c0JyYW5jaElkKGNvbnNlbnN1c0JyYW5jaElkOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHR5cGVmb3JjZSh0eXBlcy5VSW50MzIsIGNvbnNlbnN1c0JyYW5jaElkKTtcclxuICAgIHRoaXMuc2V0UHJvcGVydHlDaGVja1NpZ25hdHVyZXMoJ2NvbnNlbnN1c0JyYW5jaElkJywgY29uc2Vuc3VzQnJhbmNoSWQpO1xyXG4gIH1cclxuXHJcbiAgc2V0VmVyc2lvbkdyb3VwSWQodmVyc2lvbkdyb3VwSWQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgdHlwZWZvcmNlKHR5cGVzLlVJbnQzMiwgdmVyc2lvbkdyb3VwSWQpO1xyXG4gICAgdGhpcy5zZXRQcm9wZXJ0eUNoZWNrU2lnbmF0dXJlcygndmVyc2lvbkdyb3VwSWQnLCB2ZXJzaW9uR3JvdXBJZCk7XHJcbiAgfVxyXG5cclxuICBzZXRFeHBpcnlIZWlnaHQoZXhwaXJ5SGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHR5cGVmb3JjZSh0eXBlcy5VSW50MzIsIGV4cGlyeUhlaWdodCk7XHJcbiAgICB0aGlzLnNldFByb3BlcnR5Q2hlY2tTaWduYXR1cmVzKCdleHBpcnlIZWlnaHQnLCBleHBpcnlIZWlnaHQpO1xyXG4gIH1cclxufVxyXG4iXX0=