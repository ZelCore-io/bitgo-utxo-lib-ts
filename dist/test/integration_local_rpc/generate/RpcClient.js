"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcClientWithWallet = exports.RpcClient = exports.RpcError = void 0;
const assert = require("assert");
const axios_1 = require("axios");
const debug_1 = require("debug");
const networks_1 = require("../../../src/networks");
const utxolib = require('../../../src');
const debug = (0, debug_1.default)('RpcClient');
function sleep(millis) {
    return new Promise((resolve) => {
        setTimeout(resolve, millis);
    });
}
class RpcError extends Error {
    constructor(rpcError) {
        super(`RPC error: ${rpcError.message} (code=${rpcError.code})`);
        this.rpcError = rpcError;
    }
    static isRpcErrorWithCode(e, code) {
        return e instanceof RpcError && e.rpcError.code === code;
    }
}
exports.RpcError = RpcError;
const BITCOIN_CORE_22_99 = '/Satoshi:22.99.0/';
class RpcClient {
    constructor(network, url, networkInfo) {
        this.network = network;
        this.url = url;
        this.networkInfo = networkInfo;
        this.id = 0;
    }
    /**
     * Poor man's Bluebird.map(arr, f, { concurrency })
     * Processes promises in batches of 16
     *
     * @param arr
     * @param f
     * @param [concurrency=8]
     */
    static async parallelMap(arr, f, { concurrency } = { concurrency: 16 }) {
        const rest = arr.splice(concurrency);
        const result = await Promise.all(arr.map((v, i) => f(v, i)));
        if (rest.length) {
            return [...result, ...(await this.parallelMap(rest, f))];
        }
        return result;
    }
    getUrl() {
        return this.url;
    }
    async exec(method, ...params) {
        try {
            debug('>', this.getUrl(), method, params);
            const response = await axios_1.default.post(this.getUrl(), {
                jsonrpc: '1.0',
                method,
                params,
                id: `${this.id++}`,
            });
            if (method === 'generate' || method === 'generatetoaddress') {
                debug('<', '[...]');
            }
            else {
                debug('<', response.data.result);
            }
            return response.data.result;
        }
        catch (e) {
            if (e.isAxiosError && e.response) {
                e = e;
                debug('< ERROR', e.response.statusText, e.response.data);
                e = e;
                const { error = {} } = e.response.data;
                throw new RpcError(error);
            }
            throw e;
        }
    }
    requiresWalletPath() {
        if (!this.networkInfo) {
            throw new Error(`networkInfo must be set`);
        }
        return this.networkInfo.subversion === BITCOIN_CORE_22_99;
    }
    withWallet(walletName) {
        if (!this.networkInfo) {
            throw new Error(`networkInfo must be set`);
        }
        return new RpcClientWithWallet(this.network, this.url, this.networkInfo, walletName);
    }
    async getHelp() {
        return this.exec('help');
    }
    async createWallet(walletName) {
        return this.exec('createwallet', walletName);
    }
    async loadWallet(walletName) {
        return this.exec('loadwallet', walletName);
    }
    async getNetworkInfo() {
        return this.exec('getnetworkinfo');
    }
    async getBlockCount() {
        return this.exec('getblockcount');
    }
    async getRawTransaction(txid) {
        return Buffer.from(await this.exec('getrawtransaction', txid), 'hex');
    }
    async getRawTransactionVerbose(txid) {
        const verbose = (0, networks_1.isZcash)(this.network) ? 1 : true;
        return await this.exec('getrawtransaction', txid, verbose);
    }
    async sendRawTransaction(tx) {
        return await this.exec('sendrawtransaction', tx.toString('hex'));
    }
    static async fromEnvvar(network) {
        const networkName = (0, networks_1.getNetworkName)(network);
        assert(networkName);
        const envKey = 'RPC_' + networkName.toUpperCase();
        const url = process.env[envKey];
        if (url === undefined) {
            throw new Error(`envvar ${envKey} not set`);
        }
        return this.forUrl(network, url);
    }
    static getSupportedNodeVersions(network) {
        switch ((0, networks_1.getMainnet)(network)) {
            case utxolib.networks.bitcoin:
                return ['/Satoshi:0.20.0/', '/Satoshi:0.21.1/', '/Satoshi:22.0.0/', BITCOIN_CORE_22_99];
            case utxolib.networks.bitcoincash:
                return ['/Bitcoin Cash Node:23.0.0(EB32.0)/'];
            case utxolib.networks.bitcoinsv:
                return ['/Bitcoin SV:1.0.5/'];
            case utxolib.networks.bitcoingold:
                return ['/Bitcoin Gold:0.17.3/'];
            case utxolib.networks.dash:
                return ['/Dash Core:0.16.1.1/'];
            case utxolib.networks.dogecoin:
                return ['/Shibetoshi:1.14.5/'];
            case utxolib.networks.ecash:
                return ['/Bitcoin ABC:0.26.9(EB32.0)/'];
            case utxolib.networks.litecoin:
                return ['/LitecoinCore:0.17.1/'];
            case utxolib.networks.zcash:
                return ['/MagicBean:4.7.0/'];
            default:
                return [];
        }
    }
    static async forUrl(network, url) {
        const networkName = (0, networks_1.getNetworkName)(network);
        const rpcClient = new RpcClient(network, url);
        const networkinfo = await rpcClient.getNetworkInfo();
        const versions = this.getSupportedNodeVersions(network);
        if (!versions.includes(networkinfo.subversion)) {
            throw new Error(`unsupported coin ${networkName} subversion=${networkinfo.subversion} versions=${versions}`);
        }
        return new RpcClient(network, url, networkinfo);
    }
    static async forUrlWait(network, url) {
        for (let i = 0; i < 600; i++) {
            try {
                return await this.forUrl(network, url);
            }
            catch (e) {
                console.error(`[${(0, networks_1.getNetworkName)(network)}] ${e}, waiting 1000 millis...`);
                await sleep(1000);
            }
        }
        throw new Error(`could not get RpcClient`);
    }
}
exports.RpcClient = RpcClient;
class RpcClientWithWallet extends RpcClient {
    constructor(network, url, networkInfo, walletName) {
        super(network, url, networkInfo);
        this.walletName = walletName;
    }
    getUrl() {
        if (this.requiresWalletPath()) {
            return super.getUrl() + '/wallet/' + this.walletName;
        }
        return super.getUrl();
    }
    async getWalletInfo() {
        return await this.exec('getwalletinfo');
    }
    async getBalance() {
        return await this.exec('getbalance');
    }
    async getNewAddress() {
        return this.exec('getnewaddress');
    }
    async sendToAddress(address, amount) {
        return this.exec('sendtoaddress', address, amount);
    }
    async generateToAddress(n, address) {
        switch (this.network) {
            case utxolib.networks.zcashTest:
                await this.exec('generate', n);
                await sleep(1000);
                await this.sendToAddress(address, 1);
                break;
            default:
                await this.exec('generatetoaddress', n, address);
        }
    }
}
exports.RpcClientWithWallet = RpcClientWithWallet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUnBjQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9pbnRlZ3JhdGlvbl9sb2NhbF9ycGMvZ2VuZXJhdGUvUnBjQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUFpQztBQUNqQyxpQ0FBMEM7QUFDMUMsaUNBQStCO0FBRS9CLG9EQUFxRjtBQUdyRixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFeEMsTUFBTSxLQUFLLEdBQUcsSUFBQSxlQUFVLEVBQUMsV0FBVyxDQUFDLENBQUM7QUFFdEMsU0FBUyxLQUFLLENBQUMsTUFBYztJQUMzQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDN0IsVUFBVSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFhLFFBQVMsU0FBUSxLQUFLO0lBQ2pDLFlBQW1CLFFBQTJDO1FBQzVELEtBQUssQ0FBQyxjQUFjLFFBQVEsQ0FBQyxPQUFPLFVBQVUsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFEL0MsYUFBUSxHQUFSLFFBQVEsQ0FBbUM7SUFFOUQsQ0FBQztJQUVELE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFRLEVBQUUsSUFBWTtRQUM5QyxPQUFPLENBQUMsWUFBWSxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO0lBQzNELENBQUM7Q0FDRjtBQVJELDRCQVFDO0FBSUQsTUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztBQUUvQyxNQUFhLFNBQVM7SUFHcEIsWUFBc0IsT0FBZ0IsRUFBWSxHQUFXLEVBQVksV0FBeUI7UUFBNUUsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUFZLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBWSxnQkFBVyxHQUFYLFdBQVcsQ0FB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LENBQUMsZUFBZSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBZSxFQUFFLE1BQXVCO1FBQzFELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBUyxFQUFFLE9BQWU7UUFDaEQsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3BCLEtBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTO2dCQUM3QixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixNQUFNLEtBQUssQ0FBQyxJQUFLLENBQUMsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTTtZQUNSO2dCQUNFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDcEQ7SUFDSCxDQUFDO0NBQ0Y7QUF2Q0Qsa0RBdUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCBheGlvcywgeyBBeGlvc0Vycm9yIH0gZnJvbSAnYXhpb3MnO1xyXG5pbXBvcnQgYnVpbGREZWJ1ZyBmcm9tICdkZWJ1Zyc7XHJcblxyXG5pbXBvcnQgeyBOZXR3b3JrLCBnZXRNYWlubmV0LCBnZXROZXR3b3JrTmFtZSwgaXNaY2FzaCB9IGZyb20gJy4uLy4uLy4uL3NyYy9uZXR3b3Jrcyc7XHJcbmltcG9ydCB7IFJwY1RyYW5zYWN0aW9uIH0gZnJvbSAnLi9ScGNUeXBlcyc7XHJcblxyXG5jb25zdCB1dHhvbGliID0gcmVxdWlyZSgnLi4vLi4vLi4vc3JjJyk7XHJcblxyXG5jb25zdCBkZWJ1ZyA9IGJ1aWxkRGVidWcoJ1JwY0NsaWVudCcpO1xyXG5cclxuZnVuY3Rpb24gc2xlZXAobWlsbGlzOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgbWlsbGlzKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFJwY0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBycGNFcnJvcjogeyBjb2RlOiBudW1iZXI7IG1lc3NhZ2U6IHN0cmluZyB9KSB7XHJcbiAgICBzdXBlcihgUlBDIGVycm9yOiAke3JwY0Vycm9yLm1lc3NhZ2V9IChjb2RlPSR7cnBjRXJyb3IuY29kZX0pYCk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgaXNScGNFcnJvcldpdGhDb2RlKGU6IEVycm9yLCBjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBlIGluc3RhbmNlb2YgUnBjRXJyb3IgJiYgZS5ycGNFcnJvci5jb2RlID09PSBjb2RlO1xyXG4gIH1cclxufVxyXG5cclxudHlwZSBOZXR3b3JrSW5mbyA9IHsgc3VidmVyc2lvbjogc3RyaW5nIH07XHJcblxyXG5jb25zdCBCSVRDT0lOX0NPUkVfMjJfOTkgPSAnL1NhdG9zaGk6MjIuOTkuMC8nO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJwY0NsaWVudCB7XHJcbiAgaWQgPSAwO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgbmV0d29yazogTmV0d29yaywgcHJvdGVjdGVkIHVybDogc3RyaW5nLCBwcm90ZWN0ZWQgbmV0d29ya0luZm8/OiBOZXR3b3JrSW5mbykge31cclxuXHJcbiAgLyoqXHJcbiAgICogUG9vciBtYW4ncyBCbHVlYmlyZC5tYXAoYXJyLCBmLCB7IGNvbmN1cnJlbmN5IH0pXHJcbiAgICogUHJvY2Vzc2VzIHByb21pc2VzIGluIGJhdGNoZXMgb2YgMTZcclxuICAgKlxyXG4gICAqIEBwYXJhbSBhcnJcclxuICAgKiBAcGFyYW0gZlxyXG4gICAqIEBwYXJhbSBbY29uY3VycmVuY3k9OF1cclxuICAgKi9cclxuICBzdGF0aWMgYXN5bmMgcGFyYWxsZWxNYXA8UywgVD4oXHJcbiAgICBhcnI6IFNbXSxcclxuICAgIGY6IChTLCBpOiBudW1iZXIpID0+IFByb21pc2U8VD4sXHJcbiAgICB7IGNvbmN1cnJlbmN5IH06IHsgY29uY3VycmVuY3k6IG51bWJlciB9ID0geyBjb25jdXJyZW5jeTogMTYgfVxyXG4gICk6IFByb21pc2U8VFtdPiB7XHJcbiAgICBjb25zdCByZXN0OiBTW10gPSBhcnIuc3BsaWNlKGNvbmN1cnJlbmN5KTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UuYWxsKGFyci5tYXAoKHYsIGkpID0+IGYodiwgaSkpKTtcclxuICAgIGlmIChyZXN0Lmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4gWy4uLnJlc3VsdCwgLi4uKGF3YWl0IHRoaXMucGFyYWxsZWxNYXAocmVzdCwgZikpXTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZ2V0VXJsKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy51cmw7XHJcbiAgfVxyXG5cclxuICBhc3luYyBleGVjPFQ+KG1ldGhvZDogc3RyaW5nLCAuLi5wYXJhbXM6IHVua25vd25bXSk6IFByb21pc2U8VD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZGVidWcoJz4nLCB0aGlzLmdldFVybCgpLCBtZXRob2QsIHBhcmFtcyk7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdCh0aGlzLmdldFVybCgpLCB7XHJcbiAgICAgICAganNvbnJwYzogJzEuMCcsXHJcbiAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgIHBhcmFtcyxcclxuICAgICAgICBpZDogYCR7dGhpcy5pZCsrfWAsXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAobWV0aG9kID09PSAnZ2VuZXJhdGUnIHx8IG1ldGhvZCA9PT0gJ2dlbmVyYXRldG9hZGRyZXNzJykge1xyXG4gICAgICAgIGRlYnVnKCc8JywgJ1suLi5dJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZGVidWcoJzwnLCByZXNwb25zZS5kYXRhLnJlc3VsdCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0O1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBpZiAoZS5pc0F4aW9zRXJyb3IgJiYgZS5yZXNwb25zZSkge1xyXG4gICAgICAgIGUgPSBlIGFzIEF4aW9zRXJyb3I7XHJcbiAgICAgICAgZGVidWcoJzwgRVJST1InLCBlLnJlc3BvbnNlLnN0YXR1c1RleHQsIGUucmVzcG9uc2UuZGF0YSk7XHJcbiAgICAgICAgZSA9IGUgYXMgQXhpb3NFcnJvcjtcclxuICAgICAgICBjb25zdCB7IGVycm9yID0ge30gfSA9IGUucmVzcG9uc2UuZGF0YTtcclxuICAgICAgICB0aHJvdyBuZXcgUnBjRXJyb3IoZXJyb3IpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aHJvdyBlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVxdWlyZXNXYWxsZXRQYXRoKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCF0aGlzLm5ldHdvcmtJbmZvKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbmV0d29ya0luZm8gbXVzdCBiZSBzZXRgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm5ldHdvcmtJbmZvLnN1YnZlcnNpb24gPT09IEJJVENPSU5fQ09SRV8yMl85OTtcclxuICB9XHJcblxyXG4gIHdpdGhXYWxsZXQod2FsbGV0TmFtZTogc3RyaW5nKTogUnBjQ2xpZW50V2l0aFdhbGxldCB7XHJcbiAgICBpZiAoIXRoaXMubmV0d29ya0luZm8pIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBuZXR3b3JrSW5mbyBtdXN0IGJlIHNldGApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBScGNDbGllbnRXaXRoV2FsbGV0KHRoaXMubmV0d29yaywgdGhpcy51cmwsIHRoaXMubmV0d29ya0luZm8sIHdhbGxldE5hbWUpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0SGVscCgpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZXhlYygnaGVscCcpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlV2FsbGV0KHdhbGxldE5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4gdGhpcy5leGVjKCdjcmVhdGV3YWxsZXQnLCB3YWxsZXROYW1lKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxvYWRXYWxsZXQod2FsbGV0TmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHJldHVybiB0aGlzLmV4ZWMoJ2xvYWR3YWxsZXQnLCB3YWxsZXROYW1lKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldE5ldHdvcmtJbmZvKCk6IFByb21pc2U8eyBzdWJ2ZXJzaW9uOiBzdHJpbmcgfT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZXhlYygnZ2V0bmV0d29ya2luZm8nKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEJsb2NrQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcclxuICAgIHJldHVybiB0aGlzLmV4ZWMoJ2dldGJsb2NrY291bnQnKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldFJhd1RyYW5zYWN0aW9uKHR4aWQ6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XHJcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oYXdhaXQgdGhpcy5leGVjPHN0cmluZz4oJ2dldHJhd3RyYW5zYWN0aW9uJywgdHhpZCksICdoZXgnKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldFJhd1RyYW5zYWN0aW9uVmVyYm9zZSh0eGlkOiBzdHJpbmcpOiBQcm9taXNlPFJwY1RyYW5zYWN0aW9uPiB7XHJcbiAgICBjb25zdCB2ZXJib3NlID0gaXNaY2FzaCh0aGlzLm5ldHdvcmspID8gMSA6IHRydWU7XHJcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKCdnZXRyYXd0cmFuc2FjdGlvbicsIHR4aWQsIHZlcmJvc2UpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2VuZFJhd1RyYW5zYWN0aW9uKHR4OiBCdWZmZXIpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYygnc2VuZHJhd3RyYW5zYWN0aW9uJywgdHgudG9TdHJpbmcoJ2hleCcpKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBhc3luYyBmcm9tRW52dmFyKG5ldHdvcms6IE5ldHdvcmspOiBQcm9taXNlPFJwY0NsaWVudD4ge1xyXG4gICAgY29uc3QgbmV0d29ya05hbWUgPSBnZXROZXR3b3JrTmFtZShuZXR3b3JrKTtcclxuICAgIGFzc2VydChuZXR3b3JrTmFtZSk7XHJcbiAgICBjb25zdCBlbnZLZXkgPSAnUlBDXycgKyBuZXR3b3JrTmFtZS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgY29uc3QgdXJsID0gcHJvY2Vzcy5lbnZbZW52S2V5XTtcclxuICAgIGlmICh1cmwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGVudnZhciAke2VudktleX0gbm90IHNldGApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmZvclVybChuZXR3b3JrLCB1cmwpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldFN1cHBvcnRlZE5vZGVWZXJzaW9ucyhuZXR3b3JrOiBOZXR3b3JrKTogc3RyaW5nW10ge1xyXG4gICAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgICAgIHJldHVybiBbJy9TYXRvc2hpOjAuMjAuMC8nLCAnL1NhdG9zaGk6MC4yMS4xLycsICcvU2F0b3NoaToyMi4wLjAvJywgQklUQ09JTl9DT1JFXzIyXzk5XTtcclxuICAgICAgY2FzZSB1dHhvbGliLm5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgICAgIHJldHVybiBbJy9CaXRjb2luIENhc2ggTm9kZToyMy4wLjAoRUIzMi4wKS8nXTtcclxuICAgICAgY2FzZSB1dHhvbGliLm5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgICAgICByZXR1cm4gWycvQml0Y29pbiBTVjoxLjAuNS8nXTtcclxuICAgICAgY2FzZSB1dHhvbGliLm5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgICAgIHJldHVybiBbJy9CaXRjb2luIEdvbGQ6MC4xNy4zLyddO1xyXG4gICAgICBjYXNlIHV0eG9saWIubmV0d29ya3MuZGFzaDpcclxuICAgICAgICByZXR1cm4gWycvRGFzaCBDb3JlOjAuMTYuMS4xLyddO1xyXG4gICAgICBjYXNlIHV0eG9saWIubmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICAgICAgcmV0dXJuIFsnL1NoaWJldG9zaGk6MS4xNC41LyddO1xyXG4gICAgICBjYXNlIHV0eG9saWIubmV0d29ya3MuZWNhc2g6XHJcbiAgICAgICAgcmV0dXJuIFsnL0JpdGNvaW4gQUJDOjAuMjYuOShFQjMyLjApLyddO1xyXG4gICAgICBjYXNlIHV0eG9saWIubmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgICAgcmV0dXJuIFsnL0xpdGVjb2luQ29yZTowLjE3LjEvJ107XHJcbiAgICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgICByZXR1cm4gWycvTWFnaWNCZWFuOjQuNy4wLyddO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN0YXRpYyBhc3luYyBmb3JVcmwobmV0d29yazogTmV0d29yaywgdXJsOiBzdHJpbmcpOiBQcm9taXNlPFJwY0NsaWVudD4ge1xyXG4gICAgY29uc3QgbmV0d29ya05hbWUgPSBnZXROZXR3b3JrTmFtZShuZXR3b3JrKTtcclxuICAgIGNvbnN0IHJwY0NsaWVudCA9IG5ldyBScGNDbGllbnQobmV0d29yaywgdXJsKTtcclxuICAgIGNvbnN0IG5ldHdvcmtpbmZvID0gYXdhaXQgcnBjQ2xpZW50LmdldE5ldHdvcmtJbmZvKCk7XHJcblxyXG4gICAgY29uc3QgdmVyc2lvbnMgPSB0aGlzLmdldFN1cHBvcnRlZE5vZGVWZXJzaW9ucyhuZXR3b3JrKTtcclxuICAgIGlmICghdmVyc2lvbnMuaW5jbHVkZXMobmV0d29ya2luZm8uc3VidmVyc2lvbikpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBjb2luICR7bmV0d29ya05hbWV9IHN1YnZlcnNpb249JHtuZXR3b3JraW5mby5zdWJ2ZXJzaW9ufSB2ZXJzaW9ucz0ke3ZlcnNpb25zfWApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUnBjQ2xpZW50KG5ldHdvcmssIHVybCwgbmV0d29ya2luZm8pO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGFzeW5jIGZvclVybFdhaXQobmV0d29yazogTmV0d29yaywgdXJsOiBzdHJpbmcpOiBQcm9taXNlPFJwY0NsaWVudD4ge1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2MDA7IGkrKykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmZvclVybChuZXR3b3JrLCB1cmwpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgWyR7Z2V0TmV0d29ya05hbWUobmV0d29yayl9XSAke2V9LCB3YWl0aW5nIDEwMDAgbWlsbGlzLi4uYCk7XHJcbiAgICAgICAgYXdhaXQgc2xlZXAoMV8wMDApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBnZXQgUnBjQ2xpZW50YCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUnBjQ2xpZW50V2l0aFdhbGxldCBleHRlbmRzIFJwY0NsaWVudCB7XHJcbiAgY29uc3RydWN0b3IobmV0d29yazogTmV0d29yaywgdXJsOiBzdHJpbmcsIG5ldHdvcmtJbmZvOiBOZXR3b3JrSW5mbywgcHJpdmF0ZSB3YWxsZXROYW1lPzogc3RyaW5nKSB7XHJcbiAgICBzdXBlcihuZXR3b3JrLCB1cmwsIG5ldHdvcmtJbmZvKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZXRVcmwoKTogc3RyaW5nIHtcclxuICAgIGlmICh0aGlzLnJlcXVpcmVzV2FsbGV0UGF0aCgpKSB7XHJcbiAgICAgIHJldHVybiBzdXBlci5nZXRVcmwoKSArICcvd2FsbGV0LycgKyB0aGlzLndhbGxldE5hbWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc3VwZXIuZ2V0VXJsKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZ2V0V2FsbGV0SW5mbygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKCdnZXR3YWxsZXRpbmZvJyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZ2V0QmFsYW5jZSgpOiBQcm9taXNlPG51bWJlcj4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYygnZ2V0YmFsYW5jZScpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0TmV3QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZXhlYygnZ2V0bmV3YWRkcmVzcycpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2VuZFRvQWRkcmVzcyhhZGRyZXNzOiBzdHJpbmcsIGFtb3VudDogbnVtYmVyIHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHJldHVybiB0aGlzLmV4ZWMoJ3NlbmR0b2FkZHJlc3MnLCBhZGRyZXNzLCBhbW91bnQpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2VuZXJhdGVUb0FkZHJlc3MobjogbnVtYmVyLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHN3aXRjaCAodGhpcy5uZXR3b3JrKSB7XHJcbiAgICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy56Y2FzaFRlc3Q6XHJcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjKCdnZW5lcmF0ZScsIG4pO1xyXG4gICAgICAgIGF3YWl0IHNsZWVwKDFfMDAwKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnNlbmRUb0FkZHJlc3MoYWRkcmVzcywgMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjKCdnZW5lcmF0ZXRvYWRkcmVzcycsIG4sIGFkZHJlc3MpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=