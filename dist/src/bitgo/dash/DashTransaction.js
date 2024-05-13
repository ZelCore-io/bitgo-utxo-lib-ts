"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashTransaction = void 0;
const bufferutils_1 = require("bitcoinjs-lib/src/bufferutils");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const UtxoTransaction_1 = require("../UtxoTransaction");
const networks_1 = require("../../networks");
class DashTransaction extends UtxoTransaction_1.UtxoTransaction {
    constructor(network, tx, amountType) {
        super(network, tx, amountType);
        this.type = 0;
        if (!(0, networks_1.isDash)(network)) {
            throw new Error(`invalid network`);
        }
        if (tx) {
            this.version = tx.version;
            if (tx instanceof DashTransaction) {
                this.type = tx.type;
                this.extraPayload = tx.extraPayload;
            }
        }
        // since `__toBuffer` is private we have to do a little hack here
        this.__toBuffer = this.toBufferWithExtraPayload;
    }
    static newTransaction(network, transaction, amountType) {
        return new DashTransaction(network, transaction, amountType);
    }
    static fromBuffer(buffer, noStrict, amountType = 'number', network) {
        const tx = new DashTransaction(network, super.fromBuffer(buffer, true, amountType, network));
        tx.type = tx.version >> 16;
        tx.version = tx.version & 0xffff;
        if (tx.byteLength() !== buffer.length) {
            const bufferReader = new bufferutils_1.BufferReader(buffer, tx.byteLength());
            tx.extraPayload = bufferReader.readVarSlice();
        }
        return tx;
    }
    clone(amountType) {
        return new DashTransaction(this.network, this, amountType);
    }
    byteLength(_ALLOW_WITNESS) {
        return super.byteLength(_ALLOW_WITNESS) + (this.extraPayload ? (0, UtxoTransaction_1.varSliceSize)(this.extraPayload) : 0);
    }
    /**
     * Helper to override `__toBuffer()` of bitcoinjs.Transaction.
     * Since the method is private, we use a hack in the constructor to make it work.
     *
     * TODO: remove `private` modifier in bitcoinjs `__toBuffer()` or find some other solution
     *
     * @param buffer - optional target buffer
     * @param initialOffset - can only be undefined or 0. Other values are only used for serialization in blocks.
     * @param _ALLOW_WITNESS - ignored
     */
    toBufferWithExtraPayload(buffer, initialOffset, _ALLOW_WITNESS = false) {
        // We can ignore the `_ALLOW_WITNESS` parameter here since it has no effect.
        if (!buffer) {
            buffer = Buffer.allocUnsafe(this.byteLength(false));
        }
        if (initialOffset !== undefined && initialOffset !== 0) {
            throw new Error(`not supported`);
        }
        // Start out with regular bitcoin byte sequence.
        // This buffer will have excess size because it uses `byteLength()` to allocate.
        const baseBuffer = bitcoinjs_lib_1.Transaction.prototype.__toBuffer.call(this);
        baseBuffer.copy(buffer);
        // overwrite leading version bytes (uint16 version, uint16 type)
        const bufferWriter = new bufferutils_1.BufferWriter(buffer, 0);
        bufferWriter.writeUInt32((this.version & 0xffff) | (this.type << 16));
        // Seek to end of original byte sequence and add extraPayload.
        // We must use the byteLength as calculated by the bitcoinjs implementation since
        // `baseBuffer` has an excess size.
        if (this.extraPayload) {
            bufferWriter.offset = bitcoinjs_lib_1.Transaction.prototype.byteLength.call(this);
            bufferWriter.writeVarSlice(this.extraPayload);
        }
        return buffer;
    }
    getHash(forWitness) {
        if (forWitness) {
            throw new Error(`invalid argument`);
        }
        return bitcoinjs_lib_1.crypto.hash256(this.toBuffer());
    }
    /**
     * Build a hash for all or none of the transaction inputs depending on the hashtype
     * @param hashType
     * @returns Buffer
     */
    getPrevoutHash(hashType) {
        if (!(hashType & UtxoTransaction_1.UtxoTransaction.SIGHASH_ANYONECANPAY)) {
            const bufferWriter = new bufferutils_1.BufferWriter(Buffer.allocUnsafe(36 * this.ins.length));
            this.ins.forEach(function (txIn) {
                bufferWriter.writeSlice(txIn.hash);
                bufferWriter.writeUInt32(txIn.index);
            });
            return bitcoinjs_lib_1.crypto.hash256(bufferWriter.buffer);
        }
        return Buffer.alloc(32, 0);
    }
}
exports.DashTransaction = DashTransaction;
DashTransaction.DASH_NORMAL = 0;
DashTransaction.DASH_PROVIDER_REGISTER = 1;
DashTransaction.DASH_PROVIDER_UPDATE_SERVICE = 2;
DashTransaction.DASH_PROVIDER_UPDATE_REGISTRAR = 3;
DashTransaction.DASH_PROVIDER_UPDATE_REVOKE = 4;
DashTransaction.DASH_COINBASE = 5;
DashTransaction.DASH_QUORUM_COMMITMENT = 6;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGFzaFRyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpdGdvL2Rhc2gvRGFzaFRyYW5zYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtEQUEyRTtBQUMzRSxpREFBK0Q7QUFFL0Qsd0RBQW1FO0FBQ25FLDZDQUFpRDtBQUVqRCxNQUFhLGVBQTBELFNBQVEsaUNBQXdCO0lBWXJHLFlBQVksT0FBZ0IsRUFBRSxFQUFpQyxFQUFFLFVBQWdDO1FBQy9GLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBSjFCLFNBQUksR0FBRyxDQUFDLENBQUM7UUFNZCxJQUFJLENBQUMsSUFBQSxpQkFBTSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUNwQztRQUVELElBQUksRUFBRSxFQUFFO1lBQ04sSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO1lBRTFCLElBQUksRUFBRSxZQUFZLGVBQWUsRUFBRTtnQkFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUNwQixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUM7YUFDckM7U0FDRjtRQUVELGlFQUFpRTtRQUNoRSxJQUFZLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztJQUMzRCxDQUFDO0lBRVMsTUFBTSxDQUFDLGNBQWMsQ0FDN0IsT0FBZ0IsRUFDaEIsV0FBOEMsRUFDOUMsVUFBZ0M7UUFFaEMsT0FBTyxJQUFJLGVBQWUsQ0FBVSxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFFRCxNQUFNLENBQUMsVUFBVSxDQUNmLE1BQWMsRUFDZCxRQUFpQixFQUNqQixhQUFrQyxRQUFRLEVBQzFDLE9B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Q0FBQyxDQUFDLFFBQVEsR0FBRyxpQ0FBZSxDQUFDLG9CQUFvQixDQUFDLEVBQUU7WUFDdEQsTUFBTSxZQUFZLEdBQUcsSUFBSSwwQkFBWSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUVoRixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUk7Z0JBQzdCLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sc0JBQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzdDO1FBRUQsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3QixDQUFDOztBQWpJSCwwQ0FrSUM7QUFqSVEsMkJBQVcsR0FBRyxDQUFDLENBQUM7QUFDaEIsc0NBQXNCLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLDRDQUE0QixHQUFHLENBQUMsQ0FBQztBQUNqQyw4Q0FBOEIsR0FBRyxDQUFDLENBQUM7QUFDbkMsMkNBQTJCLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLDZCQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLHNDQUFzQixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZmZlclJlYWRlciwgQnVmZmVyV3JpdGVyIH0gZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvYnVmZmVydXRpbHMnO1xyXG5pbXBvcnQgeyBjcnlwdG8gYXMgYmNyeXB0bywgVHJhbnNhY3Rpb24gfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuXHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbiwgdmFyU2xpY2VTaXplIH0gZnJvbSAnLi4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgaXNEYXNoLCBOZXR3b3JrIH0gZnJvbSAnLi4vLi4vbmV0d29ya3MnO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhc2hUcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiBleHRlbmRzIFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgc3RhdGljIERBU0hfTk9STUFMID0gMDtcclxuICBzdGF0aWMgREFTSF9QUk9WSURFUl9SRUdJU1RFUiA9IDE7XHJcbiAgc3RhdGljIERBU0hfUFJPVklERVJfVVBEQVRFX1NFUlZJQ0UgPSAyO1xyXG4gIHN0YXRpYyBEQVNIX1BST1ZJREVSX1VQREFURV9SRUdJU1RSQVIgPSAzO1xyXG4gIHN0YXRpYyBEQVNIX1BST1ZJREVSX1VQREFURV9SRVZPS0UgPSA0O1xyXG4gIHN0YXRpYyBEQVNIX0NPSU5CQVNFID0gNTtcclxuICBzdGF0aWMgREFTSF9RVU9SVU1fQ09NTUlUTUVOVCA9IDY7XHJcblxyXG4gIHB1YmxpYyB0eXBlID0gMDtcclxuICBwdWJsaWMgZXh0cmFQYXlsb2FkPzogQnVmZmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihuZXR3b3JrOiBOZXR3b3JrLCB0eD86IFRyYW5zYWN0aW9uPGJpZ2ludCB8IG51bWJlcj4sIGFtb3VudFR5cGU/OiAnYmlnaW50JyB8ICdudW1iZXInKSB7XHJcbiAgICBzdXBlcihuZXR3b3JrLCB0eCwgYW1vdW50VHlwZSk7XHJcblxyXG4gICAgaWYgKCFpc0Rhc2gobmV0d29yaykpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHgpIHtcclxuICAgICAgdGhpcy52ZXJzaW9uID0gdHgudmVyc2lvbjtcclxuXHJcbiAgICAgIGlmICh0eCBpbnN0YW5jZW9mIERhc2hUcmFuc2FjdGlvbikge1xyXG4gICAgICAgIHRoaXMudHlwZSA9IHR4LnR5cGU7XHJcbiAgICAgICAgdGhpcy5leHRyYVBheWxvYWQgPSB0eC5leHRyYVBheWxvYWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzaW5jZSBgX190b0J1ZmZlcmAgaXMgcHJpdmF0ZSB3ZSBoYXZlIHRvIGRvIGEgbGl0dGxlIGhhY2sgaGVyZVxyXG4gICAgKHRoaXMgYXMgYW55KS5fX3RvQnVmZmVyID0gdGhpcy50b0J1ZmZlcldpdGhFeHRyYVBheWxvYWQ7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3RhdGljIG5ld1RyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgbmV0d29yazogTmV0d29yayxcclxuICAgIHRyYW5zYWN0aW9uPzogRGFzaFRyYW5zYWN0aW9uPG51bWJlciB8IGJpZ2ludD4sXHJcbiAgICBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50J1xyXG4gICk6IERhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICByZXR1cm4gbmV3IERhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPihuZXR3b3JrLCB0cmFuc2FjdGlvbiwgYW1vdW50VHlwZSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICAgIGJ1ZmZlcjogQnVmZmVyLFxyXG4gICAgbm9TdHJpY3Q6IGJvb2xlYW4sXHJcbiAgICBhbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnID0gJ251bWJlcicsXHJcbiAgICBuZXR3b3JrOiBOZXR3b3JrXHJcbiAgKTogRGFzaFRyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICAgIGNvbnN0IHR4ID0gbmV3IERhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPihuZXR3b3JrLCBzdXBlci5mcm9tQnVmZmVyPFROdW1iZXI+KGJ1ZmZlciwgdHJ1ZSwgYW1vdW50VHlwZSwgbmV0d29yaykpO1xyXG4gICAgdHgudHlwZSA9IHR4LnZlcnNpb24gPj4gMTY7XHJcbiAgICB0eC52ZXJzaW9uID0gdHgudmVyc2lvbiAmIDB4ZmZmZjtcclxuICAgIGlmICh0eC5ieXRlTGVuZ3RoKCkgIT09IGJ1ZmZlci5sZW5ndGgpIHtcclxuICAgICAgY29uc3QgYnVmZmVyUmVhZGVyID0gbmV3IEJ1ZmZlclJlYWRlcihidWZmZXIsIHR4LmJ5dGVMZW5ndGgoKSk7XHJcbiAgICAgIHR4LmV4dHJhUGF5bG9hZCA9IGJ1ZmZlclJlYWRlci5yZWFkVmFyU2xpY2UoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0eDtcclxuICB9XHJcblxyXG4gIGNsb25lPFROMiBleHRlbmRzIGJpZ2ludCB8IG51bWJlciA9IFROdW1iZXI+KGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnKTogRGFzaFRyYW5zYWN0aW9uPFROMj4ge1xyXG4gICAgcmV0dXJuIG5ldyBEYXNoVHJhbnNhY3Rpb248VE4yPih0aGlzLm5ldHdvcmssIHRoaXMsIGFtb3VudFR5cGUpO1xyXG4gIH1cclxuXHJcbiAgYnl0ZUxlbmd0aChfQUxMT1dfV0lUTkVTUz86IGJvb2xlYW4pOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHN1cGVyLmJ5dGVMZW5ndGgoX0FMTE9XX1dJVE5FU1MpICsgKHRoaXMuZXh0cmFQYXlsb2FkID8gdmFyU2xpY2VTaXplKHRoaXMuZXh0cmFQYXlsb2FkKSA6IDApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIHRvIG92ZXJyaWRlIGBfX3RvQnVmZmVyKClgIG9mIGJpdGNvaW5qcy5UcmFuc2FjdGlvbi5cclxuICAgKiBTaW5jZSB0aGUgbWV0aG9kIGlzIHByaXZhdGUsIHdlIHVzZSBhIGhhY2sgaW4gdGhlIGNvbnN0cnVjdG9yIHRvIG1ha2UgaXQgd29yay5cclxuICAgKlxyXG4gICAqIFRPRE86IHJlbW92ZSBgcHJpdmF0ZWAgbW9kaWZpZXIgaW4gYml0Y29pbmpzIGBfX3RvQnVmZmVyKClgIG9yIGZpbmQgc29tZSBvdGhlciBzb2x1dGlvblxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJ1ZmZlciAtIG9wdGlvbmFsIHRhcmdldCBidWZmZXJcclxuICAgKiBAcGFyYW0gaW5pdGlhbE9mZnNldCAtIGNhbiBvbmx5IGJlIHVuZGVmaW5lZCBvciAwLiBPdGhlciB2YWx1ZXMgYXJlIG9ubHkgdXNlZCBmb3Igc2VyaWFsaXphdGlvbiBpbiBibG9ja3MuXHJcbiAgICogQHBhcmFtIF9BTExPV19XSVRORVNTIC0gaWdub3JlZFxyXG4gICAqL1xyXG4gIHByaXZhdGUgdG9CdWZmZXJXaXRoRXh0cmFQYXlsb2FkKGJ1ZmZlcj86IEJ1ZmZlciwgaW5pdGlhbE9mZnNldD86IG51bWJlciwgX0FMTE9XX1dJVE5FU1MgPSBmYWxzZSk6IEJ1ZmZlciB7XHJcbiAgICAvLyBXZSBjYW4gaWdub3JlIHRoZSBgX0FMTE9XX1dJVE5FU1NgIHBhcmFtZXRlciBoZXJlIHNpbmNlIGl0IGhhcyBubyBlZmZlY3QuXHJcbiAgICBpZiAoIWJ1ZmZlcikge1xyXG4gICAgICBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUodGhpcy5ieXRlTGVuZ3RoKGZhbHNlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGluaXRpYWxPZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBpbml0aWFsT2Zmc2V0ICE9PSAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbm90IHN1cHBvcnRlZGApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0YXJ0IG91dCB3aXRoIHJlZ3VsYXIgYml0Y29pbiBieXRlIHNlcXVlbmNlLlxyXG4gICAgLy8gVGhpcyBidWZmZXIgd2lsbCBoYXZlIGV4Y2VzcyBzaXplIGJlY2F1c2UgaXQgdXNlcyBgYnl0ZUxlbmd0aCgpYCB0byBhbGxvY2F0ZS5cclxuICAgIGNvbnN0IGJhc2VCdWZmZXIgPSAoVHJhbnNhY3Rpb24ucHJvdG90eXBlIGFzIGFueSkuX190b0J1ZmZlci5jYWxsKHRoaXMpO1xyXG4gICAgYmFzZUJ1ZmZlci5jb3B5KGJ1ZmZlcik7XHJcblxyXG4gICAgLy8gb3ZlcndyaXRlIGxlYWRpbmcgdmVyc2lvbiBieXRlcyAodWludDE2IHZlcnNpb24sIHVpbnQxNiB0eXBlKVxyXG4gICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihidWZmZXIsIDApO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKCh0aGlzLnZlcnNpb24gJiAweGZmZmYpIHwgKHRoaXMudHlwZSA8PCAxNikpO1xyXG5cclxuICAgIC8vIFNlZWsgdG8gZW5kIG9mIG9yaWdpbmFsIGJ5dGUgc2VxdWVuY2UgYW5kIGFkZCBleHRyYVBheWxvYWQuXHJcbiAgICAvLyBXZSBtdXN0IHVzZSB0aGUgYnl0ZUxlbmd0aCBhcyBjYWxjdWxhdGVkIGJ5IHRoZSBiaXRjb2luanMgaW1wbGVtZW50YXRpb24gc2luY2VcclxuICAgIC8vIGBiYXNlQnVmZmVyYCBoYXMgYW4gZXhjZXNzIHNpemUuXHJcbiAgICBpZiAodGhpcy5leHRyYVBheWxvYWQpIHtcclxuICAgICAgYnVmZmVyV3JpdGVyLm9mZnNldCA9IFRyYW5zYWN0aW9uLnByb3RvdHlwZS5ieXRlTGVuZ3RoLmNhbGwodGhpcyk7XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVZhclNsaWNlKHRoaXMuZXh0cmFQYXlsb2FkKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVmZmVyO1xyXG4gIH1cclxuXHJcbiAgZ2V0SGFzaChmb3JXaXRuZXNzPzogYm9vbGVhbik6IEJ1ZmZlciB7XHJcbiAgICBpZiAoZm9yV2l0bmVzcykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgYXJndW1lbnRgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBiY3J5cHRvLmhhc2gyNTYodGhpcy50b0J1ZmZlcigpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkIGEgaGFzaCBmb3IgYWxsIG9yIG5vbmUgb2YgdGhlIHRyYW5zYWN0aW9uIGlucHV0cyBkZXBlbmRpbmcgb24gdGhlIGhhc2h0eXBlXHJcbiAgICogQHBhcmFtIGhhc2hUeXBlXHJcbiAgICogQHJldHVybnMgQnVmZmVyXHJcbiAgICovXHJcbiAgZ2V0UHJldm91dEhhc2goaGFzaFR5cGU6IG51bWJlcik6IEJ1ZmZlciB7XHJcbiAgICBpZiAoIShoYXNoVHlwZSAmIFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0FOWU9ORUNBTlBBWSkpIHtcclxuICAgICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2NVbnNhZmUoMzYgKiB0aGlzLmlucy5sZW5ndGgpKTtcclxuXHJcbiAgICAgIHRoaXMuaW5zLmZvckVhY2goZnVuY3Rpb24gKHR4SW4pIHtcclxuICAgICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZSh0eEluLmhhc2gpO1xyXG4gICAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0eEluLmluZGV4KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gYmNyeXB0by5oYXNoMjU2KGJ1ZmZlcldyaXRlci5idWZmZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMzIsIDApO1xyXG4gIH1cclxufVxyXG4iXX0=