import * as types from 'bitcoinjs-lib/src/types';
import { crypto as bcrypto } from 'bitcoinjs-lib';
import { Base58CheckResult } from 'bitcoinjs-lib/src/address';
const bs58checkBase = require('bs58check/base');
const typeforce = require('typeforce');

export function fromBase58Check(address: string): Base58CheckResult {
  const payload = bs58checkBase(bcrypto.sha256).decode(address);
  // TODO: 4.0.0, move to "toOutputScript"
  if (payload.length < 21) throw new TypeError(address + ' is too short');
  if (payload.length > 21) throw new TypeError(address + ' is too long');
  const version = payload.readUInt8(0);
  const hash = payload.slice(1);
  return { version, hash };
}

export function toBase58Check(hash: Buffer, version: number): string {
  typeforce(types.tuple(types.Hash160bit, types.UInt8), arguments);
  const payload = Buffer.allocUnsafe(21);
  payload.writeUInt8(version, 0);
  hash.copy(payload, 1);
  return bs58checkBase(bcrypto.sha256).encode(payload);
}
