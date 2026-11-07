import * as bitcoinjs from 'bitcoinjs-lib';
import * as types from 'bitcoinjs-lib/src/types';
const typeforce = require('typeforce');

import { Network } from '../..';
import {
  getDefaultConsensusBranchIdForVersion,
  getDefaultVersionGroupIdForVersion,
  ZcashNetwork,
  ZcashTransaction,
} from './ZcashTransaction';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { toOutputScript } from './address';
import { setPrevOutputsSource } from './prevOutputsSource';
import { ZcashPrevOutput } from './hashZip0244';

export class ZcashTransactionBuilder<TNumber extends number | bigint = number> extends UtxoTransactionBuilder<
  TNumber,
  ZcashTransaction<TNumber>
> {
  constructor(network: ZcashNetwork) {
    super(network);
    setPrevOutputsSource(this.tx, () => this.getPrevOutputs());
  }

  /**
   * Prevout data (scriptPubKey and value of the spent coin) of every input, as needed by ZIP 244 (v5) signature
   * hashes. Pass `prevOutScript` and `value` to `addInput()` for every input before signing a v5 transaction.
   * The scriptPubKey of the input being signed may also be derived during `sign()` (for example p2pkh from the key).
   */
  getPrevOutputs(): ZcashPrevOutput<TNumber>[] {
    const inputs: { prevOutScript?: Buffer; value?: TNumber }[] = (this as any).__INPUTS;
    return inputs.map((input, i) => {
      const value = input.value ?? ((this.tx.ins[i] as any)?.value as TNumber | undefined);
      if (!input.prevOutScript || value === undefined) {
        throw new Error(
          `ZIP 244 (v5) signature hash needs the scriptPubKey and value of every input, input ${i} has no ${
            input.prevOutScript ? 'value' : 'scriptPubKey'
          }: pass prevOutScript and value to addInput()`
        );
      }
      return { script: input.prevOutScript, value };
    });
  }

  protected createInitialTransaction(network: Network): ZcashTransaction<TNumber> {
    return new ZcashTransaction<TNumber>(network as ZcashNetwork);
  }

  static fromTransaction<TNumber extends number | bigint = number>(
    transaction: ZcashTransaction<TNumber>,
    network?: Network,
    prevOutput?: bitcoinjs.TxOutput<TNumber>[]
  ): ZcashTransactionBuilder<TNumber> {
    const txb = new ZcashTransactionBuilder<TNumber>(transaction.network);

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
    transaction.ins.forEach(function (txIn, i) {
      (txb as any).__addInputUnsafe(txIn.hash, txIn.index, {
        sequence: txIn.sequence,
        script: txIn.script,
        witness: txIn.witness,
        value: prevOutput?.[i]?.value ?? (txIn as any).value,
      });
    });

    // Copy prevout data (needed for ZIP 244 signature hashes)
    const prevOutputs = prevOutput ?? transaction.getPrevOutputs();
    if (prevOutputs) {
      if (prevOutputs.length !== transaction.ins.length) {
        throw new Error(`prevOutputs must match the number of inputs`);
      }
      const txbInputs = (txb as any).__INPUTS;
      prevOutputs.forEach((o, i) => {
        txbInputs[i].value = o.value;
        if (!txbInputs[i].prevOutScript) {
          txbInputs[i].prevOutScript = o.script;
        }
      });
    }

    return txb;
  }

  setVersion(version: number, overwinter = true): void {
    typeforce(types.UInt32, version);
    this.tx.overwintered = overwinter ? 1 : 0;
    this.tx.version = version;
  }

  setDefaultsForVersion(network: Network, version: number): void {
    switch (version) {
      case 4:
      case ZcashTransaction.VERSION4_BRANCH_CANOPY:
      case ZcashTransaction.VERSION4_BRANCH_NU5:
      case ZcashTransaction.VERSION4_BRANCH_NU6:
      case ZcashTransaction.VERSION4_BRANCH_NU6_2:
      case ZcashTransaction.VERSION4_BRANCH_NU6_3:
        this.setVersion(4);
        break;
      case 5:
      case ZcashTransaction.VERSION5_BRANCH_NU5:
      case ZcashTransaction.VERSION5_BRANCH_NU6:
      case ZcashTransaction.VERSION5_BRANCH_NU6_2:
      case ZcashTransaction.VERSION5_BRANCH_NU6_3:
      case ZcashTransaction.VERSION5_BRANCH_NU7:
        this.setVersion(5);
        break;
      default:
        throw new Error(`invalid version ${version}`);
    }

    this.tx.versionGroupId = getDefaultVersionGroupIdForVersion(version);
    this.tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(network, version);
  }

  private hasSignatures(): boolean {
    return (this as any).__INPUTS.some(function (input: { signatures: unknown }) {
      return input.signatures !== undefined;
    });
  }

  private setPropertyCheckSignatures(propName: keyof ZcashTransaction<TNumber>, value: unknown) {
    if (this.tx[propName] === value) {
      return;
    }
    if (this.hasSignatures()) {
      throw new Error(`Changing property ${propName} for a partially signed transaction would invalidate signatures`);
    }
    this.tx[propName] = value as any;
  }

  setConsensusBranchId(consensusBranchId: number): void {
    typeforce(types.UInt32, consensusBranchId);
    this.setPropertyCheckSignatures('consensusBranchId', consensusBranchId);
  }

  setVersionGroupId(versionGroupId: number): void {
    typeforce(types.UInt32, versionGroupId);
    this.setPropertyCheckSignatures('versionGroupId', versionGroupId);
  }

  setExpiryHeight(expiryHeight: number): void {
    typeforce(types.UInt32, expiryHeight);
    this.setPropertyCheckSignatures('expiryHeight', expiryHeight);
  }

  build(): ZcashTransaction<TNumber> {
    return this.withPrevOutputs(super.build() as ZcashTransaction<TNumber>);
  }

  buildIncomplete(): ZcashTransaction<TNumber> {
    return this.withPrevOutputs(super.buildIncomplete() as ZcashTransaction<TNumber>);
  }

  /** Attach the prevout data to a built transaction when every input has it, so it can be hashed directly later. */
  private withPrevOutputs(tx: ZcashTransaction<TNumber>): ZcashTransaction<TNumber> {
    if (!tx.getPrevOutputs()) {
      let prevOutputs: ZcashPrevOutput<TNumber>[] | undefined;
      try {
        prevOutputs = this.getPrevOutputs();
      } catch (e) {
        // incomplete prevout data is only an error when a v5 signature hash is computed
        prevOutputs = undefined;
      }
      if (prevOutputs) {
        tx.setPrevOutputs(prevOutputs);
      }
    }
    return tx;
  }

  addOutput(scriptPubKey: string | Buffer, value: TNumber): number {
    // Attempt to get a script if it's a base58 or bech32 address string
    if (typeof scriptPubKey === 'string') {
      scriptPubKey = toOutputScript(scriptPubKey, this.network as Network);
    }

    return super.addOutput(scriptPubKey, value);
  }
}
