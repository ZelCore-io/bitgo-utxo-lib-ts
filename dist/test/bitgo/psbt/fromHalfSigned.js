"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mocha_1 = require("mocha");
const src_1 = require("../../../src");
const bitgo_1 = require("../../../src/bitgo");
const testutil_1 = require("../../../src/testutil");
const outputScripts_1 = require("../../../src/bitgo/outputScripts");
const fromHalfSigned_1 = require("../../../src/bitgo/psbt/fromHalfSigned");
const transaction_util_1 = require("../../transaction_util");
const fixture_util_1 = require("../../fixture.util");
const normalize_1 = require("../../testutil/normalize");
const bs58check = require("bs58check");
function getScriptTypes2Of3() {
    // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
    //  because the test suite is written with TransactionBuilder
    return bitgo_1.outputScripts.scriptTypes2Of3.filter((scriptType) => scriptType !== 'p2trMusig2');
}
function getScriptTypes() {
    return [...getScriptTypes2Of3(), 'p2shP2pk'];
}
const walletKeys = (0, testutil_1.getDefaultWalletKeys)();
function runTest(scriptType, signer, cosigner, network) {
    const signerName = (0, testutil_1.getKeyName)(walletKeys.triple, signer);
    const cosignerName = (0, testutil_1.getKeyName)(walletKeys.triple, cosigner);
    const networkName = (0, src_1.getNetworkName)(network);
    const signingKeys = [
        signerName === 'user' || cosignerName === 'user',
        signerName === 'backup' || cosignerName === 'backup',
        signerName === 'bitgo' || cosignerName === 'bitgo',
    ];
    (0, mocha_1.describe)(`UtxoPsbt ${[
        `scriptType=${scriptType}`,
        `network=${networkName}`,
        `signer=${signerName}`,
        `cosigner=${cosignerName}`,
    ].join(',')}`, function () {
        let prevOutputs;
        let unsigned;
        let halfSigned;
        let fullSigned;
        before('create transaction', function () {
            prevOutputs = (0, transaction_util_1.getPrevOutputs)(scriptType, BigInt(1e8), network, {
                keys: walletKeys.triple,
                prevTx: (scriptType === 'p2sh' || scriptType === 'p2shP2pk') && (0, src_1.getNetworkName)(network) !== 'zcash',
            });
            ({ unsigned, halfSigned, fullSigned } = (0, transaction_util_1.getTransactionStages)(walletKeys.triple, signer, cosigner, scriptType, network, {
                amountType: 'bigint',
                outputAmount: BigInt(1e8),
                prevOutputs,
            }));
        });
        function testGetInputUpdateForStage(stage) {
            (0, mocha_1.it)(`has getInputUpdate with expected value, stage=${stage}`, async function () {
                const tx = stage === 'unsigned' ? unsigned : halfSigned;
                const vin = 0;
                const inputUpdate = (0, fromHalfSigned_1.getInputUpdate)(tx, vin, prevOutputs);
                assert.deepStrictEqual((0, normalize_1.normDefault)(inputUpdate), await (0, fixture_util_1.readFixture)(`test/bitgo/fixtures/psbt/inputUpdate.${scriptType}.${stage}.${signerName}-${cosignerName}.json`, inputUpdate));
            });
        }
        testGetInputUpdateForStage('unsigned');
        testGetInputUpdateForStage('halfSigned');
        (0, mocha_1.it)('has equal unsigned tx', function () {
            assert.strictEqual(bitgo_1.UtxoPsbt.fromTransaction(unsigned, prevOutputs).getUnsignedTx().toBuffer().toString('hex'), unsigned.toBuffer().toString('hex'));
            if (scriptType !== 'p2shP2pk') {
                assert.strictEqual(bitgo_1.UtxoPsbt.fromTransaction(halfSigned, prevOutputs).getUnsignedTx().toBuffer().toString('hex'), unsigned.toBuffer().toString('hex'));
            }
        });
        function signPsbt(startTx, signers) {
            const psbt = bitgo_1.UtxoPsbt.fromTransaction(startTx, prevOutputs);
            psbt.updateGlobal({
                globalXpub: walletKeys.triple.map((bip32) => {
                    const masterFingerprint = Buffer.alloc(4);
                    masterFingerprint.writeUInt32BE(bip32.parentFingerprint);
                    const extendedPubkey = bip32.neutered().toBase58();
                    return {
                        extendedPubkey: bs58check.decode(extendedPubkey),
                        masterFingerprint,
                        path: 'm',
                    };
                }),
            });
            signers.forEach((s) => {
                if (scriptType === 'p2tr') {
                    psbt.signTaprootInput(0, s, [
                        (0, outputScripts_1.getLeafHash)({
                            publicKeys: walletKeys.publicKeys,
                            signer: signer.publicKey,
                            cosigner: cosigner.publicKey,
                        }),
                    ]);
                }
                else {
                    psbt.signAllInputs(s);
                }
            });
            assert.deepStrictEqual(psbt.getSignatureValidationArray(0), signingKeys);
            psbt.finalizeAllInputs();
            return psbt.extractTransaction();
        }
        (0, mocha_1.it)('can go from unsigned to full-signed', function () {
            // TODO(BG-57748): inputs lack some required information
            this.skip();
            assert.deepStrictEqual(signPsbt(unsigned, [signer, cosigner]).toBuffer().toString('hex'), fullSigned.toBuffer().toString('hex'));
        });
        (0, mocha_1.it)('can go from half-signed to full-signed', function () {
            if (scriptType === 'p2shP2pk') {
                this.skip();
            }
            assert.deepStrictEqual(signPsbt(halfSigned, [cosigner]).toBuffer().toString('hex'), fullSigned.toBuffer().toString('hex'));
        });
    });
}
getScriptTypes().forEach((t) => {
    runTest(t, walletKeys.user, walletKeys.bitgo, src_1.networks.bitcoin);
    runTest(t, walletKeys.backup, walletKeys.user, src_1.networks.bitcoin);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbUhhbGZTaWduZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2JpdGdvL3BzYnQvZnJvbUhhbGZTaWduZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFDakMsaUNBQXFDO0FBRXJDLHNDQUFpRjtBQUNqRiw4Q0FBMEY7QUFDMUYsb0RBQXlFO0FBQ3pFLG9FQUErRDtBQUMvRCwyRUFBd0U7QUFFeEUsNkRBQThFO0FBRTlFLHFEQUFpRDtBQUNqRCx3REFBdUQ7QUFDdkQsdUNBQXVDO0FBRXZDLFNBQVMsa0JBQWtCO0lBQ3pCLDJFQUEyRTtJQUMzRSw2REFBNkQ7SUFDN0QsT0FBTyxxQkFBYSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFVBQVUsS0FBSyxZQUFZLENBQUMsQ0FBQztBQUMzRixDQUFDO0FBRUQsU0FBUyxjQUFjO0lBQ3JCLE9BQU8sQ0FBQyxHQUFHLGtCQUFrQixFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVELE1BQU0sVUFBVSxHQUFHLElBQUEsK0JBQW9CLEdBQUUsQ0FBQztBQUUxQyxTQUFTLE9BQU8sQ0FDZCxVQUFvQyxFQUNwQyxNQUFzQixFQUN0QixRQUF3QixFQUN4QixPQUFnQjtJQUVoQixNQUFNLFVBQVUsR0FBRyxJQUFBLHFCQUFVLEVBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RCxNQUFNLFlBQVksR0FBRyxJQUFBLHFCQUFVLEVBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3RCxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFjLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsTUFBTSxXQUFXLEdBQUc7UUFDbEIsVUFBVSxLQUFLLE1BQU0sSUFBSSxZQUFZLEtBQUssTUFBTTtRQUNoRCxVQUFVLEtBQUssUUFBUSxJQUFJLFlB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QU8sQ0FBQyxDQUFDO0FBQ25FLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCB7IGRlc2NyaWJlLCBpdCB9IGZyb20gJ21vY2hhJztcclxuXHJcbmltcG9ydCB7IEJJUDMySW50ZXJmYWNlLCBnZXROZXR3b3JrTmFtZSwgTmV0d29yaywgbmV0d29ya3MgfSBmcm9tICcuLi8uLi8uLi9zcmMnO1xyXG5pbXBvcnQgeyBvdXRwdXRTY3JpcHRzLCBQcmV2T3V0cHV0LCBVdHhvUHNidCwgVXR4b1RyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vLi4vc3JjL2JpdGdvJztcclxuaW1wb3J0IHsgZ2V0RGVmYXVsdFdhbGxldEtleXMsIGdldEtleU5hbWUgfSBmcm9tICcuLi8uLi8uLi9zcmMvdGVzdHV0aWwnO1xyXG5pbXBvcnQgeyBnZXRMZWFmSGFzaCB9IGZyb20gJy4uLy4uLy4uL3NyYy9iaXRnby9vdXRwdXRTY3JpcHRzJztcclxuaW1wb3J0IHsgZ2V0SW5wdXRVcGRhdGUgfSBmcm9tICcuLi8uLi8uLi9zcmMvYml0Z28vcHNidC9mcm9tSGFsZlNpZ25lZCc7XHJcblxyXG5pbXBvcnQgeyBnZXRQcmV2T3V0cHV0cywgZ2V0VHJhbnNhY3Rpb25TdGFnZXMgfSBmcm9tICcuLi8uLi90cmFuc2FjdGlvbl91dGlsJztcclxuXHJcbmltcG9ydCB7IHJlYWRGaXh0dXJlIH0gZnJvbSAnLi4vLi4vZml4dHVyZS51dGlsJztcclxuaW1wb3J0IHsgbm9ybURlZmF1bHQgfSBmcm9tICcuLi8uLi90ZXN0dXRpbC9ub3JtYWxpemUnO1xyXG5pbXBvcnQgKiBhcyBiczU4Y2hlY2sgZnJvbSAnYnM1OGNoZWNrJztcclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdFR5cGVzMk9mMygpIHtcclxuICAvLyBGSVhNRShCRy02Njk0MSk6IHAydHJNdXNpZzIgc2lnbmluZyBkb2VzIG5vdCB3b3JrIGluIHRoaXMgdGVzdCBzdWl0ZSB5ZXRcclxuICAvLyAgYmVjYXVzZSB0aGUgdGVzdCBzdWl0ZSBpcyB3cml0dGVuIHdpdGggVHJhbnNhY3Rpb25CdWlsZGVyXHJcbiAgcmV0dXJuIG91dHB1dFNjcmlwdHMuc2NyaXB0VHlwZXMyT2YzLmZpbHRlcigoc2NyaXB0VHlwZSkgPT4gc2NyaXB0VHlwZSAhPT0gJ3AydHJNdXNpZzInKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U2NyaXB0VHlwZXMoKTogb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlW10ge1xyXG4gIHJldHVybiBbLi4uZ2V0U2NyaXB0VHlwZXMyT2YzKCksICdwMnNoUDJwayddO1xyXG59XHJcblxyXG5jb25zdCB3YWxsZXRLZXlzID0gZ2V0RGVmYXVsdFdhbGxldEtleXMoKTtcclxuXHJcbmZ1bmN0aW9uIHJ1blRlc3QoXHJcbiAgc2NyaXB0VHlwZTogb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlLFxyXG4gIHNpZ25lcjogQklQMzJJbnRlcmZhY2UsXHJcbiAgY29zaWduZXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gIG5ldHdvcms6IE5ldHdvcmtcclxuKSB7XHJcbiAgY29uc3Qgc2lnbmVyTmFtZSA9IGdldEtleU5hbWUod2FsbGV0S2V5cy50cmlwbGUsIHNpZ25lcik7XHJcbiAgY29uc3QgY29zaWduZXJOYW1lID0gZ2V0S2V5TmFtZSh3YWxsZXRLZXlzLnRyaXBsZSwgY29zaWduZXIpO1xyXG4gIGNvbnN0IG5ldHdvcmtOYW1lID0gZ2V0TmV0d29ya05hbWUobmV0d29yayk7XHJcbiAgY29uc3Qgc2lnbmluZ0tleXMgPSBbXHJcbiAgICBzaWduZXJOYW1lID09PSAndXNlcicgfHwgY29zaWduZXJOYW1lID09PSAndXNlcicsXHJcbiAgICBzaWduZXJOYW1lID09PSAnYmFja3VwJyB8fCBjb3NpZ25lck5hbWUgPT09ICdiYWNrdXAnLFxyXG4gICAgc2lnbmVyTmFtZSA9PT0gJ2JpdGdvJyB8fCBjb3NpZ25lck5hbWUgPT09ICdiaXRnbycsXHJcbiAgXTtcclxuICBkZXNjcmliZShgVXR4b1BzYnQgJHtbXHJcbiAgICBgc2NyaXB0VHlwZT0ke3NjcmlwdFR5cGV9YCxcclxuICAgIGBuZXR3b3JrPSR7bmV0d29ya05hbWV9YCxcclxuICAgIGBzaWduZXI9JHtzaWduZXJOYW1lfWAsXHJcbiAgICBgY29zaWduZXI9JHtjb3NpZ25lck5hbWV9YCxcclxuICBdLmpvaW4oJywnKX1gLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgcHJldk91dHB1dHM6IFByZXZPdXRwdXQ8YmlnaW50PltdO1xyXG4gICAgbGV0IHVuc2lnbmVkOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PjtcclxuICAgIGxldCBoYWxmU2lnbmVkOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PjtcclxuICAgIGxldCBmdWxsU2lnbmVkOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PjtcclxuICAgIGJlZm9yZSgnY3JlYXRlIHRyYW5zYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBwcmV2T3V0cHV0cyA9IGdldFByZXZPdXRwdXRzKHNjcmlwdFR5cGUsIEJpZ0ludCgxZTgpLCBuZXR3b3JrLCB7XHJcbiAgICAgICAga2V5czogd2FsbGV0S2V5cy50cmlwbGUsXHJcbiAgICAgICAgcHJldlR4OiAoc2NyaXB0VHlwZSA9PT0gJ3Ayc2gnIHx8IHNjcmlwdFR5cGUgPT09ICdwMnNoUDJwaycpICYmIGdldE5ldHdvcmtOYW1lKG5ldHdvcmspICE9PSAnemNhc2gnLFxyXG4gICAgICB9KTtcclxuICAgICAgKHsgdW5zaWduZWQsIGhhbGZTaWduZWQsIGZ1bGxTaWduZWQgfSA9IGdldFRyYW5zYWN0aW9uU3RhZ2VzKFxyXG4gICAgICAgIHdhbGxldEtleXMudHJpcGxlLFxyXG4gICAgICAgIHNpZ25lcixcclxuICAgICAgICBjb3NpZ25lcixcclxuICAgICAgICBzY3JpcHRUeXBlLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYW1vdW50VHlwZTogJ2JpZ2ludCcsXHJcbiAgICAgICAgICBvdXRwdXRBbW91bnQ6IEJpZ0ludCgxZTgpLFxyXG4gICAgICAgICAgcHJldk91dHB1dHMsXHJcbiAgICAgICAgfVxyXG4gICAgICApKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIHRlc3RHZXRJbnB1dFVwZGF0ZUZvclN0YWdlKHN0YWdlOiAndW5zaWduZWQnIHwgJ2hhbGZTaWduZWQnKSB7XHJcbiAgICAgIGl0KGBoYXMgZ2V0SW5wdXRVcGRhdGUgd2l0aCBleHBlY3RlZCB2YWx1ZSwgc3RhZ2U9JHtzdGFnZX1gLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdHggPSBzdGFnZSA9PT0gJ3Vuc2lnbmVkJyA/IHVuc2lnbmVkIDogaGFsZlNpZ25lZDtcclxuICAgICAgICBjb25zdCB2aW4gPSAwO1xyXG4gICAgICAgIGNvbnN0IGlucHV0VXBkYXRlID0gZ2V0SW5wdXRVcGRhdGUodHgsIHZpbiwgcHJldk91dHB1dHMpO1xyXG4gICAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoXHJcbiAgICAgICAgICBub3JtRGVmYXVsdChpbnB1dFVwZGF0ZSksXHJcbiAgICAgICAgICBhd2FpdCByZWFkRml4dHVyZShcclxuICAgICAgICAgICAgYHRlc3QvYml0Z28vZml4dHVyZXMvcHNidC9pbnB1dFVwZGF0ZS4ke3NjcmlwdFR5cGV9LiR7c3RhZ2V9LiR7c2lnbmVyTmFtZX0tJHtjb3NpZ25lck5hbWV9Lmpzb25gLFxyXG4gICAgICAgICAgICBpbnB1dFVwZGF0ZVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRlc3RHZXRJbnB1dFVwZGF0ZUZvclN0YWdlKCd1bnNpZ25lZCcpO1xyXG4gICAgdGVzdEdldElucHV0VXBkYXRlRm9yU3RhZ2UoJ2hhbGZTaWduZWQnKTtcclxuXHJcbiAgICBpdCgnaGFzIGVxdWFsIHVuc2lnbmVkIHR4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgVXR4b1BzYnQuZnJvbVRyYW5zYWN0aW9uKHVuc2lnbmVkLCBwcmV2T3V0cHV0cykuZ2V0VW5zaWduZWRUeCgpLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICAgIHVuc2lnbmVkLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoc2NyaXB0VHlwZSAhPT0gJ3Ayc2hQMnBrJykge1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChcclxuICAgICAgICAgIFV0eG9Qc2J0LmZyb21UcmFuc2FjdGlvbihoYWxmU2lnbmVkLCBwcmV2T3V0cHV0cykuZ2V0VW5zaWduZWRUeCgpLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICAgICAgdW5zaWduZWQudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JylcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBzaWduUHNidChzdGFydFR4OiBVdHhvVHJhbnNhY3Rpb248YmlnaW50Piwgc2lnbmVyczogQklQMzJJbnRlcmZhY2VbXSkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gVXR4b1BzYnQuZnJvbVRyYW5zYWN0aW9uKHN0YXJ0VHgsIHByZXZPdXRwdXRzKTtcclxuICAgICAgcHNidC51cGRhdGVHbG9iYWwoe1xyXG4gICAgICAgIGdsb2JhbFhwdWI6IHdhbGxldEtleXMudHJpcGxlLm1hcCgoYmlwMzIpID0+IHtcclxuICAgICAgICAgIGNvbnN0IG1hc3RlckZpbmdlcnByaW50ID0gQnVmZmVyLmFsbG9jKDQpO1xyXG4gICAgICAgICAgbWFzdGVyRmluZ2VycHJpbnQud3JpdGVVSW50MzJCRShiaXAzMi5wYXJlbnRGaW5nZXJwcmludCk7XHJcbiAgICAgICAgICBjb25zdCBleHRlbmRlZFB1YmtleSA9IGJpcDMyLm5ldXRlcmVkKCkudG9CYXNlNTgoKTtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGV4dGVuZGVkUHVia2V5OiBiczU4Y2hlY2suZGVjb2RlKGV4dGVuZGVkUHVia2V5KSxcclxuICAgICAgICAgICAgbWFzdGVyRmluZ2VycHJpbnQsXHJcbiAgICAgICAgICAgIHBhdGg6ICdtJyxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICBzaWduZXJzLmZvckVhY2goKHMpID0+IHtcclxuICAgICAgICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3AydHInKSB7XHJcbiAgICAgICAgICBwc2J0LnNpZ25UYXByb290SW5wdXQoMCwgcywgW1xyXG4gICAgICAgICAgICBnZXRMZWFmSGFzaCh7XHJcbiAgICAgICAgICAgICAgcHVibGljS2V5czogd2FsbGV0S2V5cy5wdWJsaWNLZXlzLFxyXG4gICAgICAgICAgICAgIHNpZ25lcjogc2lnbmVyLnB1YmxpY0tleSxcclxuICAgICAgICAgICAgICBjb3NpZ25lcjogY29zaWduZXIucHVibGljS2V5LFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgIF0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBwc2J0LnNpZ25BbGxJbnB1dHMocyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChwc2J0LmdldFNpZ25hdHVyZVZhbGlkYXRpb25BcnJheSgwKSwgc2lnbmluZ0tleXMpO1xyXG4gICAgICBwc2J0LmZpbmFsaXplQWxsSW5wdXRzKCk7XHJcbiAgICAgIHJldHVybiBwc2J0LmV4dHJhY3RUcmFuc2FjdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGl0KCdjYW4gZ28gZnJvbSB1bnNpZ25lZCB0byBmdWxsLXNpZ25lZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gVE9ETyhCRy01Nzc0OCk6IGlucHV0cyBsYWNrIHNvbWUgcmVxdWlyZWQgaW5mb3JtYXRpb25cclxuICAgICAgdGhpcy5za2lwKCk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoXHJcbiAgICAgICAgc2lnblBzYnQodW5zaWduZWQsIFtzaWduZXIsIGNvc2lnbmVyXSkudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JyksXHJcbiAgICAgICAgZnVsbFNpZ25lZC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ2NhbiBnbyBmcm9tIGhhbGYtc2lnbmVkIHRvIGZ1bGwtc2lnbmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMnBrJykge1xyXG4gICAgICAgIHRoaXMuc2tpcCgpO1xyXG4gICAgICB9XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoXHJcbiAgICAgICAgc2lnblBzYnQoaGFsZlNpZ25lZCwgW2Nvc2lnbmVyXSkudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JyksXHJcbiAgICAgICAgZnVsbFNpZ25lZC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmdldFNjcmlwdFR5cGVzKCkuZm9yRWFjaCgodCkgPT4ge1xyXG4gIHJ1blRlc3QodCwgd2FsbGV0S2V5cy51c2VyLCB3YWxsZXRLZXlzLmJpdGdvLCBuZXR3b3Jrcy5iaXRjb2luKTtcclxuICBydW5UZXN0KHQsIHdhbGxldEtleXMuYmFja3VwLCB3YWxsZXRLZXlzLnVzZXIsIG5ldHdvcmtzLmJpdGNvaW4pO1xyXG59KTtcclxuIl19