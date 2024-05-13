"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtxoPsbt = void 0;
const assert = require("assert");
const bip174_1 = require("bip174");
const utils_1 = require("bip174/src/lib/utils");
const bufferutils_1 = require("bitcoinjs-lib/src/bufferutils");
const bip32_1 = require("bip32");
const bs58check = require("bs58check");
const proprietaryKeyVal_1 = require("bip174/src/lib/proprietaryKeyVal");
const __1 = require("..");
const UtxoTransaction_1 = require("./UtxoTransaction");
const Unspent_1 = require("./Unspent");
const scriptTypes_1 = require("./psbt/scriptTypes");
const fromHalfSigned_1 = require("./psbt/fromHalfSigned");
const outputScripts_1 = require("./outputScripts");
const parseInput_1 = require("./parseInput");
const Musig2_1 = require("./Musig2");
const types_1 = require("./types");
const taproot_1 = require("../taproot");
const PsbtUtil_1 = require("./PsbtUtil");
function defaultSighashTypes() {
    return [__1.Transaction.SIGHASH_DEFAULT, __1.Transaction.SIGHASH_ALL];
}
function addForkIdToSighashesIfNeeded(network, sighashTypes) {
    switch ((0, __1.getMainnet)(network)) {
        case __1.networks.bitcoincash:
        case __1.networks.bitcoinsv:
        case __1.networks.bitcoingold:
        case __1.networks.ecash:
            return [...sighashTypes, ...sighashTypes.map((s) => s | UtxoTransaction_1.UtxoTransaction.SIGHASH_FORKID)];
        default:
            return sighashTypes;
    }
}
function toSignatureParams(network, v) {
    if (Array.isArray(v))
        return toSignatureParams(network, { sighashTypes: v });
    const defaultSignatureParams = { deterministic: false, sighashTypes: defaultSighashTypes() };
    const ret = { ...defaultSignatureParams, ...v };
    ret.sighashTypes = addForkIdToSighashesIfNeeded(network, ret.sighashTypes);
    return ret;
}
/**
 * @param a
 * @param b
 * @returns true if the two public keys are equal ignoring the y coordinate.
 */
