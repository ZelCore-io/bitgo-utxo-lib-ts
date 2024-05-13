/// <reference types="node" />
import { Network } from '../../../src/networks';
import { RpcTransaction } from './RpcTypes';
export declare class RpcError extends Error {
    rpcError: {
        code: number;
        message: string;
    };
    constructor(rpcError: {
        code: number;
        message: string;
    });
    static isRpcErrorWithCode(e: Error, code: number): boolean;
}
declare type NetworkInfo = {
    subversion: string;
};
export declare class RpcClient {
    protected network: Network;
    protected url: string;
    protected networkInfo?: NetworkInfo | undefined;
    id: number;
    constructor(network: Network, url: string, networkInfo?: NetworkInfo | undefined);
    /**
     * Poor man's Bluebird.map(arr, f, { concurrency })
     * Processes promises in batches of 16
     *
     * @param arr
     * @param f
     * @param [concurrency=8]
     */
    static parallelMap<S, T>(arr: S[], f: (S: any, i: number) => Promise<T>, { concurrency }?: {
        concurrency: number;
    }): Promise<T[]>;
    protected getUrl(): string;
    exec<T>(method: string, ...params: unknown[]): Promise<T>;
    requiresWalletPath(): boolean;
    withWallet(walletName: string): RpcClientWithWallet;
    getHelp(): Promise<string>;
    createWallet(walletName: string): Promise<string>;
    loadWallet(walletName: string): Promise<string>;
    getNetworkInfo(): Promise<{
        subversion: string;
    }>;
    getBlockCount(): Promise<number>;
    getRawTransaction(txid: string): Promise<Buffer>;
    getRawTransactionVerbose(txid: string): Promise<RpcTransaction>;
    sendRawTransaction(tx: Buffer): Promise<string>;
    static fromEnvvar(network: Network): Promise<RpcClient>;
    static getSupportedNodeVersions(network: Network): string[];
    static forUrl(network: Network, url: string): Promise<RpcClient>;
    static forUrlWait(network: Network, url: string): Promise<RpcClient>;
}
export declare class RpcClientWithWallet extends RpcClient {
    private walletName?;
    constructor(network: Network, url: string, networkInfo: NetworkInfo, walletName?: string | undefined);
    protected getUrl(): string;
    getWalletInfo(): Promise<Record<string, unknown>>;
    getBalance(): Promise<number>;
    getNewAddress(): Promise<string>;
    sendToAddress(address: string, amount: number | string): Promise<string>;
    generateToAddress(n: number, address: string): Promise<void>;
}
export {};
//# sourceMappingURL=RpcClient.d.ts.map