"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mocha_1 = require("mocha");
const networks_1 = require("../../src/networks");
const fixtures_1 = require("./fixtures");
const transaction_util_1 = require("../transaction_util");
const UtxoTransaction_1 = require("../../src/bitgo/UtxoTransaction");
const ZcashTransaction_1 = require("../../src/bitgo/zcash/ZcashTransaction");
(0, mocha_1.describe)('Third-Party Fixtures', function () {
    (0, networks_1.getNetworkList)()
        .filter(networks_1.isMainnet)
        .forEach((network) => {
        (0, mocha_1.describe)(`parse ${(0, networks_1.getNetworkName)(network)}`, function () {
            function runCheckHashForSignature(v, i) {
                var _a;
                const [rawTransaction, script, inputIndex, hashType, ...rest] = v;
                const buffer = Buffer.from(rawTransaction, 'hex');
                let transaction, signatureHash;
                if ((0, networks_1.isZcash)(network)) {
                    [, /* branchId ,*/ signatureHash] = rest;
                    transaction = ZcashTransaction_1.ZcashTransaction.fromBuffer(buffer, false, 'number', network);
                }
                else if ((0, networks_1.isDogecoin)(network)) {
                    [signatureHash] = rest;
                    transaction = (0, transaction_util_1.parseTransactionRoundTrip)(buffer, network, {
                        amountType: 'bigint',
                    });
                }
                else {
                    [signatureHash] = rest;
                    transaction = (0, transaction_util_1.parseTransactionRoundTrip)(buffer, network);
                }
                const usesForkId = (hashType & UtxoTransaction_1.UtxoTransaction.SIGHASH_FORKID) > 0;
                if ((0, networks_1.isBitcoinGold)(network) && usesForkId) {
                    // Bitcoin Gold does not test transactions where FORKID is set 🤷
                    // https://github.com/BTCGPU/BTCGPU/blob/163928af05/src/test/sighash_tests.cpp#L194-L195
                    return;
                }
                const isSegwit = ((_a = transaction.ins[inputIndex].witness) === null || _a === void 0 ? void 0 : _a.length) > 0;
                let hash;
                if (isSegwit) {
                    const amount = (0, networks_1.isDogecoin)(network) ? BigInt(0) : 0;
                    hash = transaction.hashForWitnessV0(inputIndex, Buffer.from(script, 'hex'), amount, hashType);
                }
                else {
                    transaction.ins[inputIndex].value = 0;
                    hash = transaction.hashForSignature(inputIndex, Buffer.from(script, 'hex'), hashType);
                }
                const refSignatureHash = Buffer.from(signatureHash, 'hex').reverse();
                assert.strict(refSignatureHash.equals(hash));
            }
            (0, fixtures_1.testFixtureArray)(this, network, fixtures_1.sigHashTestFile, function (vectors) {
                const zcashSubset = [48, 111, 114, 152, 157, 237, 241, 250, 280, 392, 461];
                vectors.forEach((v, i) => {
                    if ((0, networks_1.isZcash)(network) && !zcashSubset.includes(i)) {
                        return;
                    }
                    runCheckHashForSignature(v, i);
                });
            });
            (0, fixtures_1.testFixtureArray)(this, network, fixtures_1.txValidTestFile, function (vectors) {
                vectors.forEach((v, i) => {
                    const [, /* inputs , */ txHex] = v;
                    if ((0, networks_1.isDogecoin)(network)) {
                        (0, transaction_util_1.parseTransactionRoundTrip)(Buffer.from(txHex, 'hex'), network, {
                            amountType: 'bigint',
                        });
                    }
                    else {
                        (0, transaction_util_1.parseTransactionRoundTrip)(Buffer.from(txHex, 'hex'), network);
                    }
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2ZpeHR1cmVzX3RoaXJkcGFydHkvcGFyc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFDakMsaUNBQWlDO0FBQ2pDLGlEQUFtSDtBQUNuSCx5Q0FPb0I7QUFFcEIsMERBQWdFO0FBQ2hFLHFFQUFrRTtBQUNsRSw2RUFBd0Y7QUFFeEYsSUFBQSxnQkFBUSxFQUFDLHNCQUFzQixFQUFFO0lBQy9CLElBQUEseUJBQWMsR0FBRTtTQUNiLE1BQU0sQ0FBQyxvQkFBUyxDQUFDO1NBQ2pCLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQ25CLElBQUEsZ0JBQVEsRUFBQyxTQUFTLElBQUEseUJBQWMsRUFBQyxPQUFPLENBQUMsRUFBRSxFQUFFO1lBQzNDLFNBQVMsd0JBQXdCLENBQUMsQ0FBNkMsRUFBRSxDQUFTOztnQkFDeEYsTUFBTSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xELElBQUksV0FBVyxFQUFFLGFBQWEsQ0FBQztnQkFDL0IsSUFBSSxJQUFBLGtCQUFPLEVBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3BCLENBQUMsRUFBRSxlQUFlLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBd0IsQ0FBQztvQkFDN0QsV0FBVyxHQUFHLG1DQUFnQixDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUF1QixDQUFDLENBQUM7aUJBQzdGO3FCQUFNLElBQUksSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUM5QixDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQWdCLENBQUM7b0JBQ25D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QUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sRUFBRTs0QkFDN0YsVUFBVSxFQUFFLFFBQVE7eUJBQ3JCLENBQUMsQ0FBQztxQkFDSjt5QkFBTTt3QkFDTCxJQUFBLDRDQUF5QixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO3FCQUMvRDtnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCB7IGRlc2NyaWJlIH0gZnJvbSAnbW9jaGEnO1xyXG5pbXBvcnQgeyBnZXROZXR3b3JrTGlzdCwgZ2V0TmV0d29ya05hbWUsIGlzQml0Y29pbkdvbGQsIGlzTWFpbm5ldCwgaXNaY2FzaCwgaXNEb2dlY29pbiB9IGZyb20gJy4uLy4uL3NyYy9uZXR3b3Jrcyc7XHJcbmltcG9ydCB7XHJcbiAgc2lnSGFzaFRlc3RGaWxlLFxyXG4gIFNpZ0hhc2hUZXN0VmVjdG9yLFxyXG4gIHRlc3RGaXh0dXJlQXJyYXksXHJcbiAgdHhWYWxpZFRlc3RGaWxlLFxyXG4gIFR4VmFsaWRWZWN0b3IsXHJcbiAgWmNhc2hTaWdIYXNoVGVzdFZlY3RvcixcclxufSBmcm9tICcuL2ZpeHR1cmVzJztcclxuXHJcbmltcG9ydCB7IHBhcnNlVHJhbnNhY3Rpb25Sb3VuZFRyaXAgfSBmcm9tICcuLi90cmFuc2FjdGlvbl91dGlsJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vc3JjL2JpdGdvL1V0eG9UcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IFpjYXNoTmV0d29yaywgWmNhc2hUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3NyYy9iaXRnby96Y2FzaC9aY2FzaFRyYW5zYWN0aW9uJztcclxuXHJcbmRlc2NyaWJlKCdUaGlyZC1QYXJ0eSBGaXh0dXJlcycsIGZ1bmN0aW9uICgpIHtcclxuICBnZXROZXR3b3JrTGlzdCgpXHJcbiAgICAuZmlsdGVyKGlzTWFpbm5ldClcclxuICAgIC5mb3JFYWNoKChuZXR3b3JrKSA9PiB7XHJcbiAgICAgIGRlc2NyaWJlKGBwYXJzZSAke2dldE5ldHdvcmtOYW1lKG5ldHdvcmspfWAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmdW5jdGlvbiBydW5DaGVja0hhc2hGb3JTaWduYXR1cmUodjogU2lnSGFzaFRlc3RWZWN0b3IgfCBaY2FzaFNpZ0hhc2hUZXN0VmVjdG9yLCBpOiBudW1iZXIpIHtcclxuICAgICAgICAgIGNvbnN0IFtyYXdUcmFuc2FjdGlvbiwgc2NyaXB0LCBpbnB1dEluZGV4LCBoYXNoVHlwZSwgLi4ucmVzdF0gPSB2O1xyXG4gICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20ocmF3VHJhbnNhY3Rpb24sICdoZXgnKTtcclxuICAgICAgICAgIGxldCB0cmFuc2FjdGlvbiwgc2lnbmF0dXJlSGFzaDtcclxuICAgICAgICAgIGlmIChpc1pjYXNoKG5ldHdvcmspKSB7XHJcbiAgICAgICAgICAgIFssIC8qIGJyYW5jaElkICwqLyBzaWduYXR1cmVIYXNoXSA9IHJlc3QgYXMgW251bWJlciwgc3RyaW5nXTtcclxuICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSBaY2FzaFRyYW5zYWN0aW9uLmZyb21CdWZmZXIoYnVmZmVyLCBmYWxzZSwgJ251bWJlcicsIG5ldHdvcmsgYXMgWmNhc2hOZXR3b3JrKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoaXNEb2dlY29pbihuZXR3b3JrKSkge1xyXG4gICAgICAgICAgICBbc2lnbmF0dXJlSGFzaF0gPSByZXN0IGFzIFtzdHJpbmddO1xyXG4gICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHBhcnNlVHJhbnNhY3Rpb25Sb3VuZFRyaXA8YmlnaW50LCBVdHhvVHJhbnNhY3Rpb248YmlnaW50Pj4oYnVmZmVyLCBuZXR3b3JrLCB7XHJcbiAgICAgICAgICAgICAgYW1vdW50VHlwZTogJ2JpZ2ludCcsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgW3NpZ25hdHVyZUhhc2hdID0gcmVzdCBhcyBbc3RyaW5nXTtcclxuICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSBwYXJzZVRyYW5zYWN0aW9uUm91bmRUcmlwKGJ1ZmZlciwgbmV0d29yayk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCB1c2VzRm9ya0lkID0gKGhhc2hUeXBlICYgVXR4b1RyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEKSA+IDA7XHJcbiAgICAgICAgICBpZiAoaXNCaXRjb2luR29sZChuZXR3b3JrKSAmJiB1c2VzRm9ya0lkKSB7XHJcbiAgICAgICAgICAgIC8vIEJpdGNvaW4gR29sZCBkb2VzIG5vdCB0ZXN0IHRyYW5zYWN0aW9ucyB3aGVyZSBGT1JLSUQgaXMgc2V0IPCfpLdcclxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi8xNjM5MjhhZjA1L3NyYy90ZXN0L3NpZ2hhc2hfdGVzdHMuY3BwI0wxOTQtTDE5NVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgaXNTZWd3aXQgPSB0cmFuc2FjdGlvbi5pbnNbaW5wdXRJbmRleF0ud2l0bmVzcz8ubGVuZ3RoID4gMDtcclxuICAgICAgICAgIGxldCBoYXNoO1xyXG4gICAgICAgICAgaWYgKGlzU2Vnd2l0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IGlzRG9nZWNvaW4obmV0d29yaykgPyBCaWdJbnQoMCkgOiAwO1xyXG4gICAgICAgICAgICBoYXNoID0gdHJhbnNhY3Rpb24uaGFzaEZvcldpdG5lc3NWMChpbnB1dEluZGV4LCBCdWZmZXIuZnJvbShzY3JpcHQsICdoZXgnKSwgYW1vdW50LCBoYXNoVHlwZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAodHJhbnNhY3Rpb24uaW5zW2lucHV0SW5kZXhdIGFzIGFueSkudmFsdWUgPSAwO1xyXG4gICAgICAgICAgICBoYXNoID0gdHJhbnNhY3Rpb24uaGFzaEZvclNpZ25hdHVyZShpbnB1dEluZGV4LCBCdWZmZXIuZnJvbShzY3JpcHQsICdoZXgnKSwgaGFzaFR5cGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgcmVmU2lnbmF0dXJlSGFzaCA9IEJ1ZmZlci5mcm9tKHNpZ25hdHVyZUhhc2gsICdoZXgnKS5yZXZlcnNlKCk7XHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0KHJlZlNpZ25hdHVyZUhhc2guZXF1YWxzKGhhc2gpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRlc3RGaXh0dXJlQXJyYXkodGhpcywgbmV0d29yaywgc2lnSGFzaFRlc3RGaWxlLCBmdW5jdGlvbiAodmVjdG9yczogU2lnSGFzaFRlc3RWZWN0b3JbXSkge1xyXG4gICAgICAgICAgY29uc3QgemNhc2hTdWJzZXQgPSBbNDgsIDExMSwgMTE0LCAxNTIsIDE1NywgMjM3LCAyNDEsIDI1MCwgMjgwLCAzOTIsIDQ2MV07XHJcbiAgICAgICAgICB2ZWN0b3JzLmZvckVhY2goKHYsIGkpID0+IHtcclxuICAgICAgICAgICAgaWYgKGlzWmNhc2gobmV0d29yaykgJiYgIXpjYXNoU3Vic2V0LmluY2x1ZGVzKGkpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJ1bkNoZWNrSGFzaEZvclNpZ25hdHVyZSh2LCBpKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0ZXN0Rml4dHVyZUFycmF5KHRoaXMsIG5ldHdvcmssIHR4VmFsaWRUZXN0RmlsZSwgZnVuY3Rpb24gKHZlY3RvcnM6IFR4VmFsaWRWZWN0b3JbXSkge1xyXG4gICAgICAgICAgdmVjdG9ycy5mb3JFYWNoKCh2OiBUeFZhbGlkVmVjdG9yLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IFssIC8qIGlucHV0cyAsICovIHR4SGV4XSA9IHY7XHJcbiAgICAgICAgICAgIGlmIChpc0RvZ2Vjb2luKG5ldHdvcmspKSB7XHJcbiAgICAgICAgICAgICAgcGFyc2VUcmFuc2FjdGlvblJvdW5kVHJpcDxiaWdpbnQsIFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+PihCdWZmZXIuZnJvbSh0eEhleCwgJ2hleCcpLCBuZXR3b3JrLCB7XHJcbiAgICAgICAgICAgICAgICBhbW91bnRUeXBlOiAnYmlnaW50JyxcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBwYXJzZVRyYW5zYWN0aW9uUm91bmRUcmlwKEJ1ZmZlci5mcm9tKHR4SGV4LCAnaGV4JyksIG5ldHdvcmspO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcbiJdfQ==