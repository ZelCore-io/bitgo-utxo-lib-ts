import * as assert from 'assert';
import { payments } from 'bitcoinjs-lib';
import * as types from 'bitcoinjs-lib/src/types';
import { Base58CheckResult } from 'bitcoinjs-lib/src/address';
import { isZcash, Network, isZcash8BitUnit } from '../../networks';
const bs58check = require('bs58check');
const typeforce = require('typeforce');

export function fromBase58Check(address: string, network: Network): Base58CheckResult {
  const payload = bs58check.decode(address);
  const isZelcoreLegacyZcashUint8 = isZcash8BitUnit(network) && payload.length === 21;
  const version = isZelcoreLegacyZcashUint8 ? payload.readUInt8(0) : payload.readUInt16BE(0);
  const hash = isZelcoreLegacyZcashUint8 ? payload.slice(1): payload.slice(2);
  return { version, hash };
}

export function toBase58Check(hash: Buffer, version: number): string {
  typeforce(types.tuple(types.Hash160bit, types.Number), arguments);

  const payload = Buffer.allocUnsafe(22);
  payload.writeUInt16BE(version, 0);
  hash.copy(payload, 2);
  return bs58check.encode(payload);
}

export function fromOutputScript(outputScript: Buffer, network: Network): string {
  assert(isZcash(network));
  let o;
  let prefix;
  try {
    o = payments.p2pkh({ output: outputScript });
    prefix = network.pubKeyHash;
  } catch (e) {}
  try {
    o = payments.p2sh({ output: outputScript });
    prefix = network.scriptHash;
  } catch (e) {}
  if (!o || !o.hash || prefix === undefined) {
    throw new Error(`unsupported outputScript`);
  }
  return toBase58Check(o.hash, prefix);
}

export function toOutputScript(address: string, network: Network): Buffer {
  assert(isZcash(network));
  const { version, hash } = fromBase58Check(address, network);
  if (version === network.pubKeyHash) {
    return payments.p2pkh({ hash }).output as Buffer;
  }
  if (version === network.scriptHash) {
    return payments.p2sh({ hash }).output as Buffer;
  }
  throw new Error(address + ' has no matching Script');
}
