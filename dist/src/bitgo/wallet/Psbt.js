"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWitnessUtxoForNonSegwitInputs = exports.clonePsbtWithoutNonWitnessUtxo = exports.extractP2msOnlyHalfSignedTx = exports.getSignatureValidationArrayPsbt = exports.addXpubsToPsbt = exports.isTransactionWithKeyPathSpendInput = exports.isTxInputArray = exports.isPsbtInputArray = exports.getStrictSignatureCounts = exports.getStrictSignatureCount = exports.toScriptType2Of3s = exports.parsePsbtInput = exports.getPsbtInputScriptType = exports.signWalletPsbt = exports.toWalletPsbt = void 0;
const assert = require("assert");
const utils_1 = require("bip174/src/lib/utils");
const bs58check = require("bs58check");
const UtxoPsbt_1 = require("../UtxoPsbt");
const UtxoTransaction_1 = require("../UtxoTransaction");
const outputScripts_1 = require("../outputScripts");
const WalletKeys_1 = require("./WalletKeys");
const Unspent_1 = require("../Unspent");
const transaction_1 = require("../transaction");
const Unspent_2 = require("./Unspent");
const parseInput_1 = require("../parseInput");
const Musig2_1 = require("../Musig2");
const types_1 = require("../types");
const taproot_1 = require("../../taproot");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const index_1 = require("../../index");
const PsbtUtil_1 = require("../PsbtUtil");
function getTaprootSigners(script, walletKeys) {
    const parsedPublicKeys = (0, parseInput_1.parsePubScript2Of3)(script, 'taprootScriptPathSpend').publicKeys;
    const walletSigners = parsedPublicKeys.map((publicKey) => {
        const index = walletKeys.publicKeys.findIndex((walletPublicKey) => (0, outputScripts_1.toXOnlyPublicKey)(walletPublicKey).equals(publicKey));
        if (index >= 0) {
            return { walletKey: walletKeys.triple[index], rootKey: walletKeys.parent.triple[index] };
        }
        throw new Error('Taproot public key is not a wallet public key');
    });
    return [walletSigners[0], walletSigners[1]];
}
function updatePsbtInput(psbt, inputIndex, unspent, rootWalletKeys) {
    const input = (0, utils_1.checkForInput)(psbt.data.inputs, inputIndex);
    const signatureCount = (0, PsbtUtil_1.getPsbtInputSignatureCount)(input);
    const scriptType = (0, outputScripts_1.scriptTypeForChain)(unspent.chain);
    if (signatureCount === 0 && scriptType === 'p2tr') {
        return;
    }
    const walletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
    if (scriptType === 'p2tr') {
        if (!Array.isArray(input.tapLeafScript) || input.tapLeafScript.length === 0) {
            throw new Error('Invalid PSBT state. Missing required fields.');
        }
        if (input.tapLeafScript.length > 1) {
            throw new Error('Bitgo only supports a single tap leaf script per input');
        }
        const [signer, cosigner] = getTaprootSigners(input.tapLeafScript[0].script, walletKeys);
        const leafHash = (0, outputScripts_1.getLeafHash)({
            publicKeys: walletKeys.publicKeys,
            signer: signer.walletKey.publicKey,
            cosigner: cosigner.walletKey.publicKey,
        });
        psbt.updateInput(inputIndex, {
            tapBip32Derivation: [signer, cosigner].map((walletSigner) => ({
                leafHashes: [leafHash],
                pubkey: (0, outputScripts_1.toXOnlyPublicKey)(walletSigner.walletKey.publicKey),
                path: rootWalletKeys.getDerivationPath(walletSigner.rootKey, unspent.chain, unspent.index),
                masterFingerprint: walletSigner.rootKey.fingerprint,
            })),
        });
    }
    else {
        if (signatureCount === 0) {
            const { witnessScript, redeemScript } = (0, outputScripts_1.createOutputScript2of3)(walletKeys.publicKeys, scriptType);
            if (witnessScript && psbt.data.inputs[inputIndex].witnessScript === undefined) {
                psbt.updateInput(inputIndex, { witnessScript });
            }
            if (redeemScript && psbt.data.inputs[inputIndex].redeemScript === undefined) {
                psbt.updateInput(inputIndex, { redeemScript });
            }
        }
        psbt.updateInput(inputIndex, {
            bip32Derivation: [0, 1, 2].map((idx) => ({
                pubkey: walletKeys.triple[idx].publicKey,
                path: walletKeys.paths[idx],
                masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
            })),
        });
    }
}
/**
 * @return PSBT filled with metatdata as per input params tx, unspents and rootWalletKeys.
 * Unsigned PSBT for taproot input with witnessUtxo
 * Unsigned PSBT for other input with witnessUtxo/nonWitnessUtxo, redeemScript/witnessScript, bip32Derivation
 * Signed PSBT for taproot input with witnessUtxo, tapLeafScript, tapBip32Derivation, tapScriptSig
 * Signed PSBT for other input with witnessUtxo/nonWitnessUtxo, redeemScript/witnessScript, bip32Derivation, partialSig
 */
function toWalletPsbt(tx, unspents, rootWalletKeys) {
    const prevOutputs = unspents.map((u) => {
        assert.notStrictEqual((0, outputScripts_1.scriptTypeForChain)(u.chain), 'p2trMusig2');
        return (0, Unspent_1.toPrevOutputWithPrevTx)(u, tx.network);
    });
    const psbt = (0, transaction_1.createPsbtFromTransaction)(tx, prevOutputs);
    unspents.forEach((u, i) => {
        if ((0, Unspent_2.isWalletUnspent)(u) && u.index !== undefined) {
            updatePsbtInput(psbt, i, u, rootWalletKeys);
        }
    });
    return psbt;
}
exports.toWalletPsbt = toWalletPsbt;
/**
 * @param psbt
 * @param inputIndex
 * @param signer
 * @param unspent
 * @return signed PSBT with signer's key for unspent
 */
function signWalletPsbt(psbt, inputIndex, signer, unspent) {
    const scriptType = (0, outputScripts_1.scriptTypeForChain)(unspent.chain);
    if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
        psbt.signTaprootInputHD(inputIndex, signer);
    }
    else {
        psbt.signInputHD(inputIndex, signer);
    }
}
exports.signWalletPsbt = signWalletPsbt;
/**
 * @returns script type of the input
 */
function getPsbtInputScriptType(input) {
    const isP2pk = (script) => {
        try {
            const chunks = bitcoinjs_lib_1.script.decompile(script);
            return ((chunks === null || chunks === void 0 ? void 0 : chunks.length) === 2 &&
                Buffer.isBuffer(chunks[0]) &&
                bitcoinjs_lib_1.script.isCanonicalPubKey(chunks[0]) &&
                chunks[1] === index_1.opcodes.OP_CHECKSIG);
        }
        catch (e) {
            return false;
        }
    };
    let scriptType;
    if (Buffer.isBuffer(input.redeemScript) && Buffer.isBuffer(input.witnessScript)) {
        scriptType = 'p2shP2wsh';
    }
    else if (Buffer.isBuffer(input.redeemScript)) {
        scriptType = isP2pk(input.redeemScript) ? 'p2shP2pk' : 'p2sh';
    }
    else if (Buffer.isBuffer(input.witnessScript)) {
        scriptType = 'p2wsh';
    }
    if (Array.isArray(input.tapLeafScript) && input.tapLeafScript.length > 0) {
        if (scriptType) {
            throw new Error(`Found both ${scriptType} and taprootScriptPath PSBT metadata.`);
        }
        if (input.tapLeafScript.length > 1) {
            throw new Error('Bitgo only supports a single tap leaf script per input.');
        }
        scriptType = 'taprootScriptPathSpend';
    }
    if (input.tapInternalKey) {
        if (scriptType) {
            throw new Error(`Found both ${scriptType} and taprootKeyPath PSBT metadata.`);
        }
        scriptType = 'taprootKeyPathSpend';
    }
    if (scriptType) {
        return scriptType;
    }
    throw new Error('could not parse input');
}
exports.getPsbtInputScriptType = getPsbtInputScriptType;
function parseTaprootKeyPathSignatures(input) {
    const partialSigs = (0, Musig2_1.parsePsbtMusig2PartialSigs)(input);
    if (!partialSigs) {
        return { signatures: undefined, participantPublicKeys: undefined };
    }
    const signatures = partialSigs.map((pSig) => pSig.partialSig);
    const participantPublicKeys = partialSigs.map((pSig) => pSig.participantPubKey);
    return (0, types_1.isTuple)(signatures) && (0, types_1.isTuple)(participantPublicKeys)
        ? { signatures, participantPublicKeys }
        : { signatures: [signatures[0]], participantPublicKeys: [participantPublicKeys[0]] };
}
function parsePartialOrTapScriptSignatures(sig) {
    if (!(sig === null || sig === void 0 ? void 0 : sig.length)) {
        return { signatures: undefined };
    }
    if (sig.length > 2) {
        throw new Error('unexpected signature count');
    }
    const signatures = sig.map((tSig) => tSig.signature);
    return (0, types_1.isTuple)(signatures) ? { signatures } : { signatures: [signatures[0]] };
}
function parseSignatures(input, scriptType) {
    return scriptType === 'taprootKeyPathSpend'
        ? parseTaprootKeyPathSignatures(input)
        : scriptType === 'taprootScriptPathSpend'
            ? parsePartialOrTapScriptSignatures(input.tapScriptSig)
            : parsePartialOrTapScriptSignatures(input.partialSig);
}
function parseScript(input, scriptType) {
    var _a;
    let pubScript;
    if (scriptType === 'p2sh' || scriptType === 'p2shP2pk') {
        pubScript = input.redeemScript;
    }
    else if (scriptType === 'p2wsh' || scriptType === 'p2shP2wsh') {
        pubScript = input.witnessScript;
    }
    else if (scriptType === 'taprootScriptPathSpend') {
        pubScript = input.tapLeafScript ? input.tapLeafScript[0].script : undefined;
    }
    else if (scriptType === 'taprootKeyPathSpend') {
        if ((_a = input.witnessUtxo) === null || _a === void 0 ? void 0 : _a.script) {
            pubScript = input.witnessUtxo.script;
        }
        else if (input.tapInternalKey && input.tapMerkleRoot) {
            pubScript = (0, taproot_1.createTaprootOutputScript)({ internalPubKey: input.tapInternalKey, taptreeRoot: input.tapMerkleRoot });
        }
    }
    if (!pubScript) {
        throw new Error(`Invalid PSBT state for ${scriptType}. Missing required fields.`);
    }
    return (0, parseInput_1.parsePubScript)(pubScript, scriptType);
}
/**
 * @return psbt metadata are parsed as per below conditions.
 * redeemScript/witnessScript/tapLeafScript matches BitGo.
 * signature and public key count matches BitGo.
 * P2SH-P2PK => scriptType, redeemScript, public key, signature.
 * P2SH => scriptType, redeemScript, public keys, signatures.
 * PW2SH => scriptType, witnessScript, public keys, signatures.
 * P2SH-PW2SH => scriptType, redeemScript, witnessScript, public keys, signatures.
 * P2TR and P2TR MUSIG2 script path => scriptType (taprootScriptPathSpend), pubScript (leaf script), controlBlock,
 * scriptPathLevel, leafVersion, public keys, signatures.
 * P2TR MUSIG2 kep path => scriptType (taprootKeyPathSpend), pubScript (scriptPubKey), participant pub keys (signer),
 * public key (tapOutputkey), signatures (partial signer sigs).
 */
