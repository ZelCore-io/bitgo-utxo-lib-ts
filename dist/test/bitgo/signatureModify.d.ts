import { TxOutput } from 'bitcoinjs-lib';
import { UtxoTransaction } from '../../src/bitgo';
export declare function getTransactionWithHighS<TNumber extends number | bigint>(tx: UtxoTransaction<TNumber>, inputIndex: number): UtxoTransaction<TNumber>[];
/** Return transaction with script xored with 0xff for the given input */
export declare function getPrevOutsWithInvalidOutputScript<TNumber extends number | bigint>(prevOuts: TxOutput<TNumber>[], inputIndex: number): TxOutput<TNumber>[];
//# sourceMappingURL=signatureModify.d.ts.map