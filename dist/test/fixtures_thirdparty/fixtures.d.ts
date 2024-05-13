/// <reference types="mocha" />
import { Network } from '../../src/networks';
export declare type FixtureInfo = {
    projectPath: string;
    tag: string;
};
export declare function getArchiveUrl(fixtureInfo: FixtureInfo): string;
export declare function getArchiveRoot(fixtureInfo: FixtureInfo): string;
export declare function getFixtureInfo(network: Network): FixtureInfo;
export declare function readFile(network: Network, path: string): Promise<string>;
export declare function readJSON<T>(network: Network, path: string): Promise<T>;
export declare const sigHashTestFile = "sighash.json";
export declare type SigHashTestVector = [
    rawTransaction: string,
    script: string,
    inputIndex: number,
    hashType: number,
    signatureHash: string
];
export declare type ZcashSigHashTestVector = [
    rawTransaction: string,
    script: string,
    inputIndex: number,
    hashType: number,
    branchId: number,
    signatureHash: string
];
export declare const txValidTestFile = "tx_valid.json";
export declare type TxValidVector = [
    inputData: [prevoutHash: string, prevoutIndex: string, prevoutScriptPubKey: string][],
    serializedTransaction: string,
    verifyFlags: string
];
export declare function testFixture<T>(ctx: Mocha.Suite, network: Network, filename: string, callback: (this: Mocha.Context, data: T) => void): void;
export declare function testFixtureArray<T>(ctx: Mocha.Suite, network: Network, filename: string, callback: (this: Mocha.Context, data: T[]) => void): void;
//# sourceMappingURL=fixtures.d.ts.map