function parsePsbtInput(input) {
    if ((0, PsbtUtil_1.isPsbtInputFinalized)(input)) {
        throw new Error('Finalized PSBT parsing is not supported');
    }
    const scriptType = getPsbtInputScriptType(input);
    const parsedPubScript = parseScript(input, scriptType);
    const signatures = parseSignatures(input, scriptType);
    if (parsedPubScript.scriptType === 'taprootKeyPathSpend' && 'participantPublicKeys' in signatures) {
        return {
            ...parsedPubScript,
            ...signatures,
        };
    }
    if (parsedPubScript.scriptType === 'taprootScriptPathSpend') {
        if (!input.tapLeafScript) {
            throw new Error('Invalid PSBT state for taprootScriptPathSpend. Missing required fields.');
        }
        const controlBlock = input.tapLeafScript[0].controlBlock;
        if (!(0, parseInput_1.isValidControlBock)(controlBlock)) {
            throw new Error('Invalid PSBT taprootScriptPathSpend controlBlock.');
        }
        const scriptPathLevel = (0, parseInput_1.calculateScriptPathLevel)(controlBlock);
        const leafVersion = (0, parseInput_1.getLeafVersion)(controlBlock);
        return {
            ...parsedPubScript,
            ...signatures,
            controlBlock,
            scriptPathLevel,
            leafVersion,
        };
    }
    if (parsedPubScript.scriptType === 'p2sh' ||
        parsedPubScript.scriptType === 'p2wsh' ||
        parsedPubScript.scriptType === 'p2shP2wsh') {
        if (parsedPubScript.scriptType === 'p2shP2wsh') {
            parsedPubScript.redeemScript = input.redeemScript;
        }
        return {
            ...parsedPubScript,
            ...signatures,
        };
    }
    if (parsedPubScript.scriptType === 'p2shP2pk' && (!signatures.signatures || !(0, types_1.isTuple)(signatures.signatures))) {
        return {
            ...parsedPubScript,
            signatures: signatures.signatures,
        };
    }
    throw new Error('invalid pub script');
}
exports.parsePsbtInput = parsePsbtInput;
/**
 * Converts a parsed script type into an array of script types.
 * @param parsedScriptType - The parsed script type.
 * @returns An array of ScriptType2Of3 values corresponding to the parsed script type.
 */
function toScriptType2Of3s(parsedScriptType) {
    return parsedScriptType === 'taprootScriptPathSpend'
        ? ['p2trMusig2', 'p2tr']
        : parsedScriptType === 'taprootKeyPathSpend'
            ? ['p2trMusig2']
            : [parsedScriptType];
}
exports.toScriptType2Of3s = toScriptType2Of3s;
/**
 * @returns strictly parse the input and get signature count.
 * unsigned(0), half-signed(1) or fully-signed(2)
 */
function getStrictSignatureCount(input) {
    var _a, _b;
    const calculateSignatureCount = (signatures) => {
        const count = signatures ? signatures.filter((s) => !(0, parseInput_1.isPlaceholderSignature)(s)).length : 0;
        if (count === 0 || count === 1 || count === 2) {
            return count;
        }
        throw new Error('invalid signature count');
    };
    if ('hash' in input) {
        if (((_a = input.script) === null || _a === void 0 ? void 0 : _a.length) || ((_b = input.witness) === null || _b === void 0 ? void 0 : _b.length)) {
            const parsedInput = (0, parseInput_1.parseSignatureScript)(input);
            return parsedInput.scriptType === 'taprootKeyPathSpend' ? 2 : calculateSignatureCount(parsedInput.signatures);
        }
        return 0;
    }
    else {
        return calculateSignatureCount(parsePsbtInput(input).signatures);
    }
}
exports.getStrictSignatureCount = getStrictSignatureCount;
/**
 * @returns strictly parse input and get signature count for all inputs.
 * 0=unsigned, 1=half-signed or 2=fully-signed
 */
function getStrictSignatureCounts(tx) {
    const inputs = tx instanceof UtxoPsbt_1.UtxoPsbt ? tx.data.inputs : tx instanceof UtxoTransaction_1.UtxoTransaction ? tx.ins : tx;
    return inputs.map((input, _) => getStrictSignatureCount(input));
}
exports.getStrictSignatureCounts = getStrictSignatureCounts;
/**
 * @return true iff inputs array is of PsbtInputType type
 * */
function isPsbtInputArray(inputs) {
    return !isTxInputArray(inputs);
}
exports.isPsbtInputArray = isPsbtInputArray;
/**
 * @return true iff inputs array is of TxInput type
 * */
function isTxInputArray(inputs) {
    assert(!!inputs.length, 'empty inputs array');
    return 'hash' in inputs[0];
}
exports.isTxInputArray = isTxInputArray;
/**
 * @returns true iff given psbt/transaction/tx-input-array/psbt-input-array contains at least one taproot key path spend input
 */
function isTransactionWithKeyPathSpendInput(data) {
    const inputs = data instanceof UtxoPsbt_1.UtxoPsbt ? data.data.inputs : data instanceof UtxoTransaction_1.UtxoTransaction ? data.ins : data;
    if (!inputs.length) {
        return false;
    }
    if (isPsbtInputArray(inputs)) {
        return inputs.some((input, _) => getPsbtInputScriptType(input) === 'taprootKeyPathSpend');
    }
    return inputs.some((input, _) => {
        // If the input is not signed, it cannot be a taprootKeyPathSpend input because you can only
        // extract a fully signed psbt into a transaction with taprootKeyPathSpend inputs.
        if (getStrictSignatureCount(input) === 0) {
            return false;
        }
        return (0, parseInput_1.parseSignatureScript)(input).scriptType === 'taprootKeyPathSpend';
    });
}
exports.isTransactionWithKeyPathSpendInput = isTransactionWithKeyPathSpendInput;
/**
 * Set the RootWalletKeys as the globalXpubs on the psbt
 *
 * We do all the matching of the (tap)bip32Derivations masterFingerprint to the fingerprint of the
 * extendedPubkey.
 */
function addXpubsToPsbt(psbt, rootWalletKeys) {
    const safeRootWalletKeys = new WalletKeys_1.RootWalletKeys(rootWalletKeys.triple.map((bip32) => bip32.neutered()), rootWalletKeys.derivationPrefixes);
    const xPubs = safeRootWalletKeys.triple.map((bip32) => ({
        extendedPubkey: bs58check.decode(bip32.toBase58()),
        masterFingerprint: bip32.fingerprint,
        // TODO: BG-73797 - bip174 currently requires m prefix for this to be a valid globalXpub
        path: 'm',
    }));
    psbt.updateGlobal({ globalXpub: xPubs });
}
exports.addXpubsToPsbt = addXpubsToPsbt;
/**
 * validates signatures for each 2 of 3 input against user, backup, bitgo keys derived from rootWalletKeys.
 * @returns array of input index and its [is valid user sig exist, is valid backup sig exist, is valid user bitgo exist]
 * For p2shP2pk input, [false, false, false] is returned since it is not a 2 of 3 sig input.
 */
function getSignatureValidationArrayPsbt(psbt, rootWalletKeys) {
    return psbt.data.inputs.map((input, i) => {
        const sigValArrayForInput = getPsbtInputScriptType(input) === 'p2shP2pk'
            ? [false, false, false]
            : psbt.getSignatureValidationArray(i, { rootNodes: rootWalletKeys.triple });
        return [i, sigValArrayForInput];
    });
}
exports.getSignatureValidationArrayPsbt = getSignatureValidationArrayPsbt;
/**
 * Extracts the half signed transaction from the psbt for p2ms based script types - p2sh, p2wsh, and p2shP2wsh.
 * The purpose is to provide backward compatibility to keyternal (KRS) that only supports network transaction and p2ms script types.
 */
function extractP2msOnlyHalfSignedTx(psbt) {
    assert(!!(psbt.data.inputs.length && psbt.data.outputs.length), 'empty inputs or outputs');
    const tx = psbt.getUnsignedTx();
    function isP2msParsedPsbtInput(parsed) {
        return ['p2sh', 'p2shP2wsh', 'p2wsh'].includes(parsed.scriptType);
    }
    psbt.data.inputs.forEach((input, i) => {
        var _a, _b;
        const parsed = parsePsbtInput(input);
        assert(isP2msParsedPsbtInput(parsed), `unsupported script type ${parsed.scriptType}`);
        assert(((_a = input.partialSig) === null || _a === void 0 ? void 0 : _a.length) === 1, `unexpected signature count ${(_b = input.partialSig) === null || _b === void 0 ? void 0 : _b.length}`);
        const [partialSig] = input.partialSig;
        assert(input.sighashType !== undefined && input.sighashType === bitcoinjs_lib_1.script.signature.decode(partialSig.signature).hashType, 'signature sighash does not match input sighash type');
        // type casting is to address the invalid type checking in payments.p2ms
        const signatures = parsed.publicKeys.map((pk) => partialSig.pubkey.equals(pk) ? partialSig.signature : bitcoinjs_lib_1.opcodes.OP_0);
        const isP2SH = !!parsed.redeemScript;
        const isP2WSH = !!parsed.witnessScript;
        const payment = index_1.payments.p2ms({ output: parsed.pubScript, signatures }, { validate: false, allowIncomplete: true });
        const p2wsh = isP2WSH ? index_1.payments.p2wsh({ redeem: payment }) : undefined;
        const p2sh = isP2SH ? index_1.payments.p2sh({ redeem: p2wsh || payment }) : undefined;
        if (p2sh === null || p2sh === void 0 ? void 0 : p2sh.input) {
            tx.setInputScript(i, p2sh.input);
        }
        if (p2wsh === null || p2wsh === void 0 ? void 0 : p2wsh.witness) {
            tx.setWitness(i, p2wsh.witness);
        }
    });
    return tx;
}
exports.extractP2msOnlyHalfSignedTx = extractP2msOnlyHalfSignedTx;
/**
 * Clones the psbt without nonWitnessUtxo for non-segwit inputs and witnessUtxo is added instead.
 * It is not BIP-174 compliant, so use it carefully.
 */
function clonePsbtWithoutNonWitnessUtxo(psbt) {
    const newPsbt = (0, transaction_1.createPsbtFromHex)(psbt.toHex(), psbt.network);
    const txInputs = psbt.txInputs;
    psbt.data.inputs.forEach((input, i) => {
        if (input.nonWitnessUtxo && !input.witnessUtxo) {
            const tx = (0, transaction_1.createTransactionFromBuffer)(input.nonWitnessUtxo, psbt.network, { amountType: 'bigint' });
            if (!txInputs[i].hash.equals(tx.getHash())) {
                throw new Error(`Non-witness UTXO hash for input #${i} doesn't match the hash specified in the prevout`);
            }
            newPsbt.data.inputs[i].witnessUtxo = tx.outs[txInputs[i].index];
        }
        delete newPsbt.data.inputs[i].nonWitnessUtxo;
    });
    return newPsbt;
}
exports.clonePsbtWithoutNonWitnessUtxo = clonePsbtWithoutNonWitnessUtxo;
/**
 * Deletes witnessUtxo for non-segwit inputs to make the PSBT BIP-174 compliant.
 */
