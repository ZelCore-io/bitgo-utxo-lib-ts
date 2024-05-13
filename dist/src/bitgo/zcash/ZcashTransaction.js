"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZcashTransaction = exports.getDefaultConsensusBranchIdForVersion = exports.getDefaultVersionGroupIdForVersion = exports.UnsupportedTransactionError = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const types = require("bitcoinjs-lib/src/types");
const bufferutils_1 = require("bitcoinjs-lib/src/bufferutils");
const varuint = require('varuint-bitcoin');
const typeforce = require('typeforce');
const UtxoTransaction_1 = require("../UtxoTransaction");
const ZcashBufferutils_1 = require("./ZcashBufferutils");
const hashZip0244_1 = require("./hashZip0244");
const ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
// https://github.com/zcash/zcash/blob/v4.7.0/src/primitives/transaction.h#L40
const SAPLING_VERSION_GROUP_ID = 0x892f2085;
// https://github.com/zcash/zcash/blob/v4.7.0/src/primitives/transaction.h#L52
const ZIP225_VERSION_GROUP_ID = 0x26a7270a;
// https://github.com/zcash/zcash/blob/v4.7.0/src/consensus/upgrades.cpp#L11
const OVERWINTER_BRANCH_ID = 0x5ba81b19;
const CANOPY_BRANCH_ID = 0xe9ff75a6;
const NU5_BRANCH_ID = 0xc2d6d0b4;
class UnsupportedTransactionError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.UnsupportedTransactionError = UnsupportedTransactionError;
function getDefaultVersionGroupIdForVersion(version) {
    switch (version) {
        case 400:
        case 450:
            return SAPLING_VERSION_GROUP_ID;
        case 500:
            return ZIP225_VERSION_GROUP_ID;
    }
    throw new Error(`no value for version ${version}`);
}
exports.getDefaultVersionGroupIdForVersion = getDefaultVersionGroupIdForVersion;
function getDefaultConsensusBranchIdForVersion(network, version) {
    switch (version) {
        case 1:
        case 2:
            return 0;
        case 3:
            return OVERWINTER_BRANCH_ID;
        case ZcashTransaction.VERSION4_BRANCH_CANOPY:
            // https://zips.z.cash/zip-0251
            return CANOPY_BRANCH_ID;
        case 4:
        case 5:
        case ZcashTransaction.VERSION4_BRANCH_NU5:
        case ZcashTransaction.VERSION5_BRANCH_NU5:
            // https://zips.z.cash/zip-0252
            return NU5_BRANCH_ID;
    }
    throw new Error(`no value for version ${version}`);
}
exports.getDefaultConsensusBranchIdForVersion = getDefaultConsensusBranchIdForVersion;
class ZcashTransaction extends UtxoTransaction_1.UtxoTransaction {
    constructor(network, tx, amountType) {
        super(network, tx, amountType);
        this.network = network;
        // 1 if the transaction is post overwinter upgrade, 0 otherwise
        this.overwintered = 0;
        // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
        this.versionGroupId = 0;
        // Block height after which this transactions will expire, or 0 to disable expiry
        this.expiryHeight = 0;
        let consensusBranchId;
        if (tx) {
            this.overwintered = tx.overwintered;
            this.versionGroupId = tx.versionGroupId;
            this.expiryHeight = tx.expiryHeight;
            if (tx.consensusBranchId !== undefined) {
                consensusBranchId = tx.consensusBranchId;
            }
        }
        this.consensusBranchId = consensusBranchId !== null && consensusBranchId !== void 0 ? consensusBranchId : getDefaultConsensusBranchIdForVersion(network, this.version);
    }
    static fromBuffer(buffer, __noStrict, amountType = 'number', network) {
        /* istanbul ignore next */
        if (!network) {
            throw new Error(`must provide network`);
        }
        const bufferReader = new bufferutils_1.BufferReader(buffer);
        const tx = new ZcashTransaction(network);
        tx.version = bufferReader.readInt32();
        // Split the header into fOverwintered and nVersion
        // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L772
        tx.overwintered = tx.version >>> 31; // Must be 1 for version 3 and up
        tx.version = tx.version & 0x07fffffff; // 3 for overwinter
        tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(network, tx.version);
        if (tx.isOverwinterCompatible()) {
            tx.versionGroupId = bufferReader.readUInt32();
        }
        if (tx.version === 5) {
            (0, ZcashBufferutils_1.fromBufferV5)(bufferReader, tx, amountType);
        }
        else {
            (0, ZcashBufferutils_1.fromBufferV4)(bufferReader, tx, amountType);
        }
        if (__noStrict)
            return tx;
        if (bufferReader.offset !== buffer.length) {
            const trailing = buffer.slice(bufferReader.offset);
            throw new Error(`Unexpected trailing bytes: ${trailing.toString('hex')}`);
        }
        return tx;
    }
    static fromBufferWithVersion(buf, network, version, amountType = 'number') {
        const tx = ZcashTransaction.fromBuffer(buf, false, amountType, network);
        if (version) {
            tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(network, version);
        }
        return tx;
    }
    byteLength() {
        let byteLength = super.byteLength();
        if (this.isOverwinterCompatible()) {
            byteLength += 4; // nVersionGroupId
        }
        if (this.isOverwinterCompatible()) {
            byteLength += 4; // nExpiryHeight
        }
        const emptyVectorLength = varuint.encodingLength(0);
        if (this.version === 5) {
            // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L822
            byteLength += 4; // consensusBranchId
            byteLength += emptyVectorLength; // saplingBundle inputs
            byteLength += emptyVectorLength; // saplingBundle outputs
            byteLength += 1; // orchardBundle (empty)
        }
        else {
            if (this.isSaplingCompatible()) {
                // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L862
                byteLength += 8; // valueBalance (uint64)
                byteLength += emptyVectorLength; // inputs
                byteLength += emptyVectorLength; // outputs
            }
            if (this.supportsJoinSplits()) {
                //
                byteLength += emptyVectorLength; // joinsplits
            }
        }
        return byteLength;
    }
    isSaplingCompatible() {
        return !!this.overwintered && this.version >= ZcashTransaction.VERSION_SAPLING;
    }
    isOverwinterCompatible() {
        return !!this.overwintered && this.version >= ZcashTransaction.VERSION_OVERWINTER;
    }
    supportsJoinSplits() {
        return !!this.overwintered && this.version >= ZcashTransaction.VERSION_JOINSPLITS_SUPPORT;
    }
    /**
     * Build a hash for all or none of the transaction inputs depending on the hashtype
     * @param hashType
     * @returns Buffer - BLAKE2b hash or 256-bit zero if doesn't apply
     */
    getPrevoutHash(hashType) {
        if (!(hashType & bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY)) {
            const bufferWriter = new bufferutils_1.BufferWriter(Buffer.allocUnsafe(36 * this.ins.length));
            this.ins.forEach(function (txIn) {
                bufferWriter.writeSlice(txIn.hash);
                bufferWriter.writeUInt32(txIn.index);
            });
            return (0, hashZip0244_1.getBlake2bHash)(bufferWriter.buffer, 'ZcashPrevoutHash');
        }
        return ZERO;
    }
    /**
     * Build a hash for all or none of the transactions inputs sequence numbers depending on the hashtype
     * @param hashType
     * @returns Buffer BLAKE2b hash or 256-bit zero if doesn't apply
     */
    getSequenceHash(hashType) {
        if (!(hashType & bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY) &&
            (hashType & 0x1f) !== bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE &&
            (hashType & 0x1f) !== bitcoinjs_lib_1.Transaction.SIGHASH_NONE) {
            const bufferWriter = new bufferutils_1.BufferWriter(Buffer.allocUnsafe(4 * this.ins.length));
            this.ins.forEach(function (txIn) {
                bufferWriter.writeUInt32(txIn.sequence);
            });
            return (0, hashZip0244_1.getBlake2bHash)(bufferWriter.buffer, 'ZcashSequencHash');
        }
        return ZERO;
    }
    /**
     * Build a hash for one, all or none of the transaction outputs depending on the hashtype
     * @param hashType
     * @param inIndex
     * @returns Buffer BLAKE2b hash or 256-bit zero if doesn't apply
     */
    getOutputsHash(hashType, inIndex) {
        if ((hashType & 0x1f) !== bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE && (hashType & 0x1f) !== bitcoinjs_lib_1.Transaction.SIGHASH_NONE) {
            // Find out the size of the outputs and write them
            const txOutsSize = this.outs.reduce(function (sum, output) {
                return sum + 8 + (0, UtxoTransaction_1.varSliceSize)(output.script);
            }, 0);
            const bufferWriter = new bufferutils_1.BufferWriter(Buffer.allocUnsafe(txOutsSize));
            this.outs.forEach(function (out) {
                bufferWriter.writeUInt64(out.value);
                bufferWriter.writeVarSlice(out.script);
            });
            return (0, hashZip0244_1.getBlake2bHash)(bufferWriter.buffer, 'ZcashOutputsHash');
        }
        else if ((hashType & 0x1f) === bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
            // Write only the output specified in inIndex
            const output = this.outs[inIndex];
            const bufferWriter = new bufferutils_1.BufferWriter(Buffer.allocUnsafe(8 + (0, UtxoTransaction_1.varSliceSize)(output.script)));
            bufferWriter.writeUInt64(output.value);
            bufferWriter.writeVarSlice(output.script);
            return (0, hashZip0244_1.getBlake2bHash)(bufferWriter.buffer, 'ZcashOutputsHash');
        }
        return ZERO;
    }
    /**
     * Hash transaction for signing a transparent transaction in Zcash. Protected transactions are not supported.
     * @param inIndex
     * @param prevOutScript
     * @param value
     * @param hashType
     * @returns Buffer BLAKE2b hash
     */
    hashForSignatureByNetwork(inIndex, prevOutScript, value, hashType) {
        if (value === undefined) {
            throw new Error(`must provide value`);
        }
        // https://github.com/zcash/zcash/blob/v4.5.1/src/script/interpreter.cpp#L1175
        if (this.version === 5) {
            return (0, hashZip0244_1.getSignatureDigest)(this, inIndex, prevOutScript, value, hashType);
        }
        // ZCash amounts are always within Number.MAX_SAFE_INTEGER
        value = typeof value === 'bigint' ? Number(value) : value;
        typeforce(types.tuple(types.UInt32, types.Buffer, types.Number), [inIndex, prevOutScript, value]);
        if (inIndex === undefined) {
            throw new Error(`invalid inIndex`);
        }
        /* istanbul ignore next */
        if (inIndex >= this.ins.length) {
            throw new Error('Input index is out of range');
        }
        /* istanbul ignore next */
        if (!this.isOverwinterCompatible()) {
            throw new Error(`unsupported version ${this.version}`);
        }
        const hashPrevouts = this.getPrevoutHash(hashType);
        const hashSequence = this.getSequenceHash(hashType);
        const hashOutputs = this.getOutputsHash(hashType, inIndex);
        const hashJoinSplits = ZERO;
        const hashShieldedSpends = ZERO;
        const hashShieldedOutputs = ZERO;
        let baseBufferSize = 0;
        baseBufferSize += 4 * 5; // header, nVersionGroupId, lock_time, nExpiryHeight, hashType
        baseBufferSize += 32 * 4; // 256 hashes: hashPrevouts, hashSequence, hashOutputs, hashJoinSplits
        baseBufferSize += 4 * 2; // input.index, input.sequence
        baseBufferSize += 8; // value
        baseBufferSize += 32; // input.hash
        baseBufferSize += (0, UtxoTransaction_1.varSliceSize)(prevOutScript); // prevOutScript
        if (this.isSaplingCompatible()) {
            baseBufferSize += 32 * 2; // hashShieldedSpends and hashShieldedOutputs
            baseBufferSize += 8; // valueBalance
        }
        const mask = this.overwintered ? 1 : 0;
        const header = this.version | (mask << 31);
        const bufferWriter = new bufferutils_1.BufferWriter(Buffer.alloc(baseBufferSize));
        bufferWriter.writeInt32(header);
        bufferWriter.writeUInt32(this.versionGroupId);
        bufferWriter.writeSlice(hashPrevouts);
        bufferWriter.writeSlice(hashSequence);
        bufferWriter.writeSlice(hashOutputs);
        bufferWriter.writeSlice(hashJoinSplits);
        if (this.isSaplingCompatible()) {
            bufferWriter.writeSlice(hashShieldedSpends);
            bufferWriter.writeSlice(hashShieldedOutputs);
        }
        bufferWriter.writeUInt32(this.locktime);
        bufferWriter.writeUInt32(this.expiryHeight);
        if (this.isSaplingCompatible()) {
            bufferWriter.writeSlice(ZcashBufferutils_1.VALUE_INT64_ZERO);
        }
        bufferWriter.writeInt32(hashType);
        // The input being signed (replacing the scriptSig with scriptCode + amount)
        // The prevout may already be contained in hashPrevout, and the nSequence
        // may already be contained in hashSequence.
        const input = this.ins[inIndex];
        bufferWriter.writeSlice(input.hash);
        bufferWriter.writeUInt32(input.index);
        bufferWriter.writeVarSlice(prevOutScript);
        bufferWriter.writeUInt64(value);
        bufferWriter.writeUInt32(input.sequence);
        const personalization = Buffer.alloc(16);
        const prefix = 'ZcashSigHash';
        personalization.write(prefix);
        personalization.writeUInt32LE(this.consensusBranchId, prefix.length);
        return (0, hashZip0244_1.getBlake2bHash)(bufferWriter.buffer, personalization);
    }
    toBuffer(buffer, initialOffset = 0) {
        if (!buffer)
            buffer = Buffer.allocUnsafe(this.byteLength());
        const bufferWriter = new bufferutils_1.BufferWriter(buffer, initialOffset);
        if (this.isOverwinterCompatible()) {
            const mask = this.overwintered ? 1 : 0;
            bufferWriter.writeInt32(this.version | (mask << 31)); // Set overwinter bit
            bufferWriter.writeUInt32(this.versionGroupId);
        }
        else {
            bufferWriter.writeInt32(this.version);
        }
        if (this.version === 5) {
            (0, ZcashBufferutils_1.toBufferV5)(bufferWriter, this);
        }
        else {
            (0, ZcashBufferutils_1.toBufferV4)(bufferWriter, this);
        }
        if (initialOffset !== undefined) {
            return buffer.slice(initialOffset, bufferWriter.offset);
        }
        return buffer;
    }
    getHash(forWitness) {
        if (forWitness) {
            throw new Error(`invalid argument`);
        }
        if (this.version === 5) {
            return (0, hashZip0244_1.getTxidDigest)(this);
        }
        return bitcoinjs_lib_1.crypto.hash256(this.toBuffer());
    }
    clone(amountType) {
        return new ZcashTransaction(this.network, this, amountType);
    }
}
exports.ZcashTransaction = ZcashTransaction;
ZcashTransaction.VERSION_JOINSPLITS_SUPPORT = 2;
ZcashTransaction.VERSION_OVERWINTER = 3;
ZcashTransaction.VERSION_SAPLING = 4;
ZcashTransaction.VERSION4_BRANCH_CANOPY = 400;
ZcashTransaction.VERSION4_BRANCH_NU5 = 450;
ZcashTransaction.VERSION5_BRANCH_NU5 = 500;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWmNhc2hUcmFuc2FjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby96Y2FzaC9aY2FzaFRyYW5zYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsK0RBQTJFO0FBRTNFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUd2Qyx3REFBbUU7QUFDbkUseURBQTBHO0FBQzFHLCtDQUFrRjtBQUVsRixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBSXBHLDhFQUE4RTtBQUM5RSxNQUFNLHdCQUF3QixHQUFHLFVBQVUsQ0FBQztBQUM1Qyw4RUFBOEU7QUFDOUUsTUFBTSx1QkFBdUIsR0FBRyxVQUFVLENBQUM7QUFFM0MsNEVBQTRFO0FBQzVFLE1BQU0sb0JBQW9CLEdBQUcsVUFBVSxDQUFDO0FBQ3hDLE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDO0FBQ3BDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQztBQUVqQyxNQUFhLDJCQUE0QixTQUFRLEtBQUs7SUFDcEQsWUFBWSxPQUFlO1FBQ3pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUFKRCxrRUFJQztBQUVELFNBQWdCLGtDQUFrQyxDQUFDLE9BQWU7SUFDaEUsUUFBUSxPQUFPLEVBQUU7UUFDZixLQUFLLEdBQUcsQ0FBQztRQUNULEtBQUssR0FBRztZQUNOLE9BQU8sd0JBQXdCLENBQUM7UUFDbEMsS0FBSyxHQUFHO1lBQ04sT0FBTyx1QkFBdUIsQ0FBQztLQUNsQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FB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LENBQUMsQ0FBQztJQUNuRSxDQUFDOztBQW5WSCw0Q0FvVkM7QUFuVlEsMkNBQTBCLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLG1DQUFrQixHQUFHLENBQUMsQ0FBQztBQUN2QixnQ0FBZSxHQUFHLENBQUMsQ0FBQztBQUVwQix1Q0FBc0IsR0FBRyxHQUFHLENBQUM7QUFDN0Isb0NBQW1CLEdBQUcsR0FBRyxDQUFDO0FBQzFCLG9DQUFtQixHQUFHLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRyYW5zYWN0aW9uLCBjcnlwdG8gfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvdHlwZXMnO1xyXG5pbXBvcnQgeyBCdWZmZXJSZWFkZXIsIEJ1ZmZlcldyaXRlciB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL2J1ZmZlcnV0aWxzJztcclxuXHJcbmNvbnN0IHZhcnVpbnQgPSByZXF1aXJlKCd2YXJ1aW50LWJpdGNvaW4nKTtcclxuY29uc3QgdHlwZWZvcmNlID0gcmVxdWlyZSgndHlwZWZvcmNlJyk7XHJcblxyXG5pbXBvcnQgeyBuZXR3b3JrcyB9IGZyb20gJy4uLy4uL25ldHdvcmtzJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uLCB2YXJTbGljZVNpemUgfSBmcm9tICcuLi9VdHhvVHJhbnNhY3Rpb24nO1xyXG5pbXBvcnQgeyBmcm9tQnVmZmVyVjQsIGZyb21CdWZmZXJWNSwgdG9CdWZmZXJWNCwgdG9CdWZmZXJWNSwgVkFMVUVfSU5UNjRfWkVSTyB9IGZyb20gJy4vWmNhc2hCdWZmZXJ1dGlscyc7XHJcbmltcG9ydCB7IGdldEJsYWtlMmJIYXNoLCBnZXRTaWduYXR1cmVEaWdlc3QsIGdldFR4aWREaWdlc3QgfSBmcm9tICcuL2hhc2haaXAwMjQ0JztcclxuXHJcbmNvbnN0IFpFUk8gPSBCdWZmZXIuZnJvbSgnMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCcsICdoZXgnKTtcclxuXHJcbmV4cG9ydCB0eXBlIFpjYXNoTmV0d29yayA9IHR5cGVvZiBuZXR3b3Jrcy56Y2FzaCB8IHR5cGVvZiBuZXR3b3Jrcy56Y2FzaFRlc3Q7XHJcblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC43LjAvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMNDBcclxuY29uc3QgU0FQTElOR19WRVJTSU9OX0dST1VQX0lEID0gMHg4OTJmMjA4NTtcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNy4wL3NyYy9wcmltaXRpdmVzL3RyYW5zYWN0aW9uLmgjTDUyXHJcbmNvbnN0IFpJUDIyNV9WRVJTSU9OX0dST1VQX0lEID0gMHgyNmE3MjcwYTtcclxuXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjcuMC9zcmMvY29uc2Vuc3VzL3VwZ3JhZGVzLmNwcCNMMTFcclxuY29uc3QgT1ZFUldJTlRFUl9CUkFOQ0hfSUQgPSAweDViYTgxYjE5O1xyXG5jb25zdCBDQU5PUFlfQlJBTkNIX0lEID0gMHhlOWZmNzVhNjtcclxuY29uc3QgTlU1X0JSQU5DSF9JRCA9IDB4YzJkNmQwYjQ7XHJcblxyXG5leHBvcnQgY2xhc3MgVW5zdXBwb3J0ZWRUcmFuc2FjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFZlcnNpb25Hcm91cElkRm9yVmVyc2lvbih2ZXJzaW9uOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIHN3aXRjaCAodmVyc2lvbikge1xyXG4gICAgY2FzZSA0MDA6XHJcbiAgICBjYXNlIDQ1MDpcclxuICAgICAgcmV0dXJuIFNBUExJTkdfVkVSU0lPTl9HUk9VUF9JRDtcclxuICAgIGNhc2UgNTAwOlxyXG4gICAgICByZXR1cm4gWklQMjI1X1ZFUlNJT05fR1JPVVBfSUQ7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcihgbm8gdmFsdWUgZm9yIHZlcnNpb24gJHt2ZXJzaW9ufWApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdENvbnNlbnN1c0JyYW5jaElkRm9yVmVyc2lvbihuZXR3b3JrOiBaY2FzaE5ldHdvcmssIHZlcnNpb246IG51bWJlcik6IG51bWJlciB7XHJcbiAgc3dpdGNoICh2ZXJzaW9uKSB7XHJcbiAgICBjYXNlIDE6XHJcbiAgICBjYXNlIDI6XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgY2FzZSAzOlxyXG4gICAgICByZXR1cm4gT1ZFUldJTlRFUl9CUkFOQ0hfSUQ7XHJcbiAgICBjYXNlIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX0NBTk9QWTpcclxuICAgICAgLy8gaHR0cHM6Ly96aXBzLnouY2FzaC96aXAtMDI1MVxyXG4gICAgICByZXR1cm4gQ0FOT1BZX0JSQU5DSF9JRDtcclxuICAgIGNhc2UgNDpcclxuICAgIGNhc2UgNTpcclxuICAgIGNhc2UgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfTlU1OlxyXG4gICAgY2FzZSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT041X0JSQU5DSF9OVTU6XHJcbiAgICAgIC8vIGh0dHBzOi8vemlwcy56LmNhc2gvemlwLTAyNTJcclxuICAgICAgcmV0dXJuIE5VNV9CUkFOQ0hfSUQ7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcihgbm8gdmFsdWUgZm9yIHZlcnNpb24gJHt2ZXJzaW9ufWApO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiBleHRlbmRzIFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgc3RhdGljIFZFUlNJT05fSk9JTlNQTElUU19TVVBQT1JUID0gMjtcclxuICBzdGF0aWMgVkVSU0lPTl9PVkVSV0lOVEVSID0gMztcclxuICBzdGF0aWMgVkVSU0lPTl9TQVBMSU5HID0gNDtcclxuXHJcbiAgc3RhdGljIFZFUlNJT040X0JSQU5DSF9DQU5PUFkgPSA0MDA7XHJcbiAgc3RhdGljIFZFUlNJT040X0JSQU5DSF9OVTUgPSA0NTA7XHJcbiAgc3RhdGljIFZFUlNJT041X0JSQU5DSF9OVTUgPSA1MDA7XHJcblxyXG4gIC8vIDEgaWYgdGhlIHRyYW5zYWN0aW9uIGlzIHBvc3Qgb3ZlcndpbnRlciB1cGdyYWRlLCAwIG90aGVyd2lzZVxyXG4gIG92ZXJ3aW50ZXJlZCA9IDA7XHJcbiAgLy8gMHgwM0M0ODI3MCAoNjMyMTAwOTYpIGZvciBvdmVyd2ludGVyIGFuZCAweDg5MkYyMDg1ICgyMzAxNTY3MTA5KSBmb3Igc2FwbGluZ1xyXG4gIHZlcnNpb25Hcm91cElkID0gMDtcclxuICAvLyBCbG9jayBoZWlnaHQgYWZ0ZXIgd2hpY2ggdGhpcyB0cmFuc2FjdGlvbnMgd2lsbCBleHBpcmUsIG9yIDAgdG8gZGlzYWJsZSBleHBpcnlcclxuICBleHBpcnlIZWlnaHQgPSAwO1xyXG4gIGNvbnNlbnN1c0JyYW5jaElkOiBudW1iZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuZXR3b3JrOiBaY2FzaE5ldHdvcmssIHR4PzogWmNhc2hUcmFuc2FjdGlvbjxiaWdpbnQgfCBudW1iZXI+LCBhbW91bnRUeXBlPzogJ2JpZ2ludCcgfCAnbnVtYmVyJykge1xyXG4gICAgc3VwZXIobmV0d29yaywgdHgsIGFtb3VudFR5cGUpO1xyXG5cclxuICAgIGxldCBjb25zZW5zdXNCcmFuY2hJZDtcclxuICAgIGlmICh0eCkge1xyXG4gICAgICB0aGlzLm92ZXJ3aW50ZXJlZCA9IHR4Lm92ZXJ3aW50ZXJlZDtcclxuICAgICAgdGhpcy52ZXJzaW9uR3JvdXBJZCA9IHR4LnZlcnNpb25Hcm91cElkO1xyXG4gICAgICB0aGlzLmV4cGlyeUhlaWdodCA9IHR4LmV4cGlyeUhlaWdodDtcclxuXHJcbiAgICAgIGlmICh0eC5jb25zZW5zdXNCcmFuY2hJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29uc2Vuc3VzQnJhbmNoSWQgPSB0eC5jb25zZW5zdXNCcmFuY2hJZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5jb25zZW5zdXNCcmFuY2hJZCA9IGNvbnNlbnN1c0JyYW5jaElkID8/IGdldERlZmF1bHRDb25zZW5zdXNCcmFuY2hJZEZvclZlcnNpb24obmV0d29yaywgdGhpcy52ZXJzaW9uKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBmcm9tQnVmZmVyPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgYnVmZmVyOiBCdWZmZXIsXHJcbiAgICBfX25vU3RyaWN0OiBib29sZWFuLFxyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInLFxyXG4gICAgbmV0d29yaz86IFpjYXNoTmV0d29ya1xyXG4gICk6IFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIGlmICghbmV0d29yaykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYG11c3QgcHJvdmlkZSBuZXR3b3JrYCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYnVmZmVyUmVhZGVyID0gbmV3IEJ1ZmZlclJlYWRlcihidWZmZXIpO1xyXG4gICAgY29uc3QgdHggPSBuZXcgWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPihuZXR3b3JrKTtcclxuICAgIHR4LnZlcnNpb24gPSBidWZmZXJSZWFkZXIucmVhZEludDMyKCk7XHJcblxyXG4gICAgLy8gU3BsaXQgdGhlIGhlYWRlciBpbnRvIGZPdmVyd2ludGVyZWQgYW5kIG5WZXJzaW9uXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMNzcyXHJcbiAgICB0eC5vdmVyd2ludGVyZWQgPSB0eC52ZXJzaW9uID4+PiAzMTsgLy8gTXVzdCBiZSAxIGZvciB2ZXJzaW9uIDMgYW5kIHVwXHJcbiAgICB0eC52ZXJzaW9uID0gdHgudmVyc2lvbiAmIDB4MDdmZmZmZmZmOyAvLyAzIGZvciBvdmVyd2ludGVyXHJcbiAgICB0eC5jb25zZW5zdXNCcmFuY2hJZCA9IGdldERlZmF1bHRDb25zZW5zdXNCcmFuY2hJZEZvclZlcnNpb24obmV0d29yaywgdHgudmVyc2lvbik7XHJcblxyXG4gICAgaWYgKHR4LmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgICB0eC52ZXJzaW9uR3JvdXBJZCA9IGJ1ZmZlclJlYWRlci5yZWFkVUludDMyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR4LnZlcnNpb24gPT09IDUpIHtcclxuICAgICAgZnJvbUJ1ZmZlclY1KGJ1ZmZlclJlYWRlciwgdHgsIGFtb3VudFR5cGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZnJvbUJ1ZmZlclY0KGJ1ZmZlclJlYWRlciwgdHgsIGFtb3VudFR5cGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChfX25vU3RyaWN0KSByZXR1cm4gdHg7XHJcbiAgICBpZiAoYnVmZmVyUmVhZGVyLm9mZnNldCAhPT0gYnVmZmVyLmxlbmd0aCkge1xyXG4gICAgICBjb25zdCB0cmFpbGluZyA9IGJ1ZmZlci5zbGljZShidWZmZXJSZWFkZXIub2Zmc2V0KTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHRyYWlsaW5nIGJ5dGVzOiAke3RyYWlsaW5nLnRvU3RyaW5nKCdoZXgnKX1gKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHg7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUJ1ZmZlcldpdGhWZXJzaW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gICAgYnVmOiBCdWZmZXIsXHJcbiAgICBuZXR3b3JrOiBaY2FzaE5ldHdvcmssXHJcbiAgICB2ZXJzaW9uPzogbnVtYmVyLFxyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInXHJcbiAgKTogWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICBjb25zdCB0eCA9IFpjYXNoVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcjxUTnVtYmVyPihidWYsIGZhbHNlLCBhbW91bnRUeXBlLCBuZXR3b3JrKTtcclxuICAgIGlmICh2ZXJzaW9uKSB7XHJcbiAgICAgIHR4LmNvbnNlbnN1c0JyYW5jaElkID0gZ2V0RGVmYXVsdENvbnNlbnN1c0JyYW5jaElkRm9yVmVyc2lvbihuZXR3b3JrLCB2ZXJzaW9uKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0eDtcclxuICB9XHJcblxyXG4gIGJ5dGVMZW5ndGgoKTogbnVtYmVyIHtcclxuICAgIGxldCBieXRlTGVuZ3RoID0gc3VwZXIuYnl0ZUxlbmd0aCgpO1xyXG4gICAgaWYgKHRoaXMuaXNPdmVyd2ludGVyQ29tcGF0aWJsZSgpKSB7XHJcbiAgICAgIGJ5dGVMZW5ndGggKz0gNDsgLy8gblZlcnNpb25Hcm91cElkXHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5pc092ZXJ3aW50ZXJDb21wYXRpYmxlKCkpIHtcclxuICAgICAgYnl0ZUxlbmd0aCArPSA0OyAvLyBuRXhwaXJ5SGVpZ2h0XHJcbiAgICB9XHJcbiAgICBjb25zdCBlbXB0eVZlY3Rvckxlbmd0aCA9IHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgoMCk7XHJcbiAgICBpZiAodGhpcy52ZXJzaW9uID09PSA1KSB7XHJcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w4MjJcclxuICAgICAgYnl0ZUxlbmd0aCArPSA0OyAvLyBjb25zZW5zdXNCcmFuY2hJZFxyXG4gICAgICBieXRlTGVuZ3RoICs9IGVtcHR5VmVjdG9yTGVuZ3RoOyAvLyBzYXBsaW5nQnVuZGxlIGlucHV0c1xyXG4gICAgICBieXRlTGVuZ3RoICs9IGVtcHR5VmVjdG9yTGVuZ3RoOyAvLyBzYXBsaW5nQnVuZGxlIG91dHB1dHNcclxuICAgICAgYnl0ZUxlbmd0aCArPSAxOyAvLyBvcmNoYXJkQnVuZGxlIChlbXB0eSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w4NjJcclxuICAgICAgICBieXRlTGVuZ3RoICs9IDg7IC8vIHZhbHVlQmFsYW5jZSAodWludDY0KVxyXG4gICAgICAgIGJ5dGVMZW5ndGggKz0gZW1wdHlWZWN0b3JMZW5ndGg7IC8vIGlucHV0c1xyXG4gICAgICAgIGJ5dGVMZW5ndGggKz0gZW1wdHlWZWN0b3JMZW5ndGg7IC8vIG91dHB1dHNcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5zdXBwb3J0c0pvaW5TcGxpdHMoKSkge1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgYnl0ZUxlbmd0aCArPSBlbXB0eVZlY3Rvckxlbmd0aDsgLy8gam9pbnNwbGl0c1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnl0ZUxlbmd0aDtcclxuICB9XHJcblxyXG4gIGlzU2FwbGluZ0NvbXBhdGlibGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLm92ZXJ3aW50ZXJlZCAmJiB0aGlzLnZlcnNpb24gPj0gWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9OX1NBUExJTkc7XHJcbiAgfVxyXG5cclxuICBpc092ZXJ3aW50ZXJDb21wYXRpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhdGhpcy5vdmVyd2ludGVyZWQgJiYgdGhpcy52ZXJzaW9uID49IFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTl9PVkVSV0lOVEVSO1xyXG4gIH1cclxuXHJcbiAgc3VwcG9ydHNKb2luU3BsaXRzKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhdGhpcy5vdmVyd2ludGVyZWQgJiYgdGhpcy52ZXJzaW9uID49IFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTl9KT0lOU1BMSVRTX1NVUFBPUlQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBCdWlsZCBhIGhhc2ggZm9yIGFsbCBvciBub25lIG9mIHRoZSB0cmFuc2FjdGlvbiBpbnB1dHMgZGVwZW5kaW5nIG9uIHRoZSBoYXNodHlwZVxyXG4gICAqIEBwYXJhbSBoYXNoVHlwZVxyXG4gICAqIEByZXR1cm5zIEJ1ZmZlciAtIEJMQUtFMmIgaGFzaCBvciAyNTYtYml0IHplcm8gaWYgZG9lc24ndCBhcHBseVxyXG4gICAqL1xyXG4gIGdldFByZXZvdXRIYXNoKGhhc2hUeXBlOiBudW1iZXIpOiBCdWZmZXIge1xyXG4gICAgaWYgKCEoaGFzaFR5cGUgJiBUcmFuc2FjdGlvbi5TSUdIQVNIX0FOWU9ORUNBTlBBWSkpIHtcclxuICAgICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2NVbnNhZmUoMzYgKiB0aGlzLmlucy5sZW5ndGgpKTtcclxuXHJcbiAgICAgIHRoaXMuaW5zLmZvckVhY2goZnVuY3Rpb24gKHR4SW4pIHtcclxuICAgICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZSh0eEluLmhhc2gpO1xyXG4gICAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0eEluLmluZGV4KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gZ2V0Qmxha2UyYkhhc2goYnVmZmVyV3JpdGVyLmJ1ZmZlciwgJ1pjYXNoUHJldm91dEhhc2gnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBaRVJPO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGQgYSBoYXNoIGZvciBhbGwgb3Igbm9uZSBvZiB0aGUgdHJhbnNhY3Rpb25zIGlucHV0cyBzZXF1ZW5jZSBudW1iZXJzIGRlcGVuZGluZyBvbiB0aGUgaGFzaHR5cGVcclxuICAgKiBAcGFyYW0gaGFzaFR5cGVcclxuICAgKiBAcmV0dXJucyBCdWZmZXIgQkxBS0UyYiBoYXNoIG9yIDI1Ni1iaXQgemVybyBpZiBkb2Vzbid0IGFwcGx5XHJcbiAgICovXHJcbiAgZ2V0U2VxdWVuY2VIYXNoKGhhc2hUeXBlOiBudW1iZXIpOiBCdWZmZXIge1xyXG4gICAgaWYgKFxyXG4gICAgICAhKGhhc2hUeXBlICYgVHJhbnNhY3Rpb24uU0lHSEFTSF9BTllPTkVDQU5QQVkpICYmXHJcbiAgICAgIChoYXNoVHlwZSAmIDB4MWYpICE9PSBUcmFuc2FjdGlvbi5TSUdIQVNIX1NJTkdMRSAmJlxyXG4gICAgICAoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9OT05FXHJcbiAgICApIHtcclxuICAgICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2NVbnNhZmUoNCAqIHRoaXMuaW5zLmxlbmd0aCkpO1xyXG5cclxuICAgICAgdGhpcy5pbnMuZm9yRWFjaChmdW5jdGlvbiAodHhJbikge1xyXG4gICAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0eEluLnNlcXVlbmNlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gZ2V0Qmxha2UyYkhhc2goYnVmZmVyV3JpdGVyLmJ1ZmZlciwgJ1pjYXNoU2VxdWVuY0hhc2gnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBaRVJPO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGQgYSBoYXNoIGZvciBvbmUsIGFsbCBvciBub25lIG9mIHRoZSB0cmFuc2FjdGlvbiBvdXRwdXRzIGRlcGVuZGluZyBvbiB0aGUgaGFzaHR5cGVcclxuICAgKiBAcGFyYW0gaGFzaFR5cGVcclxuICAgKiBAcGFyYW0gaW5JbmRleFxyXG4gICAqIEByZXR1cm5zIEJ1ZmZlciBCTEFLRTJiIGhhc2ggb3IgMjU2LWJpdCB6ZXJvIGlmIGRvZXNuJ3QgYXBwbHlcclxuICAgKi9cclxuICBnZXRPdXRwdXRzSGFzaChoYXNoVHlwZTogbnVtYmVyLCBpbkluZGV4OiBudW1iZXIpOiBCdWZmZXIge1xyXG4gICAgaWYgKChoYXNoVHlwZSAmIDB4MWYpICE9PSBUcmFuc2FjdGlvbi5TSUdIQVNIX1NJTkdMRSAmJiAoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9OT05FKSB7XHJcbiAgICAgIC8vIEZpbmQgb3V0IHRoZSBzaXplIG9mIHRoZSBvdXRwdXRzIGFuZCB3cml0ZSB0aGVtXHJcbiAgICAgIGNvbnN0IHR4T3V0c1NpemUgPSB0aGlzLm91dHMucmVkdWNlKGZ1bmN0aW9uIChzdW0sIG91dHB1dCkge1xyXG4gICAgICAgIHJldHVybiBzdW0gKyA4ICsgdmFyU2xpY2VTaXplKG91dHB1dC5zY3JpcHQpO1xyXG4gICAgICB9LCAwKTtcclxuXHJcbiAgICAgIGNvbnN0IGJ1ZmZlcldyaXRlciA9IG5ldyBCdWZmZXJXcml0ZXIoQnVmZmVyLmFsbG9jVW5zYWZlKHR4T3V0c1NpemUpKTtcclxuXHJcbiAgICAgIHRoaXMub3V0cy5mb3JFYWNoKGZ1bmN0aW9uIChvdXQpIHtcclxuICAgICAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50NjQob3V0LnZhbHVlKTtcclxuICAgICAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJTbGljZShvdXQuc2NyaXB0KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gZ2V0Qmxha2UyYkhhc2goYnVmZmVyV3JpdGVyLmJ1ZmZlciwgJ1pjYXNoT3V0cHV0c0hhc2gnKTtcclxuICAgIH0gZWxzZSBpZiAoKGhhc2hUeXBlICYgMHgxZikgPT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfU0lOR0xFICYmIGluSW5kZXggPCB0aGlzLm91dHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFdyaXRlIG9ubHkgdGhlIG91dHB1dCBzcGVjaWZpZWQgaW4gaW5JbmRleFxyXG4gICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHNbaW5JbmRleF07XHJcblxyXG4gICAgICBjb25zdCBidWZmZXJXcml0ZXIgPSBuZXcgQnVmZmVyV3JpdGVyKEJ1ZmZlci5hbGxvY1Vuc2FmZSg4ICsgdmFyU2xpY2VTaXplKG91dHB1dC5zY3JpcHQpKSk7XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ2NChvdXRwdXQudmFsdWUpO1xyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJTbGljZShvdXRwdXQuc2NyaXB0KTtcclxuXHJcbiAgICAgIHJldHVybiBnZXRCbGFrZTJiSGFzaChidWZmZXJXcml0ZXIuYnVmZmVyLCAnWmNhc2hPdXRwdXRzSGFzaCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFpFUk87XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYXNoIHRyYW5zYWN0aW9uIGZvciBzaWduaW5nIGEgdHJhbnNwYXJlbnQgdHJhbnNhY3Rpb24gaW4gWmNhc2guIFByb3RlY3RlZCB0cmFuc2FjdGlvbnMgYXJlIG5vdCBzdXBwb3J0ZWQuXHJcbiAgICogQHBhcmFtIGluSW5kZXhcclxuICAgKiBAcGFyYW0gcHJldk91dFNjcmlwdFxyXG4gICAqIEBwYXJhbSB2YWx1ZVxyXG4gICAqIEBwYXJhbSBoYXNoVHlwZVxyXG4gICAqIEByZXR1cm5zIEJ1ZmZlciBCTEFLRTJiIGhhc2hcclxuICAgKi9cclxuICBoYXNoRm9yU2lnbmF0dXJlQnlOZXR3b3JrKFxyXG4gICAgaW5JbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkLFxyXG4gICAgcHJldk91dFNjcmlwdDogQnVmZmVyLFxyXG4gICAgdmFsdWU6IGJpZ2ludCB8IG51bWJlciB8IHVuZGVmaW5lZCxcclxuICAgIGhhc2hUeXBlOiBudW1iZXJcclxuICApOiBCdWZmZXIge1xyXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgdmFsdWVgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3NjcmlwdC9pbnRlcnByZXRlci5jcHAjTDExNzVcclxuICAgIGlmICh0aGlzLnZlcnNpb24gPT09IDUpIHtcclxuICAgICAgcmV0dXJuIGdldFNpZ25hdHVyZURpZ2VzdCh0aGlzLCBpbkluZGV4LCBwcmV2T3V0U2NyaXB0LCB2YWx1ZSwgaGFzaFR5cGUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFpDYXNoIGFtb3VudHMgYXJlIGFsd2F5cyB3aXRoaW4gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJcclxuICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnYmlnaW50JyA/IE51bWJlcih2YWx1ZSkgOiB2YWx1ZTtcclxuICAgIHR5cGVmb3JjZSh0eXBlcy50dXBsZSh0eXBlcy5VSW50MzIsIHR5cGVzLkJ1ZmZlciwgdHlwZXMuTnVtYmVyKSwgW2luSW5kZXgsIHByZXZPdXRTY3JpcHQsIHZhbHVlXSk7XHJcblxyXG4gICAgaWYgKGluSW5kZXggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgaW5JbmRleGApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICBpZiAoaW5JbmRleCA+PSB0aGlzLmlucy5sZW5ndGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnB1dCBpbmRleCBpcyBvdXQgb2YgcmFuZ2UnKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgaWYgKCF0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIHZlcnNpb24gJHt0aGlzLnZlcnNpb259YCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaGFzaFByZXZvdXRzID0gdGhpcy5nZXRQcmV2b3V0SGFzaChoYXNoVHlwZSk7XHJcbiAgICBjb25zdCBoYXNoU2VxdWVuY2UgPSB0aGlzLmdldFNlcXVlbmNlSGFzaChoYXNoVHlwZSk7XHJcbiAgICBjb25zdCBoYXNoT3V0cHV0cyA9IHRoaXMuZ2V0T3V0cHV0c0hhc2goaGFzaFR5cGUsIGluSW5kZXgpO1xyXG4gICAgY29uc3QgaGFzaEpvaW5TcGxpdHMgPSBaRVJPO1xyXG4gICAgY29uc3QgaGFzaFNoaWVsZGVkU3BlbmRzID0gWkVSTztcclxuICAgIGNvbnN0IGhhc2hTaGllbGRlZE91dHB1dHMgPSBaRVJPO1xyXG5cclxuICAgIGxldCBiYXNlQnVmZmVyU2l6ZSA9IDA7XHJcbiAgICBiYXNlQnVmZmVyU2l6ZSArPSA0ICogNTsgLy8gaGVhZGVyLCBuVmVyc2lvbkdyb3VwSWQsIGxvY2tfdGltZSwgbkV4cGlyeUhlaWdodCwgaGFzaFR5cGVcclxuICAgIGJhc2VCdWZmZXJTaXplICs9IDMyICogNDsgLy8gMjU2IGhhc2hlczogaGFzaFByZXZvdXRzLCBoYXNoU2VxdWVuY2UsIGhhc2hPdXRwdXRzLCBoYXNoSm9pblNwbGl0c1xyXG4gICAgYmFzZUJ1ZmZlclNpemUgKz0gNCAqIDI7IC8vIGlucHV0LmluZGV4LCBpbnB1dC5zZXF1ZW5jZVxyXG4gICAgYmFzZUJ1ZmZlclNpemUgKz0gODsgLy8gdmFsdWVcclxuICAgIGJhc2VCdWZmZXJTaXplICs9IDMyOyAvLyBpbnB1dC5oYXNoXHJcbiAgICBiYXNlQnVmZmVyU2l6ZSArPSB2YXJTbGljZVNpemUocHJldk91dFNjcmlwdCk7IC8vIHByZXZPdXRTY3JpcHRcclxuICAgIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xyXG4gICAgICBiYXNlQnVmZmVyU2l6ZSArPSAzMiAqIDI7IC8vIGhhc2hTaGllbGRlZFNwZW5kcyBhbmQgaGFzaFNoaWVsZGVkT3V0cHV0c1xyXG4gICAgICBiYXNlQnVmZmVyU2l6ZSArPSA4OyAvLyB2YWx1ZUJhbGFuY2VcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXNrID0gdGhpcy5vdmVyd2ludGVyZWQgPyAxIDogMDtcclxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMudmVyc2lvbiB8IChtYXNrIDw8IDMxKTtcclxuXHJcbiAgICBjb25zdCBidWZmZXJXcml0ZXIgPSBuZXcgQnVmZmVyV3JpdGVyKEJ1ZmZlci5hbGxvYyhiYXNlQnVmZmVyU2l6ZSkpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlSW50MzIoaGVhZGVyKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0aGlzLnZlcnNpb25Hcm91cElkKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hQcmV2b3V0cyk7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShoYXNoU2VxdWVuY2UpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaE91dHB1dHMpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaEpvaW5TcGxpdHMpO1xyXG4gICAgaWYgKHRoaXMuaXNTYXBsaW5nQ29tcGF0aWJsZSgpKSB7XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hTaGllbGRlZFNwZW5kcyk7XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hTaGllbGRlZE91dHB1dHMpO1xyXG4gICAgfVxyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHRoaXMubG9ja3RpbWUpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHRoaXMuZXhwaXJ5SGVpZ2h0KTtcclxuICAgIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShWQUxVRV9JTlQ2NF9aRVJPKTtcclxuICAgIH1cclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZUludDMyKGhhc2hUeXBlKTtcclxuXHJcbiAgICAvLyBUaGUgaW5wdXQgYmVpbmcgc2lnbmVkIChyZXBsYWNpbmcgdGhlIHNjcmlwdFNpZyB3aXRoIHNjcmlwdENvZGUgKyBhbW91bnQpXHJcbiAgICAvLyBUaGUgcHJldm91dCBtYXkgYWxyZWFkeSBiZSBjb250YWluZWQgaW4gaGFzaFByZXZvdXQsIGFuZCB0aGUgblNlcXVlbmNlXHJcbiAgICAvLyBtYXkgYWxyZWFkeSBiZSBjb250YWluZWQgaW4gaGFzaFNlcXVlbmNlLlxyXG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLmluc1tpbkluZGV4XTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGlucHV0Lmhhc2gpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKGlucHV0LmluZGV4KTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVZhclNsaWNlKHByZXZPdXRTY3JpcHQpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDY0KHZhbHVlKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMihpbnB1dC5zZXF1ZW5jZSk7XHJcblxyXG4gICAgY29uc3QgcGVyc29uYWxpemF0aW9uID0gQnVmZmVyLmFsbG9jKDE2KTtcclxuICAgIGNvbnN0IHByZWZpeCA9ICdaY2FzaFNpZ0hhc2gnO1xyXG4gICAgcGVyc29uYWxpemF0aW9uLndyaXRlKHByZWZpeCk7XHJcbiAgICBwZXJzb25hbGl6YXRpb24ud3JpdGVVSW50MzJMRSh0aGlzLmNvbnNlbnN1c0JyYW5jaElkLCBwcmVmaXgubGVuZ3RoKTtcclxuXHJcbiAgICByZXR1cm4gZ2V0Qmxha2UyYkhhc2goYnVmZmVyV3JpdGVyLmJ1ZmZlciwgcGVyc29uYWxpemF0aW9uKTtcclxuICB9XHJcblxyXG4gIHRvQnVmZmVyKGJ1ZmZlcj86IEJ1ZmZlciwgaW5pdGlhbE9mZnNldCA9IDApOiBCdWZmZXIge1xyXG4gICAgaWYgKCFidWZmZXIpIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSh0aGlzLmJ5dGVMZW5ndGgoKSk7XHJcblxyXG4gICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihidWZmZXIsIGluaXRpYWxPZmZzZXQpO1xyXG5cclxuICAgIGlmICh0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgICBjb25zdCBtYXNrID0gdGhpcy5vdmVyd2ludGVyZWQgPyAxIDogMDtcclxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlSW50MzIodGhpcy52ZXJzaW9uIHwgKG1hc2sgPDwgMzEpKTsgLy8gU2V0IG92ZXJ3aW50ZXIgYml0XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0aGlzLnZlcnNpb25Hcm91cElkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZUludDMyKHRoaXMudmVyc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMudmVyc2lvbiA9PT0gNSkge1xyXG4gICAgICB0b0J1ZmZlclY1KGJ1ZmZlcldyaXRlciwgdGhpcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0b0J1ZmZlclY0KGJ1ZmZlcldyaXRlciwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGluaXRpYWxPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gYnVmZmVyLnNsaWNlKGluaXRpYWxPZmZzZXQsIGJ1ZmZlcldyaXRlci5vZmZzZXQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ1ZmZlcjtcclxuICB9XHJcblxyXG4gIGdldEhhc2goZm9yV2l0bmVzcz86IGJvb2xlYW4pOiBCdWZmZXIge1xyXG4gICAgaWYgKGZvcldpdG5lc3MpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGFyZ3VtZW50YCk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy52ZXJzaW9uID09PSA1KSB7XHJcbiAgICAgIHJldHVybiBnZXRUeGlkRGlnZXN0KHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNyeXB0by5oYXNoMjU2KHRoaXMudG9CdWZmZXIoKSk7XHJcbiAgfVxyXG5cclxuICBjbG9uZTxUTjIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBUTnVtYmVyPihhbW91bnRUeXBlPzogJ2JpZ2ludCcgfCAnbnVtYmVyJyk6IFpjYXNoVHJhbnNhY3Rpb248VE4yPiB7XHJcbiAgICByZXR1cm4gbmV3IFpjYXNoVHJhbnNhY3Rpb248VE4yPih0aGlzLm5ldHdvcmssIHRoaXMsIGFtb3VudFR5cGUpO1xyXG4gIH1cclxufVxyXG4iXX0=