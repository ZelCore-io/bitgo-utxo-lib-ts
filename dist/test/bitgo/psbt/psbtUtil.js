"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructTransactionUsingTxBuilder = exports.signTxBuilder = exports.signPsbt = exports.toBigInt = exports.assertEqualTransactions = exports.validatePsbtParsing = void 0;
const bitgo_1 = require("../../../src/bitgo");
const Psbt_1 = require("../../../src/bitgo/wallet/Psbt");
const assert = require("assert");
function validateScript(psbtParsed, txParsed) {
    if (txParsed === undefined) {
        assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.pubScript), true);
        if (psbtParsed.scriptType === 'p2sh') {
            assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.redeemScript), true);
            assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.witnessScript), false);
        }
        else if (psbtParsed.scriptType === 'p2wsh') {
            assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.redeemScript), false);
            assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.witnessScript), true);
        }
        else if (psbtParsed.scriptType === 'p2shP2wsh') {
            assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.redeemScript), true);
            assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.witnessScript), true);
        }
        else if (psbtParsed.scriptType === 'taprootScriptPathSpend') {
            assert.deepStrictEqual((0, bitgo_1.isValidControlBock)(psbtParsed.controlBlock), true);
            assert.deepStrictEqual(psbtParsed.scriptPathLevel, (0, bitgo_1.calculateScriptPathLevel)(psbtParsed.controlBlock));
            assert.deepStrictEqual(psbtParsed.leafVersion, (0, bitgo_1.getLeafVersion)(psbtParsed.controlBlock));
        }
    }
    else {
        assert.ok(txParsed.scriptType !== 'taprootKeyPathSpend');
        assert.deepStrictEqual(txParsed.scriptType, psbtParsed.scriptType);
        assert.deepStrictEqual(txParsed.pubScript, psbtParsed.pubScript);
        if ((txParsed.scriptType === 'p2sh' && psbtParsed.scriptType === 'p2sh') ||
            (txParsed.scriptType === 'p2wsh' && psbtParsed.scriptType === 'p2wsh') ||
            (txParsed.scriptType === 'p2shP2wsh' && psbtParsed.scriptType === 'p2shP2wsh')) {
            assert.deepStrictEqual(txParsed.redeemScript, psbtParsed.redeemScript);
            assert.deepStrictEqual(txParsed.witnessScript, psbtParsed.witnessScript);
        }
        else if (txParsed.scriptType === 'taprootScriptPathSpend' && psbtParsed.scriptType === 'taprootScriptPathSpend') {
            // To ensure script path p2tr
            assert.deepStrictEqual(txParsed.publicKeys, psbtParsed.publicKeys);
            const txParsedP2trScriptPath = txParsed;
            assert.deepStrictEqual(txParsedP2trScriptPath.controlBlock, psbtParsed.controlBlock);
            assert.deepStrictEqual(txParsedP2trScriptPath.scriptPathLevel, psbtParsed.scriptPathLevel);
            assert.deepStrictEqual(txParsedP2trScriptPath.leafVersion, psbtParsed.leafVersion);
        }
    }
}
function validatePublicKeys(psbtParsed, txParsed) {
    var _a;
    if (txParsed === undefined) {
        assert.deepStrictEqual(psbtParsed.publicKeys.length, 3);
        psbtParsed.publicKeys.forEach((publicKey) => {
            assert.deepStrictEqual(Buffer.isBuffer(publicKey), true);
        });
    }
    else {
        assert.ok(txParsed.scriptType !== 'taprootKeyPathSpend');
        assert.deepStrictEqual(txParsed.publicKeys.length, (_a = psbtParsed.publicKeys) === null || _a === void 0 ? void 0 : _a.length);
        const pubKeyMatch = txParsed.publicKeys.every((txPubKey) => { var _a; return (_a = psbtParsed.publicKeys) === null || _a === void 0 ? void 0 : _a.some((psbtPubKey) => psbtPubKey.equals(txPubKey)); });
        assert.deepStrictEqual(pubKeyMatch, true);
    }
}
function validateSignature(psbtParsed, txParsed) {
    var _a;
    if (txParsed === undefined) {
        assert.deepStrictEqual(psbtParsed.signatures, undefined);
    }
    else {
        const txSignatures = txParsed.signatures.filter((txSig) => Buffer.isBuffer(txSig) && !(0, bitgo_1.isPlaceholderSignature)(txSig));
        assert.deepStrictEqual(txSignatures.length, (_a = psbtParsed.signatures) === null || _a === void 0 ? void 0 : _a.length);
        if (txSignatures.length < 1) {
            return;
        }
        const sigMatch = txSignatures.every((txSig) => { var _a; return Buffer.isBuffer(txSig) ? (_a = psbtParsed.signatures) === null || _a === void 0 ? void 0 : _a.some((psbtSig) => psbtSig.equals(txSig)) : true; });
        assert.deepStrictEqual(sigMatch, true);
    }
}
function validatePsbtParsing(tx, psbt, unspents, signatureTarget) {
    unspents.forEach((u, i) => {
        if (!(0, bitgo_1.isWalletUnspent)(u)) {
            return;
        }
        const scriptType = (0, bitgo_1.scriptTypeForChain)(u.chain);
        if (signatureTarget === 'unsigned') {
            if (scriptType === 'p2tr') {
                assert.throws(() => (0, Psbt_1.parsePsbtInput)(psbt.data.inputs[i]), (e) => e.message === 'could not parse input');
            }
            else {
                const psbtParsed = (0, Psbt_1.parsePsbtInput)(psbt.data.inputs[i]);
                assert.deepStrictEqual(psbtParsed.scriptType, scriptType);
                validateScript(psbtParsed, undefined);
                validatePublicKeys(psbtParsed, undefined);
                validateSignature(psbtParsed, undefined);
            }
        }
        else {
            const psbtParsed = (0, Psbt_1.parsePsbtInput)(psbt.data.inputs[i]);
            assert.strictEqual(psbtParsed.scriptType, scriptType === 'p2tr' ? 'taprootScriptPathSpend' : scriptType);
            assert.ok(psbtParsed.scriptType !== 'p2shP2pk');
            const txParsed = (0, bitgo_1.parseSignatureScript2Of3)(tx.ins[i]);
            validateScript(psbtParsed, txParsed);
            validatePublicKeys(psbtParsed, txParsed);
            validateSignature(psbtParsed, txParsed);
        }
    });
}
exports.validatePsbtParsing = validatePsbtParsing;
function assertEqualTransactions(txOne, txTwo) {
    assert.ok(txOne.network === txTwo.network);
    assert.ok(txOne.getId() === txTwo.getId());
    assert.ok(txOne.toHex() === txTwo.toHex());
    assert.ok(txOne.virtualSize() === txTwo.virtualSize());
    assert.ok(txOne.locktime === txTwo.locktime);
    assert.ok(txOne.version === txTwo.version);
    assert.ok(txOne.weight() === txTwo.weight());
    assert.ok(txOne.ins.length === txTwo.ins.length);
    assert.ok(txOne.outs.length === txTwo.outs.length);
    txOne.ins.forEach((_, i) => {
        const parsedInputOne = (0, bitgo_1.parseSignatureScript2Of3)(txOne.ins[i]);
        const parsedInputTwo = (0, bitgo_1.parseSignatureScript2Of3)(txTwo.ins[i]);
        assert.deepStrictEqual(parsedInputOne, parsedInputTwo);
    });
    txOne.outs.forEach((_, i) => {
        assert.deepStrictEqual(txOne.outs[i], txTwo.outs[i]);
    });
    assert.ok(txOne.toBuffer().equals(txTwo.toBuffer()));
}
exports.assertEqualTransactions = assertEqualTransactions;
function toBigInt(unspents) {
    return unspents.map((u) => {
        if ((0, bitgo_1.isWalletUnspent)(u)) {
            return { ...u, value: BigInt(u.value) };
        }
        throw new Error('invalid unspent');
    });
}
exports.toBigInt = toBigInt;
function signPsbt(psbt, unspents, rootWalletKeys, signer, cosigner, signatureTarget) {
    unspents.forEach((u, i) => {
        if (!(0, bitgo_1.isWalletUnspent)(u)) {
            throw new Error('invalid unspent');
        }
        try {
            if (signatureTarget === 'unsigned') {
                (0, Psbt_1.signWalletPsbt)(psbt, i, rootWalletKeys[signer], u);
            }
            (0, Psbt_1.signWalletPsbt)(psbt, i, rootWalletKeys[cosigner], u);
        }
        catch (err) {
            assert.deepStrictEqual(signatureTarget, 'unsigned');
            assert.deepStrictEqual((0, bitgo_1.scriptTypeForChain)(u.chain), 'p2tr');
            assert.deepStrictEqual(psbt.data.inputs[i].tapLeafScript, undefined);
            assert.deepStrictEqual(psbt.data.inputs[i].tapBip32Derivation, undefined);
            assert.deepStrictEqual(psbt.data.inputs[i].tapScriptSig, undefined);
            assert.ok(psbt.data.inputs[i].witnessUtxo);
        }
    });
}
exports.signPsbt = signPsbt;
function signTxBuilder(txb, unspents, rootWalletKeys, signer, cosigner, signatureTarget) {
    let walletUnspentSigners = [];
    if (signatureTarget === 'halfsigned') {
        walletUnspentSigners = [bitgo_1.WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signer], rootWalletKeys[cosigner])];
    }
    else if (signatureTarget === 'fullsigned') {
        walletUnspentSigners = [
            bitgo_1.WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signer], rootWalletKeys[cosigner]),
            bitgo_1.WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[cosigner], rootWalletKeys[signer]),
        ];
    }
    walletUnspentSigners.forEach((walletSigner, nSignature) => {
        unspents.forEach((u, i) => {
            if ((0, bitgo_1.isWalletUnspent)(u)) {
                (0, bitgo_1.signInputWithUnspent)(txb, i, u, walletSigner);
            }
            else {
                throw new Error(`unexpected unspent ${u.id}`);
            }
        });
    });
    return signatureTarget === 'fullsigned' ? txb.build() : txb.buildIncomplete();
}
exports.signTxBuilder = signTxBuilder;
function constructTransactionUsingTxBuilder(unspents, rootWalletKeys, params) {
    const txb = (0, bitgo_1.createTransactionBuilderForNetwork)(params.network);
    const total = BigInt((0, bitgo_1.unspentSum)(unspents, params.amountType));
    // Kinda weird, treating entire value as change, but tests the relevant paths
    txb.addOutput((0, bitgo_1.getWalletAddress)(rootWalletKeys, (0, bitgo_1.getInternalChainCode)(params.outputType), params.changeIndex, params.network), (0, bitgo_1.toTNumber)(total - params.fee, params.amountType));
    unspents.forEach((u) => {
        (0, bitgo_1.addToTransactionBuilder)(txb, u);
    });
    return signTxBuilder(txb, unspents, rootWalletKeys, params.signer, params.cosigner, params.signatureTarget).clone('bigint');
}
exports.constructTransactionUsingTxBuilder = constructTransactionUsingTxBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHNidFV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2JpdGdvL3BzYnQvcHNidFV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsOENBNkI0QjtBQUM1Qix5REFBZ0Y7QUFDaEYsaUNBQWlDO0FBSWpDLFNBQVMsY0FBYyxDQUNyQixVQUE4QyxFQUM5QyxRQUE4RTtJQUU5RSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7UUFDMUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwRSxJQUFJLFVBQVUsQ0FBQyxVQUFVLEtBQUssTUFBTSxFQUFFO1lBQ3BDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMxRTthQUFNLElBQUksVUFBVSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUU7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3pFO2FBQU0sSUFBSSxVQUFVLENBQUMsVUFBVSxLQUFLLFdBQVcsRUFBRTtZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0s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QUFlLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBQSxVQUFVLENBQUMsVUFBVSwwQ0FBRSxNQUFNLENBQUMsQ0FBQztRQUNsRixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFdBQ3pELE9BQUEsTUFBQSxVQUFVLENBQUMsVUFBVSwwQ0FBRSxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQSxFQUFBLENBQ3pFLENBQUM7UUFDRixNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMzQztBQUNILENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUN4QixVQUE4QyxFQUM5QyxRQUE4RTs7SUFFOUUsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1FBQzFCLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUMxRDtTQUFNO1FBQ0wsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQzdDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBQSw4QkFBc0IsRUFBQyxLQUFLLENBQUMsQ0FDcEUsQ0FBQztRQUNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFBLFVBQVUsQ0FBQyxVQUFVLDBDQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzNFLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDM0IsT0FBTztTQUNSO1FBQ0QsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLFdBQzVDLE9BQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENB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U0FBUyxDQUNYLElBQUEsd0JBQWdCLEVBQUMsY0FBYyxFQUFFLElBQUEsNEJBQW9CLEVBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUM3RyxJQUFBLGlCQUFTLEVBQVUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUMxRCxDQUFDO0lBQ0YsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ3JCLElBQUEsK0JBQXVCLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxhQUFhLENBQ2xCLEdBQUcsRUFDSCxRQUFRLEVBQ1IsY0FBYyxFQUNkLE1BQU0sQ0FBQyxNQUFNLEVBQ2IsTUFBTSxDQUFDLFFBQVEsRUFDZixNQUFNLENBQUMsZUFBZSxDQUN2QixDQUFDLEtBQUssQ0FBUyxRQUFRLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBakNELGdGQWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgYWRkVG9UcmFuc2FjdGlvbkJ1aWxkZXIsXHJcbiAgZ2V0TGVhZlZlcnNpb24sXHJcbiAgY2FsY3VsYXRlU2NyaXB0UGF0aExldmVsLFxyXG4gIGNyZWF0ZVRyYW5zYWN0aW9uQnVpbGRlckZvck5ldHdvcmssXHJcbiAgZ2V0SW50ZXJuYWxDaGFpbkNvZGUsXHJcbiAgZ2V0V2FsbGV0QWRkcmVzcyxcclxuICBpc1BsYWNlaG9sZGVyU2lnbmF0dXJlLFxyXG4gIGlzVmFsaWRDb250cm9sQm9jayxcclxuICBpc1dhbGxldFVuc3BlbnQsXHJcbiAgb3V0cHV0U2NyaXB0cyxcclxuICBQYXJzZWRTaWduYXR1cmVTY3JpcHRQMm1zLFxyXG4gIFBhcnNlZFNpZ25hdHVyZVNjcmlwdFRhcHJvb3QsXHJcbiAgUGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdFNjcmlwdFBhdGgsXHJcbiAgcGFyc2VTaWduYXR1cmVTY3JpcHQyT2YzLFxyXG4gIFJvb3RXYWxsZXRLZXlzLFxyXG4gIHNjcmlwdFR5cGVGb3JDaGFpbixcclxuICBzaWduSW5wdXRXaXRoVW5zcGVudCxcclxuICB0b1ROdW1iZXIsXHJcbiAgVW5zcGVudCxcclxuICB1bnNwZW50U3VtLFxyXG4gIFV0eG9Qc2J0LFxyXG4gIFV0eG9UcmFuc2FjdGlvbixcclxuICBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyLFxyXG4gIFdhbGxldFVuc3BlbnQsXHJcbiAgV2FsbGV0VW5zcGVudFNpZ25lcixcclxuICBLZXlOYW1lLFxyXG4gIFBhcnNlZFBzYnRQMm1zLFxyXG4gIFBhcnNlZFBzYnRUYXByb290LFxyXG59IGZyb20gJy4uLy4uLy4uL3NyYy9iaXRnbyc7XHJcbmltcG9ydCB7IHBhcnNlUHNidElucHV0LCBzaWduV2FsbGV0UHNidCB9IGZyb20gJy4uLy4uLy4uL3NyYy9iaXRnby93YWxsZXQvUHNidCc7XHJcbmltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgeyBTaWduYXR1cmVUYXJnZXRUeXBlIH0gZnJvbSAnLi9Qc2J0JztcclxuaW1wb3J0IHsgTmV0d29yayB9IGZyb20gJy4uLy4uLy4uL3NyYyc7XHJcblxyXG5mdW5jdGlvbiB2YWxpZGF0ZVNjcmlwdChcclxuICBwc2J0UGFyc2VkOiBQYXJzZWRQc2J0UDJtcyB8IFBhcnNlZFBzYnRUYXByb290LFxyXG4gIHR4UGFyc2VkOiBQYXJzZWRTaWduYXR1cmVTY3JpcHRQMm1zIHwgUGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdCB8IHVuZGVmaW5lZFxyXG4pIHtcclxuICBpZiAodHhQYXJzZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChCdWZmZXIuaXNCdWZmZXIocHNidFBhcnNlZC5wdWJTY3JpcHQpLCB0cnVlKTtcclxuXHJcbiAgICBpZiAocHNidFBhcnNlZC5zY3JpcHRUeXBlID09PSAncDJzaCcpIHtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChCdWZmZXIuaXNCdWZmZXIocHNidFBhcnNlZC5yZWRlZW1TY3JpcHQpLCB0cnVlKTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChCdWZmZXIuaXNCdWZmZXIocHNidFBhcnNlZC53aXRuZXNzU2NyaXB0KSwgZmFsc2UpO1xyXG4gICAgfSBlbHNlIGlmIChwc2J0UGFyc2VkLnNjcmlwdFR5cGUgPT09ICdwMndzaCcpIHtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChCdWZmZXIuaXNCdWZmZXIocHNidFBhcnNlZC5yZWRlZW1TY3JpcHQpLCBmYWxzZSk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoQnVmZmVyLmlzQnVmZmVyKHBzYnRQYXJzZWQud2l0bmVzc1NjcmlwdCksIHRydWUpO1xyXG4gICAgfSBlbHNlIGlmIChwc2J0UGFyc2VkLnNjcmlwdFR5cGUgPT09ICdwMnNoUDJ3c2gnKSB7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoQnVmZmVyLmlzQnVmZmVyKHBzYnRQYXJzZWQucmVkZWVtU2NyaXB0KSwgdHJ1ZSk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoQnVmZmVyLmlzQnVmZmVyKHBzYnRQYXJzZWQud2l0bmVzc1NjcmlwdCksIHRydWUpO1xyXG4gICAgfSBlbHNlIGlmIChwc2J0UGFyc2VkLnNjcmlwdFR5cGUgPT09ICd0YXByb290U2NyaXB0UGF0aFNwZW5kJykge1xyXG4gICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKGlzVmFsaWRDb250cm9sQm9jayhwc2J0UGFyc2VkLmNvbnRyb2xCbG9jayksIHRydWUpO1xyXG4gICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHBzYnRQYXJzZWQuc2NyaXB0UGF0aExldmVsLCBjYWxjdWxhdGVTY3JpcHRQYXRoTGV2ZWwocHNidFBhcnNlZC5jb250cm9sQmxvY2spKTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChwc2J0UGFyc2VkLmxlYWZWZXJzaW9uLCBnZXRMZWFmVmVyc2lvbihwc2J0UGFyc2VkLmNvbnRyb2xCbG9jaykpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBhc3NlcnQub2sodHhQYXJzZWQuc2NyaXB0VHlwZSAhPT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnKTtcclxuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhQYXJzZWQuc2NyaXB0VHlwZSwgcHNidFBhcnNlZC5zY3JpcHRUeXBlKTtcclxuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhQYXJzZWQucHViU2NyaXB0LCBwc2J0UGFyc2VkLnB1YlNjcmlwdCk7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAodHhQYXJzZWQuc2NyaXB0VHlwZSA9PT0gJ3Ayc2gnICYmIHBzYnRQYXJzZWQuc2NyaXB0VHlwZSA9PT0gJ3Ayc2gnKSB8fFxyXG4gICAgICAodHhQYXJzZWQuc2NyaXB0VHlwZSA9PT0gJ3Ayd3NoJyAmJiBwc2J0UGFyc2VkLnNjcmlwdFR5cGUgPT09ICdwMndzaCcpIHx8XHJcbiAgICAgICh0eFBhcnNlZC5zY3JpcHRUeXBlID09PSAncDJzaFAyd3NoJyAmJiBwc2J0UGFyc2VkLnNjcmlwdFR5cGUgPT09ICdwMnNoUDJ3c2gnKVxyXG4gICAgKSB7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhQYXJzZWQucmVkZWVtU2NyaXB0LCBwc2J0UGFyc2VkLnJlZGVlbVNjcmlwdCk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhQYXJzZWQud2l0bmVzc1NjcmlwdCwgcHNidFBhcnNlZC53aXRuZXNzU2NyaXB0KTtcclxuICAgIH0gZWxzZSBpZiAodHhQYXJzZWQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnICYmIHBzYnRQYXJzZWQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnKSB7XHJcbiAgICAgIC8vIFRvIGVuc3VyZSBzY3JpcHQgcGF0aCBwMnRyXHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhQYXJzZWQucHVibGljS2V5cywgcHNidFBhcnNlZC5wdWJsaWNLZXlzKTtcclxuICAgICAgY29uc3QgdHhQYXJzZWRQMnRyU2NyaXB0UGF0aCA9IHR4UGFyc2VkIGFzIFBhcnNlZFNpZ25hdHVyZVNjcmlwdFRhcHJvb3RTY3JpcHRQYXRoO1xyXG4gICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4UGFyc2VkUDJ0clNjcmlwdFBhdGguY29udHJvbEJsb2NrLCBwc2J0UGFyc2VkLmNvbnRyb2xCbG9jayk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhQYXJzZWRQMnRyU2NyaXB0UGF0aC5zY3JpcHRQYXRoTGV2ZWwsIHBzYnRQYXJzZWQuc2NyaXB0UGF0aExldmVsKTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCh0eFBhcnNlZFAydHJTY3JpcHRQYXRoLmxlYWZWZXJzaW9uLCBwc2J0UGFyc2VkLmxlYWZWZXJzaW9uKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlUHVibGljS2V5cyhcclxuICBwc2J0UGFyc2VkOiBQYXJzZWRQc2J0UDJtcyB8IFBhcnNlZFBzYnRUYXByb290LFxyXG4gIHR4UGFyc2VkOiBQYXJzZWRTaWduYXR1cmVTY3JpcHRQMm1zIHwgUGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdCB8IHVuZGVmaW5lZFxyXG4pIHtcclxuICBpZiAodHhQYXJzZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChwc2J0UGFyc2VkLnB1YmxpY0tleXMubGVuZ3RoLCAzKTtcclxuICAgIHBzYnRQYXJzZWQucHVibGljS2V5cy5mb3JFYWNoKChwdWJsaWNLZXkpID0+IHtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChCdWZmZXIuaXNCdWZmZXIocHVibGljS2V5KSwgdHJ1ZSk7XHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgYXNzZXJ0Lm9rKHR4UGFyc2VkLnNjcmlwdFR5cGUgIT09ICd0YXByb290S2V5UGF0aFNwZW5kJyk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4UGFyc2VkLnB1YmxpY0tleXMubGVuZ3RoLCBwc2J0UGFyc2VkLnB1YmxpY0tleXM/Lmxlbmd0aCk7XHJcbiAgICBjb25zdCBwdWJLZXlNYXRjaCA9IHR4UGFyc2VkLnB1YmxpY0tleXMuZXZlcnkoKHR4UHViS2V5KSA9PlxyXG4gICAgICBwc2J0UGFyc2VkLnB1YmxpY0tleXM/LnNvbWUoKHBzYnRQdWJLZXkpID0+IHBzYnRQdWJLZXkuZXF1YWxzKHR4UHViS2V5KSlcclxuICAgICk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHB1YktleU1hdGNoLCB0cnVlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlU2lnbmF0dXJlKFxyXG4gIHBzYnRQYXJzZWQ6IFBhcnNlZFBzYnRQMm1zIHwgUGFyc2VkUHNidFRhcHJvb3QsXHJcbiAgdHhQYXJzZWQ6IFBhcnNlZFNpZ25hdHVyZVNjcmlwdFAybXMgfCBQYXJzZWRTaWduYXR1cmVTY3JpcHRUYXByb290IHwgdW5kZWZpbmVkXHJcbikge1xyXG4gIGlmICh0eFBhcnNlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHBzYnRQYXJzZWQuc2lnbmF0dXJlcywgdW5kZWZpbmVkKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgdHhTaWduYXR1cmVzID0gdHhQYXJzZWQuc2lnbmF0dXJlcy5maWx0ZXIoXHJcbiAgICAgICh0eFNpZykgPT4gQnVmZmVyLmlzQnVmZmVyKHR4U2lnKSAmJiAhaXNQbGFjZWhvbGRlclNpZ25hdHVyZSh0eFNpZylcclxuICAgICk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4U2lnbmF0dXJlcy5sZW5ndGgsIHBzYnRQYXJzZWQuc2lnbmF0dXJlcz8ubGVuZ3RoKTtcclxuICAgIGlmICh0eFNpZ25hdHVyZXMubGVuZ3RoIDwgMSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBzaWdNYXRjaCA9IHR4U2lnbmF0dXJlcy5ldmVyeSgodHhTaWcpID0+XHJcbiAgICAgIEJ1ZmZlci5pc0J1ZmZlcih0eFNpZykgPyBwc2J0UGFyc2VkLnNpZ25hdHVyZXM/LnNvbWUoKHBzYnRTaWcpID0+IHBzYnRTaWcuZXF1YWxzKHR4U2lnKSkgOiB0cnVlXHJcbiAgICApO1xyXG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChzaWdNYXRjaCwgdHJ1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQc2J0UGFyc2luZyhcclxuICB0eDogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4sXHJcbiAgcHNidDogVXR4b1BzYnQsXHJcbiAgdW5zcGVudHM6IFdhbGxldFVuc3BlbnQ8YmlnaW50PltdLFxyXG4gIHNpZ25hdHVyZVRhcmdldDogU2lnbmF0dXJlVGFyZ2V0VHlwZVxyXG4pOiB2b2lkIHtcclxuICB1bnNwZW50cy5mb3JFYWNoKCh1LCBpKSA9PiB7XHJcbiAgICBpZiAoIWlzV2FsbGV0VW5zcGVudCh1KSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBzY3JpcHRUeXBlID0gc2NyaXB0VHlwZUZvckNoYWluKHUuY2hhaW4pO1xyXG5cclxuICAgIGlmIChzaWduYXR1cmVUYXJnZXQgPT09ICd1bnNpZ25lZCcpIHtcclxuICAgICAgaWYgKHNjcmlwdFR5cGUgPT09ICdwMnRyJykge1xyXG4gICAgICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICAgICAoKSA9PiBwYXJzZVBzYnRJbnB1dChwc2J0LmRhdGEuaW5wdXRzW2ldKSxcclxuICAgICAgICAgIChlOiBhbnkpID0+IGUubWVzc2FnZSA9PT0gJ2NvdWxkIG5vdCBwYXJzZSBpbnB1dCdcclxuICAgICAgICApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHBzYnRQYXJzZWQgPSBwYXJzZVBzYnRJbnB1dChwc2J0LmRhdGEuaW5wdXRzW2ldKTtcclxuICAgICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHBzYnRQYXJzZWQuc2NyaXB0VHlwZSwgc2NyaXB0VHlwZSk7XHJcbiAgICAgICAgdmFsaWRhdGVTY3JpcHQocHNidFBhcnNlZCwgdW5kZWZpbmVkKTtcclxuICAgICAgICB2YWxpZGF0ZVB1YmxpY0tleXMocHNidFBhcnNlZCwgdW5kZWZpbmVkKTtcclxuICAgICAgICB2YWxpZGF0ZVNpZ25hdHVyZShwc2J0UGFyc2VkLCB1bmRlZmluZWQpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBwc2J0UGFyc2VkID0gcGFyc2VQc2J0SW5wdXQocHNidC5kYXRhLmlucHV0c1tpXSk7XHJcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChwc2J0UGFyc2VkLnNjcmlwdFR5cGUsIHNjcmlwdFR5cGUgPT09ICdwMnRyJyA/ICd0YXByb290U2NyaXB0UGF0aFNwZW5kJyA6IHNjcmlwdFR5cGUpO1xyXG4gICAgICBhc3NlcnQub2socHNidFBhcnNlZC5zY3JpcHRUeXBlICE9PSAncDJzaFAycGsnKTtcclxuICAgICAgY29uc3QgdHhQYXJzZWQgPSBwYXJzZVNpZ25hdHVyZVNjcmlwdDJPZjModHguaW5zW2ldKTtcclxuICAgICAgdmFsaWRhdGVTY3JpcHQocHNidFBhcnNlZCwgdHhQYXJzZWQpO1xyXG4gICAgICB2YWxpZGF0ZVB1YmxpY0tleXMocHNidFBhcnNlZCwgdHhQYXJzZWQpO1xyXG4gICAgICB2YWxpZGF0ZVNpZ25hdHVyZShwc2J0UGFyc2VkLCB0eFBhcnNlZCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbFRyYW5zYWN0aW9uczxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB0eE9uZTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gIHR4VHdvOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj5cclxuKTogdm9pZCB7XHJcbiAgYXNzZXJ0Lm9rKHR4T25lLm5ldHdvcmsgPT09IHR4VHdvLm5ldHdvcmspO1xyXG4gIGFzc2VydC5vayh0eE9uZS5nZXRJZCgpID09PSB0eFR3by5nZXRJZCgpKTtcclxuICBhc3NlcnQub2sodHhPbmUudG9IZXgoKSA9PT0gdHhUd28udG9IZXgoKSk7XHJcbiAgYXNzZXJ0Lm9rKHR4T25lLnZpcnR1YWxTaXplKCkgPT09IHR4VHdvLnZpcnR1YWxTaXplKCkpO1xyXG4gIGFzc2VydC5vayh0eE9uZS5sb2NrdGltZSA9PT0gdHhUd28ubG9ja3RpbWUpO1xyXG4gIGFzc2VydC5vayh0eE9uZS52ZXJzaW9uID09PSB0eFR3by52ZXJzaW9uKTtcclxuICBhc3NlcnQub2sodHhPbmUud2VpZ2h0KCkgPT09IHR4VHdvLndlaWdodCgpKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKHR4T25lLmlucy5sZW5ndGggPT09IHR4VHdvLmlucy5sZW5ndGgpO1xyXG4gIGFzc2VydC5vayh0eE9uZS5vdXRzLmxlbmd0aCA9PT0gdHhUd28ub3V0cy5sZW5ndGgpO1xyXG4gIHR4T25lLmlucy5mb3JFYWNoKChfLCBpKSA9PiB7XHJcbiAgICBjb25zdCBwYXJzZWRJbnB1dE9uZSA9IHBhcnNlU2lnbmF0dXJlU2NyaXB0Mk9mMyh0eE9uZS5pbnNbaV0pO1xyXG4gICAgY29uc3QgcGFyc2VkSW5wdXRUd28gPSBwYXJzZVNpZ25hdHVyZVNjcmlwdDJPZjModHhUd28uaW5zW2ldKTtcclxuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwocGFyc2VkSW5wdXRPbmUsIHBhcnNlZElucHV0VHdvKTtcclxuICB9KTtcclxuICB0eE9uZS5vdXRzLmZvckVhY2goKF8sIGkpID0+IHtcclxuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhPbmUub3V0c1tpXSwgdHhUd28ub3V0c1tpXSk7XHJcbiAgfSk7XHJcbiAgYXNzZXJ0Lm9rKHR4T25lLnRvQnVmZmVyKCkuZXF1YWxzKHR4VHdvLnRvQnVmZmVyKCkpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQmlnSW50PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KHVuc3BlbnRzOiBVbnNwZW50PFROdW1iZXI+W10pOiBXYWxsZXRVbnNwZW50PGJpZ2ludD5bXSB7XHJcbiAgcmV0dXJuIHVuc3BlbnRzLm1hcCgodSkgPT4ge1xyXG4gICAgaWYgKGlzV2FsbGV0VW5zcGVudCh1KSkge1xyXG4gICAgICByZXR1cm4geyAuLi51LCB2YWx1ZTogQmlnSW50KHUudmFsdWUpIH07XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgdW5zcGVudCcpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2lnblBzYnQoXHJcbiAgcHNidDogVXR4b1BzYnQsXHJcbiAgdW5zcGVudHM6IFVuc3BlbnQ8YmlnaW50PltdLFxyXG4gIHJvb3RXYWxsZXRLZXlzOiBSb290V2FsbGV0S2V5cyxcclxuICBzaWduZXI6IHN0cmluZyxcclxuICBjb3NpZ25lcjogc3RyaW5nLFxyXG4gIHNpZ25hdHVyZVRhcmdldDogU2lnbmF0dXJlVGFyZ2V0VHlwZVxyXG4pOiB2b2lkIHtcclxuICB1bnNwZW50cy5mb3JFYWNoKCh1LCBpKSA9PiB7XHJcbiAgICBpZiAoIWlzV2FsbGV0VW5zcGVudCh1KSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgdW5zcGVudCcpO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKHNpZ25hdHVyZVRhcmdldCA9PT0gJ3Vuc2lnbmVkJykge1xyXG4gICAgICAgIHNpZ25XYWxsZXRQc2J0KHBzYnQsIGksIHJvb3RXYWxsZXRLZXlzW3NpZ25lcl0sIHUpO1xyXG4gICAgICB9XHJcbiAgICAgIHNpZ25XYWxsZXRQc2J0KHBzYnQsIGksIHJvb3RXYWxsZXRLZXlzW2Nvc2lnbmVyXSwgdSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChzaWduYXR1cmVUYXJnZXQsICd1bnNpZ25lZCcpO1xyXG4gICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHNjcmlwdFR5cGVGb3JDaGFpbih1LmNoYWluKSwgJ3AydHInKTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChwc2J0LmRhdGEuaW5wdXRzW2ldLnRhcExlYWZTY3JpcHQsIHVuZGVmaW5lZCk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwocHNidC5kYXRhLmlucHV0c1tpXS50YXBCaXAzMkRlcml2YXRpb24sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwocHNidC5kYXRhLmlucHV0c1tpXS50YXBTY3JpcHRTaWcsIHVuZGVmaW5lZCk7XHJcbiAgICAgIGFzc2VydC5vayhwc2J0LmRhdGEuaW5wdXRzW2ldLndpdG5lc3NVdHhvKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25UeEJ1aWxkZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHhiOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXIsIFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPj4sXHJcbiAgdW5zcGVudHM6IFVuc3BlbnQ8VE51bWJlcj5bXSxcclxuICByb290V2FsbGV0S2V5czogUm9vdFdhbGxldEtleXMsXHJcbiAgc2lnbmVyOiBzdHJpbmcsXHJcbiAgY29zaWduZXI6IHN0cmluZyxcclxuICBzaWduYXR1cmVUYXJnZXQ6IFNpZ25hdHVyZVRhcmdldFR5cGVcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICBsZXQgd2FsbGV0VW5zcGVudFNpZ25lcnM6IFdhbGxldFVuc3BlbnRTaWduZXI8Um9vdFdhbGxldEtleXM+W10gPSBbXTtcclxuXHJcbiAgaWYgKHNpZ25hdHVyZVRhcmdldCA9PT0gJ2hhbGZzaWduZWQnKSB7XHJcbiAgICB3YWxsZXRVbnNwZW50U2lnbmVycyA9IFtXYWxsZXRVbnNwZW50U2lnbmVyLmZyb20ocm9vdFdhbGxldEtleXMsIHJvb3RXYWxsZXRLZXlzW3NpZ25lcl0sIHJvb3RXYWxsZXRLZXlzW2Nvc2lnbmVyXSldO1xyXG4gIH0gZWxzZSBpZiAoc2lnbmF0dXJlVGFyZ2V0ID09PSAnZnVsbHNpZ25lZCcpIHtcclxuICAgIHdhbGxldFVuc3BlbnRTaWduZXJzID0gW1xyXG4gICAgICBXYWxsZXRVbnNwZW50U2lnbmVyLmZyb20ocm9vdFdhbGxldEtleXMsIHJvb3RXYWxsZXRLZXlzW3NpZ25lcl0sIHJvb3RXYWxsZXRLZXlzW2Nvc2lnbmVyXSksXHJcbiAgICAgIFdhbGxldFVuc3BlbnRTaWduZXIuZnJvbShyb290V2FsbGV0S2V5cywgcm9vdFdhbGxldEtleXNbY29zaWduZXJdLCByb290V2FsbGV0S2V5c1tzaWduZXJdKSxcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICB3YWxsZXRVbnNwZW50U2lnbmVycy5mb3JFYWNoKCh3YWxsZXRTaWduZXIsIG5TaWduYXR1cmUpID0+IHtcclxuICAgIHVuc3BlbnRzLmZvckVhY2goKHUsIGkpID0+IHtcclxuICAgICAgaWYgKGlzV2FsbGV0VW5zcGVudCh1KSkge1xyXG4gICAgICAgIHNpZ25JbnB1dFdpdGhVbnNwZW50KHR4YiwgaSwgdSwgd2FsbGV0U2lnbmVyKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZXhwZWN0ZWQgdW5zcGVudCAke3UuaWR9YCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gc2lnbmF0dXJlVGFyZ2V0ID09PSAnZnVsbHNpZ25lZCcgPyB0eGIuYnVpbGQoKSA6IHR4Yi5idWlsZEluY29tcGxldGUoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdFRyYW5zYWN0aW9uVXNpbmdUeEJ1aWxkZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdW5zcGVudHM6IFVuc3BlbnQ8VE51bWJlcj5bXSxcclxuICByb290V2FsbGV0S2V5czogUm9vdFdhbGxldEtleXMsXHJcbiAgcGFyYW1zOiB7XHJcbiAgICBzaWduZXI6IEtleU5hbWU7XHJcbiAgICBjb3NpZ25lcjogS2V5TmFtZTtcclxuICAgIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCc7XHJcbiAgICBvdXRwdXRUeXBlOiBvdXRwdXRTY3JpcHRzLlNjcmlwdFR5cGUyT2YzO1xyXG4gICAgc2lnbmF0dXJlVGFyZ2V0OiBTaWduYXR1cmVUYXJnZXRUeXBlO1xyXG4gICAgbmV0d29yazogTmV0d29yaztcclxuICAgIGNoYW5nZUluZGV4OiBudW1iZXI7XHJcbiAgICBmZWU6IGJpZ2ludDtcclxuICB9XHJcbik6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+IHtcclxuICBjb25zdCB0eGIgPSBjcmVhdGVUcmFuc2FjdGlvbkJ1aWxkZXJGb3JOZXR3b3JrPFROdW1iZXI+KHBhcmFtcy5uZXR3b3JrKTtcclxuICBjb25zdCB0b3RhbCA9IEJpZ0ludCh1bnNwZW50U3VtPFROdW1iZXI+KHVuc3BlbnRzLCBwYXJhbXMuYW1vdW50VHlwZSkpO1xyXG4gIC8vIEtpbmRhIHdlaXJkLCB0cmVhdGluZyBlbnRpcmUgdmFsdWUgYXMgY2hhbmdlLCBidXQgdGVzdHMgdGhlIHJlbGV2YW50IHBhdGhzXHJcbiAgdHhiLmFkZE91dHB1dChcclxuICAgIGdldFdhbGxldEFkZHJlc3Mocm9vdFdhbGxldEtleXMsIGdldEludGVybmFsQ2hhaW5Db2RlKHBhcmFtcy5vdXRwdXRUeXBlKSwgcGFyYW1zLmNoYW5nZUluZGV4LCBwYXJhbXMubmV0d29yayksXHJcbiAgICB0b1ROdW1iZXI8VE51bWJlcj4odG90YWwgLSBwYXJhbXMuZmVlLCBwYXJhbXMuYW1vdW50VHlwZSlcclxuICApO1xyXG4gIHVuc3BlbnRzLmZvckVhY2goKHUpID0+IHtcclxuICAgIGFkZFRvVHJhbnNhY3Rpb25CdWlsZGVyKHR4YiwgdSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBzaWduVHhCdWlsZGVyPFROdW1iZXI+KFxyXG4gICAgdHhiLFxyXG4gICAgdW5zcGVudHMsXHJcbiAgICByb290V2FsbGV0S2V5cyxcclxuICAgIHBhcmFtcy5zaWduZXIsXHJcbiAgICBwYXJhbXMuY29zaWduZXIsXHJcbiAgICBwYXJhbXMuc2lnbmF0dXJlVGFyZ2V0XHJcbiAgKS5jbG9uZTxiaWdpbnQ+KCdiaWdpbnQnKTtcclxufVxyXG4iXX0=