function deleteWitnessUtxoForNonSegwitInputs(psbt) {
    psbt.data.inputs.forEach((input, i) => {
        const scriptType = getPsbtInputScriptType(input);
        if (scriptType === 'p2sh' || scriptType === 'p2shP2pk') {
            delete input.witnessUtxo;
        }
    });
}
exports.deleteWitnessUtxoForNonSegwitInputs = deleteWitnessUtxoForNonSegwitInputs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHNidC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby93YWxsZXQvUHNidC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFHakMsZ0RBQXFEO0FBRXJELHVDQUF1QztBQUN2QywwQ0FBdUM7QUFDdkMsd0RBQXFEO0FBQ3JELG9EQU0wQjtBQUMxQiw2Q0FBaUU7QUFDakUsd0NBQW9EO0FBQ3BELGdEQUEyRztBQUMzRyx1Q0FBMkQ7QUFFM0QsOENBZXVCO0FBQ3ZCLHNDQUF1RDtBQUN2RCxvQ0FBMkM7QUFDM0MsMkNBQTBEO0FBQzFELGlEQUEyRTtBQUMzRSx1Q0FBZ0Q7QUFDaEQsMENBQStFO0FBcUUvRSxTQUFTLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxVQUE2QjtJQUN0RSxNQUFNLGdCQUFnQixHQUFHLElBQUEsK0JBQWtCLEVBQUMsTUFBTSxFQUFFLHdCQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO0lBQ3pGLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1FBQ3ZELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FDaEUsSUFBQSxnQ0FBZ0IsRUFBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQ3BELENBQUM7UUFDRixJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7WUFDZCxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7U0FDMUY7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsYUFB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IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5cclxuaW1wb3J0IHsgR2xvYmFsWHB1YiwgUGFydGlhbFNpZywgUHNidElucHV0LCBUYXBTY3JpcHRTaWcgfSBmcm9tICdiaXAxNzQvc3JjL2xpYi9pbnRlcmZhY2VzJztcclxuaW1wb3J0IHsgY2hlY2tGb3JJbnB1dCB9IGZyb20gJ2JpcDE3NC9zcmMvbGliL3V0aWxzJztcclxuaW1wb3J0IHsgQklQMzJJbnRlcmZhY2UgfSBmcm9tICdiaXAzMic7XHJcbmltcG9ydCAqIGFzIGJzNThjaGVjayBmcm9tICdiczU4Y2hlY2snO1xyXG5pbXBvcnQgeyBVdHhvUHNidCB9IGZyb20gJy4uL1V0eG9Qc2J0JztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uIH0gZnJvbSAnLi4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHtcclxuICBjcmVhdGVPdXRwdXRTY3JpcHQyb2YzLFxyXG4gIGdldExlYWZIYXNoLFxyXG4gIFNjcmlwdFR5cGUyT2YzLFxyXG4gIHNjcmlwdFR5cGVGb3JDaGFpbixcclxuICB0b1hPbmx5UHVibGljS2V5LFxyXG59IGZyb20gJy4uL291dHB1dFNjcmlwdHMnO1xyXG5pbXBvcnQgeyBEZXJpdmVkV2FsbGV0S2V5cywgUm9vdFdhbGxldEtleXMgfSBmcm9tICcuL1dhbGxldEtleXMnO1xyXG5pbXBvcnQgeyB0b1ByZXZPdXRwdXRXaXRoUHJldlR4IH0gZnJvbSAnLi4vVW5zcGVudCc7XHJcbmltcG9ydCB7IGNyZWF0ZVBzYnRGcm9tSGV4LCBjcmVhdGVQc2J0RnJvbVRyYW5zYWN0aW9uLCBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIgfSBmcm9tICcuLi90cmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IGlzV2FsbGV0VW5zcGVudCwgV2FsbGV0VW5zcGVudCB9IGZyb20gJy4vVW5zcGVudCc7XHJcblxyXG5pbXBvcnQge1xyXG4gIGdldExlYWZWZXJzaW9uLFxyXG4gIGNhbGN1bGF0ZVNjcmlwdFBhdGhMZXZlbCxcclxuICBpc1ZhbGlkQ29udHJvbEJvY2ssXHJcbiAgUGFyc2VkUHViU2NyaXB0UDJtcyxcclxuICBQYXJzZWRQdWJTY3JpcHRUYXByb290U2NyaXB0UGF0aCxcclxuICBwYXJzZVB1YlNjcmlwdDJPZjMsXHJcbiAgUGFyc2VkUHViU2NyaXB0VGFwcm9vdCxcclxuICBQYXJzZWRQdWJTY3JpcHRUYXByb290S2V5UGF0aCxcclxuICBwYXJzZVB1YlNjcmlwdCxcclxuICBQYXJzZWRQdWJTY3JpcHRQMnNoUDJwayxcclxuICBQYXJzZWRTY3JpcHRUeXBlLFxyXG4gIGlzUGxhY2Vob2xkZXJTaWduYXR1cmUsXHJcbiAgcGFyc2VTaWduYXR1cmVTY3JpcHQsXHJcbiAgUGFyc2VkU2NyaXB0VHlwZTJPZjMsXHJcbn0gZnJvbSAnLi4vcGFyc2VJbnB1dCc7XHJcbmltcG9ydCB7IHBhcnNlUHNidE11c2lnMlBhcnRpYWxTaWdzIH0gZnJvbSAnLi4vTXVzaWcyJztcclxuaW1wb3J0IHsgaXNUdXBsZSwgVHJpcGxlIH0gZnJvbSAnLi4vdHlwZXMnO1xyXG5pbXBvcnQgeyBjcmVhdGVUYXByb290T3V0cHV0U2NyaXB0IH0gZnJvbSAnLi4vLi4vdGFwcm9vdCc7XHJcbmltcG9ydCB7IG9wY29kZXMgYXMgb3BzLCBzY3JpcHQgYXMgYnNjcmlwdCwgVHhJbnB1dCB9IGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgeyBvcGNvZGVzLCBwYXltZW50cyB9IGZyb20gJy4uLy4uL2luZGV4JztcclxuaW1wb3J0IHsgZ2V0UHNidElucHV0U2lnbmF0dXJlQ291bnQsIGlzUHNidElucHV0RmluYWxpemVkIH0gZnJvbSAnLi4vUHNidFV0aWwnO1xyXG5cclxuLy8gb25seSB1c2VkIGZvciBidWlsZGluZyBgU2lnbmF0dXJlQ29udGFpbmVyYFxyXG50eXBlIEJhc2VTaWduYXR1cmVDb250YWluZXI8VD4gPSB7XHJcbiAgc2lnbmF0dXJlczogVDtcclxufTtcclxuXHJcbnR5cGUgVW5zaWduZWRTaWduYXR1cmVDb250YWluZXIgPSBCYXNlU2lnbmF0dXJlQ29udGFpbmVyPHVuZGVmaW5lZD47XHJcbnR5cGUgSGFsZlNpZ25lZFNpZ25hdHVyZUNvbnRhaW5lciA9IEJhc2VTaWduYXR1cmVDb250YWluZXI8W0J1ZmZlcl0+O1xyXG50eXBlIEZ1bGxTaWduZWRTaWduYXR1cmVDb250YWluZXIgPSBCYXNlU2lnbmF0dXJlQ29udGFpbmVyPFtCdWZmZXIsIEJ1ZmZlcl0+O1xyXG5cclxudHlwZSBTaWduYXR1cmVDb250YWluZXIgPSBVbnNpZ25lZFNpZ25hdHVyZUNvbnRhaW5lciB8IEhhbGZTaWduZWRTaWduYXR1cmVDb250YWluZXIgfCBGdWxsU2lnbmVkU2lnbmF0dXJlQ29udGFpbmVyO1xyXG5cclxuLyoqXHJcbiAqIENvbnRlbnRzIG9mIGEgcHJlLWZpbmFsaXplZCBQU0JUIElucHV0IGZvciBwMnRyTXVzaWcyIGtleSBwYXRoIGluIHRoZSBub24tZmluYWxpemVkIHN0YXRlLlxyXG4gKiBUIGlzIFtCdWZmZXJdIGZvciBmaXJzdCBzaWduYXR1cmUsIFtCdWZmZXIsIEJ1ZmZlcl0gZm9yIGJvdGggc2lnbmF0dXJlcyBhbmQgYHVuZGVmaW5lZGAgZm9yIG5vIHNpZ25hdHVyZXMuXHJcbiAqL1xyXG50eXBlIEJhc2VUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lcjxUPiA9IHtcclxuICBzaWduYXR1cmVzOiBUO1xyXG4gIC8qKiBPbmx5IGNvbnRhaW5zIHBhcnRpY2lwYW50cyB0aGF0IGhhdmUgYWRkZWQgYSBzaWduYXR1cmUgKi9cclxuICBwYXJ0aWNpcGFudFB1YmxpY0tleXM6IFQ7XHJcbn07XHJcblxyXG50eXBlIFVuc2lnbmVkVGFwcm9vdEtleVBhdGhTaWduYXR1cmVDb250YWluZXIgPSBCYXNlVGFwcm9vdEtleVBhdGhTaWduYXR1cmVDb250YWluZXI8dW5kZWZpbmVkPjtcclxudHlwZSBIYWxmU2lnbmVkVGFwcm9vdEtleVBhdGhTaWduYXR1cmVDb250YWluZXIgPSBCYXNlVGFwcm9vdEtleVBhdGhTaWduYXR1cmVDb250YWluZXI8W0J1ZmZlcl0+O1xyXG50eXBlIEZ1bGxTaWduZWRUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lciA9IEJhc2VUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lcjxbQnVmZmVyLCBCdWZmZXJdPjtcclxuXHJcbnR5cGUgVGFwcm9vdEtleVBhdGhTaWduYXR1cmVDb250YWluZXIgPVxyXG4gIHwgVW5zaWduZWRUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lclxyXG4gIHwgSGFsZlNpZ25lZFRhcHJvb3RLZXlQYXRoU2lnbmF0dXJlQ29udGFpbmVyXHJcbiAgfCBGdWxsU2lnbmVkVGFwcm9vdEtleVBhdGhTaWduYXR1cmVDb250YWluZXI7XHJcblxyXG4vKipcclxuICogVG8gaG9sZCBwYXJzZWQgcHNidCBkYXRhIGZvciBwMm1zIGJhc2VkIHNjcmlwdCB0eXBlcyAtIHAyc2gsIHAyd3NoLCBhbmQgcDJzaFAyd3NoXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBQYXJzZWRQc2J0UDJtcyA9IFBhcnNlZFB1YlNjcmlwdFAybXMgJiBTaWduYXR1cmVDb250YWluZXI7XHJcblxyXG4vKipcclxuICogVG8gaG9sZCBwYXJzZWQgcHNidCBkYXRhIGZvciBUYXByb290S2V5UGF0aFNwZW5kIHNjcmlwdCB0eXBlLlxyXG4gKi9cclxuZXhwb3J0IHR5cGUgUGFyc2VkUHNidFRhcHJvb3RLZXlQYXRoID0gUGFyc2VkUHViU2NyaXB0VGFwcm9vdEtleVBhdGggJiBUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lcjtcclxuXHJcbi8qKlxyXG4gKiBUbyBob2xkIHBhcnNlZCBwc2J0IGRhdGEgZm9yIFRhcHJvb3RTY3JpcHRQYXRoU3BlbmQgc2NyaXB0IHBhdGggc2NyaXB0IHR5cGUuXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBQYXJzZWRQc2J0VGFwcm9vdFNjcmlwdFBhdGggPSBQYXJzZWRQdWJTY3JpcHRUYXByb290U2NyaXB0UGF0aCAmXHJcbiAgU2lnbmF0dXJlQ29udGFpbmVyICYge1xyXG4gICAgY29udHJvbEJsb2NrOiBCdWZmZXI7XHJcbiAgICBsZWFmVmVyc2lvbjogbnVtYmVyO1xyXG4gICAgLyoqIEluZGljYXRlcyB0aGUgbGV2ZWwgaW5zaWRlIHRoZSB0YXB0cmVlLiAqL1xyXG4gICAgc2NyaXB0UGF0aExldmVsOiBudW1iZXI7XHJcbiAgfTtcclxuXHJcbmV4cG9ydCB0eXBlIFBhcnNlZFBzYnRUYXByb290ID0gUGFyc2VkUHNidFRhcHJvb3RLZXlQYXRoIHwgUGFyc2VkUHNidFRhcHJvb3RTY3JpcHRQYXRoO1xyXG5cclxudHlwZSBQMnNoUDJwa1NpZ25hdHVyZUNvbnRhaW5lciA9IFVuc2lnbmVkU2lnbmF0dXJlQ29udGFpbmVyIHwgSGFsZlNpZ25lZFNpZ25hdHVyZUNvbnRhaW5lcjtcclxuXHJcbmV4cG9ydCB0eXBlIFBhcnNlZFBzYnRQMnNoUDJwayA9IFBhcnNlZFB1YlNjcmlwdFAyc2hQMnBrICYgUDJzaFAycGtTaWduYXR1cmVDb250YWluZXI7XHJcblxyXG5pbnRlcmZhY2UgV2FsbGV0U2lnbmVyIHtcclxuICB3YWxsZXRLZXk6IEJJUDMySW50ZXJmYWNlO1xyXG4gIHJvb3RLZXk6IEJJUDMySW50ZXJmYWNlO1xyXG59XHJcblxyXG4vKipcclxuICogcHNidCBpbnB1dCBpbmRleCBhbmQgaXRzIHVzZXIsIGJhY2t1cCwgYml0Z28gc2lnbmF0dXJlcyBzdGF0dXNcclxuICovXHJcbmV4cG9ydCB0eXBlIFNpZ25hdHVyZVZhbGlkYXRpb24gPSBbaW5kZXg6IG51bWJlciwgc2lnVHJpcGxlOiBUcmlwbGU8Ym9vbGVhbj5dO1xyXG5cclxuZnVuY3Rpb24gZ2V0VGFwcm9vdFNpZ25lcnMoc2NyaXB0OiBCdWZmZXIsIHdhbGxldEtleXM6IERlcml2ZWRXYWxsZXRLZXlzKTogW1dhbGxldFNpZ25lciwgV2FsbGV0U2lnbmVyXSB7XHJcbiAgY29uc3QgcGFyc2VkUHVibGljS2V5cyA9IHBhcnNlUHViU2NyaXB0Mk9mMyhzY3JpcHQsICd0YXByb290U2NyaXB0UGF0aFNwZW5kJykucHVibGljS2V5cztcclxuICBjb25zdCB3YWxsZXRTaWduZXJzID0gcGFyc2VkUHVibGljS2V5cy5tYXAoKHB1YmxpY0tleSkgPT4ge1xyXG4gICAgY29uc3QgaW5kZXggPSB3YWxsZXRLZXlzLnB1YmxpY0tleXMuZmluZEluZGV4KCh3YWxsZXRQdWJsaWNLZXkpID0+XHJcbiAgICAgIHRvWE9ubHlQdWJsaWNLZXkod2FsbGV0UHVibGljS2V5KS5lcXVhbHMocHVibGljS2V5KVxyXG4gICAgKTtcclxuICAgIGlmIChpbmRleCA+PSAwKSB7XHJcbiAgICAgIHJldHVybiB7IHdhbGxldEtleTogd2FsbGV0S2V5cy50cmlwbGVbaW5kZXhdLCByb290S2V5OiB3YWxsZXRLZXlzLnBhcmVudC50cmlwbGVbaW5kZXhdIH07XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RhcHJvb3QgcHVibGljIGtleSBpcyBub3QgYSB3YWxsZXQgcHVibGljIGtleScpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBbd2FsbGV0U2lnbmVyc1swXSwgd2FsbGV0U2lnbmVyc1sxXV07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVBzYnRJbnB1dChcclxuICBwc2J0OiBVdHhvUHNidCxcclxuICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgdW5zcGVudDogV2FsbGV0VW5zcGVudDxiaWdpbnQ+LFxyXG4gIHJvb3RXYWxsZXRLZXlzOiBSb290V2FsbGV0S2V5c1xyXG4pOiB2b2lkIHtcclxuICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQocHNidC5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgY29uc3Qgc2lnbmF0dXJlQ291bnQgPSBnZXRQc2J0SW5wdXRTaWduYXR1cmVDb3VudChpbnB1dCk7XHJcbiAgY29uc3Qgc2NyaXB0VHlwZSA9IHNjcmlwdFR5cGVGb3JDaGFpbih1bnNwZW50LmNoYWluKTtcclxuICBpZiAoc2lnbmF0dXJlQ291bnQgPT09IDAgJiYgc2NyaXB0VHlwZSA9PT0gJ3AydHInKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHdhbGxldEtleXMgPSByb290V2FsbGV0S2V5cy5kZXJpdmVGb3JDaGFpbkFuZEluZGV4KHVuc3BlbnQuY2hhaW4sIHVuc3BlbnQuaW5kZXgpO1xyXG5cclxuICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3AydHInKSB7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQudGFwTGVhZlNjcmlwdCkgfHwgaW5wdXQudGFwTGVhZlNjcmlwdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFBTQlQgc3RhdGUuIE1pc3NpbmcgcmVxdWlyZWQgZmllbGRzLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbnB1dC50YXBMZWFmU2NyaXB0Lmxlbmd0aCA+IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCaXRnbyBvbmx5IHN1cHBvcnRzIGEgc2luZ2xlIHRhcCBsZWFmIHNjcmlwdCBwZXIgaW5wdXQnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBbc2lnbmVyLCBjb3NpZ25lcl0gPSBnZXRUYXByb290U2lnbmVycyhpbnB1dC50YXBMZWFmU2NyaXB0WzBdLnNjcmlwdCwgd2FsbGV0S2V5cyk7XHJcblxyXG4gICAgY29uc3QgbGVhZkhhc2ggPSBnZXRMZWFmSGFzaCh7XHJcbiAgICAgIHB1YmxpY0tleXM6IHdhbGxldEtleXMucHVibGljS2V5cyxcclxuICAgICAgc2lnbmVyOiBzaWduZXIud2FsbGV0S2V5LnB1YmxpY0tleSxcclxuICAgICAgY29zaWduZXI6IGNvc2lnbmVyLndhbGxldEtleS5wdWJsaWNLZXksXHJcbiAgICB9KTtcclxuXHJcbiAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHtcclxuICAgICAgdGFwQmlwMzJEZXJpdmF0aW9uOiBbc2lnbmVyLCBjb3NpZ25lcl0ubWFwKCh3YWxsZXRTaWduZXIpID0+ICh7XHJcbiAgICAgICAgbGVhZkhhc2hlczogW2xlYWZIYXNoXSxcclxuICAgICAgICBwdWJrZXk6IHRvWE9ubHlQdWJsaWNLZXkod2FsbGV0U2lnbmVyLndhbGxldEtleS5wdWJsaWNLZXkpLFxyXG4gICAgICAgIHBhdGg6IHJvb3RXYWxsZXRLZXlzLmdldERlcml2YXRpb25QYXRoKHdhbGxldFNpZ25lci5yb290S2V5LCB1bnNwZW50LmNoYWluLCB1bnNwZW50LmluZGV4KSxcclxuICAgICAgICBtYXN0ZXJGaW5nZXJwcmludDogd2FsbGV0U2lnbmVyLnJvb3RLZXkuZmluZ2VycHJpbnQsXHJcbiAgICAgIH0pKSxcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoc2lnbmF0dXJlQ291bnQgPT09IDApIHtcclxuICAgICAgY29uc3QgeyB3aXRuZXNzU2NyaXB0LCByZWRlZW1TY3JpcHQgfSA9IGNyZWF0ZU91dHB1dFNjcmlwdDJvZjMod2FsbGV0S2V5cy5wdWJsaWNLZXlzLCBzY3JpcHRUeXBlKTtcclxuICAgICAgaWYgKHdpdG5lc3NTY3JpcHQgJiYgcHNidC5kYXRhLmlucHV0c1tpbnB1dEluZGV4XS53aXRuZXNzU2NyaXB0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHsgd2l0bmVzc1NjcmlwdCB9KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAocmVkZWVtU2NyaXB0ICYmIHBzYnQuZGF0YS5pbnB1dHNbaW5wdXRJbmRleF0ucmVkZWVtU2NyaXB0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBwc2J0LnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHsgcmVkZWVtU2NyaXB0IH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHNidC51cGRhdGVJbnB1dChpbnB1dEluZGV4LCB7XHJcbiAgICAgIGJpcDMyRGVyaXZhdGlvbjogWzAsIDEsIDJdLm1hcCgoaWR4KSA9PiAoe1xyXG4gICAgICAgIHB1YmtleTogd2FsbGV0S2V5cy50cmlwbGVbaWR4XS5wdWJsaWNLZXksXHJcbiAgICAgICAgcGF0aDogd2FsbGV0S2V5cy5wYXRoc1tpZHhdLFxyXG4gICAgICAgIG1hc3RlckZpbmdlcnByaW50OiByb290V2FsbGV0S2V5cy50cmlwbGVbaWR4XS5maW5nZXJwcmludCxcclxuICAgICAgfSkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybiBQU0JUIGZpbGxlZCB3aXRoIG1ldGF0ZGF0YSBhcyBwZXIgaW5wdXQgcGFyYW1zIHR4LCB1bnNwZW50cyBhbmQgcm9vdFdhbGxldEtleXMuXHJcbiAqIFVuc2lnbmVkIFBTQlQgZm9yIHRhcHJvb3QgaW5wdXQgd2l0aCB3aXRuZXNzVXR4b1xyXG4gKiBVbnNpZ25lZCBQU0JUIGZvciBvdGhlciBpbnB1dCB3aXRoIHdpdG5lc3NVdHhvL25vbldpdG5lc3NVdHhvLCByZWRlZW1TY3JpcHQvd2l0bmVzc1NjcmlwdCwgYmlwMzJEZXJpdmF0aW9uXHJcbiAqIFNpZ25lZCBQU0JUIGZvciB0YXByb290IGlucHV0IHdpdGggd2l0bmVzc1V0eG8sIHRhcExlYWZTY3JpcHQsIHRhcEJpcDMyRGVyaXZhdGlvbiwgdGFwU2NyaXB0U2lnXHJcbiAqIFNpZ25lZCBQU0JUIGZvciBvdGhlciBpbnB1dCB3aXRoIHdpdG5lc3NVdHhvL25vbldpdG5lc3NVdHhvLCByZWRlZW1TY3JpcHQvd2l0bmVzc1NjcmlwdCwgYmlwMzJEZXJpdmF0aW9uLCBwYXJ0aWFsU2lnXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9XYWxsZXRQc2J0KFxyXG4gIHR4OiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PixcclxuICB1bnNwZW50czogV2FsbGV0VW5zcGVudDxiaWdpbnQ+W10sXHJcbiAgcm9vdFdhbGxldEtleXM6IFJvb3RXYWxsZXRLZXlzXHJcbik6IFV0eG9Qc2J0IHtcclxuICBjb25zdCBwcmV2T3V0cHV0cyA9IHVuc3BlbnRzLm1hcCgodSkgPT4ge1xyXG4gICAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKHNjcmlwdFR5cGVGb3JDaGFpbih1LmNoYWluKSwgJ3AydHJNdXNpZzInKTtcclxuICAgIHJldHVybiB0b1ByZXZPdXRwdXRXaXRoUHJldlR4KHUsIHR4Lm5ldHdvcmspO1xyXG4gIH0pO1xyXG4gIGNvbnN0IHBzYnQgPSBjcmVhdGVQc2J0RnJvbVRyYW5zYWN0aW9uKHR4LCBwcmV2T3V0cHV0cyk7XHJcbiAgdW5zcGVudHMuZm9yRWFjaCgodSwgaSkgPT4ge1xyXG4gICAgaWYgKGlzV2FsbGV0VW5zcGVudCh1KSAmJiB1LmluZGV4ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdXBkYXRlUHNidElucHV0KHBzYnQsIGksIHUsIHJvb3RXYWxsZXRLZXlzKTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcHNidDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBwc2J0XHJcbiAqIEBwYXJhbSBpbnB1dEluZGV4XHJcbiAqIEBwYXJhbSBzaWduZXJcclxuICogQHBhcmFtIHVuc3BlbnRcclxuICogQHJldHVybiBzaWduZWQgUFNCVCB3aXRoIHNpZ25lcidzIGtleSBmb3IgdW5zcGVudFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25XYWxsZXRQc2J0KFxyXG4gIHBzYnQ6IFV0eG9Qc2J0LFxyXG4gIGlucHV0SW5kZXg6IG51bWJlcixcclxuICBzaWduZXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gIHVuc3BlbnQ6IFdhbGxldFVuc3BlbnQ8YmlnaW50PlxyXG4pOiB2b2lkIHtcclxuICBjb25zdCBzY3JpcHRUeXBlID0gc2NyaXB0VHlwZUZvckNoYWluKHVuc3BlbnQuY2hhaW4pO1xyXG4gIGlmIChzY3JpcHRUeXBlID09PSAncDJ0cicgfHwgc2NyaXB0VHlwZSA9PT0gJ3AydHJNdXNpZzInKSB7XHJcbiAgICBwc2J0LnNpZ25UYXByb290SW5wdXRIRChpbnB1dEluZGV4LCBzaWduZXIpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBwc2J0LnNpZ25JbnB1dEhEKGlucHV0SW5kZXgsIHNpZ25lcik7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybnMgc2NyaXB0IHR5cGUgb2YgdGhlIGlucHV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHNidElucHV0U2NyaXB0VHlwZShpbnB1dDogUHNidElucHV0KTogUGFyc2VkU2NyaXB0VHlwZSB7XHJcbiAgY29uc3QgaXNQMnBrID0gKHNjcmlwdDogQnVmZmVyKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjaHVua3MgPSBic2NyaXB0LmRlY29tcGlsZShzY3JpcHQpO1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIGNodW5rcz8ubGVuZ3RoID09PSAyICYmXHJcbiAgICAgICAgQnVmZmVyLmlzQnVmZmVyKGNodW5rc1swXSkgJiZcclxuICAgICAgICBic2NyaXB0LmlzQ2Fub25pY2FsUHViS2V5KGNodW5rc1swXSkgJiZcclxuICAgICAgICBjaHVua3NbMV0gPT09IG9wY29kZXMuT1BfQ0hFQ0tTSUdcclxuICAgICAgKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgbGV0IHNjcmlwdFR5cGU6IFBhcnNlZFNjcmlwdFR5cGUgfCB1bmRlZmluZWQ7XHJcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihpbnB1dC5yZWRlZW1TY3JpcHQpICYmIEJ1ZmZlci5pc0J1ZmZlcihpbnB1dC53aXRuZXNzU2NyaXB0KSkge1xyXG4gICAgc2NyaXB0VHlwZSA9ICdwMnNoUDJ3c2gnO1xyXG4gIH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGlucHV0LnJlZGVlbVNjcmlwdCkpIHtcclxuICAgIHNjcmlwdFR5cGUgPSBpc1AycGsoaW5wdXQucmVkZWVtU2NyaXB0KSA/ICdwMnNoUDJwaycgOiAncDJzaCc7XHJcbiAgfSBlbHNlIGlmIChCdWZmZXIuaXNCdWZmZXIoaW5wdXQud2l0bmVzc1NjcmlwdCkpIHtcclxuICAgIHNjcmlwdFR5cGUgPSAncDJ3c2gnO1xyXG4gIH1cclxuICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dC50YXBMZWFmU2NyaXB0KSAmJiBpbnB1dC50YXBMZWFmU2NyaXB0Lmxlbmd0aCA+IDApIHtcclxuICAgIGlmIChzY3JpcHRUeXBlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRm91bmQgYm90aCAke3NjcmlwdFR5cGV9IGFuZCB0YXByb290U2NyaXB0UGF0aCBQU0JUIG1ldGFkYXRhLmApO1xyXG4gICAgfVxyXG4gICAgaWYgKGlucHV0LnRhcExlYWZTY3JpcHQubGVuZ3RoID4gMSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JpdGdvIG9ubHkgc3VwcG9ydHMgYSBzaW5nbGUgdGFwIGxlYWYgc2NyaXB0IHBlciBpbnB1dC4nKTtcclxuICAgIH1cclxuICAgIHNjcmlwdFR5cGUgPSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCc7XHJcbiAgfVxyXG4gIGlmIChpbnB1dC50YXBJbnRlcm5hbEtleSkge1xyXG4gICAgaWYgKHNjcmlwdFR5cGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGb3VuZCBib3RoICR7c2NyaXB0VHlwZX0gYW5kIHRhcHJvb3RLZXlQYXRoIFBTQlQgbWV0YWRhdGEuYCk7XHJcbiAgICB9XHJcbiAgICBzY3JpcHRUeXBlID0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnO1xyXG4gIH1cclxuICBpZiAoc2NyaXB0VHlwZSkge1xyXG4gICAgcmV0dXJuIHNjcmlwdFR5cGU7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHBhcnNlIGlucHV0Jyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlVGFwcm9vdEtleVBhdGhTaWduYXR1cmVzKGlucHV0OiBQc2J0SW5wdXQpOiBUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lciB7XHJcbiAgY29uc3QgcGFydGlhbFNpZ3MgPSBwYXJzZVBzYnRNdXNpZzJQYXJ0aWFsU2lncyhpbnB1dCk7XHJcbiAgaWYgKCFwYXJ0aWFsU2lncykge1xyXG4gICAgcmV0dXJuIHsgc2lnbmF0dXJlczogdW5kZWZpbmVkLCBwYXJ0aWNpcGFudFB1YmxpY0tleXM6IHVuZGVmaW5lZCB9O1xyXG4gIH1cclxuICBjb25zdCBzaWduYXR1cmVzID0gcGFydGlhbFNpZ3MubWFwKChwU2lnKSA9PiBwU2lnLnBhcnRpYWxTaWcpO1xyXG4gIGNvbnN0IHBhcnRpY2lwYW50UHVibGljS2V5cyA9IHBhcnRpYWxTaWdzLm1hcCgocFNpZykgPT4gcFNpZy5wYXJ0aWNpcGFudFB1YktleSk7XHJcbiAgcmV0dXJuIGlzVHVwbGU8QnVmZmVyPihzaWduYXR1cmVzKSAmJiBpc1R1cGxlPEJ1ZmZlcj4ocGFydGljaXBhbnRQdWJsaWNLZXlzKVxyXG4gICAgPyB7IHNpZ25hdHVyZXMsIHBhcnRpY2lwYW50UHVibGljS2V5cyB9XHJcbiAgICA6IHsgc2lnbmF0dXJlczogW3NpZ25hdHVyZXNbMF1dLCBwYXJ0aWNpcGFudFB1YmxpY0tleXM6IFtwYXJ0aWNpcGFudFB1YmxpY0tleXNbMF1dIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlUGFydGlhbE9yVGFwU2NyaXB0U2lnbmF0dXJlcyhzaWc6IFBhcnRpYWxTaWdbXSB8IFRhcFNjcmlwdFNpZ1tdIHwgdW5kZWZpbmVkKTogU2lnbmF0dXJlQ29udGFpbmVyIHtcclxuICBpZiAoIXNpZz8ubGVuZ3RoKSB7XHJcbiAgICByZXR1cm4geyBzaWduYXR1cmVzOiB1bmRlZmluZWQgfTtcclxuICB9XHJcbiAgaWYgKHNpZy5sZW5ndGggPiAyKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwZWN0ZWQgc2lnbmF0dXJlIGNvdW50Jyk7XHJcbiAgfVxyXG4gIGNvbnN0IHNpZ25hdHVyZXMgPSBzaWcubWFwKCh0U2lnKSA9PiB0U2lnLnNpZ25hdHVyZSk7XHJcbiAgcmV0dXJuIGlzVHVwbGU8QnVmZmVyPihzaWduYXR1cmVzKSA/IHsgc2lnbmF0dXJlcyB9IDogeyBzaWduYXR1cmVzOiBbc2lnbmF0dXJlc1swXV0gfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VTaWduYXR1cmVzKFxyXG4gIGlucHV0OiBQc2J0SW5wdXQsXHJcbiAgc2NyaXB0VHlwZTogUGFyc2VkU2NyaXB0VHlwZVxyXG4pOiBTaWduYXR1cmVDb250YWluZXIgfCBUYXByb290S2V5UGF0aFNpZ25hdHVyZUNvbnRhaW5lciB7XHJcbiAgcmV0dXJuIHNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJ1xyXG4gICAgPyBwYXJzZVRhcHJvb3RLZXlQYXRoU2lnbmF0dXJlcyhpbnB1dClcclxuICAgIDogc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnXHJcbiAgICA/IHBhcnNlUGFydGlhbE9yVGFwU2NyaXB0U2lnbmF0dXJlcyhpbnB1dC50YXBTY3JpcHRTaWcpXHJcbiAgICA6IHBhcnNlUGFydGlhbE9yVGFwU2NyaXB0U2lnbmF0dXJlcyhpbnB1dC5wYXJ0aWFsU2lnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VTY3JpcHQoXHJcbiAgaW5wdXQ6IFBzYnRJbnB1dCxcclxuICBzY3JpcHRUeXBlOiBQYXJzZWRTY3JpcHRUeXBlXHJcbik6IFBhcnNlZFB1YlNjcmlwdFAybXMgfCBQYXJzZWRQdWJTY3JpcHRUYXByb290IHwgUGFyc2VkUHViU2NyaXB0UDJzaFAycGsge1xyXG4gIGxldCBwdWJTY3JpcHQ6IEJ1ZmZlciB8IHVuZGVmaW5lZDtcclxuICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3Ayc2gnIHx8IHNjcmlwdFR5cGUgPT09ICdwMnNoUDJwaycpIHtcclxuICAgIHB1YlNjcmlwdCA9IGlucHV0LnJlZGVlbVNjcmlwdDtcclxuICB9IGVsc2UgaWYgKHNjcmlwdFR5cGUgPT09ICdwMndzaCcgfHwgc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMndzaCcpIHtcclxuICAgIHB1YlNjcmlwdCA9IGlucHV0LndpdG5lc3NTY3JpcHQ7XHJcbiAgfSBlbHNlIGlmIChzY3JpcHRUeXBlID09PSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcpIHtcclxuICAgIHB1YlNjcmlwdCA9IGlucHV0LnRhcExlYWZTY3JpcHQgPyBpbnB1dC50YXBMZWFmU2NyaXB0WzBdLnNjcmlwdCA6IHVuZGVmaW5lZDtcclxuICB9IGVsc2UgaWYgKHNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJykge1xyXG4gICAgaWYgKGlucHV0LndpdG5lc3NVdHhvPy5zY3JpcHQpIHtcclxuICAgICAgcHViU2NyaXB0ID0gaW5wdXQud2l0bmVzc1V0eG8uc2NyaXB0O1xyXG4gICAgfSBlbHNlIGlmIChpbnB1dC50YXBJbnRlcm5hbEtleSAmJiBpbnB1dC50YXBNZXJrbGVSb290KSB7XHJcbiAgICAgIHB1YlNjcmlwdCA9IGNyZWF0ZVRhcHJvb3RPdXRwdXRTY3JpcHQoeyBpbnRlcm5hbFB1YktleTogaW5wdXQudGFwSW50ZXJuYWxLZXksIHRhcHRyZWVSb290OiBpbnB1dC50YXBNZXJrbGVSb290IH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZiAoIXB1YlNjcmlwdCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFBTQlQgc3RhdGUgZm9yICR7c2NyaXB0VHlwZX0uIE1pc3NpbmcgcmVxdWlyZWQgZmllbGRzLmApO1xyXG4gIH1cclxuICByZXR1cm4gcGFyc2VQdWJTY3JpcHQocHViU2NyaXB0LCBzY3JpcHRUeXBlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm4gcHNidCBtZXRhZGF0YSBhcmUgcGFyc2VkIGFzIHBlciBiZWxvdyBjb25kaXRpb25zLlxyXG4gKiByZWRlZW1TY3JpcHQvd2l0bmVzc1NjcmlwdC90YXBMZWFmU2NyaXB0IG1hdGNoZXMgQml0R28uXHJcbiAqIHNpZ25hdHVyZSBhbmQgcHVibGljIGtleSBjb3VudCBtYXRjaGVzIEJpdEdvLlxyXG4gKiBQMlNILVAyUEsgPT4gc2NyaXB0VHlwZSwgcmVkZWVtU2NyaXB0LCBwdWJsaWMga2V5LCBzaWduYXR1cmUuXHJcbiAqIFAyU0ggPT4gc2NyaXB0VHlwZSwgcmVkZWVtU2NyaXB0LCBwdWJsaWMga2V5cywgc2lnbmF0dXJlcy5cclxuICogUFcyU0ggPT4gc2NyaXB0VHlwZSwgd2l0bmVzc1NjcmlwdCwgcHVibGljIGtleXMsIHNpZ25hdHVyZXMuXHJcbiAqIFAyU0gtUFcyU0ggPT4gc2NyaXB0VHlwZSwgcmVkZWVtU2NyaXB0LCB3aXRuZXNzU2NyaXB0LCBwdWJsaWMga2V5cywgc2lnbmF0dXJlcy5cclxuICogUDJUUiBhbmQgUDJUUiBNVVNJRzIgc2NyaXB0IHBhdGggPT4gc2NyaXB0VHlwZSAodGFwcm9vdFNjcmlwdFBhdGhTcGVuZCksIHB1YlNjcmlwdCAobGVhZiBzY3JpcHQpLCBjb250cm9sQmxvY2ssXHJcbiAqIHNjcmlwdFBhdGhMZXZlbCwgbGVhZlZlcnNpb24sIHB1YmxpYyBrZXlzLCBzaWduYXR1cmVzLlxyXG4gKiBQMlRSIE1VU0lHMiBrZXAgcGF0aCA9PiBzY3JpcHRUeXBlICh0YXByb290S2V5UGF0aFNwZW5kKSwgcHViU2NyaXB0IChzY3JpcHRQdWJLZXkpLCBwYXJ0aWNpcGFudCBwdWIga2V5cyAoc2lnbmVyKSxcclxuICogcHVibGljIGtleSAodGFwT3V0cHV0a2V5KSwgc2lnbmF0dXJlcyAocGFydGlhbCBzaWduZXIgc2lncykuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQc2J0SW5wdXQoaW5wdXQ6IFBzYnRJbnB1dCk6IFBhcnNlZFBzYnRQMm1zIHwgUGFyc2VkUHNidFRhcHJvb3QgfCBQYXJzZWRQc2J0UDJzaFAycGsge1xyXG4gIGlmIChpc1BzYnRJbnB1dEZpbmFsaXplZChpbnB1dCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRmluYWxpemVkIFBTQlQgcGFyc2luZyBpcyBub3Qgc3VwcG9ydGVkJyk7XHJcbiAgfVxyXG4gIGNvbnN0IHNjcmlwdFR5cGUgPSBnZXRQc2J0SW5wdXRTY3JpcHRUeXBlKGlucHV0KTtcclxuICBjb25zdCBwYXJzZWRQdWJTY3JpcHQgPSBwYXJzZVNjcmlwdChpbnB1dCwgc2NyaXB0VHlwZSk7XHJcbiAgY29uc3Qgc2lnbmF0dXJlcyA9IHBhcnNlU2lnbmF0dXJlcyhpbnB1dCwgc2NyaXB0VHlwZSk7XHJcblxyXG4gIGlmIChwYXJzZWRQdWJTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnICYmICdwYXJ0aWNpcGFudFB1YmxpY0tleXMnIGluIHNpZ25hdHVyZXMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLnBhcnNlZFB1YlNjcmlwdCxcclxuICAgICAgLi4uc2lnbmF0dXJlcyxcclxuICAgIH07XHJcbiAgfVxyXG4gIGlmIChwYXJzZWRQdWJTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnKSB7XHJcbiAgICBpZiAoIWlucHV0LnRhcExlYWZTY3JpcHQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFBTQlQgc3RhdGUgZm9yIHRhcHJvb3RTY3JpcHRQYXRoU3BlbmQuIE1pc3NpbmcgcmVxdWlyZWQgZmllbGRzLicpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY29udHJvbEJsb2NrID0gaW5wdXQudGFwTGVhZlNjcmlwdFswXS5jb250cm9sQmxvY2s7XHJcbiAgICBpZiAoIWlzVmFsaWRDb250cm9sQm9jayhjb250cm9sQmxvY2spKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBQU0JUIHRhcHJvb3RTY3JpcHRQYXRoU3BlbmQgY29udHJvbEJsb2NrLicpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc2NyaXB0UGF0aExldmVsID0gY2FsY3VsYXRlU2NyaXB0UGF0aExldmVsKGNvbnRyb2xCbG9jayk7XHJcbiAgICBjb25zdCBsZWFmVmVyc2lvbiA9IGdldExlYWZWZXJzaW9uKGNvbnRyb2xCbG9jayk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5wYXJzZWRQdWJTY3JpcHQsXHJcbiAgICAgIC4uLnNpZ25hdHVyZXMsXHJcbiAgICAgIGNvbnRyb2xCbG9jayxcclxuICAgICAgc2NyaXB0UGF0aExldmVsLFxyXG4gICAgICBsZWFmVmVyc2lvbixcclxuICAgIH07XHJcbiAgfVxyXG4gIGlmIChcclxuICAgIHBhcnNlZFB1YlNjcmlwdC5zY3JpcHRUeXBlID09PSAncDJzaCcgfHxcclxuICAgIHBhcnNlZFB1YlNjcmlwdC5zY3JpcHRUeXBlID09PSAncDJ3c2gnIHx8XHJcbiAgICBwYXJzZWRQdWJTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMndzaCdcclxuICApIHtcclxuICAgIGlmIChwYXJzZWRQdWJTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMndzaCcpIHtcclxuICAgICAgcGFyc2VkUHViU2NyaXB0LnJlZGVlbVNjcmlwdCA9IGlucHV0LnJlZGVlbVNjcmlwdDtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLnBhcnNlZFB1YlNjcmlwdCxcclxuICAgICAgLi4uc2lnbmF0dXJlcyxcclxuICAgIH07XHJcbiAgfVxyXG4gIGlmIChwYXJzZWRQdWJTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMnBrJyAmJiAoIXNpZ25hdHVyZXMuc2lnbmF0dXJlcyB8fCAhaXNUdXBsZShzaWduYXR1cmVzLnNpZ25hdHVyZXMpKSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4ucGFyc2VkUHViU2NyaXB0LFxyXG4gICAgICBzaWduYXR1cmVzOiBzaWduYXR1cmVzLnNpZ25hdHVyZXMsXHJcbiAgICB9O1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcHViIHNjcmlwdCcpO1xyXG59XHJcblxyXG4vKipcclxuICogQ29udmVydHMgYSBwYXJzZWQgc2NyaXB0IHR5cGUgaW50byBhbiBhcnJheSBvZiBzY3JpcHQgdHlwZXMuXHJcbiAqIEBwYXJhbSBwYXJzZWRTY3JpcHRUeXBlIC0gVGhlIHBhcnNlZCBzY3JpcHQgdHlwZS5cclxuICogQHJldHVybnMgQW4gYXJyYXkgb2YgU2NyaXB0VHlwZTJPZjMgdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHBhcnNlZCBzY3JpcHQgdHlwZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0b1NjcmlwdFR5cGUyT2YzcyhwYXJzZWRTY3JpcHRUeXBlOiBQYXJzZWRTY3JpcHRUeXBlMk9mMyk6IFNjcmlwdFR5cGUyT2YzW10ge1xyXG4gIHJldHVybiBwYXJzZWRTY3JpcHRUeXBlID09PSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCdcclxuICAgID8gWydwMnRyTXVzaWcyJywgJ3AydHInXVxyXG4gICAgOiBwYXJzZWRTY3JpcHRUeXBlID09PSAndGFwcm9vdEtleVBhdGhTcGVuZCdcclxuICAgID8gWydwMnRyTXVzaWcyJ11cclxuICAgIDogW3BhcnNlZFNjcmlwdFR5cGVdO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybnMgc3RyaWN0bHkgcGFyc2UgdGhlIGlucHV0IGFuZCBnZXQgc2lnbmF0dXJlIGNvdW50LlxyXG4gKiB1bnNpZ25lZCgwKSwgaGFsZi1zaWduZWQoMSkgb3IgZnVsbHktc2lnbmVkKDIpXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyaWN0U2lnbmF0dXJlQ291bnQoaW5wdXQ6IFR4SW5wdXQgfCBQc2J0SW5wdXQpOiAwIHwgMSB8IDIge1xyXG4gIGNvbnN0IGNhbGN1bGF0ZVNpZ25hdHVyZUNvdW50ID0gKFxyXG4gICAgc2lnbmF0dXJlczogW0J1ZmZlciB8IDAsIEJ1ZmZlciB8IDAsIEJ1ZmZlciB8IDBdIHwgW0J1ZmZlciwgQnVmZmVyXSB8IFtCdWZmZXJdIHwgdW5kZWZpbmVkXHJcbiAgKTogMCB8IDEgfCAyID0+IHtcclxuICAgIGNvbnN0IGNvdW50ID0gc2lnbmF0dXJlcyA/IHNpZ25hdHVyZXMuZmlsdGVyKChzKSA9PiAhaXNQbGFjZWhvbGRlclNpZ25hdHVyZShzKSkubGVuZ3RoIDogMDtcclxuICAgIGlmIChjb3VudCA9PT0gMCB8fCBjb3VudCA9PT0gMSB8fCBjb3VudCA9PT0gMikge1xyXG4gICAgICByZXR1cm4gY291bnQ7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc2lnbmF0dXJlIGNvdW50Jyk7XHJcbiAgfTtcclxuXHJcbiAgaWYgKCdoYXNoJyBpbiBpbnB1dCkge1xyXG4gICAgaWYgKGlucHV0LnNjcmlwdD8ubGVuZ3RoIHx8IGlucHV0LndpdG5lc3M/Lmxlbmd0aCkge1xyXG4gICAgICBjb25zdCBwYXJzZWRJbnB1dCA9IHBhcnNlU2lnbmF0dXJlU2NyaXB0KGlucHV0KTtcclxuICAgICAgcmV0dXJuIHBhcnNlZElucHV0LnNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJyA/IDIgOiBjYWxjdWxhdGVTaWduYXR1cmVDb3VudChwYXJzZWRJbnB1dC5zaWduYXR1cmVzKTtcclxuICAgIH1cclxuICAgIHJldHVybiAwO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gY2FsY3VsYXRlU2lnbmF0dXJlQ291bnQocGFyc2VQc2J0SW5wdXQoaW5wdXQpLnNpZ25hdHVyZXMpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm5zIHN0cmljdGx5IHBhcnNlIGlucHV0IGFuZCBnZXQgc2lnbmF0dXJlIGNvdW50IGZvciBhbGwgaW5wdXRzLlxyXG4gKiAwPXVuc2lnbmVkLCAxPWhhbGYtc2lnbmVkIG9yIDI9ZnVsbHktc2lnbmVkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyaWN0U2lnbmF0dXJlQ291bnRzKFxyXG4gIHR4OiBVdHhvUHNidCB8IFV0eG9UcmFuc2FjdGlvbjxudW1iZXIgfCBiaWdpbnQ+IHwgUHNidElucHV0W10gfCBUeElucHV0W11cclxuKTogKDAgfCAxIHwgMilbXSB7XHJcbiAgY29uc3QgaW5wdXRzID0gdHggaW5zdGFuY2VvZiBVdHhvUHNidCA/IHR4LmRhdGEuaW5wdXRzIDogdHggaW5zdGFuY2VvZiBVdHhvVHJhbnNhY3Rpb24gPyB0eC5pbnMgOiB0eDtcclxuICByZXR1cm4gaW5wdXRzLm1hcCgoaW5wdXQsIF8pID0+IGdldFN0cmljdFNpZ25hdHVyZUNvdW50KGlucHV0KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIHRydWUgaWZmIGlucHV0cyBhcnJheSBpcyBvZiBQc2J0SW5wdXRUeXBlIHR5cGVcclxuICogKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzUHNidElucHV0QXJyYXkoaW5wdXRzOiBQc2J0SW5wdXRbXSB8IFR4SW5wdXRbXSk6IGlucHV0cyBpcyBQc2J0SW5wdXRbXSB7XHJcbiAgcmV0dXJuICFpc1R4SW5wdXRBcnJheShpbnB1dHMpO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybiB0cnVlIGlmZiBpbnB1dHMgYXJyYXkgaXMgb2YgVHhJbnB1dCB0eXBlXHJcbiAqICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1R4SW5wdXRBcnJheShpbnB1dHM6IFBzYnRJbnB1dFtdIHwgVHhJbnB1dFtdKTogaW5wdXRzIGlzIFR4SW5wdXRbXSB7XHJcbiAgYXNzZXJ0KCEhaW5wdXRzLmxlbmd0aCwgJ2VtcHR5IGlucHV0cyBhcnJheScpO1xyXG4gIHJldHVybiAnaGFzaCcgaW4gaW5wdXRzWzBdO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybnMgdHJ1ZSBpZmYgZ2l2ZW4gcHNidC90cmFuc2FjdGlvbi90eC1pbnB1dC1hcnJheS9wc2J0LWlucHV0LWFycmF5IGNvbnRhaW5zIGF0IGxlYXN0IG9uZSB0YXByb290IGtleSBwYXRoIHNwZW5kIGlucHV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNUcmFuc2FjdGlvbldpdGhLZXlQYXRoU3BlbmRJbnB1dChcclxuICBkYXRhOiBVdHhvUHNidCB8IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQgfCBudW1iZXI+IHwgUHNidElucHV0W10gfCBUeElucHV0W11cclxuKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgaW5wdXRzID0gZGF0YSBpbnN0YW5jZW9mIFV0eG9Qc2J0ID8gZGF0YS5kYXRhLmlucHV0cyA6IGRhdGEgaW5zdGFuY2VvZiBVdHhvVHJhbnNhY3Rpb24gPyBkYXRhLmlucyA6IGRhdGE7XHJcbiAgaWYgKCFpbnB1dHMubGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIGlmIChpc1BzYnRJbnB1dEFycmF5KGlucHV0cykpIHtcclxuICAgIHJldHVybiBpbnB1dHMuc29tZSgoaW5wdXQsIF8pID0+IGdldFBzYnRJbnB1dFNjcmlwdFR5cGUoaW5wdXQpID09PSAndGFwcm9vdEtleVBhdGhTcGVuZCcpO1xyXG4gIH1cclxuICByZXR1cm4gaW5wdXRzLnNvbWUoKGlucHV0LCBfKSA9PiB7XHJcbiAgICAvLyBJZiB0aGUgaW5wdXQgaXMgbm90IHNpZ25lZCwgaXQgY2Fubm90IGJlIGEgdGFwcm9vdEtleVBhdGhTcGVuZCBpbnB1dCBiZWNhdXNlIHlvdSBjYW4gb25seVxyXG4gICAgLy8gZXh0cmFjdCBhIGZ1bGx5IHNpZ25lZCBwc2J0IGludG8gYSB0cmFuc2FjdGlvbiB3aXRoIHRhcHJvb3RLZXlQYXRoU3BlbmQgaW5wdXRzLlxyXG4gICAgaWYgKGdldFN0cmljdFNpZ25hdHVyZUNvdW50KGlucHV0KSA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGFyc2VTaWduYXR1cmVTY3JpcHQoaW5wdXQpLnNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJztcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgUm9vdFdhbGxldEtleXMgYXMgdGhlIGdsb2JhbFhwdWJzIG9uIHRoZSBwc2J0XHJcbiAqXHJcbiAqIFdlIGRvIGFsbCB0aGUgbWF0Y2hpbmcgb2YgdGhlICh0YXApYmlwMzJEZXJpdmF0aW9ucyBtYXN0ZXJGaW5nZXJwcmludCB0byB0aGUgZmluZ2VycHJpbnQgb2YgdGhlXHJcbiAqIGV4dGVuZGVkUHVia2V5LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZFhwdWJzVG9Qc2J0KHBzYnQ6IFV0eG9Qc2J0LCByb290V2FsbGV0S2V5czogUm9vdFdhbGxldEtleXMpOiB2b2lkIHtcclxuICBjb25zdCBzYWZlUm9vdFdhbGxldEtleXMgPSBuZXcgUm9vdFdhbGxldEtleXMoXHJcbiAgICByb290V2FsbGV0S2V5cy50cmlwbGUubWFwKChiaXAzMikgPT4gYmlwMzIubmV1dGVyZWQoKSkgYXMgVHJpcGxlPEJJUDMySW50ZXJmYWNlPixcclxuICAgIHJvb3RXYWxsZXRLZXlzLmRlcml2YXRpb25QcmVmaXhlc1xyXG4gICk7XHJcbiAgY29uc3QgeFB1YnMgPSBzYWZlUm9vdFdhbGxldEtleXMudHJpcGxlLm1hcChcclxuICAgIChiaXAzMik6IEdsb2JhbFhwdWIgPT4gKHtcclxuICAgICAgZXh0ZW5kZWRQdWJrZXk6IGJzNThjaGVjay5kZWNvZGUoYmlwMzIudG9CYXNlNTgoKSksXHJcbiAgICAgIG1hc3RlckZpbmdlcnByaW50OiBiaXAzMi5maW5nZXJwcmludCxcclxuICAgICAgLy8gVE9ETzogQkctNzM3OTcgLSBiaXAxNzQgY3VycmVudGx5IHJlcXVpcmVzIG0gcHJlZml4IGZvciB0aGlzIHRvIGJlIGEgdmFsaWQgZ2xvYmFsWHB1YlxyXG4gICAgICBwYXRoOiAnbScsXHJcbiAgICB9KVxyXG4gICk7XHJcbiAgcHNidC51cGRhdGVHbG9iYWwoeyBnbG9iYWxYcHViOiB4UHVicyB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIHZhbGlkYXRlcyBzaWduYXR1cmVzIGZvciBlYWNoIDIgb2YgMyBpbnB1dCBhZ2FpbnN0IHVzZXIsIGJhY2t1cCwgYml0Z28ga2V5cyBkZXJpdmVkIGZyb20gcm9vdFdhbGxldEtleXMuXHJcbiAqIEByZXR1cm5zIGFycmF5IG9mIGlucHV0IGluZGV4IGFuZCBpdHMgW2lzIHZhbGlkIHVzZXIgc2lnIGV4aXN0LCBpcyB2YWxpZCBiYWNrdXAgc2lnIGV4aXN0LCBpcyB2YWxpZCB1c2VyIGJpdGdvIGV4aXN0XVxyXG4gKiBGb3IgcDJzaFAycGsgaW5wdXQsIFtmYWxzZSwgZmFsc2UsIGZhbHNlXSBpcyByZXR1cm5lZCBzaW5jZSBpdCBpcyBub3QgYSAyIG9mIDMgc2lnIGlucHV0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNpZ25hdHVyZVZhbGlkYXRpb25BcnJheVBzYnQocHNidDogVXR4b1BzYnQsIHJvb3RXYWxsZXRLZXlzOiBSb290V2FsbGV0S2V5cyk6IFNpZ25hdHVyZVZhbGlkYXRpb25bXSB7XHJcbiAgcmV0dXJuIHBzYnQuZGF0YS5pbnB1dHMubWFwKChpbnB1dCwgaSkgPT4ge1xyXG4gICAgY29uc3Qgc2lnVmFsQXJyYXlGb3JJbnB1dDogVHJpcGxlPGJvb2xlYW4+ID1cclxuICAgICAgZ2V0UHNidElucHV0U2NyaXB0VHlwZShpbnB1dCkgPT09ICdwMnNoUDJwaydcclxuICAgICAgICA/IFtmYWxzZSwgZmFsc2UsIGZhbHNlXVxyXG4gICAgICAgIDogcHNidC5nZXRTaWduYXR1cmVWYWxpZGF0aW9uQXJyYXkoaSwgeyByb290Tm9kZXM6IHJvb3RXYWxsZXRLZXlzLnRyaXBsZSB9KTtcclxuICAgIHJldHVybiBbaSwgc2lnVmFsQXJyYXlGb3JJbnB1dF07XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFeHRyYWN0cyB0aGUgaGFsZiBzaWduZWQgdHJhbnNhY3Rpb24gZnJvbSB0aGUgcHNidCBmb3IgcDJtcyBiYXNlZCBzY3JpcHQgdHlwZXMgLSBwMnNoLCBwMndzaCwgYW5kIHAyc2hQMndzaC5cclxuICogVGhlIHB1cnBvc2UgaXMgdG8gcHJvdmlkZSBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHRvIGtleXRlcm5hbCAoS1JTKSB0aGF0IG9ubHkgc3VwcG9ydHMgbmV0d29yayB0cmFuc2FjdGlvbiBhbmQgcDJtcyBzY3JpcHQgdHlwZXMuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFAybXNPbmx5SGFsZlNpZ25lZFR4KHBzYnQ6IFV0eG9Qc2J0KTogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4ge1xyXG4gIGFzc2VydCghIShwc2J0LmRhdGEuaW5wdXRzLmxlbmd0aCAmJiBwc2J0LmRhdGEub3V0cHV0cy5sZW5ndGgpLCAnZW1wdHkgaW5wdXRzIG9yIG91dHB1dHMnKTtcclxuICBjb25zdCB0eCA9IHBzYnQuZ2V0VW5zaWduZWRUeCgpO1xyXG5cclxuICBmdW5jdGlvbiBpc1AybXNQYXJzZWRQc2J0SW5wdXQoXHJcbiAgICBwYXJzZWQ6IFBhcnNlZFBzYnRQMm1zIHwgUGFyc2VkUHNidFRhcHJvb3QgfCBQYXJzZWRQc2J0UDJzaFAycGtcclxuICApOiBwYXJzZWQgaXMgUGFyc2VkUHNidFAybXMge1xyXG4gICAgcmV0dXJuIFsncDJzaCcsICdwMnNoUDJ3c2gnLCAncDJ3c2gnXS5pbmNsdWRlcyhwYXJzZWQuc2NyaXB0VHlwZSk7XHJcbiAgfVxyXG5cclxuICBwc2J0LmRhdGEuaW5wdXRzLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XHJcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVBzYnRJbnB1dChpbnB1dCk7XHJcbiAgICBhc3NlcnQoaXNQMm1zUGFyc2VkUHNidElucHV0KHBhcnNlZCksIGB1bnN1cHBvcnRlZCBzY3JpcHQgdHlwZSAke3BhcnNlZC5zY3JpcHRUeXBlfWApO1xyXG4gICAgYXNzZXJ0KGlucHV0LnBhcnRpYWxTaWc/Lmxlbmd0aCA9PT0gMSwgYHVuZXhwZWN0ZWQgc2lnbmF0dXJlIGNvdW50ICR7aW5wdXQucGFydGlhbFNpZz8ubGVuZ3RofWApO1xyXG4gICAgY29uc3QgW3BhcnRpYWxTaWddID0gaW5wdXQucGFydGlhbFNpZztcclxuICAgIGFzc2VydChcclxuICAgICAgaW5wdXQuc2lnaGFzaFR5cGUgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5zaWdoYXNoVHlwZSA9PT0gYnNjcmlwdC5zaWduYXR1cmUuZGVjb2RlKHBhcnRpYWxTaWcuc2lnbmF0dXJlKS5oYXNoVHlwZSxcclxuICAgICAgJ3NpZ25hdHVyZSBzaWdoYXNoIGRvZXMgbm90IG1hdGNoIGlucHV0IHNpZ2hhc2ggdHlwZSdcclxuICAgICk7XHJcblxyXG4gICAgLy8gdHlwZSBjYXN0aW5nIGlzIHRvIGFkZHJlc3MgdGhlIGludmFsaWQgdHlwZSBjaGVja2luZyBpbiBwYXltZW50cy5wMm1zXHJcbiAgICBjb25zdCBzaWduYXR1cmVzID0gcGFyc2VkLnB1YmxpY0tleXMubWFwKChwaykgPT5cclxuICAgICAgcGFydGlhbFNpZy5wdWJrZXkuZXF1YWxzKHBrKSA/IHBhcnRpYWxTaWcuc2lnbmF0dXJlIDogKG9wcy5PUF8wIGFzIHVua25vd24gYXMgQnVmZmVyKVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBpc1AyU0ggPSAhIXBhcnNlZC5yZWRlZW1TY3JpcHQ7XHJcbiAgICBjb25zdCBpc1AyV1NIID0gISFwYXJzZWQud2l0bmVzc1NjcmlwdDtcclxuXHJcbiAgICBjb25zdCBwYXltZW50ID0gcGF5bWVudHMucDJtcyh7IG91dHB1dDogcGFyc2VkLnB1YlNjcmlwdCwgc2lnbmF0dXJlcyB9LCB7IHZhbGlkYXRlOiBmYWxzZSwgYWxsb3dJbmNvbXBsZXRlOiB0cnVlIH0pO1xyXG4gICAgY29uc3QgcDJ3c2ggPSBpc1AyV1NIID8gcGF5bWVudHMucDJ3c2goeyByZWRlZW06IHBheW1lbnQgfSkgOiB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBwMnNoID0gaXNQMlNIID8gcGF5bWVudHMucDJzaCh7IHJlZGVlbTogcDJ3c2ggfHwgcGF5bWVudCB9KSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICBpZiAocDJzaD8uaW5wdXQpIHtcclxuICAgICAgdHguc2V0SW5wdXRTY3JpcHQoaSwgcDJzaC5pbnB1dCk7XHJcbiAgICB9XHJcbiAgICBpZiAocDJ3c2g/LndpdG5lc3MpIHtcclxuICAgICAgdHguc2V0V2l0bmVzcyhpLCBwMndzaC53aXRuZXNzKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHR4O1xyXG59XHJcblxyXG4vKipcclxuICogQ2xvbmVzIHRoZSBwc2J0IHdpdGhvdXQgbm9uV2l0bmVzc1V0eG8gZm9yIG5vbi1zZWd3aXQgaW5wdXRzIGFuZCB3aXRuZXNzVXR4byBpcyBhZGRlZCBpbnN0ZWFkLlxyXG4gKiBJdCBpcyBub3QgQklQLTE3NCBjb21wbGlhbnQsIHNvIHVzZSBpdCBjYXJlZnVsbHkuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVQc2J0V2l0aG91dE5vbldpdG5lc3NVdHhvKHBzYnQ6IFV0eG9Qc2J0KTogVXR4b1BzYnQge1xyXG4gIGNvbnN0IG5ld1BzYnQgPSBjcmVhdGVQc2J0RnJvbUhleChwc2J0LnRvSGV4KCksIHBzYnQubmV0d29yayk7XHJcbiAgY29uc3QgdHhJbnB1dHMgPSBwc2J0LnR4SW5wdXRzO1xyXG5cclxuICBwc2J0LmRhdGEuaW5wdXRzLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XHJcbiAgICBpZiAoaW5wdXQubm9uV2l0bmVzc1V0eG8gJiYgIWlucHV0LndpdG5lc3NVdHhvKSB7XHJcbiAgICAgIGNvbnN0IHR4ID0gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tQnVmZmVyKGlucHV0Lm5vbldpdG5lc3NVdHhvLCBwc2J0Lm5ldHdvcmssIHsgYW1vdW50VHlwZTogJ2JpZ2ludCcgfSk7XHJcbiAgICAgIGlmICghdHhJbnB1dHNbaV0uaGFzaC5lcXVhbHModHguZ2V0SGFzaCgpKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm9uLXdpdG5lc3MgVVRYTyBoYXNoIGZvciBpbnB1dCAjJHtpfSBkb2Vzbid0IG1hdGNoIHRoZSBoYXNoIHNwZWNpZmllZCBpbiB0aGUgcHJldm91dGApO1xyXG4gICAgICB9XHJcbiAgICAgIG5ld1BzYnQuZGF0YS5pbnB1dHNbaV0ud2l0bmVzc1V0eG8gPSB0eC5vdXRzW3R4SW5wdXRzW2ldLmluZGV4XTtcclxuICAgIH1cclxuICAgIGRlbGV0ZSBuZXdQc2J0LmRhdGEuaW5wdXRzW2ldLm5vbldpdG5lc3NVdHhvO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gbmV3UHNidDtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlbGV0ZXMgd2l0bmVzc1V0eG8gZm9yIG5vbi1zZWd3aXQgaW5wdXRzIHRvIG1ha2UgdGhlIFBTQlQgQklQLTE3NCBjb21wbGlhbnQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlV2l0bmVzc1V0eG9Gb3JOb25TZWd3aXRJbnB1dHMocHNidDogVXR4b1BzYnQpOiB2b2lkIHtcclxuICBwc2J0LmRhdGEuaW5wdXRzLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XHJcbiAgICBjb25zdCBzY3JpcHRUeXBlID0gZ2V0UHNidElucHV0U2NyaXB0VHlwZShpbnB1dCk7XHJcbiAgICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3Ayc2gnIHx8IHNjcmlwdFR5cGUgPT09ICdwMnNoUDJwaycpIHtcclxuICAgICAgZGVsZXRlIGlucHV0LndpdG5lc3NVdHhvO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbiJdfQ==