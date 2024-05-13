import { Network } from '../../../src';
import { RpcClient } from './RpcClient';
import { RpcTransaction } from './RpcTypes';
export declare type Protocol = {
    network: Network;
    version: number;
};
export declare function getProtocolVersions(network: Network): number[];
export declare function getFixtureDir(protocol: Protocol): string;
export declare function wipeFixtures(protocol: Protocol): Promise<void>;
export declare function writeFixture(protocol: Protocol, filename: string, content: unknown): Promise<void>;
export declare function readFixture<T>(protocol: Protocol, filename: string): Promise<T>;
export declare type TransactionFixtureWithInputs = {
    transaction: RpcTransaction;
    inputs: RpcTransaction[];
};
export declare function writeTransactionFixtureWithInputs(rpc: RpcClient, protocol: Protocol, filename: string, txid: string): Promise<void>;
export declare const fixtureKeys: import("../../../src/testutil").KeyTriple;
//# sourceMappingURL=fixtures.d.ts.map