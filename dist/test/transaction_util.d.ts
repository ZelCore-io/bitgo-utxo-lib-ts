/// <reference types="node" />
import { BIP32Interface } from 'bip32';
import { TxOutput } from 'bitcoinjs-lib';
import { Network } from '../src';
import { ScriptType2Of3 } from '../src/bitgo/outputScripts';
import { TxOutPoint, UtxoTransaction, UtxoTransactionBuilder, PrevOutput } from '../src/bitgo';
import { KeyTriple } from '../src/testutil';
export declare function getSignKeyCombinations(length: number): BIP32Interface[][];
export declare function parseTransactionRoundTrip<TNumber extends number | bigint, T extends UtxoTransaction<TNumber>>(buf: Buffer, network: Network, { inputs, amountType, version, roundTripPsbt, }?: {
    inputs?: (TxOutPoint & TxOutput<TNumber>)[];
    amountType?: 'number' | 'bigint';
    version?: number;
    roundTripPsbt?: boolean;
}): T;
export declare const defaultTestOutputAmount = 100000000;
export declare function mockTransactionId(v?: number): string;
export declare function getPrevOutput<TNumber extends number | bigint = number>(scriptType: ScriptType2Of3 | 'p2shP2pk', value: TNumber, network: Network, vout?: number, { keys, prevTx, }?: {
    keys?: KeyTriple;
    prevTx?: UtxoTransaction<TNumber> | boolean;
}): PrevOutput<TNumber>;
export declare function getPrevOutputs<TNumber extends number | bigint = number>(scriptType: ScriptType2Of3 | 'p2shP2pk', value: TNumber, network: Network, { keys, prevTx }?: {
    keys?: KeyTriple;
    prevTx?: boolean;
}): PrevOutput<TNumber>[];
export declare type HalfSigner = {
    signer: BIP32Interface;
    cosigner?: BIP32Interface;
};
declare type TransactionUtilBuildOptions<TNumber extends number | bigint> = {
    amountType?: 'number' | 'bigint';
    outputAmount?: number | bigint | string;
    prevOutputs?: PrevOutput<TNumber>[];
};
export declare function getTransactionBuilder<TNumber extends number | bigint = number>(keys: KeyTriple, halfSigners: HalfSigner[], scriptType: ScriptType2Of3 | 'p2shP2pk', network: Network, { amountType, outputAmount, prevOutputs, }?: TransactionUtilBuildOptions<TNumber>): UtxoTransactionBuilder<TNumber>;
export declare function getUnsignedTransaction2Of3<TNumber extends number | bigint = number>(keys: KeyTriple, scriptType: ScriptType2Of3 | 'p2shP2pk', network: Network, params?: TransactionUtilBuildOptions<TNumber>): UtxoTransaction<TNumber>;
export declare function getHalfSignedTransaction2Of3<TNumber extends number | bigint = number>(keys: KeyTriple, signer1: BIP32Interface, signer2: BIP32Interface, scriptType: ScriptType2Of3 | 'p2shP2pk', network: Network, opts?: TransactionUtilBuildOptions<TNumber>): UtxoTransaction<TNumber>;
export declare function getFullSignedTransactionP2shP2pk<TNumber extends number | bigint = number>(keys: KeyTriple, signer1: BIP32Interface, network: Network, opts?: TransactionUtilBuildOptions<TNumber>): UtxoTransaction<TNumber>;
export declare function getFullSignedTransaction2Of3<TNumber extends number | bigint = number>(keys: KeyTriple, signer1: BIP32Interface, signer2: BIP32Interface, scriptType: ScriptType2Of3 | 'p2shP2pk', network: Network, opts?: TransactionUtilBuildOptions<TNumber>): UtxoTransaction<TNumber>;
export declare function getTransactionStages<TNumber extends number | bigint>(keys: KeyTriple, signer1: BIP32Interface, signer2: BIP32Interface, scriptType: ScriptType2Of3 | 'p2shP2pk', network: Network, opts: TransactionUtilBuildOptions<TNumber>): {
    unsigned: UtxoTransaction<TNumber>;
    halfSigned: UtxoTransaction<TNumber>;
    fullSigned: UtxoTransaction<TNumber>;
};
export {};
//# sourceMappingURL=transaction_util.d.ts.map