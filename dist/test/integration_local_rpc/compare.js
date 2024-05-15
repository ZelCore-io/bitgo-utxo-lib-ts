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
        case networks_1.networks.hush:
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
        case networks_1.networks.hush:
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
        case networks_1.networks.zcash:
            delete normalizedTx.authdigest;
            delete normalizedTx.valueBalanceZat;
    }
    return normalizedTx;
}
exports.normalizeRpcTransaction = normalizeRpcTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGFyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvaW50ZWdyYXRpb25fbG9jYWxfcnBjL2NvbXBhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQTZDO0FBQzdDLGlEQUE0RTtBQUU1RSwwQ0FBaUQ7QUFNakQsU0FBUyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsT0FBNEI7SUFDcEUsUUFBUSxPQUFPLEVBQUU7UUFDZixLQUFLLG1CQUFRLENBQUMsT0FBTztZQUNuQixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDekMsTUFBTTtRQUNSLEtBQUssbUJBQVEsQ0FBQyxZQUFZO1lBQ3hCLE9BQU8sR0FBRyxFQUFFLEdBQUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUN6QyxNQUFNO1FBQ1IsS0FBSyxtQkFBUSxDQUFDLGtCQUFrQjtZQUM5QixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUMsTUFBTTtLQUNUO0lBQ0QsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQWtCLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQsU0FBZ0IsMEJBQTBCLENBQ3hDLEVBQTRCLEVBQzVCLFVBQW1CLEVBQUUsQ0FBQyxPQUFPO0lBRTdCLE1BQU0sWUFBWSxHQUFxQjtRQUNyQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRTtRQUNoQixPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU87UUFDbkIsR0FBRyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ2xDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUTtRQUNyQixJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtRQUNyQixHQUFHLEVBQUUsRUFBRSxD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TTtRQUNSLEtBQUssbUJBQVEsQ0FBQyxJQUFJO1lBQ2hCLDJDQUEyQztZQUMzQyxPQUFPLFlBQVksQ0FBQyxTQUFTLENBQUM7WUFDOUIsT0FBTyxZQUFZLENBQUMsV0FBVyxDQUFDO1lBQ2hDLE9BQU8sWUFBWSxDQUFDLG9CQUFvQixDQUFDO1lBQ3pDLE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztZQUM3QixPQUFPLFlBQVksQ0FBQyxXQUFXLENBQUM7WUFDaEMsT0FBTyxZQUFZLENBQUMsVUFBVSxDQUFDO1lBQy9CLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBQztZQUMvQixNQUFNO1FBQ1IsS0FBSyxtQkFBUSxDQUFDLE9BQU8sQ0FBQztRQUN0QixLQUFLLG1CQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssbUJBQVEsQ0FBQyxJQUFJLENBQUM7UUFDbkIsS0FBSyxtQkFBUSxDQUFDLE9BQU8sQ0FBQztRQUN0QixLQUFLLG1CQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLEtBQUssbUJBQVEsQ0FBQyxNQUFNLENBQUM7UUFDckIsS0FBSyxtQkFBUSxDQUFDLE9BQU8sQ0FBQztRQUN0QixLQUFLLG1CQUFRLENBQUMsVUFBVSxDQUFDO1FBQ3pCLEtBQUssbUJBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdkIsS0FBSyxtQkFBUSxDQUFDLE1BQU0sQ0FBQztRQUNyQixLQUFLLG1CQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLEtBQUssbUJBQVEsQ0FBQyxLQUFLO1lBQ2pCLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBQztZQUMvQixPQUFPLFlBQVksQ0FBQyxlQUFlLENBQUM7S0FDdkM7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBN0VELDBEQTZFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFkZHJlc3MgZnJvbSAnLi4vLi4vc3JjL2FkZHJlc3MnO1xyXG5pbXBvcnQgeyBOZXR3b3JrLCBnZXRNYWlubmV0LCBuZXR3b3JrcywgaXNaY2FzaCB9IGZyb20gJy4uLy4uL3NyYy9uZXR3b3Jrcyc7XHJcbmltcG9ydCB7IERhc2hUcmFuc2FjdGlvbiwgVXR4b1RyYW5zYWN0aW9uLCBaY2FzaFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vc3JjL2JpdGdvJztcclxuaW1wb3J0IHsgZGVjaW1hbENvaW5zVG9TYXRzIH0gZnJvbSAnLi4vdGVzdHV0aWwnO1xyXG5cclxuaW1wb3J0IHsgUnBjVHJhbnNhY3Rpb24gfSBmcm9tICcuL2dlbmVyYXRlL1JwY1R5cGVzJztcclxuXHJcbnR5cGUgTm9ybWFsaXplZE9iamVjdCA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG5cclxuZnVuY3Rpb24gdG9SZWd0ZXN0QWRkcmVzcyhzY3JpcHQ6IEJ1ZmZlciwgbmV0d29yazogeyBiZWNoMzI/OiBzdHJpbmcgfSk6IHN0cmluZyB7XHJcbiAgc3dpdGNoIChuZXR3b3JrKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnRlc3RuZXQ6XHJcbiAgICAgIG5ldHdvcmsgPSB7IC4uLm5ldHdvcmssIGJlY2gzMjogJ2JjcnQnIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pblRlc3Q6XHJcbiAgICAgIG5ldHdvcmsgPSB7IC4uLm5ldHdvcmssIGJlY2gzMjogJ3JsdGMnIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZFRlc3RuZXQ6XHJcbiAgICAgIG5ldHdvcmsgPSB7IC4uLm5ldHdvcmssIGJlY2gzMjogJ2J0Z3J0JyB9O1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbiAgcmV0dXJuIGFkZHJlc3MuZnJvbU91dHB1dFNjcmlwdChzY3JpcHQsIG5ldHdvcmsgYXMgTmV0d29yayk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQYXJzZWRUcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB0eDogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gIG5ldHdvcms6IE5ldHdvcmsgPSB0eC5uZXR3b3JrXHJcbik6IE5vcm1hbGl6ZWRPYmplY3Qge1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWRUeDogTm9ybWFsaXplZE9iamVjdCA9IHtcclxuICAgIHR4aWQ6IHR4LmdldElkKCksXHJcbiAgICB2ZXJzaW9uOiB0eC52ZXJzaW9uLFxyXG4gICAgaGV4OiB0eC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSxcclxuICAgIGxvY2t0aW1lOiB0eC5sb2NrdGltZSxcclxuICAgIHNpemU6IHR4LmJ5dGVMZW5ndGgoKSxcclxuICAgIHZpbjogdHguaW5zLm1hcCgoaSkgPT4ge1xyXG4gICAgICBjb25zdCBub3JtYWxpemVkSW5wdXQ6IE5vcm1hbGl6ZWRPYmplY3QgPSB7XHJcbiAgICAgICAgc2NyaXB0U2lnOiB7XHJcbiAgICAgICAgICBoZXg6IGkuc2NyaXB0LnRvU3RyaW5nKCdoZXgnKSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlcXVlbmNlOiBpLnNlcXVlbmNlLFxyXG4gICAgICAgIHR4aWQ6IEJ1ZmZlci5mcm9tKGkuaGFzaCkucmV2ZXJzZSgpLnRvU3RyaW5nKCdoZXgnKSxcclxuICAgICAgICB2b3V0OiBpLmluZGV4LFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKGkud2l0bmVzcyAmJiBpLndpdG5lc3MubGVuZ3RoKSB7XHJcbiAgICAgICAgbm9ybWFsaXplZElucHV0LnR4aW53aXRuZXNzID0gaS53aXRuZXNzLm1hcCgodykgPT4gdy50b1N0cmluZygnaGV4JykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xyXG4gICAgfSksXHJcbiAgICB2b3V0OiB0eC5vdXRzLm1hcCgobywgbikgPT4ge1xyXG4gICAgICBsZXQgYWRkcmVzcztcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhZGRyZXNzID0gdG9SZWd0ZXN0QWRkcmVzcyhvLnNjcmlwdCwgbmV0d29yayBhcyB7IGJlY2gzMj86IHN0cmluZyB9KTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vIGlnbm9yZVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbixcclxuICAgICAgICBzY3JpcHRQdWJLZXk6IHtcclxuICAgICAgICAgIGhleDogby5zY3JpcHQudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICAgICAgLi4uKGFkZHJlc3MgJiYgeyBhZGRyZXNzIH0pLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdmFsdWU6IG8udmFsdWUudG9TdHJpbmcoKSxcclxuICAgICAgfTtcclxuICAgIH0pLFxyXG4gIH07XHJcblxyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxyXG4gICAgICBub3JtYWxpemVkVHgudnNpemUgPSB0eC52aXJ0dWFsU2l6ZSgpO1xyXG4gICAgICBub3JtYWxpemVkVHgud2VpZ2h0ID0gdHgud2VpZ2h0KCk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICBjb25zdCBkYXNoVHggPSB0eCBhcyB1bmtub3duIGFzIERhc2hUcmFuc2FjdGlvbjtcclxuICAgICAgbm9ybWFsaXplZFR4LnR5cGUgPSBkYXNoVHgudHlwZTtcclxuICAgICAgaWYgKGRhc2hUeC5leHRyYVBheWxvYWQgJiYgZGFzaFR4LmV4dHJhUGF5bG9hZC5sZW5ndGgpIHtcclxuICAgICAgICBub3JtYWxpemVkVHguZXh0cmFQYXlsb2FkID0gZGFzaFR4LmV4dHJhUGF5bG9hZC50b1N0cmluZygnaGV4Jyk7XHJcbiAgICAgICAgbm9ybWFsaXplZFR4LmV4dHJhUGF5bG9hZFNpemUgPSBkYXNoVHguZXh0cmFQYXlsb2FkLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52c2l6ZSA9IHR4LnZpcnR1YWxTaXplKCk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIGNvbnN0IHpjYXNoVHggPSB0eCBhcyB1bmtub3duIGFzIFpjYXNoVHJhbnNhY3Rpb247XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC5vdmVyd2ludGVyZWQgPSAhIXpjYXNoVHgub3ZlcndpbnRlcmVkO1xyXG4gICAgICBub3JtYWxpemVkVHgudmVyc2lvbmdyb3VwaWQgPSB6Y2FzaFR4LnZlcnNpb25Hcm91cElkLnRvU3RyaW5nKDE2KTtcclxuICAgICAgbm9ybWFsaXplZFR4LmV4cGlyeWhlaWdodCA9IHpjYXNoVHguZXhwaXJ5SGVpZ2h0O1xyXG4gICAgICBub3JtYWxpemVkVHgudmpvaW5zcGxpdCA9IFtdO1xyXG4gICAgICBub3JtYWxpemVkVHgudlNoaWVsZGVkT3V0cHV0ID0gW107XHJcbiAgICAgIG5vcm1hbGl6ZWRUeC52U2hpZWxkZWRTcGVuZCA9IFtdO1xyXG4gICAgICBub3JtYWxpemVkVHgudmFsdWVCYWxhbmNlID0gMDtcclxuICB9XHJcblxyXG4gIHJldHVybiBub3JtYWxpemVkVHg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVScGNUcmFuc2FjdGlvbih0eDogUnBjVHJhbnNhY3Rpb24sIG5ldHdvcms6IE5ldHdvcmspOiBOb3JtYWxpemVkT2JqZWN0IHtcclxuICBjb25zdCBub3JtYWxpemVkVHg6IE5vcm1hbGl6ZWRPYmplY3QgPSB7XHJcbiAgICAuLi50eCxcclxuICAgIHZpbjogdHgudmluLm1hcCgodjogYW55KSA9PiB7XHJcbiAgICAgIGRlbGV0ZSB2LnNjcmlwdFNpZy5hc207XHJcbiAgICAgIHJldHVybiB2O1xyXG4gICAgfSksXHJcbiAgICB2b3V0OiB0eC52b3V0Lm1hcCgodjogYW55KSA9PiB7XHJcbiAgICAgIGlmICh2LnNjcmlwdFB1YktleS5hZGRyZXNzZXM/Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHYuc2NyaXB0UHViS2V5LmFkZHJlc3MgPSB2LnNjcmlwdFB1YktleS5hZGRyZXNzZXNbMF07XHJcbiAgICAgIH1cclxuICAgICAgZGVsZXRlIHYudHlwZTtcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LmFzbTtcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LmFkZHJlc3NlcztcclxuICAgICAgZGVsZXRlIHYuc2NyaXB0UHViS2V5LnJlcVNpZ3M7XHJcbiAgICAgIGRlbGV0ZSB2LnNjcmlwdFB1YktleS50eXBlO1xyXG4gICAgICBkZWxldGUgdi52YWx1ZVNhdDtcclxuICAgICAgaWYgKGlzWmNhc2gobmV0d29yaykpIHtcclxuICAgICAgICBkZWxldGUgdi52YWx1ZVphdDtcclxuICAgICAgfVxyXG4gICAgICB2LnZhbHVlID0gZGVjaW1hbENvaW5zVG9TYXRzPGJpZ2ludD4odi52YWx1ZSwgJ2JpZ2ludCcpLnRvU3RyaW5nKCk7XHJcbiAgICAgIHJldHVybiB2O1xyXG4gICAgfSksXHJcbiAgfTtcclxuXHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgLy8gdGhpcyBpcyB0aGUgbm9ybWFsaXplZCBoYXNoIHdoaWNoIGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB1dHhvbGliXHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHguaGFzaDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIC8vIHRoZXNlIGZsYWdzIGFyZSBub3Qgc3VwcG9ydGVkIGluIHV0eG9saWJcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5jaGFpbmxvY2s7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHguaW5zdGFudGxvY2s7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHguaW5zdGFudGxvY2tfaW50ZXJuYWw7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgucHJvUmVnVHg7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgucHJvVXBTZXJ2VHg7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgucHJvVXBSZXZUeDtcclxuICAgICAgZGVsZXRlIG5vcm1hbGl6ZWRUeC5wcm9VcFJlZ1R4O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICBkZWxldGUgbm9ybWFsaXplZFR4LmF1dGhkaWdlc3Q7XHJcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkVHgudmFsdWVCYWxhbmNlWmF0O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5vcm1hbGl6ZWRUeDtcclxufVxyXG4iXX0=