function equalPublicKeyIgnoreY(a, b) {
    return (0, outputScripts_1.toXOnlyPublicKey)(a).equals((0, outputScripts_1.toXOnlyPublicKey)(b));
}
// TODO: upstream does `checkInputsForPartialSigs` before doing things like
// `setVersion`. Our inputs could have tapscriptsigs (or in future tapkeysigs)
// and not fail that check. Do we want to do anything about that?
class UtxoPsbt extends __1.Psbt {
    constructor() {
        super(...arguments);
        this.nonceStore = new Musig2_1.Musig2NonceStore();
    }
    static transactionFromBuffer(buffer, network) {
        return UtxoTransaction_1.UtxoTransaction.fromBuffer(buffer, false, 'bigint', network);
    }
    static createPsbt(opts, data) {
        return new UtxoPsbt(opts, data || new bip174_1.Psbt(new __1.PsbtTransaction({ tx: new UtxoTransaction_1.UtxoTransaction(opts.network) })));
    }
    static fromBuffer(buffer, opts) {
        const transactionFromBuffer = (buffer) => {
            const tx = this.transactionFromBuffer(buffer, opts.network);
            return new __1.PsbtTransaction({ tx });
        };
        const psbtBase = bip174_1.Psbt.fromBuffer(buffer, transactionFromBuffer, {
            bip32PathsAbsolute: opts.bip32PathsAbsolute,
        });
        const psbt = this.createPsbt(opts, psbtBase);
        // Upstream checks for duplicate inputs here, but it seems to be of dubious value.
        return psbt;
    }
    static fromHex(data, opts) {
        return this.fromBuffer(Buffer.from(data, 'hex'), opts);
    }
    /**
     * @param parent - Parent key. Matched with `bip32Derivations` using `fingerprint` property.
     * @param bip32Derivations - possible derivations for input or output
     * @param ignoreY - when true, ignore the y coordinate when matching public keys
     * @return derived bip32 node if matching derivation is found, undefined if none is found
     * @throws Error if more than one match is found
     */
    static deriveKeyPair(parent, bip32Derivations, { ignoreY }) {
        const matchingDerivations = bip32Derivations.filter((bipDv) => {
            return bipDv.masterFingerprint.equals(parent.fingerprint);
        });
        if (!matchingDerivations.length) {
            // No fingerprint match
            return undefined;
        }
        if (matchingDerivations.length !== 1) {
            throw new Error(`more than one matching derivation for fingerprint ${parent.fingerprint.toString('hex')}: ${matchingDerivations.length}`);
        }
        const [derivation] = matchingDerivations;
        const node = parent.derivePath(derivation.path);
        if (!node.publicKey.equals(derivation.pubkey)) {
            if (!ignoreY || !equalPublicKeyIgnoreY(node.publicKey, derivation.pubkey)) {
                throw new Error('pubkey did not match bip32Derivation');
            }
        }
        return node;
    }
    static deriveKeyPairForInput(bip32, input) {
        var _a, _b, _c, _d;
        return ((_a = input.tapBip32Derivation) === null || _a === void 0 ? void 0 : _a.length)
            ? (_b = UtxoPsbt.deriveKeyPair(bip32, input.tapBip32Derivation, { ignoreY: true })) === null || _b === void 0 ? void 0 : _b.publicKey
            : ((_c = input.bip32Derivation) === null || _c === void 0 ? void 0 : _c.length)
                ? (_d = UtxoPsbt.deriveKeyPair(bip32, input.bip32Derivation, { ignoreY: false })) === null || _d === void 0 ? void 0 : _d.publicKey
                : bip32 === null || bip32 === void 0 ? void 0 : bip32.publicKey;
    }
    get network() {
        return this.tx.network;
    }
    toHex() {
        return this.toBuffer().toString('hex');
    }
    /**
     * It is expensive to attempt to compute every output address using psbt.txOutputs[outputIndex]
     * to then just get the script. Here, we are doing the same thing as what txOutputs() does in
     * bitcoinjs-lib, but without iterating over each output.
     * @param outputIndex
     * @returns output script at the given index
     */
    getOutputScript(outputIndex) {
        return this.__CACHE.__TX.outs[outputIndex].script;
    }
    getNonWitnessPreviousTxids() {
        const txInputs = this.txInputs; // These are somewhat costly to extract
        const txidSet = new Set();
        this.data.inputs.forEach((input, index) => {
            if (!input.witnessUtxo) {
                throw new Error('Must have witness UTXO for all inputs');
            }
            if (!(0, scriptTypes_1.isSegwit)(input.witnessUtxo.script, input.redeemScript)) {
                txidSet.add((0, Unspent_1.getOutputIdForInput)(txInputs[index]).txid);
            }
        });
        return [...txidSet];
    }
    addNonWitnessUtxos(txBufs) {
        const txInputs = this.txInputs; // These are somewhat costly to extract
        this.data.inputs.forEach((input, index) => {
            if (!input.witnessUtxo) {
                throw new Error('Must have witness UTXO for all inputs');
            }
            if (!(0, scriptTypes_1.isSegwit)(input.witnessUtxo.script, input.redeemScript)) {
                const { txid } = (0, Unspent_1.getOutputIdForInput)(txInputs[index]);
                if (txBufs[txid] === undefined) {
                    throw new Error('Not all required previous transactions provided');
                }
                this.updateInput(index, { nonWitnessUtxo: txBufs[txid] });
            }
        });
        return this;
    }
    static fromTransaction(transaction, prevOutputs) {
        if (prevOutputs.length !== transaction.ins.length) {
            throw new Error(`Transaction has ${transaction.ins.length} inputs, but ${prevOutputs.length} previous outputs provided`);
        }
        const clonedTransaction = transaction.clone();
        const updates = (0, fromHalfSigned_1.unsign)(clonedTransaction, prevOutputs);
        const psbtBase = new bip174_1.Psbt(new __1.PsbtTransaction({ tx: clonedTransaction }));
        clonedTransaction.ins.forEach(() => psbtBase.inputs.push({ unknownKeyVals: [] }));
        clonedTransaction.outs.forEach(() => psbtBase.outputs.push({ unknownKeyVals: [] }));
        const psbt = this.createPsbt({ network: transaction.network }, psbtBase);
        updates.forEach((update, index) => {
            psbt.updateInput(index, update);
            psbt.updateInput(index, { witnessUtxo: { script: prevOutputs[index].script, value: prevOutputs[index].value } });
        });
        return psbt;
    }
    getUnsignedTx() {
        return this.tx.clone();
    }
    static newTransaction(network) {
        return new UtxoTransaction_1.UtxoTransaction(network);
    }
    get tx() {
        return this.data.globalMap.unsignedTx.tx;
    }
    checkForSignatures(propName) {
        this.data.inputs.forEach((input) => {
            var _a, _b;
            if (((_a = input.tapScriptSig) === null || _a === void 0 ? void 0 : _a.length) || input.tapKeySig || ((_b = input.partialSig) === null || _b === void 0 ? void 0 : _b.length)) {
                throw new Error(`Cannot modify ${propName !== null && propName !== void 0 ? propName : 'transaction'} - signatures exist.`);
            }
        });
    }
    /**
     * @returns true if the input at inputIndex is a taproot key path.
     * Checks for presence of minimum required key path input fields and absence of any script path only input fields.
     */
    isTaprootKeyPathInput(inputIndex) {
        var _a, _b, _c;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        return (!!input.tapInternalKey &&
            !!input.tapMerkleRoot &&
            !(((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) ||
                ((_b = input.tapScriptSig) === null || _b === void 0 ? void 0 : _b.length) ||
                ((_c = input.tapBip32Derivation) === null || _c === void 0 ? void 0 : _c.some((v) => v.leafHashes.length))));
    }
    /**
     * @returns true if the input at inputIndex is a taproot script path.
     * Checks for presence of minimum required script path input fields and absence of any key path only input fields.
     */
    isTaprootScriptPathInput(inputIndex) {
        var _a;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        return (!!((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) &&
            !(this.getProprietaryKeyVals(inputIndex, {
                identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
                subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
            }).length ||
                this.getProprietaryKeyVals(inputIndex, {
                    identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
                    subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
                }).length ||
                this.getProprietaryKeyVals(inputIndex, {
                    identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
                    subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
                }).length));
    }
    /**
     * @returns true if the input at inputIndex is a taproot
     */
    isTaprootInput(inputIndex) {
        var _a, _b, _c;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        const isP2TR = (script) => {
            try {
                (0, taproot_1.getTaprootOutputKey)(script);
                return true;
            }
            catch (e) {
                return false;
            }
        };
        return !!(input.tapInternalKey ||
            input.tapMerkleRoot ||
            ((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) ||
            ((_b = input.tapBip32Derivation) === null || _b === void 0 ? void 0 : _b.length) ||
            ((_c = input.tapScriptSig) === null || _c === void 0 ? void 0 : _c.length) ||
            this.getProprietaryKeyVals(inputIndex, {
                identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
                subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
            }).length ||
            this.getProprietaryKeyVals(inputIndex, {
                identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
                subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
            }).length ||
            this.getProprietaryKeyVals(inputIndex, {
                identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
                subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
            }).length ||
            (input.witnessUtxo && isP2TR(input.witnessUtxo.script)));
    }
    isMultisigTaprootScript(script) {
        try {
            (0, parseInput_1.parsePubScript2Of3)(script, 'taprootScriptPathSpend');
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
     */
    finalizeAllInputs() {
        (0, utils_1.checkForInput)(this.data.inputs, 0); // making sure we have at least one
        this.data.inputs.map((input, idx) => {
            var _a;
            if ((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) {
                return this.isMultisigTaprootScript(input.tapLeafScript[0].script)
                    ? this.finalizeTaprootInput(idx)
                    : this.finalizeTapInputWithSingleLeafScriptAndSignature(idx);
            }
            else if (this.isTaprootKeyPathInput(idx)) {
                return this.finalizeTaprootMusig2Input(idx);
            }
            return this.finalizeInput(idx);
        });
        return this;
    }
    finalizeTaprootInput(inputIndex) {
        var _a, _b;
        const sanitizeSignature = (sig) => {
            const sighashType = sig.length === 64 ? __1.Transaction.SIGHASH_DEFAULT : sig.readUInt8(sig.length - 1);
            const inputSighashType = input.sighashType === undefined ? __1.Transaction.SIGHASH_DEFAULT : input.sighashType;
            assert(sighashType === inputSighashType, 'signature sighash does not match input sighash type');
            // TODO BTC-663 This should be fixed in platform. This is just a workaround fix.
            return sighashType === __1.Transaction.SIGHASH_DEFAULT && sig.length === 65 ? sig.slice(0, 64) : sig;
        };
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        // witness = control-block script first-sig second-sig
        if (((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) !== 1) {
            throw new Error('Only one leaf script supported for finalizing');
        }
        const { controlBlock, script } = input.tapLeafScript[0];
        const witness = [script, controlBlock];
        const [pubkey1, pubkey2] = (0, parseInput_1.parsePubScript2Of3)(script, 'taprootScriptPathSpend').publicKeys;
        for (const pk of [pubkey1, pubkey2]) {
            const sig = (_b = input.tapScriptSig) === null || _b === void 0 ? void 0 : _b.find(({ pubkey }) => equalPublicKeyIgnoreY(pk, pubkey));
            if (!sig) {
                throw new Error('Could not find signatures in Script Sig.');
            }
            witness.unshift(sanitizeSignature(sig.signature));
        }
        const witnessLength = witness.reduce((s, b) => s + b.length + bufferutils_1.varuint.encodingLength(b.length), 1);
        const bufferWriter = bufferutils_1.BufferWriter.withCapacity(witnessLength);
        bufferWriter.writeVector(witness);
        const finalScriptWitness = bufferWriter.end();
        this.data.updateInput(inputIndex, { finalScriptWitness });
        this.data.clearFinalizedInput(inputIndex);
        return this;
    }
    /**
     * Finalizes a taproot musig2 input by aggregating all partial sigs.
     * IMPORTANT: Always call validate* function before finalizing.
     */
    finalizeTaprootMusig2Input(inputIndex) {
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        const partialSigs = (0, Musig2_1.parsePsbtMusig2PartialSigs)(input);
        if ((partialSigs === null || partialSigs === void 0 ? void 0 : partialSigs.length) !== 2) {
            throw new Error(`invalid number of partial signatures ${partialSigs ? partialSigs.length : 0} to finalize`);
        }
        const { partialSigs: pSigs, sigHashType } = (0, Musig2_1.getSigHashTypeFromSigs)(partialSigs);
        const { sessionKey } = this.getMusig2SessionKey(inputIndex, sigHashType);
        const aggSig = (0, Musig2_1.musig2AggregateSigs)(pSigs.map((pSig) => pSig.partialSig), sessionKey);
        const sig = sigHashType === __1.Transaction.SIGHASH_DEFAULT ? aggSig : Buffer.concat([aggSig, Buffer.of(sigHashType)]);
        // single signature with 64/65 bytes size is script witness for key path spend
        const bufferWriter = bufferutils_1.BufferWriter.withCapacity(1 + bufferutils_1.varuint.encodingLength(sig.length) + sig.length);
        bufferWriter.writeVector([sig]);
        const finalScriptWitness = bufferWriter.end();
        this.data.updateInput(inputIndex, { finalScriptWitness });
        this.data.clearFinalizedInput(inputIndex);
        // deleting only BitGo proprietary key values.
        this.deleteProprietaryKeyVals(inputIndex, { identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER });
        return this;
    }
    finalizeTapInputWithSingleLeafScriptAndSignature(inputIndex) {
        var _a, _b;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        if (((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) !== 1) {
            throw new Error('Only one leaf script supported for finalizing');
        }
        if (((_b = input.tapScriptSig) === null || _b === void 0 ? void 0 : _b.length) !== 1) {
            throw new Error('Could not find signatures in Script Sig.');
        }
        const { controlBlock, script } = input.tapLeafScript[0];
        const witness = [input.tapScriptSig[0].signature, script, controlBlock];
        const witnessLength = witness.reduce((s, b) => s + b.length + bufferutils_1.varuint.encodingLength(b.length), 1);
        const bufferWriter = bufferutils_1.BufferWriter.withCapacity(witnessLength);
        bufferWriter.writeVector(witness);
        const finalScriptWitness = bufferWriter.end();
        this.data.updateInput(inputIndex, { finalScriptWitness });
        this.data.clearFinalizedInput(inputIndex);
        return this;
    }
    /**
     * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
     *
     * Unlike the function it overrides, this does not take a validator. In BitGo
     * context, we know how we want to validate so we just hard code the right
     * validator.
     */
    validateSignaturesOfAllInputs() {
        (0, utils_1.checkForInput)(this.data.inputs, 0); // making sure we have at least one
        const results = this.data.inputs.map((input, idx) => {
            return this.validateSignaturesOfInputCommon(idx);
        });
        return results.reduce((final, res) => res && final, true);
    }
    /**
     * @returns true iff any matching valid signature is found for a derived pub key from given HD key pair.
     */
    validateSignaturesOfInputHD(inputIndex, hdKeyPair) {
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        const pubKey = UtxoPsbt.deriveKeyPairForInput(hdKeyPair, input);
        if (!pubKey) {
            throw new Error('can not derive from HD key pair');
        }
        return this.validateSignaturesOfInputCommon(inputIndex, pubKey);
    }
    /**
     * @returns true iff any valid signature(s) are found from bip32 data of PSBT or for given pub key.
     */
    validateSignaturesOfInputCommon(inputIndex, pubkey) {
        try {
            if (this.isTaprootScriptPathInput(inputIndex)) {
                return this.validateTaprootSignaturesOfInput(inputIndex, pubkey);
            }
            else if (this.isTaprootKeyPathInput(inputIndex)) {
                return this.validateTaprootMusig2SignaturesOfInput(inputIndex, pubkey);
            }
            return this.validateSignaturesOfInput(inputIndex, (p, m, s) => __1.ecc.verify(m, p, s, true), pubkey);
        }
        catch (err) {
            // Not an elegant solution. Might need upstream changes like custom error types.
            if (err.message === 'No signatures for this pubkey') {
                return false;
            }
            throw err;
        }
    }
    getMusig2SessionKey(inputIndex, sigHashType) {
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        if (!input.tapInternalKey || !input.tapMerkleRoot) {
            throw new Error('both tapInternalKey and tapMerkleRoot are required');
        }
        const participants = this.getMusig2Participants(inputIndex, input.tapInternalKey, input.tapMerkleRoot);
        const nonces = this.getMusig2Nonces(inputIndex, participants);
        const { hash } = this.getTaprootHashForSig(inputIndex, [sigHashType]);
        const sessionKey = (0, Musig2_1.createMusig2SigningSession)({
            pubNonces: [nonces[0].pubNonce, nonces[1].pubNonce],
            pubKeys: participants.participantPubKeys,
            txHash: hash,
            internalPubKey: input.tapInternalKey,
            tapTreeRoot: input.tapMerkleRoot,
        });
        return { participants, nonces, hash, sessionKey };
    }
    /**
     * @returns true for following cases.
     * If valid musig2 partial signatures exists for both 2 keys, it will also verify aggregated sig
     * for aggregated tweaked key (output key), otherwise only verifies partial sig.
     * If pubkey is passed in input, it will check sig only for that pubkey,
     * if no sig exits for such key, throws error.
     * For invalid state of input data, it will throw errors.
     */
    validateTaprootMusig2SignaturesOfInput(inputIndex, pubkey) {
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        const partialSigs = (0, Musig2_1.parsePsbtMusig2PartialSigs)(input);
        if (!partialSigs) {
            throw new Error(`No signatures to validate`);
        }
        let myPartialSigs = partialSigs;
        if (pubkey) {
            myPartialSigs = partialSigs.filter((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, pubkey));
            if ((myPartialSigs === null || myPartialSigs === void 0 ? void 0 : myPartialSigs.length) < 1) {
                throw new Error('No signatures for this pubkey');
            }
        }
        const { partialSigs: mySigs, sigHashType } = (0, Musig2_1.getSigHashTypeFromSigs)(myPartialSigs);
        const { participants, nonces, hash, sessionKey } = this.getMusig2SessionKey(inputIndex, sigHashType);
        const results = mySigs.map((mySig) => {
            const myNonce = nonces.find((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, mySig.participantPubKey));
            if (!myNonce) {
                throw new Error('Found no pub nonce for pubkey');
            }
            return (0, Musig2_1.musig2PartialSigVerify)(mySig.partialSig, mySig.participantPubKey, myNonce.pubNonce, sessionKey);
        });
        // For valid single sig or 1 or 2 failure sigs, no need to validate aggregated sig. So skip.
        const result = results.every((res) => res);
        if (!result || mySigs.length < 2) {
            return result;
        }
        const aggSig = (0, Musig2_1.musig2AggregateSigs)(mySigs.map((mySig) => mySig.partialSig), sessionKey);
        return __1.ecc.verifySchnorr(hash, participants.tapOutputKey, aggSig);
    }
    validateTaprootSignaturesOfInput(inputIndex, pubkey) {
        var _a, _b;
        const input = this.data.inputs[inputIndex];
        const tapSigs = (input || {}).tapScriptSig;
        if (!input || !tapSigs || tapSigs.length < 1) {
            throw new Error('No signatures to validate');
        }
        let mySigs;
        if (pubkey) {
            mySigs = tapSigs.filter((sig) => equalPublicKeyIgnoreY(sig.pubkey, pubkey));
            if (mySigs.length < 1) {
                throw new Error('No signatures for this pubkey');
            }
        }
        else {
            mySigs = tapSigs;
        }
        const results = [];
        assert(((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) === 1, `single tapLeafScript is expected. Got ${(_b = input.tapLeafScript) === null || _b === void 0 ? void 0 : _b.length}`);
        const [tapLeafScript] = input.tapLeafScript;
        const pubKeys = this.isMultisigTaprootScript(tapLeafScript.script)
            ? (0, parseInput_1.parsePubScript2Of3)(tapLeafScript.script, 'taprootScriptPathSpend').publicKeys
            : undefined;
        for (const pSig of mySigs) {
            const { signature, leafHash, pubkey } = pSig;
            if (pubKeys) {
                assert(pubKeys.find((pk) => pubkey.equals(pk)), 'public key not found in tap leaf script');
            }
            let sigHashType;
            let sig;
            if (signature.length === 65) {
                sigHashType = signature[64];
                sig = signature.slice(0, 64);
            }
            else {
                sigHashType = __1.Transaction.SIGHASH_DEFAULT;
                sig = signature;
            }
            const { hash } = this.getTaprootHashForSig(inputIndex, [sigHashType], leafHash);
            results.push(__1.ecc.verifySchnorr(hash, pubkey, sig));
        }
        return results.every((res) => res);
    }
    /**
     * @param inputIndex
     * @param rootNodes optional input root bip32 nodes to verify with. If it is not provided, globalXpub will be used.
     * @return array of boolean values. True when corresponding index in `publicKeys` has signed the transaction.
     * If no signature in the tx or no public key matching signature, the validation is considered as false.
     */
    getSignatureValidationArray(inputIndex, { rootNodes } = {}) {
        var _a, _b;
        if (!rootNodes && (!((_a = this.data.globalMap.globalXpub) === null || _a === void 0 ? void 0 : _a.length) || !(0, types_1.isTriple)(this.data.globalMap.globalXpub))) {
            throw new Error('Cannot get signature validation array without 3 global xpubs');
        }
        const bip32s = rootNodes
            ? rootNodes
            : (_b = this.data.globalMap.globalXpub) === null || _b === void 0 ? void 0 : _b.map((xpub) => (0, bip32_1.BIP32Factory)(__1.ecc).fromBase58(bs58check.encode(xpub.extendedPubkey)));
        if (!bip32s) {
            throw new Error('either globalMap or rootNodes is required');
        }
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        if (!(0, PsbtUtil_1.getPsbtInputSignatureCount)(input)) {
            return [false, false, false];
        }
        return bip32s.map((bip32) => {
            const pubKey = UtxoPsbt.deriveKeyPairForInput(bip32, input);
            if (!pubKey) {
                return false;
            }
            try {
                return this.validateSignaturesOfInputCommon(inputIndex, pubKey);
            }
            catch (err) {
                // Not an elegant solution. Might need upstream changes like custom error types.
                if (err.message === 'No signatures for this pubkey') {
                    return false;
                }
                throw err;
            }
        });
    }
    /**
     * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
     */
    signAllInputsHD(hdKeyPair, params) {
        if (!hdKeyPair || !hdKeyPair.publicKey || !hdKeyPair.fingerprint) {
            throw new Error('Need HDSigner to sign input');
        }
        const { sighashTypes, deterministic } = toSignatureParams(this.network, params);
        const results = [];
        for (let i = 0; i < this.data.inputs.length; i++) {
            try {
                this.signInputHD(i, hdKeyPair, { sighashTypes, deterministic });
                results.push(true);
            }
            catch (err) {
                results.push(false);
            }
        }
        if (results.every((v) => !v)) {
            throw new Error('No inputs were signed');
        }
        return this;
    }
    /**
     * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts:signInputHD
     */
    signTaprootInputHD(inputIndex, hdKeyPair, { sighashTypes = [__1.Transaction.SIGHASH_DEFAULT, __1.Transaction.SIGHASH_ALL], deterministic = false } = {}) {
        var _a, _b;
        if (!this.isTaprootInput(inputIndex)) {
            throw new Error('not a taproot input');
        }
        if (!hdKeyPair || !hdKeyPair.publicKey || !hdKeyPair.fingerprint) {
            throw new Error('Need HDSigner to sign input');
        }
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        if (!input.tapBip32Derivation || input.tapBip32Derivation.length === 0) {
            throw new Error('Need tapBip32Derivation to sign Taproot with HD');
        }
        const myDerivations = input.tapBip32Derivation
            .map((bipDv) => {
            if (bipDv.masterFingerprint.equals(hdKeyPair.fingerprint)) {
                return bipDv;
            }
        })
            .filter((v) => !!v);
        if (myDerivations.length === 0) {
            throw new Error('Need one tapBip32Derivation masterFingerprint to match the HDSigner fingerprint');
        }
        function getDerivedNode(bipDv) {
            const node = hdKeyPair.derivePath(bipDv.path);
            if (!equalPublicKeyIgnoreY(bipDv.pubkey, node.publicKey)) {
                throw new Error('pubkey did not match tapBip32Derivation');
            }
            return node;
        }
        if ((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) {
            const signers = myDerivations.map((bipDv) => {
                const signer = getDerivedNode(bipDv);
                if (!('signSchnorr' in signer)) {
                    throw new Error('signSchnorr function is required to sign p2tr');
                }
                return { signer, leafHashes: bipDv.leafHashes };
            });
            signers.forEach(({ signer, leafHashes }) => this.signTaprootInput(inputIndex, signer, leafHashes, sighashTypes));
        }
        else if ((_b = input.tapInternalKey) === null || _b === void 0 ? void 0 : _b.length) {
            const signers = myDerivations.map((bipDv) => {
                const signer = getDerivedNode(bipDv);
                if (!('privateKey' in signer) || !signer.privateKey) {
                    throw new Error('privateKey is required to sign p2tr musig2');
                }
                return signer;
            });
            signers.forEach((signer) => this.signTaprootMusig2Input(inputIndex, signer, { sighashTypes, deterministic }));
        }
        return this;
    }
    signInput(inputIndex, keyPair, sighashTypes) {
        const { sighashTypes: sighashForNetwork } = toSignatureParams(this.network, sighashTypes);
        return super.signInput(inputIndex, keyPair, sighashForNetwork);
    }
    signInputHD(inputIndex, hdKeyPair, params) {
        const { sighashTypes, deterministic } = toSignatureParams(this.network, params);
        if (this.isTaprootInput(inputIndex)) {
            return this.signTaprootInputHD(inputIndex, hdKeyPair, { sighashTypes, deterministic });
        }
        else {
            return super.signInputHD(inputIndex, hdKeyPair, sighashTypes);
        }
    }
    getMusig2Participants(inputIndex, tapInternalKey, tapMerkleRoot) {
        const participantsKeyValData = (0, Musig2_1.parsePsbtMusig2Participants)(this.data.inputs[inputIndex]);
        if (!participantsKeyValData) {
            throw new Error(`Found 0 matching participant key value instead of 1`);
        }
        (0, Musig2_1.assertPsbtMusig2Participants)(participantsKeyValData, tapInternalKey, tapMerkleRoot);
        return participantsKeyValData;
    }
    getMusig2Nonces(inputIndex, participantsKeyValData) {
        const noncesKeyValsData = (0, Musig2_1.parsePsbtMusig2Nonces)(this.data.inputs[inputIndex]);
        if (!noncesKeyValsData || !(0, types_1.isTuple)(noncesKeyValsData)) {
            throw new Error(`Found ${(noncesKeyValsData === null || noncesKeyValsData === void 0 ? void 0 : noncesKeyValsData.length) ? noncesKeyValsData.length : 0} matching nonce key value instead of 2`);
        }
        (0, Musig2_1.assertPsbtMusig2Nonces)(noncesKeyValsData, participantsKeyValData);
        return noncesKeyValsData;
    }
    /**
     * Signs p2tr musig2 key path input with 2 aggregated keys.
     *
     * Note: Only can sign deterministically as the cosigner
     * @param inputIndex
     * @param signer - XY public key and private key are required
     * @param sighashTypes
     * @param deterministic If true, sign the musig input deterministically
     */
    signTaprootMusig2Input(inputIndex, signer, { sighashTypes = [__1.Transaction.SIGHASH_DEFAULT, __1.Transaction.SIGHASH_ALL], deterministic = false } = {}) {
        if (!this.isTaprootKeyPathInput(inputIndex)) {
            throw new Error('not a taproot musig2 input');
        }
        const input = this.data.inputs[inputIndex];
        if (!input.tapInternalKey || !input.tapMerkleRoot) {
            throw new Error('missing required input data');
        }
        // Retrieve and check that we have two participant nonces
        const participants = this.getMusig2Participants(inputIndex, input.tapInternalKey, input.tapMerkleRoot);
        const { tapOutputKey, participantPubKeys } = participants;
        const signerPubKey = participantPubKeys.find((pubKey) => equalPublicKeyIgnoreY(pubKey, signer.publicKey));
        if (!signerPubKey) {
            throw new Error('signer pub key should match one of participant pub keys');
        }
        const nonces = this.getMusig2Nonces(inputIndex, participants);
        const { hash, sighashType } = this.getTaprootHashForSig(inputIndex, sighashTypes);
        let partialSig;
        if (deterministic) {
            if (!equalPublicKeyIgnoreY(signerPubKey, participantPubKeys[1])) {
                throw new Error('can only add a deterministic signature on the cosigner');
            }
            const firstSignerNonce = nonces.find((n) => equalPublicKeyIgnoreY(n.participantPubKey, participantPubKeys[0]));
            if (!firstSignerNonce) {
                throw new Error('could not find the user nonce');
            }
            partialSig = (0, Musig2_1.musig2DeterministicSign)({
                privateKey: signer.privateKey,
                otherNonce: firstSignerNonce.pubNonce,
                publicKeys: participantPubKeys,
                internalPubKey: input.tapInternalKey,
                tapTreeRoot: input.tapMerkleRoot,
                hash,
            }).sig;
        }
        else {
            const sessionKey = (0, Musig2_1.createMusig2SigningSession)({
                pubNonces: [nonces[0].pubNonce, nonces[1].pubNonce],
                pubKeys: participantPubKeys,
                txHash: hash,
                internalPubKey: input.tapInternalKey,
                tapTreeRoot: input.tapMerkleRoot,
            });
            const signerNonce = nonces.find((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, signerPubKey));
            if (!signerNonce) {
                throw new Error('pubNonce is missing. retry signing process');
            }
            partialSig = (0, Musig2_1.musig2PartialSign)(signer.privateKey, signerNonce.pubNonce, sessionKey, this.nonceStore);
        }
        if (sighashType !== __1.Transaction.SIGHASH_DEFAULT) {
            partialSig = Buffer.concat([partialSig, Buffer.of(sighashType)]);
        }
        const sig = (0, Musig2_1.encodePsbtMusig2PartialSig)({
            participantPubKey: signerPubKey,
            tapOutputKey,
            partialSig: partialSig,
        });
        this.addProprietaryKeyValToInput(inputIndex, sig);
        return this;
    }
    signTaprootInput(inputIndex, signer, leafHashes, sighashTypes = [__1.Transaction.SIGHASH_DEFAULT, __1.Transaction.SIGHASH_ALL]) {
        var _a;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        // Figure out if this is script path or not, if not, tweak the private key
        if (!((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new Error('tapLeafScript is required for p2tr script path');
        }
        const pubkey = (0, outputScripts_1.toXOnlyPublicKey)(signer.publicKey);
        if (input.tapLeafScript.length !== 1) {
            throw new Error('Only one leaf script supported for signing');
        }
        const [tapLeafScript] = input.tapLeafScript;
        if (this.isMultisigTaprootScript(tapLeafScript.script)) {
            const pubKeys = (0, parseInput_1.parsePubScript2Of3)(tapLeafScript.script, 'taprootScriptPathSpend').publicKeys;
            assert(pubKeys.find((pk) => pubkey.equals(pk)), 'public key not found in tap leaf script');
        }
        const parsedControlBlock = __1.taproot.parseControlBlock(__1.ecc, tapLeafScript.controlBlock);
        const { leafVersion } = parsedControlBlock;
        if (leafVersion !== tapLeafScript.leafVersion) {
            throw new Error('Tap script leaf version mismatch with control block');
        }
        const leafHash = __1.taproot.getTapleafHash(__1.ecc, parsedControlBlock, tapLeafScript.script);
        if (!leafHashes.find((l) => l.equals(leafHash))) {
            throw new Error(`Signer cannot sign for leaf hash ${leafHash.toString('hex')}`);
        }
        const { hash, sighashType } = this.getTaprootHashForSig(inputIndex, sighashTypes, leafHash);
        let signature = signer.signSchnorr(hash);
        if (sighashType !== __1.Transaction.SIGHASH_DEFAULT) {
            signature = Buffer.concat([signature, Buffer.of(sighashType)]);
        }
        this.data.updateInput(inputIndex, {
            tapScriptSig: [
                {
                    pubkey,
                    signature,
                    leafHash,
                },
            ],
        });
        return this;
    }
    getTaprootOutputScript(inputIndex) {
        var _a;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        if ((_a = input.tapLeafScript) === null || _a === void 0 ? void 0 : _a.length) {
            return __1.taproot.createTaprootOutputScript({
                controlBlock: input.tapLeafScript[0].controlBlock,
                leafScript: input.tapLeafScript[0].script,
            });
        }
        else if (input.tapInternalKey && input.tapMerkleRoot) {
            return __1.taproot.createTaprootOutputScript({
                internalPubKey: input.tapInternalKey,
                taptreeRoot: input.tapMerkleRoot,
            });
        }
        throw new Error('not a taproot input');
    }
    getTaprootHashForSig(inputIndex, sighashTypes, leafHash) {
        if (!this.isTaprootInput(inputIndex)) {
            throw new Error('not a taproot input');
        }
        const sighashType = this.data.inputs[inputIndex].sighashType || __1.Transaction.SIGHASH_DEFAULT;
        if (sighashTypes && sighashTypes.indexOf(sighashType) < 0) {
            throw new Error(`Sighash type is not allowed. Retry the sign method passing the ` +
                `sighashTypes array of whitelisted types. Sighash type: ${sighashType}`);
        }
        const txInputs = this.txInputs; // These are somewhat costly to extract
        const prevoutScripts = [];
        const prevoutValues = [];
        this.data.inputs.forEach((input, i) => {
            let prevout;
            if (input.nonWitnessUtxo) {
                // TODO: This could be costly, either cache it here, or find a way to share with super
                const nonWitnessUtxoTx = this.constructor.transactionFromBuffer(input.nonWitnessUtxo, this.tx.network);
                const prevoutHash = txInputs[i].hash;
                const utxoHash = nonWitnessUtxoTx.getHash();
                // If a non-witness UTXO is provided, its hash must match the hash specified in the prevout
                if (!prevoutHash.equals(utxoHash)) {
                    throw new Error(`Non-witness UTXO hash for input #${i} doesn't match the hash specified in the prevout`);
                }
                const prevoutIndex = txInputs[i].index;
                prevout = nonWitnessUtxoTx.outs[prevoutIndex];
            }
            else if (input.witnessUtxo) {
                prevout = input.witnessUtxo;
            }
            else {
                throw new Error('Need a Utxo input item for signing');
            }
            prevoutScripts.push(prevout.script);
            prevoutValues.push(prevout.value);
        });
        const outputScript = this.getTaprootOutputScript(inputIndex);
        if (!outputScript.equals(prevoutScripts[inputIndex])) {
            throw new Error(`Witness script for input #${inputIndex} doesn't match the scriptPubKey in the prevout`);
        }
        const hash = this.tx.hashForWitnessV1(inputIndex, prevoutScripts, prevoutValues, sighashType, leafHash);
        return { hash, sighashType };
    }
    /**
     * Adds proprietary key value pair to PSBT input.
     * Default identifierEncoding is utf-8 for identifier.
     */
    addProprietaryKeyValToInput(inputIndex, keyValueData) {
        return this.addUnknownKeyValToInput(inputIndex, {
            key: (0, proprietaryKeyVal_1.encodeProprietaryKey)(keyValueData.key),
            value: keyValueData.value,
        });
    }
    /**
     * Adds or updates (if exists) proprietary key value pair to PSBT input.
     * Default identifierEncoding is utf-8 for identifier.
     */
    addOrUpdateProprietaryKeyValToInput(inputIndex, keyValueData) {
        var _a;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        const key = (0, proprietaryKeyVal_1.encodeProprietaryKey)(keyValueData.key);
        const { value } = keyValueData;
        if ((_a = input.unknownKeyVals) === null || _a === void 0 ? void 0 : _a.length) {
            const ukvIndex = input.unknownKeyVals.findIndex((ukv) => ukv.key.equals(key));
            if (ukvIndex > -1) {
                input.unknownKeyVals[ukvIndex] = { key, value };
                return this;
            }
        }
        this.addUnknownKeyValToInput(inputIndex, {
            key,
            value,
        });
        return this;
    }
    /**
     * To search any data from proprietary key value against keydata.
     * Default identifierEncoding is utf-8 for identifier.
     */
    getProprietaryKeyVals(inputIndex, keySearch) {
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        return (0, PsbtUtil_1.getPsbtInputProprietaryKeyVals)(input, keySearch);
    }
    /**
     * To delete any data from proprietary key value.
     * Default identifierEncoding is utf-8 for identifier.
     */
    deleteProprietaryKeyVals(inputIndex, keysToDelete) {
        var _a;
        const input = (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        if (!((_a = input.unknownKeyVals) === null || _a === void 0 ? void 0 : _a.length)) {
            return this;
        }
        if (keysToDelete && keysToDelete.subtype === undefined && Buffer.isBuffer(keysToDelete.keydata)) {
            throw new Error('invalid proprietary key search filter combination. subtype is required');
        }
        input.unknownKeyVals = input.unknownKeyVals.filter((keyValue, i) => {
            const key = (0, proprietaryKeyVal_1.decodeProprietaryKey)(keyValue.key);
            return !(keysToDelete === undefined ||
                (keysToDelete.identifier === key.identifier &&
                    (keysToDelete.subtype === undefined ||
                        (keysToDelete.subtype === key.subtype &&
                            (!Buffer.isBuffer(keysToDelete.keydata) || keysToDelete.keydata.equals(key.keydata))))));
        });
        return this;
    }
    createMusig2NonceForInput(inputIndex, keyPair, keyType, params = { deterministic: false }) {
        const input = this.data.inputs[inputIndex];
        if (!input.tapInternalKey) {
            throw new Error('tapInternalKey is required to create nonce');
        }
        if (!input.tapMerkleRoot) {
            throw new Error('tapMerkleRoot is required to create nonce');
        }
        const getDerivedKeyPair = () => {
            var _a;
            if (!((_a = input.tapBip32Derivation) === null || _a === void 0 ? void 0 : _a.length)) {
                throw new Error('tapBip32Derivation is required to create nonce');
            }
            const derived = UtxoPsbt.deriveKeyPair(keyPair, input.tapBip32Derivation, { ignoreY: true });
            if (!derived) {
                throw new Error('No bip32Derivation masterFingerprint matched the HD keyPair fingerprint');
            }
            return derived;
        };
        const derivedKeyPair = keyType === 'root' ? getDerivedKeyPair() : keyPair;
        if (!derivedKeyPair.privateKey) {
            throw new Error('privateKey is required to create nonce');
        }
        const participants = (0, Musig2_1.parsePsbtMusig2Participants)(input);
        if (!participants) {
            throw new Error(`Found 0 matching participant key value instead of 1`);
        }
        (0, Musig2_1.assertPsbtMusig2Participants)(participants, input.tapInternalKey, input.tapMerkleRoot);
        const { tapOutputKey, participantPubKeys } = participants;
        const participantPubKey = participantPubKeys.find((pubKey) => equalPublicKeyIgnoreY(pubKey, derivedKeyPair.publicKey));
        if (!Buffer.isBuffer(participantPubKey)) {
            throw new Error('participant plain pub key should match one bip32Derivation plain pub key');
        }
        const { hash } = this.getTaprootHashForSig(inputIndex);
        let pubNonce;
        if (params.deterministic) {
            if (params.sessionId) {
                throw new Error('Cannot add extra entropy when generating a deterministic nonce');
            }
            // There must be only 2 participant pubKeys if it got to this point
            if (!equalPublicKeyIgnoreY(participantPubKey, participantPubKeys[1])) {
                throw new Error(`Only the cosigner's nonce can be set deterministically`);
            }
            const nonces = (0, Musig2_1.parsePsbtMusig2Nonces)(input);
            if (!nonces) {
                throw new Error(`No nonces found on input #${inputIndex}`);
            }
            if (nonces.length > 2) {
                throw new Error(`Cannot have more than 2 nonces`);
            }
            const firstSignerNonce = nonces.find((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, participantPubKeys[0]));
            if (!firstSignerNonce) {
                throw new Error('signer nonce must be set if cosigner nonce is to be derived deterministically');
            }
            pubNonce = (0, Musig2_1.createMusig2DeterministicNonce)({
                privateKey: derivedKeyPair.privateKey,
                otherNonce: firstSignerNonce.pubNonce,
                publicKeys: participantPubKeys,
                internalPubKey: input.tapInternalKey,
                tapTreeRoot: input.tapMerkleRoot,
                hash,
            });
        }
        else {
            pubNonce = Buffer.from(this.nonceStore.createMusig2Nonce(derivedKeyPair.privateKey, participantPubKey, tapOutputKey, hash, params.sessionId));
        }
        return { tapOutputKey, participantPubKey, pubNonce };
    }
    setMusig2NoncesInner(keyPair, keyType, inputIndex, params = { deterministic: false }) {
        if (keyPair.isNeutered()) {
            throw new Error('private key is required to generate nonce');
        }
        if (Buffer.isBuffer(params.sessionId) && params.sessionId.length !== 32) {
            throw new Error(`Invalid sessionId size ${params.sessionId.length}`);
        }
        const inputIndexes = inputIndex === undefined ? [...Array(this.inputCount).keys()] : [inputIndex];
        inputIndexes.forEach((index) => {
            if (!this.isTaprootKeyPathInput(index)) {
                return;
            }
            const nonce = this.createMusig2NonceForInput(index, keyPair, keyType, params);
            this.addOrUpdateProprietaryKeyValToInput(index, (0, Musig2_1.encodePsbtMusig2PubNonce)(nonce));
        });
        return this;
    }
    /**
     * Generates and sets MuSig2 nonce to taproot key path input at inputIndex.
     * If input is not a taproot key path, no action.
     *
     * @param inputIndex input index
     * @param keyPair derived key pair
     * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
     * (converted to an array of 32 bytes), or 32 uniformly random bytes.
     * @param deterministic If true, set the cosigner nonce deterministically
     */
    setInputMusig2Nonce(inputIndex, derivedKeyPair, params = { deterministic: false }) {
        return this.setMusig2NoncesInner(derivedKeyPair, 'derived', inputIndex, params);
    }
    /**
     * Generates and sets MuSig2 nonce to taproot key path input at inputIndex.
     * If input is not a taproot key path, no action.
     *
     * @param inputIndex input index
     * @param keyPair HD root key pair
     * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
     * (converted to an array of 32 bytes), or 32 uniformly random bytes.
     * @param deterministic If true, set the cosigner nonce deterministically
     */
    setInputMusig2NonceHD(inputIndex, keyPair, params = { deterministic: false }) {
        (0, utils_1.checkForInput)(this.data.inputs, inputIndex);
        return this.setMusig2NoncesInner(keyPair, 'root', inputIndex, params);
    }
    /**
     * Generates and sets MuSig2 nonce to all taproot key path inputs. Other inputs will be skipped.
     *
     * @param inputIndex input index
     * @param keyPair derived key pair
     * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
     * (converted to an array of 32 bytes), or 32 uniformly random bytes.
     */
    setAllInputsMusig2Nonce(keyPair, params = { deterministic: false }) {
        return this.setMusig2NoncesInner(keyPair, 'derived', undefined, params);
    }
    /**
     * Generates and sets MuSig2 nonce to all taproot key path inputs. Other inputs will be skipped.
     *
     * @param inputIndex input index
     * @param keyPair HD root key pair
     * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
     * (converted to an array of 32 bytes), or 32 uniformly random bytes.
     */
    setAllInputsMusig2NonceHD(keyPair, params = { deterministic: false }) {
        return this.setMusig2NoncesInner(keyPair, 'root', undefined, params);
    }
    clone() {
        return super.clone();
    }
    extractTransaction(disableFeeCheck = true) {
        const tx = super.extractTransaction(disableFeeCheck);
        if (tx instanceof UtxoTransaction_1.UtxoTransaction) {
            return tx;
        }
        throw new Error('extractTransaction did not return instace of UtxoTransaction');
    }
}
exports.UtxoPsbt = UtxoPsbt;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXR4b1BzYnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vVXR4b1BzYnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQWlDO0FBQ2pDLG1DQUEwQztBQVExQyxnREFBcUQ7QUFDckQsK0RBQXNFO0FBRXRFLGlDQUFxRDtBQUNyRCx1Q0FBdUM7QUFDdkMsd0VBQThGO0FBRTlGLDBCQVlZO0FBQ1osdURBQW9EO0FBQ3BELHVDQUFnRDtBQUNoRCxvREFBOEM7QUFDOUMsMERBQStDO0FBQy9DLG1EQUFtRDtBQUNuRCw2Q0FBa0Q7QUFDbEQscUNBa0JrQjtBQUNsQixtQ0FBMkQ7QUFDM0Qsd0NBQWlEO0FBQ2pELHlDQU9vQjtBQVlwQixTQUFTLG1CQUFtQjtJQUMxQixPQUFPLENBQUMsZUFBVyxDQUFDLGVBQWUsRUFBRSxlQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQUVELFNBQVMsNEJBQTRCLENBQUMsT0FBZ0IsRUFBRSxZQUFzQjtJQUM1RSxRQUFRLElBQUEsY0FBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzNCLEtBQUssWUFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLFlBQVEsQ0FBQyxTQUFTLENBQUM7UUFDeEIsS0FBSyxZQUFRLENBQUMsV0FBVyxDQUFDO1FBQzFCLEtBQUssWUFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTyxDQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLGlDQUFlLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUMzRjtZQUNFLE9BQU8sWUFBWSxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsT0FBZ0IsRUFBRSxDQUF1QztJQUNsRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQUUsT0FBTyxpQkFB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O0lBQ2xGLENBQUM7Q0FDRjtBQWxwQ0QsNEJBa3BDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgeyBQc2J0IGFzIFBzYnRCYXNlIH0gZnJvbSAnYmlwMTc0JztcclxuaW1wb3J0IHtcclxuICBCaXAzMkRlcml2YXRpb24sXHJcbiAgUHNidElucHV0LFxyXG4gIFRhcEJpcDMyRGVyaXZhdGlvbixcclxuICBUcmFuc2FjdGlvbiBhcyBJVHJhbnNhY3Rpb24sXHJcbiAgVHJhbnNhY3Rpb25Gcm9tQnVmZmVyLFxyXG59IGZyb20gJ2JpcDE3NC9zcmMvbGliL2ludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBjaGVja0ZvcklucHV0IH0gZnJvbSAnYmlwMTc0L3NyYy9saWIvdXRpbHMnO1xyXG5pbXBvcnQgeyBCdWZmZXJXcml0ZXIsIHZhcnVpbnQgfSBmcm9tICdiaXRjb2luanMtbGliL3NyYy9idWZmZXJ1dGlscyc7XHJcbmltcG9ydCB7IFNlc3Npb25LZXkgfSBmcm9tICdAYnJhbmRvbmJsYWNrL211c2lnJztcclxuaW1wb3J0IHsgQklQMzJGYWN0b3J5LCBCSVAzMkludGVyZmFjZSB9IGZyb20gJ2JpcDMyJztcclxuaW1wb3J0ICogYXMgYnM1OGNoZWNrIGZyb20gJ2JzNThjaGVjayc7XHJcbmltcG9ydCB7IGRlY29kZVByb3ByaWV0YXJ5S2V5LCBlbmNvZGVQcm9wcmlldGFyeUtleSB9IGZyb20gJ2JpcDE3NC9zcmMvbGliL3Byb3ByaWV0YXJ5S2V5VmFsJztcclxuXHJcbmltcG9ydCB7XHJcbiAgdGFwcm9vdCxcclxuICBIRFNpZ25lcixcclxuICBTaWduZXIsXHJcbiAgUHNidCxcclxuICBQc2J0VHJhbnNhY3Rpb24sXHJcbiAgVHJhbnNhY3Rpb24sXHJcbiAgVHhPdXRwdXQsXHJcbiAgTmV0d29yayxcclxuICBlY2MgYXMgZWNjTGliLFxyXG4gIGdldE1haW5uZXQsXHJcbiAgbmV0d29ya3MsXHJcbn0gZnJvbSAnLi4nO1xyXG5pbXBvcnQgeyBVdHhvVHJhbnNhY3Rpb24gfSBmcm9tICcuL1V0eG9UcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IGdldE91dHB1dElkRm9ySW5wdXQgfSBmcm9tICcuL1Vuc3BlbnQnO1xyXG5pbXBvcnQgeyBpc1NlZ3dpdCB9IGZyb20gJy4vcHNidC9zY3JpcHRUeXBlcyc7XHJcbmltcG9ydCB7IHVuc2lnbiB9IGZyb20gJy4vcHNidC9mcm9tSGFsZlNpZ25lZCc7XHJcbmltcG9ydCB7IHRvWE9ubHlQdWJsaWNLZXkgfSBmcm9tICcuL291dHB1dFNjcmlwdHMnO1xyXG5pbXBvcnQgeyBwYXJzZVB1YlNjcmlwdDJPZjMgfSBmcm9tICcuL3BhcnNlSW5wdXQnO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZU11c2lnMlNpZ25pbmdTZXNzaW9uLFxyXG4gIGVuY29kZVBzYnRNdXNpZzJQYXJ0aWFsU2lnLFxyXG4gIGVuY29kZVBzYnRNdXNpZzJQdWJOb25jZSxcclxuICBtdXNpZzJQYXJ0aWFsU2lnbixcclxuICBwYXJzZVBzYnRNdXNpZzJOb25jZXMsXHJcbiAgcGFyc2VQc2J0TXVzaWcyUGFydGljaXBhbnRzLFxyXG4gIFBzYnRNdXNpZzJQYXJ0aWNpcGFudHMsXHJcbiAgYXNzZXJ0UHNidE11c2lnMk5vbmNlcyxcclxuICBhc3NlcnRQc2J0TXVzaWcyUGFydGljaXBhbnRzLFxyXG4gIE11c2lnMk5vbmNlU3RvcmUsXHJcbiAgUHNidE11c2lnMlB1Yk5vbmNlLFxyXG4gIHBhcnNlUHNidE11c2lnMlBhcnRpYWxTaWdzLFxyXG4gIG11c2lnMlBhcnRpYWxTaWdWZXJpZnksXHJcbiAgbXVzaWcyQWdncmVnYXRlU2lncyxcclxuICBnZXRTaWdIYXNoVHlwZUZyb21TaWdzLFxyXG4gIG11c2lnMkRldGVybWluaXN0aWNTaWduLFxyXG4gIGNyZWF0ZU11c2lnMkRldGVybWluaXN0aWNOb25jZSxcclxufSBmcm9tICcuL011c2lnMic7XHJcbmltcG9ydCB7IGlzVHJpcGxlLCBpc1R1cGxlLCBUcmlwbGUsIFR1cGxlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdldFRhcHJvb3RPdXRwdXRLZXkgfSBmcm9tICcuLi90YXByb290JztcclxuaW1wb3J0IHtcclxuICBnZXRQc2J0SW5wdXRQcm9wcmlldGFyeUtleVZhbHMsXHJcbiAgZ2V0UHNidElucHV0U2lnbmF0dXJlQ291bnQsXHJcbiAgUHJvcHJpZXRhcnlLZXlTZWFyY2gsXHJcbiAgUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLFxyXG4gIFByb3ByaWV0YXJ5S2V5VmFsdWUsXHJcbiAgUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSLFxyXG59IGZyb20gJy4vUHNidFV0aWwnO1xyXG5cclxudHlwZSBTaWduYXR1cmVQYXJhbXMgPSB7XHJcbiAgLyoqIFdoZW4gdHJ1ZSwgYW5kIGFkZCB0aGUgc2Vjb25kIChsYXN0KSBub25jZSBhbmQgc2lnbmF0dXJlIGZvciBhIHRhcHJvb3Qga2V5XHJcbiAgICogcGF0aCBzcGVuZCBkZXRlcm1pbmlzdGljYWxseS4gVGhyb3dzIGFuIGVycm9yIGlmIGRvbmUgZm9yIHRoZSBmaXJzdCBub25jZS9zaWduYXR1cmVcclxuICAgKiBvZiBhIHRhcHJvb3Qga2V5cGF0aCBzcGVuZC4gSWdub3JlIGZvciBhbGwgb3RoZXIgaW5wdXQgdHlwZXMuXHJcbiAgICovXHJcbiAgZGV0ZXJtaW5pc3RpYzogYm9vbGVhbjtcclxuICAvKiogQWxsb3dlZCBzaWdoYXNoIHR5cGVzICovXHJcbiAgc2lnaGFzaFR5cGVzOiBudW1iZXJbXTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGRlZmF1bHRTaWdoYXNoVHlwZXMoKTogbnVtYmVyW10ge1xyXG4gIHJldHVybiBbVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxULCBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTF07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEZvcmtJZFRvU2lnaGFzaGVzSWZOZWVkZWQobmV0d29yazogTmV0d29yaywgc2lnaGFzaFR5cGVzOiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICByZXR1cm4gWy4uLnNpZ2hhc2hUeXBlcywgLi4uc2lnaGFzaFR5cGVzLm1hcCgocykgPT4gcyB8IFV0eG9UcmFuc2FjdGlvbi5TSUdIQVNIX0ZPUktJRCldO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIHNpZ2hhc2hUeXBlcztcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvU2lnbmF0dXJlUGFyYW1zKG5ldHdvcms6IE5ldHdvcmssIHY/OiBQYXJ0aWFsPFNpZ25hdHVyZVBhcmFtcz4gfCBudW1iZXJbXSk6IFNpZ25hdHVyZVBhcmFtcyB7XHJcbiAgaWYgKEFycmF5LmlzQXJyYXkodikpIHJldHVybiB0b1NpZ25hdHVyZVBhcmFtcyhuZXR3b3JrLCB7IHNpZ2hhc2hUeXBlczogdiB9KTtcclxuICBjb25zdCBkZWZhdWx0U2lnbmF0dXJlUGFyYW1zID0geyBkZXRlcm1pbmlzdGljOiBmYWxzZSwgc2lnaGFzaFR5cGVzOiBkZWZhdWx0U2lnaGFzaFR5cGVzKCkgfTtcclxuICBjb25zdCByZXQgPSB7IC4uLmRlZmF1bHRTaWduYXR1cmVQYXJhbXMsIC4uLnYgfTtcclxuICByZXQuc2lnaGFzaFR5cGVzID0gYWRkRm9ya0lkVG9TaWdoYXNoZXNJZk5lZWRlZChuZXR3b3JrLCByZXQuc2lnaGFzaFR5cGVzKTtcclxuICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIGFcclxuICogQHBhcmFtIGJcclxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgdHdvIHB1YmxpYyBrZXlzIGFyZSBlcXVhbCBpZ25vcmluZyB0aGUgeSBjb29yZGluYXRlLlxyXG4gKi9cclxuZnVuY3Rpb24gZXF1YWxQdWJsaWNLZXlJZ25vcmVZKGE6IEJ1ZmZlciwgYjogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIHRvWE9ubHlQdWJsaWNLZXkoYSkuZXF1YWxzKHRvWE9ubHlQdWJsaWNLZXkoYikpO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhEVGFwcm9vdFNpZ25lciBleHRlbmRzIEhEU2lnbmVyIHtcclxuICAvKipcclxuICAgKiBUaGUgcGF0aCBzdHJpbmcgbXVzdCBtYXRjaCAvXm0oXFwvXFxkKyc/KSskL1xyXG4gICAqIGV4LiBtLzQ0Jy8wJy8wJy8xLzIzIGxldmVscyB3aXRoICcgbXVzdCBiZSBoYXJkIGRlcml2YXRpb25zXHJcbiAgICovXHJcbiAgZGVyaXZlUGF0aChwYXRoOiBzdHJpbmcpOiBIRFRhcHJvb3RTaWduZXI7XHJcbiAgLyoqXHJcbiAgICogSW5wdXQgaGFzaCAodGhlIFwibWVzc2FnZSBkaWdlc3RcIikgZm9yIHRoZSBzaWduYXR1cmUgYWxnb3JpdGhtXHJcbiAgICogUmV0dXJuIGEgNjQgYnl0ZSBzaWduYXR1cmUgKDMyIGJ5dGUgciBhbmQgMzIgYnl0ZSBzIGluIHRoYXQgb3JkZXIpXHJcbiAgICovXHJcbiAgc2lnblNjaG5vcnIoaGFzaDogQnVmZmVyKTogQnVmZmVyO1xyXG59XHJcblxyXG4vKipcclxuICogSEQgc2lnbmVyIG9iamVjdCBmb3IgdGFwcm9vdCBwMnRyIG11c2lnMiBrZXkgcGF0aCBzaWduXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEhEVGFwcm9vdE11c2lnMlNpZ25lciBleHRlbmRzIEhEU2lnbmVyIHtcclxuICAvKipcclxuICAgKiBNdXNpZzIgcmVxdWlyZXMgc2lnbmVyJ3MgMzItYnl0ZXMgcHJpdmF0ZSBrZXkgdG8gYmUgcGFzc2VkIHRvIGl0LlxyXG4gICAqL1xyXG4gIHByaXZhdGVLZXk6IEJ1ZmZlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHBhdGggc3RyaW5nIG11c3QgbWF0Y2ggL15tKFxcL1xcZCsnPykrJC9cclxuICAgKiBleC4gbS80NCcvMCcvMCcvMS8yMyBsZXZlbHMgd2l0aCAnIG11c3QgYmUgaGFyZCBkZXJpdmF0aW9uc1xyXG4gICAqL1xyXG4gIGRlcml2ZVBhdGgocGF0aDogc3RyaW5nKTogSERUYXByb290TXVzaWcyU2lnbmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNjaG5vcnJTaWduZXIge1xyXG4gIHB1YmxpY0tleTogQnVmZmVyO1xyXG4gIHNpZ25TY2hub3JyKGhhc2g6IEJ1ZmZlcik6IEJ1ZmZlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNdXNpZzJTaWduZXIge1xyXG4gIHB1YmxpY0tleTogQnVmZmVyO1xyXG4gIHByaXZhdGVLZXk6IEJ1ZmZlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUYXByb290U2lnbmVyIHtcclxuICBsZWFmSGFzaGVzOiBCdWZmZXJbXTtcclxuICBzaWduZXI6IFNjaG5vcnJTaWduZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHNidE9wdHMge1xyXG4gIG5ldHdvcms6IE5ldHdvcms7XHJcbiAgbWF4aW11bUZlZVJhdGU/OiBudW1iZXI7IC8vIFtzYXQvYnl0ZV1cclxuICBiaXAzMlBhdGhzQWJzb2x1dGU/OiBib29sZWFuO1xyXG59XHJcblxyXG4vLyBUT0RPOiB1cHN0cmVhbSBkb2VzIGBjaGVja0lucHV0c0ZvclBhcnRpYWxTaWdzYCBiZWZvcmUgZG9pbmcgdGhpbmdzIGxpa2VcclxuLy8gYHNldFZlcnNpb25gLiBPdXIgaW5wdXRzIGNvdWxkIGhhdmUgdGFwc2NyaXB0c2lncyAob3IgaW4gZnV0dXJlIHRhcGtleXNpZ3MpXHJcbi8vIGFuZCBub3QgZmFpbCB0aGF0IGNoZWNrLiBEbyB3ZSB3YW50IHRvIGRvIGFueXRoaW5nIGFib3V0IHRoYXQ/XHJcbmV4cG9ydCBjbGFzcyBVdHhvUHNidDxUeCBleHRlbmRzIFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+ID0gVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4+IGV4dGVuZHMgUHNidCB7XHJcbiAgcHJpdmF0ZSBub25jZVN0b3JlID0gbmV3IE11c2lnMk5vbmNlU3RvcmUoKTtcclxuXHJcbiAgcHJvdGVjdGVkIHN0YXRpYyB0cmFuc2FjdGlvbkZyb21CdWZmZXIoYnVmZmVyOiBCdWZmZXIsIG5ldHdvcms6IE5ldHdvcmspOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PiB7XHJcbiAgICByZXR1cm4gVXR4b1RyYW5zYWN0aW9uLmZyb21CdWZmZXI8YmlnaW50PihidWZmZXIsIGZhbHNlLCAnYmlnaW50JywgbmV0d29yayk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY3JlYXRlUHNidChvcHRzOiBQc2J0T3B0cywgZGF0YT86IFBzYnRCYXNlKTogVXR4b1BzYnQge1xyXG4gICAgcmV0dXJuIG5ldyBVdHhvUHNidChcclxuICAgICAgb3B0cyxcclxuICAgICAgZGF0YSB8fCBuZXcgUHNidEJhc2UobmV3IFBzYnRUcmFuc2FjdGlvbih7IHR4OiBuZXcgVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4ob3B0cy5uZXR3b3JrKSB9KSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUJ1ZmZlcihidWZmZXI6IEJ1ZmZlciwgb3B0czogUHNidE9wdHMpOiBVdHhvUHNidCB7XHJcbiAgICBjb25zdCB0cmFuc2FjdGlvbkZyb21CdWZmZXI6IFRyYW5zYWN0aW9uRnJvbUJ1ZmZlciA9IChidWZmZXI6IEJ1ZmZlcik6IElUcmFuc2FjdGlvbiA9PiB7XHJcbiAgICAgIGNvbnN0IHR4ID0gdGhpcy50cmFuc2FjdGlvbkZyb21CdWZmZXIoYnVmZmVyLCBvcHRzLm5ldHdvcmspO1xyXG4gICAgICByZXR1cm4gbmV3IFBzYnRUcmFuc2FjdGlvbih7IHR4IH0pO1xyXG4gICAgfTtcclxuICAgIGNvbnN0IHBzYnRCYXNlID0gUHNidEJhc2UuZnJvbUJ1ZmZlcihidWZmZXIsIHRyYW5zYWN0aW9uRnJvbUJ1ZmZlciwge1xyXG4gICAgICBiaXAzMlBhdGhzQWJzb2x1dGU6IG9wdHMuYmlwMzJQYXRoc0Fic29sdXRlLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBwc2J0ID0gdGhpcy5jcmVhdGVQc2J0KG9wdHMsIHBzYnRCYXNlKTtcclxuICAgIC8vIFVwc3RyZWFtIGNoZWNrcyBmb3IgZHVwbGljYXRlIGlucHV0cyBoZXJlLCBidXQgaXQgc2VlbXMgdG8gYmUgb2YgZHViaW91cyB2YWx1ZS5cclxuICAgIHJldHVybiBwc2J0O1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZyb21IZXgoZGF0YTogc3RyaW5nLCBvcHRzOiBQc2J0T3B0cyk6IFV0eG9Qc2J0IHtcclxuICAgIHJldHVybiB0aGlzLmZyb21CdWZmZXIoQnVmZmVyLmZyb20oZGF0YSwgJ2hleCcpLCBvcHRzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBwYXJlbnQgLSBQYXJlbnQga2V5LiBNYXRjaGVkIHdpdGggYGJpcDMyRGVyaXZhdGlvbnNgIHVzaW5nIGBmaW5nZXJwcmludGAgcHJvcGVydHkuXHJcbiAgICogQHBhcmFtIGJpcDMyRGVyaXZhdGlvbnMgLSBwb3NzaWJsZSBkZXJpdmF0aW9ucyBmb3IgaW5wdXQgb3Igb3V0cHV0XHJcbiAgICogQHBhcmFtIGlnbm9yZVkgLSB3aGVuIHRydWUsIGlnbm9yZSB0aGUgeSBjb29yZGluYXRlIHdoZW4gbWF0Y2hpbmcgcHVibGljIGtleXNcclxuICAgKiBAcmV0dXJuIGRlcml2ZWQgYmlwMzIgbm9kZSBpZiBtYXRjaGluZyBkZXJpdmF0aW9uIGlzIGZvdW5kLCB1bmRlZmluZWQgaWYgbm9uZSBpcyBmb3VuZFxyXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgbW9yZSB0aGFuIG9uZSBtYXRjaCBpcyBmb3VuZFxyXG4gICAqL1xyXG4gIHN0YXRpYyBkZXJpdmVLZXlQYWlyKFxyXG4gICAgcGFyZW50OiBCSVAzMkludGVyZmFjZSxcclxuICAgIGJpcDMyRGVyaXZhdGlvbnM6IEJpcDMyRGVyaXZhdGlvbltdLFxyXG4gICAgeyBpZ25vcmVZIH06IHsgaWdub3JlWTogYm9vbGVhbiB9XHJcbiAgKTogQklQMzJJbnRlcmZhY2UgfCB1bmRlZmluZWQge1xyXG4gICAgY29uc3QgbWF0Y2hpbmdEZXJpdmF0aW9ucyA9IGJpcDMyRGVyaXZhdGlvbnMuZmlsdGVyKChiaXBEdikgPT4ge1xyXG4gICAgICByZXR1cm4gYmlwRHYubWFzdGVyRmluZ2VycHJpbnQuZXF1YWxzKHBhcmVudC5maW5nZXJwcmludCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIW1hdGNoaW5nRGVyaXZhdGlvbnMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIE5vIGZpbmdlcnByaW50IG1hdGNoXHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1hdGNoaW5nRGVyaXZhdGlvbnMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgbW9yZSB0aGFuIG9uZSBtYXRjaGluZyBkZXJpdmF0aW9uIGZvciBmaW5nZXJwcmludCAke3BhcmVudC5maW5nZXJwcmludC50b1N0cmluZygnaGV4Jyl9OiAke1xyXG4gICAgICAgICAgbWF0Y2hpbmdEZXJpdmF0aW9ucy5sZW5ndGhcclxuICAgICAgICB9YFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IFtkZXJpdmF0aW9uXSA9IG1hdGNoaW5nRGVyaXZhdGlvbnM7XHJcbiAgICBjb25zdCBub2RlID0gcGFyZW50LmRlcml2ZVBhdGgoZGVyaXZhdGlvbi5wYXRoKTtcclxuXHJcbiAgICBpZiAoIW5vZGUucHVibGljS2V5LmVxdWFscyhkZXJpdmF0aW9uLnB1YmtleSkpIHtcclxuICAgICAgaWYgKCFpZ25vcmVZIHx8ICFlcXVhbFB1YmxpY0tleUlnbm9yZVkobm9kZS5wdWJsaWNLZXksIGRlcml2YXRpb24ucHVia2V5KSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncHVia2V5IGRpZCBub3QgbWF0Y2ggYmlwMzJEZXJpdmF0aW9uJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBkZXJpdmVLZXlQYWlyRm9ySW5wdXQoYmlwMzI6IEJJUDMySW50ZXJmYWNlLCBpbnB1dDogUHNidElucHV0KTogQnVmZmVyIHwgdW5kZWZpbmVkIHtcclxuICAgIHJldHVybiBpbnB1dC50YXBCaXAzMkRlcml2YXRpb24/Lmxlbmd0aFxyXG4gICAgICA/IFV0eG9Qc2J0LmRlcml2ZUtleVBhaXIoYmlwMzIsIGlucHV0LnRhcEJpcDMyRGVyaXZhdGlvbiwgeyBpZ25vcmVZOiB0cnVlIH0pPy5wdWJsaWNLZXlcclxuICAgICAgOiBpbnB1dC5iaXAzMkRlcml2YXRpb24/Lmxlbmd0aFxyXG4gICAgICA/IFV0eG9Qc2J0LmRlcml2ZUtleVBhaXIoYmlwMzIsIGlucHV0LmJpcDMyRGVyaXZhdGlvbiwgeyBpZ25vcmVZOiBmYWxzZSB9KT8ucHVibGljS2V5XHJcbiAgICAgIDogYmlwMzI/LnB1YmxpY0tleTtcclxuICB9XHJcblxyXG4gIGdldCBuZXR3b3JrKCk6IE5ldHdvcmsge1xyXG4gICAgcmV0dXJuIHRoaXMudHgubmV0d29yaztcclxuICB9XHJcblxyXG4gIHRvSGV4KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEl0IGlzIGV4cGVuc2l2ZSB0byBhdHRlbXB0IHRvIGNvbXB1dGUgZXZlcnkgb3V0cHV0IGFkZHJlc3MgdXNpbmcgcHNidC50eE91dHB1dHNbb3V0cHV0SW5kZXhdXHJcbiAgICogdG8gdGhlbiBqdXN0IGdldCB0aGUgc2NyaXB0LiBIZXJlLCB3ZSBhcmUgZG9pbmcgdGhlIHNhbWUgdGhpbmcgYXMgd2hhdCB0eE91dHB1dHMoKSBkb2VzIGluXHJcbiAgICogYml0Y29pbmpzLWxpYiwgYnV0IHdpdGhvdXQgaXRlcmF0aW5nIG92ZXIgZWFjaCBvdXRwdXQuXHJcbiAgICogQHBhcmFtIG91dHB1dEluZGV4XHJcbiAgICogQHJldHVybnMgb3V0cHV0IHNjcmlwdCBhdCB0aGUgZ2l2ZW4gaW5kZXhcclxuICAgKi9cclxuICBnZXRPdXRwdXRTY3JpcHQob3V0cHV0SW5kZXg6IG51bWJlcik6IEJ1ZmZlciB7XHJcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55KS5fX0NBQ0hFLl9fVFgub3V0c1tvdXRwdXRJbmRleF0uc2NyaXB0IGFzIEJ1ZmZlcjtcclxuICB9XHJcblxyXG4gIGdldE5vbldpdG5lc3NQcmV2aW91c1R4aWRzKCk6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IHR4SW5wdXRzID0gdGhpcy50eElucHV0czsgLy8gVGhlc2UgYXJlIHNvbWV3aGF0IGNvc3RseSB0byBleHRyYWN0XHJcbiAgICBjb25zdCB0eGlkU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICB0aGlzLmRhdGEuaW5wdXRzLmZvckVhY2goKGlucHV0LCBpbmRleCkgPT4ge1xyXG4gICAgICBpZiAoIWlucHV0LndpdG5lc3NVdHhvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IGhhdmUgd2l0bmVzcyBVVFhPIGZvciBhbGwgaW5wdXRzJyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCFpc1NlZ3dpdChpbnB1dC53aXRuZXNzVXR4by5zY3JpcHQsIGlucHV0LnJlZGVlbVNjcmlwdCkpIHtcclxuICAgICAgICB0eGlkU2V0LmFkZChnZXRPdXRwdXRJZEZvcklucHV0KHR4SW5wdXRzW2luZGV4XSkudHhpZCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFsuLi50eGlkU2V0XTtcclxuICB9XHJcblxyXG4gIGFkZE5vbldpdG5lc3NVdHhvcyh0eEJ1ZnM6IFJlY29yZDxzdHJpbmcsIEJ1ZmZlcj4pOiB0aGlzIHtcclxuICAgIGNvbnN0IHR4SW5wdXRzID0gdGhpcy50eElucHV0czsgLy8gVGhlc2UgYXJlIHNvbWV3aGF0IGNvc3RseSB0byBleHRyYWN0XHJcbiAgICB0aGlzLmRhdGEuaW5wdXRzLmZvckVhY2goKGlucHV0LCBpbmRleCkgPT4ge1xyXG4gICAgICBpZiAoIWlucHV0LndpdG5lc3NVdHhvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IGhhdmUgd2l0bmVzcyBVVFhPIGZvciBhbGwgaW5wdXRzJyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCFpc1NlZ3dpdChpbnB1dC53aXRuZXNzVXR4by5zY3JpcHQsIGlucHV0LnJlZGVlbVNjcmlwdCkpIHtcclxuICAgICAgICBjb25zdCB7IHR4aWQgfSA9IGdldE91dHB1dElkRm9ySW5wdXQodHhJbnB1dHNbaW5kZXhdKTtcclxuICAgICAgICBpZiAodHhCdWZzW3R4aWRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGFsbCByZXF1aXJlZCBwcmV2aW91cyB0cmFuc2FjdGlvbnMgcHJvdmlkZWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVJbnB1dChpbmRleCwgeyBub25XaXRuZXNzVXR4bzogdHhCdWZzW3R4aWRdIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZyb21UcmFuc2FjdGlvbih0cmFuc2FjdGlvbjogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4sIHByZXZPdXRwdXRzOiBUeE91dHB1dDxiaWdpbnQ+W10pOiBVdHhvUHNidCB7XHJcbiAgICBpZiAocHJldk91dHB1dHMubGVuZ3RoICE9PSB0cmFuc2FjdGlvbi5pbnMubGVuZ3RoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgVHJhbnNhY3Rpb24gaGFzICR7dHJhbnNhY3Rpb24uaW5zLmxlbmd0aH0gaW5wdXRzLCBidXQgJHtwcmV2T3V0cHV0cy5sZW5ndGh9IHByZXZpb3VzIG91dHB1dHMgcHJvdmlkZWRgXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBjbG9uZWRUcmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uLmNsb25lKCk7XHJcbiAgICBjb25zdCB1cGRhdGVzID0gdW5zaWduKGNsb25lZFRyYW5zYWN0aW9uLCBwcmV2T3V0cHV0cyk7XHJcblxyXG4gICAgY29uc3QgcHNidEJhc2UgPSBuZXcgUHNidEJhc2UobmV3IFBzYnRUcmFuc2FjdGlvbih7IHR4OiBjbG9uZWRUcmFuc2FjdGlvbiB9KSk7XHJcbiAgICBjbG9uZWRUcmFuc2FjdGlvbi5pbnMuZm9yRWFjaCgoKSA9PiBwc2J0QmFzZS5pbnB1dHMucHVzaCh7IHVua25vd25LZXlWYWxzOiBbXSB9KSk7XHJcbiAgICBjbG9uZWRUcmFuc2FjdGlvbi5vdXRzLmZvckVhY2goKCkgPT4gcHNidEJhc2Uub3V0cHV0cy5wdXNoKHsgdW5rbm93bktleVZhbHM6IFtdIH0pKTtcclxuICAgIGNvbnN0IHBzYnQgPSB0aGlzLmNyZWF0ZVBzYnQoeyBuZXR3b3JrOiB0cmFuc2FjdGlvbi5uZXR3b3JrIH0sIHBzYnRCYXNlKTtcclxuXHJcbiAgICB1cGRhdGVzLmZvckVhY2goKHVwZGF0ZSwgaW5kZXgpID0+IHtcclxuICAgICAgcHNidC51cGRhdGVJbnB1dChpbmRleCwgdXBkYXRlKTtcclxuICAgICAgcHNidC51cGRhdGVJbnB1dChpbmRleCwgeyB3aXRuZXNzVXR4bzogeyBzY3JpcHQ6IHByZXZPdXRwdXRzW2luZGV4XS5zY3JpcHQsIHZhbHVlOiBwcmV2T3V0cHV0c1tpbmRleF0udmFsdWUgfSB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwc2J0O1xyXG4gIH1cclxuXHJcbiAgZ2V0VW5zaWduZWRUeCgpOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PiB7XHJcbiAgICByZXR1cm4gdGhpcy50eC5jbG9uZSgpO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHN0YXRpYyBuZXdUcmFuc2FjdGlvbihuZXR3b3JrOiBOZXR3b3JrKTogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4ge1xyXG4gICAgcmV0dXJuIG5ldyBVdHhvVHJhbnNhY3Rpb248YmlnaW50PihuZXR3b3JrKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZXQgdHgoKTogVHgge1xyXG4gICAgcmV0dXJuICh0aGlzLmRhdGEuZ2xvYmFsTWFwLnVuc2lnbmVkVHggYXMgUHNidFRyYW5zYWN0aW9uKS50eCBhcyBUeDtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBjaGVja0ZvclNpZ25hdHVyZXMocHJvcE5hbWU/OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIHRoaXMuZGF0YS5pbnB1dHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcclxuICAgICAgaWYgKGlucHV0LnRhcFNjcmlwdFNpZz8ubGVuZ3RoIHx8IGlucHV0LnRhcEtleVNpZyB8fCBpbnB1dC5wYXJ0aWFsU2lnPy5sZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBtb2RpZnkgJHtwcm9wTmFtZSA/PyAndHJhbnNhY3Rpb24nfSAtIHNpZ25hdHVyZXMgZXhpc3QuYCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgaW5wdXQgYXQgaW5wdXRJbmRleCBpcyBhIHRhcHJvb3Qga2V5IHBhdGguXHJcbiAgICogQ2hlY2tzIGZvciBwcmVzZW5jZSBvZiBtaW5pbXVtIHJlcXVpcmVkIGtleSBwYXRoIGlucHV0IGZpZWxkcyBhbmQgYWJzZW5jZSBvZiBhbnkgc2NyaXB0IHBhdGggb25seSBpbnB1dCBmaWVsZHMuXHJcbiAgICovXHJcbiAgaXNUYXByb290S2V5UGF0aElucHV0KGlucHV0SW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgaW5wdXQgPSBjaGVja0ZvcklucHV0KHRoaXMuZGF0YS5pbnB1dHMsIGlucHV0SW5kZXgpO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgISFpbnB1dC50YXBJbnRlcm5hbEtleSAmJlxyXG4gICAgICAhIWlucHV0LnRhcE1lcmtsZVJvb3QgJiZcclxuICAgICAgIShcclxuICAgICAgICBpbnB1dC50YXBMZWFmU2NyaXB0Py5sZW5ndGggfHxcclxuICAgICAgICBpbnB1dC50YXBTY3JpcHRTaWc/Lmxlbmd0aCB8fFxyXG4gICAgICAgIGlucHV0LnRhcEJpcDMyRGVyaXZhdGlvbj8uc29tZSgodikgPT4gdi5sZWFmSGFzaGVzLmxlbmd0aClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIGlucHV0IGF0IGlucHV0SW5kZXggaXMgYSB0YXByb290IHNjcmlwdCBwYXRoLlxyXG4gICAqIENoZWNrcyBmb3IgcHJlc2VuY2Ugb2YgbWluaW11bSByZXF1aXJlZCBzY3JpcHQgcGF0aCBpbnB1dCBmaWVsZHMgYW5kIGFic2VuY2Ugb2YgYW55IGtleSBwYXRoIG9ubHkgaW5wdXQgZmllbGRzLlxyXG4gICAqL1xyXG4gIGlzVGFwcm9vdFNjcmlwdFBhdGhJbnB1dChpbnB1dEluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGlucHV0ID0gY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICEhaW5wdXQudGFwTGVhZlNjcmlwdD8ubGVuZ3RoICYmXHJcbiAgICAgICEoXHJcbiAgICAgICAgdGhpcy5nZXRQcm9wcmlldGFyeUtleVZhbHMoaW5wdXRJbmRleCwge1xyXG4gICAgICAgICAgaWRlbnRpZmllcjogUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSLFxyXG4gICAgICAgICAgc3VidHlwZTogUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLk1VU0lHMl9QQVJUSUNJUEFOVF9QVUJfS0VZUyxcclxuICAgICAgICB9KS5sZW5ndGggfHxcclxuICAgICAgICB0aGlzLmdldFByb3ByaWV0YXJ5S2V5VmFscyhpbnB1dEluZGV4LCB7XHJcbiAgICAgICAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICAgICAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BVQl9OT05DRSxcclxuICAgICAgICB9KS5sZW5ndGggfHxcclxuICAgICAgICB0aGlzLmdldFByb3ByaWV0YXJ5S2V5VmFscyhpbnB1dEluZGV4LCB7XHJcbiAgICAgICAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICAgICAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BBUlRJQUxfU0lHLFxyXG4gICAgICAgIH0pLmxlbmd0aFxyXG4gICAgICApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgaW5wdXQgYXQgaW5wdXRJbmRleCBpcyBhIHRhcHJvb3RcclxuICAgKi9cclxuICBpc1RhcHJvb3RJbnB1dChpbnB1dEluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGlucHV0ID0gY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIGNvbnN0IGlzUDJUUiA9IChzY3JpcHQ6IEJ1ZmZlcik6IGJvb2xlYW4gPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGdldFRhcHJvb3RPdXRwdXRLZXkoc2NyaXB0KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiAhIShcclxuICAgICAgaW5wdXQudGFwSW50ZXJuYWxLZXkgfHxcclxuICAgICAgaW5wdXQudGFwTWVya2xlUm9vdCB8fFxyXG4gICAgICBpbnB1dC50YXBMZWFmU2NyaXB0Py5sZW5ndGggfHxcclxuICAgICAgaW5wdXQudGFwQmlwMzJEZXJpdmF0aW9uPy5sZW5ndGggfHxcclxuICAgICAgaW5wdXQudGFwU2NyaXB0U2lnPy5sZW5ndGggfHxcclxuICAgICAgdGhpcy5nZXRQcm9wcmlldGFyeUtleVZhbHMoaW5wdXRJbmRleCwge1xyXG4gICAgICAgIGlkZW50aWZpZXI6IFBTQlRfUFJPUFJJRVRBUllfSURFTlRJRklFUixcclxuICAgICAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BBUlRJQ0lQQU5UX1BVQl9LRVlTLFxyXG4gICAgICB9KS5sZW5ndGggfHxcclxuICAgICAgdGhpcy5nZXRQcm9wcmlldGFyeUtleVZhbHMoaW5wdXRJbmRleCwge1xyXG4gICAgICAgIGlkZW50aWZpZXI6IFBTQlRfUFJPUFJJRVRBUllfSURFTlRJRklFUixcclxuICAgICAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BVQl9OT05DRSxcclxuICAgICAgfSkubGVuZ3RoIHx8XHJcbiAgICAgIHRoaXMuZ2V0UHJvcHJpZXRhcnlLZXlWYWxzKGlucHV0SW5kZXgsIHtcclxuICAgICAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICAgICAgc3VidHlwZTogUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLk1VU0lHMl9QQVJUSUFMX1NJRyxcclxuICAgICAgfSkubGVuZ3RoIHx8XHJcbiAgICAgIChpbnB1dC53aXRuZXNzVXR4byAmJiBpc1AyVFIoaW5wdXQud2l0bmVzc1V0eG8uc2NyaXB0KSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGlzTXVsdGlzaWdUYXByb290U2NyaXB0KHNjcmlwdDogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBwYXJzZVB1YlNjcmlwdDJPZjMoc2NyaXB0LCAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9zdGx5IGNvcGllZCBmcm9tIGJpdGNvaW5qcy1saWIvdHNfc3JjL3BzYnQudHNcclxuICAgKi9cclxuICBmaW5hbGl6ZUFsbElucHV0cygpOiB0aGlzIHtcclxuICAgIGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgMCk7IC8vIG1ha2luZyBzdXJlIHdlIGhhdmUgYXQgbGVhc3Qgb25lXHJcbiAgICB0aGlzLmRhdGEuaW5wdXRzLm1hcCgoaW5wdXQsIGlkeCkgPT4ge1xyXG4gICAgICBpZiAoaW5wdXQudGFwTGVhZlNjcmlwdD8ubGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNNdWx0aXNpZ1RhcHJvb3RTY3JpcHQoaW5wdXQudGFwTGVhZlNjcmlwdFswXS5zY3JpcHQpXHJcbiAgICAgICAgICA/IHRoaXMuZmluYWxpemVUYXByb290SW5wdXQoaWR4KVxyXG4gICAgICAgICAgOiB0aGlzLmZpbmFsaXplVGFwSW5wdXRXaXRoU2luZ2xlTGVhZlNjcmlwdEFuZFNpZ25hdHVyZShpZHgpO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNUYXByb290S2V5UGF0aElucHV0KGlkeCkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5maW5hbGl6ZVRhcHJvb3RNdXNpZzJJbnB1dChpZHgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLmZpbmFsaXplSW5wdXQoaWR4KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBmaW5hbGl6ZVRhcHJvb3RJbnB1dChpbnB1dEluZGV4OiBudW1iZXIpOiB0aGlzIHtcclxuICAgIGNvbnN0IHNhbml0aXplU2lnbmF0dXJlID0gKHNpZzogQnVmZmVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IHNpZ2hhc2hUeXBlID0gc2lnLmxlbmd0aCA9PT0gNjQgPyBUcmFuc2FjdGlvbi5TSUdIQVNIX0RFRkFVTFQgOiBzaWcucmVhZFVJbnQ4KHNpZy5sZW5ndGggLSAxKTtcclxuICAgICAgY29uc3QgaW5wdXRTaWdoYXNoVHlwZSA9IGlucHV0LnNpZ2hhc2hUeXBlID09PSB1bmRlZmluZWQgPyBUcmFuc2FjdGlvbi5TSUdIQVNIX0RFRkFVTFQgOiBpbnB1dC5zaWdoYXNoVHlwZTtcclxuICAgICAgYXNzZXJ0KHNpZ2hhc2hUeXBlID09PSBpbnB1dFNpZ2hhc2hUeXBlLCAnc2lnbmF0dXJlIHNpZ2hhc2ggZG9lcyBub3QgbWF0Y2ggaW5wdXQgc2lnaGFzaCB0eXBlJyk7XHJcbiAgICAgIC8vIFRPRE8gQlRDLTY2MyBUaGlzIHNob3VsZCBiZSBmaXhlZCBpbiBwbGF0Zm9ybS4gVGhpcyBpcyBqdXN0IGEgd29ya2Fyb3VuZCBmaXguXHJcbiAgICAgIHJldHVybiBzaWdoYXNoVHlwZSA9PT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxUICYmIHNpZy5sZW5ndGggPT09IDY1ID8gc2lnLnNsaWNlKDAsIDY0KSA6IHNpZztcclxuICAgIH07XHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICAvLyB3aXRuZXNzID0gY29udHJvbC1ibG9jayBzY3JpcHQgZmlyc3Qtc2lnIHNlY29uZC1zaWdcclxuICAgIGlmIChpbnB1dC50YXBMZWFmU2NyaXB0Py5sZW5ndGggIT09IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IG9uZSBsZWFmIHNjcmlwdCBzdXBwb3J0ZWQgZm9yIGZpbmFsaXppbmcnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHsgY29udHJvbEJsb2NrLCBzY3JpcHQgfSA9IGlucHV0LnRhcExlYWZTY3JpcHRbMF07XHJcbiAgICBjb25zdCB3aXRuZXNzOiBCdWZmZXJbXSA9IFtzY3JpcHQsIGNvbnRyb2xCbG9ja107XHJcbiAgICBjb25zdCBbcHVia2V5MSwgcHVia2V5Ml0gPSBwYXJzZVB1YlNjcmlwdDJPZjMoc2NyaXB0LCAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcpLnB1YmxpY0tleXM7XHJcbiAgICBmb3IgKGNvbnN0IHBrIG9mIFtwdWJrZXkxLCBwdWJrZXkyXSkge1xyXG4gICAgICBjb25zdCBzaWcgPSBpbnB1dC50YXBTY3JpcHRTaWc/LmZpbmQoKHsgcHVia2V5IH0pID0+IGVxdWFsUHVibGljS2V5SWdub3JlWShwaywgcHVia2V5KSk7XHJcbiAgICAgIGlmICghc2lnKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBzaWduYXR1cmVzIGluIFNjcmlwdCBTaWcuJyk7XHJcbiAgICAgIH1cclxuICAgICAgd2l0bmVzcy51bnNoaWZ0KHNhbml0aXplU2lnbmF0dXJlKHNpZy5zaWduYXR1cmUpKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3aXRuZXNzTGVuZ3RoID0gd2l0bmVzcy5yZWR1Y2UoKHMsIGIpID0+IHMgKyBiLmxlbmd0aCArIHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgoYi5sZW5ndGgpLCAxKTtcclxuXHJcbiAgICBjb25zdCBidWZmZXJXcml0ZXIgPSBCdWZmZXJXcml0ZXIud2l0aENhcGFjaXR5KHdpdG5lc3NMZW5ndGgpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVmVjdG9yKHdpdG5lc3MpO1xyXG4gICAgY29uc3QgZmluYWxTY3JpcHRXaXRuZXNzID0gYnVmZmVyV3JpdGVyLmVuZCgpO1xyXG5cclxuICAgIHRoaXMuZGF0YS51cGRhdGVJbnB1dChpbnB1dEluZGV4LCB7IGZpbmFsU2NyaXB0V2l0bmVzcyB9KTtcclxuICAgIHRoaXMuZGF0YS5jbGVhckZpbmFsaXplZElucHV0KGlucHV0SW5kZXgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluYWxpemVzIGEgdGFwcm9vdCBtdXNpZzIgaW5wdXQgYnkgYWdncmVnYXRpbmcgYWxsIHBhcnRpYWwgc2lncy5cclxuICAgKiBJTVBPUlRBTlQ6IEFsd2F5cyBjYWxsIHZhbGlkYXRlKiBmdW5jdGlvbiBiZWZvcmUgZmluYWxpemluZy5cclxuICAgKi9cclxuICBmaW5hbGl6ZVRhcHJvb3RNdXNpZzJJbnB1dChpbnB1dEluZGV4OiBudW1iZXIpOiB0aGlzIHtcclxuICAgIGNvbnN0IGlucHV0ID0gY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIGNvbnN0IHBhcnRpYWxTaWdzID0gcGFyc2VQc2J0TXVzaWcyUGFydGlhbFNpZ3MoaW5wdXQpO1xyXG4gICAgaWYgKHBhcnRpYWxTaWdzPy5sZW5ndGggIT09IDIpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG51bWJlciBvZiBwYXJ0aWFsIHNpZ25hdHVyZXMgJHtwYXJ0aWFsU2lncyA/IHBhcnRpYWxTaWdzLmxlbmd0aCA6IDB9IHRvIGZpbmFsaXplYCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB7IHBhcnRpYWxTaWdzOiBwU2lncywgc2lnSGFzaFR5cGUgfSA9IGdldFNpZ0hhc2hUeXBlRnJvbVNpZ3MocGFydGlhbFNpZ3MpO1xyXG4gICAgY29uc3QgeyBzZXNzaW9uS2V5IH0gPSB0aGlzLmdldE11c2lnMlNlc3Npb25LZXkoaW5wdXRJbmRleCwgc2lnSGFzaFR5cGUpO1xyXG5cclxuICAgIGNvbnN0IGFnZ1NpZyA9IG11c2lnMkFnZ3JlZ2F0ZVNpZ3MoXHJcbiAgICAgIHBTaWdzLm1hcCgocFNpZykgPT4gcFNpZy5wYXJ0aWFsU2lnKSxcclxuICAgICAgc2Vzc2lvbktleVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBzaWcgPSBzaWdIYXNoVHlwZSA9PT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxUID8gYWdnU2lnIDogQnVmZmVyLmNvbmNhdChbYWdnU2lnLCBCdWZmZXIub2Yoc2lnSGFzaFR5cGUpXSk7XHJcblxyXG4gICAgLy8gc2luZ2xlIHNpZ25hdHVyZSB3aXRoIDY0LzY1IGJ5dGVzIHNpemUgaXMgc2NyaXB0IHdpdG5lc3MgZm9yIGtleSBwYXRoIHNwZW5kXHJcbiAgICBjb25zdCBidWZmZXJXcml0ZXIgPSBCdWZmZXJXcml0ZXIud2l0aENhcGFjaXR5KDEgKyB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKHNpZy5sZW5ndGgpICsgc2lnLmxlbmd0aCk7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVWZWN0b3IoW3NpZ10pO1xyXG4gICAgY29uc3QgZmluYWxTY3JpcHRXaXRuZXNzID0gYnVmZmVyV3JpdGVyLmVuZCgpO1xyXG5cclxuICAgIHRoaXMuZGF0YS51cGRhdGVJbnB1dChpbnB1dEluZGV4LCB7IGZpbmFsU2NyaXB0V2l0bmVzcyB9KTtcclxuICAgIHRoaXMuZGF0YS5jbGVhckZpbmFsaXplZElucHV0KGlucHV0SW5kZXgpO1xyXG4gICAgLy8gZGVsZXRpbmcgb25seSBCaXRHbyBwcm9wcmlldGFyeSBrZXkgdmFsdWVzLlxyXG4gICAgdGhpcy5kZWxldGVQcm9wcmlldGFyeUtleVZhbHMoaW5wdXRJbmRleCwgeyBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIGZpbmFsaXplVGFwSW5wdXRXaXRoU2luZ2xlTGVhZlNjcmlwdEFuZFNpZ25hdHVyZShpbnB1dEluZGV4OiBudW1iZXIpOiB0aGlzIHtcclxuICAgIGNvbnN0IGlucHV0ID0gY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIGlmIChpbnB1dC50YXBMZWFmU2NyaXB0Py5sZW5ndGggIT09IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IG9uZSBsZWFmIHNjcmlwdCBzdXBwb3J0ZWQgZm9yIGZpbmFsaXppbmcnKTtcclxuICAgIH1cclxuICAgIGlmIChpbnB1dC50YXBTY3JpcHRTaWc/Lmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHNpZ25hdHVyZXMgaW4gU2NyaXB0IFNpZy4nKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGNvbnRyb2xCbG9jaywgc2NyaXB0IH0gPSBpbnB1dC50YXBMZWFmU2NyaXB0WzBdO1xyXG4gICAgY29uc3Qgd2l0bmVzczogQnVmZmVyW10gPSBbaW5wdXQudGFwU2NyaXB0U2lnWzBdLnNpZ25hdHVyZSwgc2NyaXB0LCBjb250cm9sQmxvY2tdO1xyXG4gICAgY29uc3Qgd2l0bmVzc0xlbmd0aCA9IHdpdG5lc3MucmVkdWNlKChzLCBiKSA9PiBzICsgYi5sZW5ndGggKyB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKGIubGVuZ3RoKSwgMSk7XHJcblxyXG4gICAgY29uc3QgYnVmZmVyV3JpdGVyID0gQnVmZmVyV3JpdGVyLndpdGhDYXBhY2l0eSh3aXRuZXNzTGVuZ3RoKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVZlY3Rvcih3aXRuZXNzKTtcclxuICAgIGNvbnN0IGZpbmFsU2NyaXB0V2l0bmVzcyA9IGJ1ZmZlcldyaXRlci5lbmQoKTtcclxuXHJcbiAgICB0aGlzLmRhdGEudXBkYXRlSW5wdXQoaW5wdXRJbmRleCwgeyBmaW5hbFNjcmlwdFdpdG5lc3MgfSk7XHJcbiAgICB0aGlzLmRhdGEuY2xlYXJGaW5hbGl6ZWRJbnB1dChpbnB1dEluZGV4KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vc3RseSBjb3BpZWQgZnJvbSBiaXRjb2luanMtbGliL3RzX3NyYy9wc2J0LnRzXHJcbiAgICpcclxuICAgKiBVbmxpa2UgdGhlIGZ1bmN0aW9uIGl0IG92ZXJyaWRlcywgdGhpcyBkb2VzIG5vdCB0YWtlIGEgdmFsaWRhdG9yLiBJbiBCaXRHb1xyXG4gICAqIGNvbnRleHQsIHdlIGtub3cgaG93IHdlIHdhbnQgdG8gdmFsaWRhdGUgc28gd2UganVzdCBoYXJkIGNvZGUgdGhlIHJpZ2h0XHJcbiAgICogdmFsaWRhdG9yLlxyXG4gICAqL1xyXG4gIHZhbGlkYXRlU2lnbmF0dXJlc09mQWxsSW5wdXRzKCk6IGJvb2xlYW4ge1xyXG4gICAgY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCAwKTsgLy8gbWFraW5nIHN1cmUgd2UgaGF2ZSBhdCBsZWFzdCBvbmVcclxuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLmRhdGEuaW5wdXRzLm1hcCgoaW5wdXQsIGlkeCkgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVNpZ25hdHVyZXNPZklucHV0Q29tbW9uKGlkeCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHRzLnJlZHVjZSgoZmluYWwsIHJlcykgPT4gcmVzICYmIGZpbmFsLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm5zIHRydWUgaWZmIGFueSBtYXRjaGluZyB2YWxpZCBzaWduYXR1cmUgaXMgZm91bmQgZm9yIGEgZGVyaXZlZCBwdWIga2V5IGZyb20gZ2l2ZW4gSEQga2V5IHBhaXIuXHJcbiAgICovXHJcbiAgdmFsaWRhdGVTaWduYXR1cmVzT2ZJbnB1dEhEKGlucHV0SW5kZXg6IG51bWJlciwgaGRLZXlQYWlyOiBCSVAzMkludGVyZmFjZSk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgaW5wdXQgPSBjaGVja0ZvcklucHV0KHRoaXMuZGF0YS5pbnB1dHMsIGlucHV0SW5kZXgpO1xyXG4gICAgY29uc3QgcHViS2V5ID0gVXR4b1BzYnQuZGVyaXZlS2V5UGFpckZvcklucHV0KGhkS2V5UGFpciwgaW5wdXQpO1xyXG4gICAgaWYgKCFwdWJLZXkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW4gbm90IGRlcml2ZSBmcm9tIEhEIGtleSBwYWlyJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVNpZ25hdHVyZXNPZklucHV0Q29tbW9uKGlucHV0SW5kZXgsIHB1YktleSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJucyB0cnVlIGlmZiBhbnkgdmFsaWQgc2lnbmF0dXJlKHMpIGFyZSBmb3VuZCBmcm9tIGJpcDMyIGRhdGEgb2YgUFNCVCBvciBmb3IgZ2l2ZW4gcHViIGtleS5cclxuICAgKi9cclxuICB2YWxpZGF0ZVNpZ25hdHVyZXNPZklucHV0Q29tbW9uKGlucHV0SW5kZXg6IG51bWJlciwgcHVia2V5PzogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAodGhpcy5pc1RhcHJvb3RTY3JpcHRQYXRoSW5wdXQoaW5wdXRJbmRleCkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVRhcHJvb3RTaWduYXR1cmVzT2ZJbnB1dChpbnB1dEluZGV4LCBwdWJrZXkpO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNUYXByb290S2V5UGF0aElucHV0KGlucHV0SW5kZXgpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVUYXByb290TXVzaWcyU2lnbmF0dXJlc09mSW5wdXQoaW5wdXRJbmRleCwgcHVia2V5KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVNpZ25hdHVyZXNPZklucHV0KGlucHV0SW5kZXgsIChwLCBtLCBzKSA9PiBlY2NMaWIudmVyaWZ5KG0sIHAsIHMsIHRydWUpLCBwdWJrZXkpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIE5vdCBhbiBlbGVnYW50IHNvbHV0aW9uLiBNaWdodCBuZWVkIHVwc3RyZWFtIGNoYW5nZXMgbGlrZSBjdXN0b20gZXJyb3IgdHlwZXMuXHJcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gJ05vIHNpZ25hdHVyZXMgZm9yIHRoaXMgcHVia2V5Jykge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE11c2lnMlNlc3Npb25LZXkoXHJcbiAgICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgICBzaWdIYXNoVHlwZTogbnVtYmVyXHJcbiAgKToge1xyXG4gICAgcGFydGljaXBhbnRzOiBQc2J0TXVzaWcyUGFydGljaXBhbnRzO1xyXG4gICAgbm9uY2VzOiBUdXBsZTxQc2J0TXVzaWcyUHViTm9uY2U+O1xyXG4gICAgaGFzaDogQnVmZmVyO1xyXG4gICAgc2Vzc2lvbktleTogU2Vzc2lvbktleTtcclxuICB9IHtcclxuICAgIGNvbnN0IGlucHV0ID0gY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIGlmICghaW5wdXQudGFwSW50ZXJuYWxLZXkgfHwgIWlucHV0LnRhcE1lcmtsZVJvb3QpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdib3RoIHRhcEludGVybmFsS2V5IGFuZCB0YXBNZXJrbGVSb290IGFyZSByZXF1aXJlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcnRpY2lwYW50cyA9IHRoaXMuZ2V0TXVzaWcyUGFydGljaXBhbnRzKGlucHV0SW5kZXgsIGlucHV0LnRhcEludGVybmFsS2V5LCBpbnB1dC50YXBNZXJrbGVSb290KTtcclxuICAgIGNvbnN0IG5vbmNlcyA9IHRoaXMuZ2V0TXVzaWcyTm9uY2VzKGlucHV0SW5kZXgsIHBhcnRpY2lwYW50cyk7XHJcblxyXG4gICAgY29uc3QgeyBoYXNoIH0gPSB0aGlzLmdldFRhcHJvb3RIYXNoRm9yU2lnKGlucHV0SW5kZXgsIFtzaWdIYXNoVHlwZV0pO1xyXG5cclxuICAgIGNvbnN0IHNlc3Npb25LZXkgPSBjcmVhdGVNdXNpZzJTaWduaW5nU2Vzc2lvbih7XHJcbiAgICAgIHB1Yk5vbmNlczogW25vbmNlc1swXS5wdWJOb25jZSwgbm9uY2VzWzFdLnB1Yk5vbmNlXSxcclxuICAgICAgcHViS2V5czogcGFydGljaXBhbnRzLnBhcnRpY2lwYW50UHViS2V5cyxcclxuICAgICAgdHhIYXNoOiBoYXNoLFxyXG4gICAgICBpbnRlcm5hbFB1YktleTogaW5wdXQudGFwSW50ZXJuYWxLZXksXHJcbiAgICAgIHRhcFRyZWVSb290OiBpbnB1dC50YXBNZXJrbGVSb290LFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4geyBwYXJ0aWNpcGFudHMsIG5vbmNlcywgaGFzaCwgc2Vzc2lvbktleSB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybnMgdHJ1ZSBmb3IgZm9sbG93aW5nIGNhc2VzLlxyXG4gICAqIElmIHZhbGlkIG11c2lnMiBwYXJ0aWFsIHNpZ25hdHVyZXMgZXhpc3RzIGZvciBib3RoIDIga2V5cywgaXQgd2lsbCBhbHNvIHZlcmlmeSBhZ2dyZWdhdGVkIHNpZ1xyXG4gICAqIGZvciBhZ2dyZWdhdGVkIHR3ZWFrZWQga2V5IChvdXRwdXQga2V5KSwgb3RoZXJ3aXNlIG9ubHkgdmVyaWZpZXMgcGFydGlhbCBzaWcuXHJcbiAgICogSWYgcHVia2V5IGlzIHBhc3NlZCBpbiBpbnB1dCwgaXQgd2lsbCBjaGVjayBzaWcgb25seSBmb3IgdGhhdCBwdWJrZXksXHJcbiAgICogaWYgbm8gc2lnIGV4aXRzIGZvciBzdWNoIGtleSwgdGhyb3dzIGVycm9yLlxyXG4gICAqIEZvciBpbnZhbGlkIHN0YXRlIG9mIGlucHV0IGRhdGEsIGl0IHdpbGwgdGhyb3cgZXJyb3JzLlxyXG4gICAqL1xyXG4gIHZhbGlkYXRlVGFwcm9vdE11c2lnMlNpZ25hdHVyZXNPZklucHV0KGlucHV0SW5kZXg6IG51bWJlciwgcHVia2V5PzogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICBjb25zdCBwYXJ0aWFsU2lncyA9IHBhcnNlUHNidE11c2lnMlBhcnRpYWxTaWdzKGlucHV0KTtcclxuICAgIGlmICghcGFydGlhbFNpZ3MpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBzaWduYXR1cmVzIHRvIHZhbGlkYXRlYCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG15UGFydGlhbFNpZ3MgPSBwYXJ0aWFsU2lncztcclxuICAgIGlmIChwdWJrZXkpIHtcclxuICAgICAgbXlQYXJ0aWFsU2lncyA9IHBhcnRpYWxTaWdzLmZpbHRlcigoa3YpID0+IGVxdWFsUHVibGljS2V5SWdub3JlWShrdi5wYXJ0aWNpcGFudFB1YktleSwgcHVia2V5KSk7XHJcbiAgICAgIGlmIChteVBhcnRpYWxTaWdzPy5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzaWduYXR1cmVzIGZvciB0aGlzIHB1YmtleScpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBwYXJ0aWFsU2lnczogbXlTaWdzLCBzaWdIYXNoVHlwZSB9ID0gZ2V0U2lnSGFzaFR5cGVGcm9tU2lncyhteVBhcnRpYWxTaWdzKTtcclxuICAgIGNvbnN0IHsgcGFydGljaXBhbnRzLCBub25jZXMsIGhhc2gsIHNlc3Npb25LZXkgfSA9IHRoaXMuZ2V0TXVzaWcyU2Vzc2lvbktleShpbnB1dEluZGV4LCBzaWdIYXNoVHlwZSk7XHJcblxyXG4gICAgY29uc3QgcmVzdWx0cyA9IG15U2lncy5tYXAoKG15U2lnKSA9PiB7XHJcbiAgICAgIGNvbnN0IG15Tm9uY2UgPSBub25jZXMuZmluZCgoa3YpID0+IGVxdWFsUHVibGljS2V5SWdub3JlWShrdi5wYXJ0aWNpcGFudFB1YktleSwgbXlTaWcucGFydGljaXBhbnRQdWJLZXkpKTtcclxuICAgICAgaWYgKCFteU5vbmNlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCBubyBwdWIgbm9uY2UgZm9yIHB1YmtleScpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBtdXNpZzJQYXJ0aWFsU2lnVmVyaWZ5KG15U2lnLnBhcnRpYWxTaWcsIG15U2lnLnBhcnRpY2lwYW50UHViS2V5LCBteU5vbmNlLnB1Yk5vbmNlLCBzZXNzaW9uS2V5KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEZvciB2YWxpZCBzaW5nbGUgc2lnIG9yIDEgb3IgMiBmYWlsdXJlIHNpZ3MsIG5vIG5lZWQgdG8gdmFsaWRhdGUgYWdncmVnYXRlZCBzaWcuIFNvIHNraXAuXHJcbiAgICBjb25zdCByZXN1bHQgPSByZXN1bHRzLmV2ZXJ5KChyZXMpID0+IHJlcyk7XHJcbiAgICBpZiAoIXJlc3VsdCB8fCBteVNpZ3MubGVuZ3RoIDwgMikge1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFnZ1NpZyA9IG11c2lnMkFnZ3JlZ2F0ZVNpZ3MoXHJcbiAgICAgIG15U2lncy5tYXAoKG15U2lnKSA9PiBteVNpZy5wYXJ0aWFsU2lnKSxcclxuICAgICAgc2Vzc2lvbktleVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gZWNjTGliLnZlcmlmeVNjaG5vcnIoaGFzaCwgcGFydGljaXBhbnRzLnRhcE91dHB1dEtleSwgYWdnU2lnKTtcclxuICB9XHJcblxyXG4gIHZhbGlkYXRlVGFwcm9vdFNpZ25hdHVyZXNPZklucHV0KGlucHV0SW5kZXg6IG51bWJlciwgcHVia2V5PzogQnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBpbnB1dCA9IHRoaXMuZGF0YS5pbnB1dHNbaW5wdXRJbmRleF07XHJcbiAgICBjb25zdCB0YXBTaWdzID0gKGlucHV0IHx8IHt9KS50YXBTY3JpcHRTaWc7XHJcbiAgICBpZiAoIWlucHV0IHx8ICF0YXBTaWdzIHx8IHRhcFNpZ3MubGVuZ3RoIDwgMSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNpZ25hdHVyZXMgdG8gdmFsaWRhdGUnKTtcclxuICAgIH1cclxuICAgIGxldCBteVNpZ3M7XHJcbiAgICBpZiAocHVia2V5KSB7XHJcbiAgICAgIG15U2lncyA9IHRhcFNpZ3MuZmlsdGVyKChzaWcpID0+IGVxdWFsUHVibGljS2V5SWdub3JlWShzaWcucHVia2V5LCBwdWJrZXkpKTtcclxuICAgICAgaWYgKG15U2lncy5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzaWduYXR1cmVzIGZvciB0aGlzIHB1YmtleScpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBteVNpZ3MgPSB0YXBTaWdzO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzdWx0czogYm9vbGVhbltdID0gW107XHJcblxyXG4gICAgYXNzZXJ0KGlucHV0LnRhcExlYWZTY3JpcHQ/Lmxlbmd0aCA9PT0gMSwgYHNpbmdsZSB0YXBMZWFmU2NyaXB0IGlzIGV4cGVjdGVkLiBHb3QgJHtpbnB1dC50YXBMZWFmU2NyaXB0Py5sZW5ndGh9YCk7XHJcbiAgICBjb25zdCBbdGFwTGVhZlNjcmlwdF0gPSBpbnB1dC50YXBMZWFmU2NyaXB0O1xyXG4gICAgY29uc3QgcHViS2V5cyA9IHRoaXMuaXNNdWx0aXNpZ1RhcHJvb3RTY3JpcHQodGFwTGVhZlNjcmlwdC5zY3JpcHQpXHJcbiAgICAgID8gcGFyc2VQdWJTY3JpcHQyT2YzKHRhcExlYWZTY3JpcHQuc2NyaXB0LCAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcpLnB1YmxpY0tleXNcclxuICAgICAgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgZm9yIChjb25zdCBwU2lnIG9mIG15U2lncykge1xyXG4gICAgICBjb25zdCB7IHNpZ25hdHVyZSwgbGVhZkhhc2gsIHB1YmtleSB9ID0gcFNpZztcclxuICAgICAgaWYgKHB1YktleXMpIHtcclxuICAgICAgICBhc3NlcnQoXHJcbiAgICAgICAgICBwdWJLZXlzLmZpbmQoKHBrKSA9PiBwdWJrZXkuZXF1YWxzKHBrKSksXHJcbiAgICAgICAgICAncHVibGljIGtleSBub3QgZm91bmQgaW4gdGFwIGxlYWYgc2NyaXB0J1xyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IHNpZ0hhc2hUeXBlOiBudW1iZXI7XHJcbiAgICAgIGxldCBzaWc6IEJ1ZmZlcjtcclxuICAgICAgaWYgKHNpZ25hdHVyZS5sZW5ndGggPT09IDY1KSB7XHJcbiAgICAgICAgc2lnSGFzaFR5cGUgPSBzaWduYXR1cmVbNjRdO1xyXG4gICAgICAgIHNpZyA9IHNpZ25hdHVyZS5zbGljZSgwLCA2NCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2lnSGFzaFR5cGUgPSBUcmFuc2FjdGlvbi5TSUdIQVNIX0RFRkFVTFQ7XHJcbiAgICAgICAgc2lnID0gc2lnbmF0dXJlO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHsgaGFzaCB9ID0gdGhpcy5nZXRUYXByb290SGFzaEZvclNpZyhpbnB1dEluZGV4LCBbc2lnSGFzaFR5cGVdLCBsZWFmSGFzaCk7XHJcbiAgICAgIHJlc3VsdHMucHVzaChlY2NMaWIudmVyaWZ5U2Nobm9ycihoYXNoLCBwdWJrZXksIHNpZykpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdHMuZXZlcnkoKHJlcykgPT4gcmVzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBpbnB1dEluZGV4XHJcbiAgICogQHBhcmFtIHJvb3ROb2RlcyBvcHRpb25hbCBpbnB1dCByb290IGJpcDMyIG5vZGVzIHRvIHZlcmlmeSB3aXRoLiBJZiBpdCBpcyBub3QgcHJvdmlkZWQsIGdsb2JhbFhwdWIgd2lsbCBiZSB1c2VkLlxyXG4gICAqIEByZXR1cm4gYXJyYXkgb2YgYm9vbGVhbiB2YWx1ZXMuIFRydWUgd2hlbiBjb3JyZXNwb25kaW5nIGluZGV4IGluIGBwdWJsaWNLZXlzYCBoYXMgc2lnbmVkIHRoZSB0cmFuc2FjdGlvbi5cclxuICAgKiBJZiBubyBzaWduYXR1cmUgaW4gdGhlIHR4IG9yIG5vIHB1YmxpYyBrZXkgbWF0Y2hpbmcgc2lnbmF0dXJlLCB0aGUgdmFsaWRhdGlvbiBpcyBjb25zaWRlcmVkIGFzIGZhbHNlLlxyXG4gICAqL1xyXG4gIGdldFNpZ25hdHVyZVZhbGlkYXRpb25BcnJheShcclxuICAgIGlucHV0SW5kZXg6IG51bWJlcixcclxuICAgIHsgcm9vdE5vZGVzIH06IHsgcm9vdE5vZGVzPzogVHJpcGxlPEJJUDMySW50ZXJmYWNlPiB9ID0ge31cclxuICApOiBUcmlwbGU8Ym9vbGVhbj4ge1xyXG4gICAgaWYgKCFyb290Tm9kZXMgJiYgKCF0aGlzLmRhdGEuZ2xvYmFsTWFwLmdsb2JhbFhwdWI/Lmxlbmd0aCB8fCAhaXNUcmlwbGUodGhpcy5kYXRhLmdsb2JhbE1hcC5nbG9iYWxYcHViKSkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IHNpZ25hdHVyZSB2YWxpZGF0aW9uIGFycmF5IHdpdGhvdXQgMyBnbG9iYWwgeHB1YnMnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiaXAzMnMgPSByb290Tm9kZXNcclxuICAgICAgPyByb290Tm9kZXNcclxuICAgICAgOiB0aGlzLmRhdGEuZ2xvYmFsTWFwLmdsb2JhbFhwdWI/Lm1hcCgoeHB1YikgPT5cclxuICAgICAgICAgIEJJUDMyRmFjdG9yeShlY2NMaWIpLmZyb21CYXNlNTgoYnM1OGNoZWNrLmVuY29kZSh4cHViLmV4dGVuZGVkUHVia2V5KSlcclxuICAgICAgICApO1xyXG5cclxuICAgIGlmICghYmlwMzJzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignZWl0aGVyIGdsb2JhbE1hcCBvciByb290Tm9kZXMgaXMgcmVxdWlyZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICBpZiAoIWdldFBzYnRJbnB1dFNpZ25hdHVyZUNvdW50KGlucHV0KSkge1xyXG4gICAgICByZXR1cm4gW2ZhbHNlLCBmYWxzZSwgZmFsc2VdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBiaXAzMnMubWFwKChiaXAzMikgPT4ge1xyXG4gICAgICBjb25zdCBwdWJLZXkgPSBVdHhvUHNidC5kZXJpdmVLZXlQYWlyRm9ySW5wdXQoYmlwMzIsIGlucHV0KTtcclxuICAgICAgaWYgKCFwdWJLZXkpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVNpZ25hdHVyZXNPZklucHV0Q29tbW9uKGlucHV0SW5kZXgsIHB1YktleSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIE5vdCBhbiBlbGVnYW50IHNvbHV0aW9uLiBNaWdodCBuZWVkIHVwc3RyZWFtIGNoYW5nZXMgbGlrZSBjdXN0b20gZXJyb3IgdHlwZXMuXHJcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlID09PSAnTm8gc2lnbmF0dXJlcyBmb3IgdGhpcyBwdWJrZXknKSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IGVycjtcclxuICAgICAgfVxyXG4gICAgfSkgYXMgVHJpcGxlPGJvb2xlYW4+O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9zdGx5IGNvcGllZCBmcm9tIGJpdGNvaW5qcy1saWIvdHNfc3JjL3BzYnQudHNcclxuICAgKi9cclxuICBzaWduQWxsSW5wdXRzSEQoXHJcbiAgICBoZEtleVBhaXI6IEhEVGFwcm9vdFNpZ25lciB8IEhEVGFwcm9vdE11c2lnMlNpZ25lcixcclxuICAgIHBhcmFtcz86IG51bWJlcltdIHwgUGFydGlhbDxTaWduYXR1cmVQYXJhbXM+XHJcbiAgKTogdGhpcyB7XHJcbiAgICBpZiAoIWhkS2V5UGFpciB8fCAhaGRLZXlQYWlyLnB1YmxpY0tleSB8fCAhaGRLZXlQYWlyLmZpbmdlcnByaW50KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTmVlZCBIRFNpZ25lciB0byBzaWduIGlucHV0Jyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB7IHNpZ2hhc2hUeXBlcywgZGV0ZXJtaW5pc3RpYyB9ID0gdG9TaWduYXR1cmVQYXJhbXModGhpcy5uZXR3b3JrLCBwYXJhbXMpO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdHM6IGJvb2xlYW5bXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRhdGEuaW5wdXRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5zaWduSW5wdXRIRChpLCBoZEtleVBhaXIsIHsgc2lnaGFzaFR5cGVzLCBkZXRlcm1pbmlzdGljIH0pO1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCh0cnVlKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHJlc3VsdHMuZXZlcnkoKHYpID0+ICF2KSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGlucHV0cyB3ZXJlIHNpZ25lZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3N0bHkgY29waWVkIGZyb20gYml0Y29pbmpzLWxpYi90c19zcmMvcHNidC50czpzaWduSW5wdXRIRFxyXG4gICAqL1xyXG4gIHNpZ25UYXByb290SW5wdXRIRChcclxuICAgIGlucHV0SW5kZXg6IG51bWJlcixcclxuICAgIGhkS2V5UGFpcjogSERUYXByb290U2lnbmVyIHwgSERUYXByb290TXVzaWcyU2lnbmVyLFxyXG4gICAgeyBzaWdoYXNoVHlwZXMgPSBbVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxULCBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTF0sIGRldGVybWluaXN0aWMgPSBmYWxzZSB9ID0ge31cclxuICApOiB0aGlzIHtcclxuICAgIGlmICghdGhpcy5pc1RhcHJvb3RJbnB1dChpbnB1dEluZGV4KSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIHRhcHJvb3QgaW5wdXQnKTtcclxuICAgIH1cclxuICAgIGlmICghaGRLZXlQYWlyIHx8ICFoZEtleVBhaXIucHVibGljS2V5IHx8ICFoZEtleVBhaXIuZmluZ2VycHJpbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWVkIEhEU2lnbmVyIHRvIHNpZ24gaW5wdXQnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGlucHV0ID0gY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIGlmICghaW5wdXQudGFwQmlwMzJEZXJpdmF0aW9uIHx8IGlucHV0LnRhcEJpcDMyRGVyaXZhdGlvbi5sZW5ndGggPT09IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWVkIHRhcEJpcDMyRGVyaXZhdGlvbiB0byBzaWduIFRhcHJvb3Qgd2l0aCBIRCcpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbXlEZXJpdmF0aW9ucyA9IGlucHV0LnRhcEJpcDMyRGVyaXZhdGlvblxyXG4gICAgICAubWFwKChiaXBEdikgPT4ge1xyXG4gICAgICAgIGlmIChiaXBEdi5tYXN0ZXJGaW5nZXJwcmludC5lcXVhbHMoaGRLZXlQYWlyLmZpbmdlcnByaW50KSkge1xyXG4gICAgICAgICAgcmV0dXJuIGJpcER2O1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLmZpbHRlcigodikgPT4gISF2KSBhcyBUYXBCaXAzMkRlcml2YXRpb25bXTtcclxuICAgIGlmIChteURlcml2YXRpb25zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZWQgb25lIHRhcEJpcDMyRGVyaXZhdGlvbiBtYXN0ZXJGaW5nZXJwcmludCB0byBtYXRjaCB0aGUgSERTaWduZXIgZmluZ2VycHJpbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXREZXJpdmVkTm9kZShiaXBEdjogVGFwQmlwMzJEZXJpdmF0aW9uKTogSERUYXByb290TXVzaWcyU2lnbmVyIHwgSERUYXByb290U2lnbmVyIHtcclxuICAgICAgY29uc3Qgbm9kZSA9IGhkS2V5UGFpci5kZXJpdmVQYXRoKGJpcER2LnBhdGgpO1xyXG4gICAgICBpZiAoIWVxdWFsUHVibGljS2V5SWdub3JlWShiaXBEdi5wdWJrZXksIG5vZGUucHVibGljS2V5KSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncHVia2V5IGRpZCBub3QgbWF0Y2ggdGFwQmlwMzJEZXJpdmF0aW9uJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlucHV0LnRhcExlYWZTY3JpcHQ/Lmxlbmd0aCkge1xyXG4gICAgICBjb25zdCBzaWduZXJzOiBUYXByb290U2lnbmVyW10gPSBteURlcml2YXRpb25zLm1hcCgoYmlwRHYpID0+IHtcclxuICAgICAgICBjb25zdCBzaWduZXIgPSBnZXREZXJpdmVkTm9kZShiaXBEdik7XHJcbiAgICAgICAgaWYgKCEoJ3NpZ25TY2hub3JyJyBpbiBzaWduZXIpKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NpZ25TY2hub3JyIGZ1bmN0aW9uIGlzIHJlcXVpcmVkIHRvIHNpZ24gcDJ0cicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBzaWduZXIsIGxlYWZIYXNoZXM6IGJpcER2LmxlYWZIYXNoZXMgfTtcclxuICAgICAgfSk7XHJcbiAgICAgIHNpZ25lcnMuZm9yRWFjaCgoeyBzaWduZXIsIGxlYWZIYXNoZXMgfSkgPT4gdGhpcy5zaWduVGFwcm9vdElucHV0KGlucHV0SW5kZXgsIHNpZ25lciwgbGVhZkhhc2hlcywgc2lnaGFzaFR5cGVzKSk7XHJcbiAgICB9IGVsc2UgaWYgKGlucHV0LnRhcEludGVybmFsS2V5Py5sZW5ndGgpIHtcclxuICAgICAgY29uc3Qgc2lnbmVyczogTXVzaWcyU2lnbmVyW10gPSBteURlcml2YXRpb25zLm1hcCgoYmlwRHYpID0+IHtcclxuICAgICAgICBjb25zdCBzaWduZXIgPSBnZXREZXJpdmVkTm9kZShiaXBEdik7XHJcbiAgICAgICAgaWYgKCEoJ3ByaXZhdGVLZXknIGluIHNpZ25lcikgfHwgIXNpZ25lci5wcml2YXRlS2V5KSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ByaXZhdGVLZXkgaXMgcmVxdWlyZWQgdG8gc2lnbiBwMnRyIG11c2lnMicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2lnbmVyO1xyXG4gICAgICB9KTtcclxuICAgICAgc2lnbmVycy5mb3JFYWNoKChzaWduZXIpID0+IHRoaXMuc2lnblRhcHJvb3RNdXNpZzJJbnB1dChpbnB1dEluZGV4LCBzaWduZXIsIHsgc2lnaGFzaFR5cGVzLCBkZXRlcm1pbmlzdGljIH0pKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgc2lnbklucHV0KGlucHV0SW5kZXg6IG51bWJlciwga2V5UGFpcjogU2lnbmVyLCBzaWdoYXNoVHlwZXM/OiBudW1iZXJbXSk6IHRoaXMge1xyXG4gICAgY29uc3QgeyBzaWdoYXNoVHlwZXM6IHNpZ2hhc2hGb3JOZXR3b3JrIH0gPSB0b1NpZ25hdHVyZVBhcmFtcyh0aGlzLm5ldHdvcmssIHNpZ2hhc2hUeXBlcyk7XHJcbiAgICByZXR1cm4gc3VwZXIuc2lnbklucHV0KGlucHV0SW5kZXgsIGtleVBhaXIsIHNpZ2hhc2hGb3JOZXR3b3JrKTtcclxuICB9XHJcblxyXG4gIHNpZ25JbnB1dEhEKFxyXG4gICAgaW5wdXRJbmRleDogbnVtYmVyLFxyXG4gICAgaGRLZXlQYWlyOiBIRFRhcHJvb3RTaWduZXIgfCBIRFRhcHJvb3RNdXNpZzJTaWduZXIsXHJcbiAgICBwYXJhbXM/OiBudW1iZXJbXSB8IFBhcnRpYWw8U2lnbmF0dXJlUGFyYW1zPlxyXG4gICk6IHRoaXMge1xyXG4gICAgY29uc3QgeyBzaWdoYXNoVHlwZXMsIGRldGVybWluaXN0aWMgfSA9IHRvU2lnbmF0dXJlUGFyYW1zKHRoaXMubmV0d29yaywgcGFyYW1zKTtcclxuICAgIGlmICh0aGlzLmlzVGFwcm9vdElucHV0KGlucHV0SW5kZXgpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNpZ25UYXByb290SW5wdXRIRChpbnB1dEluZGV4LCBoZEtleVBhaXIsIHsgc2lnaGFzaFR5cGVzLCBkZXRlcm1pbmlzdGljIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN1cGVyLnNpZ25JbnB1dEhEKGlucHV0SW5kZXgsIGhkS2V5UGFpciwgc2lnaGFzaFR5cGVzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0TXVzaWcyUGFydGljaXBhbnRzKGlucHV0SW5kZXg6IG51bWJlciwgdGFwSW50ZXJuYWxLZXk6IEJ1ZmZlciwgdGFwTWVya2xlUm9vdDogQnVmZmVyKSB7XHJcbiAgICBjb25zdCBwYXJ0aWNpcGFudHNLZXlWYWxEYXRhID0gcGFyc2VQc2J0TXVzaWcyUGFydGljaXBhbnRzKHRoaXMuZGF0YS5pbnB1dHNbaW5wdXRJbmRleF0pO1xyXG4gICAgaWYgKCFwYXJ0aWNpcGFudHNLZXlWYWxEYXRhKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRm91bmQgMCBtYXRjaGluZyBwYXJ0aWNpcGFudCBrZXkgdmFsdWUgaW5zdGVhZCBvZiAxYCk7XHJcbiAgICB9XHJcbiAgICBhc3NlcnRQc2J0TXVzaWcyUGFydGljaXBhbnRzKHBhcnRpY2lwYW50c0tleVZhbERhdGEsIHRhcEludGVybmFsS2V5LCB0YXBNZXJrbGVSb290KTtcclxuICAgIHJldHVybiBwYXJ0aWNpcGFudHNLZXlWYWxEYXRhO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRNdXNpZzJOb25jZXMoaW5wdXRJbmRleDogbnVtYmVyLCBwYXJ0aWNpcGFudHNLZXlWYWxEYXRhOiBQc2J0TXVzaWcyUGFydGljaXBhbnRzKSB7XHJcbiAgICBjb25zdCBub25jZXNLZXlWYWxzRGF0YSA9IHBhcnNlUHNidE11c2lnMk5vbmNlcyh0aGlzLmRhdGEuaW5wdXRzW2lucHV0SW5kZXhdKTtcclxuICAgIGlmICghbm9uY2VzS2V5VmFsc0RhdGEgfHwgIWlzVHVwbGUobm9uY2VzS2V5VmFsc0RhdGEpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgRm91bmQgJHtub25jZXNLZXlWYWxzRGF0YT8ubGVuZ3RoID8gbm9uY2VzS2V5VmFsc0RhdGEubGVuZ3RoIDogMH0gbWF0Y2hpbmcgbm9uY2Uga2V5IHZhbHVlIGluc3RlYWQgb2YgMmBcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGFzc2VydFBzYnRNdXNpZzJOb25jZXMobm9uY2VzS2V5VmFsc0RhdGEsIHBhcnRpY2lwYW50c0tleVZhbERhdGEpO1xyXG4gICAgcmV0dXJuIG5vbmNlc0tleVZhbHNEYXRhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2lnbnMgcDJ0ciBtdXNpZzIga2V5IHBhdGggaW5wdXQgd2l0aCAyIGFnZ3JlZ2F0ZWQga2V5cy5cclxuICAgKlxyXG4gICAqIE5vdGU6IE9ubHkgY2FuIHNpZ24gZGV0ZXJtaW5pc3RpY2FsbHkgYXMgdGhlIGNvc2lnbmVyXHJcbiAgICogQHBhcmFtIGlucHV0SW5kZXhcclxuICAgKiBAcGFyYW0gc2lnbmVyIC0gWFkgcHVibGljIGtleSBhbmQgcHJpdmF0ZSBrZXkgYXJlIHJlcXVpcmVkXHJcbiAgICogQHBhcmFtIHNpZ2hhc2hUeXBlc1xyXG4gICAqIEBwYXJhbSBkZXRlcm1pbmlzdGljIElmIHRydWUsIHNpZ24gdGhlIG11c2lnIGlucHV0IGRldGVybWluaXN0aWNhbGx5XHJcbiAgICovXHJcbiAgc2lnblRhcHJvb3RNdXNpZzJJbnB1dChcclxuICAgIGlucHV0SW5kZXg6IG51bWJlcixcclxuICAgIHNpZ25lcjogTXVzaWcyU2lnbmVyLFxyXG4gICAgeyBzaWdoYXNoVHlwZXMgPSBbVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxULCBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTF0sIGRldGVybWluaXN0aWMgPSBmYWxzZSB9ID0ge31cclxuICApOiB0aGlzIHtcclxuICAgIGlmICghdGhpcy5pc1RhcHJvb3RLZXlQYXRoSW5wdXQoaW5wdXRJbmRleCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgYSB0YXByb290IG11c2lnMiBpbnB1dCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5kYXRhLmlucHV0c1tpbnB1dEluZGV4XTtcclxuXHJcbiAgICBpZiAoIWlucHV0LnRhcEludGVybmFsS2V5IHx8ICFpbnB1dC50YXBNZXJrbGVSb290KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyByZXF1aXJlZCBpbnB1dCBkYXRhJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0cmlldmUgYW5kIGNoZWNrIHRoYXQgd2UgaGF2ZSB0d28gcGFydGljaXBhbnQgbm9uY2VzXHJcbiAgICBjb25zdCBwYXJ0aWNpcGFudHMgPSB0aGlzLmdldE11c2lnMlBhcnRpY2lwYW50cyhpbnB1dEluZGV4LCBpbnB1dC50YXBJbnRlcm5hbEtleSwgaW5wdXQudGFwTWVya2xlUm9vdCk7XHJcbiAgICBjb25zdCB7IHRhcE91dHB1dEtleSwgcGFydGljaXBhbnRQdWJLZXlzIH0gPSBwYXJ0aWNpcGFudHM7XHJcbiAgICBjb25zdCBzaWduZXJQdWJLZXkgPSBwYXJ0aWNpcGFudFB1YktleXMuZmluZCgocHViS2V5KSA9PiBlcXVhbFB1YmxpY0tleUlnbm9yZVkocHViS2V5LCBzaWduZXIucHVibGljS2V5KSk7XHJcbiAgICBpZiAoIXNpZ25lclB1YktleSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NpZ25lciBwdWIga2V5IHNob3VsZCBtYXRjaCBvbmUgb2YgcGFydGljaXBhbnQgcHViIGtleXMnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBub25jZXMgPSB0aGlzLmdldE11c2lnMk5vbmNlcyhpbnB1dEluZGV4LCBwYXJ0aWNpcGFudHMpO1xyXG4gICAgY29uc3QgeyBoYXNoLCBzaWdoYXNoVHlwZSB9ID0gdGhpcy5nZXRUYXByb290SGFzaEZvclNpZyhpbnB1dEluZGV4LCBzaWdoYXNoVHlwZXMpO1xyXG5cclxuICAgIGxldCBwYXJ0aWFsU2lnOiBCdWZmZXI7XHJcbiAgICBpZiAoZGV0ZXJtaW5pc3RpYykge1xyXG4gICAgICBpZiAoIWVxdWFsUHVibGljS2V5SWdub3JlWShzaWduZXJQdWJLZXksIHBhcnRpY2lwYW50UHViS2V5c1sxXSkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbiBvbmx5IGFkZCBhIGRldGVybWluaXN0aWMgc2lnbmF0dXJlIG9uIHRoZSBjb3NpZ25lcicpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBmaXJzdFNpZ25lck5vbmNlID0gbm9uY2VzLmZpbmQoKG4pID0+IGVxdWFsUHVibGljS2V5SWdub3JlWShuLnBhcnRpY2lwYW50UHViS2V5LCBwYXJ0aWNpcGFudFB1YktleXNbMF0pKTtcclxuICAgICAgaWYgKCFmaXJzdFNpZ25lck5vbmNlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgZmluZCB0aGUgdXNlciBub25jZScpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXJ0aWFsU2lnID0gbXVzaWcyRGV0ZXJtaW5pc3RpY1NpZ24oe1xyXG4gICAgICAgIHByaXZhdGVLZXk6IHNpZ25lci5wcml2YXRlS2V5LFxyXG4gICAgICAgIG90aGVyTm9uY2U6IGZpcnN0U2lnbmVyTm9uY2UucHViTm9uY2UsXHJcbiAgICAgICAgcHVibGljS2V5czogcGFydGljaXBhbnRQdWJLZXlzLFxyXG4gICAgICAgIGludGVybmFsUHViS2V5OiBpbnB1dC50YXBJbnRlcm5hbEtleSxcclxuICAgICAgICB0YXBUcmVlUm9vdDogaW5wdXQudGFwTWVya2xlUm9vdCxcclxuICAgICAgICBoYXNoLFxyXG4gICAgICB9KS5zaWc7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBzZXNzaW9uS2V5ID0gY3JlYXRlTXVzaWcyU2lnbmluZ1Nlc3Npb24oe1xyXG4gICAgICAgIHB1Yk5vbmNlczogW25vbmNlc1swXS5wdWJOb25jZSwgbm9uY2VzWzFdLnB1Yk5vbmNlXSxcclxuICAgICAgICBwdWJLZXlzOiBwYXJ0aWNpcGFudFB1YktleXMsXHJcbiAgICAgICAgdHhIYXNoOiBoYXNoLFxyXG4gICAgICAgIGludGVybmFsUHViS2V5OiBpbnB1dC50YXBJbnRlcm5hbEtleSxcclxuICAgICAgICB0YXBUcmVlUm9vdDogaW5wdXQudGFwTWVya2xlUm9vdCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zdCBzaWduZXJOb25jZSA9IG5vbmNlcy5maW5kKChrdikgPT4gZXF1YWxQdWJsaWNLZXlJZ25vcmVZKGt2LnBhcnRpY2lwYW50UHViS2V5LCBzaWduZXJQdWJLZXkpKTtcclxuICAgICAgaWYgKCFzaWduZXJOb25jZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncHViTm9uY2UgaXMgbWlzc2luZy4gcmV0cnkgc2lnbmluZyBwcm9jZXNzJyk7XHJcbiAgICAgIH1cclxuICAgICAgcGFydGlhbFNpZyA9IG11c2lnMlBhcnRpYWxTaWduKHNpZ25lci5wcml2YXRlS2V5LCBzaWduZXJOb25jZS5wdWJOb25jZSwgc2Vzc2lvbktleSwgdGhpcy5ub25jZVN0b3JlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2lnaGFzaFR5cGUgIT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfREVGQVVMVCkge1xyXG4gICAgICBwYXJ0aWFsU2lnID0gQnVmZmVyLmNvbmNhdChbcGFydGlhbFNpZywgQnVmZmVyLm9mKHNpZ2hhc2hUeXBlKV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNpZyA9IGVuY29kZVBzYnRNdXNpZzJQYXJ0aWFsU2lnKHtcclxuICAgICAgcGFydGljaXBhbnRQdWJLZXk6IHNpZ25lclB1YktleSxcclxuICAgICAgdGFwT3V0cHV0S2V5LFxyXG4gICAgICBwYXJ0aWFsU2lnOiBwYXJ0aWFsU2lnLFxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmFkZFByb3ByaWV0YXJ5S2V5VmFsVG9JbnB1dChpbnB1dEluZGV4LCBzaWcpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBzaWduVGFwcm9vdElucHV0KFxyXG4gICAgaW5wdXRJbmRleDogbnVtYmVyLFxyXG4gICAgc2lnbmVyOiBTY2hub3JyU2lnbmVyLFxyXG4gICAgbGVhZkhhc2hlczogQnVmZmVyW10sXHJcbiAgICBzaWdoYXNoVHlwZXM6IG51bWJlcltdID0gW1RyYW5zYWN0aW9uLlNJR0hBU0hfREVGQVVMVCwgVHJhbnNhY3Rpb24uU0lHSEFTSF9BTExdXHJcbiAgKTogdGhpcyB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICAvLyBGaWd1cmUgb3V0IGlmIHRoaXMgaXMgc2NyaXB0IHBhdGggb3Igbm90LCBpZiBub3QsIHR3ZWFrIHRoZSBwcml2YXRlIGtleVxyXG4gICAgaWYgKCFpbnB1dC50YXBMZWFmU2NyaXB0Py5sZW5ndGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0YXBMZWFmU2NyaXB0IGlzIHJlcXVpcmVkIGZvciBwMnRyIHNjcmlwdCBwYXRoJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBwdWJrZXkgPSB0b1hPbmx5UHVibGljS2V5KHNpZ25lci5wdWJsaWNLZXkpO1xyXG4gICAgaWYgKGlucHV0LnRhcExlYWZTY3JpcHQubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBvbmUgbGVhZiBzY3JpcHQgc3VwcG9ydGVkIGZvciBzaWduaW5nJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBbdGFwTGVhZlNjcmlwdF0gPSBpbnB1dC50YXBMZWFmU2NyaXB0O1xyXG5cclxuICAgIGlmICh0aGlzLmlzTXVsdGlzaWdUYXByb290U2NyaXB0KHRhcExlYWZTY3JpcHQuc2NyaXB0KSkge1xyXG4gICAgICBjb25zdCBwdWJLZXlzID0gcGFyc2VQdWJTY3JpcHQyT2YzKHRhcExlYWZTY3JpcHQuc2NyaXB0LCAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcpLnB1YmxpY0tleXM7XHJcbiAgICAgIGFzc2VydChcclxuICAgICAgICBwdWJLZXlzLmZpbmQoKHBrKSA9PiBwdWJrZXkuZXF1YWxzKHBrKSksXHJcbiAgICAgICAgJ3B1YmxpYyBrZXkgbm90IGZvdW5kIGluIHRhcCBsZWFmIHNjcmlwdCdcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJzZWRDb250cm9sQmxvY2sgPSB0YXByb290LnBhcnNlQ29udHJvbEJsb2NrKGVjY0xpYiwgdGFwTGVhZlNjcmlwdC5jb250cm9sQmxvY2spO1xyXG4gICAgY29uc3QgeyBsZWFmVmVyc2lvbiB9ID0gcGFyc2VkQ29udHJvbEJsb2NrO1xyXG4gICAgaWYgKGxlYWZWZXJzaW9uICE9PSB0YXBMZWFmU2NyaXB0LmxlYWZWZXJzaW9uKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGFwIHNjcmlwdCBsZWFmIHZlcnNpb24gbWlzbWF0Y2ggd2l0aCBjb250cm9sIGJsb2NrJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsZWFmSGFzaCA9IHRhcHJvb3QuZ2V0VGFwbGVhZkhhc2goZWNjTGliLCBwYXJzZWRDb250cm9sQmxvY2ssIHRhcExlYWZTY3JpcHQuc2NyaXB0KTtcclxuICAgIGlmICghbGVhZkhhc2hlcy5maW5kKChsKSA9PiBsLmVxdWFscyhsZWFmSGFzaCkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2lnbmVyIGNhbm5vdCBzaWduIGZvciBsZWFmIGhhc2ggJHtsZWFmSGFzaC50b1N0cmluZygnaGV4Jyl9YCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB7IGhhc2gsIHNpZ2hhc2hUeXBlIH0gPSB0aGlzLmdldFRhcHJvb3RIYXNoRm9yU2lnKGlucHV0SW5kZXgsIHNpZ2hhc2hUeXBlcywgbGVhZkhhc2gpO1xyXG4gICAgbGV0IHNpZ25hdHVyZSA9IHNpZ25lci5zaWduU2Nobm9ycihoYXNoKTtcclxuICAgIGlmIChzaWdoYXNoVHlwZSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxUKSB7XHJcbiAgICAgIHNpZ25hdHVyZSA9IEJ1ZmZlci5jb25jYXQoW3NpZ25hdHVyZSwgQnVmZmVyLm9mKHNpZ2hhc2hUeXBlKV0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRhLnVwZGF0ZUlucHV0KGlucHV0SW5kZXgsIHtcclxuICAgICAgdGFwU2NyaXB0U2lnOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcHVia2V5LFxyXG4gICAgICAgICAgc2lnbmF0dXJlLFxyXG4gICAgICAgICAgbGVhZkhhc2gsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFRhcHJvb3RPdXRwdXRTY3JpcHQoaW5wdXRJbmRleDogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICBpZiAoaW5wdXQudGFwTGVhZlNjcmlwdD8ubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiB0YXByb290LmNyZWF0ZVRhcHJvb3RPdXRwdXRTY3JpcHQoe1xyXG4gICAgICAgIGNvbnRyb2xCbG9jazogaW5wdXQudGFwTGVhZlNjcmlwdFswXS5jb250cm9sQmxvY2ssXHJcbiAgICAgICAgbGVhZlNjcmlwdDogaW5wdXQudGFwTGVhZlNjcmlwdFswXS5zY3JpcHQsXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChpbnB1dC50YXBJbnRlcm5hbEtleSAmJiBpbnB1dC50YXBNZXJrbGVSb290KSB7XHJcbiAgICAgIHJldHVybiB0YXByb290LmNyZWF0ZVRhcHJvb3RPdXRwdXRTY3JpcHQoe1xyXG4gICAgICAgIGludGVybmFsUHViS2V5OiBpbnB1dC50YXBJbnRlcm5hbEtleSxcclxuICAgICAgICB0YXB0cmVlUm9vdDogaW5wdXQudGFwTWVya2xlUm9vdCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIHRhcHJvb3QgaW5wdXQnKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0VGFwcm9vdEhhc2hGb3JTaWcoXHJcbiAgICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgICBzaWdoYXNoVHlwZXM/OiBudW1iZXJbXSxcclxuICAgIGxlYWZIYXNoPzogQnVmZmVyXHJcbiAgKToge1xyXG4gICAgaGFzaDogQnVmZmVyO1xyXG4gICAgc2lnaGFzaFR5cGU6IG51bWJlcjtcclxuICB9IHtcclxuICAgIGlmICghdGhpcy5pc1RhcHJvb3RJbnB1dChpbnB1dEluZGV4KSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIHRhcHJvb3QgaW5wdXQnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHNpZ2hhc2hUeXBlID0gdGhpcy5kYXRhLmlucHV0c1tpbnB1dEluZGV4XS5zaWdoYXNoVHlwZSB8fCBUcmFuc2FjdGlvbi5TSUdIQVNIX0RFRkFVTFQ7XHJcbiAgICBpZiAoc2lnaGFzaFR5cGVzICYmIHNpZ2hhc2hUeXBlcy5pbmRleE9mKHNpZ2hhc2hUeXBlKSA8IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIGBTaWdoYXNoIHR5cGUgaXMgbm90IGFsbG93ZWQuIFJldHJ5IHRoZSBzaWduIG1ldGhvZCBwYXNzaW5nIHRoZSBgICtcclxuICAgICAgICAgIGBzaWdoYXNoVHlwZXMgYXJyYXkgb2Ygd2hpdGVsaXN0ZWQgdHlwZXMuIFNpZ2hhc2ggdHlwZTogJHtzaWdoYXNoVHlwZX1gXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB0eElucHV0cyA9IHRoaXMudHhJbnB1dHM7IC8vIFRoZXNlIGFyZSBzb21ld2hhdCBjb3N0bHkgdG8gZXh0cmFjdFxyXG4gICAgY29uc3QgcHJldm91dFNjcmlwdHM6IEJ1ZmZlcltdID0gW107XHJcbiAgICBjb25zdCBwcmV2b3V0VmFsdWVzOiBiaWdpbnRbXSA9IFtdO1xyXG5cclxuICAgIHRoaXMuZGF0YS5pbnB1dHMuZm9yRWFjaCgoaW5wdXQsIGkpID0+IHtcclxuICAgICAgbGV0IHByZXZvdXQ7XHJcbiAgICAgIGlmIChpbnB1dC5ub25XaXRuZXNzVXR4bykge1xyXG4gICAgICAgIC8vIFRPRE86IFRoaXMgY291bGQgYmUgY29zdGx5LCBlaXRoZXIgY2FjaGUgaXQgaGVyZSwgb3IgZmluZCBhIHdheSB0byBzaGFyZSB3aXRoIHN1cGVyXHJcbiAgICAgICAgY29uc3Qgbm9uV2l0bmVzc1V0eG9UeCA9ICh0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBVdHhvUHNidCkudHJhbnNhY3Rpb25Gcm9tQnVmZmVyKFxyXG4gICAgICAgICAgaW5wdXQubm9uV2l0bmVzc1V0eG8sXHJcbiAgICAgICAgICB0aGlzLnR4Lm5ldHdvcmtcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBwcmV2b3V0SGFzaCA9IHR4SW5wdXRzW2ldLmhhc2g7XHJcbiAgICAgICAgY29uc3QgdXR4b0hhc2ggPSBub25XaXRuZXNzVXR4b1R4LmdldEhhc2goKTtcclxuXHJcbiAgICAgICAgLy8gSWYgYSBub24td2l0bmVzcyBVVFhPIGlzIHByb3ZpZGVkLCBpdHMgaGFzaCBtdXN0IG1hdGNoIHRoZSBoYXNoIHNwZWNpZmllZCBpbiB0aGUgcHJldm91dFxyXG4gICAgICAgIGlmICghcHJldm91dEhhc2guZXF1YWxzKHV0eG9IYXNoKSkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb24td2l0bmVzcyBVVFhPIGhhc2ggZm9yIGlucHV0ICMke2l9IGRvZXNuJ3QgbWF0Y2ggdGhlIGhhc2ggc3BlY2lmaWVkIGluIHRoZSBwcmV2b3V0YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBwcmV2b3V0SW5kZXggPSB0eElucHV0c1tpXS5pbmRleDtcclxuICAgICAgICBwcmV2b3V0ID0gbm9uV2l0bmVzc1V0eG9UeC5vdXRzW3ByZXZvdXRJbmRleF07XHJcbiAgICAgIH0gZWxzZSBpZiAoaW5wdXQud2l0bmVzc1V0eG8pIHtcclxuICAgICAgICBwcmV2b3V0ID0gaW5wdXQud2l0bmVzc1V0eG87XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWVkIGEgVXR4byBpbnB1dCBpdGVtIGZvciBzaWduaW5nJyk7XHJcbiAgICAgIH1cclxuICAgICAgcHJldm91dFNjcmlwdHMucHVzaChwcmV2b3V0LnNjcmlwdCk7XHJcbiAgICAgIHByZXZvdXRWYWx1ZXMucHVzaChwcmV2b3V0LnZhbHVlKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3Qgb3V0cHV0U2NyaXB0ID0gdGhpcy5nZXRUYXByb290T3V0cHV0U2NyaXB0KGlucHV0SW5kZXgpO1xyXG4gICAgaWYgKCFvdXRwdXRTY3JpcHQuZXF1YWxzKHByZXZvdXRTY3JpcHRzW2lucHV0SW5kZXhdKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFdpdG5lc3Mgc2NyaXB0IGZvciBpbnB1dCAjJHtpbnB1dEluZGV4fSBkb2Vzbid0IG1hdGNoIHRoZSBzY3JpcHRQdWJLZXkgaW4gdGhlIHByZXZvdXRgKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGhhc2ggPSB0aGlzLnR4Lmhhc2hGb3JXaXRuZXNzVjEoaW5wdXRJbmRleCwgcHJldm91dFNjcmlwdHMsIHByZXZvdXRWYWx1ZXMsIHNpZ2hhc2hUeXBlLCBsZWFmSGFzaCk7XHJcbiAgICByZXR1cm4geyBoYXNoLCBzaWdoYXNoVHlwZSB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBwcm9wcmlldGFyeSBrZXkgdmFsdWUgcGFpciB0byBQU0JUIGlucHV0LlxyXG4gICAqIERlZmF1bHQgaWRlbnRpZmllckVuY29kaW5nIGlzIHV0Zi04IGZvciBpZGVudGlmaWVyLlxyXG4gICAqL1xyXG4gIGFkZFByb3ByaWV0YXJ5S2V5VmFsVG9JbnB1dChpbnB1dEluZGV4OiBudW1iZXIsIGtleVZhbHVlRGF0YTogUHJvcHJpZXRhcnlLZXlWYWx1ZSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkVW5rbm93bktleVZhbFRvSW5wdXQoaW5wdXRJbmRleCwge1xyXG4gICAgICBrZXk6IGVuY29kZVByb3ByaWV0YXJ5S2V5KGtleVZhbHVlRGF0YS5rZXkpLFxyXG4gICAgICB2YWx1ZToga2V5VmFsdWVEYXRhLnZhbHVlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIG9yIHVwZGF0ZXMgKGlmIGV4aXN0cykgcHJvcHJpZXRhcnkga2V5IHZhbHVlIHBhaXIgdG8gUFNCVCBpbnB1dC5cclxuICAgKiBEZWZhdWx0IGlkZW50aWZpZXJFbmNvZGluZyBpcyB1dGYtOCBmb3IgaWRlbnRpZmllci5cclxuICAgKi9cclxuICBhZGRPclVwZGF0ZVByb3ByaWV0YXJ5S2V5VmFsVG9JbnB1dChpbnB1dEluZGV4OiBudW1iZXIsIGtleVZhbHVlRGF0YTogUHJvcHJpZXRhcnlLZXlWYWx1ZSk6IHRoaXMge1xyXG4gICAgY29uc3QgaW5wdXQgPSBjaGVja0ZvcklucHV0KHRoaXMuZGF0YS5pbnB1dHMsIGlucHV0SW5kZXgpO1xyXG4gICAgY29uc3Qga2V5ID0gZW5jb2RlUHJvcHJpZXRhcnlLZXkoa2V5VmFsdWVEYXRhLmtleSk7XHJcbiAgICBjb25zdCB7IHZhbHVlIH0gPSBrZXlWYWx1ZURhdGE7XHJcbiAgICBpZiAoaW5wdXQudW5rbm93bktleVZhbHM/Lmxlbmd0aCkge1xyXG4gICAgICBjb25zdCB1a3ZJbmRleCA9IGlucHV0LnVua25vd25LZXlWYWxzLmZpbmRJbmRleCgodWt2KSA9PiB1a3Yua2V5LmVxdWFscyhrZXkpKTtcclxuICAgICAgaWYgKHVrdkluZGV4ID4gLTEpIHtcclxuICAgICAgICBpbnB1dC51bmtub3duS2V5VmFsc1t1a3ZJbmRleF0gPSB7IGtleSwgdmFsdWUgfTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5hZGRVbmtub3duS2V5VmFsVG9JbnB1dChpbnB1dEluZGV4LCB7XHJcbiAgICAgIGtleSxcclxuICAgICAgdmFsdWUsXHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVG8gc2VhcmNoIGFueSBkYXRhIGZyb20gcHJvcHJpZXRhcnkga2V5IHZhbHVlIGFnYWluc3Qga2V5ZGF0YS5cclxuICAgKiBEZWZhdWx0IGlkZW50aWZpZXJFbmNvZGluZyBpcyB1dGYtOCBmb3IgaWRlbnRpZmllci5cclxuICAgKi9cclxuICBnZXRQcm9wcmlldGFyeUtleVZhbHMoaW5wdXRJbmRleDogbnVtYmVyLCBrZXlTZWFyY2g/OiBQcm9wcmlldGFyeUtleVNlYXJjaCk6IFByb3ByaWV0YXJ5S2V5VmFsdWVbXSB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICByZXR1cm4gZ2V0UHNidElucHV0UHJvcHJpZXRhcnlLZXlWYWxzKGlucHV0LCBrZXlTZWFyY2gpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVG8gZGVsZXRlIGFueSBkYXRhIGZyb20gcHJvcHJpZXRhcnkga2V5IHZhbHVlLlxyXG4gICAqIERlZmF1bHQgaWRlbnRpZmllckVuY29kaW5nIGlzIHV0Zi04IGZvciBpZGVudGlmaWVyLlxyXG4gICAqL1xyXG4gIGRlbGV0ZVByb3ByaWV0YXJ5S2V5VmFscyhpbnB1dEluZGV4OiBudW1iZXIsIGtleXNUb0RlbGV0ZT86IFByb3ByaWV0YXJ5S2V5U2VhcmNoKTogdGhpcyB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGNoZWNrRm9ySW5wdXQodGhpcy5kYXRhLmlucHV0cywgaW5wdXRJbmRleCk7XHJcbiAgICBpZiAoIWlucHV0LnVua25vd25LZXlWYWxzPy5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBpZiAoa2V5c1RvRGVsZXRlICYmIGtleXNUb0RlbGV0ZS5zdWJ0eXBlID09PSB1bmRlZmluZWQgJiYgQnVmZmVyLmlzQnVmZmVyKGtleXNUb0RlbGV0ZS5rZXlkYXRhKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcHJvcHJpZXRhcnkga2V5IHNlYXJjaCBmaWx0ZXIgY29tYmluYXRpb24uIHN1YnR5cGUgaXMgcmVxdWlyZWQnKTtcclxuICAgIH1cclxuICAgIGlucHV0LnVua25vd25LZXlWYWxzID0gaW5wdXQudW5rbm93bktleVZhbHMuZmlsdGVyKChrZXlWYWx1ZSwgaSkgPT4ge1xyXG4gICAgICBjb25zdCBrZXkgPSBkZWNvZGVQcm9wcmlldGFyeUtleShrZXlWYWx1ZS5rZXkpO1xyXG4gICAgICByZXR1cm4gIShcclxuICAgICAgICBrZXlzVG9EZWxldGUgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgIChrZXlzVG9EZWxldGUuaWRlbnRpZmllciA9PT0ga2V5LmlkZW50aWZpZXIgJiZcclxuICAgICAgICAgIChrZXlzVG9EZWxldGUuc3VidHlwZSA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgICAgIChrZXlzVG9EZWxldGUuc3VidHlwZSA9PT0ga2V5LnN1YnR5cGUgJiZcclxuICAgICAgICAgICAgICAoIUJ1ZmZlci5pc0J1ZmZlcihrZXlzVG9EZWxldGUua2V5ZGF0YSkgfHwga2V5c1RvRGVsZXRlLmtleWRhdGEuZXF1YWxzKGtleS5rZXlkYXRhKSkpKSlcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNyZWF0ZU11c2lnMk5vbmNlRm9ySW5wdXQoXHJcbiAgICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgICBrZXlQYWlyOiBCSVAzMkludGVyZmFjZSxcclxuICAgIGtleVR5cGU6ICdyb290JyB8ICdkZXJpdmVkJyxcclxuICAgIHBhcmFtczogeyBzZXNzaW9uSWQ/OiBCdWZmZXI7IGRldGVybWluaXN0aWM/OiBib29sZWFuIH0gPSB7IGRldGVybWluaXN0aWM6IGZhbHNlIH1cclxuICApOiBQc2J0TXVzaWcyUHViTm9uY2Uge1xyXG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLmRhdGEuaW5wdXRzW2lucHV0SW5kZXhdO1xyXG4gICAgaWYgKCFpbnB1dC50YXBJbnRlcm5hbEtleSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RhcEludGVybmFsS2V5IGlzIHJlcXVpcmVkIHRvIGNyZWF0ZSBub25jZScpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFpbnB1dC50YXBNZXJrbGVSb290KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGFwTWVya2xlUm9vdCBpcyByZXF1aXJlZCB0byBjcmVhdGUgbm9uY2UnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGdldERlcml2ZWRLZXlQYWlyID0gKCk6IEJJUDMySW50ZXJmYWNlID0+IHtcclxuICAgICAgaWYgKCFpbnB1dC50YXBCaXAzMkRlcml2YXRpb24/Lmxlbmd0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndGFwQmlwMzJEZXJpdmF0aW9uIGlzIHJlcXVpcmVkIHRvIGNyZWF0ZSBub25jZScpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGRlcml2ZWQgPSBVdHhvUHNidC5kZXJpdmVLZXlQYWlyKGtleVBhaXIsIGlucHV0LnRhcEJpcDMyRGVyaXZhdGlvbiwgeyBpZ25vcmVZOiB0cnVlIH0pO1xyXG4gICAgICBpZiAoIWRlcml2ZWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGJpcDMyRGVyaXZhdGlvbiBtYXN0ZXJGaW5nZXJwcmludCBtYXRjaGVkIHRoZSBIRCBrZXlQYWlyIGZpbmdlcnByaW50Jyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRlcml2ZWQ7XHJcbiAgICB9O1xyXG4gICAgY29uc3QgZGVyaXZlZEtleVBhaXIgPSBrZXlUeXBlID09PSAncm9vdCcgPyBnZXREZXJpdmVkS2V5UGFpcigpIDoga2V5UGFpcjtcclxuICAgIGlmICghZGVyaXZlZEtleVBhaXIucHJpdmF0ZUtleSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ByaXZhdGVLZXkgaXMgcmVxdWlyZWQgdG8gY3JlYXRlIG5vbmNlJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBwYXJ0aWNpcGFudHMgPSBwYXJzZVBzYnRNdXNpZzJQYXJ0aWNpcGFudHMoaW5wdXQpO1xyXG4gICAgaWYgKCFwYXJ0aWNpcGFudHMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGb3VuZCAwIG1hdGNoaW5nIHBhcnRpY2lwYW50IGtleSB2YWx1ZSBpbnN0ZWFkIG9mIDFgKTtcclxuICAgIH1cclxuICAgIGFzc2VydFBzYnRNdXNpZzJQYXJ0aWNpcGFudHMocGFydGljaXBhbnRzLCBpbnB1dC50YXBJbnRlcm5hbEtleSwgaW5wdXQudGFwTWVya2xlUm9vdCk7XHJcbiAgICBjb25zdCB7IHRhcE91dHB1dEtleSwgcGFydGljaXBhbnRQdWJLZXlzIH0gPSBwYXJ0aWNpcGFudHM7XHJcblxyXG4gICAgY29uc3QgcGFydGljaXBhbnRQdWJLZXkgPSBwYXJ0aWNpcGFudFB1YktleXMuZmluZCgocHViS2V5KSA9PlxyXG4gICAgICBlcXVhbFB1YmxpY0tleUlnbm9yZVkocHViS2V5LCBkZXJpdmVkS2V5UGFpci5wdWJsaWNLZXkpXHJcbiAgICApO1xyXG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIocGFydGljaXBhbnRQdWJLZXkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigncGFydGljaXBhbnQgcGxhaW4gcHViIGtleSBzaG91bGQgbWF0Y2ggb25lIGJpcDMyRGVyaXZhdGlvbiBwbGFpbiBwdWIga2V5Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBoYXNoIH0gPSB0aGlzLmdldFRhcHJvb3RIYXNoRm9yU2lnKGlucHV0SW5kZXgpO1xyXG5cclxuICAgIGxldCBwdWJOb25jZTogQnVmZmVyO1xyXG4gICAgaWYgKHBhcmFtcy5kZXRlcm1pbmlzdGljKSB7XHJcbiAgICAgIGlmIChwYXJhbXMuc2Vzc2lvbklkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgYWRkIGV4dHJhIGVudHJvcHkgd2hlbiBnZW5lcmF0aW5nIGEgZGV0ZXJtaW5pc3RpYyBub25jZScpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFRoZXJlIG11c3QgYmUgb25seSAyIHBhcnRpY2lwYW50IHB1YktleXMgaWYgaXQgZ290IHRvIHRoaXMgcG9pbnRcclxuICAgICAgaWYgKCFlcXVhbFB1YmxpY0tleUlnbm9yZVkocGFydGljaXBhbnRQdWJLZXksIHBhcnRpY2lwYW50UHViS2V5c1sxXSkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE9ubHkgdGhlIGNvc2lnbmVyJ3Mgbm9uY2UgY2FuIGJlIHNldCBkZXRlcm1pbmlzdGljYWxseWApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG5vbmNlcyA9IHBhcnNlUHNidE11c2lnMk5vbmNlcyhpbnB1dCk7XHJcbiAgICAgIGlmICghbm9uY2VzKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBub25jZXMgZm91bmQgb24gaW5wdXQgIyR7aW5wdXRJbmRleH1gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobm9uY2VzLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBoYXZlIG1vcmUgdGhhbiAyIG5vbmNlc2ApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGZpcnN0U2lnbmVyTm9uY2UgPSBub25jZXMuZmluZCgoa3YpID0+IGVxdWFsUHVibGljS2V5SWdub3JlWShrdi5wYXJ0aWNpcGFudFB1YktleSwgcGFydGljaXBhbnRQdWJLZXlzWzBdKSk7XHJcbiAgICAgIGlmICghZmlyc3RTaWduZXJOb25jZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignc2lnbmVyIG5vbmNlIG11c3QgYmUgc2V0IGlmIGNvc2lnbmVyIG5vbmNlIGlzIHRvIGJlIGRlcml2ZWQgZGV0ZXJtaW5pc3RpY2FsbHknKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHViTm9uY2UgPSBjcmVhdGVNdXNpZzJEZXRlcm1pbmlzdGljTm9uY2Uoe1xyXG4gICAgICAgIHByaXZhdGVLZXk6IGRlcml2ZWRLZXlQYWlyLnByaXZhdGVLZXksXHJcbiAgICAgICAgb3RoZXJOb25jZTogZmlyc3RTaWduZXJOb25jZS5wdWJOb25jZSxcclxuICAgICAgICBwdWJsaWNLZXlzOiBwYXJ0aWNpcGFudFB1YktleXMsXHJcbiAgICAgICAgaW50ZXJuYWxQdWJLZXk6IGlucHV0LnRhcEludGVybmFsS2V5LFxyXG4gICAgICAgIHRhcFRyZWVSb290OiBpbnB1dC50YXBNZXJrbGVSb290LFxyXG4gICAgICAgIGhhc2gsXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcHViTm9uY2UgPSBCdWZmZXIuZnJvbShcclxuICAgICAgICB0aGlzLm5vbmNlU3RvcmUuY3JlYXRlTXVzaWcyTm9uY2UoXHJcbiAgICAgICAgICBkZXJpdmVkS2V5UGFpci5wcml2YXRlS2V5LFxyXG4gICAgICAgICAgcGFydGljaXBhbnRQdWJLZXksXHJcbiAgICAgICAgICB0YXBPdXRwdXRLZXksXHJcbiAgICAgICAgICBoYXNoLFxyXG4gICAgICAgICAgcGFyYW1zLnNlc3Npb25JZFxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyB0YXBPdXRwdXRLZXksIHBhcnRpY2lwYW50UHViS2V5LCBwdWJOb25jZSB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRNdXNpZzJOb25jZXNJbm5lcihcclxuICAgIGtleVBhaXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gICAga2V5VHlwZTogJ3Jvb3QnIHwgJ2Rlcml2ZWQnLFxyXG4gICAgaW5wdXRJbmRleD86IG51bWJlcixcclxuICAgIHBhcmFtczogeyBzZXNzaW9uSWQ/OiBCdWZmZXI7IGRldGVybWluaXN0aWM/OiBib29sZWFuIH0gPSB7IGRldGVybWluaXN0aWM6IGZhbHNlIH1cclxuICApOiB0aGlzIHtcclxuICAgIGlmIChrZXlQYWlyLmlzTmV1dGVyZWQoKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ByaXZhdGUga2V5IGlzIHJlcXVpcmVkIHRvIGdlbmVyYXRlIG5vbmNlJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHBhcmFtcy5zZXNzaW9uSWQpICYmIHBhcmFtcy5zZXNzaW9uSWQubGVuZ3RoICE9PSAzMikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2Vzc2lvbklkIHNpemUgJHtwYXJhbXMuc2Vzc2lvbklkLmxlbmd0aH1gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbnB1dEluZGV4ZXMgPSBpbnB1dEluZGV4ID09PSB1bmRlZmluZWQgPyBbLi4uQXJyYXkodGhpcy5pbnB1dENvdW50KS5rZXlzKCldIDogW2lucHV0SW5kZXhdO1xyXG4gICAgaW5wdXRJbmRleGVzLmZvckVhY2goKGluZGV4KSA9PiB7XHJcbiAgICAgIGlmICghdGhpcy5pc1RhcHJvb3RLZXlQYXRoSW5wdXQoaW5kZXgpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG5vbmNlID0gdGhpcy5jcmVhdGVNdXNpZzJOb25jZUZvcklucHV0KGluZGV4LCBrZXlQYWlyLCBrZXlUeXBlLCBwYXJhbXMpO1xyXG4gICAgICB0aGlzLmFkZE9yVXBkYXRlUHJvcHJpZXRhcnlLZXlWYWxUb0lucHV0KGluZGV4LCBlbmNvZGVQc2J0TXVzaWcyUHViTm9uY2Uobm9uY2UpKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZW5lcmF0ZXMgYW5kIHNldHMgTXVTaWcyIG5vbmNlIHRvIHRhcHJvb3Qga2V5IHBhdGggaW5wdXQgYXQgaW5wdXRJbmRleC5cclxuICAgKiBJZiBpbnB1dCBpcyBub3QgYSB0YXByb290IGtleSBwYXRoLCBubyBhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaW5wdXRJbmRleCBpbnB1dCBpbmRleFxyXG4gICAqIEBwYXJhbSBrZXlQYWlyIGRlcml2ZWQga2V5IHBhaXJcclxuICAgKiBAcGFyYW0gc2Vzc2lvbklkIE9wdGlvbmFsIGV4dHJhIGVudHJvcHkuIElmIHByb3ZpZGVkIGl0IG11c3QgZWl0aGVyIGJlIGEgY291bnRlciB1bmlxdWUgdG8gdGhpcyBzZWNyZXQga2V5LFxyXG4gICAqIChjb252ZXJ0ZWQgdG8gYW4gYXJyYXkgb2YgMzIgYnl0ZXMpLCBvciAzMiB1bmlmb3JtbHkgcmFuZG9tIGJ5dGVzLlxyXG4gICAqIEBwYXJhbSBkZXRlcm1pbmlzdGljIElmIHRydWUsIHNldCB0aGUgY29zaWduZXIgbm9uY2UgZGV0ZXJtaW5pc3RpY2FsbHlcclxuICAgKi9cclxuICBzZXRJbnB1dE11c2lnMk5vbmNlKFxyXG4gICAgaW5wdXRJbmRleDogbnVtYmVyLFxyXG4gICAgZGVyaXZlZEtleVBhaXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gICAgcGFyYW1zOiB7IHNlc3Npb25JZD86IEJ1ZmZlcjsgZGV0ZXJtaW5pc3RpYz86IGJvb2xlYW4gfSA9IHsgZGV0ZXJtaW5pc3RpYzogZmFsc2UgfVxyXG4gICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TXVzaWcyTm9uY2VzSW5uZXIoZGVyaXZlZEtleVBhaXIsICdkZXJpdmVkJywgaW5wdXRJbmRleCwgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlcyBhbmQgc2V0cyBNdVNpZzIgbm9uY2UgdG8gdGFwcm9vdCBrZXkgcGF0aCBpbnB1dCBhdCBpbnB1dEluZGV4LlxyXG4gICAqIElmIGlucHV0IGlzIG5vdCBhIHRhcHJvb3Qga2V5IHBhdGgsIG5vIGFjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbnB1dEluZGV4IGlucHV0IGluZGV4XHJcbiAgICogQHBhcmFtIGtleVBhaXIgSEQgcm9vdCBrZXkgcGFpclxyXG4gICAqIEBwYXJhbSBzZXNzaW9uSWQgT3B0aW9uYWwgZXh0cmEgZW50cm9weS4gSWYgcHJvdmlkZWQgaXQgbXVzdCBlaXRoZXIgYmUgYSBjb3VudGVyIHVuaXF1ZSB0byB0aGlzIHNlY3JldCBrZXksXHJcbiAgICogKGNvbnZlcnRlZCB0byBhbiBhcnJheSBvZiAzMiBieXRlcyksIG9yIDMyIHVuaWZvcm1seSByYW5kb20gYnl0ZXMuXHJcbiAgICogQHBhcmFtIGRldGVybWluaXN0aWMgSWYgdHJ1ZSwgc2V0IHRoZSBjb3NpZ25lciBub25jZSBkZXRlcm1pbmlzdGljYWxseVxyXG4gICAqL1xyXG4gIHNldElucHV0TXVzaWcyTm9uY2VIRChcclxuICAgIGlucHV0SW5kZXg6IG51bWJlcixcclxuICAgIGtleVBhaXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gICAgcGFyYW1zOiB7IHNlc3Npb25JZD86IEJ1ZmZlcjsgZGV0ZXJtaW5pc3RpYz86IGJvb2xlYW4gfSA9IHsgZGV0ZXJtaW5pc3RpYzogZmFsc2UgfVxyXG4gICk6IHRoaXMge1xyXG4gICAgY2hlY2tGb3JJbnB1dCh0aGlzLmRhdGEuaW5wdXRzLCBpbnB1dEluZGV4KTtcclxuICAgIHJldHVybiB0aGlzLnNldE11c2lnMk5vbmNlc0lubmVyKGtleVBhaXIsICdyb290JywgaW5wdXRJbmRleCwgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlcyBhbmQgc2V0cyBNdVNpZzIgbm9uY2UgdG8gYWxsIHRhcHJvb3Qga2V5IHBhdGggaW5wdXRzLiBPdGhlciBpbnB1dHMgd2lsbCBiZSBza2lwcGVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlucHV0SW5kZXggaW5wdXQgaW5kZXhcclxuICAgKiBAcGFyYW0ga2V5UGFpciBkZXJpdmVkIGtleSBwYWlyXHJcbiAgICogQHBhcmFtIHNlc3Npb25JZCBPcHRpb25hbCBleHRyYSBlbnRyb3B5LiBJZiBwcm92aWRlZCBpdCBtdXN0IGVpdGhlciBiZSBhIGNvdW50ZXIgdW5pcXVlIHRvIHRoaXMgc2VjcmV0IGtleSxcclxuICAgKiAoY29udmVydGVkIHRvIGFuIGFycmF5IG9mIDMyIGJ5dGVzKSwgb3IgMzIgdW5pZm9ybWx5IHJhbmRvbSBieXRlcy5cclxuICAgKi9cclxuICBzZXRBbGxJbnB1dHNNdXNpZzJOb25jZShcclxuICAgIGtleVBhaXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gICAgcGFyYW1zOiB7IHNlc3Npb25JZD86IEJ1ZmZlcjsgZGV0ZXJtaW5pc3RpYz86IGJvb2xlYW4gfSA9IHsgZGV0ZXJtaW5pc3RpYzogZmFsc2UgfVxyXG4gICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TXVzaWcyTm9uY2VzSW5uZXIoa2V5UGFpciwgJ2Rlcml2ZWQnLCB1bmRlZmluZWQsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZW5lcmF0ZXMgYW5kIHNldHMgTXVTaWcyIG5vbmNlIHRvIGFsbCB0YXByb290IGtleSBwYXRoIGlucHV0cy4gT3RoZXIgaW5wdXRzIHdpbGwgYmUgc2tpcHBlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbnB1dEluZGV4IGlucHV0IGluZGV4XHJcbiAgICogQHBhcmFtIGtleVBhaXIgSEQgcm9vdCBrZXkgcGFpclxyXG4gICAqIEBwYXJhbSBzZXNzaW9uSWQgT3B0aW9uYWwgZXh0cmEgZW50cm9weS4gSWYgcHJvdmlkZWQgaXQgbXVzdCBlaXRoZXIgYmUgYSBjb3VudGVyIHVuaXF1ZSB0byB0aGlzIHNlY3JldCBrZXksXHJcbiAgICogKGNvbnZlcnRlZCB0byBhbiBhcnJheSBvZiAzMiBieXRlcyksIG9yIDMyIHVuaWZvcm1seSByYW5kb20gYnl0ZXMuXHJcbiAgICovXHJcbiAgc2V0QWxsSW5wdXRzTXVzaWcyTm9uY2VIRChcclxuICAgIGtleVBhaXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gICAgcGFyYW1zOiB7IHNlc3Npb25JZD86IEJ1ZmZlcjsgZGV0ZXJtaW5pc3RpYz86IGJvb2xlYW4gfSA9IHsgZGV0ZXJtaW5pc3RpYzogZmFsc2UgfVxyXG4gICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0TXVzaWcyTm9uY2VzSW5uZXIoa2V5UGFpciwgJ3Jvb3QnLCB1bmRlZmluZWQsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICBjbG9uZSgpOiB0aGlzIHtcclxuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIHRoaXM7XHJcbiAgfVxyXG5cclxuICBleHRyYWN0VHJhbnNhY3Rpb24oZGlzYWJsZUZlZUNoZWNrID0gdHJ1ZSk6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+IHtcclxuICAgIGNvbnN0IHR4ID0gc3VwZXIuZXh0cmFjdFRyYW5zYWN0aW9uKGRpc2FibGVGZWVDaGVjayk7XHJcbiAgICBpZiAodHggaW5zdGFuY2VvZiBVdHhvVHJhbnNhY3Rpb24pIHtcclxuICAgICAgcmV0dXJuIHR4O1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHRyYWN0VHJhbnNhY3Rpb24gZGlkIG5vdCByZXR1cm4gaW5zdGFjZSBvZiBVdHhvVHJhbnNhY3Rpb24nKTtcclxuICB9XHJcbn1cclxuIl19