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
        case networks_1.networks.bithereum:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.groestlcoin:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
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
        case networks_1.networks.bithereum:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.groestlcoin:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.zcash:
            delete normalizedTx.authdigest;
            delete normalizedTx.valueBalanceZat;
    }
    return normalizedTx;
}
exports.normalizeRpcTransaction = normalizeRpcTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGFyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvaW50ZWdyYXRpb25fbG9jYWxfcnBjL2NvbXBhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQTZDO0FBQzdDLGlEQUE0RTtBQUU1RSwwQ0FBaUQ7QUFNakQsU0FBUyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsT0FBNEI7SUFDcEUsUUFBUSxPQUFPLEVBQUU7UUFDZixLQUFLLG1CQUFRLENBQUMsT0FBTztZQUNuQixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDekMsTUFBTTtRQUNSLEtBQUssbUJBQVEsQ0FBQyxZQUFZO1lBQ3hCLE9BQU8sR0FBRyxFQUFFLEdBQUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUN6QyxNQUFNO1FBQ1IsS0FBSyxtQkFBUSxDQUFDLGtCQUFrQjtZQUM5QixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUMsTUFBTTtLQUNUO0lBQ0QsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQWtCLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQsU0FBZ0IsMEJBQTBCLENBQ3hDLEVBQTRCLEVBQzVCLFVBQW1CLEVBQUUsQ0FBQyxPQUFPO0lBRTdCLE1BQU0sWUFBWSxHQUFxQjtRQUNyQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRTtRQUNoQixPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU87UUFDbkIsR0FBRyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ2xDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUTtRQUNyQixJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtRQUNyQixHQUFHLEVBQUUsRUFBRSxD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QU8sWUFBWSxDQUFDLElBQUksQ0FBQztZQUN6QixNQUFNO1FBQ1IsS0FBSyxtQkFBUSxDQUFDLElBQUk7WUFDaEIsMkNBQTJDO1lBQzNDLE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQztZQUM5QixPQUFPLFlBQVksQ0FBQyxXQUFXLENBQUM7WUFDaEMsT0FBTyxZQUFZLENBQUMsb0JBQW9CLENBQUM7WUFDekMsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDO1lBQzdCLE9BQU8sWUFBWSxDQUFDLFdBQVcsQ0FBQztZQUNoQyxPQUFPLFlBQVksQ0FBQyxVQUFVLENBQUM7WUFDL0IsT0FBTyxZQUFZLENBQUMsVUFBVSxDQUFDO1lBQy9CLE1BQU07UUFDUixLQUFLLG1CQUFRLENBQUMsT0FBTyxDQUFDO1FBQ3RCLEtBQUssbUJBQVEsQ0FBQyxJQUFJLENBQUM7UUFDbkIsS0FBSyxtQkFBUSxDQUFDLElBQUksQ0FBQztRQUNuQixLQUFLLG1CQUFRLENBQUMsT0FBTyxDQUFDO1FBQ3RCLEtBQUssbUJBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdkIsS0FBSyxtQkFBUSxDQUFDLE1BQU0sQ0FBQztRQUNyQixLQUFLLG1CQUFRLENBQUMsT0FBTyxDQUFDO1FBQ3RCLEtBQUssbUJBQVEsQ0FBQyxVQUFVLENBQUM7UUFDekIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3JCLEtBQUssbUJBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdkIsS0FBSyxtQkFBUSxDQUFDLElBQUksQ0FBQztRQUNuQixLQUFLLG1CQUFRLENBQUMsS0FBSztZQUNqQixPQUFPLFlBQVksQ0FBQyxVQUFVLENBQUM7WUFDL0IsT0FBTyxZQUFZLENBQUMsZUFBZSxDQUFDO0tBQ3ZDO0lBRUQsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQTlFRCwwREE4RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhZGRyZXNzIGZyb20gJy4uLy4uL3NyYy9hZGRyZXNzJztcclxuaW1wb3J0IHsgTmV0d29yaywgZ2V0TWFpbm5ldCwgbmV0d29ya3MsIGlzWmNhc2ggfSBmcm9tICcuLi8uLi9zcmMvbmV0d29ya3MnO1xyXG5pbXBvcnQgeyBEYXNoVHJhbnNhY3Rpb24sIFV0eG9UcmFuc2FjdGlvbiwgWmNhc2hUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3NyYy9iaXRnbyc7XHJcbmltcG9ydCB7IGRlY2ltYWxDb2luc1RvU2F0cyB9IGZyb20gJy4uL3Rlc3R1dGlsJztcclxuXHJcbmltcG9ydCB7IFJwY1RyYW5zYWN0aW9uIH0gZnJvbSAnLi9nZW5lcmF0ZS9ScGNUeXBlcyc7XHJcblxyXG50eXBlIE5vcm1hbGl6ZWRPYmplY3QgPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuXHJcbmZ1bmN0aW9uIHRvUmVndGVzdEFkZHJlc3Moc2NyaXB0OiBCdWZmZXIsIG5ldHdvcms6IHsgYmVjaDMyPzogc3RyaW5nIH0pOiBzdHJpbmcge1xyXG4gIHN3aXRjaCAobmV0d29yaykge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy50ZXN0bmV0OlxyXG4gICAgICBuZXR3b3JrID0geyAuLi5uZXR3b3JrLCBiZWNoMzI6ICdiY3J0JyB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW5UZXN0OlxyXG4gICAgICBuZXR3b3JrID0geyAuLi5uZXR3b3JrLCBiZWNoMzI6ICdybHRjJyB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGRUZXN0bmV0OlxyXG4gICAgICBuZXR3b3JrID0geyAuLi5uZXR3b3JrLCBiZWNoMzI6ICdidGdydCcgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG4gIHJldHVybiBhZGRyZXNzLmZyb21PdXRwdXRTY3JpcHQoc2NyaXB0LCBuZXR3b3JrIGFzIE5ldHdvcmspO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUGFyc2VkVHJhbnNhY3Rpb248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHg6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICBuZXR3b3JrOiBOZXR3b3JrID0gdHgubmV0d29ya1xyXG4pOiBOb3JtYWxpemVkT2JqZWN0IHtcclxuICBjb25zdCBub3JtYWxpemVkVHg6IE5vcm1hbGl6ZWRPYmplY3QgPSB7XHJcbiAgICB0eGlkOiB0eC5nZXRJZCgpLFxyXG4gICAgdmVyc2lvbjogdHgudmVyc2lvbixcclxuICAgIGhleDogdHgudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JyksXHJcbiAgICBsb2NrdGltZTogdHgubG9ja3RpbWUsXHJcbiAgICBzaXplOiB0eC5ieXRlTGVuZ3RoKCksXHJcbiAgICB2aW46IHR4Lmlucy5tYXAoKGkpID0+IHtcclxuICAgICAgY29uc3Qgbm9ybWFsaXplZElucHV0OiBOb3JtYWxpemVkT2JqZWN0ID0ge1xyXG4gICAgICAgIHNjcmlwdFNpZzoge1xyXG4gICAgICAgICAgaGV4OiBpLnNjcmlwdC50b1N0cmluZygnaGV4JyksXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXF1ZW5jZTogaS5zZXF1ZW5jZSxcclxuICAgICAgICB0eGlkOiBCdWZmZXIuZnJvbShpLmhhc2gpLnJldmVyc2UoKS50b1N0cmluZygnaGV4JyksXHJcbiAgICAgICAgdm91dDogaS5pbmRleCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChpLndpdG5lc3MgJiYgaS53aXRuZXNzLmxlbmd0aCkge1xyXG4gICAgICAgIG5vcm1hbGl6ZWRJbnB1dC50eGlud2l0bmVzcyA9IGkud2l0bmVzcy5tYXAoKHcpID0+IHcudG9TdHJpbmcoJ2hleCcpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRJbnB1dDtcclxuICAgIH0pLFxyXG4gICAgdm91dDogdHgub3V0cy5tYXAoKG8sIG4pID0+IHtcclxuICAgICAgbGV0IGFkZHJlc3M7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYWRkcmVzcyA9IHRvUmVndGVzdEFkZHJlc3Moby5zY3JpcHQsIG5ldHdvcmsgYXMgeyBiZWNoMzI/OiBzdHJpbmcgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvLyBpZ25vcmVcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIG4sXHJcbiAgICAgICAgc2NyaXB0UHViS2V5OiB7XHJcbiAgICAgICAgICBoZXg6IG8uc2NyaXB0LnRvU3RyaW5nKCdoZXgnKSxcclxuICAgICAgICAgIC4uLihhZGRyZXNzICYmIHsgYWRkcmVzcyB9KSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHZhbHVlOiBvLnZhbHVlLnRvU3RyaW5nKCksXHJcbiAgICAgIH07XHJcbiAgICB9KSxcclxuICB9O1xyXG5cclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhcHRvcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5ncm9lc3RsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52c2l6ZSA9IHR4LnZpcnR1YWxTaXplKCk7XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC53ZWlnaHQgPSB0eC53ZWlnaHQoKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIGNvbnN0IGRhc2hUeCA9IHR4IGFzIHVua25vd24gYXMgRGFzaFRyYW5zYWN0aW9uO1xyXG4gICAgICBub3JtYWxpemVkVHgudHlwZSA9IGRhc2hUeC50eXBlO1xyXG4gICAgICBpZiAoZGFzaFR4LmV4dHJhUGF5bG9hZCAmJiBkYXNoVHguZXh0cmFQYXlsb2FkLmxlbmd0aCkge1xyXG4gICAgICAgIG5vcm1hbGl6ZWRUeC5leHRyYVBheWxvYWQgPSBkYXNoVHguZXh0cmFQYXlsb2FkLnRvU3RyaW5nKCdoZXgnKTtcclxuICAgICAgICBub3JtYWxpemVkVHguZXh0cmFQYXlsb2FkU2l6ZSA9IGRhc2hUeC5leHRyYVBheWxvYWQubGVuZ3RoO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgICAgbm9ybWFsaXplZFR4LnZzaXplID0gdHgudmlydHVhbFNpemUoKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgY29uc3QgemNhc2hUeCA9IHR4IGFzIHVua25vd24gYXMgWmNhc2hUcmFuc2FjdGlvbjtcclxuICAgICAgbm9ybWFsaXplZFR4Lm92ZXJ3aW50ZXJlZCA9ICEhemNhc2hUeC5vdmVyd2ludGVyZWQ7XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52ZXJzaW9uZ3JvdXBpZCA9IHpjYXNoVHgudmVyc2lvbkdyb3VwSWQudG9TdHJpbmcoMTYpO1xyXG4gICAgICBub3JtYWxpemVkVHguZXhwaXJ5aGVpZ2h0ID0gemNhc2hUeC5leHBpcnlIZWlnaHQ7XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52am9pbnNwbGl0ID0gW107XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52U2hpZWxkZWRPdXRwdXQgPSBbXTtcclxuICAgICAgbm9ybWFsaXplZFR4LnZTaGllbGRlZFNwZW5kID0gW107XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52YWx1ZUJhbGFuY2UgPSAwO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5vcm1hbGl6ZWRUeDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVJwY1RyYW5zYWN0aW9uKHR4OiBScGNUcmFuc2FjdGlvbiwgbmV0d29yazogTmV0d29yayk6IE5vcm1hbGl6ZWRPYmplY3Qge1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWRUeDogTm9ybWFsaXplZE9iamVjdCA9IHtcclxuICAgIC4uLnR4LFxyXG4gICAgdmluOiB0eC52aW4ubWFwKCh2OiBhbnkpID0+IHtcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0U2lnLmFzbTtcclxuICAgICAgcmV0dXJuIHY7XHJcbiAgICB9KSxcclxuICAgIHZvdXQ6IHR4LnZvdXQubWFwKCh2OiBhbnkpID0+IHtcclxuICAgICAgaWYgKHYuc2NyaXB0UHViS2V5LmFkZHJlc3Nlcz8ubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgdi5zY3JpcHRQdWJLZXkuYWRkcmVzcyA9IHYuc2NyaXB0UHViS2V5LmFkZHJlc3Nlc1swXTtcclxuICAgICAgfVxyXG4gICAgICBkZWxldGUgdi50eXBlO1xyXG4gICAgICBkZWxldGUgdi5zY3JpcHRQdWJLZXkuYXNtO1xyXG4gICAgICBkZWxldGUgdi5zY3JpcHRQdWJLZXkuYWRkcmVzc2VzO1xyXG4gICAgICBkZWxldGUgdi5zY3JpcHRQdWJLZXkucmVxU2lncztcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LnR5cGU7XHJcbiAgICAgIGRlbGV0ZSB2LnZhbHVlU2F0O1xyXG4gICAgICBpZiAoaXNaY2FzaChuZXR3b3JrKSkge1xyXG4gICAgICAgIGRlbGV0ZSB2LnZhbHVlWmF0O1xyXG4gICAgICB9XHJcbiAgICAgIHYudmFsdWUgPSBkZWNpbWFsQ29pbnNUb1NhdHM8YmlnaW50Pih2LnZhbHVlLCAnYmlnaW50JykudG9TdHJpbmcoKTtcclxuICAgICAgcmV0dXJuIHY7XHJcbiAgICB9KSxcclxuICB9O1xyXG5cclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbmVzaXM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXZlbmNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5heGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jbG9yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ3JvZXN0bGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgLy8gdGhpcyBpcyB0aGUgbm9ybWFsaXplZCBoYXNoIHdoaWNoIGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB1dHhvbGliXHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHguaGFzaDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIC8vIHRoZXNlIGZsYWdzIGFyZSBub3Qgc3VwcG9ydGVkIGluIHV0eG9saWJcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5jaGFpbmxvY2s7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHguaW5zdGFudGxvY2s7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHguaW5zdGFudGxvY2tfaW50ZXJuYWw7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgucHJvUmVnVHg7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgucHJvVXBTZXJ2VHg7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgucHJvVXBSZXZUeDtcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5wcm9VcFJlZ1R4O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICBkZWxldGUgbm9ybWFsaXplZFR4LmF1dGhkaWdlc3Q7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgudmFsdWVCYWxhbmNlWmF0O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5vcm1hbGl6ZWRUeDtcclxufVxyXG4iXX0=