import * as types from 'bitcoinjs-lib/src/types';
import { Transaction } from 'bitcoinjs-lib';
import { crypto as bcrypto, script as bscript } from 'bitcoinjs-lib';
import { script as script_1 } from 'bitcoinjs-lib';
import * as bufferutils_1 from 'bitcoinjs-lib/src/bufferutils';

const typeforce = require('typeforce');

const ZERO = Buffer.from(
  '0000000000000000000000000000000000000000000000000000000000000000',
  'hex',
);

const ONE = Buffer.from(
  '0000000000000000000000000000000000000000000000000000000000000001',
  'hex',
);

const EMPTY_BUFFER = Buffer.allocUnsafe(0);

const VALUE_UINT64_MAX = Buffer.from('ffffffffffffffff', 'hex');

const BLANK_OUTPUT = {
  script: EMPTY_BUFFER,
  valueBuffer: VALUE_UINT64_MAX,
};

function varSliceSize(someScript) {
  const length = someScript.length;
  return bufferutils_1.varuint.encodingLength(length) + length;
}

export function hashForSignature(
  inIndex,
  prevOutScript,
  hashType,
  prevOutValue,
  cloneTx,
) {
  typeforce(
    types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number),
    arguments,
  );
  // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L29
  if (inIndex >= cloneTx.ins.length) return ONE;
  // ignore OP_CODESEPARATOR
  const decompiled = bscript.decompile(prevOutScript);
  if (decompiled === null) return ONE;
  const ourScript = bscript.compile(
    decompiled.filter(x => {
      return x !== script_1.OPS.OP_CODESEPARATOR;
    }),
  );
  const txTmp = cloneTx;
  // SIGHASH_NONE: ignore all outputs? (wildcard payee)
  if ((hashType & 0x1f) === Transaction.SIGHASH_NONE) {
    txTmp.outs = [];
    // ignore sequence numbers (except at inIndex)
    txTmp.ins.forEach((input, i) => {
      if (i === inIndex) return;
      input.sequence = 0;
    });
    // SIGHASH_SINGLE: ignore all outputs, except at the same index?
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE) {
    // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L60
    if (inIndex >= cloneTx.outs.length) return ONE;
    // truncate outputs after
    txTmp.outs.length = inIndex + 1;
    // "blank" outputs before
    for (let i = 0; i < inIndex; i++) {
      txTmp.outs[i] = BLANK_OUTPUT;
    }
    // ignore sequence numbers (except at inIndex)
    txTmp.ins.forEach((input, y) => {
      if (y === inIndex) return;
      input.sequence = 0;
    });
  }
  // SIGHASH_ANYONECANPAY: ignore inputs entirely?
  if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
    txTmp.ins = [txTmp.ins[inIndex]];
    txTmp.ins[0].script = ourScript;
    // SIGHASH_ALL: only ignore input scripts
  } else {
    // "blank" others input scripts
    txTmp.ins.forEach(input => {
      input.script = EMPTY_BUFFER;
    });
    txTmp.ins[inIndex].script = ourScript;
  }
  // serialize and hash
  const buffer = Buffer.allocUnsafe(txTmp.byteLength(false) + 4);
  buffer.writeInt32LE(hashType, buffer.length - 4);
  txTmp.__toBuffer(buffer, 0, false);
  return bcrypto.sha256(buffer);
}

export function hashForWitnessV0(inIndex, prevOutScript, value, hashType, cloneTx) {
  typeforce(
    types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32),
    arguments,
  );
  let tbuffer = Buffer.from([]);
  let bufferWriter;
  let hashOutputs = ZERO;
  let hashPrevouts = ZERO;
  let hashSequence = ZERO;
  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
    tbuffer = Buffer.allocUnsafe(36 * cloneTx.ins.length);
    bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
    cloneTx.ins.forEach(txIn => {
      bufferWriter.writeSlice(txIn.hash);
      bufferWriter.writeUInt32(txIn.index);
    });
    hashPrevouts = bcrypto.sha256(tbuffer);
  }
  if (
    !(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
    (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
    (hashType & 0x1f) !== Transaction.SIGHASH_NONE
  ) {
    tbuffer = Buffer.allocUnsafe(4 * cloneTx.ins.length);
    bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
    cloneTx.ins.forEach(txIn => {
      bufferWriter.writeUInt32(txIn.sequence);
    });
    hashSequence = bcrypto.sha256(tbuffer);
  }
  if (
    (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
    (hashType & 0x1f) !== Transaction.SIGHASH_NONE
  ) {
    const txOutsSize = cloneTx.outs.reduce((sum, output) => {
      return sum + 8 + varSliceSize(output.script);
    }, 0);
    tbuffer = Buffer.allocUnsafe(txOutsSize);
    bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
    cloneTx.outs.forEach(out => {
      bufferWriter.writeUInt64(out.value);
      bufferWriter.writeVarSlice(out.script);
    });
    hashOutputs = bcrypto.sha256(tbuffer);
  } else if (
    (hashType & 0x1f) === Transaction.SIGHASH_SINGLE &&
    inIndex < cloneTx.outs.length
  ) {
    const output = cloneTx.outs[inIndex];
    tbuffer = Buffer.allocUnsafe(8 + varSliceSize(output.script));
    bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
    bufferWriter.writeUInt64(output.value);
    bufferWriter.writeVarSlice(output.script);
    hashOutputs = bcrypto.sha256(tbuffer);
  }
  tbuffer = Buffer.allocUnsafe(156 + varSliceSize(prevOutScript));
  bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
  const input = cloneTx.ins[inIndex];
  bufferWriter.writeInt32(cloneTx.version);
  bufferWriter.writeSlice(hashPrevouts);
  bufferWriter.writeSlice(hashSequence);
  bufferWriter.writeSlice(input.hash);
  bufferWriter.writeUInt32(input.index);
  bufferWriter.writeVarSlice(prevOutScript);
  bufferWriter.writeUInt64(value);
  bufferWriter.writeUInt32(input.sequence);
  bufferWriter.writeSlice(hashOutputs);
  bufferWriter.writeUInt32(cloneTx.locktime);
  bufferWriter.writeUInt32(hashType);
  return bcrypto.sha256(tbuffer);
}