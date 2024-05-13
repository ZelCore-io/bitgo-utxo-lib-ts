"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToFaucet = exports.sendFromFaucet = void 0;
const RpcClient_1 = require("./RpcClient");
const walletName = 'utxolib-faucet';
const errWalletNotFound = -18;
let faucetWallet;
async function initFaucetRpc(rpc, { create }) {
    try {
        await rpc.withWallet(walletName).getWalletInfo();
        return rpc.withWallet(walletName);
    }
    catch (e) {
        if (!RpcClient_1.RpcError.isRpcErrorWithCode(e, errWalletNotFound)) {
            throw e;
        }
    }
    if (!create) {
        throw new Error(`could not load faucet wallet and create=false.`);
    }
    try {
        await rpc.loadWallet(walletName);
    }
    catch (e) {
        if (!RpcClient_1.RpcError.isRpcErrorWithCode(e, errWalletNotFound)) {
            throw e;
        }
        await rpc.createWallet(walletName);
    }
    return await initFaucetRpc(rpc, { create: false });
}
async function getFaucetRpc(rpc) {
    if (!faucetWallet) {
        faucetWallet = await initFaucetRpc(rpc, { create: true });
    }
    return faucetWallet;
}
async function sendFromFaucet(rpc, address, amount) {
    const faucetWallet = await getFaucetRpc(rpc);
    return await faucetWallet.sendToAddress(address, amount);
}
exports.sendFromFaucet = sendFromFaucet;
async function generateToFaucet(rpc, nBlocks) {
    const faucetRpc = await getFaucetRpc(rpc);
    const address = await faucetRpc.getNewAddress();
    await faucetRpc.generateToAddress(nBlocks, address);
}
exports.generateToFaucet = generateToFaucet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmF1Y2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9pbnRlZ3JhdGlvbl9sb2NhbF9ycGMvZ2VuZXJhdGUvZmF1Y2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUF1RTtBQUV2RSxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztBQUVwQyxNQUFNLGlCQUFpQixHQUFHLENBQUMsRUFBRSxDQUFDO0FBRTlCLElBQUksWUFBaUMsQ0FBQztBQUV0QyxLQUFLLFVBQVUsYUFBYSxDQUFDLEdBQWMsRUFBRSxFQUFFLE1BQU0sRUFBdUI7SUFDMUUsSUFBSTtRQUNGLE1BQU0sR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNqRCxPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDbkM7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxvQkFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO1lBQ3RELE1BQU0sQ0FBQyxDQUFDO1NBQ1Q7S0FDRjtJQUVELElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFJO1FBQ0YsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ2xDO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsb0JBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtZQUN0RCxNQUFNLENBQUMsQ0FBQztTQUNUO1FBQ0QsTUFBTSxHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxNQUFNLGFBQWEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsS0FBSyxVQUFVLFlBQVksQ0FBQyxHQUFjO0lBQ3hDLElBQUksQ0FBQyxZQUFZLEVBQUU7UUFDakIsWUFBWSxHQUFHLE1BQU0sYUFBYSxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQUVNLEtBQUssVUFBVSxjQUFjLENBQUMsR0FBYyxFQUFFLE9BQWUsRUFBRSxNQUF1QjtJQUMzRixNQUFNLFlBQVksR0FBRyxNQUFNLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QyxPQUFPLE1BQU0sWUFBWSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUhELHdDQUdDO0FBRU0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLEdBQWMsRUFBRSxPQUFlO0lBQ3BFLE1BQU0sU0FBUyxHQUFHLE1BQU0sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sT0FBTyxHQUFHLE1BQU0sU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ2hELE1BQU0sU0FBUyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBSkQsNENBSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBScGNDbGllbnQsIFJwY0NsaWVudFdpdGhXYWxsZXQsIFJwY0Vycm9yIH0gZnJvbSAnLi9ScGNDbGllbnQnO1xyXG5cclxuY29uc3Qgd2FsbGV0TmFtZSA9ICd1dHhvbGliLWZhdWNldCc7XHJcblxyXG5jb25zdCBlcnJXYWxsZXROb3RGb3VuZCA9IC0xODtcclxuXHJcbmxldCBmYXVjZXRXYWxsZXQ6IFJwY0NsaWVudFdpdGhXYWxsZXQ7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbml0RmF1Y2V0UnBjKHJwYzogUnBjQ2xpZW50LCB7IGNyZWF0ZSB9OiB7IGNyZWF0ZTogYm9vbGVhbiB9KTogUHJvbWlzZTxScGNDbGllbnRXaXRoV2FsbGV0PiB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJwYy53aXRoV2FsbGV0KHdhbGxldE5hbWUpLmdldFdhbGxldEluZm8oKTtcclxuICAgIHJldHVybiBycGMud2l0aFdhbGxldCh3YWxsZXROYW1lKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZiAoIVJwY0Vycm9yLmlzUnBjRXJyb3JXaXRoQ29kZShlLCBlcnJXYWxsZXROb3RGb3VuZCkpIHtcclxuICAgICAgdGhyb3cgZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICghY3JlYXRlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBsb2FkIGZhdWNldCB3YWxsZXQgYW5kIGNyZWF0ZT1mYWxzZS5gKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBycGMubG9hZFdhbGxldCh3YWxsZXROYW1lKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZiAoIVJwY0Vycm9yLmlzUnBjRXJyb3JXaXRoQ29kZShlLCBlcnJXYWxsZXROb3RGb3VuZCkpIHtcclxuICAgICAgdGhyb3cgZTtcclxuICAgIH1cclxuICAgIGF3YWl0IHJwYy5jcmVhdGVXYWxsZXQod2FsbGV0TmFtZSk7XHJcbiAgfVxyXG4gIHJldHVybiBhd2FpdCBpbml0RmF1Y2V0UnBjKHJwYywgeyBjcmVhdGU6IGZhbHNlIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRGYXVjZXRScGMocnBjOiBScGNDbGllbnQpOiBQcm9taXNlPFJwY0NsaWVudFdpdGhXYWxsZXQ+IHtcclxuICBpZiAoIWZhdWNldFdhbGxldCkge1xyXG4gICAgZmF1Y2V0V2FsbGV0ID0gYXdhaXQgaW5pdEZhdWNldFJwYyhycGMsIHsgY3JlYXRlOiB0cnVlIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZmF1Y2V0V2FsbGV0O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZEZyb21GYXVjZXQocnBjOiBScGNDbGllbnQsIGFkZHJlc3M6IHN0cmluZywgYW1vdW50OiBudW1iZXIgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGZhdWNldFdhbGxldCA9IGF3YWl0IGdldEZhdWNldFJwYyhycGMpO1xyXG4gIHJldHVybiBhd2FpdCBmYXVjZXRXYWxsZXQuc2VuZFRvQWRkcmVzcyhhZGRyZXNzLCBhbW91bnQpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVUb0ZhdWNldChycGM6IFJwY0NsaWVudCwgbkJsb2NrczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZmF1Y2V0UnBjID0gYXdhaXQgZ2V0RmF1Y2V0UnBjKHJwYyk7XHJcbiAgY29uc3QgYWRkcmVzcyA9IGF3YWl0IGZhdWNldFJwYy5nZXROZXdBZGRyZXNzKCk7XHJcbiAgYXdhaXQgZmF1Y2V0UnBjLmdlbmVyYXRlVG9BZGRyZXNzKG5CbG9ja3MsIGFkZHJlc3MpO1xyXG59XHJcbiJdfQ==