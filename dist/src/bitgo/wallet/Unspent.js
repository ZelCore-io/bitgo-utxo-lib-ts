"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWalletUnspentToPsbt = exports.updateWalletUnspentForPsbt = exports.addReplayProtectionUnspentToPsbt = exports.updateReplayProtectionUnspentToPsbt = exports.psbtIncludesUnspentAtIndex = exports.verifySignatureWithUnspent = exports.signInputWithUnspent = exports.isWalletUnspent = exports.MAX_BIP125_RBF_SEQUENCE = exports.TX_INPUT_SEQUENCE_NUMBER_FINAL = void 0;
const __1 = require("../..");
const outputScripts_1 = require("../outputScripts");
const address_1 = require("../../address");
const signature_1 = require("../signature");
const Unspent_1 = require("../Unspent");
const chains_1 = require("./chains");
const Musig2_1 = require("../Musig2");
const transaction_1 = require("../transaction");
const parseInput_1 = require("../parseInput");
const utils_1 = require("bip174/src/lib/utils");
const PsbtUtil_1 = require("../PsbtUtil");
/** Final (non-replaceable) */
exports.TX_INPUT_SEQUENCE_NUMBER_FINAL = 0xffffffff;
/** Non-Final (Replaceable)
 * Reference: https://github.com/bitcoin/bitcoin/blob/v25.1/src/rpc/rawtransaction_util.cpp#L49
 * */
exports.MAX_BIP125_RBF_SEQUENCE = 0xffffffff - 2;
function isWalletUnspent(u) {
    return u.chain !== undefined;
}
exports.isWalletUnspent = isWalletUnspent;
function signInputWithUnspent(txBuilder, inputIndex, unspent, unspentSigner) {
    const { walletKeys, signer, cosigner } = unspentSigner.deriveForChainAndIndex(unspent.chain, unspent.index);
    const scriptType = (0, outputScripts_1.scriptTypeForChain)(unspent.chain);
    const pubScript = (0, outputScripts_1.createOutputScript2of3)(walletKeys.publicKeys, scriptType).scriptPubKey;
    const pubScriptExpected = (0, address_1.toOutputScript)(unspent.address, txBuilder.network);
    if (!pubScript.equals(pubScriptExpected)) {
        throw new Error(`pubscript mismatch: expected ${pubScriptExpected.toString('hex')} got ${pubScript.toString('hex')}`);
    }
    (0, signature_1.signInput2Of3)(txBuilder, inputIndex, scriptType, walletKeys.publicKeys, signer, cosigner.publicKey, unspent.value);
}
exports.signInputWithUnspent = signInputWithUnspent;
/**
 * @param tx
 * @param inputIndex
 * @param unspents
 * @param walletKeys
 * @return triple of booleans indicating a valid signature for each pubkey
 */
function verifySignatureWithUnspent(tx, inputIndex, unspents, walletKeys) {
    var _a, _b;
    if (tx.ins.length !== unspents.length) {
        throw new Error(`input length must match unspents length`);
    }
    const input = tx.ins[inputIndex];
    /* istanbul ignore next */
    if (!input) {
        throw new Error(`no input at index ${inputIndex}`);
    }
    const unspent = unspents[inputIndex];
    if (!isWalletUnspent(unspent) || (!((_a = input.script) === null || _a === void 0 ? void 0 : _a.length) && !((_b = input.witness) === null || _b === void 0 ? void 0 : _b.length))) {
        return [false, false, false];
    }
    const parsedInput = (0, parseInput_1.parseSignatureScript)(input);
    const prevOutputs = unspents.map((u) => (0, Unspent_1.toOutput)(u, tx.network));
    // If it is a taproot keyPathSpend input, the only valid signature combinations is user-bitgo. We can
    // only verify that the aggregated signature is valid, not that the individual partial-signature is valid.
    // Therefore, we can only say that either all partial signatures are valid, or none are.
    if (parsedInput.scriptType === 'taprootKeyPathSpend') {
        const result = (0, signature_1.getSignatureVerifications)(tx, inputIndex, unspent.value, undefined, prevOutputs);
        return result.length === 1 && result[0].signature ? [true, false, true] : [false, false, false];
    }
    return (0, signature_1.verifySignatureWithPublicKeys)(tx, inputIndex, prevOutputs, walletKeys.deriveForChainAndIndex(unspent.chain, unspent.index).publicKeys);
}
exports.verifySignatureWithUnspent = verifySignatureWithUnspent;
/**
 * @param psbt
 * @param inputIndex
 * @param id Unspent ID
 * @returns true iff the unspent ID on the unspent and psbt input match
 */
function psbtIncludesUnspentAtIndex(psbt, inputIndex, id) {
    (0, utils_1.checkForInput)(psbt.data.inputs, inputIndex);
    const { txid, vout } = (0, Unspent_1.parseOutputId)(id);
    const psbtOutPoint = (0, Unspent_1.getOutputIdForInput)(psbt.txInputs[inputIndex]);
    return psbtOutPoint.txid === txid && psbtOutPoint.vout === vout;
}
exports.psbtIncludesUnspentAtIndex = psbtIncludesUnspentAtIndex;
/**
 * Update the psbt input at the given index
 * @param psbt
 * @param inputIndex
 * @param u
 * @param redeemScript Only overrides if there is no redeemScript in the input currently
 */
function updateReplayProtectionUnspentToPsbt(psbt, inputIndex, u, redeemScript, customParams) {
    if (!psbtIncludesUnspentAtIndex(psbt, inputIndex, u.id)) {
        throw new Error(`unspent does not correspond to psbt input`);
    }
    const input = (0, utils_1.checkForInput)(psbt.data.inputs, inputIndex);
    if (redeemScript && !input.redeemScript) {
        psbt.updateInput(inputIndex, { redeemScript });
    }
    // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
    // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
    // segwit transactions
    const isZcash = (0, __1.getMainnet)(psbt.network) === __1.networks.zcash;
    if (!(0, Unspent_1.isUnspentWithPrevTx)(u) && !isZcash && !(customParams === null || customParams === void 0 ? void 0 : customParams.skipNonWitnessUtxo)) {
        throw new Error('Error, require previous tx to add to PSBT');
    }
    if ((isZcash && !input.witnessUtxo) || (customParams === null || customParams === void 0 ? void 0 : customParams.skipNonWitnessUtxo)) {
        const { script, value } = (0, Unspent_1.toPrevOutput)(u, psbt.network);
        psbt.updateInput(inputIndex, { witnessUtxo: { script, value } });
    }
    else if (!isZcash && !input.nonWitnessUtxo) {
        psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
    }
    const sighashType = (0, signature_1.getDefaultSigHash)(psbt.network);
    if (psbt.data.inputs[inputIndex].sighashType === undefined) {
        psbt.updateInput(inputIndex, { sighashType });
    }
}
exports.updateReplayProtectionUnspentToPsbt = updateReplayProtectionUnspentToPsbt;
function addUnspentToPsbt(psbt, id, { sequenceNumber = exports.TX_INPUT_SEQUENCE_NUMBER_FINAL } = {}) {
    const { txid, vout } = (0, Unspent_1.parseOutputId)(id);
    psbt.addInput({
        hash: txid,
        index: vout,
        sequence: sequenceNumber,
    });
}
function addReplayProtectionUnspentToPsbt(psbt, u, redeemScript, customParams) {
    addUnspentToPsbt(psbt, u.id);
    updateReplayProtectionUnspentToPsbt(psbt, psbt.inputCount - 1, u, redeemScript, customParams);
}
exports.addReplayProtectionUnspentToPsbt = addReplayProtectionUnspentToPsbt;
/**
 * Update the PSBT with the unspent data for the input at the given index if the data is not there already.
 *
 * If skipNonWitnessUtxo is true, then the nonWitnessUtxo will not be added for an input that requires it (e.g. non-segwit)
 * and instead the witnessUtxo will be added
 *
 * @param psbt
 * @param inputIndex
 * @param u
 * @param rootWalletKeys
 * @param signer
 * @param cosigner
 * @param customParams
 */
