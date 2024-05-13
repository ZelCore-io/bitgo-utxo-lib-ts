"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRpcTransaction = exports.normalizeParsedTransaction = void 0;
const address = require("../../src/address");
const networks_1 = require("../../src/networks");
const testutil_1 = require("../testutil");
function toRegtestAddress(script, network) {
    switch (network) {
        case networks_1.networks.testnet:
            network = { ...network, bech32: 'bcrt' };
            break;
        case networks_1.networks.litecoinTest:
            network = { ...network, bech32: 'rltc' };
            break;
        case networks_1.networks.bitcoingoldTestnet:
            network = { ...network, bech32: 'btgrt' };
            break;
    }
    return address.fromOutputScript(script, network);
}
function normalizeParsedTransaction(tx, network = tx.network) {
    const normalizedTx = {
        txid: tx.getId(),
        version: tx.version,
        hex: tx.toBuffer().toString('hex'),
        locktime: tx.locktime,
        size: tx.byteLength(),
        vin: tx.ins.map((i) => {
            const normalizedInput = {
                scriptSig: {
                    hex: i.script.toString('hex'),
                },
                sequence: i.sequence,
                txid: Buffer.from(i.hash).reverse().toString('hex'),
                vout: i.index,
            };
            if (i.witness && i.witness.length) {
                normalizedInput.txinwitness = i.witness.map((w) => w.toString('hex'));
            }
            return normalizedInput;
        }),
        vout: tx.outs.map((o, n) => {
            let address;
            try {
                address = toRegtestAddress(o.script, network);
            }
            catch (e) {
                // ignore
            }
            return {
                n,
                scriptPubKey: {
                    hex: o.script.toString('hex'),
                    ...(address && { address }),
                },
                value: o.value.toString(),
            };
        }),
    };
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.litecoin:
            normalizedTx.vsize = tx.virtualSize();
            normalizedTx.weight = tx.weight();
            break;
        case networks_1.networks.dash:
            const dashTx = tx;
            normalizedTx.type = dashTx.type;
            if (dashTx.extraPayload && dashTx.extraPayload.length) {
                normalizedTx.extraPayload = dashTx.extraPayload.toString('hex');
                normalizedTx.extraPayloadSize = dashTx.extraPayload.length;
            }
            break;
        case networks_1.networks.dogecoin:
            normalizedTx.vsize = tx.virtualSize();
            break;
        case networks_1.networks.zcash:
            const zcashTx = tx;
            normalizedTx.overwintered = !!zcashTx.overwintered;
            normalizedTx.versiongroupid = zcashTx.versionGroupId.toString(16);
            normalizedTx.expiryheight = zcashTx.expiryHeight;
            normalizedTx.vjoinsplit = [];
            normalizedTx.vShieldedOutput = [];
            normalizedTx.vShieldedSpend = [];
            normalizedTx.valueBalance = 0;
    }
    return normalizedTx;
}
exports.normalizeParsedTransaction = normalizeParsedTransaction;
function normalizeRpcTransaction(tx, network) {
    const normalizedTx = {
        ...tx,
        vin: tx.vin.map((v) => {
            delete v.scriptSig.asm;
            return v;
        }),
        vout: tx.vout.map((v) => {
            var _a;
            if (((_a = v.scriptPubKey.addresses) === null || _a === void 0 ? void 0 : _a.length) === 1) {
                v.scriptPubKey.address = v.scriptPubKey.addresses[0];
            }
            delete v.type;
            delete v.scriptPubKey.asm;
            delete v.scriptPubKey.addresses;
            delete v.scriptPubKey.reqSigs;
            delete v.scriptPubKey.type;
            delete v.valueSat;
            if ((0, networks_1.isZcash)(network)) {
                delete v.valueZat;
            }
            v.value = (0, testutil_1.decimalCoinsToSats)(v.value, 'bigint').toString();
            return v;
        }),
    };
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.ecash:
        case networks_1.networks.litecoin:
            // this is the normalized hash which is not implemented in utxolib
            delete normalizedTx.hash;
            break;
        case networks_1.networks.dash:
            // these flags are not supported in utxolib
            delete normalizedTx.chainlock;
            delete normalizedTx.instantlock;
            delete normalizedTx.instantlock_internal;
            delete normalizedTx.proRegTx;
            delete normalizedTx.proUpServTx;
            delete normalizedTx.proUpRevTx;
            delete normalizedTx.proUpRegTx;
            break;
        case networks_1.networks.zcash:
            delete normalizedTx.authdigest;
            delete normalizedTx.valueBalanceZat;
    }
    return normalizedTx;
}
exports.normalizeRpcTransaction = normalizeRpcTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGFyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvaW50ZWdyYXRpb25fbG9jYWxfcnBjL2NvbXBhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQTZDO0FBQzdDLGlEQUE0RTtBQUU1RSwwQ0FBaUQ7QUFNakQsU0FBUyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsT0FBNEI7SUFDcEUsUUFBUSxPQUFPLEVBQUU7UUFDZixLQUFLLG1CQUFRLENBQUMsT0FBTztZQUNuQixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDekMsTUFBTTtRQUNSLEtBQUssbUJBQVEsQ0FBQyxZQUFZO1lBQ3hCLE9BQU8sR0FBRyxFQUFFLEdBQUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUN6QyxNQUFNO1FBQ1IsS0FBSyxtQkFBUSxDQUFDLGtCQUFrQjtZQUM5QixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUMsTUFBTTtLQUNUO0lBQ0QsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQWtCLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQsU0FBZ0IsMEJBQTBCLENBQ3hDLEVBQTRCLEVBQzVCLFVBQW1CLEVBQUUsQ0FBQyxPQUFPO0lBRTdCLE1BQU0sWUFBWSxHQUFxQjtRQUNyQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRTtRQUNoQixPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU87UUFDbkIsR0FBRyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ2xDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUTtRQUNyQixJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtRQUNyQixHQUFHLEVBQUUsRUFBRSxD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LGVBQWUsQ0FBQztLQUN2QztJQUVELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFwREQsMERBb0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYWRkcmVzcyBmcm9tICcuLi8uLi9zcmMvYWRkcmVzcyc7XHJcbmltcG9ydCB7IE5ldHdvcmssIGdldE1haW5uZXQsIG5ldHdvcmtzLCBpc1pjYXNoIH0gZnJvbSAnLi4vLi4vc3JjL25ldHdvcmtzJztcclxuaW1wb3J0IHsgRGFzaFRyYW5zYWN0aW9uLCBVdHhvVHJhbnNhY3Rpb24sIFpjYXNoVHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi9zcmMvYml0Z28nO1xyXG5pbXBvcnQgeyBkZWNpbWFsQ29pbnNUb1NhdHMgfSBmcm9tICcuLi90ZXN0dXRpbCc7XHJcblxyXG5pbXBvcnQgeyBScGNUcmFuc2FjdGlvbiB9IGZyb20gJy4vZ2VuZXJhdGUvUnBjVHlwZXMnO1xyXG5cclxudHlwZSBOb3JtYWxpemVkT2JqZWN0ID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcblxyXG5mdW5jdGlvbiB0b1JlZ3Rlc3RBZGRyZXNzKHNjcmlwdDogQnVmZmVyLCBuZXR3b3JrOiB7IGJlY2gzMj86IHN0cmluZyB9KTogc3RyaW5nIHtcclxuICBzd2l0Y2ggKG5ldHdvcmspIHtcclxuICAgIGNhc2UgbmV0d29ya3MudGVzdG5ldDpcclxuICAgICAgbmV0d29yayA9IHsgLi4ubmV0d29yaywgYmVjaDMyOiAnYmNydCcgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luVGVzdDpcclxuICAgICAgbmV0d29yayA9IHsgLi4ubmV0d29yaywgYmVjaDMyOiAncmx0YycgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkVGVzdG5ldDpcclxuICAgICAgbmV0d29yayA9IHsgLi4ubmV0d29yaywgYmVjaDMyOiAnYnRncnQnIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuICByZXR1cm4gYWRkcmVzcy5mcm9tT3V0cHV0U2NyaXB0KHNjcmlwdCwgbmV0d29yayBhcyBOZXR3b3JrKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVBhcnNlZFRyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4OiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgbmV0d29yazogTmV0d29yayA9IHR4Lm5ldHdvcmtcclxuKTogTm9ybWFsaXplZE9iamVjdCB7XHJcbiAgY29uc3Qgbm9ybWFsaXplZFR4OiBOb3JtYWxpemVkT2JqZWN0ID0ge1xyXG4gICAgdHhpZDogdHguZ2V0SWQoKSxcclxuICAgIHZlcnNpb246IHR4LnZlcnNpb24sXHJcbiAgICBoZXg6IHR4LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgbG9ja3RpbWU6IHR4LmxvY2t0aW1lLFxyXG4gICAgc2l6ZTogdHguYnl0ZUxlbmd0aCgpLFxyXG4gICAgdmluOiB0eC5pbnMubWFwKChpKSA9PiB7XHJcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRJbnB1dDogTm9ybWFsaXplZE9iamVjdCA9IHtcclxuICAgICAgICBzY3JpcHRTaWc6IHtcclxuICAgICAgICAgIGhleDogaS5zY3JpcHQudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VxdWVuY2U6IGkuc2VxdWVuY2UsXHJcbiAgICAgICAgdHhpZDogQnVmZmVyLmZyb20oaS5oYXNoKS5yZXZlcnNlKCkudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICAgIHZvdXQ6IGkuaW5kZXgsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAoaS53aXRuZXNzICYmIGkud2l0bmVzcy5sZW5ndGgpIHtcclxuICAgICAgICBub3JtYWxpemVkSW5wdXQudHhpbndpdG5lc3MgPSBpLndpdG5lc3MubWFwKCh3KSA9PiB3LnRvU3RyaW5nKCdoZXgnKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBub3JtYWxpemVkSW5wdXQ7XHJcbiAgICB9KSxcclxuICAgIHZvdXQ6IHR4Lm91dHMubWFwKChvLCBuKSA9PiB7XHJcbiAgICAgIGxldCBhZGRyZXNzO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGFkZHJlc3MgPSB0b1JlZ3Rlc3RBZGRyZXNzKG8uc2NyaXB0LCBuZXR3b3JrIGFzIHsgYmVjaDMyPzogc3RyaW5nIH0pO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy8gaWdub3JlXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBuLFxyXG4gICAgICAgIHNjcmlwdFB1YktleToge1xyXG4gICAgICAgICAgaGV4OiBvLnNjcmlwdC50b1N0cmluZygnaGV4JyksXHJcbiAgICAgICAgICAuLi4oYWRkcmVzcyAmJiB7IGFkZHJlc3MgfSksXHJcbiAgICAgICAgfSxcclxuICAgICAgICB2YWx1ZTogby52YWx1ZS50b1N0cmluZygpLFxyXG4gICAgICB9O1xyXG4gICAgfSksXHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgbm9ybWFsaXplZFR4LnZzaXplID0gdHgudmlydHVhbFNpemUoKTtcclxuICAgICAgbm9ybWFsaXplZFR4LndlaWdodCA9IHR4LndlaWdodCgpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgY29uc3QgZGFzaFR4ID0gdHggYXMgdW5rbm93biBhcyBEYXNoVHJhbnNhY3Rpb247XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC50eXBlID0gZGFzaFR4LnR5cGU7XHJcbiAgICAgIGlmIChkYXNoVHguZXh0cmFQYXlsb2FkICYmIGRhc2hUeC5leHRyYVBheWxvYWQubGVuZ3RoKSB7XHJcbiAgICAgICAgbm9ybWFsaXplZFR4LmV4dHJhUGF5bG9hZCA9IGRhc2hUeC5leHRyYVBheWxvYWQudG9TdHJpbmcoJ2hleCcpO1xyXG4gICAgICAgIG5vcm1hbGl6ZWRUeC5leHRyYVBheWxvYWRTaXplID0gZGFzaFR4LmV4dHJhUGF5bG9hZC5sZW5ndGg7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgICBub3JtYWxpemVkVHgudnNpemUgPSB0eC52aXJ0dWFsU2l6ZSgpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIGNvbnN0IHpjYXNoVHggPSB0eCBhcyB1bmtub3duIGFzIFpjYXNoVHJhbnNhY3Rpb247XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC5vdmVyd2ludGVyZWQgPSAhIXpjYXNoVHgub3ZlcndpbnRlcmVkO1xyXG4gICAgICBub3JtYWxpemVkVHgudmVyc2lvbmdyb3VwaWQgPSB6Y2FzaFR4LnZlcnNpb25Hcm91cElkLnRvU3RyaW5nKDE2KTtcclxuICAgICAgbm9ybWFsaXplZFR4LmV4cGlyeWhlaWdodCA9IHpjYXNoVHguZXhwaXJ5SGVpZ2h0O1xyXG4gICAgICBub3JtYWxpemVkVHgudmpvaW5zcGxpdCA9IFtdO1xyXG4gICAgICBub3JtYWxpemVkVHgudlNoaWVsZGVkT3V0cHV0ID0gW107XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52U2hpZWxkZWRTcGVuZCA9IFtdO1xyXG4gICAgICBub3JtYWxpemVkVHgudmFsdWVCYWxhbmNlID0gMDtcclxuICB9XHJcblxyXG4gIHJldHVybiBub3JtYWxpemVkVHg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVScGNUcmFuc2FjdGlvbih0eDogUnBjVHJhbnNhY3Rpb24sIG5ldHdvcms6IE5ldHdvcmspOiBOb3JtYWxpemVkT2JqZWN0IHtcclxuICBjb25zdCBub3JtYWxpemVkVHg6IE5vcm1hbGl6ZWRPYmplY3QgPSB7XHJcbiAgICAuLi50eCxcclxuICAgIHZpbjogdHgudmluLm1hcCgodjogYW55KSA9PiB7XHJcbiAgICAgIGRlbGV0ZSB2LnNjcmlwdFNpZy5hc207XHJcbiAgICAgIHJldHVybiB2O1xyXG4gICAgfSksXHJcbiAgICB2b3V0OiB0eC52b3V0Lm1hcCgodjogYW55KSA9PiB7XHJcbiAgICAgIGlmICh2LnNjcmlwdFB1YktleS5hZGRyZXNzZXM/Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHYuc2NyaXB0UHViS2V5LmFkZHJlc3MgPSB2LnNjcmlwdFB1YktleS5hZGRyZXNzZXNbMF07XHJcbiAgICAgIH1cclxuICAgICAgZGVsZXRlIHYudHlwZTtcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LmFzbTtcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LmFkZHJlc3NlcztcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LnJlcVNpZ3M7XHJcbiAgICAgIGRlbGV0ZSB2LnNjcmlwdFB1YktleS50eXBlO1xyXG4gICAgICBkZWxldGUgdi52YWx1ZVNhdDtcclxuICAgICAgaWYgKGlzWmNhc2gobmV0d29yaykpIHtcclxuICAgICAgICBkZWxldGUgdi52YWx1ZVphdDtcclxuICAgICAgfVxyXG4gICAgICB2LnZhbHVlID0gZGVjaW1hbENvaW5zVG9TYXRzPGJpZ2ludD4odi52YWx1ZSwgJ2JpZ2ludCcpLnRvU3RyaW5nKCk7XHJcbiAgICAgIHJldHVybiB2O1xyXG4gICAgfSksXHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxyXG4gICAgICAvLyB0aGlzIGlzIHRoZSBub3JtYWxpemVkIGhhc2ggd2hpY2ggaXMgbm90IGltcGxlbWVudGVkIGluIHV0eG9saWJcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5oYXNoO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgLy8gdGhlc2UgZmxhZ3MgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gdXR4b2xpYlxyXG4gICAgICBkZWxldGUgbm9ybWFsaXplZFR4LmNoYWlubG9jaztcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5pbnN0YW50bG9jaztcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5pbnN0YW50bG9ja19pbnRlcm5hbDtcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5wcm9SZWdUeDtcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5wcm9VcFNlcnZUeDtcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5wcm9VcFJldlR4O1xyXG4gICAgICBkZWxldGUgbm9ybWFsaXplZFR4LnByb1VwUmVnVHg7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5hdXRoZGlnZXN0O1xyXG4gICAgICBkZWxldGUgbm9ybWFsaXplZFR4LnZhbHVlQmFsYW5jZVphdDtcclxuICB9XHJcblxyXG4gIHJldHVybiBub3JtYWxpemVkVHg7XHJcbn1cclxuIl19