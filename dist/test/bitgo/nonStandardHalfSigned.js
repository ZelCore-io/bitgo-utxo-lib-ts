"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const assert = require("assert");
const src_1 = require("../../src");
const bitgo_1 = require("../../src/bitgo");
const outputScripts_1 = require("../../src/bitgo/outputScripts");
const testutil_1 = require("../../src/testutil");
const transaction_util_1 = require("../transaction_util");
const fixtures_1 = require("../integration_local_rpc/generate/fixtures");
const nonStandardHalfSigned_1 = require("../../src/bitgo/nonStandardHalfSigned");
async function getFixture(network, name) {
    const p = path.join(__dirname, 'fixtures', 'nonStandardHalfSigned', (0, src_1.getNetworkName)(network), name);
    return JSON.parse(await fs.readFile(p, 'utf-8'));
}
function runTest(scriptType, amountType) {
    const network = src_1.networks.bitcoin;
    describe(`createTransactionFromNonStandardHalfSigned ${scriptType} ${amountType}`, function () {
        if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
            return; // TODO: enable p2tr tests when signing is supported
        }
        fixtures_1.fixtureKeys.forEach((signKey, pubkeyIndex) => {
            it(`parses non-standard half signed transaction pubkeyIndex=${pubkeyIndex}`, async function () {
                const standardHalfSigned = (0, transaction_util_1.getHalfSignedTransaction2Of3)(fixtures_1.fixtureKeys, signKey, (0, testutil_1.getDefaultCosigner)(fixtures_1.fixtureKeys, signKey), scriptType, network, { amountType });
                // Fixtures can only be constructed using utxolib < 1.10
                const nonStandardHalfSigned = (0, bitgo_1.createTransactionFromBuffer)(Buffer.from(await getFixture(network, `nonStandardHalfSigned-${scriptType}-${pubkeyIndex}.json`), 'hex'), network, { amountType });
                // The nonstandard transaction input is missing two `OP_0`
                assert.strictEqual(nonStandardHalfSigned.toBuffer().length, standardHalfSigned.toBuffer().length - 2);
                nonStandardHalfSigned.ins.forEach((input) => (0, nonStandardHalfSigned_1.padInputScript)(input, pubkeyIndex));
                assert.strictEqual(nonStandardHalfSigned.toBuffer().length, standardHalfSigned.toBuffer().length);
                assert.strictEqual(nonStandardHalfSigned.toBuffer().toString('hex'), standardHalfSigned.toBuffer().toString('hex'));
            });
        });
    });
}
describe('Non-Standard Half-Signed Transactions', function () {
    outputScripts_1.scriptTypes2Of3.forEach((scriptType) => runTest(scriptType, 'number'));
    outputScripts_1.scriptTypes2Of3.forEach((scriptType) => runTest(scriptType, 'bigint'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uU3RhbmRhcmRIYWxmU2lnbmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9iaXRnby9ub25TdGFuZGFyZEhhbGZTaWduZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNkI7QUFDN0IsK0JBQStCO0FBQy9CLGlDQUFpQztBQUVqQyxtQ0FBOEQ7QUFDOUQsMkNBQThEO0FBQzlELGlFQUFnRjtBQUNoRixpREFBd0Q7QUFFeEQsMERBQW1FO0FBQ25FLHlFQUF5RTtBQUN6RSxpRkFBdUU7QUFFdkUsS0FBSyxVQUFVLFVBQVUsQ0FBSSxPQUFnQixFQUFFLElBQVk7SUFDekQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFFLElBQUEsb0JBQWMsRUFBQyxPQUFPLENBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3RyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBa0MsVUFBMEIsRUFBRSxVQUErQjtJQUMzRyxNQUFNLE9BQU8sR0FBRyxjQUFRLENBQUMsT0FBTyxDQUFDO0lBRWpDLFFBQVEsQ0FBQyw4Q0FBOEMsVUFBVSxJQUFJLFVBQVUsRUFBRSxFQUFFO1FBQ2pGLElBQUksVUFBVSxLQUFLLE1BQU0sSUFBSSxVQUFVLEtBQUssWUFBWSxFQUFFO1lBQ3hELE9BQU8sQ0FBQyxvREFBb0Q7U0FDN0Q7UUFDRCxzQkFBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsRUFBRTtZQUMzQyxFQUFFLENBQUMsMkRBQTJELFdBQVcsRUFBRSxFQUFFLEtBQUs7Z0JBQ2hGLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSwrQ0FBNEIsRUFDckQsc0JBQVcsRUFDWCxPQUFPLEVBQ1AsSUFBQSw2QkFBa0IsRUFBQyxzQkFBVyxFQUFFLE9BQU8sQ0FBQyxFQUN4QyxVQUFVLEVBQ1YsT0FBTyxFQUNQLEVBQUUsVUFBVSxFQUFFLENBQ2YsQ0FBQztnQkFFRix3REFBd0Q7Z0JBQ3hELE1BQU0scUJBQXFCLEdBQUcsSUFBQSxtQ0FBMkIsRUFDdkQsTUFBTSxDQUFDLElBQUksQ0FDVCxNQUFNLFVBQVUsQ0FBUyxPQUFPLEVBQUUseUJBQXlCLFVBQVUsSUFBSSxXQUFXLE9BQU8sQ0FBQyxFQUM1RixLQUFLLENBQ04sRUFDRCxPQUFPLEVBQ1AsRUFBRSxVQUFVLEVBQUUsQ0FDZixDQUFDO2dCQUVGLDBEQUEwRDtnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUV0RyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFBLHNDQUFjLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRWpGLE1BQU0sQ0FBQyxXQUFXLENBQUMscUJBQXFCLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsRyxNQUFNLENBQUMsV0FBVyxDQUNoQixxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQ2hELGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FDOUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxRQUFRLENBQUMsdUNBQXVDLEVBQUU7SUFDaEQsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBUyxVQUE0QixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDakcsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBUyxVQUE0QixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDbkcsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5cclxuaW1wb3J0IHsgbmV0d29ya3MsIE5ldHdvcmssIGdldE5ldHdvcmtOYW1lIH0gZnJvbSAnLi4vLi4vc3JjJztcclxuaW1wb3J0IHsgY3JlYXRlVHJhbnNhY3Rpb25Gcm9tQnVmZmVyIH0gZnJvbSAnLi4vLi4vc3JjL2JpdGdvJztcclxuaW1wb3J0IHsgU2NyaXB0VHlwZTJPZjMsIHNjcmlwdFR5cGVzMk9mMyB9IGZyb20gJy4uLy4uL3NyYy9iaXRnby9vdXRwdXRTY3JpcHRzJztcclxuaW1wb3J0IHsgZ2V0RGVmYXVsdENvc2lnbmVyIH0gZnJvbSAnLi4vLi4vc3JjL3Rlc3R1dGlsJztcclxuXHJcbmltcG9ydCB7IGdldEhhbGZTaWduZWRUcmFuc2FjdGlvbjJPZjMgfSBmcm9tICcuLi90cmFuc2FjdGlvbl91dGlsJztcclxuaW1wb3J0IHsgZml4dHVyZUtleXMgfSBmcm9tICcuLi9pbnRlZ3JhdGlvbl9sb2NhbF9ycGMvZ2VuZXJhdGUvZml4dHVyZXMnO1xyXG5pbXBvcnQgeyBwYWRJbnB1dFNjcmlwdCB9IGZyb20gJy4uLy4uL3NyYy9iaXRnby9ub25TdGFuZGFyZEhhbGZTaWduZWQnO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0Rml4dHVyZTxUPihuZXR3b3JrOiBOZXR3b3JrLCBuYW1lOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcclxuICBjb25zdCBwID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJywgJ25vblN0YW5kYXJkSGFsZlNpZ25lZCcsIGdldE5ldHdvcmtOYW1lKG5ldHdvcmspIGFzIHN0cmluZywgbmFtZSk7XHJcbiAgcmV0dXJuIEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUocCwgJ3V0Zi04JykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5UZXN0PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KHNjcmlwdFR5cGU6IFNjcmlwdFR5cGUyT2YzLCBhbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnKSB7XHJcbiAgY29uc3QgbmV0d29yayA9IG5ldHdvcmtzLmJpdGNvaW47XHJcblxyXG4gIGRlc2NyaWJlKGBjcmVhdGVUcmFuc2FjdGlvbkZyb21Ob25TdGFuZGFyZEhhbGZTaWduZWQgJHtzY3JpcHRUeXBlfSAke2Ftb3VudFR5cGV9YCwgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHNjcmlwdFR5cGUgPT09ICdwMnRyJyB8fCBzY3JpcHRUeXBlID09PSAncDJ0ck11c2lnMicpIHtcclxuICAgICAgcmV0dXJuOyAvLyBUT0RPOiBlbmFibGUgcDJ0ciB0ZXN0cyB3aGVuIHNpZ25pbmcgaXMgc3VwcG9ydGVkXHJcbiAgICB9XHJcbiAgICBmaXh0dXJlS2V5cy5mb3JFYWNoKChzaWduS2V5LCBwdWJrZXlJbmRleCkgPT4ge1xyXG4gICAgICBpdChgcGFyc2VzIG5vbi1zdGFuZGFyZCBoYWxmIHNpZ25lZCB0cmFuc2FjdGlvbiBwdWJrZXlJbmRleD0ke3B1YmtleUluZGV4fWAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCBzdGFuZGFyZEhhbGZTaWduZWQgPSBnZXRIYWxmU2lnbmVkVHJhbnNhY3Rpb24yT2YzPFROdW1iZXI+KFxyXG4gICAgICAgICAgZml4dHVyZUtleXMsXHJcbiAgICAgICAgICBzaWduS2V5LFxyXG4gICAgICAgICAgZ2V0RGVmYXVsdENvc2lnbmVyKGZpeHR1cmVLZXlzLCBzaWduS2V5KSxcclxuICAgICAgICAgIHNjcmlwdFR5cGUsXHJcbiAgICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgICAgeyBhbW91bnRUeXBlIH1cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBGaXh0dXJlcyBjYW4gb25seSBiZSBjb25zdHJ1Y3RlZCB1c2luZyB1dHhvbGliIDwgMS4xMFxyXG4gICAgICAgIGNvbnN0IG5vblN0YW5kYXJkSGFsZlNpZ25lZCA9IGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcjxUTnVtYmVyPihcclxuICAgICAgICAgIEJ1ZmZlci5mcm9tKFxyXG4gICAgICAgICAgICBhd2FpdCBnZXRGaXh0dXJlPHN0cmluZz4obmV0d29yaywgYG5vblN0YW5kYXJkSGFsZlNpZ25lZC0ke3NjcmlwdFR5cGV9LSR7cHVia2V5SW5kZXh9Lmpzb25gKSxcclxuICAgICAgICAgICAgJ2hleCdcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgICAgeyBhbW91bnRUeXBlIH1cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBUaGUgbm9uc3RhbmRhcmQgdHJhbnNhY3Rpb24gaW5wdXQgaXMgbWlzc2luZyB0d28gYE9QXzBgXHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKG5vblN0YW5kYXJkSGFsZlNpZ25lZC50b0J1ZmZlcigpLmxlbmd0aCwgc3RhbmRhcmRIYWxmU2lnbmVkLnRvQnVmZmVyKCkubGVuZ3RoIC0gMik7XHJcblxyXG4gICAgICAgIG5vblN0YW5kYXJkSGFsZlNpZ25lZC5pbnMuZm9yRWFjaCgoaW5wdXQpID0+IHBhZElucHV0U2NyaXB0KGlucHV0LCBwdWJrZXlJbmRleCkpO1xyXG5cclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwobm9uU3RhbmRhcmRIYWxmU2lnbmVkLnRvQnVmZmVyKCkubGVuZ3RoLCBzdGFuZGFyZEhhbGZTaWduZWQudG9CdWZmZXIoKS5sZW5ndGgpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChcclxuICAgICAgICAgIG5vblN0YW5kYXJkSGFsZlNpZ25lZC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSxcclxuICAgICAgICAgIHN0YW5kYXJkSGFsZlNpZ25lZC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmRlc2NyaWJlKCdOb24tU3RhbmRhcmQgSGFsZi1TaWduZWQgVHJhbnNhY3Rpb25zJywgZnVuY3Rpb24gKCkge1xyXG4gIHNjcmlwdFR5cGVzMk9mMy5mb3JFYWNoKChzY3JpcHRUeXBlKSA9PiBydW5UZXN0PG51bWJlcj4oc2NyaXB0VHlwZSBhcyBTY3JpcHRUeXBlMk9mMywgJ251bWJlcicpKTtcclxuICBzY3JpcHRUeXBlczJPZjMuZm9yRWFjaCgoc2NyaXB0VHlwZSkgPT4gcnVuVGVzdDxiaWdpbnQ+KHNjcmlwdFR5cGUgYXMgU2NyaXB0VHlwZTJPZjMsICdiaWdpbnQnKSk7XHJcbn0pO1xyXG4iXX0=