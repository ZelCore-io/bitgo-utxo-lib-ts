/**
 * Implements hashing methods described in https://zips.z.cash/zip-0244.
 * Only supports full transparent transactions without shielded inputs or outputs.
 */
import { TxInput, TxOutput } from 'bitcoinjs-lib';
import { BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

const blake2b = require('@bitgo/blake2b');

import { ZcashTransaction } from './ZcashTransaction';
import { varSliceSize } from '../UtxoTransaction';

/**
 * The coin spent by a transparent input: its scriptPubKey (pk_script) and value.
 * Final ZIP 244 commits to these for every transparent input of the transaction.
 */
export type ZcashPrevOutput<TNumber extends number | bigint = number> = {
  script: Buffer;
  value: TNumber;
};

type SignatureParams<TNumber extends number | bigint = number> = {
  // index of the transparent input being signed, undefined when signing a shielded spend or action
  inIndex?: number;
  hashType: number;
  // prevout data of every transparent input, in input order
  prevOutputs: ZcashPrevOutput<TNumber>[];
};

const SIGHASH_ALL = 0x01;
const SIGHASH_NONE = 0x02;
const SIGHASH_SINGLE = 0x03;
const SIGHASH_ANYONECANPAY = 0x80;
// https://zips.z.cash/zip-0244#s-2a-hash-type
const VALID_HASH_TYPES = [0x01, 0x02, 0x03, 0x81, 0x82, 0x83];

/**
 * Blake2b hashing algorithm for Zcash
 * @param buffer
 * @param personalization
 * @returns 256-bit BLAKE2b hash
 */
export function getBlake2bHash(buffer: Buffer, personalization: string | Buffer): Buffer {
  const out = Buffer.allocUnsafe(32);
  personalization = Buffer.from(personalization);
  return blake2b(out.length, null, null, personalization).update(buffer).digest(out);
}

function getHeaderDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#t-1-header-digest
  const mask = tx.overwintered ? 1 : 0;
  const writer = BufferWriter.withCapacity(4 * 5);
  writer.writeInt32(tx.version | (mask << 31)); // Set overwinter bit
  writer.writeUInt32(tx.versionGroupId);
  writer.writeUInt32(tx.consensusBranchId);
  writer.writeUInt32(tx.locktime);
  writer.writeUInt32(tx.expiryHeight);
  return getBlake2bHash(writer.end(), 'ZTxIdHeadersHash');
}

export function getPrevoutsDigest(ins: TxInput[], tag = 'ZTxIdPrevoutHash'): Buffer {
  // txid: https://zips.z.cash/zip-0244#t-2a-prevouts-digest
  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(36 * ins.length));
  ins.forEach(function (txIn) {
    bufferWriter.writeSlice(txIn.hash);
    bufferWriter.writeUInt32(txIn.index);
  });
  return getBlake2bHash(bufferWriter.end(), tag);
}

export function getSequenceDigest(ins: TxInput[], tag = 'ZTxIdSequencHash'): Buffer {
  // txid: https://zips.z.cash/zip-0244#t-2b-sequence-digest
  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(4 * ins.length));
  ins.forEach(function (txIn) {
    bufferWriter.writeUInt32(txIn.sequence);
  });
  return getBlake2bHash(bufferWriter.end(), tag);
}

export function getOutputsDigest<TNumber extends number | bigint>(
  outs: TxOutput<TNumber>[],
  tag = 'ZTxIdOutputsHash'
): Buffer {
  // txid: https://zips.z.cash/zip-0244#t-2c-outputs-digest
  const txOutsSize = outs.reduce(function (sum, output) {
    return sum + 8 + varSliceSize(output.script);
  }, 0);
  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(txOutsSize));
  outs.forEach(function (out) {
    bufferWriter.writeUInt64(out.value);
    bufferWriter.writeVarSlice(out.script);
  });
  return getBlake2bHash(bufferWriter.end(), tag);
}

