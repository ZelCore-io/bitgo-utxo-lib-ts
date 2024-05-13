"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const src_1 = require("../../../src");
const bitgo_1 = require("../../../src/bitgo");
const testutil_1 = require("../../../src/testutil");
const transaction_util_1 = require("../../transaction_util");
const mock_1 = require("../../../src/testutil/mock");
const CHANGE_INDEX = 100;
const FEE = BigInt(100);
function getScriptTypes2Of3() {
    // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
    //  because the test suite is written with TransactionBuilder
    return bitgo_1.outputScripts.scriptTypes2Of3.filter((scriptType) => scriptType !== 'p2trMusig2');
}
describe('WalletUnspent', function () {
    const network = src_1.networks.bitcoin;
    const walletKeys = (0, testutil_1.getDefaultWalletKeys)();
    const hash = Buffer.alloc(32).fill(0xff);
    hash[0] = 0; // show endianness
    const input = { hash, index: 0 };
    const expectedOutPoint = {
        txid: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00',
        vout: 0,
    };
    it('parses and formats txid', function () {
        assert.deepStrictEqual((0, bitgo_1.getOutputIdForInput)(input), expectedOutPoint);
        assert.deepStrictEqual((0, bitgo_1.formatOutputId)(expectedOutPoint), 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00:0');
        assert.deepStrictEqual((0, bitgo_1.parseOutputId)((0, bitgo_1.formatOutputId)(expectedOutPoint)), expectedOutPoint);
    });
    it('identifies wallet unspents', function () {
        const unspent = {
            id: (0, bitgo_1.formatOutputId)(expectedOutPoint),
            address: (0, bitgo_1.getWalletAddress)(walletKeys, 0, 0, network),
            value: 1e8,
        };
        assert.strictEqual((0, bitgo_1.isWalletUnspent)(unspent), false);
        assert.strictEqual((0, bitgo_1.isWalletUnspent)({ ...unspent, chain: 0, index: 0 }), true);
    });
    function constructAndSignTransactionUsingPsbt(unspents, signer, cosigner, outputType) {
        const psbt = (0, bitgo_1.createPsbtForNetwork)({ network });
        const total = BigInt((0, bitgo_1.unspentSum)(unspents, 'bigint'));
        (0, bitgo_1.addWalletOutputToPsbt)(psbt, walletKeys, (0, bitgo_1.getInternalChainCode)(outputType), CHANGE_INDEX, total - FEE);
        unspents.forEach((u) => {
            if ((0, bitgo_1.isWalletUnspent)(u)) {
                (0, bitgo_1.addWalletUnspentToPsbt)(psbt, u, walletKeys, signer, cosigner);
            }
            else {
                throw new Error(`invalid unspent`);
            }
        });
        // TODO: Test rederiving scripts from PSBT and keys only
        psbt.signAllInputsHD(walletKeys[signer]);
        psbt.signAllInputsHD(walletKeys[cosigner]);
        assert(psbt.validateSignaturesOfAllInputs());
        psbt.finalizeAllInputs();
        // extract transaction has a return type of Transaction instead of UtxoTransaction
        const tx = psbt.extractTransaction();
        const psbt2 = (0, bitgo_1.createPsbtFromTransaction)(tx, unspents.map((u) => ({ ...(0, bitgo_1.toPrevOutput)(u, network), prevTx: u.prevTx })));
        assert(psbt2.validateSignaturesOfAllInputs());
        return tx;
    }
    function constructAndSignTransactionUsingTransactionBuilder(unspents, signer, cosigner, amountType = 'number', outputType) {
        const txb = (0, bitgo_1.createTransactionBuilderForNetwork)(network);
        const total = BigInt((0, bitgo_1.unspentSum)(unspents, amountType));
        // Kinda weird, treating entire value as change, but tests the relevant paths
        txb.addOutput((0, bitgo_1.getWalletAddress)(walletKeys, (0, bitgo_1.getInternalChainCode)(outputType), CHANGE_INDEX, network), (0, bitgo_1.toTNumber)(total - FEE, amountType));
        unspents.forEach((u) => {
            (0, bitgo_1.addToTransactionBuilder)(txb, u);
        });
        unspents.forEach((u, i) => {
            if ((0, mock_1.isReplayProtectionUnspent)(u, network)) {
                (0, bitgo_1.signInputP2shP2pk)(txb, i, mock_1.replayProtectionKeyPair);
            }
        });
        [
            bitgo_1.WalletUnspentSigner.from(walletKeys, walletKeys[signer], walletKeys[cosigner]),
            bitgo_1.WalletUnspentSigner.from(walletKeys, walletKeys[cosigner], walletKeys[signer]),
        ].forEach((walletSigner, nSignature) => {
            unspents.forEach((u, i) => {
                if ((0, bitgo_1.isWalletUnspent)(u)) {
                    (0, bitgo_1.signInputWithUnspent)(txb, i, u, walletSigner);
                }
                else if ((0, mock_1.isReplayProtectionUnspent)(u, network)) {
                    return;
                }
                else {
                    throw new Error(`unexpected unspent ${u.id}`);
                }
            });
            const tx = nSignature === 0 ? txb.buildIncomplete() : txb.build();
            // Verify each signature for the unspent
            unspents.forEach((u, i) => {
                if ((0, mock_1.isReplayProtectionUnspent)(u, network)) {
                    // signature verification not implemented for replay protection unspents
                    return;
                }
                assert.deepStrictEqual((0, bitgo_1.verifySignatureWithUnspent)(tx, i, unspents, walletKeys), walletKeys.triple.map((k) => k === walletKeys[signer] || (nSignature === 1 && k === walletKeys[cosigner])));
            });
        });
        return txb.build();
    }
    function validateLockTimeAndSequence(transaction) {
        // locktime should default to 0 and sequence to 0xffffffff for all inputs
        assert.deepStrictEqual(transaction.locktime, 0);
        const inputs = transaction.ins;
        for (const input of inputs) {
            assert.deepStrictEqual(input.sequence, 0xffffffff);
        }
    }
    function runTestSignUnspents({ inputScriptTypes, outputScriptType, signer, cosigner, amountType, testOutputAmount, }) {
        it(`can be signed [inputs=${inputScriptTypes} signer=${signer} cosigner=${cosigner} amountType=${amountType}]`, function () {
            const unspents = inputScriptTypes.map((t, i) => {
                if (bitgo_1.outputScripts.isScriptType2Of3(t)) {
                    return (0, mock_1.mockWalletUnspent)(network, testOutputAmount, {
                        keys: walletKeys,
                        chain: (0, bitgo_1.getExternalChainCode)(t),
                        vout: i,
                    });
                }
                if (t === 'p2shP2pk') {
                    return (0, mock_1.mockReplayProtectionUnspent)(network, (0, bitgo_1.toTNumber)(1000, amountType));
                }
                throw new Error(`invalid input type ${t}`);
            });
            const txbTransaction = constructAndSignTransactionUsingTransactionBuilder(unspents, signer, cosigner, amountType, outputScriptType);
            validateLockTimeAndSequence(txbTransaction);
            if (amountType === 'bigint') {
                if (inputScriptTypes.includes('p2shP2pk')) {
                    // FIMXE(BG-47824): add p2shP2pk support for Psbt
                    return;
                }
                const psbtTransaction = constructAndSignTransactionUsingPsbt(unspents, signer, cosigner, outputScriptType);
                assert.deepStrictEqual(txbTransaction.toBuffer(), psbtTransaction.toBuffer());
                validateLockTimeAndSequence(psbtTransaction);
            }
        });
    }
    function getInputScripts() {
        return getScriptTypes2Of3().flatMap((t) => [
            [t, t],
            [t, t, 'p2shP2pk'],
        ]);
    }
    function getSignerPairs() {
        const keyNames = ['user', 'backup', 'bitgo'];
        return keyNames.flatMap((signer) => keyNames.flatMap((cosigner) => (signer === cosigner ? [] : [[signer, cosigner]])));
    }
    getInputScripts().forEach((inputScriptTypes) => {
        getSignerPairs().forEach(([signer, cosigner]) => {
            runTestSignUnspents({
                inputScriptTypes,
                outputScriptType: 'p2sh',
                signer,
                cosigner,
                amountType: 'number',
                testOutputAmount: transaction_util_1.defaultTestOutputAmount,
            });
            runTestSignUnspents({
                inputScriptTypes,
                outputScriptType: 'p2sh',
                signer,
                cosigner,
                amountType: 'bigint',
                testOutputAmount: BigInt('10000000000000000'),
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2FsbGV0VW5zcGVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvYml0Z28vd2FsbGV0L1dhbGxldFVuc3BlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFFakMsc0NBQXFEO0FBQ3JELDhDQTBCNEI7QUFFNUIsb0RBQTZEO0FBQzdELDZEQUFpRTtBQUNqRSxxREFLb0M7QUFFcEMsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDO0FBQ3pCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUl4QixTQUFTLGtCQUFrQjtJQUN6QiwyRUFBMkU7SUFDM0UsNkRBQTZEO0lBQzdELE9BQU8scUJBQWEsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEtBQUssWUFBWSxDQUFDLENBQUM7QUFDM0YsQ0FBQztBQUVELFFBQVEsQ0FBQyxlQUFlLEVBQUU7SUFDeEIsTUFBTSxPQUFPLEdBQUcsY0FBUSxDQUFDLE9BQU8sQ0FBQztJQUNqQyxNQUFNLFVBQVUsR0FBRyxJQUFBLCtCQUFvQixHQUFFLENBQUM7SUFDMUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGtCQUFrQjtJQUMvQixNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDakMsTUFBTSxnQkFBZ0IsR0FBZTtRQUNuQyxJQUFJLEVBQUUsa0VBQWtFO1FBQ3hFLElBQUksRUFBRSxDQUFDO0tBQ1IsQ0FBQztJQUVGLEVBQUUsQ0FBQyx5QkFBeUIsRUFBRTtRQUM1QixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsMkJBQW1CLEVBQUMsS0FBSyxD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QUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDeEcsQ0FBQztJQUNKLENBQUM7SUFFRCxlQUFlLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFO1FBQzdDLGNBQWMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsbUJBQW1CLENBQUM7Z0JBQ2xCLGdCQUFnQjtnQkFDaEIsZ0JBQWdCLEVBQUUsTUFBTTtnQkFDeEIsTUFBTTtnQkFDTixRQUFRO2dCQUNSLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixnQkFBZ0IsRUFBRSwwQ0FBdUI7YUFDMUMsQ0FBQyxDQUFDO1lBQ0gsbUJBQW1CLENBQVM7Z0JBQzFCLGdCQUFnQjtnQkFDaEIsZ0JBQWdCLEVBQUUsTUFBTTtnQkFDeEIsTUFBTTtnQkFDTixRQUFRO2dCQUNSLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixnQkFBZ0IsRUFBRSxNQUFNLENBQUMsbUJBQW1CLENBQUM7YUFDOUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcblxyXG5pbXBvcnQgeyBUcmFuc2FjdGlvbiwgbmV0d29ya3MgfSBmcm9tICcuLi8uLi8uLi9zcmMnO1xyXG5pbXBvcnQge1xyXG4gIGlzV2FsbGV0VW5zcGVudCxcclxuICBmb3JtYXRPdXRwdXRJZCxcclxuICBnZXRPdXRwdXRJZEZvcklucHV0LFxyXG4gIHBhcnNlT3V0cHV0SWQsXHJcbiAgVHhPdXRQb2ludCxcclxuICBVbnNwZW50LFxyXG4gIGNyZWF0ZVRyYW5zYWN0aW9uQnVpbGRlckZvck5ldHdvcmssXHJcbiAgZ2V0SW50ZXJuYWxDaGFpbkNvZGUsXHJcbiAgZ2V0RXh0ZXJuYWxDaGFpbkNvZGUsXHJcbiAgYWRkVG9UcmFuc2FjdGlvbkJ1aWxkZXIsXHJcbiAgc2lnbklucHV0V2l0aFVuc3BlbnQsXHJcbiAgV2FsbGV0VW5zcGVudFNpZ25lcixcclxuICBvdXRwdXRTY3JpcHRzLFxyXG4gIHVuc3BlbnRTdW0sXHJcbiAgZ2V0V2FsbGV0QWRkcmVzcyxcclxuICB2ZXJpZnlTaWduYXR1cmVXaXRoVW5zcGVudCxcclxuICB0b1ROdW1iZXIsXHJcbiAgVXR4b1RyYW5zYWN0aW9uLFxyXG4gIGNyZWF0ZVBzYnRGb3JOZXR3b3JrLFxyXG4gIGNyZWF0ZVBzYnRGcm9tVHJhbnNhY3Rpb24sXHJcbiAgYWRkV2FsbGV0VW5zcGVudFRvUHNidCxcclxuICBhZGRXYWxsZXRPdXRwdXRUb1BzYnQsXHJcbiAgdG9QcmV2T3V0cHV0LFxyXG4gIEtleU5hbWUsXHJcbiAgc2lnbklucHV0UDJzaFAycGssXHJcbn0gZnJvbSAnLi4vLi4vLi4vc3JjL2JpdGdvJztcclxuXHJcbmltcG9ydCB7IGdldERlZmF1bHRXYWxsZXRLZXlzIH0gZnJvbSAnLi4vLi4vLi4vc3JjL3Rlc3R1dGlsJztcclxuaW1wb3J0IHsgZGVmYXVsdFRlc3RPdXRwdXRBbW91bnQgfSBmcm9tICcuLi8uLi90cmFuc2FjdGlvbl91dGlsJztcclxuaW1wb3J0IHtcclxuICBtb2NrV2FsbGV0VW5zcGVudCxcclxuICBpc1JlcGxheVByb3RlY3Rpb25VbnNwZW50LFxyXG4gIG1vY2tSZXBsYXlQcm90ZWN0aW9uVW5zcGVudCxcclxuICByZXBsYXlQcm90ZWN0aW9uS2V5UGFpcixcclxufSBmcm9tICcuLi8uLi8uLi9zcmMvdGVzdHV0aWwvbW9jayc7XHJcblxyXG5jb25zdCBDSEFOR0VfSU5ERVggPSAxMDA7XHJcbmNvbnN0IEZFRSA9IEJpZ0ludCgxMDApO1xyXG5cclxudHlwZSBJbnB1dFR5cGUgPSBvdXRwdXRTY3JpcHRzLlNjcmlwdFR5cGUyT2YzIHwgJ3Ayc2hQMnBrJztcclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdFR5cGVzMk9mMygpIHtcclxuICAvLyBGSVhNRShCRy02Njk0MSk6IHAydHJNdXNpZzIgc2lnbmluZyBkb2VzIG5vdCB3b3JrIGluIHRoaXMgdGVzdCBzdWl0ZSB5ZXRcclxuICAvLyAgYmVjYXVzZSB0aGUgdGVzdCBzdWl0ZSBpcyB3cml0dGVuIHdpdGggVHJhbnNhY3Rpb25CdWlsZGVyXHJcbiAgcmV0dXJuIG91dHB1dFNjcmlwdHMuc2NyaXB0VHlwZXMyT2YzLmZpbHRlcigoc2NyaXB0VHlwZSkgPT4gc2NyaXB0VHlwZSAhPT0gJ3AydHJNdXNpZzInKTtcclxufVxyXG5cclxuZGVzY3JpYmUoJ1dhbGxldFVuc3BlbnQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgY29uc3QgbmV0d29yayA9IG5ldHdvcmtzLmJpdGNvaW47XHJcbiAgY29uc3Qgd2FsbGV0S2V5cyA9IGdldERlZmF1bHRXYWxsZXRLZXlzKCk7XHJcbiAgY29uc3QgaGFzaCA9IEJ1ZmZlci5hbGxvYygzMikuZmlsbCgweGZmKTtcclxuICBoYXNoWzBdID0gMDsgLy8gc2hvdyBlbmRpYW5uZXNzXHJcbiAgY29uc3QgaW5wdXQgPSB7IGhhc2gsIGluZGV4OiAwIH07XHJcbiAgY29uc3QgZXhwZWN0ZWRPdXRQb2ludDogVHhPdXRQb2ludCA9IHtcclxuICAgIHR4aWQ6ICdmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZjAwJyxcclxuICAgIHZvdXQ6IDAsXHJcbiAgfTtcclxuXHJcbiAgaXQoJ3BhcnNlcyBhbmQgZm9ybWF0cyB0eGlkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChnZXRPdXRwdXRJZEZvcklucHV0KGlucHV0KSwgZXhwZWN0ZWRPdXRQb2ludCk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKFxyXG4gICAgICBmb3JtYXRPdXRwdXRJZChleHBlY3RlZE91dFBvaW50KSxcclxuICAgICAgJ2ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMDA6MCdcclxuICAgICk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHBhcnNlT3V0cHV0SWQoZm9ybWF0T3V0cHV0SWQoZXhwZWN0ZWRPdXRQb2ludCkpLCBleHBlY3RlZE91dFBvaW50KTtcclxuICB9KTtcclxuXHJcbiAgaXQoJ2lkZW50aWZpZXMgd2FsbGV0IHVuc3BlbnRzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgdW5zcGVudDogVW5zcGVudCA9IHtcclxuICAgICAgaWQ6IGZvcm1hdE91dHB1dElkKGV4cGVjdGVkT3V0UG9pbnQpLFxyXG4gICAgICBhZGRyZXNzOiBnZXRXYWxsZXRBZGRyZXNzKHdhbGxldEtleXMsIDAsIDAsIG5ldHdvcmspLFxyXG4gICAgICB2YWx1ZTogMWU4LFxyXG4gICAgfTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1dhbGxldFVuc3BlbnQodW5zcGVudCksIGZhbHNlKTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1dhbGxldFVuc3BlbnQoeyAuLi51bnNwZW50LCBjaGFpbjogMCwgaW5kZXg6IDAgfSBhcyBVbnNwZW50KSwgdHJ1ZSk7XHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIGNvbnN0cnVjdEFuZFNpZ25UcmFuc2FjdGlvblVzaW5nUHNidChcclxuICAgIHVuc3BlbnRzOiAoVW5zcGVudDxiaWdpbnQ+ICYgeyBwcmV2VHg/OiBCdWZmZXIgfSlbXSxcclxuICAgIHNpZ25lcjogS2V5TmFtZSxcclxuICAgIGNvc2lnbmVyOiBLZXlOYW1lLFxyXG4gICAgb3V0cHV0VHlwZTogb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlMk9mM1xyXG4gICk6IFRyYW5zYWN0aW9uPGJpZ2ludD4ge1xyXG4gICAgY29uc3QgcHNidCA9IGNyZWF0ZVBzYnRGb3JOZXR3b3JrKHsgbmV0d29yayB9KTtcclxuICAgIGNvbnN0IHRvdGFsID0gQmlnSW50KHVuc3BlbnRTdW08YmlnaW50Pih1bnNwZW50cywgJ2JpZ2ludCcpKTtcclxuICAgIGFkZFdhbGxldE91dHB1dFRvUHNidChwc2J0LCB3YWxsZXRLZXlzLCBnZXRJbnRlcm5hbENoYWluQ29kZShvdXRwdXRUeXBlKSwgQ0hBTkdFX0lOREVYLCB0b3RhbCAtIEZFRSk7XHJcblxyXG4gICAgdW5zcGVudHMuZm9yRWFjaCgodSkgPT4ge1xyXG4gICAgICBpZiAoaXNXYWxsZXRVbnNwZW50KHUpKSB7XHJcbiAgICAgICAgYWRkV2FsbGV0VW5zcGVudFRvUHNidChwc2J0LCB1LCB3YWxsZXRLZXlzLCBzaWduZXIsIGNvc2lnbmVyKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdW5zcGVudGApO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBUT0RPOiBUZXN0IHJlZGVyaXZpbmcgc2NyaXB0cyBmcm9tIFBTQlQgYW5kIGtleXMgb25seVxyXG4gICAgcHNidC5zaWduQWxsSW5wdXRzSEQod2FsbGV0S2V5c1tzaWduZXJdKTtcclxuICAgIHBzYnQuc2lnbkFsbElucHV0c0hEKHdhbGxldEtleXNbY29zaWduZXJdKTtcclxuICAgIGFzc2VydChwc2J0LnZhbGlkYXRlU2lnbmF0dXJlc09mQWxsSW5wdXRzKCkpO1xyXG4gICAgcHNidC5maW5hbGl6ZUFsbElucHV0cygpO1xyXG4gICAgLy8gZXh0cmFjdCB0cmFuc2FjdGlvbiBoYXMgYSByZXR1cm4gdHlwZSBvZiBUcmFuc2FjdGlvbiBpbnN0ZWFkIG9mIFV0eG9UcmFuc2FjdGlvblxyXG4gICAgY29uc3QgdHggPSBwc2J0LmV4dHJhY3RUcmFuc2FjdGlvbigpIGFzIFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+O1xyXG5cclxuICAgIGNvbnN0IHBzYnQyID0gY3JlYXRlUHNidEZyb21UcmFuc2FjdGlvbihcclxuICAgICAgdHgsXHJcbiAgICAgIHVuc3BlbnRzLm1hcCgodSkgPT4gKHsgLi4udG9QcmV2T3V0cHV0PGJpZ2ludD4odSwgbmV0d29yayksIHByZXZUeDogdS5wcmV2VHggfSkpXHJcbiAgICApO1xyXG4gICAgYXNzZXJ0KHBzYnQyLnZhbGlkYXRlU2lnbmF0dXJlc09mQWxsSW5wdXRzKCkpO1xyXG4gICAgcmV0dXJuIHR4O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29uc3RydWN0QW5kU2lnblRyYW5zYWN0aW9uVXNpbmdUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgICB1bnNwZW50czogVW5zcGVudDxUTnVtYmVyPltdLFxyXG4gICAgc2lnbmVyOiBzdHJpbmcsXHJcbiAgICBjb3NpZ25lcjogc3RyaW5nLFxyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInLFxyXG4gICAgb3V0cHV0VHlwZTogb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlMk9mM1xyXG4gICk6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICBjb25zdCB0eGIgPSBjcmVhdGVUcmFuc2FjdGlvbkJ1aWxkZXJGb3JOZXR3b3JrPFROdW1iZXI+KG5ldHdvcmspO1xyXG4gICAgY29uc3QgdG90YWwgPSBCaWdJbnQodW5zcGVudFN1bTxUTnVtYmVyPih1bnNwZW50cywgYW1vdW50VHlwZSkpO1xyXG4gICAgLy8gS2luZGEgd2VpcmQsIHRyZWF0aW5nIGVudGlyZSB2YWx1ZSBhcyBjaGFuZ2UsIGJ1dCB0ZXN0cyB0aGUgcmVsZXZhbnQgcGF0aHNcclxuICAgIHR4Yi5hZGRPdXRwdXQoXHJcbiAgICAgIGdldFdhbGxldEFkZHJlc3Mod2FsbGV0S2V5cywgZ2V0SW50ZXJuYWxDaGFpbkNvZGUob3V0cHV0VHlwZSksIENIQU5HRV9JTkRFWCwgbmV0d29yayksXHJcbiAgICAgIHRvVE51bWJlcjxUTnVtYmVyPih0b3RhbCAtIEZFRSwgYW1vdW50VHlwZSlcclxuICAgICk7XHJcbiAgICB1bnNwZW50cy5mb3JFYWNoKCh1KSA9PiB7XHJcbiAgICAgIGFkZFRvVHJhbnNhY3Rpb25CdWlsZGVyKHR4YiwgdSk7XHJcbiAgICB9KTtcclxuICAgIHVuc3BlbnRzLmZvckVhY2goKHUsIGkpID0+IHtcclxuICAgICAgaWYgKGlzUmVwbGF5UHJvdGVjdGlvblVuc3BlbnQodSwgbmV0d29yaykpIHtcclxuICAgICAgICBzaWduSW5wdXRQMnNoUDJwayh0eGIsIGksIHJlcGxheVByb3RlY3Rpb25LZXlQYWlyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgW1xyXG4gICAgICBXYWxsZXRVbnNwZW50U2lnbmVyLmZyb20od2FsbGV0S2V5cywgd2FsbGV0S2V5c1tzaWduZXJdLCB3YWxsZXRLZXlzW2Nvc2lnbmVyXSksXHJcbiAgICAgIFdhbGxldFVuc3BlbnRTaWduZXIuZnJvbSh3YWxsZXRLZXlzLCB3YWxsZXRLZXlzW2Nvc2lnbmVyXSwgd2FsbGV0S2V5c1tzaWduZXJdKSxcclxuICAgIF0uZm9yRWFjaCgod2FsbGV0U2lnbmVyLCBuU2lnbmF0dXJlKSA9PiB7XHJcbiAgICAgIHVuc3BlbnRzLmZvckVhY2goKHUsIGkpID0+IHtcclxuICAgICAgICBpZiAoaXNXYWxsZXRVbnNwZW50KHUpKSB7XHJcbiAgICAgICAgICBzaWduSW5wdXRXaXRoVW5zcGVudCh0eGIsIGksIHUsIHdhbGxldFNpZ25lcik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc1JlcGxheVByb3RlY3Rpb25VbnNwZW50KHUsIG5ldHdvcmspKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5leHBlY3RlZCB1bnNwZW50ICR7dS5pZH1gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY29uc3QgdHggPSBuU2lnbmF0dXJlID09PSAwID8gdHhiLmJ1aWxkSW5jb21wbGV0ZSgpIDogdHhiLmJ1aWxkKCk7XHJcbiAgICAgIC8vIFZlcmlmeSBlYWNoIHNpZ25hdHVyZSBmb3IgdGhlIHVuc3BlbnRcclxuICAgICAgdW5zcGVudHMuZm9yRWFjaCgodSwgaSkgPT4ge1xyXG4gICAgICAgIGlmIChpc1JlcGxheVByb3RlY3Rpb25VbnNwZW50KHUsIG5ldHdvcmspKSB7XHJcbiAgICAgICAgICAvLyBzaWduYXR1cmUgdmVyaWZpY2F0aW9uIG5vdCBpbXBsZW1lbnRlZCBmb3IgcmVwbGF5IHByb3RlY3Rpb24gdW5zcGVudHNcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChcclxuICAgICAgICAgIHZlcmlmeVNpZ25hdHVyZVdpdGhVbnNwZW50KHR4LCBpLCB1bnNwZW50cywgd2FsbGV0S2V5cyksXHJcbiAgICAgICAgICB3YWxsZXRLZXlzLnRyaXBsZS5tYXAoKGspID0+IGsgPT09IHdhbGxldEtleXNbc2lnbmVyXSB8fCAoblNpZ25hdHVyZSA9PT0gMSAmJiBrID09PSB3YWxsZXRLZXlzW2Nvc2lnbmVyXSkpXHJcbiAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdHhiLmJ1aWxkKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB2YWxpZGF0ZUxvY2tUaW1lQW5kU2VxdWVuY2U8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgICB0cmFuc2FjdGlvbjogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHwgVHJhbnNhY3Rpb248YmlnaW50PlxyXG4gICkge1xyXG4gICAgLy8gbG9ja3RpbWUgc2hvdWxkIGRlZmF1bHQgdG8gMCBhbmQgc2VxdWVuY2UgdG8gMHhmZmZmZmZmZiBmb3IgYWxsIGlucHV0c1xyXG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCh0cmFuc2FjdGlvbi5sb2NrdGltZSwgMCk7XHJcbiAgICBjb25zdCBpbnB1dHMgPSB0cmFuc2FjdGlvbi5pbnM7XHJcbiAgICBmb3IgKGNvbnN0IGlucHV0IG9mIGlucHV0cykge1xyXG4gICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKGlucHV0LnNlcXVlbmNlLCAweGZmZmZmZmZmKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHJ1blRlc3RTaWduVW5zcGVudHM8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oe1xyXG4gICAgaW5wdXRTY3JpcHRUeXBlcyxcclxuICAgIG91dHB1dFNjcmlwdFR5cGUsXHJcbiAgICBzaWduZXIsXHJcbiAgICBjb3NpZ25lcixcclxuICAgIGFtb3VudFR5cGUsXHJcbiAgICB0ZXN0T3V0cHV0QW1vdW50LFxyXG4gIH06IHtcclxuICAgIGlucHV0U2NyaXB0VHlwZXM6IElucHV0VHlwZVtdO1xyXG4gICAgb3V0cHV0U2NyaXB0VHlwZTogb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlMk9mMztcclxuICAgIHNpZ25lcjogS2V5TmFtZTtcclxuICAgIGNvc2lnbmVyOiBLZXlOYW1lO1xyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JztcclxuICAgIHRlc3RPdXRwdXRBbW91bnQ6IFROdW1iZXI7XHJcbiAgfSkge1xyXG4gICAgaXQoYGNhbiBiZSBzaWduZWQgW2lucHV0cz0ke2lucHV0U2NyaXB0VHlwZXN9IHNpZ25lcj0ke3NpZ25lcn0gY29zaWduZXI9JHtjb3NpZ25lcn0gYW1vdW50VHlwZT0ke2Ftb3VudFR5cGV9XWAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgdW5zcGVudHMgPSBpbnB1dFNjcmlwdFR5cGVzLm1hcCgodCwgaSk6IFVuc3BlbnQ8VE51bWJlcj4gPT4ge1xyXG4gICAgICAgIGlmIChvdXRwdXRTY3JpcHRzLmlzU2NyaXB0VHlwZTJPZjModCkpIHtcclxuICAgICAgICAgIHJldHVybiBtb2NrV2FsbGV0VW5zcGVudChuZXR3b3JrLCB0ZXN0T3V0cHV0QW1vdW50LCB7XHJcbiAgICAgICAgICAgIGtleXM6IHdhbGxldEtleXMsXHJcbiAgICAgICAgICAgIGNoYWluOiBnZXRFeHRlcm5hbENoYWluQ29kZSh0KSxcclxuICAgICAgICAgICAgdm91dDogaSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHQgPT09ICdwMnNoUDJwaycpIHtcclxuICAgICAgICAgIHJldHVybiBtb2NrUmVwbGF5UHJvdGVjdGlvblVuc3BlbnQobmV0d29yaywgdG9UTnVtYmVyKDFfMDAwLCBhbW91bnRUeXBlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgaW5wdXQgdHlwZSAke3R9YCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY29uc3QgdHhiVHJhbnNhY3Rpb24gPSBjb25zdHJ1Y3RBbmRTaWduVHJhbnNhY3Rpb25Vc2luZ1RyYW5zYWN0aW9uQnVpbGRlcihcclxuICAgICAgICB1bnNwZW50cyxcclxuICAgICAgICBzaWduZXIsXHJcbiAgICAgICAgY29zaWduZXIsXHJcbiAgICAgICAgYW1vdW50VHlwZSxcclxuICAgICAgICBvdXRwdXRTY3JpcHRUeXBlXHJcbiAgICAgICk7XHJcbiAgICAgIHZhbGlkYXRlTG9ja1RpbWVBbmRTZXF1ZW5jZSh0eGJUcmFuc2FjdGlvbik7XHJcbiAgICAgIGlmIChhbW91bnRUeXBlID09PSAnYmlnaW50Jykge1xyXG4gICAgICAgIGlmIChpbnB1dFNjcmlwdFR5cGVzLmluY2x1ZGVzKCdwMnNoUDJwaycpKSB7XHJcbiAgICAgICAgICAvLyBGSU1YRShCRy00NzgyNCk6IGFkZCBwMnNoUDJwayBzdXBwb3J0IGZvciBQc2J0XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBzYnRUcmFuc2FjdGlvbiA9IGNvbnN0cnVjdEFuZFNpZ25UcmFuc2FjdGlvblVzaW5nUHNidChcclxuICAgICAgICAgIHVuc3BlbnRzIGFzIFVuc3BlbnQ8YmlnaW50PltdLFxyXG4gICAgICAgICAgc2lnbmVyLFxyXG4gICAgICAgICAgY29zaWduZXIsXHJcbiAgICAgICAgICBvdXRwdXRTY3JpcHRUeXBlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4YlRyYW5zYWN0aW9uLnRvQnVmZmVyKCksIHBzYnRUcmFuc2FjdGlvbi50b0J1ZmZlcigpKTtcclxuICAgICAgICB2YWxpZGF0ZUxvY2tUaW1lQW5kU2VxdWVuY2UocHNidFRyYW5zYWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRJbnB1dFNjcmlwdHMoKTogSW5wdXRUeXBlW11bXSB7XHJcbiAgICByZXR1cm4gZ2V0U2NyaXB0VHlwZXMyT2YzKCkuZmxhdE1hcCgodCkgPT4gW1xyXG4gICAgICBbdCwgdF0sXHJcbiAgICAgIFt0LCB0LCAncDJzaFAycGsnXSxcclxuICAgIF0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0U2lnbmVyUGFpcnMoKTogW3NpZ25lcjogS2V5TmFtZSwgY29zaWduZXI6IEtleU5hbWVdW10ge1xyXG4gICAgY29uc3Qga2V5TmFtZXM6IEtleU5hbWVbXSA9IFsndXNlcicsICdiYWNrdXAnLCAnYml0Z28nXTtcclxuICAgIHJldHVybiBrZXlOYW1lcy5mbGF0TWFwKChzaWduZXIpID0+XHJcbiAgICAgIGtleU5hbWVzLmZsYXRNYXAoKGNvc2lnbmVyKTogW0tleU5hbWUsIEtleU5hbWVdW10gPT4gKHNpZ25lciA9PT0gY29zaWduZXIgPyBbXSA6IFtbc2lnbmVyLCBjb3NpZ25lcl1dKSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXRJbnB1dFNjcmlwdHMoKS5mb3JFYWNoKChpbnB1dFNjcmlwdFR5cGVzKSA9PiB7XHJcbiAgICBnZXRTaWduZXJQYWlycygpLmZvckVhY2goKFtzaWduZXIsIGNvc2lnbmVyXSkgPT4ge1xyXG4gICAgICBydW5UZXN0U2lnblVuc3BlbnRzKHtcclxuICAgICAgICBpbnB1dFNjcmlwdFR5cGVzLFxyXG4gICAgICAgIG91dHB1dFNjcmlwdFR5cGU6ICdwMnNoJyxcclxuICAgICAgICBzaWduZXIsXHJcbiAgICAgICAgY29zaWduZXIsXHJcbiAgICAgICAgYW1vdW50VHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgdGVzdE91dHB1dEFtb3VudDogZGVmYXVsdFRlc3RPdXRwdXRBbW91bnQsXHJcbiAgICAgIH0pO1xyXG4gICAgICBydW5UZXN0U2lnblVuc3BlbnRzPGJpZ2ludD4oe1xyXG4gICAgICAgIGlucHV0U2NyaXB0VHlwZXMsXHJcbiAgICAgICAgb3V0cHV0U2NyaXB0VHlwZTogJ3Ayc2gnLFxyXG4gICAgICAgIHNpZ25lcixcclxuICAgICAgICBjb3NpZ25lcixcclxuICAgICAgICBhbW91bnRUeXBlOiAnYmlnaW50JyxcclxuICAgICAgICB0ZXN0T3V0cHV0QW1vdW50OiBCaWdJbnQoJzEwMDAwMDAwMDAwMDAwMDAwJyksXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pO1xyXG4iXX0=