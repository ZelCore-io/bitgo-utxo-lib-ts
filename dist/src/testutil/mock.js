"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockUnspents = exports.mockWalletUnspent = exports.mockReplayProtectionUnspent = exports.isReplayProtectionUnspent = exports.replayProtectionKeyPair = exports.mockPrevTx = void 0;
const assert = require("assert");
const noble = require("@noble/secp256k1");
const utxolib = require("..");
const networks_1 = require("../networks");
const bitgo_1 = require("../bitgo");
const address_1 = require("../address");
const outputScripts_1 = require("../bitgo/outputScripts");
const keys_1 = require("./keys");
function mockPrevTx(vout, outputScript, value, network) {
    const psbtFromNetwork = (0, bitgo_1.createPsbtForNetwork)({ network });
    const keypair = (0, keys_1.getKey)('mock-prev-tx');
    const pubkey = keypair.publicKey;
    assert(keypair.privateKey);
    const payment = utxolib.payments.p2wpkh({ pubkey });
    const destOutput = payment.output;
    if (!destOutput)
        throw new Error('Impossible, payment we just constructed has no output');
    for (let index = 0; index <= vout; index++) {
        if (index === vout) {
            psbtFromNetwork.addOutput({ script: outputScript, value });
        }
        else {
            psbtFromNetwork.addOutput({ script: destOutput, value });
        }
    }
    psbtFromNetwork.addInput({
        hash: Buffer.alloc(32, 0x01),
        index: 0,
        witnessUtxo: { script: destOutput, value: value * (BigInt(vout) + BigInt(1)) + BigInt(1000) },
    });
    psbtFromNetwork.signInput(0, {
        publicKey: pubkey,
        sign: (hash, lowR) => Buffer.from(noble.signSync(hash, keypair.privateKey, { canonical: !lowR, der: false })),
    });
    psbtFromNetwork.validateSignaturesOfAllInputs();
    psbtFromNetwork.finalizeAllInputs();
    return psbtFromNetwork.extractTransaction();
}
exports.mockPrevTx = mockPrevTx;
exports.replayProtectionKeyPair = (0, keys_1.getKey)('replay-protection');
const replayProtectionScriptPubKey = (0, outputScripts_1.createOutputScriptP2shP2pk)(exports.replayProtectionKeyPair.publicKey).scriptPubKey;
function isReplayProtectionUnspent(u, network) {
    return u.address === (0, address_1.fromOutputScript)(replayProtectionScriptPubKey, network);
}
exports.isReplayProtectionUnspent = isReplayProtectionUnspent;
function mockReplayProtectionUnspent(network, value, { key = exports.replayProtectionKeyPair, vout = 0 } = {}) {
    const outputScript = (0, outputScripts_1.createOutputScriptP2shP2pk)(key.publicKey).scriptPubKey;
    const prevTransaction = mockPrevTx(vout, outputScript, BigInt(value), network);
    return { ...(0, bitgo_1.fromOutputWithPrevTx)(prevTransaction, vout), value };
}
exports.mockReplayProtectionUnspent = mockReplayProtectionUnspent;
function mockWalletUnspent(network, value, { chain = 0, index = 0, keys = (0, keys_1.getDefaultWalletKeys)(), vout = 0, id, } = {}) {
    const derivedKeys = keys.deriveForChainAndIndex(chain, index);
    const address = (0, address_1.fromOutputScript)((0, outputScripts_1.createOutputScript2of3)(derivedKeys.publicKeys, (0, bitgo_1.scriptTypeForChain)(chain)).scriptPubKey, network);
    if (id && typeof id === 'string') {
        return { id, address, chain, index, value };
    }
    else {
        const prevTransaction = mockPrevTx(vout, (0, outputScripts_1.createOutputScript2of3)(derivedKeys.publicKeys, (0, bitgo_1.scriptTypeForChain)(chain), network).scriptPubKey, BigInt(value), network);
        const unspent = (0, bitgo_1.isSegwit)(chain) || (0, networks_1.getMainnet)(network) === networks_1.networks.zcash
            ? (0, bitgo_1.fromOutput)(prevTransaction, vout)
            : (0, bitgo_1.fromOutputWithPrevTx)(prevTransaction, vout);
        return {
            ...unspent,
            chain,
            index,
            value,
        };
    }
}
exports.mockWalletUnspent = mockWalletUnspent;
function mockUnspents(rootWalletKeys, inputScriptTypes, testOutputAmount, network) {
    return inputScriptTypes.map((t, i) => {
        if (bitgo_1.outputScripts.isScriptType2Of3(t)) {
            return mockWalletUnspent(network, testOutputAmount, {
                keys: rootWalletKeys,
                chain: (0, bitgo_1.getExternalChainCode)(t),
                vout: i,
            });
        }
        else if (t === bitgo_1.outputScripts.scriptTypeP2shP2pk) {
            return mockReplayProtectionUnspent(network, testOutputAmount, {
                key: exports.replayProtectionKeyPair,
                vout: i,
            });
        }
        throw new Error(`invalid input type ${t}`);
    });
}
exports.mockUnspents = mockUnspents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0dXRpbC9tb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUFpQztBQUVqQywwQ0FBMEM7QUFDMUMsOEJBQThCO0FBQzlCLDBDQUE0RDtBQUU1RCxvQ0Fla0I7QUFDbEIsd0NBQThDO0FBQzlDLDBEQUE0RjtBQUU1RixpQ0FBc0Q7QUFJdEQsU0FBZ0IsVUFBVSxDQUN4QixJQUFZLEVBQ1osWUFBb0IsRUFDcEIsS0FBYSxFQUNiLE9BQWdCO0lBRWhCLE1BQU0sZUFBZSxHQUFHLElBQUEsNEJBQW9CLEVBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBRTFELE1BQU0sT0FBTyxHQUFHLElBQUEsYUFBTSxFQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDakMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxJQUFJLENBQUMsVUFBVTtRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztJQUUxRixLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQzFDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixlQUFlLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQzVEO2FBQU07WUFDTCxlQUFlLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUs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QUFHLEVBQUUsK0JBQXVCO2dCQUM1QixJQUFJLEVBQUUsQ0FBQzthQUNSLENBQUMsQ0FBQztTQUNKO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFyQkQsb0NBcUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCB7IEJJUDMySW50ZXJmYWNlIH0gZnJvbSAnYmlwMzInO1xyXG5pbXBvcnQgKiBhcyBub2JsZSBmcm9tICdAbm9ibGUvc2VjcDI1NmsxJztcclxuaW1wb3J0ICogYXMgdXR4b2xpYiBmcm9tICcuLic7XHJcbmltcG9ydCB7IGdldE1haW5uZXQsIE5ldHdvcmssIG5ldHdvcmtzIH0gZnJvbSAnLi4vbmV0d29ya3MnO1xyXG5cclxuaW1wb3J0IHtcclxuICBDaGFpbkNvZGUsXHJcbiAgY3JlYXRlUHNidEZvck5ldHdvcmssXHJcbiAgZnJvbU91dHB1dCxcclxuICBmcm9tT3V0cHV0V2l0aFByZXZUeCxcclxuICBnZXRFeHRlcm5hbENoYWluQ29kZSxcclxuICBpc1NlZ3dpdCxcclxuICBOb25XaXRuZXNzV2FsbGV0VW5zcGVudCxcclxuICBvdXRwdXRTY3JpcHRzLFxyXG4gIFJvb3RXYWxsZXRLZXlzLFxyXG4gIHNjcmlwdFR5cGVGb3JDaGFpbixcclxuICBVbnNwZW50LFxyXG4gIFVuc3BlbnRXaXRoUHJldlR4LFxyXG4gIFV0eG9UcmFuc2FjdGlvbixcclxuICBXYWxsZXRVbnNwZW50LFxyXG59IGZyb20gJy4uL2JpdGdvJztcclxuaW1wb3J0IHsgZnJvbU91dHB1dFNjcmlwdCB9IGZyb20gJy4uL2FkZHJlc3MnO1xyXG5pbXBvcnQgeyBjcmVhdGVPdXRwdXRTY3JpcHQyb2YzLCBjcmVhdGVPdXRwdXRTY3JpcHRQMnNoUDJwayB9IGZyb20gJy4uL2JpdGdvL291dHB1dFNjcmlwdHMnO1xyXG5cclxuaW1wb3J0IHsgZ2V0RGVmYXVsdFdhbGxldEtleXMsIGdldEtleSB9IGZyb20gJy4va2V5cyc7XHJcblxyXG5leHBvcnQgdHlwZSBJbnB1dFR5cGUgPSBvdXRwdXRTY3JpcHRzLlNjcmlwdFR5cGUyT2YzO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vY2tQcmV2VHgoXHJcbiAgdm91dDogbnVtYmVyLFxyXG4gIG91dHB1dFNjcmlwdDogQnVmZmVyLFxyXG4gIHZhbHVlOiBiaWdpbnQsXHJcbiAgbmV0d29yazogTmV0d29ya1xyXG4pOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PiB7XHJcbiAgY29uc3QgcHNidEZyb21OZXR3b3JrID0gY3JlYXRlUHNidEZvck5ldHdvcmsoeyBuZXR3b3JrIH0pO1xyXG5cclxuICBjb25zdCBrZXlwYWlyID0gZ2V0S2V5KCdtb2NrLXByZXYtdHgnKTtcclxuICBjb25zdCBwdWJrZXkgPSBrZXlwYWlyLnB1YmxpY0tleTtcclxuICBhc3NlcnQoa2V5cGFpci5wcml2YXRlS2V5KTtcclxuICBjb25zdCBwYXltZW50ID0gdXR4b2xpYi5wYXltZW50cy5wMndwa2goeyBwdWJrZXkgfSk7XHJcbiAgY29uc3QgZGVzdE91dHB1dCA9IHBheW1lbnQub3V0cHV0O1xyXG4gIGlmICghZGVzdE91dHB1dCkgdGhyb3cgbmV3IEVycm9yKCdJbXBvc3NpYmxlLCBwYXltZW50IHdlIGp1c3QgY29uc3RydWN0ZWQgaGFzIG5vIG91dHB1dCcpO1xyXG5cclxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDw9IHZvdXQ7IGluZGV4KyspIHtcclxuICAgIGlmIChpbmRleCA9PT0gdm91dCkge1xyXG4gICAgICBwc2J0RnJvbU5ldHdvcmsuYWRkT3V0cHV0KHsgc2NyaXB0OiBvdXRwdXRTY3JpcHQsIHZhbHVlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcHNidEZyb21OZXR3b3JrLmFkZE91dHB1dCh7IHNjcmlwdDogZGVzdE91dHB1dCwgdmFsdWUgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHBzYnRGcm9tTmV0d29yay5hZGRJbnB1dCh7XHJcbiAgICBoYXNoOiBCdWZmZXIuYWxsb2MoMzIsIDB4MDEpLFxyXG4gICAgaW5kZXg6IDAsXHJcbiAgICB3aXRuZXNzVXR4bzogeyBzY3JpcHQ6IGRlc3RPdXRwdXQsIHZhbHVlOiB2YWx1ZSAqIChCaWdJbnQodm91dCkgKyBCaWdJbnQoMSkpICsgQmlnSW50KDEwMDApIH0sXHJcbiAgfSk7XHJcbiAgcHNidEZyb21OZXR3b3JrLnNpZ25JbnB1dCgwLCB7XHJcbiAgICBwdWJsaWNLZXk6IHB1YmtleSxcclxuICAgIHNpZ246IChoYXNoOiBCdWZmZXIsIGxvd1I/OiBib29sZWFuKSA9PlxyXG4gICAgICBCdWZmZXIuZnJvbShub2JsZS5zaWduU3luYyhoYXNoLCBrZXlwYWlyLnByaXZhdGVLZXkgYXMgQnVmZmVyLCB7IGNhbm9uaWNhbDogIWxvd1IsIGRlcjogZmFsc2UgfSkpLFxyXG4gIH0pO1xyXG4gIHBzYnRGcm9tTmV0d29yay52YWxpZGF0ZVNpZ25hdHVyZXNPZkFsbElucHV0cygpO1xyXG4gIHBzYnRGcm9tTmV0d29yay5maW5hbGl6ZUFsbElucHV0cygpO1xyXG4gIHJldHVybiBwc2J0RnJvbU5ldHdvcmsuZXh0cmFjdFRyYW5zYWN0aW9uKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCByZXBsYXlQcm90ZWN0aW9uS2V5UGFpciA9IGdldEtleSgncmVwbGF5LXByb3RlY3Rpb24nKTtcclxuY29uc3QgcmVwbGF5UHJvdGVjdGlvblNjcmlwdFB1YktleSA9IGNyZWF0ZU91dHB1dFNjcmlwdFAyc2hQMnBrKHJlcGxheVByb3RlY3Rpb25LZXlQYWlyLnB1YmxpY0tleSkuc2NyaXB0UHViS2V5O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVwbGF5UHJvdGVjdGlvblVuc3BlbnQ8VE51bWJlciBleHRlbmRzIGJpZ2ludCB8IG51bWJlcj4oXHJcbiAgdTogVW5zcGVudDxUTnVtYmVyPixcclxuICBuZXR3b3JrOiBOZXR3b3JrXHJcbik6IGJvb2xlYW4ge1xyXG4gIHJldHVybiB1LmFkZHJlc3MgPT09IGZyb21PdXRwdXRTY3JpcHQocmVwbGF5UHJvdGVjdGlvblNjcmlwdFB1YktleSwgbmV0d29yayk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb2NrUmVwbGF5UHJvdGVjdGlvblVuc3BlbnQ8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB2YWx1ZTogVE51bWJlcixcclxuICB7IGtleSA9IHJlcGxheVByb3RlY3Rpb25LZXlQYWlyLCB2b3V0ID0gMCB9OiB7IGtleT86IEJJUDMySW50ZXJmYWNlOyB2b3V0PzogbnVtYmVyIH0gPSB7fVxyXG4pOiBVbnNwZW50V2l0aFByZXZUeDxUTnVtYmVyPiB7XHJcbiAgY29uc3Qgb3V0cHV0U2NyaXB0ID0gY3JlYXRlT3V0cHV0U2NyaXB0UDJzaFAycGsoa2V5LnB1YmxpY0tleSkuc2NyaXB0UHViS2V5O1xyXG4gIGNvbnN0IHByZXZUcmFuc2FjdGlvbiA9IG1vY2tQcmV2VHgodm91dCwgb3V0cHV0U2NyaXB0LCBCaWdJbnQodmFsdWUpLCBuZXR3b3JrKTtcclxuICByZXR1cm4geyAuLi5mcm9tT3V0cHV0V2l0aFByZXZUeChwcmV2VHJhbnNhY3Rpb24sIHZvdXQpLCB2YWx1ZSB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW9ja1dhbGxldFVuc3BlbnQ8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB2YWx1ZTogVE51bWJlcixcclxuICB7XHJcbiAgICBjaGFpbiA9IDAsXHJcbiAgICBpbmRleCA9IDAsXHJcbiAgICBrZXlzID0gZ2V0RGVmYXVsdFdhbGxldEtleXMoKSxcclxuICAgIHZvdXQgPSAwLFxyXG4gICAgaWQsXHJcbiAgfTogeyBjaGFpbj86IENoYWluQ29kZTsgaW5kZXg/OiBudW1iZXI7IGtleXM/OiBSb290V2FsbGV0S2V5czsgdm91dD86IG51bWJlcjsgaWQ/OiBzdHJpbmcgfSA9IHt9XHJcbik6IFdhbGxldFVuc3BlbnQ8VE51bWJlcj4gfCBOb25XaXRuZXNzV2FsbGV0VW5zcGVudDxUTnVtYmVyPiB7XHJcbiAgY29uc3QgZGVyaXZlZEtleXMgPSBrZXlzLmRlcml2ZUZvckNoYWluQW5kSW5kZXgoY2hhaW4sIGluZGV4KTtcclxuICBjb25zdCBhZGRyZXNzID0gZnJvbU91dHB1dFNjcmlwdChcclxuICAgIGNyZWF0ZU91dHB1dFNjcmlwdDJvZjMoZGVyaXZlZEtleXMucHVibGljS2V5cywgc2NyaXB0VHlwZUZvckNoYWluKGNoYWluKSkuc2NyaXB0UHViS2V5LFxyXG4gICAgbmV0d29ya1xyXG4gICk7XHJcbiAgaWYgKGlkICYmIHR5cGVvZiBpZCA9PT0gJ3N0cmluZycpIHtcclxuICAgIHJldHVybiB7IGlkLCBhZGRyZXNzLCBjaGFpbiwgaW5kZXgsIHZhbHVlIH07XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IHByZXZUcmFuc2FjdGlvbiA9IG1vY2tQcmV2VHgoXHJcbiAgICAgIHZvdXQsXHJcbiAgICAgIGNyZWF0ZU91dHB1dFNjcmlwdDJvZjMoZGVyaXZlZEtleXMucHVibGljS2V5cywgc2NyaXB0VHlwZUZvckNoYWluKGNoYWluKSwgbmV0d29yaykuc2NyaXB0UHViS2V5LFxyXG4gICAgICBCaWdJbnQodmFsdWUpLFxyXG4gICAgICBuZXR3b3JrXHJcbiAgICApO1xyXG4gICAgY29uc3QgdW5zcGVudCA9XHJcbiAgICAgIGlzU2Vnd2l0KGNoYWluKSB8fCBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy56Y2FzaFxyXG4gICAgICAgID8gZnJvbU91dHB1dChwcmV2VHJhbnNhY3Rpb24sIHZvdXQpXHJcbiAgICAgICAgOiBmcm9tT3V0cHV0V2l0aFByZXZUeChwcmV2VHJhbnNhY3Rpb24sIHZvdXQpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4udW5zcGVudCxcclxuICAgICAgY2hhaW4sXHJcbiAgICAgIGluZGV4LFxyXG4gICAgICB2YWx1ZSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW9ja1Vuc3BlbnRzPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHJvb3RXYWxsZXRLZXlzOiBSb290V2FsbGV0S2V5cyxcclxuICBpbnB1dFNjcmlwdFR5cGVzOiAoSW5wdXRUeXBlIHwgb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlUDJzaFAycGspW10sXHJcbiAgdGVzdE91dHB1dEFtb3VudDogVE51bWJlcixcclxuICBuZXR3b3JrOiBOZXR3b3JrXHJcbik6IChVbnNwZW50PFROdW1iZXI+IHwgV2FsbGV0VW5zcGVudDxUTnVtYmVyPilbXSB7XHJcbiAgcmV0dXJuIGlucHV0U2NyaXB0VHlwZXMubWFwKCh0LCBpKTogVW5zcGVudDxUTnVtYmVyPiA9PiB7XHJcbiAgICBpZiAob3V0cHV0U2NyaXB0cy5pc1NjcmlwdFR5cGUyT2YzKHQpKSB7XHJcbiAgICAgIHJldHVybiBtb2NrV2FsbGV0VW5zcGVudChuZXR3b3JrLCB0ZXN0T3V0cHV0QW1vdW50LCB7XHJcbiAgICAgICAga2V5czogcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICAgY2hhaW46IGdldEV4dGVybmFsQ2hhaW5Db2RlKHQpLFxyXG4gICAgICAgIHZvdXQ6IGksXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmICh0ID09PSBvdXRwdXRTY3JpcHRzLnNjcmlwdFR5cGVQMnNoUDJwaykge1xyXG4gICAgICByZXR1cm4gbW9ja1JlcGxheVByb3RlY3Rpb25VbnNwZW50KG5ldHdvcmssIHRlc3RPdXRwdXRBbW91bnQsIHtcclxuICAgICAgICBrZXk6IHJlcGxheVByb3RlY3Rpb25LZXlQYWlyLFxyXG4gICAgICAgIHZvdXQ6IGksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGlucHV0IHR5cGUgJHt0fWApO1xyXG4gIH0pO1xyXG59XHJcbiJdfQ==