export function getAmountsDigest<TNumber extends number | bigint>(prevOutputs: ZcashPrevOutput<TNumber>[]): Buffer {
  // https://zips.z.cash/zip-0244#s-2c-amounts-sig-digest
  // 8-byte signed little-endian values. Values are non-negative, so the unsigned encoding is identical.
  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(8 * prevOutputs.length));
  prevOutputs.forEach(function ({ value }) {
    bufferWriter.writeUInt64(value);
  });
  return getBlake2bHash(bufferWriter.end(), 'ZTxTrAmountsHash');
}

export function getScriptPubKeysDigest<TNumber extends number | bigint>(
  prevOutputs: ZcashPrevOutput<TNumber>[]
): Buffer {
  // https://zips.z.cash/zip-0244#s-2d-scriptpubkeys-sig-digest
  const size = prevOutputs.reduce((sum, { script }) => sum + varSliceSize(script), 0);
  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(size));
  prevOutputs.forEach(function ({ script }) {
    bufferWriter.writeVarSlice(script);
  });
  return getBlake2bHash(bufferWriter.end(), 'ZTxTrScriptsHash');
}

function getTxinSigDigest<TNumber extends number | bigint>(
  input: TxInput | undefined,
  prevOutput: ZcashPrevOutput<TNumber> | undefined
): Buffer {
  // https://zips.z.cash/zip-0244#s-2g-txin-sig-digest
  if (!input || !prevOutput) {
    // signing a shielded spend or action
    return getBlake2bHash(Buffer.of(), 'Zcash___TxInHash');
  }
  const writer = BufferWriter.withCapacity(
    32 /* prevout hash */ + 4 /* prevout index */ + 8 /* value */ + varSliceSize(prevOutput.script) + 4 /* sequence */
  );
  writer.writeSlice(input.hash);
  writer.writeUInt32(input.index);
  writer.writeUInt64(prevOutput.value);
  writer.writeVarSlice(prevOutput.script);
  writer.writeUInt32(input.sequence);
  return getBlake2bHash(writer.end(), 'Zcash___TxInHash');
}

function getTransparentTxidDigest<TNumber extends number | bigint>(tx: {
  ins: TxInput[];
  outs: TxOutput<TNumber>[];
}): Buffer {
  // https://zips.z.cash/zip-0244#t-2-transparent-digest
  let buffer;
  if (tx.ins.length || tx.outs.length) {
    const writer = BufferWriter.withCapacity(32 * 3);
    writer.writeSlice(getPrevoutsDigest(tx.ins));
    writer.writeSlice(getSequenceDigest(tx.ins));
    writer.writeSlice(getOutputsDigest(tx.outs));
    buffer = writer.end();
  } else {
    buffer = Buffer.of();
  }
  return getBlake2bHash(buffer, 'ZTxIdTranspaHash');
}

