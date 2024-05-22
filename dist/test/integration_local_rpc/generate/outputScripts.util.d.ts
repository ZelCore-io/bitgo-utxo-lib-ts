/// <reference types="node" />
import { BIP32Interface } from 'bip32';
import { Transaction, TxOutput } from 'bitcoinjs-lib';
import * as utxolib from '../../../src';
import { ScriptType2Of3 } from '../../../src/bitgo/outputScripts';
import { KeyTriple } from '../../../src/testutil';
import { TxOutPoint, UtxoTransaction, ChainCode, RootWalletKeys, WalletUnspent, KeyName, Tuple } from '../../../src/bitgo';
export declare const scriptTypesSingleSig: readonly ["p2pkh", "p2wkh"];
export declare type ScriptTypeSingleSig = (typeof scriptTypesSingleSig)[number];
export declare const scriptTypes: ("p2pkh" | "p2wkh" | "p2sh" | "p2shP2wsh" | "p2wsh" | "p2tr" | "p2trMusig2")[];
export declare type ScriptType = ScriptType2Of3 | ScriptTypeSingleSig;
declare type Network = utxolib.Network;
export declare function isSupportedDepositType(network: Network, scriptType: ScriptType): boolean;
export declare function isSupportedSpendType(network: Network, scriptType: ScriptType): boolean;
/**
 *
 * @param keys - Pubkeys to use for generating the address.
 *               If scriptType is single-sig, the first key will be used.
 * @param scriptType
 * @param network
 * @return {Buffer} scriptPubKey
 */
export declare function createScriptPubKey(keys: KeyTriple, scriptType: ScriptType, network: Network): Buffer;
export declare function createSpendTransactionFromPrevOutputs<TNumber extends number | bigint>(keys: KeyTriple, scriptType: ScriptType2Of3, prevOutputs: (TxOutPoint & TxOutput<TNumber>)[], recipientScript: Buffer, network: Network, { signKeys, version, amountType, }?: {
    signKeys?: BIP32Interface[];
    version?: number;
    amountType?: 'number' | 'bigint';
}): UtxoTransaction<TNumber>;
export declare function createSpendTransaction<TNumber extends number | bigint = number>(keys: KeyTriple, scriptType: ScriptType2Of3, inputTxs: Buffer[], recipientScript: Buffer, network: Network, version?: number, amountType?: 'number' | 'bigint'): Transaction<TNumber>;
export declare function createPsbtSpendTransactionFromPrevTx(rootWalletKeys: RootWalletKeys, unspents: WalletUnspent<bigint>[], network: Network, signers?: Tuple<KeyName>, version?: number): UtxoTransaction<bigint>;
export declare function createPsbtSpendTransaction<TNumber extends number | bigint = number>({ rootWalletKeys, signers, chain, index, inputTxs, network, version, amountType, }: {
    rootWalletKeys: RootWalletKeys;
    signers: Tuple<KeyName>;
    chain: ChainCode;
    index: number;
    inputTxs: Buffer[];
    network: Network;
    version?: number;
    amountType?: 'number' | 'bigint';
}): Transaction<TNumber>;
/**
 * @returns BIP32 hardcoded index for p2trMusig2 spend type. 0 for key path and 100 for script path.
 * For same fixture key triple and script type (p2trMusig2),
 * we need 2 different deposit and spend tx fixtures.
 */
export declare function getP2trMusig2Index(spendType: 'keyPath' | 'scriptPath'): number;
export {};
//# sourceMappingURL=outputScripts.util.d.ts.map