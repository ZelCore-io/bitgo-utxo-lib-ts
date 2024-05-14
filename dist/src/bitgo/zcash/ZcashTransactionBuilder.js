"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZcashTransactionBuilder = void 0;
const types = require("bitcoinjs-lib/src/types");
const typeforce = require('typeforce');
const ZcashTransaction_1 = require("./ZcashTransaction");
const UtxoTransactionBuilder_1 = require("../UtxoTransactionBuilder");
const address_1 = require("./address");
class ZcashTransactionBuilder extends UtxoTransactionBuilder_1.UtxoTransactionBuilder {
    constructor(network) {
        super(network);
    }
    createInitialTransaction(network) {
        return new ZcashTransaction_1.ZcashTransaction(network);
    }
    static fromTransaction(transaction, network, prevOutput) {
        const txb = new ZcashTransactionBuilder(transaction.network);
        // Copy transaction fields
        txb.setVersion(transaction.version, !!transaction.overwintered);
        txb.setLockTime(transaction.locktime);
        // Copy Zcash overwinter fields. Omitted if the transaction builder is not for Zcash.
        if (txb.tx.isOverwinterCompatible()) {
            txb.setVersionGroupId(transaction.versionGroupId);
            txb.setExpiryHeight(transaction.expiryHeight);
        }
        txb.setConsensusBranchId(transaction.consensusBranchId);
        // Copy outputs (done first to avoid signature invalidation)
        transaction.outs.forEach(function (txOut) {
            txb.addOutput(txOut.script, txOut.value);
        });
        // Copy inputs
        transaction.ins.forEach(function (txIn) {
            txb.__addInputUnsafe(txIn.hash, txIn.index, {
                sequence: txIn.sequence,
                script: txIn.script,
                witness: txIn.witness,
                value: txIn.value,
            });
        });
        return txb;
    }
    setVersion(version, overwinter = true) {
        typeforce(types.UInt32, version);
        this.tx.overwintered = overwinter ? 1 : 0;
        this.tx.version = version;
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
    hasSignatures() {
        return this.__INPUTS.some(function (input) {
            return input.signatures !== undefined;
        });
    }
    setPropertyCheckSignatures(propName, value) {
        if (this.tx[propName] === value) {
            return;
        }
        if (this.hasSignatures()) {
            throw new Error(`Changing property ${propName} for a partially signed transaction would invalidate signatures`);
        }
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
    build() {
        return super.build();
    }
    buildIncomplete() {
        return super.buildIncomplete();
    }
    addOutput(scriptPubKey, value) {
        // Attempt to get a script if it's a base58 or bech32 address string
        if (typeof scriptPubKey === 'string') {
            scriptPubKey = (0, address_1.toOutputScript)(scriptPubKey, this.network);
        }
        return super.addOutput(scriptPubKey, value);
    }
}
exports.ZcashTransactionBuilder = ZcashTransactionBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWmNhc2hUcmFuc2FjdGlvbkJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYml0Z28vemNhc2gvWmNhc2hUcmFuc2FjdGlvbkJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsaURBQWlEO0FBQ2pELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUd2Qyx5REFLNEI7QUFDNUIsc0VBQW1FO0FBQ25FLHVDQUEyQztBQUUzQyxNQUFhLHVCQUFrRSxTQUFRLCtDQUd0RjtJQUNDLFlBQVksT0FBcUI7UUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFUyx3QkFBd0IsQ0FBQyxPQUFnQjtRQUNqRCxPQUFPLElBQUksbUNBQWdCLENBQVUsT0FBdUIsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxNQUFNLENBQUMsZUFBZSxDQUNwQixXQUFzQyxFQUN0QyxPQUFpQixFQUNqQixVQUEwQztRQUUxQyxNQUFNLEdBQUcsR0FBRyxJQUFJLHVCQUF1QixDQUFVLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV0RSwwQkFBMEI7UUFDMUIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDaEUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdEMscUZBQXFGO1FBQ3JGLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO1lBQ25DLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbEQsR0FBRyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDL0M7UUFFRCxHQUFHLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLGlCQUFp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LFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQsZUFBZSxDQUFDLFlBQW9CO1FBQ2xDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELEtBQUs7UUFDSCxPQUFPLEtBQUssQ0FBQyxLQUFLLEVBQStCLENBQUM7SUFDcEQsQ0FBQztJQUVELGVBQWU7UUFDYixPQUFPLEtBQUssQ0FBQyxlQUFlLEVBQStCLENBQUM7SUFDOUQsQ0FBQztJQUVELFNBQVMsQ0FBQyxZQUE2QixFQUFFLEtBQWM7UUFDckQsb0VBQW9FO1FBQ3BFLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLFlBQVksR0FBRyxJQUFBLHdCQUFjLEVBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxPQUFrQixDQUFDLENBQUM7U0FDdEU7UUFFRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQXpIRCwwREF5SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBiaXRjb2luanMgZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3R5cGVzJztcclxuY29uc3QgdHlwZWZvcmNlID0gcmVxdWlyZSgndHlwZWZvcmNlJyk7XHJcblxyXG5pbXBvcnQgeyBOZXR3b3JrIH0gZnJvbSAnLi4vLi4nO1xyXG5pbXBvcnQge1xyXG4gIGdldERlZmF1bHRDb25zZW5zdXNCcmFuY2hJZEZvclZlcnNpb24sXHJcbiAgZ2V0RGVmYXVsdFZlcnNpb25Hcm91cElkRm9yVmVyc2lvbixcclxuICBaY2FzaE5ldHdvcmssXHJcbiAgWmNhc2hUcmFuc2FjdGlvbixcclxufSBmcm9tICcuL1pjYXNoVHJhbnNhY3Rpb24nO1xyXG5pbXBvcnQgeyBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyIH0gZnJvbSAnLi4vVXR4b1RyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7IHRvT3V0cHV0U2NyaXB0IH0gZnJvbSAnLi9hZGRyZXNzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBaY2FzaFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiBleHRlbmRzIFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXI8XHJcbiAgVE51bWJlcixcclxuICBaY2FzaFRyYW5zYWN0aW9uPFROdW1iZXI+XHJcbj4ge1xyXG4gIGNvbnN0cnVjdG9yKG5ldHdvcms6IFpjYXNoTmV0d29yaykge1xyXG4gICAgc3VwZXIobmV0d29yayk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY3JlYXRlSW5pdGlhbFRyYW5zYWN0aW9uKG5ldHdvcms6IE5ldHdvcmspOiBaY2FzaFRyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICAgIHJldHVybiBuZXcgWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPihuZXR3b3JrIGFzIFpjYXNoTmV0d29yayk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbVRyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgdHJhbnNhY3Rpb246IFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgICBuZXR3b3JrPzogTmV0d29yayxcclxuICAgIHByZXZPdXRwdXQ/OiBiaXRjb2luanMuVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4gICk6IFpjYXNoVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+IHtcclxuICAgIGNvbnN0IHR4YiA9IG5ldyBaY2FzaFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPih0cmFuc2FjdGlvbi5uZXR3b3JrKTtcclxuXHJcbiAgICAvLyBDb3B5IHRyYW5zYWN0aW9uIGZpZWxkc1xyXG4gICAgdHhiLnNldFZlcnNpb24odHJhbnNhY3Rpb24udmVyc2lvbiwgISF0cmFuc2FjdGlvbi5vdmVyd2ludGVyZWQpO1xyXG4gICAgdHhiLnNldExvY2tUaW1lKHRyYW5zYWN0aW9uLmxvY2t0aW1lKTtcclxuXHJcbiAgICAvLyBDb3B5IFpjYXNoIG92ZXJ3aW50ZXIgZmllbGRzLiBPbWl0dGVkIGlmIHRoZSB0cmFuc2FjdGlvbiBidWlsZGVyIGlzIG5vdCBmb3IgWmNhc2guXHJcbiAgICBpZiAodHhiLnR4LmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgICB0eGIuc2V0VmVyc2lvbkdyb3VwSWQodHJhbnNhY3Rpb24udmVyc2lvbkdyb3VwSWQpO1xyXG4gICAgICB0eGIuc2V0RXhwaXJ5SGVpZ2h0KHRyYW5zYWN0aW9uLmV4cGlyeUhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgdHhiLnNldENvbnNlbnN1c0JyYW5jaElkKHRyYW5zYWN0aW9uLmNvbnNlbnN1c0JyYW5jaElkKTtcclxuXHJcbiAgICAvLyBDb3B5IG91dHB1dHMgKGRvbmUgZmlyc3QgdG8gYXZvaWQgc2lnbmF0dXJlIGludmFsaWRhdGlvbilcclxuICAgIHRyYW5zYWN0aW9uLm91dHMuZm9yRWFjaChmdW5jdGlvbiAodHhPdXQpIHtcclxuICAgICAgdHhiLmFkZE91dHB1dCh0eE91dC5zY3JpcHQsIHR4T3V0LnZhbHVlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENvcHkgaW5wdXRzXHJcbiAgICB0cmFuc2FjdGlvbi5pbnMuZm9yRWFjaChmdW5jdGlvbiAodHhJbikge1xyXG4gICAgICAodHhiIGFzIGFueSkuX19hZGRJbnB1dFVuc2FmZSh0eEluLmhhc2gsIHR4SW4uaW5kZXgsIHtcclxuICAgICAgICBzZXF1ZW5jZTogdHhJbi5zZXF1ZW5jZSxcclxuICAgICAgICBzY3JpcHQ6IHR4SW4uc2NyaXB0LFxyXG4gICAgICAgIHdpdG5lc3M6IHR4SW4ud2l0bmVzcyxcclxuICAgICAgICB2YWx1ZTogKHR4SW4gYXMgYW55KS52YWx1ZSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdHhiO1xyXG4gIH1cclxuXHJcbiAgc2V0VmVyc2lvbih2ZXJzaW9uOiBudW1iZXIsIG92ZXJ3aW50ZXIgPSB0cnVlKTogdm9pZCB7XHJcbiAgICB0eXBlZm9yY2UodHlwZXMuVUludDMyLCB2ZXJzaW9uKTtcclxuICAgIHRoaXMudHgub3ZlcndpbnRlcmVkID0gb3ZlcndpbnRlciA/IDEgOiAwO1xyXG4gICAgdGhpcy50eC52ZXJzaW9uID0gdmVyc2lvbjtcclxuICB9XHJcblxyXG4gIHNldERlZmF1bHRzRm9yVmVyc2lvbihuZXR3b3JrOiBOZXR3b3JrLCB2ZXJzaW9uOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN3aXRjaCAodmVyc2lvbikge1xyXG4gICAgICBjYXNlIDQ6XHJcbiAgICAgIGNhc2UgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfQ0FOT1BZOlxyXG4gICAgICBjYXNlIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX05VNTpcclxuICAgICAgICB0aGlzLnNldFZlcnNpb24oNCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgNTpcclxuICAgICAgY2FzZSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT041X0JSQU5DSF9OVTU6XHJcbiAgICAgICAgdGhpcy5zZXRWZXJzaW9uKDUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uICR7dmVyc2lvbn1gKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnR4LnZlcnNpb25Hcm91cElkID0gZ2V0RGVmYXVsdFZlcnNpb25Hcm91cElkRm9yVmVyc2lvbih2ZXJzaW9uKTtcclxuICAgIHRoaXMudHguY29uc2Vuc3VzQnJhbmNoSWQgPSBnZXREZWZhdWx0Q29uc2Vuc3VzQnJhbmNoSWRGb3JWZXJzaW9uKG5ldHdvcmssIHZlcnNpb24pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYXNTaWduYXR1cmVzKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSkuX19JTlBVVFMuc29tZShmdW5jdGlvbiAoaW5wdXQ6IHsgc2lnbmF0dXJlczogdW5rbm93biB9KSB7XHJcbiAgICAgIHJldHVybiBpbnB1dC5zaWduYXR1cmVzICE9PSB1bmRlZmluZWQ7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2V0UHJvcGVydHlDaGVja1NpZ25hdHVyZXMocHJvcE5hbWU6IGtleW9mIFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4sIHZhbHVlOiB1bmtub3duKSB7XHJcbiAgICBpZiAodGhpcy50eFtwcm9wTmFtZV0gPT09IHZhbHVlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLmhhc1NpZ25hdHVyZXMoKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENoYW5naW5nIHByb3BlcnR5ICR7cHJvcE5hbWV9IGZvciBhIHBhcnRpYWxseSBzaWduZWQgdHJhbnNhY3Rpb24gd291bGQgaW52YWxpZGF0ZSBzaWduYXR1cmVzYCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnR4W3Byb3BOYW1lXSA9IHZhbHVlIGFzIGFueTtcclxuICB9XHJcblxyXG4gIHNldENvbnNlbnN1c0JyYW5jaElkKGNvbnNlbnN1c0JyYW5jaElkOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHR5cGVmb3JjZSh0eXBlcy5VSW50MzIsIGNvbnNlbnN1c0JyYW5jaElkKTtcclxuICAgIHRoaXMuc2V0UHJvcGVydHlDaGVja1NpZ25hdHVyZXMoJ2NvbnNlbnN1c0JyYW5jaElkJywgY29uc2Vuc3VzQnJhbmNoSWQpO1xyXG4gIH1cclxuXHJcbiAgc2V0VmVyc2lvbkdyb3VwSWQodmVyc2lvbkdyb3VwSWQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgdHlwZWZvcmNlKHR5cGVzLlVJbnQzMiwgdmVyc2lvbkdyb3VwSWQpO1xyXG4gICAgdGhpcy5zZXRQcm9wZXJ0eUNoZWNrU2lnbmF0dXJlcygndmVyc2lvbkdyb3VwSWQnLCB2ZXJzaW9uR3JvdXBJZCk7XHJcbiAgfVxyXG5cclxuICBzZXRFeHBpcnlIZWlnaHQoZXhwaXJ5SGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHR5cGVmb3JjZSh0eXBlcy5VSW50MzIsIGV4cGlyeUhlaWdodCk7XHJcbiAgICB0aGlzLnNldFByb3BlcnR5Q2hlY2tTaWduYXR1cmVzKCdleHBpcnlIZWlnaHQnLCBleHBpcnlIZWlnaHQpO1xyXG4gIH1cclxuXHJcbiAgYnVpbGQoKTogWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICByZXR1cm4gc3VwZXIuYnVpbGQoKSBhcyBaY2FzaFRyYW5zYWN0aW9uPFROdW1iZXI+O1xyXG4gIH1cclxuXHJcbiAgYnVpbGRJbmNvbXBsZXRlKCk6IFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgcmV0dXJuIHN1cGVyLmJ1aWxkSW5jb21wbGV0ZSgpIGFzIFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj47XHJcbiAgfVxyXG5cclxuICBhZGRPdXRwdXQoc2NyaXB0UHViS2V5OiBzdHJpbmcgfCBCdWZmZXIsIHZhbHVlOiBUTnVtYmVyKTogbnVtYmVyIHtcclxuICAgIC8vIEF0dGVtcHQgdG8gZ2V0IGEgc2NyaXB0IGlmIGl0J3MgYSBiYXNlNTggb3IgYmVjaDMyIGFkZHJlc3Mgc3RyaW5nXHJcbiAgICBpZiAodHlwZW9mIHNjcmlwdFB1YktleSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgc2NyaXB0UHViS2V5ID0gdG9PdXRwdXRTY3JpcHQoc2NyaXB0UHViS2V5LCB0aGlzLm5ldHdvcmsgYXMgTmV0d29yayk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN1cGVyLmFkZE91dHB1dChzY3JpcHRQdWJLZXksIHZhbHVlKTtcclxuICB9XHJcbn1cclxuIl19