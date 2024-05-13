/// <reference types="node" />
import { KeyName, outputScripts, RootWalletKeys, Tuple, Unspent, UtxoPsbt, UtxoTransaction, WalletUnspent, ChainCode } from '../../../src/bitgo';
import { ScriptType2Of3 } from '../../../src/bitgo/outputScripts';
export declare const network: import("../../../src").Network;
export declare const rootWalletKeys: RootWalletKeys;
export declare const dummyTapOutputKey: Buffer;
export declare const dummyTapInternalKey: Buffer;
export declare const dummyParticipantPubKeys: Tuple<Buffer>;
export declare const dummyPubNonce: Buffer;
export declare const dummyAggNonce: Buffer;
export declare const dummyPrivateKey: Buffer;
export declare const dummyPartialSig: Buffer;
export declare const invalidTapOutputKey: Buffer;
export declare const invalidTapInputKey: Buffer;
export declare const invalidTxHash: Buffer;
export declare const invalidParticipantPubKeys: Tuple<Buffer>;
export declare const invalidPartialSig: Buffer;
export declare function constructPsbt(unspents: (Unspent<bigint> & {
    prevTx?: Buffer;
})[], rootWalletKeys: RootWalletKeys, signer: KeyName, cosigner: KeyName, outputs: {
    chain: ChainCode;
    index: number;
    value: bigint;
}[] | outputScripts.ScriptType2Of3): UtxoPsbt;
export declare function getUnspents(inputScriptTypes: ScriptType2Of3[], rootWalletKeys: RootWalletKeys): WalletUnspent<bigint>[];
export declare function validatePsbtP2trMusig2Input(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, unspent: WalletUnspent<bigint>, spendType: 'keyPath' | 'scriptPath'): void;
export declare function validatePsbtP2trMusig2Output(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number): void;
export declare function validateNoncesKeyVals(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, unspent: WalletUnspent<bigint>): void;
export declare function validatePartialSigKeyVals(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, unspent: WalletUnspent<bigint>): void;
export declare function validateParticipantsKeyVals(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, unspent: WalletUnspent<bigint>): void;
export declare function validateFinalizedInput(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, unspent: WalletUnspent<bigint>, spendType?: 'keyPath' | 'scriptPath'): void;
export declare function validateParsedTaprootKeyPathPsbt(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, signature: 'unsigned' | 'halfsigned' | 'fullysigned'): void;
export declare function validateParsedTaprootScriptPathPsbt(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number, signature: 'unsigned' | 'halfsigned' | 'fullysigned'): void;
export declare function validateParsedTaprootKeyPathTxInput(psbt: UtxoPsbt<UtxoTransaction<bigint>>, tx: UtxoTransaction<bigint>): void;
export declare function validateParsedTaprootScriptPathTxInput(psbt: UtxoPsbt<UtxoTransaction<bigint>>, tx: UtxoTransaction<bigint>, index: number): void;
//# sourceMappingURL=Musig2Util.d.ts.map