function updateWalletUnspentForPsbt(psbt, inputIndex, u, rootWalletKeys, signer, cosigner, customParams) {
    if (!psbtIncludesUnspentAtIndex(psbt, inputIndex, u.id)) {
        throw new Error(`unspent does not correspond to psbt input`);
    }
    const input = (0, utils_1.checkForInput)(psbt.data.inputs, inputIndex);
    // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
    // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
    // segwit transactions
    const isZcashOrSegwit = (0, chains_1.isSegwit)(u.chain) || (0, __1.getMainnet)(psbt.network) === __1.networks.zcash;
    if ((isZcashOrSegwit || (customParams === null || customParams === void 0 ? void 0 : customParams.skipNonWitnessUtxo)) && !input.witnessUtxo) {
        const { script, value } = (0, Unspent_1.toPrevOutput)(u, psbt.network);
        psbt.updateInput(inputIndex, { witnessUtxo: { script, value } });
    }
    else if (!isZcashOrSegwit) {
        if (!(0, Unspent_1.isUnspentWithPrevTx)(u)) {
            throw new Error('Error, require previous tx to add to PSBT');
        }
        if (!input.witnessUtxo && !input.nonWitnessUtxo) {
            // Force the litecoin transaction to have no MWEB advanced transaction flag
            if ((0, __1.getMainnet)(psbt.network) === __1.networks.litecoin) {
                u.prevTx = (0, transaction_1.createTransactionFromBuffer)(u.prevTx, psbt.network, { amountType: 'bigint' }).toBuffer();
            }
            psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
        }
    }
    const walletKeys = rootWalletKeys.deriveForChainAndIndex(u.chain, u.index);
    const scriptType = (0, outputScripts_1.scriptTypeForChain)(u.chain);
    const sighashType = (0, signature_1.getDefaultSigHash)(psbt.network, scriptType);
    if (psbt.data.inputs[inputIndex].sighashType === undefined) {
        psbt.updateInput(inputIndex, { sighashType });
    }
    const isBackupFlow = signer === 'backup' || cosigner === 'backup';
    if (scriptType === 'p2tr' || (scriptType === 'p2trMusig2' && isBackupFlow)) {
        if (input.tapLeafScript && input.tapBip32Derivation) {
            return;
        }
        const createSpendScriptP2trFn = scriptType === 'p2tr' ? outputScripts_1.createSpendScriptP2tr : outputScripts_1.createSpendScriptP2trMusig2;
        const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2trFn(walletKeys.publicKeys, [
            walletKeys[signer].publicKey,
            walletKeys[cosigner].publicKey,
        ]);
        if (!input.tapLeafScript) {
            psbt.updateInput(inputIndex, {
                tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
            });
        }
        if (!input.tapBip32Derivation) {
            psbt.updateInput(inputIndex, {
                tapBip32Derivation: [signer, cosigner].map((key) => ({
                    leafHashes: [leafHash],
                    pubkey: (0, outputScripts_1.toXOnlyPublicKey)(walletKeys[key].publicKey),
                    path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
                    masterFingerprint: rootWalletKeys[key].fingerprint,
                })),
            });
        }
    }
    else if (scriptType === 'p2trMusig2') {
        const { internalPubkey: tapInternalKey, outputPubkey: tapOutputKey, taptreeRoot, } = (0, outputScripts_1.createKeyPathP2trMusig2)(walletKeys.publicKeys);
        if (psbt.getProprietaryKeyVals(inputIndex, {
            identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
            subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
        }).length === 0) {
            const participantsKeyValData = (0, Musig2_1.encodePsbtMusig2Participants)({
                tapOutputKey,
                tapInternalKey,
                participantPubKeys: [walletKeys.user.publicKey, walletKeys.bitgo.publicKey],
            });
            psbt.addProprietaryKeyValToInput(inputIndex, participantsKeyValData);
        }
        if (!input.tapInternalKey) {
            psbt.updateInput(inputIndex, {
                tapInternalKey: tapInternalKey,
            });
        }
        if (!input.tapMerkleRoot) {
            psbt.updateInput(inputIndex, {
                tapMerkleRoot: taptreeRoot,
            });
        }
        if (!input.tapBip32Derivation) {
            psbt.updateInput(inputIndex, {
                tapBip32Derivation: [signer, cosigner].map((key) => ({
                    leafHashes: [],
                    pubkey: (0, outputScripts_1.toXOnlyPublicKey)(walletKeys[key].publicKey),
                    path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
                    masterFingerprint: rootWalletKeys[key].fingerprint,
                })),
            });
        }
    }
    else {
        if (!input.bip32Derivation) {
            psbt.updateInput(inputIndex, {
                bip32Derivation: [0, 1, 2].map((idx) => ({
                    pubkey: walletKeys.triple[idx].publicKey,
                    path: walletKeys.paths[idx],
                    masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
                })),
            });
        }
        const { witnessScript, redeemScript } = (0, outputScripts_1.createOutputScript2of3)(walletKeys.publicKeys, scriptType);
        if (witnessScript && !input.witnessScript) {
            psbt.updateInput(inputIndex, { witnessScript });
        }
        if (redeemScript && !input.redeemScript) {
            psbt.updateInput(inputIndex, { redeemScript });
        }
    }
}
exports.updateWalletUnspentForPsbt = updateWalletUnspentForPsbt;
function addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signer, cosigner, customParams) {
    let sequenceNumber = exports.TX_INPUT_SEQUENCE_NUMBER_FINAL;
    if (customParams && customParams.isReplaceableByFee) {
        sequenceNumber = exports.MAX_BIP125_RBF_SEQUENCE;
    }
    addUnspentToPsbt(psbt, u.id, { sequenceNumber });
    updateWalletUnspentForPsbt(psbt, psbt.inputCount - 1, u, rootWalletKeys, signer, cosigner, customParams ? { skipNonWitnessUtxo: customParams.skipNonWitnessUtxo } : {});
}
exports.addWalletUnspentToPsbt = addWalletUnspentToPsbt;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVW5zcGVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby93YWxsZXQvVW5zcGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBc0Q7QUFFdEQsb0RBTzBCO0FBQzFCLDJDQUErQztBQUMvQyw0Q0FLc0I7QUFLdEIsd0NBUW9CO0FBQ3BCLHFDQUErQztBQUUvQyxzQ0FBeUQ7QUFDekQsZ0RBQTZEO0FBQzdELDhDQUFxRDtBQUNyRCxnREFBcUQ7QUFDckQsMENBQWlGO0FBRWpGLDhCQUE4QjtBQUNqQixRQUFBLDhCQUE4QixHQUFHLFVBQVUsQ0FBQztBQUV6RDs7S0FFSztBQUNRLFFBQUEsdUJBQXVCLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQztBQWF0RCxTQUFnQixlQUFlLENBQWtDLENBQW1CO0lBQ2xGLE9BQVEsQ0FBNEIsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQzNELENBQUM7QUFGRCwwQ0FFQztBQUVELFNBQWdCLG9CQUFvQixDQUNsQyxTQUEwQyxFQUMxQyxVQUFrQixFQUNsQixPQUErQixFQUMvQixhQUFrRDtJQUVsRCxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxhQUFhLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUcsTUFBTSxVQUFVLEdBQUcsSUFBQSxrQ0FBa0IsRUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckQsTUFBTSxTQUFTLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDLFlBQVksQ0FBQztJQUN6RixNQUFNLGlCQUFpQixHQUFHLElBQUEsd0JBQWMsRUFBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxPQUFrQixDQUFDLENBQUM7SUFDeEYsSUFBSSxDQUFDLFNBQVMs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Jy4uLy4uJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4uL1V0eG9UcmFuc2FjdGlvbkJ1aWxkZXInO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZUtleVBhdGhQMnRyTXVzaWcyLFxyXG4gIGNyZWF0ZU91dHB1dFNjcmlwdDJvZjMsXHJcbiAgY3JlYXRlU3BlbmRTY3JpcHRQMnRyLFxyXG4gIGNyZWF0ZVNwZW5kU2NyaXB0UDJ0ck11c2lnMixcclxuICBzY3JpcHRUeXBlRm9yQ2hhaW4sXHJcbiAgdG9YT25seVB1YmxpY0tleSxcclxufSBmcm9tICcuLi9vdXRwdXRTY3JpcHRzJztcclxuaW1wb3J0IHsgdG9PdXRwdXRTY3JpcHQgfSBmcm9tICcuLi8uLi9hZGRyZXNzJztcclxuaW1wb3J0IHtcclxuICBnZXREZWZhdWx0U2lnSGFzaCxcclxuICBnZXRTaWduYXR1cmVWZXJpZmljYXRpb25zLFxyXG4gIHNpZ25JbnB1dDJPZjMsXHJcbiAgdmVyaWZ5U2lnbmF0dXJlV2l0aFB1YmxpY0tleXMsXHJcbn0gZnJvbSAnLi4vc2lnbmF0dXJlJztcclxuaW1wb3J0IHsgV2FsbGV0VW5zcGVudFNpZ25lciB9IGZyb20gJy4vV2FsbGV0VW5zcGVudFNpZ25lcic7XHJcbmltcG9ydCB7IEtleU5hbWUsIFJvb3RXYWxsZXRLZXlzIH0gZnJvbSAnLi9XYWxsZXRLZXlzJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uIH0gZnJvbSAnLi4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgVHJpcGxlIH0gZnJvbSAnLi4vdHlwZXMnO1xyXG5pbXBvcnQge1xyXG4gIHRvT3V0cHV0LFxyXG4gIFVuc3BlbnRXaXRoUHJldlR4LFxyXG4gIFVuc3BlbnQsXHJcbiAgaXNVbnNwZW50V2l0aFByZXZUeCxcclxuICB0b1ByZXZPdXRwdXQsXHJcbiAgcGFyc2VPdXRwdXRJZCxcclxuICBnZXRPdXRwdXRJZEZvcklucHV0LFxyXG59IGZyb20gJy4uL1Vuc3BlbnQnO1xyXG5pbXBvcnQgeyBDaGFpbkNvZGUsIGlzU2Vnd2l0IH0gZnJvbSAnLi9jaGFpbnMnO1xyXG5pbXBvcnQgeyBVdHhvUHNidCB9IGZyb20gJy4uL1V0eG9Qc2J0JztcclxuaW1wb3J0IHsgZW5jb2RlUHNidE11c2lnMlBhcnRpY2lwYW50cyB9IGZyb20gJy4uL011c2lnMic7XHJcbmltcG9ydCB7IGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlciB9IGZyb20gJy4uL3RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgcGFyc2VTaWduYXR1cmVTY3JpcHQgfSBmcm9tICcuLi9wYXJzZUlucHV0JztcclxuaW1wb3J0IHsgY2hlY2tGb3JJbnB1dCB9IGZyb20gJ2JpcDE3NC9zcmMvbGliL3V0aWxzJztcclxuaW1wb3J0IHsgUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLCBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIgfSBmcm9tICcuLi9Qc2J0VXRpbCc7XHJcblxyXG4vKiogRmluYWwgKG5vbi1yZXBsYWNlYWJsZSkgKi9cclxuZXhwb3J0IGNvbnN0IFRYX0lOUFVUX1NFUVVFTkNFX05VTUJFUl9GSU5BTCA9IDB4ZmZmZmZmZmY7XHJcblxyXG4vKiogTm9uLUZpbmFsIChSZXBsYWNlYWJsZSlcclxuICogUmVmZXJlbmNlOiBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXRjb2luL2Jsb2IvdjI1LjEvc3JjL3JwYy9yYXd0cmFuc2FjdGlvbl91dGlsLmNwcCNMNDlcclxuICogKi9cclxuZXhwb3J0IGNvbnN0IE1BWF9CSVAxMjVfUkJGX1NFUVVFTkNFID0gMHhmZmZmZmZmZiAtIDI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldFVuc3BlbnQ8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4gZXh0ZW5kcyBVbnNwZW50PFROdW1iZXI+IHtcclxuICBjaGFpbjogQ2hhaW5Db2RlO1xyXG4gIGluZGV4OiBudW1iZXI7XHJcbiAgd2l0bmVzc1NjcmlwdD86IHN0cmluZztcclxuICB2YWx1ZVN0cmluZz86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBOb25XaXRuZXNzV2FsbGV0VW5zcGVudDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPlxyXG4gIGV4dGVuZHMgVW5zcGVudFdpdGhQcmV2VHg8VE51bWJlcj4sXHJcbiAgICBXYWxsZXRVbnNwZW50PFROdW1iZXI+IHt9XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNXYWxsZXRVbnNwZW50PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KHU6IFVuc3BlbnQ8VE51bWJlcj4pOiB1IGlzIFdhbGxldFVuc3BlbnQ8VE51bWJlcj4ge1xyXG4gIHJldHVybiAodSBhcyBXYWxsZXRVbnNwZW50PFROdW1iZXI+KS5jaGFpbiAhPT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2lnbklucHV0V2l0aFVuc3BlbnQ8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHhCdWlsZGVyOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+LFxyXG4gIGlucHV0SW5kZXg6IG51bWJlcixcclxuICB1bnNwZW50OiBXYWxsZXRVbnNwZW50PFROdW1iZXI+LFxyXG4gIHVuc3BlbnRTaWduZXI6IFdhbGxldFVuc3BlbnRTaWduZXI8Um9vdFdhbGxldEtleXM+XHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IHsgd2FsbGV0S2V5cywgc2lnbmVyLCBjb3NpZ25lciB9ID0gdW5zcGVudFNpZ25lci5kZXJpdmVGb3JDaGFpbkFuZEluZGV4KHVuc3BlbnQuY2hhaW4sIHVuc3BlbnQuaW5kZXgpO1xyXG4gIGNvbnN0IHNjcmlwdFR5cGUgPSBzY3JpcHRUeXBlRm9yQ2hhaW4odW5zcGVudC5jaGFpbik7XHJcbiAgY29uc3QgcHViU2NyaXB0ID0gY3JlYXRlT3V0cHV0U2NyaXB0Mm9mMyh3YWxsZXRLZXlzLnB1YmxpY0tleXMsIHNjcmlwdFR5cGUpLnNjcmlwdFB1YktleTtcclxuICBjb25zdCBwdWJTY3JpcHRFeHBlY3RlZCA9IHRvT3V0cHV0U2NyaXB0KHVuc3BlbnQuYWRkcmVzcywgdHhCdWlsZGVyLm5ldHdvcmsgYXMgTmV0d29yayk7XHJcbiAgaWYgKCFwdWJTY3JpcHQuZXF1YWxzKHB1YlNjcmlwdEV4cGVjdGVkKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgcHVic2NyaXB0IG1pc21hdGNoOiBleHBlY3RlZCAke3B1YlNjcmlwdEV4cGVjdGVkLnRvU3RyaW5nKCdoZXgnKX0gZ290ICR7cHViU2NyaXB0LnRvU3RyaW5nKCdoZXgnKX1gXHJcbiAgICApO1xyXG4gIH1cclxuICBzaWduSW5wdXQyT2YzPFROdW1iZXI+KFxyXG4gICAgdHhCdWlsZGVyLFxyXG4gICAgaW5wdXRJbmRleCxcclxuICAgIHNjcmlwdFR5cGUsXHJcbiAgICB3YWxsZXRLZXlzLnB1YmxpY0tleXMsXHJcbiAgICBzaWduZXIsXHJcbiAgICBjb3NpZ25lci5wdWJsaWNLZXksXHJcbiAgICB1bnNwZW50LnZhbHVlXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB0eFxyXG4gKiBAcGFyYW0gaW5wdXRJbmRleFxyXG4gKiBAcGFyYW0gdW5zcGVudHNcclxuICogQHBhcmFtIHdhbGxldEtleXNcclxuICogQHJldHVybiB0cmlwbGUgb2YgYm9vbGVhbnMgaW5kaWNhdGluZyBhIHZhbGlkIHNpZ25hdHVyZSBmb3IgZWFjaCBwdWJrZXlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2ZXJpZnlTaWduYXR1cmVXaXRoVW5zcGVudDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB0eDogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gIGlucHV0SW5kZXg6IG51bWJlcixcclxuICB1bnNwZW50czogVW5zcGVudDxUTnVtYmVyPltdLFxyXG4gIHdhbGxldEtleXM6IFJvb3RXYWxsZXRLZXlzXHJcbik6IFRyaXBsZTxib29sZWFuPiB7XHJcbiAgaWYgKHR4Lmlucy5sZW5ndGggIT09IHVuc3BlbnRzLmxlbmd0aCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnB1dCBsZW5ndGggbXVzdCBtYXRjaCB1bnNwZW50cyBsZW5ndGhgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGlucHV0ID0gdHguaW5zW2lucHV0SW5kZXhdO1xyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgaWYgKCFpbnB1dCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBubyBpbnB1dCBhdCBpbmRleCAke2lucHV0SW5kZXh9YCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB1bnNwZW50ID0gdW5zcGVudHNbaW5wdXRJbmRleF07XHJcbiAgaWYgKCFpc1dhbGxldFVuc3BlbnQodW5zcGVudCkgfHwgKCFpbnB1dC5zY3JpcHQ/Lmxlbmd0aCAmJiAhaW5wdXQud2l0bmVzcz8ubGVuZ3RoKSkge1xyXG4gICAgcmV0dXJuIFtmYWxzZSwgZmFsc2UsIGZhbHNlXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhcnNlZElucHV0ID0gcGFyc2VTaWduYXR1cmVTY3JpcHQoaW5wdXQpO1xyXG4gIGNvbnN0IHByZXZPdXRwdXRzID0gdW5zcGVudHMubWFwKCh1KSA9PiB0b091dHB1dCh1LCB0eC5uZXR3b3JrKSk7XHJcblxyXG4gIC8vIElmIGl0IGlzIGEgdGFwcm9vdCBrZXlQYXRoU3BlbmQgaW5wdXQsIHRoZSBvbmx5IHZhbGlkIHNpZ25hdHVyZSBjb21iaW5hdGlvbnMgaXMgdXNlci1iaXRnby4gV2UgY2FuXHJcbiAgLy8gb25seSB2ZXJpZnkgdGhhdCB0aGUgYWdncmVnYXRlZCBzaWduYXR1cmUgaXMgdmFsaWQsIG5vdCB0aGF0IHRoZSBpbmRpdmlkdWFsIHBhcnRpYWwtc2lnbmF0dXJlIGlzIHZhbGlkLlxyXG4gIC8vIFRoZXJlZm9yZSwgd2UgY2FuIG9ubHkgc2F5IHRoYXQgZWl0aGVyIGFsbCBwYXJ0aWFsIHNpZ25hdHVyZXMgYXJlIHZhbGlkLCBvciBub25lIGFyZS5cclxuICBpZiAocGFyc2VkSW5wdXQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBnZXRTaWduYXR1cmVWZXJpZmljYXRpb25zKHR4LCBpbnB1dEluZGV4LCB1bnNwZW50LnZhbHVlLCB1bmRlZmluZWQsIHByZXZPdXRwdXRzKTtcclxuICAgIHJldHVybiByZXN1bHQubGVuZ3RoID09PSAxICYmIHJlc3VsdFswXS5zaWduYXR1cmUgPyBbdHJ1ZSwgZmFsc2UsIHRydWVdIDogW2ZhbHNlLCBmYWxzZSwgZmFsc2VdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHZlcmlmeVNpZ25hdHVyZVdpdGhQdWJsaWNLZXlzKFxyXG4gICAgdHgsXHJcbiAgICBpbnB1dEluZGV4LFxyXG4gICAgcHJldk91dHB1dHMsXHJcbiAgICB3YWxsZXRLZXlzLmRlcml2ZUZvckNoYWluQW5kSW5kZXgodW5zcGVudC5jaGFpbiwgdW5zcGVudC5pbmRleCkucHVibGljS2V5c1xyXG4gICkgYXMgVHJpcGxlPGJvb2xlYW4+O1xyXG59XHJcblxyXG4vKipcclxuICogQGRlcHJlY2F0ZWRcclxuICogVXNlZCBpbiBjZXJ0YWluIGxlZ2FjeSBzaWduaW5nIG1ldGhvZHMgdGhhdCBkbyBub3QgZGVyaXZlIHNpZ25pbmcgZGF0YSBmcm9tIGluZGV4L2NoYWluXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldFVuc3BlbnRMZWdhY3k8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4gZXh0ZW5kcyBXYWxsZXRVbnNwZW50PFROdW1iZXI+IHtcclxuICAvKiogQGRlcHJlY2F0ZWQgLSBvYnZpYXRlZCBieSBzaWduV2l0aFVuc3BlbnQgKi9cclxuICByZWRlZW1TY3JpcHQ/OiBzdHJpbmc7XHJcbiAgLyoqIEBkZXByZWNhdGVkIC0gb2J2aWF0ZWQgYnkgdmVyaWZ5V2l0aFVuc3BlbnQgKi9cclxuICB3aXRuZXNzU2NyaXB0Pzogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHBzYnRcclxuICogQHBhcmFtIGlucHV0SW5kZXhcclxuICogQHBhcmFtIGlkIFVuc3BlbnQgSURcclxuICogQHJldHVybnMgdHJ1ZSBpZmYgdGhlIHVuc3BlbnQgSUQgb24gdGhlIHVuc3BlbnQgYW5kIHBzYnQgaW5wdXQgbWF0Y2hcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwc2J0SW5jbHVkZXNVbnNwZW50QXRJbmRleChwc2J0OiBVdHhvUHNidCwgaW5wdXRJbmRleDogbnVtYmVyLCBpZDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgY2hlY2tGb3JJbnB1dChwc2J0LmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuXHJcbiAgY29uc3QgeyB0eGlkLCB2b3V0IH0gPSBwYXJzZU91dHB1dElkKGlkKTtcclxuICBjb25zdCBwc2J0T3V0UG9pbnQgPSBnZXRPdXRwdXRJZEZvcklucHV0KHBzYnQudHhJbnB1dHNbaW5wdXRJbmRleF0pO1xyXG4gIHJldHVybiBwc2J0T3V0UG9pbnQudHhpZCA9PT0gdHhpZCAmJiBwc2J0T3V0UG9pbnQudm91dCA9PT0gdm91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSB0aGUgcHNidCBpbnB1dCBhdCB0aGUgZ2l2ZW4gaW5kZXhcclxuICogQHBhcmFtIHBzYnRcclxuICogQHBhcmFtIGlucHV0SW5kZXhcclxuICogQHBhcmFtIHVcclxuICogQHBhcmFtIHJlZGVlbVNjcmlwdCBPbmx5IG92ZXJyaWRlcyBpZiB0aGVyZSBpcyBubyByZWRlZW1TY3JpcHQgaW4gdGhlIGlucHV0IGN1cnJlbnRseVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVJlcGxheVByb3RlY3Rpb25VbnNwZW50VG9Qc2J0KFxyXG4gIHBzYnQ6IFV0eG9Qc2J0LFxyXG4gIGlucHV0SW5kZXg6IG51bWJlcixcclxuICB1OiBVbnNwZW50PGJpZ2ludD4sXHJcbiAgcmVkZWVtU2NyaXB0PzogQnVmZmVyLFxyXG4gIGN1c3RvbVBhcmFtcz86IHsgc2tpcE5vbldpdG5lc3NVdHhvPzogYm9vbGVhbiB9XHJcbik6IHZvaWQge1xyXG4gIGlmICghcHNidEluY2x1ZGVzVW5zcGVudEF0SW5kZXgocHNidCwgaW5wdXRJbmRleCwgdS5pZCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgdW5zcGVudCBkb2VzIG5vdCBjb3JyZXNwb25kIHRvIHBzYnQgaW5wdXRgKTtcclxuICB9XHJcbiAgY29uc3QgaW5wdXQgPSBjaGVja0ZvcklucHV0KHBzYnQuZGF0YS5pbnB1dHMsIGlucHV0SW5kZXgpO1xyXG5cclxuICBpZiAocmVkZWVtU2NyaXB0ICYmICFpbnB1dC5yZWRlZW1TY3JpcHQpIHtcclxuICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwgeyByZWRlZW1TY3JpcHQgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBCZWNhdXNlIFpjYXNoIGRpcmVjdGx5IGhhc2hlcyB0aGUgdmFsdWUgZm9yIG5vbi1zZWd3aXQgdHJhbnNhY3Rpb25zLCB3ZSBkbyBub3QgbmVlZCB0byBjaGVjayBpbmRpcmVjdGx5XHJcbiAgLy8gd2l0aCB0aGUgcHJldmlvdXMgdHJhbnNhY3Rpb24uIFRoZXJlZm9yZSwgd2UgY2FuIHRyZWF0IFpjYXNoIG5vbi1zZWd3aXQgdHJhbnNhY3Rpb25zIGFzIEJpdGNvaW5cclxuICAvLyBzZWd3aXQgdHJhbnNhY3Rpb25zXHJcbiAgY29uc3QgaXNaY2FzaCA9IGdldE1haW5uZXQocHNidC5uZXR3b3JrKSA9PT0gbmV0d29ya3MuemNhc2g7XHJcbiAgaWYgKCFpc1Vuc3BlbnRXaXRoUHJldlR4KHUpICYmICFpc1pjYXNoICYmICFjdXN0b21QYXJhbXM/LnNraXBOb25XaXRuZXNzVXR4bykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciwgcmVxdWlyZSBwcmV2aW91cyB0eCB0byBhZGQgdG8gUFNCVCcpO1xyXG4gIH1cclxuICBpZiAoKGlzWmNhc2ggJiYgIWlucHV0LndpdG5lc3NVdHhvKSB8fCBjdXN0b21QYXJhbXM/LnNraXBOb25XaXRuZXNzVXR4bykge1xyXG4gICAgY29uc3QgeyBzY3JpcHQsIHZhbHVlIH0gPSB0b1ByZXZPdXRwdXQodSwgcHNidC5uZXR3b3JrKTtcclxuICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwgeyB3aXRuZXNzVXR4bzogeyBzY3JpcHQsIHZhbHVlIH0gfSk7XHJcbiAgfSBlbHNlIGlmICghaXNaY2FzaCAmJiAhaW5wdXQubm9uV2l0bmVzc1V0eG8pIHtcclxuICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwgeyBub25XaXRuZXNzVXR4bzogKHUgYXMgVW5zcGVudFdpdGhQcmV2VHg8YmlnaW50PikucHJldlR4IH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2lnaGFzaFR5cGUgPSBnZXREZWZhdWx0U2lnSGFzaChwc2J0Lm5ldHdvcmspO1xyXG4gIGlmIChwc2J0LmRhdGEuaW5wdXRzW2lucHV0SW5kZXhdLnNpZ2hhc2hUeXBlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwgeyBzaWdoYXNoVHlwZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZFVuc3BlbnRUb1BzYnQoXHJcbiAgcHNidDogVXR4b1BzYnQsXHJcbiAgaWQ6IHN0cmluZyxcclxuICB7IHNlcXVlbmNlTnVtYmVyID0gVFhfSU5QVVRfU0VRVUVOQ0VfTlVNQkVSX0ZJTkFMIH06IHsgc2VxdWVuY2VOdW1iZXI/OiBudW1iZXIgfSA9IHt9XHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IHsgdHhpZCwgdm91dCB9ID0gcGFyc2VPdXRwdXRJZChpZCk7XHJcbiAgcHNidC5hZGRJbnB1dCh7XHJcbiAgICBoYXNoOiB0eGlkLFxyXG4gICAgaW5kZXg6IHZvdXQsXHJcbiAgICBzZXF1ZW5jZTogc2VxdWVuY2VOdW1iZXIsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZXBsYXlQcm90ZWN0aW9uVW5zcGVudFRvUHNidChcclxuICBwc2J0OiBVdHhvUHNidCxcclxuICB1OiBVbnNwZW50PGJpZ2ludD4sXHJcbiAgcmVkZWVtU2NyaXB0OiBCdWZmZXIsXHJcbiAgY3VzdG9tUGFyYW1zPzogeyBza2lwTm9uV2l0bmVzc1V0eG8/OiBib29sZWFuIH1cclxuKTogdm9pZCB7XHJcbiAgYWRkVW5zcGVudFRvUHNidChwc2J0LCB1LmlkKTtcclxuICB1cGRhdGVSZXBsYXlQcm90ZWN0aW9uVW5zcGVudFRvUHNidChwc2J0LCBwc2J0LmlucHV0Q291bnQgLSAxLCB1LCByZWRlZW1TY3JpcHQsIGN1c3RvbVBhcmFtcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgdGhlIFBTQlQgd2l0aCB0aGUgdW5zcGVudCBkYXRhIGZvciB0aGUgaW5wdXQgYXQgdGhlIGdpdmVuIGluZGV4IGlmIHRoZSBkYXRhIGlzIG5vdCB0aGVyZSBhbHJlYWR5LlxyXG4gKlxyXG4gKiBJZiBza2lwTm9uV2l0bmVzc1V0eG8gaXMgdHJ1ZSwgdGhlbiB0aGUgbm9uV2l0bmVzc1V0eG8gd2lsbCBub3QgYmUgYWRkZWQgZm9yIGFuIGlucHV0IHRoYXQgcmVxdWlyZXMgaXQgKGUuZy4gbm9uLXNlZ3dpdClcclxuICogYW5kIGluc3RlYWQgdGhlIHdpdG5lc3NVdHhvIHdpbGwgYmUgYWRkZWRcclxuICpcclxuICogQHBhcmFtIHBzYnRcclxuICogQHBhcmFtIGlucHV0SW5kZXhcclxuICogQHBhcmFtIHVcclxuICogQHBhcmFtIHJvb3RXYWxsZXRLZXlzXHJcbiAqIEBwYXJhbSBzaWduZXJcclxuICogQHBhcmFtIGNvc2lnbmVyXHJcbiAqIEBwYXJhbSBjdXN0b21QYXJhbXNcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVXYWxsZXRVbnNwZW50Rm9yUHNidChcclxuICBwc2J0OiBVdHhvUHNidCxcclxuICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgdTogV2FsbGV0VW5zcGVudDxiaWdpbnQ+LFxyXG4gIHJvb3RXYWxsZXRLZXlzOiBSb290V2FsbGV0S2V5cyxcclxuICBzaWduZXI6IEtleU5hbWUsXHJcbiAgY29zaWduZXI6IEtleU5hbWUsXHJcbiAgY3VzdG9tUGFyYW1zPzogeyBza2lwTm9uV2l0bmVzc1V0eG8/OiBib29sZWFuIH1cclxuKTogdm9pZCB7XHJcbiAgaWYgKCFwc2J0SW5jbHVkZXNVbnNwZW50QXRJbmRleChwc2J0LCBpbnB1dEluZGV4LCB1LmlkKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bnNwZW50IGRvZXMgbm90IGNvcnJlc3BvbmQgdG8gcHNidCBpbnB1dGApO1xyXG4gIH1cclxuICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQocHNidC5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcblxyXG4gIC8vIEJlY2F1c2UgWmNhc2ggZGlyZWN0bHkgaGFzaGVzIHRoZSB2YWx1ZSBmb3Igbm9uLXNlZ3dpdCB0cmFuc2FjdGlvbnMsIHdlIGRvIG5vdCBuZWVkIHRvIGNoZWNrIGluZGlyZWN0bHlcclxuICAvLyB3aXRoIHRoZSBwcmV2aW91cyB0cmFuc2FjdGlvbi4gVGhlcmVmb3JlLCB3ZSBjYW4gdHJlYXQgWmNhc2ggbm9uLXNlZ3dpdCB0cmFuc2FjdGlvbnMgYXMgQml0Y29pblxyXG4gIC8vIHNlZ3dpdCB0cmFuc2FjdGlvbnNcclxuICBjb25zdCBpc1pjYXNoT3JTZWd3aXQgPSBpc1NlZ3dpdCh1LmNoYWluKSB8fCBnZXRNYWlubmV0KHBzYnQubmV0d29yaykgPT09IG5ldHdvcmtzLnpjYXNoO1xyXG4gIGlmICgoaXNaY2FzaE9yU2Vnd2l0IHx8IGN1c3RvbVBhcmFtcz8uc2tpcE5vbldpdG5lc3NVdHhvKSAmJiAhaW5wdXQud2l0bmVzc1V0eG8pIHtcclxuICAgIGNvbnN0IHsgc2NyaXB0LCB2YWx1ZSB9ID0gdG9QcmV2T3V0cHV0KHUsIHBzYnQubmV0d29yayk7XHJcbiAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHsgd2l0bmVzc1V0eG86IHsgc2NyaXB0LCB2YWx1ZSB9IH0pO1xyXG4gIH0gZWxzZSBpZiAoIWlzWmNhc2hPclNlZ3dpdCkge1xyXG4gICAgaWYgKCFpc1Vuc3BlbnRXaXRoUHJldlR4KHUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IsIHJlcXVpcmUgcHJldmlvdXMgdHggdG8gYWRkIHRvIFBTQlQnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWlucHV0LndpdG5lc3NVdHhvICYmICFpbnB1dC5ub25XaXRuZXNzVXR4bykge1xyXG4gICAgICAvLyBGb3JjZSB0aGUgbGl0ZWNvaW4gdHJhbnNhY3Rpb24gdG8gaGF2ZSBubyBNV0VCIGFkdmFuY2VkIHRyYW5zYWN0aW9uIGZsYWdcclxuICAgICAgaWYgKGdldE1haW5uZXQocHNidC5uZXR3b3JrKSA9PT0gbmV0d29ya3MubGl0ZWNvaW4pIHtcclxuICAgICAgICB1LnByZXZUeCA9IGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcih1LnByZXZUeCwgcHNidC5uZXR3b3JrLCB7IGFtb3VudFR5cGU6ICdiaWdpbnQnIH0pLnRvQnVmZmVyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwgeyBub25XaXRuZXNzVXR4bzogdS5wcmV2VHggfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCB3YWxsZXRLZXlzID0gcm9vdFdhbGxldEtleXMuZGVyaXZlRm9yQ2hhaW5BbmRJbmRleCh1LmNoYWluLCB1LmluZGV4KTtcclxuICBjb25zdCBzY3JpcHRUeXBlID0gc2NyaXB0VHlwZUZvckNoYWluKHUuY2hhaW4pO1xyXG4gIGNvbnN0IHNpZ2hhc2hUeXBlID0gZ2V0RGVmYXVsdFNpZ0hhc2gocHNidC5uZXR3b3JrLCBzY3JpcHRUeXBlKTtcclxuICBpZiAocHNidC5kYXRhLmlucHV0c1tpbnB1dEluZGV4XS5zaWdoYXNoVHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHsgc2lnaGFzaFR5cGUgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IGlzQmFja3VwRmxvdyA9IHNpZ25lciA9PT0gJ2JhY2t1cCcgfHwgY29zaWduZXIgPT09ICdiYWNrdXAnO1xyXG5cclxuICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3AydHInIHx8IChzY3JpcHRUeXBlID09PSAncDJ0ck11c2lnMicgJiYgaXNCYWNrdXBGbG93KSkge1xyXG4gICAgaWYgKGlucHV0LnRhcExlYWZTY3JpcHQgJiYgaW5wdXQudGFwQmlwMzJEZXJpdmF0aW9uKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGNyZWF0ZVNwZW5kU2NyaXB0UDJ0ckZuID0gc2NyaXB0VHlwZSA9PT0gJ3AydHInID8gY3JlYXRlU3BlbmRTY3JpcHRQMnRyIDogY3JlYXRlU3BlbmRTY3JpcHRQMnRyTXVzaWcyO1xyXG4gICAgY29uc3QgeyBjb250cm9sQmxvY2ssIHdpdG5lc3NTY3JpcHQsIGxlYWZWZXJzaW9uLCBsZWFmSGFzaCB9ID0gY3JlYXRlU3BlbmRTY3JpcHRQMnRyRm4od2FsbGV0S2V5cy5wdWJsaWNLZXlzLCBbXHJcbiAgICAgIHdhbGxldEtleXNbc2lnbmVyXS5wdWJsaWNLZXksXHJcbiAgICAgIHdhbGxldEtleXNbY29zaWduZXJdLnB1YmxpY0tleSxcclxuICAgIF0pO1xyXG4gICAgaWYgKCFpbnB1dC50YXBMZWFmU2NyaXB0KSB7XHJcbiAgICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwge1xyXG4gICAgICAgIHRhcExlYWZTY3JpcHQ6IFt7IGNvbnRyb2xCbG9jaywgc2NyaXB0OiB3aXRuZXNzU2NyaXB0LCBsZWFmVmVyc2lvbiB9XSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWlucHV0LnRhcEJpcDMyRGVyaXZhdGlvbikge1xyXG4gICAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHtcclxuICAgICAgICB0YXBCaXAzMkRlcml2YXRpb246IFtzaWduZXIsIGNvc2lnbmVyXS5tYXAoKGtleSkgPT4gKHtcclxuICAgICAgICAgIGxlYWZIYXNoZXM6IFtsZWFmSGFzaF0sXHJcbiAgICAgICAgICBwdWJrZXk6IHRvWE9ubHlQdWJsaWNLZXkod2FsbGV0S2V5c1trZXldLnB1YmxpY0tleSksXHJcbiAgICAgICAgICBwYXRoOiByb290V2FsbGV0S2V5cy5nZXREZXJpdmF0aW9uUGF0aChyb290V2FsbGV0S2V5c1trZXldLCB1LmNoYWluLCB1LmluZGV4KSxcclxuICAgICAgICAgIG1hc3RlckZpbmdlcnByaW50OiByb290V2FsbGV0S2V5c1trZXldLmZpbmdlcnByaW50LFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChzY3JpcHRUeXBlID09PSAncDJ0ck11c2lnMicpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgaW50ZXJuYWxQdWJrZXk6IHRhcEludGVybmFsS2V5LFxyXG4gICAgICBvdXRwdXRQdWJrZXk6IHRhcE91dHB1dEtleSxcclxuICAgICAgdGFwdHJlZVJvb3QsXHJcbiAgICB9ID0gY3JlYXRlS2V5UGF0aFAydHJNdXNpZzIod2FsbGV0S2V5cy5wdWJsaWNLZXlzKTtcclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIHBzYnQuZ2V0UHJvcHJpZXRhcnlLZXlWYWxzKGlucHV0SW5kZXgsIHtcclxuICAgICAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICAgICAgc3VidHlwZTogUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLk1VU0lHMl9QQVJUSUNJUEFOVF9QVUJfS0VZUyxcclxuICAgICAgfSkubGVuZ3RoID09PSAwXHJcbiAgICApIHtcclxuICAgICAgY29uc3QgcGFydGljaXBhbnRzS2V5VmFsRGF0YSA9IGVuY29kZVBzYnRNdXNpZzJQYXJ0aWNpcGFudHMoe1xyXG4gICAgICAgIHRhcE91dHB1dEtleSxcclxuICAgICAgICB0YXBJbnRlcm5hbEtleSxcclxuICAgICAgICBwYXJ0aWNpcGFudFB1YktleXM6IFt3YWxsZXRLZXlzLnVzZXIucHVibGljS2V5LCB3YWxsZXRLZXlzLmJpdGdvLnB1YmxpY0tleV0sXHJcbiAgICAgIH0pO1xyXG4gICAgICBwc2J0LmFkZFByb3ByaWV0YXJ5S2V5VmFsVG9JbnB1dChpbnB1dEluZGV4LCBwYXJ0aWNpcGFudHNLZXlWYWxEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWlucHV0LnRhcEludGVybmFsS2V5KSB7XHJcbiAgICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwge1xyXG4gICAgICAgIHRhcEludGVybmFsS2V5OiB0YXBJbnRlcm5hbEtleSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpbnB1dC50YXBNZXJrbGVSb290KSB7XHJcbiAgICAgIHBzYnQudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwge1xyXG4gICAgICAgIHRhcE1lcmtsZVJvb3Q6IHRhcHRyZWVSb290LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWlucHV0LnRhcEJpcDMyRGVyaXZhdGlvbikge1xyXG4gICAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHtcclxuICAgICAgICB0YXBCaXAzMkRlcml2YXRpb246IFtzaWduZXIsIGNvc2lnbmVyXS5tYXAoKGtleSkgPT4gKHtcclxuICAgICAgICAgIGxlYWZIYXNoZXM6IFtdLFxyXG4gICAgICAgICAgcHVia2V5OiB0b1hPbmx5UHVibGljS2V5KHdhbGxldEtleXNba2V5XS5wdWJsaWNLZXkpLFxyXG4gICAgICAgICAgcGF0aDogcm9vdFdhbGxldEtleXMuZ2V0RGVyaXZhdGlvblBhdGgocm9vdFdhbGxldEtleXNba2V5XSwgdS5jaGFpbiwgdS5pbmRleCksXHJcbiAgICAgICAgICBtYXN0ZXJGaW5nZXJwcmludDogcm9vdFdhbGxldEtleXNba2V5XS5maW5nZXJwcmludCxcclxuICAgICAgICB9KSksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoIWlucHV0LmJpcDMyRGVyaXZhdGlvbikge1xyXG4gICAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHtcclxuICAgICAgICBiaXAzMkRlcml2YXRpb246IFswLCAxLCAyXS5tYXAoKGlkeCkgPT4gKHtcclxuICAgICAgICAgIHB1YmtleTogd2FsbGV0S2V5cy50cmlwbGVbaWR4XS5wdWJsaWNLZXksXHJcbiAgICAgICAgICBwYXRoOiB3YWxsZXRLZXlzLnBhdGhzW2lkeF0sXHJcbiAgICAgICAgICBtYXN0ZXJGaW5nZXJwcmludDogcm9vdFdhbGxldEtleXMudHJpcGxlW2lkeF0uZmluZ2VycHJpbnQsXHJcbiAgICAgICAgfSkpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IHdpdG5lc3NTY3JpcHQsIHJlZGVlbVNjcmlwdCB9ID0gY3JlYXRlT3V0cHV0U2NyaXB0Mm9mMyh3YWxsZXRLZXlzLnB1YmxpY0tleXMsIHNjcmlwdFR5cGUpO1xyXG4gICAgaWYgKHdpdG5lc3NTY3JpcHQgJiYgIWlucHV0LndpdG5lc3NTY3JpcHQpIHtcclxuICAgICAgcHNidC51cGRhdGVJbnB1dChpbnB1dEluZGV4LCB7IHdpdG5lc3NTY3JpcHQgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAocmVkZWVtU2NyaXB0ICYmICFpbnB1dC5yZWRlZW1TY3JpcHQpIHtcclxuICAgICAgcHNidC51cGRhdGVJbnB1dChpbnB1dEluZGV4LCB7IHJlZGVlbVNjcmlwdCB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRXYWxsZXRVbnNwZW50VG9Qc2J0KFxyXG4gIHBzYnQ6IFV0eG9Qc2J0LFxyXG4gIHU6IFdhbGxldFVuc3BlbnQ8YmlnaW50PixcclxuICByb290V2FsbGV0S2V5czogUm9vdFdhbGxldEtleXMsXHJcbiAgc2lnbmVyOiBLZXlOYW1lLFxyXG4gIGNvc2lnbmVyOiBLZXlOYW1lLFxyXG4gIGN1c3RvbVBhcmFtcz86IHsgaXNSZXBsYWNlYWJsZUJ5RmVlPzogYm9vbGVhbjsgc2tpcE5vbldpdG5lc3NVdHhvPzogYm9vbGVhbiB9XHJcbik6IHZvaWQge1xyXG4gIGxldCBzZXF1ZW5jZU51bWJlciA9IFRYX0lOUFVUX1NFUVVFTkNFX05VTUJFUl9GSU5BTDtcclxuICBpZiAoY3VzdG9tUGFyYW1zICYmIGN1c3RvbVBhcmFtcy5pc1JlcGxhY2VhYmxlQnlGZWUpIHtcclxuICAgIHNlcXVlbmNlTnVtYmVyID0gTUFYX0JJUDEyNV9SQkZfU0VRVUVOQ0U7XHJcbiAgfVxyXG5cclxuICBhZGRVbnNwZW50VG9Qc2J0KHBzYnQsIHUuaWQsIHsgc2VxdWVuY2VOdW1iZXIgfSk7XHJcbiAgdXBkYXRlV2FsbGV0VW5zcGVudEZvclBzYnQoXHJcbiAgICBwc2J0LFxyXG4gICAgcHNidC5pbnB1dENvdW50IC0gMSxcclxuICAgIHUsXHJcbiAgICByb290V2FsbGV0S2V5cyxcclxuICAgIHNpZ25lcixcclxuICAgIGNvc2lnbmVyLFxyXG4gICAgY3VzdG9tUGFyYW1zID8geyBza2lwTm9uV2l0bmVzc1V0eG86IGN1c3RvbVBhcmFtcy5za2lwTm9uV2l0bmVzc1V0eG8gfSA6IHt9XHJcbiAgKTtcclxufVxyXG4iXX0=