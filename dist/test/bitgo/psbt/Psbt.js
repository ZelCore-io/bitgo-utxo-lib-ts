"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const src_1 = require("../../../src");
const bitgo_1 = require("../../../src/bitgo");
const outputScripts_1 = require("../../../src/bitgo/outputScripts");
const testutil_1 = require("../../../src/testutil");
const transaction_util_1 = require("../../transaction_util");
const psbtUtil_1 = require("./psbtUtil");
const testutil_2 = require("../../../src/testutil");
const Musig2Util_1 = require("./Musig2Util");
const CHANGE_INDEX = 100;
const FEE = BigInt(100);
const network = src_1.networks.bitcoin;
const rootWalletKeys = (0, testutil_1.getDefaultWalletKeys)();
function getScriptTypes2Of3() {
    // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
    //  because the test suite is written with TransactionBuilder
    return bitgo_1.outputScripts.scriptTypes2Of3.filter((scriptType) => scriptType !== 'p2trMusig2');
}
const halfSignedInputs = ['p2sh', 'p2wsh', 'p2shP2wsh'].map((scriptType) => ({
    scriptType,
    value: BigInt(1000),
}));
const halfSignedOutputs = testutil_1.outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(500) }));
const psbtInputs = testutil_1.inputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
const psbtOutputs = testutil_1.outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));
describe('Psbt Misc', function () {
    it('fail to finalise p2tr sighash mismatch', function () {
        const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2tr', value: BigInt(1000) }], [{ scriptType: 'p2sh', value: BigInt(900) }], network, rootWalletKeys, 'fullsigned');
        assert(psbt.validateSignaturesOfAllInputs());
        const tapScriptSig = psbt.data.inputs[0].tapScriptSig;
        assert(tapScriptSig);
        tapScriptSig[0].signature = Buffer.concat([tapScriptSig[0].signature, Buffer.of(src_1.Transaction.SIGHASH_ALL)]);
        assert.throws(() => psbt.finalizeAllInputs(), (e) => e.message === 'signature sighash does not match input sighash type');
    });
});
describe('extractP2msOnlyHalfSignedTx failure', function () {
    it('invalid signature count', function () {
        const psbt = src_1.testutil.constructPsbt(halfSignedInputs, halfSignedOutputs, network, rootWalletKeys, 'unsigned');
        assert.throws(() => (0, bitgo_1.extractP2msOnlyHalfSignedTx)(psbt), (e) => e.message === 'unexpected signature count undefined');
    });
    it('empty inputs', function () {
        const psbt = src_1.testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
        assert.throws(() => (0, bitgo_1.extractP2msOnlyHalfSignedTx)(psbt), (e) => e.message === 'empty inputs or outputs');
    });
    it('unsupported script type', function () {
        const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2tr', value: BigInt(1000) }], [{ scriptType: 'p2sh', value: BigInt(900) }], network, rootWalletKeys, 'halfsigned');
        assert.throws(() => (0, bitgo_1.extractP2msOnlyHalfSignedTx)(psbt), (e) => e.message === 'unsupported script type taprootScriptPathSpend');
    });
});
function runExtractP2msOnlyHalfSignedTxTest(network, inputs, outputs) {
    const coin = (0, src_1.getNetworkName)(network);
    describe(`extractP2msOnlyHalfSignedTx success for ${coin}`, function () {
        it(`success for ${coin}`, function () {
            const signers = { signerName: 'user', cosignerName: 'backup' };
            const txnOutputs = outputs;
            const txnInputs = inputs
                .map((v) => v.scriptType === 'p2sh' || v.scriptType === 'p2shP2wsh' || v.scriptType === 'p2wsh'
                ? {
                    scriptType: v.scriptType,
                    value: v.value,
                }
                : undefined)
                .filter((v) => !!v);
            const psbt = src_1.testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'halfsigned', { signers });
            const halfSignedPsbtTx = (0, bitgo_1.extractP2msOnlyHalfSignedTx)(psbt);
            let txb = src_1.testutil.constructTxnBuilder(txnInputs, txnOutputs, network, rootWalletKeys, 'halfsigned', signers);
            const halfSignedTxbTx = txb.buildIncomplete();
            const unspents = (0, psbtUtil_1.toBigInt)(inputs.map((input, i) => src_1.testutil.toUnspent(input, i, network, rootWalletKeys)));
            (0, psbtUtil_1.assertEqualTransactions)(halfSignedPsbtTx, halfSignedTxbTx);
            (0, psbtUtil_1.validatePsbtParsing)(halfSignedPsbtTx, psbt, unspents, 'halfsigned');
            (0, psbtUtil_1.validatePsbtParsing)(halfSignedTxbTx, psbt, unspents, 'halfsigned');
            src_1.testutil.signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'fullsigned', { signers });
            const fullySignedPsbt = psbt.clone();
            const psbtTx = psbt.finalizeAllInputs().extractTransaction();
            const txnUnspents = txnInputs.map((v, i) => src_1.testutil.toTxnUnspent(v, i, network, rootWalletKeys));
            const prevOutputs = txnUnspents.map((u) => (0, bitgo_1.toOutput)(u, network));
            txb = (0, bitgo_1.createTransactionBuilderFromTransaction)(halfSignedTxbTx, prevOutputs);
            (0, testutil_1.signAllTxnInputs)(txb, txnInputs, rootWalletKeys, 'fullsigned', signers);
            const txbTx = txb.build();
            (0, psbtUtil_1.assertEqualTransactions)(psbtTx, txbTx);
            (0, psbtUtil_1.validatePsbtParsing)(psbtTx, fullySignedPsbt, unspents, 'fullsigned');
            (0, psbtUtil_1.validatePsbtParsing)(txbTx, fullySignedPsbt, unspents, 'fullsigned');
        });
    });
}
function runBuildSignSendFlowTest(network, inputs, outputs, { skipNonWitnessUtxo = false } = {}) {
    const coin = (0, src_1.getNetworkName)(network);
    function assertValidate(psbt) {
        psbt.data.inputs.forEach((input, i) => {
            assert.ok(psbt.validateSignaturesOfInputHD(i, rootWalletKeys['user']));
            if ((0, bitgo_1.getPsbtInputScriptType)(input) !== 'p2shP2pk') {
                assert.ok(psbt.validateSignaturesOfInputHD(i, rootWalletKeys['bitgo']));
            }
        });
        assert.ok(psbt.validateSignaturesOfAllInputs());
    }
    describe(`Build, sign & send flow for ${coin}`, function () {
        /**
         * Skip adding nonWitnessUtxos to psbts
         * ------------------------------------
         * In the instance that we want to doing a bulk sweep, for network and client performance reasons we are substituting
         * the nonWitnessUtxo for p2sh and p2shP2pk inputs with a witnessUtxo. We need the witnessUtxo so that we can half
         * sign the transaction locally with the user key. When we send the half signed to BitGo, the PSBT will be properly
         * populated such that the non-segwit inputs have the nonWitnessUtxo. This means when we send it to BitGo we should
         * remove the witnessUtxo so that it just has the partialSig and redeemScript.
         */
        it(`success for ${coin}${skipNonWitnessUtxo ? ' without nonWitnessUtxo for p2sh' : ''}`, function () {
            const parentPsbt = src_1.testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
                signers: {
                    signerName: 'user',
                    cosignerName: 'bitgo',
                },
            });
            let psbt = skipNonWitnessUtxo ? (0, bitgo_1.clonePsbtWithoutNonWitnessUtxo)(parentPsbt) : parentPsbt;
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            psbt.setAllInputsMusig2NonceHD(rootWalletKeys['user']);
            let psbtWithoutPrevTx = (0, bitgo_1.clonePsbtWithoutNonWitnessUtxo)(psbt);
            let hex = psbtWithoutPrevTx.toHex();
            let psbtAtHsm = (0, bitgo_1.createPsbtFromHex)(hex, network);
            psbtAtHsm.setAllInputsMusig2NonceHD(rootWalletKeys['bitgo'], { deterministic: true });
            let hexAtHsm = psbtAtHsm.toHex();
            let psbtFromHsm = (0, bitgo_1.createPsbtFromHex)(hexAtHsm, network);
            (0, bitgo_1.deleteWitnessUtxoForNonSegwitInputs)(psbtFromHsm);
            psbt.combine(psbtFromHsm);
            src_1.testutil.signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'halfsigned', {
                signers: {
                    signerName: 'user',
                    cosignerName: 'bitgo',
                },
                skipNonWitnessUtxo,
            });
            psbtWithoutPrevTx = (0, bitgo_1.clonePsbtWithoutNonWitnessUtxo)(psbt);
            hex = psbtWithoutPrevTx.toHex();
            psbtAtHsm = (0, bitgo_1.createPsbtFromHex)(hex, network);
            (0, bitgo_1.withUnsafeNonSegwit)(psbtAtHsm, () => {
                src_1.testutil.signAllPsbtInputs(psbtAtHsm, inputs, rootWalletKeys, 'fullsigned', {
                    signers: {
                        signerName: 'user',
                        cosignerName: 'bitgo',
                    },
                    deterministic: true,
                });
            });
            (0, bitgo_1.withUnsafeNonSegwit)(psbtAtHsm, () => {
                assertValidate(psbtAtHsm);
            });
            hexAtHsm = psbtAtHsm.toHex();
            psbtFromHsm = (0, bitgo_1.createPsbtFromHex)(hexAtHsm, network);
            (0, bitgo_1.deleteWitnessUtxoForNonSegwitInputs)(psbtFromHsm);
            if (skipNonWitnessUtxo) {
                psbt = parentPsbt;
            }
            psbt.combine(psbtFromHsm);
            assertValidate(psbt);
            assert.doesNotThrow(() => psbt.finalizeAllInputs().extractTransaction());
        });
    });
}
function runBuildPsbtWithSDK(network, inputs, outputs) {
    const coin = (0, src_1.getNetworkName)(network);
    it(`check that building a PSBT while skipping nonWitnessUtxo works - ${coin}`, async function () {
        const psbtWithNonWitness = src_1.testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
            signers: {
                signerName: 'user',
                cosignerName: 'bitgo',
            },
        });
        const psbtWithoutNonWitness = src_1.testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
            signers: {
                signerName: 'user',
                cosignerName: 'bitgo',
            },
            skipNonWitnessUtxo: true,
        });
        const clonedPsbt = (0, bitgo_1.clonePsbtWithoutNonWitnessUtxo)(psbtWithNonWitness);
        assert.deepStrictEqual(psbtWithoutNonWitness.toHex(), clonedPsbt.toHex());
    });
}
(0, src_1.getNetworkList)()
    .filter((v) => (0, src_1.isMainnet)(v) && v !== src_1.networks.bitcoinsv)
    .forEach((network) => {
    runExtractP2msOnlyHalfSignedTxTest(network, halfSignedInputs.filter((input) => (0, outputScripts_1.isSupportedScriptType)(network, input.scriptType)), halfSignedOutputs.filter((output) => (0, outputScripts_1.isSupportedScriptType)(network, output.scriptType)));
    const supportedPsbtInputs = psbtInputs.filter((input) => (0, outputScripts_1.isSupportedScriptType)(network, input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType));
    const supportedPsbtOutputs = psbtOutputs.filter((output) => (0, outputScripts_1.isSupportedScriptType)(network, output.scriptType));
    [false, true].forEach((skipNonWitnessUtxo) => runBuildSignSendFlowTest(network, supportedPsbtInputs, supportedPsbtOutputs, { skipNonWitnessUtxo }));
    runBuildPsbtWithSDK(network, supportedPsbtInputs, supportedPsbtOutputs);
});
describe('isTransactionWithKeyPathSpendInput', function () {
    describe('transaction input', function () {
        it('empty inputs', function () {
            const tx = src_1.testutil.constructTxnBuilder([], [], network, rootWalletKeys, 'unsigned').buildIncomplete();
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx), false);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx.ins), false);
        });
        it('taprootKeyPath inputs successfully triggers', function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'taprootKeyPathSpend', value: BigInt(1e8) },
                { scriptType: 'p2sh', value: BigInt(1e8) },
            ], [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }], network, rootWalletKeys, 'fullsigned');
            assert(psbt.validateSignaturesOfAllInputs());
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx), true);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx.ins), true);
        });
        it('no taprootKeyPath inputs successfully does not trigger', function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'p2trMusig2', value: BigInt(1e8) },
                { scriptType: 'p2sh', value: BigInt(1e8) },
            ], [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }], network, rootWalletKeys, 'fullsigned');
            assert(psbt.validateSignaturesOfAllInputs());
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx), false);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx.ins), false);
        });
        it('unsigned inputs successfully fail', function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'p2wsh', value: BigInt(1e8) },
                { scriptType: 'p2sh', value: BigInt(1e8) },
            ], [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }], network, rootWalletKeys, 'unsigned');
            const tx = psbt.getUnsignedTx();
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx), false);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(tx.ins), false);
        });
    });
    describe('psbt input', function () {
        it('empty inputs', function () {
            const psbt = src_1.testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(psbt), false);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(psbt.data.inputs), false);
        });
        it('psbt with taprootKeyPathInputs successfully triggers', function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'taprootKeyPathSpend', value: BigInt(1e8) },
                { scriptType: 'p2sh', value: BigInt(1e8) },
            ], [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }], network, rootWalletKeys, 'unsigned');
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(psbt), true);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(psbt.data.inputs), true);
        });
        it('psbt without taprootKeyPathInputs successfully does not trigger', function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'p2wsh', value: BigInt(1e8) },
                { scriptType: 'p2sh', value: BigInt(1e8) },
            ], [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }], network, rootWalletKeys, 'halfsigned');
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(psbt), false);
            assert.strictEqual((0, bitgo_1.isTransactionWithKeyPathSpendInput)(psbt.data.inputs), false);
        });
    });
});
describe('Parse PSBT', function () {
    it('p2shP2pk parsing', function () {
        var _a;
        const signer = rootWalletKeys['user'];
        const psbt = (0, bitgo_1.createPsbtForNetwork)({ network: src_1.networks.bitcoincash });
        const unspent = (0, testutil_1.mockReplayProtectionUnspent)(src_1.networks.bitcoincash, BigInt(1e8), { key: signer });
        const { redeemScript } = (0, outputScripts_1.createOutputScriptP2shP2pk)(signer.publicKey);
        assert(redeemScript);
        (0, bitgo_1.addReplayProtectionUnspentToPsbt)(psbt, unspent, redeemScript);
        (0, bitgo_1.addWalletOutputToPsbt)(psbt, rootWalletKeys, (0, bitgo_1.getInternalChainCode)('p2sh'), 0, BigInt(1e8 - 10000));
        const input = psbt.data.inputs[0];
        let parsed = (0, bitgo_1.parsePsbtInput)(input);
        assert.strictEqual(parsed.scriptType, 'p2shP2pk');
        assert.strictEqual(parsed.signatures, undefined);
        assert.strictEqual(parsed.publicKeys.length, 1);
        assert.ok(parsed.publicKeys[0].length === 33);
        assert.ok(parsed.pubScript.equals(redeemScript));
        psbt.signAllInputs(signer);
        assert.ok(psbt.validateSignaturesOfAllInputs());
        parsed = (0, bitgo_1.parsePsbtInput)(input);
        assert.strictEqual(parsed.scriptType, 'p2shP2pk');
        assert.strictEqual((_a = parsed.signatures) === null || _a === void 0 ? void 0 : _a.length, 1);
        assert.strictEqual(parsed.publicKeys.length, 1);
        assert.ok(parsed.publicKeys[0].length === 33);
        assert.ok(parsed.pubScript.equals(redeemScript));
        const sighash = parsed.signatures[0][parsed.signatures[0].length - 1];
        assert.strictEqual(sighash, (0, bitgo_1.getDefaultSigHash)(psbt.network));
    });
    it('fail to parse finalized psbt', function () {
        const unspents = (0, testutil_2.mockUnspents)(rootWalletKeys, getScriptTypes2Of3().map((inputType) => inputType), BigInt('10000000000000000'), network);
        const txBuilderParams = {
            signer: 'user',
            cosigner: 'bitgo',
            amountType: 'bigint',
            outputType: 'p2sh',
            signatureTarget: 'fullsigned',
            network,
            changeIndex: CHANGE_INDEX,
            fee: FEE,
        };
        const tx = (0, psbtUtil_1.constructTransactionUsingTxBuilder)(unspents, rootWalletKeys, txBuilderParams);
        const psbt = (0, bitgo_1.toWalletPsbt)(tx, (0, psbtUtil_1.toBigInt)(unspents), rootWalletKeys);
        psbt.validateSignaturesOfAllInputs();
        psbt.finalizeAllInputs();
        psbt.data.inputs.forEach((input, i) => {
            assert.throws(() => (0, bitgo_1.parsePsbtInput)(input), (e) => e.message === 'Finalized PSBT parsing is not supported');
        });
    });
    it('fail to parse input with more than one script type metadata', function () {
        const unspents = (0, testutil_2.mockUnspents)(rootWalletKeys, ['p2tr'], BigInt('10000000000000000'), network);
        const txBuilderParams = {
            signer: 'user',
            cosigner: 'bitgo',
            amountType: 'bigint',
            outputType: 'p2sh',
            signatureTarget: 'halfsigned',
            network,
            changeIndex: CHANGE_INDEX,
            fee: FEE,
        };
        const txP2tr = (0, psbtUtil_1.constructTransactionUsingTxBuilder)([unspents[0]], rootWalletKeys, txBuilderParams);
        const psbtP2tr = (0, bitgo_1.toWalletPsbt)(txP2tr, (0, psbtUtil_1.toBigInt)([unspents[0]]), rootWalletKeys);
        const walletKeys = rootWalletKeys.deriveForChainAndIndex((0, bitgo_1.getExternalChainCode)('p2sh'), 0);
        const { redeemScript } = (0, outputScripts_1.createOutputScript2of3)(walletKeys.publicKeys, 'p2sh');
        psbtP2tr.updateInput(0, { redeemScript });
        assert.throws(() => (0, bitgo_1.parsePsbtInput)(psbtP2tr.data.inputs[0]), (e) => e.message === 'Found both p2sh and taprootScriptPath PSBT metadata.');
    });
    it('fail to parse more than one tap leaf script per input', function () {
        const unspents = (0, testutil_2.mockUnspents)(rootWalletKeys, ['p2tr'], BigInt('10000000000000000'), network);
        const txBuilderParams = {
            signer: 'user',
            cosigner: 'bitgo',
            amountType: 'bigint',
            outputType: 'p2sh',
            signatureTarget: 'halfsigned',
            network,
            changeIndex: CHANGE_INDEX,
            fee: FEE,
        };
        const txP2tr1 = (0, psbtUtil_1.constructTransactionUsingTxBuilder)([unspents[0]], rootWalletKeys, txBuilderParams);
        const psbtP2tr1 = (0, bitgo_1.toWalletPsbt)(txP2tr1, (0, psbtUtil_1.toBigInt)([unspents[0]]), rootWalletKeys);
        const txBuilderParams2 = {
            signer: 'user',
            cosigner: 'backup',
            amountType: 'bigint',
            outputType: 'p2sh',
            signatureTarget: 'halfsigned',
            network,
            changeIndex: CHANGE_INDEX,
            fee: FEE,
        };
        const txP2tr2 = (0, psbtUtil_1.constructTransactionUsingTxBuilder)([unspents[0]], rootWalletKeys, txBuilderParams2);
        const psbtP2tr2 = (0, bitgo_1.toWalletPsbt)(txP2tr2, (0, psbtUtil_1.toBigInt)([unspents[0]]), rootWalletKeys);
        const txBuilderParams3 = {
            signer: 'user',
            cosigner: 'bitgo',
            amountType: 'bigint',
            outputType: 'p2sh',
            signatureTarget: 'unsigned',
            network,
            changeIndex: CHANGE_INDEX,
            fee: FEE,
        };
        const txP2tr3 = (0, psbtUtil_1.constructTransactionUsingTxBuilder)([unspents[0]], rootWalletKeys, txBuilderParams3);
        const psbtP2tr3 = (0, bitgo_1.toWalletPsbt)(txP2tr3, (0, psbtUtil_1.toBigInt)([unspents[0]]), rootWalletKeys);
        if (psbtP2tr1.data.inputs[0].tapLeafScript && psbtP2tr2.data.inputs[0].tapLeafScript) {
            const tapLeafScripts = [psbtP2tr1.data.inputs[0].tapLeafScript[0], psbtP2tr2.data.inputs[0].tapLeafScript[0]];
            psbtP2tr3.updateInput(0, { tapLeafScript: tapLeafScripts });
            assert.throws(() => (0, bitgo_1.parsePsbtInput)(psbtP2tr3.data.inputs[0]), (e) => e.message === 'Bitgo only supports a single tap leaf script per input.');
        }
    });
});
describe('isPsbt', function () {
    function isPsbtForNetwork(n) {
        describe(`network: ${(0, src_1.getNetworkName)(n)}`, function () {
            const psbt = (0, bitgo_1.createPsbtForNetwork)({ network: n });
            it('should return true for a valid PSBT', function () {
                const psbtBuff = psbt.toBuffer();
                assert.strictEqual((0, bitgo_1.isPsbt)(psbtBuff), true);
                assert.strictEqual((0, bitgo_1.isPsbt)(psbtBuff.toString('hex')), true);
            });
            it('should return false for a transaction', function () {
                assert.strictEqual((0, bitgo_1.isPsbt)(psbt.getUnsignedTx().toBuffer()), false);
            });
            it('should return false for a truncated magic word', function () {
                const hex = psbt.toBuffer().slice(0, 3);
                assert.strictEqual((0, bitgo_1.isPsbt)(hex), false);
                assert.strictEqual((0, bitgo_1.isPsbt)(Buffer.from(hex)), false);
            });
            it('should return false for a valid PSBT with an invalid magic', function () {
                const buffer = psbt.toBuffer();
                buffer.writeUInt8(0x00, 1);
                assert.strictEqual((0, bitgo_1.isPsbt)(psbt.getUnsignedTx().toBuffer()), false);
            });
            it('should return false for a valid PSBT with an invalid separator', function () {
                const buffer = psbt.toBuffer();
                buffer.writeUInt8(0xfe, 4);
                assert.strictEqual((0, bitgo_1.isPsbt)(psbt.getUnsignedTx().toBuffer()), false);
            });
            it('should return false for a random buffer', function () {
                const random = 'deadbeaf';
                const buffer = Buffer.from(random, 'hex');
                assert.strictEqual((0, bitgo_1.isPsbt)(random), false);
                assert.strictEqual((0, bitgo_1.isPsbt)(buffer), false);
            });
            it('should return true if buffer is changed after the separator', function () {
                const buffer = psbt.toBuffer();
                buffer.writeUInt8(0x00, 5);
                assert.strictEqual((0, bitgo_1.isPsbt)(buffer), true);
            });
        });
    }
    (0, src_1.getNetworkList)().forEach((n) => isPsbtForNetwork(n));
});
describe('Update incomplete psbt', function () {
    function removeFromPsbt(psbtHex, network, remove) {
        const utxoPsbt = (0, bitgo_1.createPsbtFromHex)(psbtHex, network);
        const psbt = (0, bitgo_1.createPsbtForNetwork)({ network: utxoPsbt.network });
        const txInputs = utxoPsbt.txInputs;
        utxoPsbt.data.inputs.map((input, ii) => {
            const { hash, index } = txInputs[ii];
            if (remove.input && ii === remove.input.index) {
                delete input[remove.input.fieldToRemove];
            }
            psbt.addInput({ ...input, hash, index });
        });
        const txOutputs = utxoPsbt.txOutputs;
        utxoPsbt.data.outputs.map((output, ii) => {
            if (remove.output && remove.output.index === ii) {
                delete output[remove.output.fieldToRemove];
            }
            psbt.addOutput({ ...output, script: txOutputs[ii].script, value: txOutputs[ii].value });
        });
        return psbt;
    }
    function signAllInputs(psbt, { assertValidSignaturesAndExtractable = true } = {}) {
        psbt.data.inputs.forEach((input, inputIndex) => {
            const parsedInput = (0, bitgo_1.parsePsbtInput)(input);
            if (parsedInput.scriptType === 'taprootKeyPathSpend') {
                psbt.setInputMusig2NonceHD(inputIndex, rootWalletKeys[signer]);
                psbt.setInputMusig2NonceHD(inputIndex, rootWalletKeys[cosigner]);
            }
            if (parsedInput.scriptType === 'p2shP2pk') {
                psbt.signInput(inputIndex, testutil_1.replayProtectionKeyPair);
            }
            else {
                psbt.signInputHD(inputIndex, rootWalletKeys[signer]);
                psbt.signInputHD(inputIndex, rootWalletKeys[cosigner]);
            }
        });
        if (assertValidSignaturesAndExtractable) {
            assert.ok(psbt.validateSignaturesOfAllInputs());
            psbt.finalizeAllInputs();
            const txExtracted = psbt.extractTransaction();
            assert.ok(txExtracted);
        }
    }
    let psbtHex;
    let unspents;
    const signer = 'user';
    const cosigner = 'bitgo';
    const scriptTypes = [...outputScripts_1.scriptTypes2Of3, 'p2shP2pk'];
    const outputValue = BigInt((2e8 * scriptTypes.length - 100) / 5);
    const outputs = [
        { chain: (0, bitgo_1.getExternalChainCode)('p2sh'), index: 88, value: outputValue },
        { chain: (0, bitgo_1.getExternalChainCode)('p2shP2wsh'), index: 89, value: outputValue },
        { chain: (0, bitgo_1.getExternalChainCode)('p2wsh'), index: 90, value: outputValue },
        { chain: (0, bitgo_1.getExternalChainCode)('p2tr'), index: 91, value: outputValue },
        { chain: (0, bitgo_1.getExternalChainCode)('p2trMusig2'), index: 92, value: outputValue },
    ];
    before(function () {
        unspents = (0, testutil_2.mockUnspents)(rootWalletKeys, scriptTypes, BigInt(2e8), network);
        const psbt = (0, Musig2Util_1.constructPsbt)(unspents, rootWalletKeys, signer, cosigner, outputs);
        psbtHex = psbt.toHex();
    });
    it('can create a sign-able psbt from an unsigned transaction extracted from the psbt', function () {
        if (true) {
            return;
        }
        const psbtOrig = (0, bitgo_1.createPsbtFromHex)(psbtHex, network);
        const tx = psbtOrig.getUnsignedTx();
        const psbt = (0, bitgo_1.createPsbtFromTransaction)(tx, unspents.map((u) => (0, bitgo_1.toPrevOutput)(u, network)));
        unspents.forEach((u, inputIndex) => {
            if ((0, bitgo_1.isWalletUnspent)(u)) {
                (0, bitgo_1.updateWalletUnspentForPsbt)(psbt, inputIndex, u, rootWalletKeys, signer, cosigner);
            }
            else {
                const { redeemScript } = (0, outputScripts_1.createOutputScriptP2shP2pk)(testutil_1.replayProtectionKeyPair.publicKey);
                (0, bitgo_1.updateReplayProtectionUnspentToPsbt)(psbt, inputIndex, u, redeemScript);
            }
        });
        signAllInputs(psbt);
    });
    const componentsOnEachInputScriptType = {
        p2sh: ['nonWitnessUtxo', 'redeemScript', 'bip32Derivation'],
        p2shP2wsh: ['witnessUtxo', 'bip32Derivation', 'redeemScript', 'witnessScript'],
        p2wsh: ['witnessUtxo', 'witnessScript', 'bip32Derivation'],
        p2tr: ['witnessUtxo', 'tapLeafScript', 'tapBip32Derivation'],
        p2trMusig2: ['witnessUtxo', 'tapBip32Derivation', 'tapInternalKey', 'tapMerkleRoot', 'unknownKeyVals'],
        p2shP2pk: ['redeemScript', 'nonWitnessUtxo'],
    };
    const p2trComponents = ['tapTree', 'tapInternalKey', 'tapBip32Derivation'];
    const componentsOnEachOutputScriptType = {
        p2sh: ['bip32Derivation', 'redeemScript'],
        p2shP2wsh: ['bip32Derivation', 'witnessScript', 'redeemScript'],
        p2wsh: ['bip32Derivation', 'witnessScript'],
        p2tr: p2trComponents,
        p2trMusig2: p2trComponents,
        p2shP2pk: [],
    };
    scriptTypes.forEach((scriptType, i) => {
        componentsOnEachInputScriptType[scriptType].forEach((inputComponent) => {
            it(`[${scriptType}] missing ${inputComponent} on input should succeed in fully signing unsigned psbt after update`, function () {
                const psbt = removeFromPsbt(psbtHex, network, { input: { index: i, fieldToRemove: inputComponent } });
                const unspent = unspents[i];
                if ((0, bitgo_1.isWalletUnspent)(unspent)) {
                    (0, bitgo_1.updateWalletUnspentForPsbt)(psbt, i, unspent, rootWalletKeys, signer, cosigner);
                }
                else {
                    const { redeemScript } = (0, outputScripts_1.createOutputScriptP2shP2pk)(testutil_1.replayProtectionKeyPair.publicKey);
                    assert.ok(redeemScript);
                    (0, bitgo_1.updateReplayProtectionUnspentToPsbt)(psbt, i, unspent, redeemScript);
                }
                signAllInputs(psbt);
            });
        });
        componentsOnEachOutputScriptType[scriptType].forEach((outputComponent) => {
            it(`[${scriptType}] missing ${outputComponent} on output should produce same hex as fully hydrated after update`, function () {
                const psbt = removeFromPsbt(psbtHex, network, { output: { index: i, fieldToRemove: outputComponent } });
                (0, bitgo_1.updateWalletOutputForPsbt)(psbt, rootWalletKeys, i, outputs[i].chain, outputs[i].index);
                assert.strictEqual(psbt.toHex(), psbtHex);
            });
        });
    });
});
describe('Psbt from transaction using wallet unspents', function () {
    function runTestSignUnspents({ inputScriptTypes, outputScriptType, signer, cosigner, amountType, testOutputAmount, signatureTarget, }) {
        it(`can be signed [inputs=${inputScriptTypes} signer=${signer} cosigner=${cosigner} amountType=${amountType} signatureTarget=${signatureTarget}]`, function () {
            const unspents = (0, testutil_2.mockUnspents)(rootWalletKeys, inputScriptTypes, testOutputAmount, network);
            // const txBuilderParams = { network, changeIndex: CHANGE_INDEX, fee: FEE };
            const txBuilderParams = {
                signer,
                cosigner,
                amountType,
                outputType: outputScriptType,
                signatureTarget: signatureTarget,
                network,
                changeIndex: CHANGE_INDEX,
                fee: FEE,
            };
            const tx = (0, psbtUtil_1.constructTransactionUsingTxBuilder)(unspents, rootWalletKeys, txBuilderParams);
            const unspentBigInt = (0, psbtUtil_1.toBigInt)(unspents);
            const psbt = (0, bitgo_1.toWalletPsbt)(tx, unspentBigInt, rootWalletKeys);
            (0, psbtUtil_1.validatePsbtParsing)(tx, psbt, unspentBigInt, signatureTarget);
            // Check that the correct unspent corresponds to the input
            unspentBigInt.forEach((unspent, inputIndex) => {
                const otherUnspent = inputIndex === 0 ? unspentBigInt[1] : unspentBigInt[0];
                assert.strictEqual((0, bitgo_1.psbtIncludesUnspentAtIndex)(psbt, inputIndex, unspent.id), true);
                assert.strictEqual((0, bitgo_1.psbtIncludesUnspentAtIndex)(psbt, inputIndex, otherUnspent.id), false);
                (0, bitgo_1.updateWalletUnspentForPsbt)(psbt, inputIndex, unspent, rootWalletKeys, signer, cosigner);
            });
            if (signatureTarget !== 'fullsigned') {
                // Now signing to make it fully signed psbt.
                // So it will be easy to verify its validity with another similar tx to be built with tx builder.
                (0, psbtUtil_1.signPsbt)(psbt, unspentBigInt, rootWalletKeys, signer, cosigner, signatureTarget);
            }
            assert.deepStrictEqual(psbt.validateSignaturesOfAllInputs(), true);
            psbt.finalizeAllInputs();
            const txFromPsbt = psbt.extractTransaction();
            const txBuilderParams2 = {
                signer,
                cosigner,
                amountType,
                outputType: outputScriptType,
                signatureTarget: 'fullsigned',
                network,
                changeIndex: CHANGE_INDEX,
                fee: FEE,
            };
            // New legacy tx resembles the signed psbt.
            const txFromTxBuilder = (0, psbtUtil_1.constructTransactionUsingTxBuilder)(unspents, rootWalletKeys, txBuilderParams2);
            assert.deepStrictEqual(txFromPsbt.getHash(), txFromTxBuilder.getHash());
        });
    }
    function getInputScripts() {
        return getScriptTypes2Of3().flatMap((t) => {
            return getScriptTypes2Of3().flatMap((lastType) => {
                return [[t, t, lastType]];
            });
        });
    }
    function getSignerPairs(containsTaprootInput) {
        const signaturePairs = [['user', 'bitgo']];
        if (containsTaprootInput) {
            signaturePairs.push(['user', 'backup']);
        }
        return signaturePairs;
    }
    ['unsigned', 'halfsigned', 'fullsigned'].forEach((signatureTarget) => {
        getInputScripts().forEach((inputScriptTypes) => {
            getSignerPairs(inputScriptTypes.includes('p2tr')).forEach(([signer, cosigner]) => {
                runTestSignUnspents({
                    inputScriptTypes,
                    outputScriptType: 'p2sh',
                    signer,
                    cosigner,
                    amountType: 'number',
                    testOutputAmount: transaction_util_1.defaultTestOutputAmount,
                    signatureTarget,
                });
                runTestSignUnspents({
                    inputScriptTypes,
                    outputScriptType: 'p2sh',
                    signer,
                    cosigner,
                    amountType: 'bigint',
                    testOutputAmount: BigInt('10000000000000000'),
                    signatureTarget,
                });
            });
        });
    });
});
function testUtxoPsbt(coinNetwork) {
    describe(`Testing UtxoPsbt (de)serialization for ${(0, src_1.getNetworkName)(coinNetwork)} network`, function () {
        let psbt;
        let psbtHex;
        let unspents;
        before(async function () {
            unspents = (0, testutil_2.mockUnspents)(rootWalletKeys, ['p2sh'], BigInt('10000000000000'), coinNetwork);
            const txBuilderParams = {
                signer: 'user',
                cosigner: 'bitgo',
                amountType: 'bigint',
                outputType: 'p2sh',
                signatureTarget: 'fullsigned',
                network: coinNetwork,
                changeIndex: CHANGE_INDEX,
                fee: FEE,
            };
            const tx = (0, psbtUtil_1.constructTransactionUsingTxBuilder)(unspents, rootWalletKeys, txBuilderParams);
            psbt = (0, bitgo_1.toWalletPsbt)(tx, (0, psbtUtil_1.toBigInt)(unspents), rootWalletKeys);
            if (coinNetwork === src_1.networks.zcash) {
                psbt.setDefaultsForVersion(network, 450);
            }
            psbtHex = psbt.toHex();
        });
        it('should be able to clone psbt', async function () {
            const clone = psbt.clone();
            assert.deepStrictEqual(clone.toBuffer(), psbt.toBuffer());
        });
        it('should be able to round-trip', async function () {
            assert.deepStrictEqual((0, bitgo_1.createPsbtFromHex)(psbtHex, coinNetwork, false).toBuffer(), psbt.toBuffer());
        });
        it('should be able to get transaction info from psbt', function () {
            const txInfo = (0, bitgo_1.getTransactionAmountsFromPsbt)(psbt);
            assert.strictEqual(txInfo.fee, FEE);
            assert.strictEqual(txInfo.inputCount, unspents.length);
            assert.strictEqual(txInfo.inputAmount, BigInt('10000000000000') * BigInt(unspents.length));
            assert.strictEqual(txInfo.outputAmount, BigInt('10000000000000') * BigInt(unspents.length) - FEE);
            assert.strictEqual(txInfo.outputCount, psbt.data.outputs.length);
        });
        function deserializeBip32PathsCorrectly(bip32PathsAbsolute) {
            function checkDerivationPrefix(bip32Derivation) {
                const path = bip32Derivation.path.split('/');
                const prefix = bip32PathsAbsolute ? 'm' : '0';
                assert(path[0] === prefix);
            }
            it(`should deserialize PSBT bip32Derivations with paths ${bip32PathsAbsolute ? '' : 'not '} absolute`, async function () {
                const deserializedPsbt = (0, bitgo_1.createPsbtFromHex)(psbtHex, coinNetwork, bip32PathsAbsolute);
                assert(deserializedPsbt);
                deserializedPsbt.data.inputs.forEach((input) => {
                    var _a, _b;
                    (_a = input === null || input === void 0 ? void 0 : input.bip32Derivation) === null || _a === void 0 ? void 0 : _a.forEach((derivation) => checkDerivationPrefix(derivation));
                    (_b = input === null || input === void 0 ? void 0 : input.tapBip32Derivation) === null || _b === void 0 ? void 0 : _b.forEach((derivation) => checkDerivationPrefix(derivation));
                });
            });
        }
        [true, false].forEach((bip32PathsAbsolute) => deserializeBip32PathsCorrectly(bip32PathsAbsolute));
    });
}
[
    src_1.networks.bitcoin,
    src_1.networks.zcash,
    src_1.networks.dash,
    src_1.networks.dogecoin,
    src_1.networks.litecoin,
    src_1.networks.bithereum,
    src_1.networks.safecoin,
    src_1.networks.komodo,
    src_1.networks.zelcash,
    src_1.networks.flux,
    src_1.networks.zero,
    src_1.networks.snowgem,
    src_1.networks.gemlink,
    src_1.networks.commercium,
    src_1.networks.zclassic,
    src_1.networks.bzedge,
    src_1.networks.genesis,
    src_1.networks.bitcoinzero,
    src_1.networks.bitcoinz,
    src_1.networks.hush,
    src_1.networks.ravencoin,
    src_1.networks.bitcore,
    src_1.networks.zcoin,
    src_1.networks.axe,
    src_1.networks.digibyte,
    src_1.networks.sinovate,
    src_1.networks.ilcoin,
    src_1.networks.raptoreum,
    src_1.networks.vertcoin,
    src_1.networks.clore,
].forEach((coinNetwork) => testUtxoPsbt(coinNetwork));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHNidC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvYml0Z28vcHNidC9Qc2J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBRWpDLHNDQUFtSDtBQUNuSCw4Q0FtQzRCO0FBQzVCLG9FQU8wQztBQUUxQyxvREFTK0I7QUFFL0IsNkRBQWlFO0FBQ2pFLHlDQU1vQjtBQUVwQixvREFBcUQ7QUFDckQsNkNBQTZDO0FBRTdDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQztBQUN6QixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFNeEIsTUFBTSxPQUFPLEdBQUcsY0FBUSxDQUFDLE9BQU8sQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxJQUFBLCtCQUFvQixHQUFFLENBQUM7QUFFOUMsU0FBUyxrQkFBa0I7SUFDekIsMkVBQTJFO0lBQzNFLDZEQUE2RDtJQUM3RCxPQUFPLHFCQUFhLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsVUFBVSxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQzNGLENBQUM7QUFFRCxNQUFNLGdCQUFnQixHQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdEYsVUFBVTtJQUNWLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDO0NBQ3BCLENBQUMsQ0FBQyxDQUFDO0FBQ0osTUFBTSxpQkFBaUIsR0FBRyw0QkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUV0RyxNQUFNLFVBQVUsR0FBRywyQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FB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LGNBQVEsQ0FBQyxRQUFRO0lBQ2pCLGNBQVEsQ0FBQyxNQUFNO0lBQ2YsY0FBUSxDQUFDLFNBQVM7SUFDbEIsY0FBUSxDQUFDLFFBQVE7SUFDakIsY0FBUSxDQUFDLEtBQUs7Q0FDZixDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQ3hCLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5cclxuaW1wb3J0IHsgTmV0d29yaywgZ2V0TmV0d29ya05hbWUsIG5ldHdvcmtzLCBnZXROZXR3b3JrTGlzdCwgdGVzdHV0aWwsIGlzTWFpbm5ldCwgVHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi8uLi9zcmMnO1xyXG5pbXBvcnQge1xyXG4gIGdldEV4dGVybmFsQ2hhaW5Db2RlLFxyXG4gIG91dHB1dFNjcmlwdHMsXHJcbiAgS2V5TmFtZSxcclxuICBVdHhvUHNidCxcclxuICBaY2FzaFBzYnQsXHJcbiAgY3JlYXRlUHNidEZyb21IZXgsXHJcbiAgcGFyc2VQc2J0SW5wdXQsXHJcbiAgdG9XYWxsZXRQc2J0LFxyXG4gIGNyZWF0ZVBzYnRGb3JOZXR3b3JrLFxyXG4gIGFkZFJlcGxheVByb3RlY3Rpb25VbnNwZW50VG9Qc2J0LFxyXG4gIGFkZFdhbGxldE91dHB1dFRvUHNidCxcclxuICBnZXRJbnRlcm5hbENoYWluQ29kZSxcclxuICBVdHhvVHJhbnNhY3Rpb24sXHJcbiAgaXNUcmFuc2FjdGlvbldpdGhLZXlQYXRoU3BlbmRJbnB1dCxcclxuICBpc1BzYnQsXHJcbiAgcHNidEluY2x1ZGVzVW5zcGVudEF0SW5kZXgsXHJcbiAgdXBkYXRlV2FsbGV0VW5zcGVudEZvclBzYnQsXHJcbiAgY3JlYXRlUHNidEZyb21UcmFuc2FjdGlvbixcclxuICB0b1ByZXZPdXRwdXQsXHJcbiAgdXBkYXRlUmVwbGF5UHJvdGVjdGlvblVuc3BlbnRUb1BzYnQsXHJcbiAgVW5zcGVudCxcclxuICBpc1dhbGxldFVuc3BlbnQsXHJcbiAgdXBkYXRlV2FsbGV0T3V0cHV0Rm9yUHNidCxcclxuICBleHRyYWN0UDJtc09ubHlIYWxmU2lnbmVkVHgsXHJcbiAgdG9PdXRwdXQsXHJcbiAgY3JlYXRlVHJhbnNhY3Rpb25CdWlsZGVyRnJvbVRyYW5zYWN0aW9uLFxyXG4gIGFkZFhwdWJzVG9Qc2J0LFxyXG4gIGNsb25lUHNidFdpdGhvdXROb25XaXRuZXNzVXR4byxcclxuICBkZWxldGVXaXRuZXNzVXR4b0Zvck5vblNlZ3dpdElucHV0cyxcclxuICBnZXRQc2J0SW5wdXRTY3JpcHRUeXBlLFxyXG4gIHdpdGhVbnNhZmVOb25TZWd3aXQsXHJcbiAgZ2V0VHJhbnNhY3Rpb25BbW91bnRzRnJvbVBzYnQsXHJcbiAgV2FsbGV0VW5zcGVudCxcclxuICBnZXREZWZhdWx0U2lnSGFzaCxcclxufSBmcm9tICcuLi8uLi8uLi9zcmMvYml0Z28nO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZU91dHB1dFNjcmlwdDJvZjMsXHJcbiAgY3JlYXRlT3V0cHV0U2NyaXB0UDJzaFAycGssXHJcbiAgaXNTdXBwb3J0ZWRTY3JpcHRUeXBlLFxyXG4gIFNjcmlwdFR5cGUyT2YzLFxyXG4gIFNjcmlwdFR5cGVQMnNoUDJwayxcclxuICBzY3JpcHRUeXBlczJPZjMsXHJcbn0gZnJvbSAnLi4vLi4vLi4vc3JjL2JpdGdvL291dHB1dFNjcmlwdHMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBnZXREZWZhdWx0V2FsbGV0S2V5cyxcclxuICBJbnB1dCxcclxuICBpbnB1dFNjcmlwdFR5cGVzLFxyXG4gIG1vY2tSZXBsYXlQcm90ZWN0aW9uVW5zcGVudCxcclxuICBPdXRwdXQsXHJcbiAgb3V0cHV0U2NyaXB0VHlwZXMsXHJcbiAgcmVwbGF5UHJvdGVjdGlvbktleVBhaXIsXHJcbiAgc2lnbkFsbFR4bklucHV0cyxcclxufSBmcm9tICcuLi8uLi8uLi9zcmMvdGVzdHV0aWwnO1xyXG5cclxuaW1wb3J0IHsgZGVmYXVsdFRlc3RPdXRwdXRBbW91bnQgfSBmcm9tICcuLi8uLi90cmFuc2FjdGlvbl91dGlsJztcclxuaW1wb3J0IHtcclxuICBhc3NlcnRFcXVhbFRyYW5zYWN0aW9ucyxcclxuICBjb25zdHJ1Y3RUcmFuc2FjdGlvblVzaW5nVHhCdWlsZGVyLFxyXG4gIHNpZ25Qc2J0LFxyXG4gIHRvQmlnSW50LFxyXG4gIHZhbGlkYXRlUHNidFBhcnNpbmcsXHJcbn0gZnJvbSAnLi9wc2J0VXRpbCc7XHJcblxyXG5pbXBvcnQgeyBtb2NrVW5zcGVudHMgfSBmcm9tICcuLi8uLi8uLi9zcmMvdGVzdHV0aWwnO1xyXG5pbXBvcnQgeyBjb25zdHJ1Y3RQc2J0IH0gZnJvbSAnLi9NdXNpZzJVdGlsJztcclxuXHJcbmNvbnN0IENIQU5HRV9JTkRFWCA9IDEwMDtcclxuY29uc3QgRkVFID0gQmlnSW50KDEwMCk7XHJcblxyXG5leHBvcnQgdHlwZSBBbW91bnRUeXBlID0gJ251bWJlcicgfCAnYmlnaW50JztcclxuZXhwb3J0IHR5cGUgSW5wdXRUeXBlID0gb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlMk9mMztcclxuZXhwb3J0IHR5cGUgU2lnbmF0dXJlVGFyZ2V0VHlwZSA9ICd1bnNpZ25lZCcgfCAnaGFsZnNpZ25lZCcgfCAnZnVsbHNpZ25lZCc7XHJcblxyXG5jb25zdCBuZXR3b3JrID0gbmV0d29ya3MuYml0Y29pbjtcclxuY29uc3Qgcm9vdFdhbGxldEtleXMgPSBnZXREZWZhdWx0V2FsbGV0S2V5cygpO1xyXG5cclxuZnVuY3Rpb24gZ2V0U2NyaXB0VHlwZXMyT2YzKCkge1xyXG4gIC8vIEZJWE1FKEJHLTY2OTQxKTogcDJ0ck11c2lnMiBzaWduaW5nIGRvZXMgbm90IHdvcmsgaW4gdGhpcyB0ZXN0IHN1aXRlIHlldFxyXG4gIC8vICBiZWNhdXNlIHRoZSB0ZXN0IHN1aXRlIGlzIHdyaXR0ZW4gd2l0aCBUcmFuc2FjdGlvbkJ1aWxkZXJcclxuICByZXR1cm4gb3V0cHV0U2NyaXB0cy5zY3JpcHRUeXBlczJPZjMuZmlsdGVyKChzY3JpcHRUeXBlKSA9PiBzY3JpcHRUeXBlICE9PSAncDJ0ck11c2lnMicpO1xyXG59XHJcblxyXG5jb25zdCBoYWxmU2lnbmVkSW5wdXRzID0gKFsncDJzaCcsICdwMndzaCcsICdwMnNoUDJ3c2gnXSBhcyBjb25zdCkubWFwKChzY3JpcHRUeXBlKSA9PiAoe1xyXG4gIHNjcmlwdFR5cGUsXHJcbiAgdmFsdWU6IEJpZ0ludCgxMDAwKSxcclxufSkpO1xyXG5jb25zdCBoYWxmU2lnbmVkT3V0cHV0cyA9IG91dHB1dFNjcmlwdFR5cGVzLm1hcCgoc2NyaXB0VHlwZSkgPT4gKHsgc2NyaXB0VHlwZSwgdmFsdWU6IEJpZ0ludCg1MDApIH0pKTtcclxuXHJcbmNvbnN0IHBzYnRJbnB1dHMgPSBpbnB1dFNjcmlwdFR5cGVzLm1hcCgoc2NyaXB0VHlwZSkgPT4gKHsgc2NyaXB0VHlwZSwgdmFsdWU6IEJpZ0ludCgxMDAwKSB9KSk7XHJcbmNvbnN0IHBzYnRPdXRwdXRzID0gb3V0cHV0U2NyaXB0VHlwZXMubWFwKChzY3JpcHRUeXBlKSA9PiAoeyBzY3JpcHRUeXBlLCB2YWx1ZTogQmlnSW50KDkwMCkgfSkpO1xyXG5cclxuZGVzY3JpYmUoJ1BzYnQgTWlzYycsIGZ1bmN0aW9uICgpIHtcclxuICBpdCgnZmFpbCB0byBmaW5hbGlzZSBwMnRyIHNpZ2hhc2ggbWlzbWF0Y2gnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgW3sgc2NyaXB0VHlwZTogJ3AydHInLCB2YWx1ZTogQmlnSW50KDEwMDApIH1dLFxyXG4gICAgICBbeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQoOTAwKSB9XSxcclxuICAgICAgbmV0d29yayxcclxuICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICdmdWxsc2lnbmVkJ1xyXG4gICAgKTtcclxuICAgIGFzc2VydChwc2J0LnZhbGlkYXRlU2lnbmF0dXJlc09mQWxsSW5wdXRzKCkpO1xyXG4gICAgY29uc3QgdGFwU2NyaXB0U2lnID0gcHNidC5kYXRhLmlucHV0c1swXS50YXBTY3JpcHRTaWc7XHJcbiAgICBhc3NlcnQodGFwU2NyaXB0U2lnKTtcclxuICAgIHRhcFNjcmlwdFNpZ1swXS5zaWduYXR1cmUgPSBCdWZmZXIuY29uY2F0KFt0YXBTY3JpcHRTaWdbMF0uc2lnbmF0dXJlLCBCdWZmZXIub2YoVHJhbnNhY3Rpb24uU0lHSEFTSF9BTEwpXSk7XHJcbiAgICBhc3NlcnQudGhyb3dzKFxyXG4gICAgICAoKSA9PiBwc2J0LmZpbmFsaXplQWxsSW5wdXRzKCksXHJcbiAgICAgIChlOiBhbnkpID0+IGUubWVzc2FnZSA9PT0gJ3NpZ25hdHVyZSBzaWdoYXNoIGRvZXMgbm90IG1hdGNoIGlucHV0IHNpZ2hhc2ggdHlwZSdcclxuICAgICk7XHJcbiAgfSk7XHJcbn0pO1xyXG5cclxuZGVzY3JpYmUoJ2V4dHJhY3RQMm1zT25seUhhbGZTaWduZWRUeCBmYWlsdXJlJywgZnVuY3Rpb24gKCkge1xyXG4gIGl0KCdpbnZhbGlkIHNpZ25hdHVyZSBjb3VudCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHBzYnQgPSB0ZXN0dXRpbC5jb25zdHJ1Y3RQc2J0KGhhbGZTaWduZWRJbnB1dHMsIGhhbGZTaWduZWRPdXRwdXRzLCBuZXR3b3JrLCByb290V2FsbGV0S2V5cywgJ3Vuc2lnbmVkJyk7XHJcbiAgICBhc3NlcnQudGhyb3dzKFxyXG4gICAgICAoKSA9PiBleHRyYWN0UDJtc09ubHlIYWxmU2lnbmVkVHgocHNidCksXHJcbiAgICAgIChlOiBhbnkpID0+IGUubWVzc2FnZSA9PT0gJ3VuZXhwZWN0ZWQgc2lnbmF0dXJlIGNvdW50IHVuZGVmaW5lZCdcclxuICAgICk7XHJcbiAgfSk7XHJcblxyXG4gIGl0KCdlbXB0eSBpbnB1dHMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChbXSwgW10sIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzLCAndW5zaWduZWQnKTtcclxuICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICgpID0+IGV4dHJhY3RQMm1zT25seUhhbGZTaWduZWRUeChwc2J0KSxcclxuICAgICAgKGU6IGFueSkgPT4gZS5tZXNzYWdlID09PSAnZW1wdHkgaW5wdXRzIG9yIG91dHB1dHMnXHJcbiAgICApO1xyXG4gIH0pO1xyXG5cclxuICBpdCgndW5zdXBwb3J0ZWQgc2NyaXB0IHR5cGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgW3sgc2NyaXB0VHlwZTogJ3AydHInLCB2YWx1ZTogQmlnSW50KDEwMDApIH1dLFxyXG4gICAgICBbeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQoOTAwKSB9XSxcclxuICAgICAgbmV0d29yayxcclxuICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICdoYWxmc2lnbmVkJ1xyXG4gICAgKTtcclxuICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICgpID0+IGV4dHJhY3RQMm1zT25seUhhbGZTaWduZWRUeChwc2J0KSxcclxuICAgICAgKGU6IGFueSkgPT4gZS5tZXNzYWdlID09PSAndW5zdXBwb3J0ZWQgc2NyaXB0IHR5cGUgdGFwcm9vdFNjcmlwdFBhdGhTcGVuZCdcclxuICAgICk7XHJcbiAgfSk7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gcnVuRXh0cmFjdFAybXNPbmx5SGFsZlNpZ25lZFR4VGVzdChuZXR3b3JrOiBOZXR3b3JrLCBpbnB1dHM6IElucHV0W10sIG91dHB1dHM6IE91dHB1dFtdKSB7XHJcbiAgY29uc3QgY29pbiA9IGdldE5ldHdvcmtOYW1lKG5ldHdvcmspO1xyXG5cclxuICBkZXNjcmliZShgZXh0cmFjdFAybXNPbmx5SGFsZlNpZ25lZFR4IHN1Y2Nlc3MgZm9yICR7Y29pbn1gLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpdChgc3VjY2VzcyBmb3IgJHtjb2lufWAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3Qgc2lnbmVyczogeyBzaWduZXJOYW1lOiBLZXlOYW1lOyBjb3NpZ25lck5hbWU6IEtleU5hbWUgfSA9IHsgc2lnbmVyTmFtZTogJ3VzZXInLCBjb3NpZ25lck5hbWU6ICdiYWNrdXAnIH07XHJcbiAgICAgIGNvbnN0IHR4bk91dHB1dHMgPSBvdXRwdXRzO1xyXG4gICAgICBjb25zdCB0eG5JbnB1dHMgPSBpbnB1dHNcclxuICAgICAgICAubWFwKCh2KSA9PlxyXG4gICAgICAgICAgdi5zY3JpcHRUeXBlID09PSAncDJzaCcgfHwgdi5zY3JpcHRUeXBlID09PSAncDJzaFAyd3NoJyB8fCB2LnNjcmlwdFR5cGUgPT09ICdwMndzaCdcclxuICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICBzY3JpcHRUeXBlOiB2LnNjcmlwdFR5cGUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogdi52YWx1ZSxcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5maWx0ZXIoKHYpID0+ICEhdikgYXMgdGVzdHV0aWwuVHhuSW5wdXQ8YmlnaW50PltdO1xyXG5cclxuICAgICAgY29uc3QgcHNidCA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoaW5wdXRzLCBvdXRwdXRzLCBuZXR3b3JrLCByb290V2FsbGV0S2V5cywgJ2hhbGZzaWduZWQnLCB7IHNpZ25lcnMgfSk7XHJcbiAgICAgIGNvbnN0IGhhbGZTaWduZWRQc2J0VHggPSBleHRyYWN0UDJtc09ubHlIYWxmU2lnbmVkVHgocHNidCk7XHJcblxyXG4gICAgICBsZXQgdHhiID0gdGVzdHV0aWwuY29uc3RydWN0VHhuQnVpbGRlcih0eG5JbnB1dHMsIHR4bk91dHB1dHMsIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzLCAnaGFsZnNpZ25lZCcsIHNpZ25lcnMpO1xyXG4gICAgICBjb25zdCBoYWxmU2lnbmVkVHhiVHggPSB0eGIuYnVpbGRJbmNvbXBsZXRlKCk7XHJcblxyXG4gICAgICBjb25zdCB1bnNwZW50cyA9IHRvQmlnSW50KGlucHV0cy5tYXAoKGlucHV0LCBpKSA9PiB0ZXN0dXRpbC50b1Vuc3BlbnQoaW5wdXQsIGksIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzKSkpO1xyXG5cclxuICAgICAgYXNzZXJ0RXF1YWxUcmFuc2FjdGlvbnMoaGFsZlNpZ25lZFBzYnRUeCwgaGFsZlNpZ25lZFR4YlR4KTtcclxuICAgICAgdmFsaWRhdGVQc2J0UGFyc2luZyhoYWxmU2lnbmVkUHNidFR4LCBwc2J0LCB1bnNwZW50cywgJ2hhbGZzaWduZWQnKTtcclxuICAgICAgdmFsaWRhdGVQc2J0UGFyc2luZyhoYWxmU2lnbmVkVHhiVHgsIHBzYnQsIHVuc3BlbnRzLCAnaGFsZnNpZ25lZCcpO1xyXG5cclxuICAgICAgdGVzdHV0aWwuc2lnbkFsbFBzYnRJbnB1dHMocHNidCwgaW5wdXRzLCByb290V2FsbGV0S2V5cywgJ2Z1bGxzaWduZWQnLCB7IHNpZ25lcnMgfSk7XHJcbiAgICAgIGNvbnN0IGZ1bGx5U2lnbmVkUHNidCA9IHBzYnQuY2xvbmUoKTtcclxuICAgICAgY29uc3QgcHNidFR4ID0gcHNidC5maW5hbGl6ZUFsbElucHV0cygpLmV4dHJhY3RUcmFuc2FjdGlvbigpO1xyXG5cclxuICAgICAgY29uc3QgdHhuVW5zcGVudHMgPSB0eG5JbnB1dHMubWFwKCh2LCBpKSA9PiB0ZXN0dXRpbC50b1R4blVuc3BlbnQodiwgaSwgbmV0d29yaywgcm9vdFdhbGxldEtleXMpKTtcclxuICAgICAgY29uc3QgcHJldk91dHB1dHMgPSB0eG5VbnNwZW50cy5tYXAoKHUpID0+IHRvT3V0cHV0KHUsIG5ldHdvcmspKTtcclxuICAgICAgdHhiID0gY3JlYXRlVHJhbnNhY3Rpb25CdWlsZGVyRnJvbVRyYW5zYWN0aW9uPGJpZ2ludD4oaGFsZlNpZ25lZFR4YlR4LCBwcmV2T3V0cHV0cyk7XHJcbiAgICAgIHNpZ25BbGxUeG5JbnB1dHModHhiLCB0eG5JbnB1dHMsIHJvb3RXYWxsZXRLZXlzLCAnZnVsbHNpZ25lZCcsIHNpZ25lcnMpO1xyXG4gICAgICBjb25zdCB0eGJUeCA9IHR4Yi5idWlsZCgpO1xyXG5cclxuICAgICAgYXNzZXJ0RXF1YWxUcmFuc2FjdGlvbnMocHNidFR4LCB0eGJUeCk7XHJcbiAgICAgIHZhbGlkYXRlUHNidFBhcnNpbmcocHNidFR4LCBmdWxseVNpZ25lZFBzYnQsIHVuc3BlbnRzLCAnZnVsbHNpZ25lZCcpO1xyXG4gICAgICB2YWxpZGF0ZVBzYnRQYXJzaW5nKHR4YlR4LCBmdWxseVNpZ25lZFBzYnQsIHVuc3BlbnRzLCAnZnVsbHNpZ25lZCcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1bkJ1aWxkU2lnblNlbmRGbG93VGVzdChcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIGlucHV0czogSW5wdXRbXSxcclxuICBvdXRwdXRzOiBPdXRwdXRbXSxcclxuICB7IHNraXBOb25XaXRuZXNzVXR4byA9IGZhbHNlIH0gPSB7fVxyXG4pIHtcclxuICBjb25zdCBjb2luID0gZ2V0TmV0d29ya05hbWUobmV0d29yayk7XHJcblxyXG4gIGZ1bmN0aW9uIGFzc2VydFZhbGlkYXRlKHBzYnQ6IFV0eG9Qc2J0KSB7XHJcbiAgICBwc2J0LmRhdGEuaW5wdXRzLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XHJcbiAgICAgIGFzc2VydC5vayhwc2J0LnZhbGlkYXRlU2lnbmF0dXJlc09mSW5wdXRIRChpLCByb290V2FsbGV0S2V5c1sndXNlciddKSk7XHJcbiAgICAgIGlmIChnZXRQc2J0SW5wdXRTY3JpcHRUeXBlKGlucHV0KSAhPT0gJ3Ayc2hQMnBrJykge1xyXG4gICAgICAgIGFzc2VydC5vayhwc2J0LnZhbGlkYXRlU2lnbmF0dXJlc09mSW5wdXRIRChpLCByb290V2FsbGV0S2V5c1snYml0Z28nXSkpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGFzc2VydC5vayhwc2J0LnZhbGlkYXRlU2lnbmF0dXJlc09mQWxsSW5wdXRzKCkpO1xyXG4gIH1cclxuXHJcbiAgZGVzY3JpYmUoYEJ1aWxkLCBzaWduICYgc2VuZCBmbG93IGZvciAke2NvaW59YCwgZnVuY3Rpb24gKCkge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTa2lwIGFkZGluZyBub25XaXRuZXNzVXR4b3MgdG8gcHNidHNcclxuICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICogSW4gdGhlIGluc3RhbmNlIHRoYXQgd2Ugd2FudCB0byBkb2luZyBhIGJ1bGsgc3dlZXAsIGZvciBuZXR3b3JrIGFuZCBjbGllbnQgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBhcmUgc3Vic3RpdHV0aW5nXHJcbiAgICAgKiB0aGUgbm9uV2l0bmVzc1V0eG8gZm9yIHAyc2ggYW5kIHAyc2hQMnBrIGlucHV0cyB3aXRoIGEgd2l0bmVzc1V0eG8uIFdlIG5lZWQgdGhlIHdpdG5lc3NVdHhvIHNvIHRoYXQgd2UgY2FuIGhhbGZcclxuICAgICAqIHNpZ24gdGhlIHRyYW5zYWN0aW9uIGxvY2FsbHkgd2l0aCB0aGUgdXNlciBrZXkuIFdoZW4gd2Ugc2VuZCB0aGUgaGFsZiBzaWduZWQgdG8gQml0R28sIHRoZSBQU0JUIHdpbGwgYmUgcHJvcGVybHlcclxuICAgICAqIHBvcHVsYXRlZCBzdWNoIHRoYXQgdGhlIG5vbi1zZWd3aXQgaW5wdXRzIGhhdmUgdGhlIG5vbldpdG5lc3NVdHhvLiBUaGlzIG1lYW5zIHdoZW4gd2Ugc2VuZCBpdCB0byBCaXRHbyB3ZSBzaG91bGRcclxuICAgICAqIHJlbW92ZSB0aGUgd2l0bmVzc1V0eG8gc28gdGhhdCBpdCBqdXN0IGhhcyB0aGUgcGFydGlhbFNpZyBhbmQgcmVkZWVtU2NyaXB0LlxyXG4gICAgICovXHJcbiAgICBpdChgc3VjY2VzcyBmb3IgJHtjb2lufSR7c2tpcE5vbldpdG5lc3NVdHhvID8gJyB3aXRob3V0IG5vbldpdG5lc3NVdHhvIGZvciBwMnNoJyA6ICcnfWAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgcGFyZW50UHNidCA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoaW5wdXRzLCBvdXRwdXRzLCBuZXR3b3JrLCByb290V2FsbGV0S2V5cywgJ3Vuc2lnbmVkJywge1xyXG4gICAgICAgIHNpZ25lcnM6IHtcclxuICAgICAgICAgIHNpZ25lck5hbWU6ICd1c2VyJyxcclxuICAgICAgICAgIGNvc2lnbmVyTmFtZTogJ2JpdGdvJyxcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGxldCBwc2J0ID0gc2tpcE5vbldpdG5lc3NVdHhvID8gY2xvbmVQc2J0V2l0aG91dE5vbldpdG5lc3NVdHhvKHBhcmVudFBzYnQpIDogcGFyZW50UHNidDtcclxuICAgICAgYWRkWHB1YnNUb1BzYnQocHNidCwgcm9vdFdhbGxldEtleXMpO1xyXG4gICAgICBwc2J0LnNldEFsbElucHV0c011c2lnMk5vbmNlSEQocm9vdFdhbGxldEtleXNbJ3VzZXInXSk7XHJcblxyXG4gICAgICBsZXQgcHNidFdpdGhvdXRQcmV2VHggPSBjbG9uZVBzYnRXaXRob3V0Tm9uV2l0bmVzc1V0eG8ocHNidCk7XHJcbiAgICAgIGxldCBoZXggPSBwc2J0V2l0aG91dFByZXZUeC50b0hleCgpO1xyXG5cclxuICAgICAgbGV0IHBzYnRBdEhzbSA9IGNyZWF0ZVBzYnRGcm9tSGV4KGhleCwgbmV0d29yayk7XHJcbiAgICAgIHBzYnRBdEhzbS5zZXRBbGxJbnB1dHNNdXNpZzJOb25jZUhEKHJvb3RXYWxsZXRLZXlzWydiaXRnbyddLCB7IGRldGVybWluaXN0aWM6IHRydWUgfSk7XHJcbiAgICAgIGxldCBoZXhBdEhzbSA9IHBzYnRBdEhzbS50b0hleCgpO1xyXG5cclxuICAgICAgbGV0IHBzYnRGcm9tSHNtID0gY3JlYXRlUHNidEZyb21IZXgoaGV4QXRIc20sIG5ldHdvcmspO1xyXG4gICAgICBkZWxldGVXaXRuZXNzVXR4b0Zvck5vblNlZ3dpdElucHV0cyhwc2J0RnJvbUhzbSk7XHJcbiAgICAgIHBzYnQuY29tYmluZShwc2J0RnJvbUhzbSk7XHJcblxyXG4gICAgICB0ZXN0dXRpbC5zaWduQWxsUHNidElucHV0cyhwc2J0LCBpbnB1dHMsIHJvb3RXYWxsZXRLZXlzLCAnaGFsZnNpZ25lZCcsIHtcclxuICAgICAgICBzaWduZXJzOiB7XHJcbiAgICAgICAgICBzaWduZXJOYW1lOiAndXNlcicsXHJcbiAgICAgICAgICBjb3NpZ25lck5hbWU6ICdiaXRnbycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBza2lwTm9uV2l0bmVzc1V0eG8sXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcHNidFdpdGhvdXRQcmV2VHggPSBjbG9uZVBzYnRXaXRob3V0Tm9uV2l0bmVzc1V0eG8ocHNidCk7XHJcbiAgICAgIGhleCA9IHBzYnRXaXRob3V0UHJldlR4LnRvSGV4KCk7XHJcblxyXG4gICAgICBwc2J0QXRIc20gPSBjcmVhdGVQc2J0RnJvbUhleChoZXgsIG5ldHdvcmspO1xyXG4gICAgICB3aXRoVW5zYWZlTm9uU2Vnd2l0KHBzYnRBdEhzbSwgKCkgPT4ge1xyXG4gICAgICAgIHRlc3R1dGlsLnNpZ25BbGxQc2J0SW5wdXRzKHBzYnRBdEhzbSwgaW5wdXRzLCByb290V2FsbGV0S2V5cywgJ2Z1bGxzaWduZWQnLCB7XHJcbiAgICAgICAgICBzaWduZXJzOiB7XHJcbiAgICAgICAgICAgIHNpZ25lck5hbWU6ICd1c2VyJyxcclxuICAgICAgICAgICAgY29zaWduZXJOYW1lOiAnYml0Z28nLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGRldGVybWluaXN0aWM6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICB3aXRoVW5zYWZlTm9uU2Vnd2l0KHBzYnRBdEhzbSwgKCkgPT4ge1xyXG4gICAgICAgIGFzc2VydFZhbGlkYXRlKHBzYnRBdEhzbSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBoZXhBdEhzbSA9IHBzYnRBdEhzbS50b0hleCgpO1xyXG5cclxuICAgICAgcHNidEZyb21Ic20gPSBjcmVhdGVQc2J0RnJvbUhleChoZXhBdEhzbSwgbmV0d29yayk7XHJcbiAgICAgIGRlbGV0ZVdpdG5lc3NVdHhvRm9yTm9uU2Vnd2l0SW5wdXRzKHBzYnRGcm9tSHNtKTtcclxuXHJcbiAgICAgIGlmIChza2lwTm9uV2l0bmVzc1V0eG8pIHtcclxuICAgICAgICBwc2J0ID0gcGFyZW50UHNidDtcclxuICAgICAgfVxyXG4gICAgICBwc2J0LmNvbWJpbmUocHNidEZyb21Ic20pO1xyXG5cclxuICAgICAgYXNzZXJ0VmFsaWRhdGUocHNidCk7XHJcbiAgICAgIGFzc2VydC5kb2VzTm90VGhyb3coKCkgPT4gcHNidC5maW5hbGl6ZUFsbElucHV0cygpLmV4dHJhY3RUcmFuc2FjdGlvbigpKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5CdWlsZFBzYnRXaXRoU0RLKG5ldHdvcms6IE5ldHdvcmssIGlucHV0czogSW5wdXRbXSwgb3V0cHV0czogT3V0cHV0W10pIHtcclxuICBjb25zdCBjb2luID0gZ2V0TmV0d29ya05hbWUobmV0d29yayk7XHJcbiAgaXQoYGNoZWNrIHRoYXQgYnVpbGRpbmcgYSBQU0JUIHdoaWxlIHNraXBwaW5nIG5vbldpdG5lc3NVdHhvIHdvcmtzIC0gJHtjb2lufWAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHBzYnRXaXRoTm9uV2l0bmVzcyA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoaW5wdXRzLCBvdXRwdXRzLCBuZXR3b3JrLCByb290V2FsbGV0S2V5cywgJ3Vuc2lnbmVkJywge1xyXG4gICAgICBzaWduZXJzOiB7XHJcbiAgICAgICAgc2lnbmVyTmFtZTogJ3VzZXInLFxyXG4gICAgICAgIGNvc2lnbmVyTmFtZTogJ2JpdGdvJyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgY29uc3QgcHNidFdpdGhvdXROb25XaXRuZXNzID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChpbnB1dHMsIG91dHB1dHMsIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzLCAndW5zaWduZWQnLCB7XHJcbiAgICAgIHNpZ25lcnM6IHtcclxuICAgICAgICBzaWduZXJOYW1lOiAndXNlcicsXHJcbiAgICAgICAgY29zaWduZXJOYW1lOiAnYml0Z28nLFxyXG4gICAgICB9LFxyXG4gICAgICBza2lwTm9uV2l0bmVzc1V0eG86IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBjbG9uZWRQc2J0ID0gY2xvbmVQc2J0V2l0aG91dE5vbldpdG5lc3NVdHhvKHBzYnRXaXRoTm9uV2l0bmVzcyk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHBzYnRXaXRob3V0Tm9uV2l0bmVzcy50b0hleCgpLCBjbG9uZWRQc2J0LnRvSGV4KCkpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5nZXROZXR3b3JrTGlzdCgpXHJcbiAgLmZpbHRlcigodikgPT4gaXNNYWlubmV0KHYpICYmIHYgIT09IG5ldHdvcmtzLmJpdGNvaW5zdilcclxuICAuZm9yRWFjaCgobmV0d29yaykgPT4ge1xyXG4gICAgcnVuRXh0cmFjdFAybXNPbmx5SGFsZlNpZ25lZFR4VGVzdChcclxuICAgICAgbmV0d29yayxcclxuICAgICAgaGFsZlNpZ25lZElucHV0cy5maWx0ZXIoKGlucHV0KSA9PiBpc1N1cHBvcnRlZFNjcmlwdFR5cGUobmV0d29yaywgaW5wdXQuc2NyaXB0VHlwZSkpLFxyXG4gICAgICBoYWxmU2lnbmVkT3V0cHV0cy5maWx0ZXIoKG91dHB1dCkgPT4gaXNTdXBwb3J0ZWRTY3JpcHRUeXBlKG5ldHdvcmssIG91dHB1dC5zY3JpcHRUeXBlKSlcclxuICAgICk7XHJcblxyXG4gICAgY29uc3Qgc3VwcG9ydGVkUHNidElucHV0cyA9IHBzYnRJbnB1dHMuZmlsdGVyKChpbnB1dCkgPT5cclxuICAgICAgaXNTdXBwb3J0ZWRTY3JpcHRUeXBlKG5ldHdvcmssIGlucHV0LnNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJyA/ICdwMnRyTXVzaWcyJyA6IGlucHV0LnNjcmlwdFR5cGUpXHJcbiAgICApO1xyXG4gICAgY29uc3Qgc3VwcG9ydGVkUHNidE91dHB1dHMgPSBwc2J0T3V0cHV0cy5maWx0ZXIoKG91dHB1dCkgPT4gaXNTdXBwb3J0ZWRTY3JpcHRUeXBlKG5ldHdvcmssIG91dHB1dC5zY3JpcHRUeXBlKSk7XHJcbiAgICBbZmFsc2UsIHRydWVdLmZvckVhY2goKHNraXBOb25XaXRuZXNzVXR4bykgPT5cclxuICAgICAgcnVuQnVpbGRTaWduU2VuZEZsb3dUZXN0KG5ldHdvcmssIHN1cHBvcnRlZFBzYnRJbnB1dHMsIHN1cHBvcnRlZFBzYnRPdXRwdXRzLCB7IHNraXBOb25XaXRuZXNzVXR4byB9KVxyXG4gICAgKTtcclxuXHJcbiAgICBydW5CdWlsZFBzYnRXaXRoU0RLKG5ldHdvcmssIHN1cHBvcnRlZFBzYnRJbnB1dHMsIHN1cHBvcnRlZFBzYnRPdXRwdXRzKTtcclxuICB9KTtcclxuXHJcbmRlc2NyaWJlKCdpc1RyYW5zYWN0aW9uV2l0aEtleVBhdGhTcGVuZElucHV0JywgZnVuY3Rpb24gKCkge1xyXG4gIGRlc2NyaWJlKCd0cmFuc2FjdGlvbiBpbnB1dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGl0KCdlbXB0eSBpbnB1dHMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGNvbnN0IHR4ID0gdGVzdHV0aWwuY29uc3RydWN0VHhuQnVpbGRlcihbXSwgW10sIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzLCAndW5zaWduZWQnKS5idWlsZEluY29tcGxldGUoKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQodHgpLCBmYWxzZSk7XHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1RyYW5zYWN0aW9uV2l0aEtleVBhdGhTcGVuZElucHV0KHR4LmlucyksIGZhbHNlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCd0YXByb290S2V5UGF0aCBpbnB1dHMgc3VjY2Vzc2Z1bGx5IHRyaWdnZXJzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICd0YXByb290S2V5UGF0aFNwZW5kJywgdmFsdWU6IEJpZ0ludCgxZTgpIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnNoJywgdmFsdWU6IEJpZ0ludCgxZTgpIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQoMmU4IC0gMTAwMDApIH1dLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICAgJ2Z1bGxzaWduZWQnXHJcbiAgICAgICk7XHJcbiAgICAgIGFzc2VydChwc2J0LnZhbGlkYXRlU2lnbmF0dXJlc09mQWxsSW5wdXRzKCkpO1xyXG4gICAgICBwc2J0LmZpbmFsaXplQWxsSW5wdXRzKCk7XHJcbiAgICAgIGNvbnN0IHR4ID0gcHNidC5leHRyYWN0VHJhbnNhY3Rpb24oKSBhcyBVdHhvVHJhbnNhY3Rpb248YmlnaW50PjtcclxuXHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1RyYW5zYWN0aW9uV2l0aEtleVBhdGhTcGVuZElucHV0KHR4KSwgdHJ1ZSk7XHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1RyYW5zYWN0aW9uV2l0aEtleVBhdGhTcGVuZElucHV0KHR4LmlucyksIHRydWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ25vIHRhcHJvb3RLZXlQYXRoIGlucHV0cyBzdWNjZXNzZnVsbHkgZG9lcyBub3QgdHJpZ2dlcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgcHNidCA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJ0ck11c2lnMicsIHZhbHVlOiBCaWdJbnQoMWU4KSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQoMWU4KSB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgW3sgc2NyaXB0VHlwZTogJ3Ayc2gnLCB2YWx1ZTogQmlnSW50KDJlOCAtIDEwMDAwKSB9XSxcclxuICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgIHJvb3RXYWxsZXRLZXlzLFxyXG4gICAgICAgICdmdWxsc2lnbmVkJ1xyXG4gICAgICApO1xyXG4gICAgICBhc3NlcnQocHNidC52YWxpZGF0ZVNpZ25hdHVyZXNPZkFsbElucHV0cygpKTtcclxuICAgICAgcHNidC5maW5hbGl6ZUFsbElucHV0cygpO1xyXG4gICAgICBjb25zdCB0eCA9IHBzYnQuZXh0cmFjdFRyYW5zYWN0aW9uKCk7XHJcblxyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaXNUcmFuc2FjdGlvbldpdGhLZXlQYXRoU3BlbmRJbnB1dCh0eCksIGZhbHNlKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQodHguaW5zKSwgZmFsc2UpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Vuc2lnbmVkIGlucHV0cyBzdWNjZXNzZnVsbHkgZmFpbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgcHNidCA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJ3c2gnLCB2YWx1ZTogQmlnSW50KDFlOCkgfSxcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3Ayc2gnLCB2YWx1ZTogQmlnSW50KDFlOCkgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIFt7IHNjcmlwdFR5cGU6ICdwMnNoJywgdmFsdWU6IEJpZ0ludCgyZTggLSAxMDAwMCkgfV0sXHJcbiAgICAgICAgbmV0d29yayxcclxuICAgICAgICByb290V2FsbGV0S2V5cyxcclxuICAgICAgICAndW5zaWduZWQnXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IHR4ID0gcHNidC5nZXRVbnNpZ25lZFR4KCk7XHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1RyYW5zYWN0aW9uV2l0aEtleVBhdGhTcGVuZElucHV0KHR4KSwgZmFsc2UpO1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaXNUcmFuc2FjdGlvbldpdGhLZXlQYXRoU3BlbmRJbnB1dCh0eC5pbnMpLCBmYWxzZSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ3BzYnQgaW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpdCgnZW1wdHkgaW5wdXRzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChbXSwgW10sIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzLCAndW5zaWduZWQnKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQocHNidCksIGZhbHNlKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQocHNidC5kYXRhLmlucHV0cyksIGZhbHNlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdwc2J0IHdpdGggdGFwcm9vdEtleVBhdGhJbnB1dHMgc3VjY2Vzc2Z1bGx5IHRyaWdnZXJzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICd0YXByb290S2V5UGF0aFNwZW5kJywgdmFsdWU6IEJpZ0ludCgxZTgpIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnNoJywgdmFsdWU6IEJpZ0ludCgxZTgpIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQoMmU4IC0gMTAwMDApIH1dLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICAgJ3Vuc2lnbmVkJ1xyXG4gICAgICApO1xyXG5cclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQocHNidCksIHRydWUpO1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaXNUcmFuc2FjdGlvbldpdGhLZXlQYXRoU3BlbmRJbnB1dChwc2J0LmRhdGEuaW5wdXRzKSwgdHJ1ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgncHNidCB3aXRob3V0IHRhcHJvb3RLZXlQYXRoSW5wdXRzIHN1Y2Nlc3NmdWxseSBkb2VzIG5vdCB0cmlnZ2VyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMndzaCcsIHZhbHVlOiBCaWdJbnQoMWU4KSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQoMWU4KSB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgW3sgc2NyaXB0VHlwZTogJ3Ayc2gnLCB2YWx1ZTogQmlnSW50KDJlOCAtIDEwMDAwKSB9XSxcclxuICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgIHJvb3RXYWxsZXRLZXlzLFxyXG4gICAgICAgICdoYWxmc2lnbmVkJ1xyXG4gICAgICApO1xyXG5cclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQocHNidCksIGZhbHNlKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVHJhbnNhY3Rpb25XaXRoS2V5UGF0aFNwZW5kSW5wdXQocHNidC5kYXRhLmlucHV0cyksIGZhbHNlKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59KTtcclxuXHJcbmRlc2NyaWJlKCdQYXJzZSBQU0JUJywgZnVuY3Rpb24gKCkge1xyXG4gIGl0KCdwMnNoUDJwayBwYXJzaW5nJywgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3Qgc2lnbmVyID0gcm9vdFdhbGxldEtleXNbJ3VzZXInXTtcclxuICAgIGNvbnN0IHBzYnQgPSBjcmVhdGVQc2J0Rm9yTmV0d29yayh7IG5ldHdvcms6IG5ldHdvcmtzLmJpdGNvaW5jYXNoIH0pO1xyXG4gICAgY29uc3QgdW5zcGVudCA9IG1vY2tSZXBsYXlQcm90ZWN0aW9uVW5zcGVudChuZXR3b3Jrcy5iaXRjb2luY2FzaCwgQmlnSW50KDFlOCksIHsga2V5OiBzaWduZXIgfSk7XHJcbiAgICBjb25zdCB7IHJlZGVlbVNjcmlwdCB9ID0gY3JlYXRlT3V0cHV0U2NyaXB0UDJzaFAycGsoc2lnbmVyLnB1YmxpY0tleSk7XHJcbiAgICBhc3NlcnQocmVkZWVtU2NyaXB0KTtcclxuICAgIGFkZFJlcGxheVByb3RlY3Rpb25VbnNwZW50VG9Qc2J0KHBzYnQsIHVuc3BlbnQsIHJlZGVlbVNjcmlwdCk7XHJcbiAgICBhZGRXYWxsZXRPdXRwdXRUb1BzYnQocHNidCwgcm9vdFdhbGxldEtleXMsIGdldEludGVybmFsQ2hhaW5Db2RlKCdwMnNoJyksIDAsIEJpZ0ludCgxZTggLSAxMDAwMCkpO1xyXG4gICAgY29uc3QgaW5wdXQgPSBwc2J0LmRhdGEuaW5wdXRzWzBdO1xyXG4gICAgbGV0IHBhcnNlZCA9IHBhcnNlUHNidElucHV0KGlucHV0KTtcclxuXHJcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwocGFyc2VkLnNjcmlwdFR5cGUsICdwMnNoUDJwaycpO1xyXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHBhcnNlZC5zaWduYXR1cmVzLCB1bmRlZmluZWQpO1xyXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHBhcnNlZC5wdWJsaWNLZXlzLmxlbmd0aCwgMSk7XHJcbiAgICBhc3NlcnQub2socGFyc2VkLnB1YmxpY0tleXNbMF0ubGVuZ3RoID09PSAzMyk7XHJcbiAgICBhc3NlcnQub2socGFyc2VkLnB1YlNjcmlwdC5lcXVhbHMocmVkZWVtU2NyaXB0KSk7XHJcblxyXG4gICAgcHNidC5zaWduQWxsSW5wdXRzKHNpZ25lcik7XHJcbiAgICBhc3NlcnQub2socHNidC52YWxpZGF0ZVNpZ25hdHVyZXNPZkFsbElucHV0cygpKTtcclxuXHJcbiAgICBwYXJzZWQgPSBwYXJzZVBzYnRJbnB1dChpbnB1dCk7XHJcblxyXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHBhcnNlZC5zY3JpcHRUeXBlLCAncDJzaFAycGsnKTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChwYXJzZWQuc2lnbmF0dXJlcz8ubGVuZ3RoLCAxKTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChwYXJzZWQucHVibGljS2V5cy5sZW5ndGgsIDEpO1xyXG4gICAgYXNzZXJ0Lm9rKHBhcnNlZC5wdWJsaWNLZXlzWzBdLmxlbmd0aCA9PT0gMzMpO1xyXG4gICAgYXNzZXJ0Lm9rKHBhcnNlZC5wdWJTY3JpcHQuZXF1YWxzKHJlZGVlbVNjcmlwdCkpO1xyXG5cclxuICAgIGNvbnN0IHNpZ2hhc2g6IG51bWJlciA9IHBhcnNlZC5zaWduYXR1cmVzWzBdW3BhcnNlZC5zaWduYXR1cmVzWzBdLmxlbmd0aCAtIDFdO1xyXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHNpZ2hhc2gsIGdldERlZmF1bHRTaWdIYXNoKHBzYnQubmV0d29yaykpO1xyXG4gIH0pO1xyXG5cclxuICBpdCgnZmFpbCB0byBwYXJzZSBmaW5hbGl6ZWQgcHNidCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHVuc3BlbnRzID0gbW9ja1Vuc3BlbnRzKFxyXG4gICAgICByb290V2FsbGV0S2V5cyxcclxuICAgICAgZ2V0U2NyaXB0VHlwZXMyT2YzKCkubWFwKChpbnB1dFR5cGUpID0+IGlucHV0VHlwZSksXHJcbiAgICAgIEJpZ0ludCgnMTAwMDAwMDAwMDAwMDAwMDAnKSxcclxuICAgICAgbmV0d29ya1xyXG4gICAgKTtcclxuICAgIGNvbnN0IHR4QnVpbGRlclBhcmFtcyA9IHtcclxuICAgICAgc2lnbmVyOiAndXNlcicsXHJcbiAgICAgIGNvc2lnbmVyOiAnYml0Z28nLFxyXG4gICAgICBhbW91bnRUeXBlOiAnYmlnaW50JyxcclxuICAgICAgb3V0cHV0VHlwZTogJ3Ayc2gnLFxyXG4gICAgICBzaWduYXR1cmVUYXJnZXQ6ICdmdWxsc2lnbmVkJyxcclxuICAgICAgbmV0d29yayxcclxuICAgICAgY2hhbmdlSW5kZXg6IENIQU5HRV9JTkRFWCxcclxuICAgICAgZmVlOiBGRUUsXHJcbiAgICB9IGFzIGNvbnN0O1xyXG4gICAgY29uc3QgdHggPSBjb25zdHJ1Y3RUcmFuc2FjdGlvblVzaW5nVHhCdWlsZGVyKHVuc3BlbnRzLCByb290V2FsbGV0S2V5cywgdHhCdWlsZGVyUGFyYW1zKTtcclxuICAgIGNvbnN0IHBzYnQgPSB0b1dhbGxldFBzYnQodHgsIHRvQmlnSW50KHVuc3BlbnRzKSwgcm9vdFdhbGxldEtleXMpO1xyXG4gICAgcHNidC52YWxpZGF0ZVNpZ25hdHVyZXNPZkFsbElucHV0cygpO1xyXG4gICAgcHNidC5maW5hbGl6ZUFsbElucHV0cygpO1xyXG4gICAgcHNidC5kYXRhLmlucHV0cy5mb3JFYWNoKChpbnB1dCwgaSkgPT4ge1xyXG4gICAgICBhc3NlcnQudGhyb3dzKFxyXG4gICAgICAgICgpID0+IHBhcnNlUHNidElucHV0KGlucHV0KSxcclxuICAgICAgICAoZTogYW55KSA9PiBlLm1lc3NhZ2UgPT09ICdGaW5hbGl6ZWQgUFNCVCBwYXJzaW5nIGlzIG5vdCBzdXBwb3J0ZWQnXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgaXQoJ2ZhaWwgdG8gcGFyc2UgaW5wdXQgd2l0aCBtb3JlIHRoYW4gb25lIHNjcmlwdCB0eXBlIG1ldGFkYXRhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgdW5zcGVudHMgPSBtb2NrVW5zcGVudHMocm9vdFdhbGxldEtleXMsIFsncDJ0ciddLCBCaWdJbnQoJzEwMDAwMDAwMDAwMDAwMDAwJyksIG5ldHdvcmspO1xyXG5cclxuICAgIGNvbnN0IHR4QnVpbGRlclBhcmFtcyA9IHtcclxuICAgICAgc2lnbmVyOiAndXNlcicsXHJcbiAgICAgIGNvc2lnbmVyOiAnYml0Z28nLFxyXG4gICAgICBhbW91bnRUeXBlOiAnYmlnaW50JyxcclxuICAgICAgb3V0cHV0VHlwZTogJ3Ayc2gnLFxyXG4gICAgICBzaWduYXR1cmVUYXJnZXQ6ICdoYWxmc2lnbmVkJyxcclxuICAgICAgbmV0d29yayxcclxuICAgICAgY2hhbmdlSW5kZXg6IENIQU5HRV9JTkRFWCxcclxuICAgICAgZmVlOiBGRUUsXHJcbiAgICB9IGFzIGNvbnN0O1xyXG5cclxuICAgIGNvbnN0IHR4UDJ0ciA9IGNvbnN0cnVjdFRyYW5zYWN0aW9uVXNpbmdUeEJ1aWxkZXIoW3Vuc3BlbnRzWzBdXSwgcm9vdFdhbGxldEtleXMsIHR4QnVpbGRlclBhcmFtcyk7XHJcbiAgICBjb25zdCBwc2J0UDJ0ciA9IHRvV2FsbGV0UHNidCh0eFAydHIsIHRvQmlnSW50KFt1bnNwZW50c1swXV0pLCByb290V2FsbGV0S2V5cyk7XHJcblxyXG4gICAgY29uc3Qgd2FsbGV0S2V5cyA9IHJvb3RXYWxsZXRLZXlzLmRlcml2ZUZvckNoYWluQW5kSW5kZXgoZ2V0RXh0ZXJuYWxDaGFpbkNvZGUoJ3Ayc2gnKSwgMCk7XHJcbiAgICBjb25zdCB7IHJlZGVlbVNjcmlwdCB9ID0gY3JlYXRlT3V0cHV0U2NyaXB0Mm9mMyh3YWxsZXRLZXlzLnB1YmxpY0tleXMsICdwMnNoJyk7XHJcbiAgICBwc2J0UDJ0ci51cGRhdGVJbnB1dCgwLCB7IHJlZGVlbVNjcmlwdCB9KTtcclxuXHJcbiAgICBhc3NlcnQudGhyb3dzKFxyXG4gICAgICAoKSA9PiBwYXJzZVBzYnRJbnB1dChwc2J0UDJ0ci5kYXRhLmlucHV0c1swXSksXHJcbiAgICAgIChlOiBhbnkpID0+IGUubWVzc2FnZSA9PT0gJ0ZvdW5kIGJvdGggcDJzaCBhbmQgdGFwcm9vdFNjcmlwdFBhdGggUFNCVCBtZXRhZGF0YS4nXHJcbiAgICApO1xyXG4gIH0pO1xyXG5cclxuICBpdCgnZmFpbCB0byBwYXJzZSBtb3JlIHRoYW4gb25lIHRhcCBsZWFmIHNjcmlwdCBwZXIgaW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCB1bnNwZW50cyA9IG1vY2tVbnNwZW50cyhyb290V2FsbGV0S2V5cywgWydwMnRyJ10sIEJpZ0ludCgnMTAwMDAwMDAwMDAwMDAwMDAnKSwgbmV0d29yayk7XHJcblxyXG4gICAgY29uc3QgdHhCdWlsZGVyUGFyYW1zID0ge1xyXG4gICAgICBzaWduZXI6ICd1c2VyJyxcclxuICAgICAgY29zaWduZXI6ICdiaXRnbycsXHJcbiAgICAgIGFtb3VudFR5cGU6ICdiaWdpbnQnLFxyXG4gICAgICBvdXRwdXRUeXBlOiAncDJzaCcsXHJcbiAgICAgIHNpZ25hdHVyZVRhcmdldDogJ2hhbGZzaWduZWQnLFxyXG4gICAgICBuZXR3b3JrLFxyXG4gICAgICBjaGFuZ2VJbmRleDogQ0hBTkdFX0lOREVYLFxyXG4gICAgICBmZWU6IEZFRSxcclxuICAgIH0gYXMgY29uc3Q7XHJcblxyXG4gICAgY29uc3QgdHhQMnRyMSA9IGNvbnN0cnVjdFRyYW5zYWN0aW9uVXNpbmdUeEJ1aWxkZXIoW3Vuc3BlbnRzWzBdXSwgcm9vdFdhbGxldEtleXMsIHR4QnVpbGRlclBhcmFtcyk7XHJcbiAgICBjb25zdCBwc2J0UDJ0cjEgPSB0b1dhbGxldFBzYnQodHhQMnRyMSwgdG9CaWdJbnQoW3Vuc3BlbnRzWzBdXSksIHJvb3RXYWxsZXRLZXlzKTtcclxuXHJcbiAgICBjb25zdCB0eEJ1aWxkZXJQYXJhbXMyID0ge1xyXG4gICAgICBzaWduZXI6ICd1c2VyJyBhcyBLZXlOYW1lLFxyXG4gICAgICBjb3NpZ25lcjogJ2JhY2t1cCcgYXMgS2V5TmFtZSxcclxuICAgICAgYW1vdW50VHlwZTogJ2JpZ2ludCcgYXMgQW1vdW50VHlwZSxcclxuICAgICAgb3V0cHV0VHlwZTogJ3Ayc2gnIGFzIElucHV0VHlwZSxcclxuICAgICAgc2lnbmF0dXJlVGFyZ2V0OiAnaGFsZnNpZ25lZCcgYXMgU2lnbmF0dXJlVGFyZ2V0VHlwZSxcclxuICAgICAgbmV0d29yayxcclxuICAgICAgY2hhbmdlSW5kZXg6IENIQU5HRV9JTkRFWCxcclxuICAgICAgZmVlOiBGRUUsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHR4UDJ0cjIgPSBjb25zdHJ1Y3RUcmFuc2FjdGlvblVzaW5nVHhCdWlsZGVyKFt1bnNwZW50c1swXV0sIHJvb3RXYWxsZXRLZXlzLCB0eEJ1aWxkZXJQYXJhbXMyKTtcclxuICAgIGNvbnN0IHBzYnRQMnRyMiA9IHRvV2FsbGV0UHNidCh0eFAydHIyLCB0b0JpZ0ludChbdW5zcGVudHNbMF1dKSwgcm9vdFdhbGxldEtleXMpO1xyXG5cclxuICAgIGNvbnN0IHR4QnVpbGRlclBhcmFtczMgPSB7XHJcbiAgICAgIHNpZ25lcjogJ3VzZXInLFxyXG4gICAgICBjb3NpZ25lcjogJ2JpdGdvJyxcclxuICAgICAgYW1vdW50VHlwZTogJ2JpZ2ludCcsXHJcbiAgICAgIG91dHB1dFR5cGU6ICdwMnNoJyxcclxuICAgICAgc2lnbmF0dXJlVGFyZ2V0OiAndW5zaWduZWQnLFxyXG4gICAgICBuZXR3b3JrLFxyXG4gICAgICBjaGFuZ2VJbmRleDogQ0hBTkdFX0lOREVYLFxyXG4gICAgICBmZWU6IEZFRSxcclxuICAgIH0gYXMgY29uc3Q7XHJcbiAgICBjb25zdCB0eFAydHIzID0gY29uc3RydWN0VHJhbnNhY3Rpb25Vc2luZ1R4QnVpbGRlcihbdW5zcGVudHNbMF1dLCByb290V2FsbGV0S2V5cywgdHhCdWlsZGVyUGFyYW1zMyk7XHJcbiAgICBjb25zdCBwc2J0UDJ0cjMgPSB0b1dhbGxldFBzYnQodHhQMnRyMywgdG9CaWdJbnQoW3Vuc3BlbnRzWzBdXSksIHJvb3RXYWxsZXRLZXlzKTtcclxuICAgIGlmIChwc2J0UDJ0cjEuZGF0YS5pbnB1dHNbMF0udGFwTGVhZlNjcmlwdCAmJiBwc2J0UDJ0cjIuZGF0YS5pbnB1dHNbMF0udGFwTGVhZlNjcmlwdCkge1xyXG4gICAgICBjb25zdCB0YXBMZWFmU2NyaXB0cyA9IFtwc2J0UDJ0cjEuZGF0YS5pbnB1dHNbMF0udGFwTGVhZlNjcmlwdFswXSwgcHNidFAydHIyLmRhdGEuaW5wdXRzWzBdLnRhcExlYWZTY3JpcHRbMF1dO1xyXG4gICAgICBwc2J0UDJ0cjMudXBkYXRlSW5wdXQoMCwgeyB0YXBMZWFmU2NyaXB0OiB0YXBMZWFmU2NyaXB0cyB9KTtcclxuXHJcbiAgICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICAgKCkgPT4gcGFyc2VQc2J0SW5wdXQocHNidFAydHIzLmRhdGEuaW5wdXRzWzBdKSxcclxuICAgICAgICAoZTogYW55KSA9PiBlLm1lc3NhZ2UgPT09ICdCaXRnbyBvbmx5IHN1cHBvcnRzIGEgc2luZ2xlIHRhcCBsZWFmIHNjcmlwdCBwZXIgaW5wdXQuJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59KTtcclxuXHJcbmRlc2NyaWJlKCdpc1BzYnQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgZnVuY3Rpb24gaXNQc2J0Rm9yTmV0d29yayhuOiBOZXR3b3JrKSB7XHJcbiAgICBkZXNjcmliZShgbmV0d29yazogJHtnZXROZXR3b3JrTmFtZShuKX1gLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGNvbnN0IHBzYnQgPSBjcmVhdGVQc2J0Rm9yTmV0d29yayh7IG5ldHdvcms6IG4gfSk7XHJcblxyXG4gICAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIGZvciBhIHZhbGlkIFBTQlQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgcHNidEJ1ZmYgPSBwc2J0LnRvQnVmZmVyKCk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzUHNidChwc2J0QnVmZiksIHRydWUpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1BzYnQocHNidEJ1ZmYudG9TdHJpbmcoJ2hleCcpKSwgdHJ1ZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2UgZm9yIGEgdHJhbnNhY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzUHNidChwc2J0LmdldFVuc2lnbmVkVHgoKS50b0J1ZmZlcigpKSwgZmFsc2UpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIGZvciBhIHRydW5jYXRlZCBtYWdpYyB3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IGhleCA9IHBzYnQudG9CdWZmZXIoKS5zbGljZSgwLCAzKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaXNQc2J0KGhleCksIGZhbHNlKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaXNQc2J0KEJ1ZmZlci5mcm9tKGhleCkpLCBmYWxzZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2UgZm9yIGEgdmFsaWQgUFNCVCB3aXRoIGFuIGludmFsaWQgbWFnaWMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gcHNidC50b0J1ZmZlcigpO1xyXG4gICAgICAgIGJ1ZmZlci53cml0ZVVJbnQ4KDB4MDAsIDEpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1BzYnQocHNidC5nZXRVbnNpZ25lZFR4KCkudG9CdWZmZXIoKSksIGZhbHNlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSBmb3IgYSB2YWxpZCBQU0JUIHdpdGggYW4gaW52YWxpZCBzZXBhcmF0b3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gcHNidC50b0J1ZmZlcigpO1xyXG4gICAgICAgIGJ1ZmZlci53cml0ZVVJbnQ4KDB4ZmUsIDQpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc1BzYnQocHNidC5nZXRVbnNpZ25lZFR4KCkudG9CdWZmZXIoKSksIGZhbHNlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSBmb3IgYSByYW5kb20gYnVmZmVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHJhbmRvbSA9ICdkZWFkYmVhZic7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20ocmFuZG9tLCAnaGV4Jyk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzUHNidChyYW5kb20pLCBmYWxzZSk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzUHNidChidWZmZXIpLCBmYWxzZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSBpZiBidWZmZXIgaXMgY2hhbmdlZCBhZnRlciB0aGUgc2VwYXJhdG9yJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHBzYnQudG9CdWZmZXIoKTtcclxuICAgICAgICBidWZmZXIud3JpdGVVSW50OCgweDAwLCA1KTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaXNQc2J0KGJ1ZmZlciksIHRydWUpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0TmV0d29ya0xpc3QoKS5mb3JFYWNoKChuKSA9PiBpc1BzYnRGb3JOZXR3b3JrKG4pKTtcclxufSk7XHJcblxyXG5kZXNjcmliZSgnVXBkYXRlIGluY29tcGxldGUgcHNidCcsIGZ1bmN0aW9uICgpIHtcclxuICBmdW5jdGlvbiByZW1vdmVGcm9tUHNidChcclxuICAgIHBzYnRIZXg6IHN0cmluZyxcclxuICAgIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgICByZW1vdmU6IHsgaW5wdXQ/OiB7IGluZGV4OiBudW1iZXI7IGZpZWxkVG9SZW1vdmU6IHN0cmluZyB9OyBvdXRwdXQ/OiB7IGluZGV4OiBudW1iZXI7IGZpZWxkVG9SZW1vdmU6IHN0cmluZyB9IH1cclxuICApOiBVdHhvUHNidCB7XHJcbiAgICBjb25zdCB1dHhvUHNidCA9IGNyZWF0ZVBzYnRGcm9tSGV4KHBzYnRIZXgsIG5ldHdvcmspO1xyXG4gICAgY29uc3QgcHNidCA9IGNyZWF0ZVBzYnRGb3JOZXR3b3JrKHsgbmV0d29yazogdXR4b1BzYnQubmV0d29yayB9KTtcclxuICAgIGNvbnN0IHR4SW5wdXRzID0gdXR4b1BzYnQudHhJbnB1dHM7XHJcbiAgICB1dHhvUHNidC5kYXRhLmlucHV0cy5tYXAoKGlucHV0LCBpaSkgPT4ge1xyXG4gICAgICBjb25zdCB7IGhhc2gsIGluZGV4IH0gPSB0eElucHV0c1tpaV07XHJcbiAgICAgIGlmIChyZW1vdmUuaW5wdXQgJiYgaWkgPT09IHJlbW92ZS5pbnB1dC5pbmRleCkge1xyXG4gICAgICAgIGRlbGV0ZSBpbnB1dFtyZW1vdmUuaW5wdXQuZmllbGRUb1JlbW92ZV07XHJcbiAgICAgIH1cclxuICAgICAgcHNidC5hZGRJbnB1dCh7IC4uLmlucHV0LCBoYXNoLCBpbmRleCB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHR4T3V0cHV0cyA9IHV0eG9Qc2J0LnR4T3V0cHV0cztcclxuICAgIHV0eG9Qc2J0LmRhdGEub3V0cHV0cy5tYXAoKG91dHB1dCwgaWkpID0+IHtcclxuICAgICAgaWYgKHJlbW92ZS5vdXRwdXQgJiYgcmVtb3ZlLm91dHB1dC5pbmRleCA9PT0gaWkpIHtcclxuICAgICAgICBkZWxldGUgb3V0cHV0W3JlbW92ZS5vdXRwdXQuZmllbGRUb1JlbW92ZV07XHJcbiAgICAgIH1cclxuICAgICAgcHNidC5hZGRPdXRwdXQoeyAuLi5vdXRwdXQsIHNjcmlwdDogdHhPdXRwdXRzW2lpXS5zY3JpcHQsIHZhbHVlOiB0eE91dHB1dHNbaWldLnZhbHVlIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcHNidDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNpZ25BbGxJbnB1dHMocHNidDogVXR4b1BzYnQsIHsgYXNzZXJ0VmFsaWRTaWduYXR1cmVzQW5kRXh0cmFjdGFibGUgPSB0cnVlIH0gPSB7fSkge1xyXG4gICAgcHNidC5kYXRhLmlucHV0cy5mb3JFYWNoKChpbnB1dCwgaW5wdXRJbmRleCkgPT4ge1xyXG4gICAgICBjb25zdCBwYXJzZWRJbnB1dCA9IHBhcnNlUHNidElucHV0KGlucHV0KTtcclxuICAgICAgaWYgKHBhcnNlZElucHV0LnNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJykge1xyXG4gICAgICAgIHBzYnQuc2V0SW5wdXRNdXNpZzJOb25jZUhEKGlucHV0SW5kZXgsIHJvb3RXYWxsZXRLZXlzW3NpZ25lcl0pO1xyXG4gICAgICAgIHBzYnQuc2V0SW5wdXRNdXNpZzJOb25jZUhEKGlucHV0SW5kZXgsIHJvb3RXYWxsZXRLZXlzW2Nvc2lnbmVyXSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwYXJzZWRJbnB1dC5zY3JpcHRUeXBlID09PSAncDJzaFAycGsnKSB7XHJcbiAgICAgICAgcHNidC5zaWduSW5wdXQoaW5wdXRJbmRleCwgcmVwbGF5UHJvdGVjdGlvbktleVBhaXIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBzYnQuc2lnbklucHV0SEQoaW5wdXRJbmRleCwgcm9vdFdhbGxldEtleXNbc2lnbmVyXSk7XHJcbiAgICAgICAgcHNidC5zaWduSW5wdXRIRChpbnB1dEluZGV4LCByb290V2FsbGV0S2V5c1tjb3NpZ25lcl0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoYXNzZXJ0VmFsaWRTaWduYXR1cmVzQW5kRXh0cmFjdGFibGUpIHtcclxuICAgICAgYXNzZXJ0Lm9rKHBzYnQudmFsaWRhdGVTaWduYXR1cmVzT2ZBbGxJbnB1dHMoKSk7XHJcbiAgICAgIHBzYnQuZmluYWxpemVBbGxJbnB1dHMoKTtcclxuICAgICAgY29uc3QgdHhFeHRyYWN0ZWQgPSBwc2J0LmV4dHJhY3RUcmFuc2FjdGlvbigpO1xyXG4gICAgICBhc3NlcnQub2sodHhFeHRyYWN0ZWQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHBzYnRIZXg6IHN0cmluZztcclxuICBsZXQgdW5zcGVudHM6IFVuc3BlbnQ8YmlnaW50PltdO1xyXG4gIGNvbnN0IHNpZ25lciA9ICd1c2VyJztcclxuICBjb25zdCBjb3NpZ25lciA9ICdiaXRnbyc7XHJcbiAgY29uc3Qgc2NyaXB0VHlwZXMgPSBbLi4uc2NyaXB0VHlwZXMyT2YzLCAncDJzaFAycGsnXSBhcyAoU2NyaXB0VHlwZTJPZjMgfCBTY3JpcHRUeXBlUDJzaFAycGspW107XHJcbiAgY29uc3Qgb3V0cHV0VmFsdWUgPSBCaWdJbnQoKDJlOCAqIHNjcmlwdFR5cGVzLmxlbmd0aCAtIDEwMCkgLyA1KTtcclxuICBjb25zdCBvdXRwdXRzID0gW1xyXG4gICAgeyBjaGFpbjogZ2V0RXh0ZXJuYWxDaGFpbkNvZGUoJ3Ayc2gnKSwgaW5kZXg6IDg4LCB2YWx1ZTogb3V0cHV0VmFsdWUgfSxcclxuICAgIHsgY2hhaW46IGdldEV4dGVybmFsQ2hhaW5Db2RlKCdwMnNoUDJ3c2gnKSwgaW5kZXg6IDg5LCB2YWx1ZTogb3V0cHV0VmFsdWUgfSxcclxuICAgIHsgY2hhaW46IGdldEV4dGVybmFsQ2hhaW5Db2RlKCdwMndzaCcpLCBpbmRleDogOTAsIHZhbHVlOiBvdXRwdXRWYWx1ZSB9LFxyXG4gICAgeyBjaGFpbjogZ2V0RXh0ZXJuYWxDaGFpbkNvZGUoJ3AydHInKSwgaW5kZXg6IDkxLCB2YWx1ZTogb3V0cHV0VmFsdWUgfSxcclxuICAgIHsgY2hhaW46IGdldEV4dGVybmFsQ2hhaW5Db2RlKCdwMnRyTXVzaWcyJyksIGluZGV4OiA5MiwgdmFsdWU6IG91dHB1dFZhbHVlIH0sXHJcbiAgXTtcclxuICBiZWZvcmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdW5zcGVudHMgPSBtb2NrVW5zcGVudHMocm9vdFdhbGxldEtleXMsIHNjcmlwdFR5cGVzLCBCaWdJbnQoMmU4KSwgbmV0d29yayk7XHJcbiAgICBjb25zdCBwc2J0ID0gY29uc3RydWN0UHNidCh1bnNwZW50cywgcm9vdFdhbGxldEtleXMsIHNpZ25lciwgY29zaWduZXIsIG91dHB1dHMpO1xyXG4gICAgcHNidEhleCA9IHBzYnQudG9IZXgoKTtcclxuICB9KTtcclxuXHJcbiAgaXQoJ2NhbiBjcmVhdGUgYSBzaWduLWFibGUgcHNidCBmcm9tIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGV4dHJhY3RlZCBmcm9tIHRoZSBwc2J0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRydWUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcHNidE9yaWcgPSBjcmVhdGVQc2J0RnJvbUhleChwc2J0SGV4LCBuZXR3b3JrKTtcclxuICAgIGNvbnN0IHR4ID0gcHNidE9yaWcuZ2V0VW5zaWduZWRUeCgpO1xyXG4gICAgY29uc3QgcHNidCA9IGNyZWF0ZVBzYnRGcm9tVHJhbnNhY3Rpb24oXHJcbiAgICAgIHR4LFxyXG4gICAgICB1bnNwZW50cy5tYXAoKHUpID0+IHRvUHJldk91dHB1dCh1LCBuZXR3b3JrKSlcclxuICAgICk7XHJcbiAgICB1bnNwZW50cy5mb3JFYWNoKCh1LCBpbnB1dEluZGV4KSA9PiB7XHJcbiAgICAgIGlmIChpc1dhbGxldFVuc3BlbnQodSkpIHtcclxuICAgICAgICB1cGRhdGVXYWxsZXRVbnNwZW50Rm9yUHNidChwc2J0LCBpbnB1dEluZGV4LCB1LCByb290V2FsbGV0S2V5cywgc2lnbmVyLCBjb3NpZ25lcik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgeyByZWRlZW1TY3JpcHQgfSA9IGNyZWF0ZU91dHB1dFNjcmlwdFAyc2hQMnBrKHJlcGxheVByb3RlY3Rpb25LZXlQYWlyLnB1YmxpY0tleSk7XHJcbiAgICAgICAgdXBkYXRlUmVwbGF5UHJvdGVjdGlvblVuc3BlbnRUb1BzYnQocHNidCwgaW5wdXRJbmRleCwgdSwgcmVkZWVtU2NyaXB0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgc2lnbkFsbElucHV0cyhwc2J0KTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgY29tcG9uZW50c09uRWFjaElucHV0U2NyaXB0VHlwZSA9IHtcclxuICAgIHAyc2g6IFsnbm9uV2l0bmVzc1V0eG8nLCAncmVkZWVtU2NyaXB0JywgJ2JpcDMyRGVyaXZhdGlvbiddLFxyXG4gICAgcDJzaFAyd3NoOiBbJ3dpdG5lc3NVdHhvJywgJ2JpcDMyRGVyaXZhdGlvbicsICdyZWRlZW1TY3JpcHQnLCAnd2l0bmVzc1NjcmlwdCddLFxyXG4gICAgcDJ3c2g6IFsnd2l0bmVzc1V0eG8nLCAnd2l0bmVzc1NjcmlwdCcsICdiaXAzMkRlcml2YXRpb24nXSxcclxuICAgIHAydHI6IFsnd2l0bmVzc1V0eG8nLCAndGFwTGVhZlNjcmlwdCcsICd0YXBCaXAzMkRlcml2YXRpb24nXSxcclxuICAgIHAydHJNdXNpZzI6IFsnd2l0bmVzc1V0eG8nLCAndGFwQmlwMzJEZXJpdmF0aW9uJywgJ3RhcEludGVybmFsS2V5JywgJ3RhcE1lcmtsZVJvb3QnLCAndW5rbm93bktleVZhbHMnXSxcclxuICAgIHAyc2hQMnBrOiBbJ3JlZGVlbVNjcmlwdCcsICdub25XaXRuZXNzVXR4byddLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHAydHJDb21wb25lbnRzID0gWyd0YXBUcmVlJywgJ3RhcEludGVybmFsS2V5JywgJ3RhcEJpcDMyRGVyaXZhdGlvbiddO1xyXG4gIGNvbnN0IGNvbXBvbmVudHNPbkVhY2hPdXRwdXRTY3JpcHRUeXBlID0ge1xyXG4gICAgcDJzaDogWydiaXAzMkRlcml2YXRpb24nLCAncmVkZWVtU2NyaXB0J10sXHJcbiAgICBwMnNoUDJ3c2g6IFsnYmlwMzJEZXJpdmF0aW9uJywgJ3dpdG5lc3NTY3JpcHQnLCAncmVkZWVtU2NyaXB0J10sXHJcbiAgICBwMndzaDogWydiaXAzMkRlcml2YXRpb24nLCAnd2l0bmVzc1NjcmlwdCddLFxyXG4gICAgcDJ0cjogcDJ0ckNvbXBvbmVudHMsXHJcbiAgICBwMnRyTXVzaWcyOiBwMnRyQ29tcG9uZW50cyxcclxuICAgIHAyc2hQMnBrOiBbXSxcclxuICB9O1xyXG4gIHNjcmlwdFR5cGVzLmZvckVhY2goKHNjcmlwdFR5cGUsIGkpID0+IHtcclxuICAgIGNvbXBvbmVudHNPbkVhY2hJbnB1dFNjcmlwdFR5cGVbc2NyaXB0VHlwZV0uZm9yRWFjaCgoaW5wdXRDb21wb25lbnQpID0+IHtcclxuICAgICAgaXQoYFske3NjcmlwdFR5cGV9XSBtaXNzaW5nICR7aW5wdXRDb21wb25lbnR9IG9uIGlucHV0IHNob3VsZCBzdWNjZWVkIGluIGZ1bGx5IHNpZ25pbmcgdW5zaWduZWQgcHNidCBhZnRlciB1cGRhdGVgLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgcHNidCA9IHJlbW92ZUZyb21Qc2J0KHBzYnRIZXgsIG5ldHdvcmssIHsgaW5wdXQ6IHsgaW5kZXg6IGksIGZpZWxkVG9SZW1vdmU6IGlucHV0Q29tcG9uZW50IH0gfSk7XHJcbiAgICAgICAgY29uc3QgdW5zcGVudCA9IHVuc3BlbnRzW2ldO1xyXG4gICAgICAgIGlmIChpc1dhbGxldFVuc3BlbnQodW5zcGVudCkpIHtcclxuICAgICAgICAgIHVwZGF0ZVdhbGxldFVuc3BlbnRGb3JQc2J0KHBzYnQsIGksIHVuc3BlbnQsIHJvb3RXYWxsZXRLZXlzLCBzaWduZXIsIGNvc2lnbmVyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgeyByZWRlZW1TY3JpcHQgfSA9IGNyZWF0ZU91dHB1dFNjcmlwdFAyc2hQMnBrKHJlcGxheVByb3RlY3Rpb25LZXlQYWlyLnB1YmxpY0tleSk7XHJcbiAgICAgICAgICBhc3NlcnQub2socmVkZWVtU2NyaXB0KTtcclxuICAgICAgICAgIHVwZGF0ZVJlcGxheVByb3RlY3Rpb25VbnNwZW50VG9Qc2J0KHBzYnQsIGksIHVuc3BlbnQsIHJlZGVlbVNjcmlwdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNpZ25BbGxJbnB1dHMocHNidCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29tcG9uZW50c09uRWFjaE91dHB1dFNjcmlwdFR5cGVbc2NyaXB0VHlwZV0uZm9yRWFjaCgob3V0cHV0Q29tcG9uZW50KSA9PiB7XHJcbiAgICAgIGl0KGBbJHtzY3JpcHRUeXBlfV0gbWlzc2luZyAke291dHB1dENvbXBvbmVudH0gb24gb3V0cHV0IHNob3VsZCBwcm9kdWNlIHNhbWUgaGV4IGFzIGZ1bGx5IGh5ZHJhdGVkIGFmdGVyIHVwZGF0ZWAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCBwc2J0ID0gcmVtb3ZlRnJvbVBzYnQocHNidEhleCwgbmV0d29yaywgeyBvdXRwdXQ6IHsgaW5kZXg6IGksIGZpZWxkVG9SZW1vdmU6IG91dHB1dENvbXBvbmVudCB9IH0pO1xyXG4gICAgICAgIHVwZGF0ZVdhbGxldE91dHB1dEZvclBzYnQocHNidCwgcm9vdFdhbGxldEtleXMsIGksIG91dHB1dHNbaV0uY2hhaW4sIG91dHB1dHNbaV0uaW5kZXgpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChwc2J0LnRvSGV4KCksIHBzYnRIZXgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59KTtcclxuXHJcbmRlc2NyaWJlKCdQc2J0IGZyb20gdHJhbnNhY3Rpb24gdXNpbmcgd2FsbGV0IHVuc3BlbnRzJywgZnVuY3Rpb24gKCkge1xyXG4gIGZ1bmN0aW9uIHJ1blRlc3RTaWduVW5zcGVudHM8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oe1xyXG4gICAgaW5wdXRTY3JpcHRUeXBlcyxcclxuICAgIG91dHB1dFNjcmlwdFR5cGUsXHJcbiAgICBzaWduZXIsXHJcbiAgICBjb3NpZ25lcixcclxuICAgIGFtb3VudFR5cGUsXHJcbiAgICB0ZXN0T3V0cHV0QW1vdW50LFxyXG4gICAgc2lnbmF0dXJlVGFyZ2V0LFxyXG4gIH06IHtcclxuICAgIGlucHV0U2NyaXB0VHlwZXM6IElucHV0VHlwZVtdO1xyXG4gICAgb3V0cHV0U2NyaXB0VHlwZTogb3V0cHV0U2NyaXB0cy5TY3JpcHRUeXBlMk9mMztcclxuICAgIHNpZ25lcjogS2V5TmFtZTtcclxuICAgIGNvc2lnbmVyOiBLZXlOYW1lO1xyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JztcclxuICAgIHRlc3RPdXRwdXRBbW91bnQ6IFROdW1iZXI7XHJcbiAgICBzaWduYXR1cmVUYXJnZXQ6IFNpZ25hdHVyZVRhcmdldFR5cGU7XHJcbiAgfSkge1xyXG4gICAgaXQoYGNhbiBiZSBzaWduZWQgW2lucHV0cz0ke2lucHV0U2NyaXB0VHlwZXN9IHNpZ25lcj0ke3NpZ25lcn0gY29zaWduZXI9JHtjb3NpZ25lcn0gYW1vdW50VHlwZT0ke2Ftb3VudFR5cGV9IHNpZ25hdHVyZVRhcmdldD0ke3NpZ25hdHVyZVRhcmdldH1dYCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCB1bnNwZW50cyA9IG1vY2tVbnNwZW50cyhyb290V2FsbGV0S2V5cywgaW5wdXRTY3JpcHRUeXBlcywgdGVzdE91dHB1dEFtb3VudCwgbmV0d29yayk7XHJcbiAgICAgIC8vIGNvbnN0IHR4QnVpbGRlclBhcmFtcyA9IHsgbmV0d29yaywgY2hhbmdlSW5kZXg6IENIQU5HRV9JTkRFWCwgZmVlOiBGRUUgfTtcclxuICAgICAgY29uc3QgdHhCdWlsZGVyUGFyYW1zID0ge1xyXG4gICAgICAgIHNpZ25lcixcclxuICAgICAgICBjb3NpZ25lcixcclxuICAgICAgICBhbW91bnRUeXBlLFxyXG4gICAgICAgIG91dHB1dFR5cGU6IG91dHB1dFNjcmlwdFR5cGUsXHJcbiAgICAgICAgc2lnbmF0dXJlVGFyZ2V0OiBzaWduYXR1cmVUYXJnZXQsXHJcbiAgICAgICAgbmV0d29yayxcclxuICAgICAgICBjaGFuZ2VJbmRleDogQ0hBTkdFX0lOREVYLFxyXG4gICAgICAgIGZlZTogRkVFLFxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCB0eCA9IGNvbnN0cnVjdFRyYW5zYWN0aW9uVXNpbmdUeEJ1aWxkZXIodW5zcGVudHMsIHJvb3RXYWxsZXRLZXlzLCB0eEJ1aWxkZXJQYXJhbXMpO1xyXG5cclxuICAgICAgY29uc3QgdW5zcGVudEJpZ0ludCA9IHRvQmlnSW50KHVuc3BlbnRzKTtcclxuXHJcbiAgICAgIGNvbnN0IHBzYnQgPSB0b1dhbGxldFBzYnQodHgsIHVuc3BlbnRCaWdJbnQsIHJvb3RXYWxsZXRLZXlzKTtcclxuXHJcbiAgICAgIHZhbGlkYXRlUHNidFBhcnNpbmcodHgsIHBzYnQsIHVuc3BlbnRCaWdJbnQsIHNpZ25hdHVyZVRhcmdldCk7XHJcblxyXG4gICAgICAvLyBDaGVjayB0aGF0IHRoZSBjb3JyZWN0IHVuc3BlbnQgY29ycmVzcG9uZHMgdG8gdGhlIGlucHV0XHJcbiAgICAgIHVuc3BlbnRCaWdJbnQuZm9yRWFjaCgodW5zcGVudCwgaW5wdXRJbmRleCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IG90aGVyVW5zcGVudCA9IGlucHV0SW5kZXggPT09IDAgPyB1bnNwZW50QmlnSW50WzFdIDogdW5zcGVudEJpZ0ludFswXTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwocHNidEluY2x1ZGVzVW5zcGVudEF0SW5kZXgocHNidCwgaW5wdXRJbmRleCwgdW5zcGVudC5pZCksIHRydWUpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChwc2J0SW5jbHVkZXNVbnNwZW50QXRJbmRleChwc2J0LCBpbnB1dEluZGV4LCBvdGhlclVuc3BlbnQuaWQpLCBmYWxzZSk7XHJcbiAgICAgICAgdXBkYXRlV2FsbGV0VW5zcGVudEZvclBzYnQocHNidCwgaW5wdXRJbmRleCwgdW5zcGVudCwgcm9vdFdhbGxldEtleXMsIHNpZ25lciwgY29zaWduZXIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmIChzaWduYXR1cmVUYXJnZXQgIT09ICdmdWxsc2lnbmVkJykge1xyXG4gICAgICAgIC8vIE5vdyBzaWduaW5nIHRvIG1ha2UgaXQgZnVsbHkgc2lnbmVkIHBzYnQuXHJcbiAgICAgICAgLy8gU28gaXQgd2lsbCBiZSBlYXN5IHRvIHZlcmlmeSBpdHMgdmFsaWRpdHkgd2l0aCBhbm90aGVyIHNpbWlsYXIgdHggdG8gYmUgYnVpbHQgd2l0aCB0eCBidWlsZGVyLlxyXG4gICAgICAgIHNpZ25Qc2J0KHBzYnQsIHVuc3BlbnRCaWdJbnQsIHJvb3RXYWxsZXRLZXlzLCBzaWduZXIsIGNvc2lnbmVyLCBzaWduYXR1cmVUYXJnZXQpO1xyXG4gICAgICB9XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwocHNidC52YWxpZGF0ZVNpZ25hdHVyZXNPZkFsbElucHV0cygpLCB0cnVlKTtcclxuICAgICAgcHNidC5maW5hbGl6ZUFsbElucHV0cygpO1xyXG4gICAgICBjb25zdCB0eEZyb21Qc2J0ID0gcHNidC5leHRyYWN0VHJhbnNhY3Rpb24oKTtcclxuXHJcbiAgICAgIGNvbnN0IHR4QnVpbGRlclBhcmFtczIgPSB7XHJcbiAgICAgICAgc2lnbmVyLFxyXG4gICAgICAgIGNvc2lnbmVyLFxyXG4gICAgICAgIGFtb3VudFR5cGUsXHJcbiAgICAgICAgb3V0cHV0VHlwZTogb3V0cHV0U2NyaXB0VHlwZSxcclxuICAgICAgICBzaWduYXR1cmVUYXJnZXQ6ICdmdWxsc2lnbmVkJyBhcyBTaWduYXR1cmVUYXJnZXRUeXBlLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAgY2hhbmdlSW5kZXg6IENIQU5HRV9JTkRFWCxcclxuICAgICAgICBmZWU6IEZFRSxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIE5ldyBsZWdhY3kgdHggcmVzZW1ibGVzIHRoZSBzaWduZWQgcHNidC5cclxuICAgICAgY29uc3QgdHhGcm9tVHhCdWlsZGVyID0gY29uc3RydWN0VHJhbnNhY3Rpb25Vc2luZ1R4QnVpbGRlcih1bnNwZW50cywgcm9vdFdhbGxldEtleXMsIHR4QnVpbGRlclBhcmFtczIpO1xyXG5cclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCh0eEZyb21Qc2J0LmdldEhhc2goKSwgdHhGcm9tVHhCdWlsZGVyLmdldEhhc2goKSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldElucHV0U2NyaXB0cygpOiBJbnB1dFR5cGVbXVtdIHtcclxuICAgIHJldHVybiBnZXRTY3JpcHRUeXBlczJPZjMoKS5mbGF0TWFwKCh0KSA9PiB7XHJcbiAgICAgIHJldHVybiBnZXRTY3JpcHRUeXBlczJPZjMoKS5mbGF0TWFwKChsYXN0VHlwZSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbW3QsIHQsIGxhc3RUeXBlXV07XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRTaWduZXJQYWlycyhjb250YWluc1RhcHJvb3RJbnB1dDogYm9vbGVhbik6IFtzaWduZXI6IEtleU5hbWUsIGNvc2lnbmVyOiBLZXlOYW1lXVtdIHtcclxuICAgIGNvbnN0IHNpZ25hdHVyZVBhaXJzID0gW1sndXNlcicsICdiaXRnbyddIGFzIFtzaWduZXI6IEtleU5hbWUsIGNvc2lnbmVyOiBLZXlOYW1lXV07XHJcbiAgICBpZiAoY29udGFpbnNUYXByb290SW5wdXQpIHtcclxuICAgICAgc2lnbmF0dXJlUGFpcnMucHVzaChbJ3VzZXInLCAnYmFja3VwJ10gYXMgW3NpZ25lcjogS2V5TmFtZSwgY29zaWduZXI6IEtleU5hbWVdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzaWduYXR1cmVQYWlycztcclxuICB9XHJcblxyXG4gIChbJ3Vuc2lnbmVkJywgJ2hhbGZzaWduZWQnLCAnZnVsbHNpZ25lZCddIGFzIFNpZ25hdHVyZVRhcmdldFR5cGVbXSkuZm9yRWFjaCgoc2lnbmF0dXJlVGFyZ2V0KSA9PiB7XHJcbiAgICBnZXRJbnB1dFNjcmlwdHMoKS5mb3JFYWNoKChpbnB1dFNjcmlwdFR5cGVzKSA9PiB7XHJcbiAgICAgIGdldFNpZ25lclBhaXJzKGlucHV0U2NyaXB0VHlwZXMuaW5jbHVkZXMoJ3AydHInKSkuZm9yRWFjaCgoW3NpZ25lciwgY29zaWduZXJdKSA9PiB7XHJcbiAgICAgICAgcnVuVGVzdFNpZ25VbnNwZW50cyh7XHJcbiAgICAgICAgICBpbnB1dFNjcmlwdFR5cGVzLFxyXG4gICAgICAgICAgb3V0cHV0U2NyaXB0VHlwZTogJ3Ayc2gnLFxyXG4gICAgICAgICAgc2lnbmVyLFxyXG4gICAgICAgICAgY29zaWduZXIsXHJcbiAgICAgICAgICBhbW91bnRUeXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgIHRlc3RPdXRwdXRBbW91bnQ6IGRlZmF1bHRUZXN0T3V0cHV0QW1vdW50LFxyXG4gICAgICAgICAgc2lnbmF0dXJlVGFyZ2V0LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJ1blRlc3RTaWduVW5zcGVudHM8YmlnaW50Pih7XHJcbiAgICAgICAgICBpbnB1dFNjcmlwdFR5cGVzLFxyXG4gICAgICAgICAgb3V0cHV0U2NyaXB0VHlwZTogJ3Ayc2gnLFxyXG4gICAgICAgICAgc2lnbmVyLFxyXG4gICAgICAgICAgY29zaWduZXIsXHJcbiAgICAgICAgICBhbW91bnRUeXBlOiAnYmlnaW50JyxcclxuICAgICAgICAgIHRlc3RPdXRwdXRBbW91bnQ6IEJpZ0ludCgnMTAwMDAwMDAwMDAwMDAwMDAnKSxcclxuICAgICAgICAgIHNpZ25hdHVyZVRhcmdldCxcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiB0ZXN0VXR4b1BzYnQoY29pbk5ldHdvcms6IE5ldHdvcmspIHtcclxuICBkZXNjcmliZShgVGVzdGluZyBVdHhvUHNidCAoZGUpc2VyaWFsaXphdGlvbiBmb3IgJHtnZXROZXR3b3JrTmFtZShjb2luTmV0d29yayl9IG5ldHdvcmtgLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgcHNidDogVXR4b1BzYnQ7XHJcbiAgICBsZXQgcHNidEhleDogc3RyaW5nO1xyXG4gICAgbGV0IHVuc3BlbnRzOiAoV2FsbGV0VW5zcGVudDxiaWdpbnQ+IHwgVW5zcGVudDxiaWdpbnQ+KVtdO1xyXG4gICAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdW5zcGVudHMgPSBtb2NrVW5zcGVudHMocm9vdFdhbGxldEtleXMsIFsncDJzaCddLCBCaWdJbnQoJzEwMDAwMDAwMDAwMDAwJyksIGNvaW5OZXR3b3JrKTtcclxuICAgICAgY29uc3QgdHhCdWlsZGVyUGFyYW1zID0ge1xyXG4gICAgICAgIHNpZ25lcjogJ3VzZXInLFxyXG4gICAgICAgIGNvc2lnbmVyOiAnYml0Z28nLFxyXG4gICAgICAgIGFtb3VudFR5cGU6ICdiaWdpbnQnLFxyXG4gICAgICAgIG91dHB1dFR5cGU6ICdwMnNoJyxcclxuICAgICAgICBzaWduYXR1cmVUYXJnZXQ6ICdmdWxsc2lnbmVkJyxcclxuICAgICAgICBuZXR3b3JrOiBjb2luTmV0d29yayxcclxuICAgICAgICBjaGFuZ2VJbmRleDogQ0hBTkdFX0lOREVYLFxyXG4gICAgICAgIGZlZTogRkVFLFxyXG4gICAgICB9IGFzIGNvbnN0O1xyXG4gICAgICBjb25zdCB0eCA9IGNvbnN0cnVjdFRyYW5zYWN0aW9uVXNpbmdUeEJ1aWxkZXIodW5zcGVudHMsIHJvb3RXYWxsZXRLZXlzLCB0eEJ1aWxkZXJQYXJhbXMpO1xyXG4gICAgICBwc2J0ID0gdG9XYWxsZXRQc2J0KHR4LCB0b0JpZ0ludCh1bnNwZW50cyksIHJvb3RXYWxsZXRLZXlzKTtcclxuICAgICAgaWYgKGNvaW5OZXR3b3JrID09PSBuZXR3b3Jrcy56Y2FzaCkge1xyXG4gICAgICAgIChwc2J0IGFzIFpjYXNoUHNidCkuc2V0RGVmYXVsdHNGb3JWZXJzaW9uKG5ldHdvcmssIDQ1MCk7XHJcbiAgICAgIH1cclxuICAgICAgcHNidEhleCA9IHBzYnQudG9IZXgoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgYmUgYWJsZSB0byBjbG9uZSBwc2J0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBjbG9uZSA9IHBzYnQuY2xvbmUoKTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChjbG9uZS50b0J1ZmZlcigpLCBwc2J0LnRvQnVmZmVyKCkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIHJvdW5kLXRyaXAnLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoY3JlYXRlUHNidEZyb21IZXgocHNidEhleCwgY29pbk5ldHdvcmssIGZhbHNlKS50b0J1ZmZlcigpLCBwc2J0LnRvQnVmZmVyKCkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGdldCB0cmFuc2FjdGlvbiBpbmZvIGZyb20gcHNidCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgdHhJbmZvID0gZ2V0VHJhbnNhY3Rpb25BbW91bnRzRnJvbVBzYnQocHNidCk7XHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eEluZm8uZmVlLCBGRUUpO1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJbmZvLmlucHV0Q291bnQsIHVuc3BlbnRzLmxlbmd0aCk7XHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eEluZm8uaW5wdXRBbW91bnQsIEJpZ0ludCgnMTAwMDAwMDAwMDAwMDAnKSAqIEJpZ0ludCh1bnNwZW50cy5sZW5ndGgpKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4SW5mby5vdXRwdXRBbW91bnQsIEJpZ0ludCgnMTAwMDAwMDAwMDAwMDAnKSAqIEJpZ0ludCh1bnNwZW50cy5sZW5ndGgpIC0gRkVFKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4SW5mby5vdXRwdXRDb3VudCwgcHNidC5kYXRhLm91dHB1dHMubGVuZ3RoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGRlc2VyaWFsaXplQmlwMzJQYXRoc0NvcnJlY3RseShiaXAzMlBhdGhzQWJzb2x1dGU6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgZnVuY3Rpb24gY2hlY2tEZXJpdmF0aW9uUHJlZml4KGJpcDMyRGVyaXZhdGlvbjogeyBwYXRoOiBzdHJpbmcgfSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IHBhdGggPSBiaXAzMkRlcml2YXRpb24ucGF0aC5zcGxpdCgnLycpO1xyXG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGJpcDMyUGF0aHNBYnNvbHV0ZSA/ICdtJyA6ICcwJztcclxuICAgICAgICBhc3NlcnQocGF0aFswXSA9PT0gcHJlZml4KTtcclxuICAgICAgfVxyXG4gICAgICBpdChgc2hvdWxkIGRlc2VyaWFsaXplIFBTQlQgYmlwMzJEZXJpdmF0aW9ucyB3aXRoIHBhdGhzICR7XHJcbiAgICAgICAgYmlwMzJQYXRoc0Fic29sdXRlID8gJycgOiAnbm90ICdcclxuICAgICAgfSBhYnNvbHV0ZWAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCBkZXNlcmlhbGl6ZWRQc2J0ID0gY3JlYXRlUHNidEZyb21IZXgocHNidEhleCwgY29pbk5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSk7XHJcbiAgICAgICAgYXNzZXJ0KGRlc2VyaWFsaXplZFBzYnQpO1xyXG4gICAgICAgIGRlc2VyaWFsaXplZFBzYnQuZGF0YS5pbnB1dHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcclxuICAgICAgICAgIGlucHV0Py5iaXAzMkRlcml2YXRpb24/LmZvckVhY2goKGRlcml2YXRpb24pID0+IGNoZWNrRGVyaXZhdGlvblByZWZpeChkZXJpdmF0aW9uKSk7XHJcbiAgICAgICAgICBpbnB1dD8udGFwQmlwMzJEZXJpdmF0aW9uPy5mb3JFYWNoKChkZXJpdmF0aW9uKSA9PiBjaGVja0Rlcml2YXRpb25QcmVmaXgoZGVyaXZhdGlvbikpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBbdHJ1ZSwgZmFsc2VdLmZvckVhY2goKGJpcDMyUGF0aHNBYnNvbHV0ZSkgPT4gZGVzZXJpYWxpemVCaXAzMlBhdGhzQ29ycmVjdGx5KGJpcDMyUGF0aHNBYnNvbHV0ZSkpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5bXHJcbiAgbmV0d29ya3MuYml0Y29pbixcclxuICBuZXR3b3Jrcy56Y2FzaCxcclxuICBuZXR3b3Jrcy5kYXNoLFxyXG4gIG5ldHdvcmtzLmRvZ2Vjb2luLFxyXG4gIG5ldHdvcmtzLmxpdGVjb2luLFxyXG4gIG5ldHdvcmtzLmJpdGhlcmV1bSxcclxuICBuZXR3b3Jrcy5zYWZlY29pbixcclxuICBuZXR3b3Jrcy5rb21vZG8sXHJcbiAgbmV0d29ya3MuemVsY2FzaCxcclxuICBuZXR3b3Jrcy5mbHV4LFxyXG4gIG5ldHdvcmtzLnplcm8sXHJcbiAgbmV0d29ya3Muc25vd2dlbSxcclxuICBuZXR3b3Jrcy5nZW1saW5rLFxyXG4gIG5ldHdvcmtzLmNvbW1lcmNpdW0sXHJcbiAgbmV0d29ya3MuemNsYXNzaWMsXHJcbiAgbmV0d29ya3MuYnplZGdlLFxyXG4gIG5ldHdvcmtzLmdlbmVzaXMsXHJcbiAgbmV0d29ya3MuYml0Y29pbnplcm8sXHJcbiAgbmV0d29ya3MuYml0Y29pbnosXHJcbiAgbmV0d29ya3MuaHVzaCxcclxuICBuZXR3b3Jrcy5yYXZlbmNvaW4sXHJcbiAgbmV0d29ya3MuYml0Y29yZSxcclxuICBuZXR3b3Jrcy56Y29pbixcclxuICBuZXR3b3Jrcy5heGUsXHJcbiAgbmV0d29ya3MuZGlnaWJ5dGUsXHJcbiAgbmV0d29ya3Muc2lub3ZhdGUsXHJcbiAgbmV0d29ya3MuaWxjb2luLFxyXG4gIG5ldHdvcmtzLnJhcHRvcmV1bSxcclxuICBuZXR3b3Jrcy52ZXJ0Y29pbixcclxuICBuZXR3b3Jrcy5jbG9yZSxcclxuXS5mb3JFYWNoKChjb2luTmV0d29yaykgPT5cclxuICB0ZXN0VXR4b1BzYnQoY29pbk5ldHdvcmspXHJcbik7XHJcbiJdfQ==