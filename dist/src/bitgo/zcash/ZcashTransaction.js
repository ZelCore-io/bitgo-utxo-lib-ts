"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZcashTransaction = exports.getDefaultConsensusBranchIdForVersion = exports.getDefaultVersionGroupIdForVersion = exports.UnsupportedTransactionError = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const types = require("bitcoinjs-lib/src/types");
const bufferutils_1 = require("bitcoinjs-lib/src/bufferutils");
const varuint = require('varuint-bitcoin');
const typeforce = require('typeforce');
const networks_1 = require("../../networks");
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
            switch (network) {
                case networks_1.networks.komodo:
                case networks_1.networks.safecoin:
                case networks_1.networks.zelcash:
                case networks_1.networks.flux:
                case networks_1.networks.snowgem:
                case networks_1.networks.gemlink:
                case networks_1.networks.commercium:
                case networks_1.networks.bitcoinz:
                case networks_1.networks.fluxtestnet:
                    return 0x5ba81b19;
                case networks_1.networks.zero:
                    return 0x6f76727a;
                case networks_1.networks.zclassic:
                    return 0x5ba81b19;
                case networks_1.networks.bzedge:
                    return 0x6f77627a;
                default:
                    return OVERWINTER_BRANCH_ID;
            }
        case ZcashTransaction.VERSION4_BRANCH_CANOPY:
            // https://zips.z.cash/zip-0251
            switch (network) {
                case networks_1.networks.komodo:
                case networks_1.networks.safecoin:
                case networks_1.networks.zelcash:
                case networks_1.networks.flux:
                case networks_1.networks.snowgem:
                case networks_1.networks.gemlink:
                case networks_1.networks.commercium:
                case networks_1.networks.bitcoinz:
                case networks_1.networks.fluxtestnet:
                    return 0x76b809bb;
                case networks_1.networks.zero:
                    return 0x7361707a;
                case networks_1.networks.zclassic:
                    return 0x930b540d;
                case networks_1.networks.bzedge:
                    return 0x736c627a;
                default:
                    return CANOPY_BRANCH_ID;
            }
        case 4:
        case 5:
        case ZcashTransaction.VERSION4_BRANCH_NU5:
        case ZcashTransaction.VERSION5_BRANCH_NU5:
            // https://zips.z.cash/zip-0252
            switch (network) {
                case networks_1.networks.komodo:
                case networks_1.networks.safecoin:
                case networks_1.networks.zelcash:
                case networks_1.networks.flux:
                case networks_1.networks.snowgem:
                case networks_1.networks.gemlink:
                case networks_1.networks.commercium:
                case networks_1.networks.bitcoinz:
                case networks_1.networks.fluxtestnet:
                    return 0x76b809bb;
                case networks_1.networks.zero:
                    return 0x7361707a;
                case networks_1.networks.zclassic:
                    return 0x930b540d;
                case networks_1.networks.bzedge:
                    return 0x736c627a;
                default:
                    return NU5_BRANCH_ID;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWmNhc2hUcmFuc2FjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby96Y2FzaC9aY2FzaFRyYW5zYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsK0RBQTJFO0FBRTNFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUV2Qyw2Q0FBMEM7QUFDMUMsd0RBQW1FO0FBQ25FLHlEQUEwRztBQUMxRywrQ0FBa0Y7QUFFbEYsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxrRUFBa0UsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUlwRyw4RUFBOEU7QUFDOUUsTUFBTSx3QkFBd0IsR0FBRyxVQUFVLENBQUM7QUFDNUMsOEVBQThFO0FBQzlFLE1BQU0sdUJBQXVCLEdBQUcsVUFBVSxDQUFDO0FBRTNDLDRFQUE0RTtBQUM1RSxNQUFNLG9CQUFvQixHQUFHLFVBQVUsQ0FBQztBQUN4QyxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQztBQUNwQyxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUM7QUFFakMsTUFBYSwyQkFBNEIsU0FBUSxLQUFLO0lBQ3BELFlBQVksT0FBZTtRQUN6QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBSkQsa0VBSUM7QUFFRCxTQUFnQixrQ0FBa0MsQ0FBQyxPQUFlO0lBQ2hFLFFBQVEsT0FBTyxFQUFFO1FBQ2YsS0FBSyxHQUFHLENBQUM7UUFDVCxLQUFLLEdBQUc7WUFDTixPQUFPLHdCQUF3QixDQUFDO1FBQ2xDLEtBQUssR0FBRztZQUNOLE9BQU8sdUJBQXVCLENBQUM7S0FDbEM7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixPQUFPLEVBQUUsQ0FBQyxD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QUFDLE9BQU8sS0FBSyxDQUFDLEVBQUU7WUFDdEIsSUFBQSw2QkFBVSxFQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoQzthQUFNO1lBQ0wsSUFBQSw2QkFBVSxFQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoQztRQUVELElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUMvQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN6RDtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxPQUFPLENBQUMsVUFBb0I7UUFDMUIsSUFBSSxVQUFVLEVBQUU7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDckM7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ3RCLE9BQU8sSUFBQSwyQkFBYSxFQUFDLElBQUksQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxzQkFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsS0FBSyxDQUF3QyxVQUFnQztRQUMzRSxPQUFPLElBQUksZ0JBQWdCLENBQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbkUsQ0FBQzs7QUFuVkgsNENBb1ZDO0FBblZRLDJDQUEwQixHQUFHLENBQUMsQ0FBQztBQUMvQixtQ0FBa0IsR0FBRyxDQUFDLENBQUM7QUFDdkIsZ0NBQWUsR0FBRyxDQUFDLENBQUM7QUFFcEIsdUNBQXNCLEdBQUcsR0FBRyxDQUFDO0FBQzdCLG9DQUFtQixHQUFHLEdBQUcsQ0FBQztBQUMxQixvQ0FBbUIsR0FBRyxHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUcmFuc2FjdGlvbiwgY3J5cHRvIH0gZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3R5cGVzJztcclxuaW1wb3J0IHsgQnVmZmVyUmVhZGVyLCBCdWZmZXJXcml0ZXIgfSBmcm9tICdiaXRjb2luanMtbGliL3NyYy9idWZmZXJ1dGlscyc7XHJcblxyXG5jb25zdCB2YXJ1aW50ID0gcmVxdWlyZSgndmFydWludC1iaXRjb2luJyk7XHJcbmNvbnN0IHR5cGVmb3JjZSA9IHJlcXVpcmUoJ3R5cGVmb3JjZScpO1xyXG5cclxuaW1wb3J0IHsgbmV0d29ya3MgfSBmcm9tICcuLi8uLi9uZXR3b3Jrcyc7XHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbiwgdmFyU2xpY2VTaXplIH0gZnJvbSAnLi4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgZnJvbUJ1ZmZlclY0LCBmcm9tQnVmZmVyVjUsIHRvQnVmZmVyVjQsIHRvQnVmZmVyVjUsIFZBTFVFX0lOVDY0X1pFUk8gfSBmcm9tICcuL1pjYXNoQnVmZmVydXRpbHMnO1xyXG5pbXBvcnQgeyBnZXRCbGFrZTJiSGFzaCwgZ2V0U2lnbmF0dXJlRGlnZXN0LCBnZXRUeGlkRGlnZXN0IH0gZnJvbSAnLi9oYXNoWmlwMDI0NCc7XHJcblxyXG5jb25zdCBaRVJPID0gQnVmZmVyLmZyb20oJzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAnLCAnaGV4Jyk7XHJcblxyXG5leHBvcnQgdHlwZSBaY2FzaE5ldHdvcmsgPSB0eXBlb2YgbmV0d29ya3MuemNhc2ggfCB0eXBlb2YgbmV0d29ya3MuemNhc2hUZXN0O1xyXG5cclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNy4wL3NyYy9wcmltaXRpdmVzL3RyYW5zYWN0aW9uLmgjTDQwXHJcbmNvbnN0IFNBUExJTkdfVkVSU0lPTl9HUk9VUF9JRCA9IDB4ODkyZjIwODU7XHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjcuMC9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w1MlxyXG5jb25zdCBaSVAyMjVfVkVSU0lPTl9HUk9VUF9JRCA9IDB4MjZhNzI3MGE7XHJcblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC43LjAvc3JjL2NvbnNlbnN1cy91cGdyYWRlcy5jcHAjTDExXHJcbmNvbnN0IE9WRVJXSU5URVJfQlJBTkNIX0lEID0gMHg1YmE4MWIxOTtcclxuY29uc3QgQ0FOT1BZX0JSQU5DSF9JRCA9IDB4ZTlmZjc1YTY7XHJcbmNvbnN0IE5VNV9CUkFOQ0hfSUQgPSAweGMyZDZkMGI0O1xyXG5cclxuZXhwb3J0IGNsYXNzIFVuc3VwcG9ydGVkVHJhbnNhY3Rpb25FcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKG1lc3NhZ2UpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWZXJzaW9uR3JvdXBJZEZvclZlcnNpb24odmVyc2lvbjogbnVtYmVyKTogbnVtYmVyIHtcclxuICBzd2l0Y2ggKHZlcnNpb24pIHtcclxuICAgIGNhc2UgNDAwOlxyXG4gICAgY2FzZSA0NTA6XHJcbiAgICAgIHJldHVybiBTQVBMSU5HX1ZFUlNJT05fR1JPVVBfSUQ7XHJcbiAgICBjYXNlIDUwMDpcclxuICAgICAgcmV0dXJuIFpJUDIyNV9WRVJTSU9OX0dST1VQX0lEO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoYG5vIHZhbHVlIGZvciB2ZXJzaW9uICR7dmVyc2lvbn1gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRDb25zZW5zdXNCcmFuY2hJZEZvclZlcnNpb24obmV0d29yazogWmNhc2hOZXR3b3JrLCB2ZXJzaW9uOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIHN3aXRjaCAodmVyc2lvbikge1xyXG4gICAgY2FzZSAxOlxyXG4gICAgY2FzZSAyOlxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIGNhc2UgMzpcclxuICAgICAgc3dpdGNoIChuZXR3b3JrKSB7XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5mbHV4dGVzdG5ldDpcclxuICAgICAgICAgIHJldHVybiAweDViYTgxYjE5O1xyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgICAgICAgIHJldHVybiAweDZmNzY3MjdhO1xyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICAgICAgICByZXR1cm4gMHg1YmE4MWIxOTtcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgICAgICAgIHJldHVybiAweDZmNzc2MjdhO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICByZXR1cm4gT1ZFUldJTlRFUl9CUkFOQ0hfSUQ7XHJcbiAgICAgIH1cclxuICAgIGNhc2UgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfQ0FOT1BZOlxyXG4gICAgICAvLyBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUxXHJcbiAgICAgIHN3aXRjaCAobmV0d29yaykge1xyXG4gICAgICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuZmx1eHRlc3RuZXQ6XHJcbiAgICAgICAgICByZXR1cm4gMHg3NmI4MDliYjtcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICAgICAgICByZXR1cm4gMHg3MzYxNzA3YTtcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgICAgICAgcmV0dXJuIDB4OTMwYjU0MGQ7XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICAgICAgICByZXR1cm4gMHg3MzZjNjI3YTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcmV0dXJuIENBTk9QWV9CUkFOQ0hfSUQ7XHJcbiAgICAgIH1cclxuICAgIGNhc2UgNDpcclxuICAgIGNhc2UgNTpcclxuICAgIGNhc2UgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfTlU1OlxyXG4gICAgY2FzZSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT041X0JSQU5DSF9OVTU6XHJcbiAgICAgIC8vIGh0dHBzOi8vemlwcy56LmNhc2gvemlwLTAyNTJcclxuICAgICAgc3dpdGNoIChuZXR3b3JrKSB7XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5mbHV4dGVzdG5ldDpcclxuICAgICAgICAgIHJldHVybiAweDc2YjgwOWJiO1xyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgICAgICAgIHJldHVybiAweDczNjE3MDdhO1xyXG4gICAgICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICAgICAgICByZXR1cm4gMHg5MzBiNTQwZDtcclxuICAgICAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgICAgICAgIHJldHVybiAweDczNmM2MjdhO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICByZXR1cm4gTlU1X0JSQU5DSF9JRDtcclxuICAgICAgfVxyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoYG5vIHZhbHVlIGZvciB2ZXJzaW9uICR7dmVyc2lvbn1gKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFpjYXNoVHJhbnNhY3Rpb248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4gZXh0ZW5kcyBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gIHN0YXRpYyBWRVJTSU9OX0pPSU5TUExJVFNfU1VQUE9SVCA9IDI7XHJcbiAgc3RhdGljIFZFUlNJT05fT1ZFUldJTlRFUiA9IDM7XHJcbiAgc3RhdGljIFZFUlNJT05fU0FQTElORyA9IDQ7XHJcblxyXG4gIHN0YXRpYyBWRVJTSU9ONF9CUkFOQ0hfQ0FOT1BZID0gNDAwO1xyXG4gIHN0YXRpYyBWRVJTSU9ONF9CUkFOQ0hfTlU1ID0gNDUwO1xyXG4gIHN0YXRpYyBWRVJTSU9ONV9CUkFOQ0hfTlU1ID0gNTAwO1xyXG5cclxuICAvLyAxIGlmIHRoZSB0cmFuc2FjdGlvbiBpcyBwb3N0IG92ZXJ3aW50ZXIgdXBncmFkZSwgMCBvdGhlcndpc2VcclxuICBvdmVyd2ludGVyZWQgPSAwO1xyXG4gIC8vIDB4MDNDNDgyNzAgKDYzMjEwMDk2KSBmb3Igb3ZlcndpbnRlciBhbmQgMHg4OTJGMjA4NSAoMjMwMTU2NzEwOSkgZm9yIHNhcGxpbmdcclxuICB2ZXJzaW9uR3JvdXBJZCA9IDA7XHJcbiAgLy8gQmxvY2sgaGVpZ2h0IGFmdGVyIHdoaWNoIHRoaXMgdHJhbnNhY3Rpb25zIHdpbGwgZXhwaXJlLCBvciAwIHRvIGRpc2FibGUgZXhwaXJ5XHJcbiAgZXhwaXJ5SGVpZ2h0ID0gMDtcclxuICBjb25zZW5zdXNCcmFuY2hJZDogbnVtYmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmV0d29yazogWmNhc2hOZXR3b3JrLCB0eD86IFpjYXNoVHJhbnNhY3Rpb248YmlnaW50IHwgbnVtYmVyPiwgYW1vdW50VHlwZT86ICdiaWdpbnQnIHwgJ251bWJlcicpIHtcclxuICAgIHN1cGVyKG5ldHdvcmssIHR4LCBhbW91bnRUeXBlKTtcclxuXHJcbiAgICBsZXQgY29uc2Vuc3VzQnJhbmNoSWQ7XHJcbiAgICBpZiAodHgpIHtcclxuICAgICAgdGhpcy5vdmVyd2ludGVyZWQgPSB0eC5vdmVyd2ludGVyZWQ7XHJcbiAgICAgIHRoaXMudmVyc2lvbkdyb3VwSWQgPSB0eC52ZXJzaW9uR3JvdXBJZDtcclxuICAgICAgdGhpcy5leHBpcnlIZWlnaHQgPSB0eC5leHBpcnlIZWlnaHQ7XHJcblxyXG4gICAgICBpZiAodHguY29uc2Vuc3VzQnJhbmNoSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnNlbnN1c0JyYW5jaElkID0gdHguY29uc2Vuc3VzQnJhbmNoSWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuY29uc2Vuc3VzQnJhbmNoSWQgPSBjb25zZW5zdXNCcmFuY2hJZCA/PyBnZXREZWZhdWx0Q29uc2Vuc3VzQnJhbmNoSWRGb3JWZXJzaW9uKG5ldHdvcmssIHRoaXMudmVyc2lvbik7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICAgIGJ1ZmZlcjogQnVmZmVyLFxyXG4gICAgX19ub1N0cmljdDogYm9vbGVhbixcclxuICAgIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCcgPSAnbnVtYmVyJyxcclxuICAgIG5ldHdvcms/OiBaY2FzaE5ldHdvcmtcclxuICApOiBaY2FzaFRyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICBpZiAoIW5ldHdvcmspIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgbmV0d29ya2ApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGJ1ZmZlclJlYWRlciA9IG5ldyBCdWZmZXJSZWFkZXIoYnVmZmVyKTtcclxuICAgIGNvbnN0IHR4ID0gbmV3IFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4obmV0d29yayk7XHJcbiAgICB0eC52ZXJzaW9uID0gYnVmZmVyUmVhZGVyLnJlYWRJbnQzMigpO1xyXG5cclxuICAgIC8vIFNwbGl0IHRoZSBoZWFkZXIgaW50byBmT3ZlcndpbnRlcmVkIGFuZCBuVmVyc2lvblxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNS4xL3NyYy9wcmltaXRpdmVzL3RyYW5zYWN0aW9uLmgjTDc3MlxyXG4gICAgdHgub3ZlcndpbnRlcmVkID0gdHgudmVyc2lvbiA+Pj4gMzE7IC8vIE11c3QgYmUgMSBmb3IgdmVyc2lvbiAzIGFuZCB1cFxyXG4gICAgdHgudmVyc2lvbiA9IHR4LnZlcnNpb24gJiAweDA3ZmZmZmZmZjsgLy8gMyBmb3Igb3ZlcndpbnRlclxyXG4gICAgdHguY29uc2Vuc3VzQnJhbmNoSWQgPSBnZXREZWZhdWx0Q29uc2Vuc3VzQnJhbmNoSWRGb3JWZXJzaW9uKG5ldHdvcmssIHR4LnZlcnNpb24pO1xyXG5cclxuICAgIGlmICh0eC5pc092ZXJ3aW50ZXJDb21wYXRpYmxlKCkpIHtcclxuICAgICAgdHgudmVyc2lvbkdyb3VwSWQgPSBidWZmZXJSZWFkZXIucmVhZFVJbnQzMigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eC52ZXJzaW9uID09PSA1KSB7XHJcbiAgICAgIGZyb21CdWZmZXJWNShidWZmZXJSZWFkZXIsIHR4LCBhbW91bnRUeXBlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZyb21CdWZmZXJWNChidWZmZXJSZWFkZXIsIHR4LCBhbW91bnRUeXBlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoX19ub1N0cmljdCkgcmV0dXJuIHR4O1xyXG4gICAgaWYgKGJ1ZmZlclJlYWRlci5vZmZzZXQgIT09IGJ1ZmZlci5sZW5ndGgpIHtcclxuICAgICAgY29uc3QgdHJhaWxpbmcgPSBidWZmZXIuc2xpY2UoYnVmZmVyUmVhZGVyLm9mZnNldCk7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB0cmFpbGluZyBieXRlczogJHt0cmFpbGluZy50b1N0cmluZygnaGV4Jyl9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHR4O1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZyb21CdWZmZXJXaXRoVmVyc2lvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICAgIGJ1ZjogQnVmZmVyLFxyXG4gICAgbmV0d29yazogWmNhc2hOZXR3b3JrLFxyXG4gICAgdmVyc2lvbj86IG51bWJlcixcclxuICAgIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCcgPSAnbnVtYmVyJ1xyXG4gICk6IFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gICAgY29uc3QgdHggPSBaY2FzaFRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oYnVmLCBmYWxzZSwgYW1vdW50VHlwZSwgbmV0d29yayk7XHJcbiAgICBpZiAodmVyc2lvbikge1xyXG4gICAgICB0eC5jb25zZW5zdXNCcmFuY2hJZCA9IGdldERlZmF1bHRDb25zZW5zdXNCcmFuY2hJZEZvclZlcnNpb24obmV0d29yaywgdmVyc2lvbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHg7XHJcbiAgfVxyXG5cclxuICBieXRlTGVuZ3RoKCk6IG51bWJlciB7XHJcbiAgICBsZXQgYnl0ZUxlbmd0aCA9IHN1cGVyLmJ5dGVMZW5ndGgoKTtcclxuICAgIGlmICh0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgICBieXRlTGVuZ3RoICs9IDQ7IC8vIG5WZXJzaW9uR3JvdXBJZFxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuaXNPdmVyd2ludGVyQ29tcGF0aWJsZSgpKSB7XHJcbiAgICAgIGJ5dGVMZW5ndGggKz0gNDsgLy8gbkV4cGlyeUhlaWdodFxyXG4gICAgfVxyXG4gICAgY29uc3QgZW1wdHlWZWN0b3JMZW5ndGggPSB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKDApO1xyXG4gICAgaWYgKHRoaXMudmVyc2lvbiA9PT0gNSkge1xyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMODIyXHJcbiAgICAgIGJ5dGVMZW5ndGggKz0gNDsgLy8gY29uc2Vuc3VzQnJhbmNoSWRcclxuICAgICAgYnl0ZUxlbmd0aCArPSBlbXB0eVZlY3Rvckxlbmd0aDsgLy8gc2FwbGluZ0J1bmRsZSBpbnB1dHNcclxuICAgICAgYnl0ZUxlbmd0aCArPSBlbXB0eVZlY3Rvckxlbmd0aDsgLy8gc2FwbGluZ0J1bmRsZSBvdXRwdXRzXHJcbiAgICAgIGJ5dGVMZW5ndGggKz0gMTsgLy8gb3JjaGFyZEJ1bmRsZSAoZW1wdHkpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodGhpcy5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMODYyXHJcbiAgICAgICAgYnl0ZUxlbmd0aCArPSA4OyAvLyB2YWx1ZUJhbGFuY2UgKHVpbnQ2NClcclxuICAgICAgICBieXRlTGVuZ3RoICs9IGVtcHR5VmVjdG9yTGVuZ3RoOyAvLyBpbnB1dHNcclxuICAgICAgICBieXRlTGVuZ3RoICs9IGVtcHR5VmVjdG9yTGVuZ3RoOyAvLyBvdXRwdXRzXHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuc3VwcG9ydHNKb2luU3BsaXRzKCkpIHtcclxuICAgICAgICAvL1xyXG4gICAgICAgIGJ5dGVMZW5ndGggKz0gZW1wdHlWZWN0b3JMZW5ndGg7IC8vIGpvaW5zcGxpdHNcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ5dGVMZW5ndGg7XHJcbiAgfVxyXG5cclxuICBpc1NhcGxpbmdDb21wYXRpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhdGhpcy5vdmVyd2ludGVyZWQgJiYgdGhpcy52ZXJzaW9uID49IFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTl9TQVBMSU5HO1xyXG4gIH1cclxuXHJcbiAgaXNPdmVyd2ludGVyQ29tcGF0aWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAhIXRoaXMub3ZlcndpbnRlcmVkICYmIHRoaXMudmVyc2lvbiA+PSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT05fT1ZFUldJTlRFUjtcclxuICB9XHJcblxyXG4gIHN1cHBvcnRzSm9pblNwbGl0cygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAhIXRoaXMub3ZlcndpbnRlcmVkICYmIHRoaXMudmVyc2lvbiA+PSBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT05fSk9JTlNQTElUU19TVVBQT1JUO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGQgYSBoYXNoIGZvciBhbGwgb3Igbm9uZSBvZiB0aGUgdHJhbnNhY3Rpb24gaW5wdXRzIGRlcGVuZGluZyBvbiB0aGUgaGFzaHR5cGVcclxuICAgKiBAcGFyYW0gaGFzaFR5cGVcclxuICAgKiBAcmV0dXJucyBCdWZmZXIgLSBCTEFLRTJiIGhhc2ggb3IgMjU2LWJpdCB6ZXJvIGlmIGRvZXNuJ3QgYXBwbHlcclxuICAgKi9cclxuICBnZXRQcmV2b3V0SGFzaChoYXNoVHlwZTogbnVtYmVyKTogQnVmZmVyIHtcclxuICAgIGlmICghKGhhc2hUeXBlICYgVHJhbnNhY3Rpb24uU0lHSEFTSF9BTllPTkVDQU5QQVkpKSB7XHJcbiAgICAgIGNvbnN0IGJ1ZmZlcldyaXRlciA9IG5ldyBCdWZmZXJXcml0ZXIoQnVmZmVyLmFsbG9jVW5zYWZlKDM2ICogdGhpcy5pbnMubGVuZ3RoKSk7XHJcblxyXG4gICAgICB0aGlzLmlucy5mb3JFYWNoKGZ1bmN0aW9uICh0eEluKSB7XHJcbiAgICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UodHhJbi5oYXNoKTtcclxuICAgICAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodHhJbi5pbmRleCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsICdaY2FzaFByZXZvdXRIYXNoJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gWkVSTztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkIGEgaGFzaCBmb3IgYWxsIG9yIG5vbmUgb2YgdGhlIHRyYW5zYWN0aW9ucyBpbnB1dHMgc2VxdWVuY2UgbnVtYmVycyBkZXBlbmRpbmcgb24gdGhlIGhhc2h0eXBlXHJcbiAgICogQHBhcmFtIGhhc2hUeXBlXHJcbiAgICogQHJldHVybnMgQnVmZmVyIEJMQUtFMmIgaGFzaCBvciAyNTYtYml0IHplcm8gaWYgZG9lc24ndCBhcHBseVxyXG4gICAqL1xyXG4gIGdldFNlcXVlbmNlSGFzaChoYXNoVHlwZTogbnVtYmVyKTogQnVmZmVyIHtcclxuICAgIGlmIChcclxuICAgICAgIShoYXNoVHlwZSAmIFRyYW5zYWN0aW9uLlNJR0hBU0hfQU5ZT05FQ0FOUEFZKSAmJlxyXG4gICAgICAoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9TSU5HTEUgJiZcclxuICAgICAgKGhhc2hUeXBlICYgMHgxZikgIT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfTk9ORVxyXG4gICAgKSB7XHJcbiAgICAgIGNvbnN0IGJ1ZmZlcldyaXRlciA9IG5ldyBCdWZmZXJXcml0ZXIoQnVmZmVyLmFsbG9jVW5zYWZlKDQgKiB0aGlzLmlucy5sZW5ndGgpKTtcclxuXHJcbiAgICAgIHRoaXMuaW5zLmZvckVhY2goZnVuY3Rpb24gKHR4SW4pIHtcclxuICAgICAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodHhJbi5zZXF1ZW5jZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsICdaY2FzaFNlcXVlbmNIYXNoJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gWkVSTztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkIGEgaGFzaCBmb3Igb25lLCBhbGwgb3Igbm9uZSBvZiB0aGUgdHJhbnNhY3Rpb24gb3V0cHV0cyBkZXBlbmRpbmcgb24gdGhlIGhhc2h0eXBlXHJcbiAgICogQHBhcmFtIGhhc2hUeXBlXHJcbiAgICogQHBhcmFtIGluSW5kZXhcclxuICAgKiBAcmV0dXJucyBCdWZmZXIgQkxBS0UyYiBoYXNoIG9yIDI1Ni1iaXQgemVybyBpZiBkb2Vzbid0IGFwcGx5XHJcbiAgICovXHJcbiAgZ2V0T3V0cHV0c0hhc2goaGFzaFR5cGU6IG51bWJlciwgaW5JbmRleDogbnVtYmVyKTogQnVmZmVyIHtcclxuICAgIGlmICgoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9TSU5HTEUgJiYgKGhhc2hUeXBlICYgMHgxZikgIT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfTk9ORSkge1xyXG4gICAgICAvLyBGaW5kIG91dCB0aGUgc2l6ZSBvZiB0aGUgb3V0cHV0cyBhbmQgd3JpdGUgdGhlbVxyXG4gICAgICBjb25zdCB0eE91dHNTaXplID0gdGhpcy5vdXRzLnJlZHVjZShmdW5jdGlvbiAoc3VtLCBvdXRwdXQpIHtcclxuICAgICAgICByZXR1cm4gc3VtICsgOCArIHZhclNsaWNlU2l6ZShvdXRwdXQuc2NyaXB0KTtcclxuICAgICAgfSwgMCk7XHJcblxyXG4gICAgICBjb25zdCBidWZmZXJXcml0ZXIgPSBuZXcgQnVmZmVyV3JpdGVyKEJ1ZmZlci5hbGxvY1Vuc2FmZSh0eE91dHNTaXplKSk7XHJcblxyXG4gICAgICB0aGlzLm91dHMuZm9yRWFjaChmdW5jdGlvbiAob3V0KSB7XHJcbiAgICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDY0KG91dC52YWx1ZSk7XHJcbiAgICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVmFyU2xpY2Uob3V0LnNjcmlwdCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsICdaY2FzaE91dHB1dHNIYXNoJyk7XHJcbiAgICB9IGVsc2UgaWYgKChoYXNoVHlwZSAmIDB4MWYpID09PSBUcmFuc2FjdGlvbi5TSUdIQVNIX1NJTkdMRSAmJiBpbkluZGV4IDwgdGhpcy5vdXRzLmxlbmd0aCkge1xyXG4gICAgICAvLyBXcml0ZSBvbmx5IHRoZSBvdXRwdXQgc3BlY2lmaWVkIGluIGluSW5kZXhcclxuICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5vdXRzW2luSW5kZXhdO1xyXG5cclxuICAgICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2NVbnNhZmUoOCArIHZhclNsaWNlU2l6ZShvdXRwdXQuc2NyaXB0KSkpO1xyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50NjQob3V0cHV0LnZhbHVlKTtcclxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVmFyU2xpY2Uob3V0cHV0LnNjcmlwdCk7XHJcblxyXG4gICAgICByZXR1cm4gZ2V0Qmxha2UyYkhhc2goYnVmZmVyV3JpdGVyLmJ1ZmZlciwgJ1pjYXNoT3V0cHV0c0hhc2gnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBaRVJPO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFzaCB0cmFuc2FjdGlvbiBmb3Igc2lnbmluZyBhIHRyYW5zcGFyZW50IHRyYW5zYWN0aW9uIGluIFpjYXNoLiBQcm90ZWN0ZWQgdHJhbnNhY3Rpb25zIGFyZSBub3Qgc3VwcG9ydGVkLlxyXG4gICAqIEBwYXJhbSBpbkluZGV4XHJcbiAgICogQHBhcmFtIHByZXZPdXRTY3JpcHRcclxuICAgKiBAcGFyYW0gdmFsdWVcclxuICAgKiBAcGFyYW0gaGFzaFR5cGVcclxuICAgKiBAcmV0dXJucyBCdWZmZXIgQkxBS0UyYiBoYXNoXHJcbiAgICovXHJcbiAgaGFzaEZvclNpZ25hdHVyZUJ5TmV0d29yayhcclxuICAgIGluSW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCxcclxuICAgIHByZXZPdXRTY3JpcHQ6IEJ1ZmZlcixcclxuICAgIHZhbHVlOiBiaWdpbnQgfCBudW1iZXIgfCB1bmRlZmluZWQsXHJcbiAgICBoYXNoVHlwZTogbnVtYmVyXHJcbiAgKTogQnVmZmVyIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbXVzdCBwcm92aWRlIHZhbHVlYCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNS4xL3NyYy9zY3JpcHQvaW50ZXJwcmV0ZXIuY3BwI0wxMTc1XHJcbiAgICBpZiAodGhpcy52ZXJzaW9uID09PSA1KSB7XHJcbiAgICAgIHJldHVybiBnZXRTaWduYXR1cmVEaWdlc3QodGhpcywgaW5JbmRleCwgcHJldk91dFNjcmlwdCwgdmFsdWUsIGhhc2hUeXBlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBaQ2FzaCBhbW91bnRzIGFyZSBhbHdheXMgd2l0aGluIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSXHJcbiAgICB2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCcgPyBOdW1iZXIodmFsdWUpIDogdmFsdWU7XHJcbiAgICB0eXBlZm9yY2UodHlwZXMudHVwbGUodHlwZXMuVUludDMyLCB0eXBlcy5CdWZmZXIsIHR5cGVzLk51bWJlciksIFtpbkluZGV4LCBwcmV2T3V0U2NyaXB0LCB2YWx1ZV0pO1xyXG5cclxuICAgIGlmIChpbkluZGV4ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGluSW5kZXhgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgaWYgKGluSW5kZXggPj0gdGhpcy5pbnMubGVuZ3RoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW5wdXQgaW5kZXggaXMgb3V0IG9mIHJhbmdlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIGlmICghdGhpcy5pc092ZXJ3aW50ZXJDb21wYXRpYmxlKCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCB2ZXJzaW9uICR7dGhpcy52ZXJzaW9ufWApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGhhc2hQcmV2b3V0cyA9IHRoaXMuZ2V0UHJldm91dEhhc2goaGFzaFR5cGUpO1xyXG4gICAgY29uc3QgaGFzaFNlcXVlbmNlID0gdGhpcy5nZXRTZXF1ZW5jZUhhc2goaGFzaFR5cGUpO1xyXG4gICAgY29uc3QgaGFzaE91dHB1dHMgPSB0aGlzLmdldE91dHB1dHNIYXNoKGhhc2hUeXBlLCBpbkluZGV4KTtcclxuICAgIGNvbnN0IGhhc2hKb2luU3BsaXRzID0gWkVSTztcclxuICAgIGNvbnN0IGhhc2hTaGllbGRlZFNwZW5kcyA9IFpFUk87XHJcbiAgICBjb25zdCBoYXNoU2hpZWxkZWRPdXRwdXRzID0gWkVSTztcclxuXHJcbiAgICBsZXQgYmFzZUJ1ZmZlclNpemUgPSAwO1xyXG4gICAgYmFzZUJ1ZmZlclNpemUgKz0gNCAqIDU7IC8vIGhlYWRlciwgblZlcnNpb25Hcm91cElkLCBsb2NrX3RpbWUsIG5FeHBpcnlIZWlnaHQsIGhhc2hUeXBlXHJcbiAgICBiYXNlQnVmZmVyU2l6ZSArPSAzMiAqIDQ7IC8vIDI1NiBoYXNoZXM6IGhhc2hQcmV2b3V0cywgaGFzaFNlcXVlbmNlLCBoYXNoT3V0cHV0cywgaGFzaEpvaW5TcGxpdHNcclxuICAgIGJhc2VCdWZmZXJTaXplICs9IDQgKiAyOyAvLyBpbnB1dC5pbmRleCwgaW5wdXQuc2VxdWVuY2VcclxuICAgIGJhc2VCdWZmZXJTaXplICs9IDg7IC8vIHZhbHVlXHJcbiAgICBiYXNlQnVmZmVyU2l6ZSArPSAzMjsgLy8gaW5wdXQuaGFzaFxyXG4gICAgYmFzZUJ1ZmZlclNpemUgKz0gdmFyU2xpY2VTaXplKHByZXZPdXRTY3JpcHQpOyAvLyBwcmV2T3V0U2NyaXB0XHJcbiAgICBpZiAodGhpcy5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcclxuICAgICAgYmFzZUJ1ZmZlclNpemUgKz0gMzIgKiAyOyAvLyBoYXNoU2hpZWxkZWRTcGVuZHMgYW5kIGhhc2hTaGllbGRlZE91dHB1dHNcclxuICAgICAgYmFzZUJ1ZmZlclNpemUgKz0gODsgLy8gdmFsdWVCYWxhbmNlXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWFzayA9IHRoaXMub3ZlcndpbnRlcmVkID8gMSA6IDA7XHJcbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzLnZlcnNpb24gfCAobWFzayA8PCAzMSk7XHJcblxyXG4gICAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2MoYmFzZUJ1ZmZlclNpemUpKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZUludDMyKGhlYWRlcik7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodGhpcy52ZXJzaW9uR3JvdXBJZCk7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShoYXNoUHJldm91dHMpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaFNlcXVlbmNlKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hPdXRwdXRzKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hKb2luU3BsaXRzKTtcclxuICAgIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShoYXNoU2hpZWxkZWRTcGVuZHMpO1xyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShoYXNoU2hpZWxkZWRPdXRwdXRzKTtcclxuICAgIH1cclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0aGlzLmxvY2t0aW1lKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0aGlzLmV4cGlyeUhlaWdodCk7XHJcbiAgICBpZiAodGhpcy5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcclxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoVkFMVUVfSU5UNjRfWkVSTyk7XHJcbiAgICB9XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVJbnQzMihoYXNoVHlwZSk7XHJcblxyXG4gICAgLy8gVGhlIGlucHV0IGJlaW5nIHNpZ25lZCAocmVwbGFjaW5nIHRoZSBzY3JpcHRTaWcgd2l0aCBzY3JpcHRDb2RlICsgYW1vdW50KVxyXG4gICAgLy8gVGhlIHByZXZvdXQgbWF5IGFscmVhZHkgYmUgY29udGFpbmVkIGluIGhhc2hQcmV2b3V0LCBhbmQgdGhlIG5TZXF1ZW5jZVxyXG4gICAgLy8gbWF5IGFscmVhZHkgYmUgY29udGFpbmVkIGluIGhhc2hTZXF1ZW5jZS5cclxuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5pbnNbaW5JbmRleF07XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShpbnB1dC5oYXNoKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMihpbnB1dC5pbmRleCk7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJTbGljZShwcmV2T3V0U2NyaXB0KTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ2NCh2YWx1ZSk7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIoaW5wdXQuc2VxdWVuY2UpO1xyXG5cclxuICAgIGNvbnN0IHBlcnNvbmFsaXphdGlvbiA9IEJ1ZmZlci5hbGxvYygxNik7XHJcbiAgICBjb25zdCBwcmVmaXggPSAnWmNhc2hTaWdIYXNoJztcclxuICAgIHBlcnNvbmFsaXphdGlvbi53cml0ZShwcmVmaXgpO1xyXG4gICAgcGVyc29uYWxpemF0aW9uLndyaXRlVUludDMyTEUodGhpcy5jb25zZW5zdXNCcmFuY2hJZCwgcHJlZml4Lmxlbmd0aCk7XHJcblxyXG4gICAgcmV0dXJuIGdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsIHBlcnNvbmFsaXphdGlvbik7XHJcbiAgfVxyXG5cclxuICB0b0J1ZmZlcihidWZmZXI/OiBCdWZmZXIsIGluaXRpYWxPZmZzZXQgPSAwKTogQnVmZmVyIHtcclxuICAgIGlmICghYnVmZmVyKSBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUodGhpcy5ieXRlTGVuZ3RoKCkpO1xyXG5cclxuICAgIGNvbnN0IGJ1ZmZlcldyaXRlciA9IG5ldyBCdWZmZXJXcml0ZXIoYnVmZmVyLCBpbml0aWFsT2Zmc2V0KTtcclxuXHJcbiAgICBpZiAodGhpcy5pc092ZXJ3aW50ZXJDb21wYXRpYmxlKCkpIHtcclxuICAgICAgY29uc3QgbWFzayA9IHRoaXMub3ZlcndpbnRlcmVkID8gMSA6IDA7XHJcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZUludDMyKHRoaXMudmVyc2lvbiB8IChtYXNrIDw8IDMxKSk7IC8vIFNldCBvdmVyd2ludGVyIGJpdFxyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodGhpcy52ZXJzaW9uR3JvdXBJZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVJbnQzMih0aGlzLnZlcnNpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnZlcnNpb24gPT09IDUpIHtcclxuICAgICAgdG9CdWZmZXJWNShidWZmZXJXcml0ZXIsIHRoaXMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdG9CdWZmZXJWNChidWZmZXJXcml0ZXIsIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbml0aWFsT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGJ1ZmZlci5zbGljZShpbml0aWFsT2Zmc2V0LCBidWZmZXJXcml0ZXIub2Zmc2V0KTtcclxuICAgIH1cclxuICAgIHJldHVybiBidWZmZXI7XHJcbiAgfVxyXG5cclxuICBnZXRIYXNoKGZvcldpdG5lc3M/OiBib29sZWFuKTogQnVmZmVyIHtcclxuICAgIGlmIChmb3JXaXRuZXNzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBhcmd1bWVudGApO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMudmVyc2lvbiA9PT0gNSkge1xyXG4gICAgICByZXR1cm4gZ2V0VHhpZERpZ2VzdCh0aGlzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjcnlwdG8uaGFzaDI1Nih0aGlzLnRvQnVmZmVyKCkpO1xyXG4gIH1cclxuXHJcbiAgY2xvbmU8VE4yIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gVE51bWJlcj4oYW1vdW50VHlwZT86ICdiaWdpbnQnIHwgJ251bWJlcicpOiBaY2FzaFRyYW5zYWN0aW9uPFROMj4ge1xyXG4gICAgcmV0dXJuIG5ldyBaY2FzaFRyYW5zYWN0aW9uPFROMj4odGhpcy5uZXR3b3JrLCB0aGlzLCBhbW91bnRUeXBlKTtcclxuICB9XHJcbn1cclxuIl19