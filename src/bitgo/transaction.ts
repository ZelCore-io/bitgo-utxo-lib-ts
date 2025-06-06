/* eslint no-redeclare: 0 */
import { TxOutput } from 'bitcoinjs-lib';

import { networks, Network, getMainnet } from '../networks';

import { UtxoPsbt, PsbtOpts } from './UtxoPsbt';
import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { DashPsbt } from './dash/DashPsbt';
import { DashTransaction } from './dash/DashTransaction';
import { DashTransactionBuilder } from './dash/DashTransactionBuilder';
import { ZcashPsbt } from './zcash/ZcashPsbt';
import { ZcashTransactionBuilder } from './zcash/ZcashTransactionBuilder';
import { ZcashNetwork, ZcashTransaction } from './zcash/ZcashTransaction';
import { LitecoinPsbt, LitecoinTransaction, LitecoinTransactionBuilder } from './litecoin';

export function createTransactionFromBuffer(
  buf: Buffer,
  network: Network,
  params: { version?: number; amountType: 'bigint' }
): UtxoTransaction<bigint>;
export function createTransactionFromBuffer<TNumber extends number | bigint>(
  buf: Buffer,
  network: Network,
  params?: { version?: number; amountType?: 'number' | 'bigint' }
): UtxoTransaction<TNumber>;
export function createTransactionFromBuffer<TNumber extends number | bigint = number>(
  buf: Buffer,
  network: Network,
  { version, amountType }: { version?: number; amountType?: 'number' | 'bigint' } = {},
  deprecatedAmountType?: 'number' | 'bigint'
): UtxoTransaction<TNumber> {
  if (amountType) {
    if (deprecatedAmountType && amountType !== deprecatedAmountType) {
      throw new Error(`invalid arguments`);
    }
  } else {
    if (deprecatedAmountType) {
      amountType = deprecatedAmountType;
    } else {
      amountType = 'number';
    }
  }
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.bithereum:
    case networks.genesis:
    case networks.bitcoinzero:
    case networks.ravencoin:
    case networks.bitcore:
    case networks.zcoin:
    case networks.axe:
    case networks.digibyte:
    case networks.sinovate:
    case networks.ilcoin:
    case networks.raptoreum:
    case networks.vertcoin:
    case networks.clore:
    case networks.groestlcoin:
    case networks.telestai:
    case networks.ecash:
      return UtxoTransaction.fromBuffer<TNumber>(buf, false, amountType, network);
    case networks.litecoin:
      return LitecoinTransaction.fromBuffer<TNumber>(buf, false, amountType, network);
    case networks.dash:
      return DashTransaction.fromBuffer<TNumber>(buf, false, amountType, network);
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
      return ZcashTransaction.fromBufferWithVersion<TNumber>(buf, network as ZcashNetwork, version, amountType);
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

/* istanbul ignore next */
/** @deprecated - use createTransactionFromBuffer instead */
export function createTransactionFromHex(
  hex: string,
  network: Network,
  p: { amountType: 'bigint' }
): UtxoTransaction<bigint>;
/** @deprecated - use createTransactionFromBuffer instead */
export function createTransactionFromHex(hex: string, network: Network, p: { amountType: 'number' }): UtxoTransaction;
/** @deprecated - use createTransactionFromBuffer instead */
export function createTransactionFromHex<TNumber extends number | bigint = number>(
  hex: string,
  network: Network,
  p?: { amountType?: 'number' | 'bigint' } | 'number' | 'bigint'
): UtxoTransaction<TNumber>;
export function createTransactionFromHex<TNumber extends number | bigint = number>(
  hex: string,
  network: Network,
  p?: { amountType?: 'number' | 'bigint' } | 'number' | 'bigint'
): UtxoTransaction<TNumber> {
  if (typeof p === 'string') {
    p = { amountType: p };
  }
  return createTransactionFromBuffer<TNumber>(Buffer.from(hex, 'hex'), network, p);
}

export function createPsbtFromBuffer(buf: Buffer, network: Network, bip32PathsAbsolute = false): UtxoPsbt {
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.bithereum:
    case networks.genesis:
    case networks.bitcoinzero:
    case networks.ravencoin:
    case networks.bitcore:
    case networks.zcoin:
    case networks.axe:
    case networks.digibyte:
    case networks.sinovate:
    case networks.ilcoin:
    case networks.raptoreum:
    case networks.vertcoin:
    case networks.clore:
    case networks.groestlcoin:
    case networks.telestai:
    case networks.ecash:
      return UtxoPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
    case networks.litecoin:
      return LitecoinPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
    case networks.dash:
      return DashPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
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
      return ZcashPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

export function createPsbtFromHex(hex: string, network: Network, bip32PathsAbsolute = false): UtxoPsbt {
  return createPsbtFromBuffer(Buffer.from(hex, 'hex'), network, bip32PathsAbsolute);
}

export function createPsbtFromTransaction(tx: UtxoTransaction<bigint>, prevOuts: TxOutput<bigint>[]): UtxoPsbt {
  switch (getMainnet(tx.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.bithereum:
    case networks.genesis:
    case networks.bitcoinzero:
    case networks.ravencoin:
    case networks.bitcore:
    case networks.zcoin:
    case networks.axe:
    case networks.digibyte:
    case networks.sinovate:
    case networks.ilcoin:
    case networks.raptoreum:
    case networks.vertcoin:
    case networks.clore:
    case networks.groestlcoin:
    case networks.telestai:
    case networks.ecash:
      return UtxoPsbt.fromTransaction(tx, prevOuts);
    case networks.litecoin:
      return LitecoinPsbt.fromTransaction(tx, prevOuts);
    case networks.dash:
      return DashPsbt.fromTransaction(tx, prevOuts);
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
      return ZcashPsbt.fromTransaction(tx, prevOuts);
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

export function getDefaultTransactionVersion(network: Network): number {
  // Use NU6 version for testnet, activated on mainnet in block 2726400
  // https://zips.z.cash/zip-0253
  if (network === networks.zcashTest) {
    return ZcashTransaction.VERSION4_BRANCH_NU6;
  }
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.ecash:
      return 2;
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
      return ZcashTransaction.VERSION4_BRANCH_NU6;
    default:
      return 1;
  }
}

export function setTransactionBuilderDefaults<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber>,
  network: Network,
  { version = getDefaultTransactionVersion(network) }: { version?: number } = {}
): void {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.ecash:
      if (version !== 2) {
        throw new Error(`invalid version`);
      }
      txb.setVersion(version);
      break;
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
      (txb as ZcashTransactionBuilder<TNumber>).setDefaultsForVersion(network, version);
      break;
    default:
      if (version !== 1) {
        throw new Error(`invalid version`);
      }
  }
}

export function setPsbtDefaults(
  psbt: UtxoPsbt,
  network: Network,
  { version = getDefaultTransactionVersion(network) }: { version?: number } = {}
): void {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.ecash:
      if (version !== 2) {
        throw new Error(`invalid version`);
      }
      break;
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
      if (
        ![
          ZcashTransaction.VERSION4_BRANCH_CANOPY,
          ZcashTransaction.VERSION4_BRANCH_NU5,
          ZcashTransaction.VERSION4_BRANCH_NU6,
          ZcashTransaction.VERSION5_BRANCH_NU5,
          ZcashTransaction.VERSION5_BRANCH_NU6,
        ].includes(version)
      ) {
        throw new Error(`invalid version`);
      }
      (psbt as ZcashPsbt).setDefaultsForVersion(network, version);
      break;
    default:
      if (version !== 1) {
        throw new Error(`invalid version`);
      }
      // FIXME: set version here, because there's a bug in the upstream PSBT
      // that defaults transactions to v2.
      psbt.setVersion(version);
  }
}

export function createPsbtForNetwork(psbtOpts: PsbtOpts, { version }: { version?: number } = {}): UtxoPsbt {
  let psbt;

  switch (getMainnet(psbtOpts.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.bithereum:
    case networks.genesis:
    case networks.bitcoinzero:
    case networks.ravencoin:
    case networks.bitcore:
    case networks.zcoin:
    case networks.axe:
    case networks.digibyte:
    case networks.sinovate:
    case networks.ilcoin:
    case networks.raptoreum:
    case networks.vertcoin:
    case networks.clore:
    case networks.groestlcoin:
    case networks.telestai:
    case networks.ecash: {
      psbt = UtxoPsbt.createPsbt(psbtOpts);
      break;
    }
    case networks.litecoin: {
      psbt = LitecoinPsbt.createPsbt(psbtOpts);
      break;
    }
    case networks.dash: {
      psbt = DashPsbt.createPsbt(psbtOpts);
      break;
    }
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
    case networks.zcash: {
      psbt = ZcashPsbt.createPsbt(psbtOpts);
      break;
    }
    default:
      throw new Error(`unsupported network`);
  }

  setPsbtDefaults(psbt, psbtOpts.network, { version });

  return psbt;
}

export function createTransactionBuilderForNetwork<TNumber extends number | bigint = number>(
  network: Network,
  { version }: { version?: number } = {}
): UtxoTransactionBuilder<TNumber> {
  let txb;
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.bithereum:
    case networks.genesis:
    case networks.bitcoinzero:
    case networks.ravencoin:
    case networks.bitcore:
    case networks.zcoin:
    case networks.axe:
    case networks.digibyte:
    case networks.sinovate:
    case networks.ilcoin:
    case networks.raptoreum:
    case networks.vertcoin:
    case networks.clore:
    case networks.groestlcoin:
    case networks.telestai:
    case networks.ecash: {
      txb = new UtxoTransactionBuilder<TNumber>(network);
      break;
    }
    case networks.litecoin: {
      txb = new LitecoinTransactionBuilder<TNumber>(network);
      break;
    }
    case networks.dash:
      txb = new DashTransactionBuilder<TNumber>(network);
      break;
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
    case networks.zcash: {
      txb = new ZcashTransactionBuilder<TNumber>(network as ZcashNetwork);
      break;
    }
    default:
      throw new Error(`unsupported network`);
  }

  setTransactionBuilderDefaults<TNumber>(txb, network, { version });

  return txb;
}

export function createTransactionBuilderFromTransaction<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  prevOutputs?: TxOutput<TNumber>[]
): UtxoTransactionBuilder<TNumber> {
  switch (getMainnet(tx.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.bithereum:
    case networks.genesis:
    case networks.bitcoinzero:
    case networks.ravencoin:
    case networks.bitcore:
    case networks.zcoin:
    case networks.axe:
    case networks.digibyte:
    case networks.sinovate:
    case networks.ilcoin:
    case networks.raptoreum:
    case networks.vertcoin:
    case networks.clore:
    case networks.groestlcoin:
    case networks.telestai:
    case networks.ecash:
      return UtxoTransactionBuilder.fromTransaction<TNumber>(tx, undefined, prevOutputs);
    case networks.litecoin:
      return LitecoinTransactionBuilder.fromTransaction<TNumber>(
        tx as LitecoinTransaction<TNumber>,
        undefined,
        prevOutputs as TxOutput<TNumber>[]
      );
    case networks.dash:
      return DashTransactionBuilder.fromTransaction<TNumber>(
        tx as DashTransaction<TNumber>,
        undefined,
        prevOutputs as TxOutput<TNumber>[]
      );
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
      return ZcashTransactionBuilder.fromTransaction<TNumber>(
        tx as ZcashTransaction<TNumber>,
        undefined,
        prevOutputs as TxOutput<TNumber>[]
      );
  }

  throw new Error(`invalid network`);
}
