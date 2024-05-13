import { outputScripts, RootWalletKeys, Unspent, UtxoPsbt, UtxoTransaction, UtxoTransactionBuilder, WalletUnspent, KeyName } from '../../../src/bitgo';
import { SignatureTargetType } from './Psbt';
import { Network } from '../../../src';
export declare function validatePsbtParsing(tx: UtxoTransaction<bigint>, psbt: UtxoPsbt, unspents: WalletUnspent<bigint>[], signatureTarget: SignatureTargetType): void;
export declare function assertEqualTransactions<TNumber extends number | bigint>(txOne: UtxoTransaction<TNumber>, txTwo: UtxoTransaction<TNumber>): void;
export declare function toBigInt<TNumber extends number | bigint>(unspents: Unspent<TNumber>[]): WalletUnspent<bigint>[];
export declare function signPsbt(psbt: UtxoPsbt, unspents: Unspent<bigint>[], rootWalletKeys: RootWalletKeys, signer: string, cosigner: string, signatureTarget: SignatureTargetType): void;
export declare function signTxBuilder<TNumber extends number | bigint>(txb: UtxoTransactionBuilder<TNumber, UtxoTransaction<TNumber>>, unspents: Unspent<TNumber>[], rootWalletKeys: RootWalletKeys, signer: string, cosigner: string, signatureTarget: SignatureTargetType): UtxoTransaction<TNumber>;
export declare function constructTransactionUsingTxBuilder<TNumber extends number | bigint>(unspents: Unspent<TNumber>[], rootWalletKeys: RootWalletKeys, params: {
    signer: KeyName;
    cosigner: KeyName;
    amountType: 'number' | 'bigint';
    outputType: outputScripts.ScriptType2Of3;
    signatureTarget: SignatureTargetType;
    network: Network;
    changeIndex: number;
    fee: bigint;
}): UtxoTransaction<bigint>;
//# sourceMappingURL=psbtUtil.d.ts.map