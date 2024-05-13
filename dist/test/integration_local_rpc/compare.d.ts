import { Network } from '../../src/networks';
import { UtxoTransaction } from '../../src/bitgo';
import { RpcTransaction } from './generate/RpcTypes';
declare type NormalizedObject = Record<string, unknown>;
export declare function normalizeParsedTransaction<TNumber extends number | bigint>(tx: UtxoTransaction<TNumber>, network?: Network): NormalizedObject;
export declare function normalizeRpcTransaction(tx: RpcTransaction, network: Network): NormalizedObject;
export {};
//# sourceMappingURL=compare.d.ts.map