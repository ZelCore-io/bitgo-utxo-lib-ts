import * as assert from 'assert';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as varuint from 'varuint-bitcoin';
import { toTNumber } from './tnumber';

import { networks, Network, getMainnet, isBitcoinGold, isBithereum } from '../networks';
import * as grsTx from './groestlcoin';

export function varSliceSize(slice: Buffer): number {
  const length = slice.length;
  return varuint.encodingLength(length) + length;
}

export class UtxoTransaction<TNumber extends number | bigint = number> extends bitcoinjs.Transaction<TNumber> {
  static readonly SIGHASH_FORKID = 0x40;
  static readonly SIGHASH_FORKID_BTH = 0x10;
  /** @deprecated use SIGHASH_FORKID */
  static SIGHASH_BITCOINCASHBIP143 = UtxoTransaction.SIGHASH_FORKID;

  constructor(
    public network: Network,
    transaction?: bitcoinjs.Transaction<bigint | number>,
    amountType?: 'bigint' | 'number'
  ) {
    super();
    if (transaction) {
      this.version = transaction.version;
      this.locktime = transaction.locktime;
      this.ins = transaction.ins.map((v) => ({ ...v, witness: [...v.witness] }));
      if (transaction.outs.length) {
        // amountType only matters if there are outs
        const inAmountType = typeof transaction.outs[0].value;
        assert(inAmountType === 'number' || inAmountType === 'bigint');
        const outAmountType: 'number' | 'bigint' = amountType || inAmountType;
        this.outs = transaction.outs.map((v) => ({ ...v, value: toTNumber(v.value, outAmountType) }));
      }
    }
  }

  protected static newTransaction<TNumber extends number | bigint = number>(
    network: Network,
    transaction?: bitcoinjs.Transaction<bigint | number>,
    amountType?: 'number' | 'bigint'
  ): UtxoTransaction<TNumber> {
    return new UtxoTransaction<TNumber>(network, transaction, amountType);
  }

  static fromBuffer<TNumber extends number | bigint = number>(
    buf: Buffer,
    noStrict: boolean,
    amountType: 'number' | 'bigint' = 'number',
    network?: Network,
    prevOutput?: bitcoinjs.TxOutput<TNumber>[]
  ): UtxoTransaction<TNumber> {
    if (!network) {
      throw new Error(`must provide network`);
    }
    return this.newTransaction<TNumber>(
      network,
      bitcoinjs.Transaction.fromBuffer<TNumber>(buf, noStrict, amountType),
      amountType
    );
  }

  addForkId(hashType: number): number {
    /*
      ``The sighash type is altered to include a 24-bit fork id in its most significant bits.''
      We also use unsigned right shift operator `>>>` to cast to UInt32
      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
     */
    const isBthFid = isBithereum(this.network) && (hashType & UtxoTransaction.SIGHASH_FORKID_BTH); // Bithereum SIGHASH_FORKID
    if ((hashType & UtxoTransaction.SIGHASH_FORKID) || isBthFid) {
      let forkId = isBitcoinGold(this.network) ? 79 : 0;
      if (isBthFid) forkId = 85; // Bithereum fork id
      return (hashType | (forkId << 8)) >>> 0;
    }

    return hashType;
  }

  hashForWitnessV0(inIndex: number, prevOutScript: Buffer, value: TNumber, hashType: number): Buffer {
    return super.hashForWitnessV0(inIndex, prevOutScript, value, this.addForkId(hashType));
  }

  /**
   * Calculate the hash to verify the signature against
   */
  hashForSignatureByNetwork(
    inIndex: number,
    prevoutScript: Buffer,
    value: TNumber | undefined,
    hashType: number
  ): Buffer {
    switch (getMainnet(this.network)) {
      case networks.groestlcoin:
        if ((hashType & UtxoTransaction.SIGHASH_FORKID) > 0) {
          if (value === undefined) {
            throw new Error(`must provide value`);
          }
          return grsTx.hashForWitnessV0(inIndex, prevoutScript, value, this.addForkId(hashType), super.clone());
        }
        return grsTx.hashForSignature(inIndex, prevoutScript, hashType, value, super.clone())
      case networks.zelcash:
      case networks.flux:
      case networks.zero:
      case networks.snowgem:
      case networks.safecoin:
      case networks.komodo:
      case networks.gemlink:
      case networks.commercium:
      case networks.zclassic:
      case networks.bzedge:
      case networks.bitcoinz:
      case networks.hush:
      case networks.zcash:
        throw new Error(`illegal state`);
      case networks.bitcoincash:
      case networks.bitcoinsv:
      case networks.bitcoingold:
      case networks.bithereum:
      case networks.ecash:
        /*
          Bitcoin Cash supports a FORKID flag. When set, we hash using hashing algorithm
           that is used for segregated witness transactions (defined in BIP143).

          The flag is also used by BitcoinSV and BitcoinGold

          https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/replay-protected-sighash.md
         */
        const addForkId = (hashType & UtxoTransaction.SIGHASH_FORKID) > 0;
        const isBthFid = isBithereum(this.network) && ((hashType & UtxoTransaction.SIGHASH_FORKID_BTH) > 0); // Bithereum SIGHASH_FORKID
        if (addForkId || isBthFid) {
          if (value === undefined) {
            throw new Error(`must provide value`);
          }
          return super.hashForWitnessV0(inIndex, prevoutScript, value, this.addForkId(hashType));
        }
    }

    return super.hashForSignature(inIndex, prevoutScript, hashType);
  }

  hashForSignature(inIndex: number, prevOutScript: Buffer, hashType: number, value?: TNumber): Buffer {
    value = value ?? (this.ins[inIndex] as any).value;
    return this.hashForSignatureByNetwork(inIndex, prevOutScript, value, hashType);
  }

  clone<TN2 extends bigint | number = TNumber>(amountType?: 'number' | 'bigint'): UtxoTransaction<TN2> {
    // No need to clone. Everything is copied in the constructor.
    return new UtxoTransaction<TN2>(this.network, this, amountType);
  }
}