function getTransparentSigDigest<TNumber extends number | bigint>(
  tx: ZcashTransaction<TNumber>,
  { inIndex, hashType, prevOutputs }: SignatureParams<TNumber>
): Buffer {
  // https://zips.z.cash/zip-0244#s-2-transparent-sig-digest
  if (tx.ins.length === 0 || tx.isCoinbase()) {
    // coinbase, or no transparent inputs: identical to the txid transparent digest (T.2)
    return getTransparentTxidDigest(tx);
  }

  if (!VALID_HASH_TYPES.includes(hashType)) {
    throw new Error(`invalid ZIP 244 hash_type 0x${hashType.toString(16)}`);
  }
  if (inIndex === undefined && hashType !== SIGHASH_ALL) {
    // https://zips.z.cash/zip-0244#s-2a-hash-type: shielded spends and actions use SIGHASH_ALL
    throw new Error(`a shielded signature hash must use SIGHASH_ALL`);
  }
  if (inIndex !== undefined && (inIndex < 0 || inIndex >= tx.ins.length)) {
    throw new Error(`input index ${inIndex} is out of range`);
  }
  if (prevOutputs.length !== tx.ins.length) {
    throw new Error(
      `ZIP 244 signature hash needs the prevout data of every transparent input: got ${prevOutputs.length}, transaction has ${tx.ins.length} inputs`
    );
  }

  const anyoneCanPay = (hashType & SIGHASH_ANYONECANPAY) !== 0;
  const baseType = hashType & 0x1f;

  let outputsSigDigest: Buffer;
  if (baseType === SIGHASH_SINGLE) {
    // https://zips.z.cash/zip-0244#s-2a-hash-type: SIGHASH_SINGLE without a corresponding output is invalid
    if (inIndex === undefined || tx.outs[inIndex] === undefined) {
      throw new Error(`SIGHASH_SINGLE requires an output with the same index as input ${inIndex}`);
    }
    outputsSigDigest = getOutputsDigest([tx.outs[inIndex]]);
  } else if (baseType === SIGHASH_NONE) {
    outputsSigDigest = getOutputsDigest([]);
  } else {
    outputsSigDigest = getOutputsDigest(tx.outs);
  }

  const writer = BufferWriter.withCapacity(1 + 32 * 6);
  // S.2a hash_type
  writer.writeUInt8(hashType);
  // S.2b prevouts_sig_digest
  writer.writeSlice(getPrevoutsDigest(anyoneCanPay ? [] : tx.ins));
  // S.2c amounts_sig_digest
  writer.writeSlice(getAmountsDigest(anyoneCanPay ? [] : prevOutputs));
  // S.2d scriptpubkeys_sig_digest
  writer.writeSlice(getScriptPubKeysDigest(anyoneCanPay ? [] : prevOutputs));
  // S.2e sequence_sig_digest (blanked only for ANYONECANPAY)
  writer.writeSlice(getSequenceDigest(anyoneCanPay ? [] : tx.ins));
  // S.2f outputs_sig_digest
  writer.writeSlice(outputsSigDigest);
  // S.2g txin_sig_digest
  writer.writeSlice(
    inIndex === undefined
      ? getTxinSigDigest(undefined, undefined)
      : getTxinSigDigest(tx.ins[inIndex], prevOutputs[inIndex])
  );
  return getBlake2bHash(writer.end(), 'ZTxIdTranspaHash');
}

function getSaplingDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#t-3-sapling-digest
  return getBlake2bHash(Buffer.of(), 'ZTxIdSaplingHash');
}

function getOrchardDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#t-4-orchard-digest
  return getBlake2bHash(Buffer.of(), 'ZTxIdOrchardHash');
}

/**
 * @param tx
 * @param signatureParams - calculates txid when undefined
 */
function getDigest<TNumber extends number | bigint>(
  tx: ZcashTransaction<TNumber>,
  signatureParams?: SignatureParams<TNumber>
): Buffer {
  // txid: https://zips.z.cash/zip-0244#id4
  // sig: https://zips.z.cash/zip-0244#id13
  const writer = BufferWriter.withCapacity(32 * 4);
  writer.writeSlice(getHeaderDigest(tx));
  writer.writeSlice(signatureParams ? getTransparentSigDigest(tx, signatureParams) : getTransparentTxidDigest(tx));
  writer.writeSlice(getSaplingDigest(tx));
  writer.writeSlice(getOrchardDigest(tx));

  const tag = 'ZcashTxHash_';
  const personalization = BufferWriter.withCapacity(tag.length + 4 /* UInt32 */);
  personalization.writeSlice(Buffer.from(tag));
  personalization.writeUInt32(tx.consensusBranchId);
  return getBlake2bHash(writer.end(), personalization.end());
}

export function getTxidDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#id4
  return getDigest(tx);
}

/**
 * Final ZIP 244 signature digest (https://zips.z.cash/zip-0244#signature-digest).
 * @param tx
 * @param inIndex - transparent input being signed, undefined for a shielded spend or action
 * @param hashType
 * @param prevOutputs - scriptPubKey and value of the coin spent by every transparent input, in input order
 */
export function getSignatureDigest<TNumber extends number | bigint>(
  tx: ZcashTransaction<TNumber>,
  inIndex: number | undefined,
  hashType: number,
  prevOutputs: ZcashPrevOutput<TNumber>[]
): Buffer {
  return getDigest(tx, { inIndex, hashType, prevOutputs });
}
