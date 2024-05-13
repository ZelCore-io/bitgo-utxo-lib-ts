"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionBuilder = void 0;
const types = require("bitcoinjs-lib/src/types");
const _1 = require("./");
const bufferutils = require("bitcoinjs-lib/src/bufferutils");
const classify = require("./classify");
const _2 = require("./");
const _3 = require("./");
const _4 = require("./");
const _5 = require("./");
const _6 = require("./");
const _7 = require("./");
const _8 = require("./");
const noble_ecc_1 = require("./noble_ecc");
const typeforce = require('typeforce');
const tfFullSigner = (obj) => {
    return typeforce.Buffer(obj.publicKey) && typeof obj.sign === 'function' && typeof obj.signSchnorr === 'function';
};
const SCRIPT_TYPES = classify.types;
const PREVOUT_TYPES = new Set([
    // Raw
    'p2pkh',
    'p2pk',
    'p2wpkh',
    'p2ms',
    // P2SH wrapped
    'p2sh-p2pkh',
    'p2sh-p2pk',
    'p2sh-p2wpkh',
    'p2sh-p2ms',
    // P2WSH wrapped
    'p2wsh-p2pkh',
    'p2wsh-p2pk',
    'p2wsh-p2ms',
    // P2SH-P2WSH wrapper
    'p2sh-p2wsh-p2pkh',
    'p2sh-p2wsh-p2pk',
    'p2sh-p2wsh-p2ms',
    // P2TR KeyPath
    'p2tr',
    // P2TR ScriptPath
    'p2tr-p2ns',
]);
function tfMessage(type, value, message) {
    try {
        typeforce(type, value);
    }
    catch (err) {
        throw new Error(message);
    }
}
function txIsString(tx) {
    return typeof tx === 'string' || tx instanceof String;
}
function txIsTransaction(tx) {
    return tx instanceof _8.Transaction;
}
class TransactionBuilder {
    // WARNING: maximumFeeRate is __NOT__ to be relied on,
    //          it's just another potential safety mechanism (safety in-depth)
    constructor(network = _3.networks.bitcoin, maximumFeeRate = 2500) {
        this.network = network;
        this.maximumFeeRate = maximumFeeRate;
        this.__PREV_TX_SET = {};
        this.__INPUTS = [];
        this.__TX = new _8.Transaction();
        this.__TX.version = 2;
        this.__USE_LOW_R = false;
    }
    static fromTransaction(transaction, network, prevOutputs) {
        const txb = new TransactionBuilder(network);
        // Copy transaction fields
        txb.setVersion(transaction.version);
        txb.setLockTime(transaction.locktime);
        // Copy outputs (done first to avoid signature invalidation)
        transaction.outs.forEach((txOut) => {
            txb.addOutput(txOut.script, txOut.value);
        });
        // Copy inputs
        transaction.ins.forEach((txIn) => {
            txb.__addInputUnsafe(txIn.hash, txIn.index, {
                sequence: txIn.sequence,
                script: txIn.script,
                witness: txIn.witness,
            });
        });
        // fix some things not possible through the public API
        txb.__INPUTS.forEach((input, i) => {
            fixMultisigOrder(input, transaction, i, prevOutputs);
        });
        return txb;
    }
    setLowR(setting) {
        typeforce(typeforce.maybe(typeforce.Boolean), setting);
        if (setting === undefined) {
            setting = true;
        }
        this.__USE_LOW_R = setting;
        return setting;
    }
    setLockTime(locktime) {
        typeforce(types.UInt32, locktime);
        // if any signatures exist, throw
        if (this.__INPUTS.some((input) => {
            if (!input.signatures)
                return false;
            return input.signatures.some((s) => s !== undefined);
        })) {
            throw new Error('No, this would invalidate signatures');
        }
        this.__TX.locktime = locktime;
    }
    setVersion(version) {
        typeforce(types.UInt32, version);
        // XXX: this might eventually become more complex depending on what the versions represent
        this.__TX.version = version;
    }
    addInput(txHash, vout, sequence, prevOutScript, value) {
        if (!this.__canModifyInputs()) {
            throw new Error('No, this would invalidate signatures');
        }
        // is it a hex string?
        if (txIsString(txHash)) {
            // transaction hashs's are displayed in reverse order, un-reverse it
            txHash = bufferutils.reverseBuffer(Buffer.from(txHash, 'hex'));
            // is it a Transaction object?
        }
        else if (txIsTransaction(txHash)) {
            const txOut = txHash.outs[vout];
            prevOutScript = txOut.script;
            value = txOut.value;
            txHash = txHash.getHash(false);
        }
        return this.__addInputUnsafe(txHash, vout, {
            sequence,
            prevOutScript,
            value,
        });
    }
    addOutput(scriptPubKey, value) {
        if (!this.__canModifyOutputs()) {
            throw new Error('No, this would invalidate signatures');
        }
        // Attempt to get a script if it's a base58 or bech32 address string
        if (typeof scriptPubKey === 'string') {
            scriptPubKey = _1.address.toOutputScript(scriptPubKey, this.network);
        }
        return this.__TX.addOutput(scriptPubKey, value);
    }
    build() {
        return this.__build(false);
    }
    buildIncomplete() {
        return this.__build(true);
    }
    sign(signParams, keyPair, redeemScript, hashType, witnessValue, witnessScript, controlBlock, annex) {
        trySign(getSigningData(this.network, this.__INPUTS, this.__needsOutputs.bind(this), this.__TX, signParams, keyPair, redeemScript, hashType, witnessValue, witnessScript, controlBlock, annex, this.__USE_LOW_R));
    }
    __addInputUnsafe(txHash, vout, options) {
        if (_8.Transaction.isCoinbaseHash(txHash)) {
            throw new Error('coinbase inputs not supported');
        }
        const prevTxOut = txHash.toString('hex') + ':' + vout;
        if (this.__PREV_TX_SET[prevTxOut] !== undefined)
            throw new Error('Duplicate TxOut: ' + prevTxOut);
        let input = {};
        // derive what we can from the scriptSig
        if (options.script !== undefined || options.witness !== undefined) {
            input = expandInput(options.script, options.witness);
        }
        // if an input value was given, retain it
        if (options.value !== undefined) {
            input.value = options.value;
        }
        // derive what we can from the previous transactions output script
        if (!input.prevOutScript && options.prevOutScript) {
            let prevOutType;
            if (!input.pubkeys && !input.signatures) {
                const expanded = expandOutput(options.prevOutScript);
                if (expanded.pubkeys) {
                    input.pubkeys = expanded.pubkeys;
                    input.signatures = expanded.signatures;
                }
                prevOutType = expanded.type;
            }
            input.prevOutScript = options.prevOutScript;
            input.prevOutType = prevOutType || classify.output(options.prevOutScript);
        }
        const vin = this.__TX.addInput(txHash, vout, options.sequence, options.scriptSig);
        this.__INPUTS[vin] = input;
        this.__PREV_TX_SET[prevTxOut] = true;
        return vin;
    }
    __build(allowIncomplete) {
        if (!allowIncomplete) {
            if (!this.__TX.ins.length)
                throw new Error('Transaction has no inputs');
            if (!this.__TX.outs.length)
                throw new Error('Transaction has no outputs');
        }
        const tx = this.__TX.clone();
        // create script signatures from inputs
        this.__INPUTS.forEach((input, i) => {
            if (!input.prevOutType && !allowIncomplete)
                throw new Error('Transaction is not complete');
            const result = build(input.prevOutType, input, allowIncomplete);
            if (!result) {
                if (!allowIncomplete && input.prevOutType === SCRIPT_TYPES.NONSTANDARD)
                    throw new Error('Unknown input type');
                if (!allowIncomplete)
                    throw new Error('Not enough information');
                return;
            }
            if (result.input) {
                tx.setInputScript(i, result.input);
            }
            tx.setWitness(i, result.witness);
        });
        if (!allowIncomplete) {
            // do not rely on this, its merely a last resort
            if (this.__overMaximumFees(tx.virtualSize())) {
                throw new Error('Transaction has absurd fees');
            }
        }
        return tx;
    }
    __canModifyInputs() {
        return this.__INPUTS.every((input) => {
            if (!input.signatures)
                return true;
            return input.signatures.every((signature) => {
                if (!signature)
                    return true;
                const hashType = signatureHashType(signature);
                // if SIGHASH_ANYONECANPAY is set, signatures would not
                // be invalidated by more inputs
                return (hashType & _8.Transaction.SIGHASH_ANYONECANPAY) !== 0;
            });
        });
    }
    __needsOutputs(signingHashType) {
        if (signingHashType === _8.Transaction.SIGHASH_ALL || signingHashType === _8.Transaction.SIGHASH_DEFAULT) {
            return this.__TX.outs.length === 0;
        }
        // if inputs are being signed with SIGHASH_NONE, we don't strictly need outputs
        // .build() will fail, but .buildIncomplete() is OK
        return (this.__TX.outs.length === 0 &&
            this.__INPUTS.some((input) => {
                if (!input.signatures)
                    return false;
                return input.signatures.some((signature) => {
                    if (!signature)
                        return false; // no signature, no issue
                    const hashType = signatureHashType(signature);
                    if (hashType & _8.Transaction.SIGHASH_NONE)
                        return false; // SIGHASH_NONE doesn't care about outputs
                    return true; // SIGHASH_* does care
                });
            }));
    }
    __canModifyOutputs() {
        const nInputs = this.__TX.ins.length;
        const nOutputs = this.__TX.outs.length;
        return this.__INPUTS.every((input) => {
            if (input.signatures === undefined)
                return true;
            return input.signatures.every((signature) => {
                if (!signature)
                    return true;
                const hashType = signatureHashType(signature);
                const hashTypeMod = hashType & 0x1f;
                if (hashTypeMod === _8.Transaction.SIGHASH_NONE)
                    return true;
                if (hashTypeMod === _8.Transaction.SIGHASH_SINGLE) {
                    // if SIGHASH_SINGLE is set, and nInputs > nOutputs
                    // some signatures would be invalidated by the addition
                    // of more outputs
                    return nInputs <= nOutputs;
                }
                return false;
            });
        });
    }
    __overMaximumFees(bytes) {
        // not all inputs will have .value defined
        const incoming = this.__INPUTS.reduce((a, x) => a + (typeof x.value !== 'undefined' ? BigInt(x.value) : BigInt(0)), BigInt(0));
        // but all outputs do, and if we have any input value
        // we can immediately determine if the outputs are too small
        const outgoing = this.__TX.outs.reduce((a, x) => a + BigInt(x.value), BigInt(0));
        const fee = incoming - outgoing;
        const feeRate = Number(fee) / bytes; // assume fee fits within number
        return feeRate > this.maximumFeeRate;
    }
}
exports.TransactionBuilder = TransactionBuilder;
function expandInput(scriptSig, witnessStack = [], type, scriptPubKey) {
    if (scriptSig && scriptSig.length === 0 && witnessStack.length === 0)
        return {};
    if (!type) {
        let ssType = scriptSig ? classify.input(scriptSig, true) : undefined;
        let wsType = classify.witness(witnessStack, true);
        if (ssType === SCRIPT_TYPES.NONSTANDARD)
            ssType = undefined;
        if (wsType === SCRIPT_TYPES.NONSTANDARD)
            wsType = undefined;
        type = ssType || wsType;
    }
    switch (type) {
        case SCRIPT_TYPES.P2WPKH: {
            const { output, pubkey, signature } = _4.payments.p2wpkh({
                witness: witnessStack,
            });
            return {
                prevOutScript: output,
                prevOutType: SCRIPT_TYPES.P2WPKH,
                pubkeys: [pubkey],
                signatures: [signature],
            };
        }
        case SCRIPT_TYPES.P2PKH: {
            const { output, pubkey, signature } = _4.payments.p2pkh({
                input: scriptSig,
            });
            return {
                prevOutScript: output,
                prevOutType: SCRIPT_TYPES.P2PKH,
                pubkeys: [pubkey],
                signatures: [signature],
            };
        }
        case SCRIPT_TYPES.P2PK: {
            const { signature } = _4.payments.p2pk({ input: scriptSig });
            return {
                prevOutType: SCRIPT_TYPES.P2PK,
                pubkeys: [undefined],
                signatures: [signature],
            };
        }
        case SCRIPT_TYPES.P2MS: {
            const { m, pubkeys, signatures } = _4.payments.p2ms({
                input: scriptSig,
                output: scriptPubKey,
            }, { allowIncomplete: true });
            return {
                prevOutType: SCRIPT_TYPES.P2MS,
                pubkeys,
                signatures,
                maxSignatures: m,
            };
        }
        case SCRIPT_TYPES.P2TR_NS: {
            const { n, pubkeys, signatures } = _1.p2trPayments.p2tr_ns({
                // Witness signatures are reverse of pubkeys, because it's a stack
                signatures: witnessStack.length ? witnessStack.reverse() : undefined,
                output: scriptPubKey,
            }, { allowIncomplete: true, eccLib: noble_ecc_1.ecc });
            return {
                prevOutType: SCRIPT_TYPES.P2TR_NS,
                pubkeys,
                signatures,
                maxSignatures: n,
            };
        }
    }
    if (type === SCRIPT_TYPES.P2SH) {
        const { output, redeem } = _4.payments.p2sh({
            input: scriptSig,
            witness: witnessStack,
        });
        const outputType = classify.output(redeem.output);
        const expanded = expandInput(redeem.input, redeem.witness, outputType, redeem.output);
        if (!expanded.prevOutType)
            return {};
        return {
            prevOutScript: output,
            prevOutType: SCRIPT_TYPES.P2SH,
            redeemScript: redeem.output,
            redeemScriptType: expanded.prevOutType,
            witnessScript: expanded.witnessScript,
            witnessScriptType: expanded.witnessScriptType,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
        };
    }
    if (type === SCRIPT_TYPES.P2WSH) {
        const { output, redeem } = _4.payments.p2wsh({
            input: scriptSig,
            witness: witnessStack,
        });
        const outputType = classify.output(redeem.output);
        let expanded;
        if (outputType === SCRIPT_TYPES.P2WPKH) {
            expanded = expandInput(redeem.input, redeem.witness, outputType);
        }
        else {
            expanded = expandInput(_5.script.compile(redeem.witness), [], outputType, redeem.output);
        }
        if (!expanded.prevOutType)
            return {};
        return {
            prevOutScript: output,
            prevOutType: SCRIPT_TYPES.P2WSH,
            witnessScript: redeem.output,
            witnessScriptType: expanded.prevOutType,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
        };
    }
    if (type === SCRIPT_TYPES.P2TR) {
        const parsedWitness = _7.taproot.parseTaprootWitness(witnessStack);
        if (parsedWitness.spendType === 'Key') {
            // key path spend, nothing to expand
            const { signature, annex } = parsedWitness;
            return {
                prevOutType: SCRIPT_TYPES.P2TR,
                signatures: [signature],
                annex,
            };
        }
        else {
            // script path spend
            const { tapscript, controlBlock, annex } = parsedWitness;
            const prevOutScript = _1.p2trPayments.p2tr({
                redeems: [{ output: tapscript }],
                redeemIndex: 0,
                controlBlock,
                annex,
            }, { eccLib: noble_ecc_1.ecc }).output;
            const witnessScriptType = classify.output(tapscript);
            const { pubkeys, signatures } = expandInput(undefined, parsedWitness.scriptSig, witnessScriptType, tapscript);
            return {
                prevOutScript,
                prevOutType: SCRIPT_TYPES.P2TR,
                witnessScript: tapscript,
                witnessScriptType,
                controlBlock,
                annex,
                pubkeys,
                signatures,
            };
        }
    }
    return {
        prevOutType: SCRIPT_TYPES.NONSTANDARD,
        prevOutScript: scriptSig,
    };
}
// could be done in expandInput, but requires the original Transaction for hashForSignature
function fixMultisigOrder(input, transaction, vin, prevOutputs) {
    if (input.redeemScriptType !== SCRIPT_TYPES.P2MS || !input.redeemScript)
        return;
    if (input.pubkeys.length === input.signatures.length)
        return;
    const prevOutput = prevOutputs && prevOutputs[vin];
    const unmatched = input.signatures.concat();
    input.signatures = input.pubkeys.map((pubKey) => {
        const keyPair = noble_ecc_1.ECPair.fromPublicKey(pubKey);
        let match;
        // check for a signature
        unmatched.some((signature, i) => {
            // skip if undefined || OP_0
            if (!signature)
                return false;
            // TODO: avoid O(n) hashForSignature
            const parsed = _5.script.signature.decode(signature);
            const hash = transaction.hashForSignature(vin, input.redeemScript, parsed.hashType, prevOutput === null || prevOutput === void 0 ? void 0 : prevOutput.value);
            // skip if signature does not match pubKey
            if (!keyPair.verify(hash, parsed.signature))
                return false;
            // remove matched signature from unmatched
            unmatched[i] = undefined;
            match = signature;
            return true;
        });
        return match;
    });
}
function expandOutput(script, ourPubKey, controlBlock) {
    typeforce(types.Buffer, script);
    const type = classify.output(script);
    switch (type) {
        case SCRIPT_TYPES.P2PKH: {
            if (!ourPubKey)
                return { type };
            // does our hash160(pubKey) match the output scripts?
            const pkh1 = _4.payments.p2pkh({ output: script }).hash;
            const pkh2 = _2.crypto.hash160(ourPubKey);
            if (!pkh1.equals(pkh2))
                return { type };
            return {
                type,
                pubkeys: [ourPubKey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2WPKH: {
            if (!ourPubKey)
                return { type };
            // does our hash160(pubKey) match the output scripts?
            const wpkh1 = _4.payments.p2wpkh({ output: script }).hash;
            const wpkh2 = _2.crypto.hash160(ourPubKey);
            if (!wpkh1.equals(wpkh2))
                return { type };
            return {
                type,
                pubkeys: [ourPubKey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2TR: {
            if (!ourPubKey)
                return { type };
            // HACK ourPubKey to BIP340-style
            if (ourPubKey.length === 33)
                ourPubKey = ourPubKey.slice(1);
            // TODO: support multiple pubkeys
            const p2tr = _1.p2trPayments.p2tr({ pubkey: ourPubKey, controlBlock }, { eccLib: noble_ecc_1.ecc });
            // Does tweaked output for a single pubkey match?
            if (!script.equals(p2tr.output))
                return { type };
            // P2TR KeyPath, single key
            return {
                type,
                pubkeys: [ourPubKey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2TR_NS: {
            const p2trNs = _1.p2trPayments.p2tr_ns({ output: script }, { eccLib: noble_ecc_1.ecc });
            // P2TR ScriptPath
            return {
                type,
                pubkeys: p2trNs.pubkeys,
                signatures: p2trNs.pubkeys.map(() => undefined),
                maxSignatures: p2trNs.pubkeys.length,
            };
        }
        case SCRIPT_TYPES.P2PK: {
            const p2pk = _4.payments.p2pk({ output: script });
            return {
                type,
                pubkeys: [p2pk.pubkey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2MS: {
            const p2ms = _4.payments.p2ms({ output: script });
            return {
                type,
                pubkeys: p2ms.pubkeys,
                signatures: p2ms.pubkeys.map(() => undefined),
                maxSignatures: p2ms.m,
            };
        }
    }
    return { type };
}
function prepareInput(input, ourPubKey, redeemScript, witnessScript, controlBlock, annex) {
    if (redeemScript && witnessScript) {
        const p2wsh = _4.payments.p2wsh({
            redeem: { output: witnessScript },
        });
        const p2wshAlt = _4.payments.p2wsh({ output: redeemScript });
        const p2sh = _4.payments.p2sh({ redeem: { output: redeemScript } });
        const p2shAlt = _4.payments.p2sh({ redeem: p2wsh });
        // enforces P2SH(P2WSH(...))
        if (!p2wsh.hash.equals(p2wshAlt.hash))
            throw new Error('Witness script inconsistent with prevOutScript');
        if (!p2sh.hash.equals(p2shAlt.hash))
            throw new Error('Redeem script inconsistent with prevOutScript');
        const expanded = expandOutput(p2wsh.redeem.output, ourPubKey);
        if (!expanded.pubkeys) {
            throw new Error(expanded.type + ' not supported as witnessScript (' + _5.script.toASM(witnessScript) + ')');
        }
        if (input.signatures && input.signatures.some((x) => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        const signScript = witnessScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH)
            throw new Error('P2SH(P2WSH(P2WPKH)) is a consensus failure');
        return {
            redeemScript,
            redeemScriptType: SCRIPT_TYPES.P2WSH,
            witnessScript,
            witnessScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2SH,
            prevOutScript: p2sh.output,
            witnessVersion: 0,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    if (redeemScript) {
        const p2sh = _4.payments.p2sh({ redeem: { output: redeemScript } });
        if (input.prevOutScript) {
            let p2shAlt;
            try {
                p2shAlt = _4.payments.p2sh({ output: input.prevOutScript });
            }
            catch (e) {
                throw new Error('PrevOutScript must be P2SH');
            }
            if (!p2sh.hash.equals(p2shAlt.hash))
                throw new Error('Redeem script inconsistent with prevOutScript');
        }
        const expanded = expandOutput(p2sh.redeem.output, ourPubKey);
        if (!expanded.pubkeys) {
            throw new Error(expanded.type + ' not supported as redeemScript (' + _5.script.toASM(redeemScript) + ')');
        }
        if (input.signatures && input.signatures.some((x) => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        let signScript = redeemScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH) {
            signScript = _4.payments.p2pkh({ pubkey: expanded.pubkeys[0] }).output;
        }
        return {
            redeemScript,
            redeemScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2SH,
            prevOutScript: p2sh.output,
            witnessVersion: expanded.type === SCRIPT_TYPES.P2WPKH ? 0 : undefined,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    if (witnessScript && controlBlock) {
        // P2TR ScriptPath
        /* tslint:disable-next-line:no-shadowed-variable */
        let prevOutScript = input.prevOutScript;
        if (!prevOutScript) {
            prevOutScript = _1.p2trPayments.p2tr({
                redeems: [{ output: witnessScript }],
                redeemIndex: 0,
                controlBlock,
                annex,
            }, { eccLib: noble_ecc_1.ecc }).output;
        }
        const expanded = expandOutput(witnessScript, ourPubKey);
        if (!expanded.pubkeys) {
            throw new Error(expanded.type + ' not supported as witnessScript (' + _5.script.toASM(witnessScript) + ')');
        }
        if (input.signatures && input.signatures.some((x) => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        return {
            witnessScript,
            witnessScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2TR,
            prevOutScript,
            witnessVersion: 1,
            signScript: witnessScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
            controlBlock,
            annex,
        };
    }
    if (witnessScript) {
        const p2wsh = _4.payments.p2wsh({ redeem: { output: witnessScript } });
        if (input.prevOutScript) {
            const p2wshAlt = _4.payments.p2wsh({ output: input.prevOutScript });
            if (!p2wsh.hash.equals(p2wshAlt.hash))
                throw new Error('Witness script inconsistent with prevOutScript');
        }
        const expanded = expandOutput(p2wsh.redeem.output, ourPubKey);
        if (!expanded.pubkeys) {
            throw new Error(expanded.type + ' not supported as witnessScript (' + _5.script.toASM(witnessScript) + ')');
        }
        if (input.signatures && input.signatures.some((x) => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        const signScript = witnessScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH)
            throw new Error('P2WSH(P2WPKH) is a consensus failure');
        return {
            witnessScript,
            witnessScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2WSH,
            prevOutScript: p2wsh.output,
            witnessVersion: 0,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    if (input.prevOutType && input.prevOutScript) {
        // embedded scripts are not possible without extra information
        if (input.prevOutType === SCRIPT_TYPES.P2SH) {
            throw new Error('PrevOutScript is ' + input.prevOutType + ', requires redeemScript');
        }
        if (input.prevOutType === SCRIPT_TYPES.P2WSH) {
            throw new Error('PrevOutScript is ' + input.prevOutType + ', requires witnessScript');
        }
        const expanded = expandOutput(input.prevOutScript, ourPubKey);
        if (!expanded.pubkeys) {
            throw new Error(expanded.type + ' not supported (' + _5.script.toASM(input.prevOutScript) + ')');
        }
        if (input.signatures && input.signatures.some((x) => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        let signScript = input.prevOutScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH) {
            signScript = _4.payments.p2pkh({ pubkey: expanded.pubkeys[0] }).output;
        }
        let witnessVersion;
        if (expanded.type === SCRIPT_TYPES.P2WPKH) {
            witnessVersion = 0;
        }
        else if (expanded.type === SCRIPT_TYPES.P2TR) {
            witnessVersion = 1;
        }
        return {
            prevOutType: expanded.type,
            prevOutScript: input.prevOutScript,
            witnessVersion,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    const prevOutScript = _4.payments.p2pkh({ pubkey: ourPubKey }).output;
    return {
        prevOutType: SCRIPT_TYPES.P2PKH,
        prevOutScript,
        signScript: prevOutScript,
        signType: SCRIPT_TYPES.P2PKH,
        pubkeys: [ourPubKey],
        signatures: [undefined],
    };
}
function build(type, input, allowIncomplete) {
    const pubkeys = (input.pubkeys || []);
    let signatures = (input.signatures || []);
    switch (type) {
        case SCRIPT_TYPES.P2PKH: {
            if (pubkeys.length === 0)
                break;
            if (signatures.length === 0)
                break;
            return _4.payments.p2pkh({ pubkey: pubkeys[0], signature: signatures[0] });
        }
        case SCRIPT_TYPES.P2WPKH: {
            if (pubkeys.length === 0)
                break;
            if (signatures.length === 0)
                break;
            return _4.payments.p2wpkh({ pubkey: pubkeys[0], signature: signatures[0] });
        }
        case SCRIPT_TYPES.P2PK: {
            if (pubkeys.length === 0)
                break;
            if (signatures.length === 0)
                break;
            return _4.payments.p2pk({ signature: signatures[0] });
        }
        case SCRIPT_TYPES.P2MS: {
            const m = input.maxSignatures;
            if (allowIncomplete) {
                signatures = signatures.map((x) => x || _6.opcodes.OP_0);
            }
            else {
                signatures = signatures.filter((x) => x);
            }
            // if the transaction is not not complete (complete), or if signatures.length === m, validate
            // otherwise, the number of OP_0's may be >= m, so don't validate (boo)
            const validate = !allowIncomplete || m === signatures.length;
            return _4.payments.p2ms({ m, pubkeys, signatures }, { allowIncomplete, validate });
        }
        case SCRIPT_TYPES.P2SH: {
            const redeem = build(input.redeemScriptType, input, allowIncomplete);
            if (!redeem)
                return;
            return _4.payments.p2sh({
                redeem: {
                    output: redeem.output || input.redeemScript,
                    input: redeem.input,
                    witness: redeem.witness,
                },
            });
        }
        case SCRIPT_TYPES.P2WSH: {
            const redeem = build(input.witnessScriptType, input, allowIncomplete);
            if (!redeem)
                return;
            return _4.payments.p2wsh({
                redeem: {
                    output: input.witnessScript,
                    input: redeem.input,
                    witness: redeem.witness,
                },
            });
        }
        case SCRIPT_TYPES.P2TR: {
            if (input.witnessScriptType === SCRIPT_TYPES.P2TR_NS) {
                // ScriptPath
                const redeem = build(input.witnessScriptType, input, allowIncomplete);
                return _1.p2trPayments.p2tr({
                    output: input.prevOutScript,
                    controlBlock: input.controlBlock,
                    annex: input.annex,
                    redeems: [redeem],
                    redeemIndex: 0,
                }, { eccLib: noble_ecc_1.ecc });
            }
            // KeyPath
            if (signatures.length === 0)
                break;
            return _1.p2trPayments.p2tr({ pubkeys, signature: signatures[0] }, { eccLib: noble_ecc_1.ecc });
        }
        case SCRIPT_TYPES.P2TR_NS: {
            const m = input.maxSignatures;
            if (allowIncomplete) {
                signatures = signatures.map((x) => x || _6.opcodes.OP_0);
            }
            else {
                signatures = signatures.filter((x) => x);
            }
            // if the transaction is not not complete (complete), or if signatures.length === m, validate
            // otherwise, the number of OP_0's may be >= m, so don't validate (boo)
            const validate = !allowIncomplete || m === signatures.length;
            return _1.p2trPayments.p2tr_ns({ pubkeys, signatures }, { allowIncomplete, validate, eccLib: noble_ecc_1.ecc });
        }
    }
}
function canSign(input) {
    return (input.signScript !== undefined &&
        input.signType !== undefined &&
        input.pubkeys !== undefined &&
        input.signatures !== undefined &&
        input.signatures.length === input.pubkeys.length &&
        input.pubkeys.length > 0 &&
        (input.witnessVersion === undefined || input.value !== undefined));
}
function signatureHashType(buffer) {
    if (_5.script.isCanonicalSchnorrSignature(buffer) && buffer.length === 64) {
        return _8.Transaction.SIGHASH_DEFAULT;
    }
    return buffer.readUInt8(buffer.length - 1);
}
function checkSignArgs(inputs, signParams) {
    if (!PREVOUT_TYPES.has(signParams.prevOutScriptType)) {
        throw new TypeError(`Unknown prevOutScriptType "${signParams.prevOutScriptType}"`);
    }
    tfMessage(typeforce.Number, signParams.vin, `sign must include vin parameter as Number (input index)`);
    tfMessage(tfFullSigner, signParams.keyPair, `sign must include keyPair parameter as Signer interface`);
    tfMessage(typeforce.maybe(typeforce.Number), signParams.hashType, `sign hashType parameter must be a number`);
    const prevOutType = (inputs[signParams.vin] || []).prevOutType;
    const posType = signParams.prevOutScriptType;
    switch (posType) {
        case 'p2pkh':
            if (prevOutType && prevOutType !== 'pubkeyhash') {
                throw new TypeError(`input #${signParams.vin} is not of type p2pkh: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
            break;
        case 'p2pk':
            if (prevOutType && prevOutType !== 'pubkey') {
                throw new TypeError(`input #${signParams.vin} is not of type p2pk: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
            break;
        case 'p2wpkh':
            if (prevOutType && prevOutType !== 'witnesspubkeyhash') {
                throw new TypeError(`input #${signParams.vin} is not of type p2wpkh: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessValue`);
            break;
        case 'p2ms':
            if (prevOutType && prevOutType !== 'multisig') {
                throw new TypeError(`input #${signParams.vin} is not of type p2ms: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
            break;
        case 'p2sh-p2wpkh':
            if (prevOutType && prevOutType !== 'scripthash') {
                throw new TypeError(`input #${signParams.vin} is not of type p2sh-p2wpkh: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.Buffer, signParams.redeemScript, `${posType} requires redeemScript`);
            tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessValue`);
            break;
        case 'p2sh-p2ms':
        case 'p2sh-p2pk':
        case 'p2sh-p2pkh':
            if (prevOutType && prevOutType !== 'scripthash') {
                throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.Buffer, signParams.redeemScript, `${posType} requires redeemScript`);
            tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
            break;
        case 'p2wsh-p2ms':
        case 'p2wsh-p2pk':
        case 'p2wsh-p2pkh':
            if (prevOutType && prevOutType !== 'witnessscripthash') {
                throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
            }
            tfMessage(typeforce.Buffer, signParams.witnessScript, `${posType} requires witnessScript`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessValue`);
            break;
        case 'p2sh-p2wsh-p2ms':
        case 'p2sh-p2wsh-p2pk':
        case 'p2sh-p2wsh-p2pkh':
            if (prevOutType && prevOutType !== 'scripthash') {
                throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
            }
            tfMessage(typeforce.Buffer, signParams.witnessScript, `${posType} requires witnessScript`);
            tfMessage(typeforce.Buffer, signParams.redeemScript, `${posType} requires witnessScript`);
            tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessScript`);
            break;
        case 'p2tr':
            if (prevOutType && prevOutType !== 'taproot') {
                throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
            }
            tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
            break;
        case 'p2tr-p2ns':
            if (prevOutType && prevOutType !== 'taproot') {
                throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
            }
            inputs[signParams.vin].prevOutType = inputs[signParams.vin].prevOutType || 'taproot';
            tfMessage(typeforce.Buffer, signParams.witnessScript, `${posType} requires witnessScript`);
            tfMessage(typeforce.Buffer, signParams.controlBlock, `${posType} requires controlBlock`);
            tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
            break;
    }
}
function trySign({ input, ourPubKey, keyPair, signatureHash, hashType, useLowR, taptreeRoot, }) {
    if (input.witnessVersion === 1 && ourPubKey.length === 33)
        ourPubKey = ourPubKey.slice(1);
    // enforce in order signing of public keys
    let signed = false;
    for (const [i, pubKey] of input.pubkeys.entries()) {
        if (!ourPubKey.equals(pubKey))
            continue;
        if (input.signatures[i] && input.signatures[i].length > 0)
            throw new Error('Signature already exists');
        // TODO: add tests
        if (ourPubKey.length !== 33 && input.witnessVersion === 0) {
            throw new Error('BIP143 (Witness v0) inputs require compressed pubkeys');
        }
        else if (ourPubKey.length !== 32 && input.witnessVersion === 1) {
            throw new Error('BIP341 (Witness v1) inputs require x-only pubkeys');
        }
        if (input.witnessVersion === 1) {
            if (!input.witnessScript) {
                // FIXME: Workaround for not having proper tweaking support for key path
                if (!keyPair.privateKey) {
                    throw new Error(`unexpected keypair`);
                }
                const privateKey = _7.taproot.tapTweakPrivkey(noble_ecc_1.ecc, ourPubKey, keyPair.privateKey, taptreeRoot);
                keyPair = noble_ecc_1.ECPair.fromPrivateKey(Buffer.from(privateKey));
            }
            // https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#common-signature-message
            const signature = keyPair.signSchnorr(signatureHash);
            // SIGHASH_DEFAULT is omitted from the signature
            if (hashType === _8.Transaction.SIGHASH_DEFAULT) {
                input.signatures[i] = Buffer.from(signature);
            }
            else {
                input.signatures[i] = Buffer.concat([signature, Buffer.of(hashType)]);
            }
        }
        else {
            const signature = keyPair.sign(signatureHash, useLowR);
            input.signatures[i] = _5.script.signature.encode(signature, hashType);
        }
        signed = true;
    }
    if (!signed)
        throw new Error('Key pair cannot sign for this input');
}
function getSigningData(network, inputs, needsOutputs, tx, signParams, keyPair, redeemScript, hashType, witnessValue, witnessScript, controlBlock, annex, useLowR) {
    let vin;
    if (typeof signParams === 'number') {
        console.warn('DEPRECATED: TransactionBuilder sign method arguments ' + 'will change in v6, please use the TxbSignArg interface');
        vin = signParams;
    }
    else if (typeof signParams === 'object') {
        checkSignArgs(inputs, signParams);
        ({ vin, keyPair, redeemScript, hashType, witnessValue, witnessScript, controlBlock, annex } = signParams);
    }
    else {
        throw new TypeError('TransactionBuilder sign first arg must be TxbSignArg or number');
    }
    if (keyPair === undefined) {
        throw new Error('sign requires keypair');
    }
    if (!inputs[vin])
        throw new Error('No input at index: ' + vin);
    const input = inputs[vin];
    // if redeemScript was previously provided, enforce consistency
    if (input.redeemScript !== undefined && redeemScript && !input.redeemScript.equals(redeemScript)) {
        throw new Error('Inconsistent redeemScript');
    }
    const ourPubKey = keyPair.publicKey || (keyPair.getPublicKey && keyPair.getPublicKey());
    if (!canSign(input)) {
        if (witnessValue !== undefined) {
            if (input.value !== undefined && input.value !== witnessValue) {
                throw new Error('Input did not match witnessValue');
            }
            typeforce(types.Satoshi, witnessValue);
            input.value = witnessValue;
        }
        if (!canSign(input)) {
            const prepared = prepareInput(input, ourPubKey, redeemScript, witnessScript, controlBlock, annex);
            // updates inline
            Object.assign(input, prepared);
        }
        if (!canSign(input))
            throw Error(input.prevOutType + ' not supported');
    }
    // hashType can be 0 in Taproot, so can't use hashType || SIGHASH_ALL
    if (input.witnessVersion === 1) {
        hashType = hashType === undefined ? _8.Transaction.SIGHASH_DEFAULT : hashType;
    }
    else {
        hashType = hashType || _8.Transaction.SIGHASH_ALL;
    }
    if (needsOutputs(hashType))
        throw new Error('Transaction needs outputs');
    // TODO: This is not the best place to do this, but might stick with it until PSBT
    let leafHash;
    let taptreeRoot;
    if (controlBlock && witnessScript) {
        leafHash = _7.taproot.getTapleafHash(noble_ecc_1.ecc, controlBlock, witnessScript);
        taptreeRoot = _7.taproot.getTaptreeRoot(noble_ecc_1.ecc, controlBlock, witnessScript, leafHash);
    }
    // ready to sign
    let signatureHash;
    switch (input.witnessVersion) {
        case undefined:
            signatureHash = tx.hashForSignature(vin, input.signScript, hashType, input.value);
            break;
        case 0:
            signatureHash = tx.hashForWitnessV0(vin, input.signScript, input.value, hashType);
            break;
        case 1:
            signatureHash = tx.hashForWitnessV1(vin, inputs.map(({ prevOutScript }) => prevOutScript), inputs.map(({ value }) => value), hashType, leafHash);
            break;
        default:
            throw new TypeError('Unsupported witness version');
    }
    return {
        input,
        ourPubKey,
        keyPair,
        signatureHash,
        hashType,
        useLowR: !!useLowR,
        taptreeRoot,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25fYnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2FjdGlvbl9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUFpRDtBQUNqRCx5QkFBdUQ7QUFDdkQsNkRBQTZEO0FBQzdELHVDQUF1QztBQUN2Qyx5QkFBdUM7QUFDdkMseUJBQThCO0FBRTlCLHlCQUE4QjtBQUU5Qix5QkFBdUM7QUFDdkMseUJBQW9DO0FBQ3BDLHlCQUE2QjtBQUM3Qix5QkFBMkM7QUFDM0MsMkNBQW9EO0FBVXBELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUV2QyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQVEsRUFBVyxFQUFFO0lBQ3pDLE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxXQUFXLEtBQUssVUFBVSxDQUFDO0FBQ3BILENBQUMsQ0FBQztBQUVGLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQWdCLElBQUksR0FBRyxDQUFDO0lBQ3pDLE1BQU07SUFDTixPQUFPO0lBQ1AsTUFBTTtJQUNOLFFBQVE7SUFDUixNQUFNO0lBQ04sZUFBZTtJQUNmLFlBQVk7SUFDWixXQUFXO0lBQ1gsYUFBYTtJQUNiLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsYUFBYTtJQUNiLFlBQVk7SUFDWixZQUFZO0lBQ1oscUJBQXFCO0lBQ3JCLGtCQUFrQjtJQUNsQixpQkFBaUI7SUFDakIsaUJBQWlCO0lBQ2pCLGVBQWU7SUFDZixNQUFNO0lBQ04sa0JBQWtCO0lBQ2xCLFdBQVc7Q0FDWixDQUFDLENBQUM7QUFrREgsU0FBUyxTQUFTLENBQUMsSUFBUyxFQUFFLEtBQVUsRUFBRSxPQUFlO0lBQ3ZE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QUFZLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ3JGO0lBRUQsZ0JBQWdCO0lBQ2hCLElBQUksYUFBcUIsQ0FBQztJQUMxQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7UUFDNUIsS0FBSyxTQUFTO1lBQ1osYUFBYSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFVBQW9CLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1RixNQUFNO1FBQ1IsS0FBSyxDQUFDO1lBQ0osYUFBYSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFVBQW9CLEVBQUUsS0FBSyxDQUFDLEtBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkcsTUFBTTtRQUNSLEtBQUssQ0FBQztZQUNKLGFBQWEsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQ2pDLEdBQUcsRUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsYUFBdUIsQ0FBQyxFQUMxRCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsS0FBZ0IsQ0FBQyxFQUMzQyxRQUFRLEVBQ1IsUUFBUSxDQUNULENBQUM7WUFDRixNQUFNO1FBQ1I7WUFDRSxNQUFNLElBQUksU0FBUyxDQUFDLDZCQUE2QixDQUFDLENBQUM7S0FDdEQ7SUFFRCxPQUFPO1FBQ0wsS0FBSztRQUNMLFNBQVM7UUFDVCxPQUFPO1FBQ1AsYUFBYTtRQUNiLFFBQVE7UUFDUixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU87UUFDbEIsV0FBVztLQUNaLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvdHlwZXMnO1xyXG5pbXBvcnQgeyBhZGRyZXNzIGFzIGJhZGRyZXNzLCBwMnRyUGF5bWVudHMgfSBmcm9tICcuLyc7XHJcbmltcG9ydCAqIGFzIGJ1ZmZlcnV0aWxzIGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL2J1ZmZlcnV0aWxzJztcclxuaW1wb3J0ICogYXMgY2xhc3NpZnkgZnJvbSAnLi9jbGFzc2lmeSc7XHJcbmltcG9ydCB7IGNyeXB0byBhcyBiY3J5cHRvIH0gZnJvbSAnLi8nO1xyXG5pbXBvcnQgeyBuZXR3b3JrcyB9IGZyb20gJy4vJztcclxuaW1wb3J0IHsgTmV0d29yayB9IGZyb20gJy4vJztcclxuaW1wb3J0IHsgcGF5bWVudHMgfSBmcm9tICcuLyc7XHJcbmltcG9ydCB7IFBheW1lbnQgfSBmcm9tICcuLyc7XHJcbmltcG9ydCB7IHNjcmlwdCBhcyBic2NyaXB0IH0gZnJvbSAnLi8nO1xyXG5pbXBvcnQgeyBvcGNvZGVzIGFzIG9wcyB9IGZyb20gJy4vJztcclxuaW1wb3J0IHsgdGFwcm9vdCB9IGZyb20gJy4vJztcclxuaW1wb3J0IHsgVHhPdXRwdXQsIFRyYW5zYWN0aW9uIH0gZnJvbSAnLi8nO1xyXG5pbXBvcnQgeyBFQ1BhaXIsIGVjYyBhcyBlY2NMaWIgfSBmcm9tICcuL25vYmxlX2VjYyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lciB7XHJcbiAgcHJpdmF0ZUtleT86IEJ1ZmZlcjtcclxuICBwdWJsaWNLZXk6IEJ1ZmZlcjtcclxuICBnZXRQdWJsaWNLZXk/KCk6IEJ1ZmZlcjtcclxuICBzaWduKGhhc2g6IEJ1ZmZlciwgbG93Uj86IGJvb2xlYW4pOiBCdWZmZXI7XHJcbiAgc2lnblNjaG5vcnIoaGFzaDogQnVmZmVyKTogQnVmZmVyO1xyXG59XHJcblxyXG5jb25zdCB0eXBlZm9yY2UgPSByZXF1aXJlKCd0eXBlZm9yY2UnKTtcclxuXHJcbmNvbnN0IHRmRnVsbFNpZ25lciA9IChvYmo6IGFueSk6IGJvb2xlYW4gPT4ge1xyXG4gIHJldHVybiB0eXBlZm9yY2UuQnVmZmVyKG9iai5wdWJsaWNLZXkpICYmIHR5cGVvZiBvYmouc2lnbiA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLnNpZ25TY2hub3JyID09PSAnZnVuY3Rpb24nO1xyXG59O1xyXG5cclxuY29uc3QgU0NSSVBUX1RZUEVTID0gY2xhc3NpZnkudHlwZXM7XHJcblxyXG5jb25zdCBQUkVWT1VUX1RZUEVTOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoW1xyXG4gIC8vIFJhd1xyXG4gICdwMnBraCcsXHJcbiAgJ3AycGsnLFxyXG4gICdwMndwa2gnLFxyXG4gICdwMm1zJyxcclxuICAvLyBQMlNIIHdyYXBwZWRcclxuICAncDJzaC1wMnBraCcsXHJcbiAgJ3Ayc2gtcDJwaycsXHJcbiAgJ3Ayc2gtcDJ3cGtoJyxcclxuICAncDJzaC1wMm1zJyxcclxuICAvLyBQMldTSCB3cmFwcGVkXHJcbiAgJ3Ayd3NoLXAycGtoJyxcclxuICAncDJ3c2gtcDJwaycsXHJcbiAgJ3Ayd3NoLXAybXMnLFxyXG4gIC8vIFAyU0gtUDJXU0ggd3JhcHBlclxyXG4gICdwMnNoLXAyd3NoLXAycGtoJyxcclxuICAncDJzaC1wMndzaC1wMnBrJyxcclxuICAncDJzaC1wMndzaC1wMm1zJyxcclxuICAvLyBQMlRSIEtleVBhdGhcclxuICAncDJ0cicsXHJcbiAgLy8gUDJUUiBTY3JpcHRQYXRoXHJcbiAgJ3AydHItcDJucycsXHJcbl0pO1xyXG5cclxudHlwZSBNYXliZUJ1ZmZlciA9IEJ1ZmZlciB8IHVuZGVmaW5lZDtcclxudHlwZSBUeGJTaWduYXR1cmVzID0gQnVmZmVyW10gfCBNYXliZUJ1ZmZlcltdO1xyXG50eXBlIFR4YlB1YmtleXMgPSBNYXliZUJ1ZmZlcltdO1xyXG50eXBlIFR4YldpdG5lc3MgPSBCdWZmZXJbXTtcclxudHlwZSBUeGJTY3JpcHRUeXBlID0gc3RyaW5nO1xyXG50eXBlIFR4YlNjcmlwdCA9IEJ1ZmZlcjtcclxuXHJcbmludGVyZmFjZSBUeGJJbnB1dDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPiB7XHJcbiAgdmFsdWU/OiBUTnVtYmVyO1xyXG4gIHdpdG5lc3NWZXJzaW9uPzogbnVtYmVyO1xyXG4gIHNpZ25TY3JpcHQ/OiBUeGJTY3JpcHQ7XHJcbiAgc2lnblR5cGU/OiBUeGJTY3JpcHRUeXBlO1xyXG4gIHByZXZPdXRTY3JpcHQ/OiBUeGJTY3JpcHQ7XHJcbiAgcmVkZWVtU2NyaXB0PzogVHhiU2NyaXB0O1xyXG4gIHJlZGVlbVNjcmlwdFR5cGU/OiBUeGJTY3JpcHRUeXBlO1xyXG4gIHByZXZPdXRUeXBlPzogVHhiU2NyaXB0VHlwZTtcclxuICBwdWJrZXlzPzogVHhiUHVia2V5cztcclxuICBzaWduYXR1cmVzPzogVHhiU2lnbmF0dXJlcztcclxuICB3aXRuZXNzPzogVHhiV2l0bmVzcztcclxuICB3aXRuZXNzU2NyaXB0PzogVHhiU2NyaXB0O1xyXG4gIHdpdG5lc3NTY3JpcHRUeXBlPzogVHhiU2NyaXB0VHlwZTtcclxuICBjb250cm9sQmxvY2s/OiBCdWZmZXI7XHJcbiAgYW5uZXg/OiBCdWZmZXI7XHJcbiAgc2NyaXB0PzogVHhiU2NyaXB0O1xyXG4gIHNlcXVlbmNlPzogbnVtYmVyO1xyXG4gIHNjcmlwdFNpZz86IFR4YlNjcmlwdDtcclxuICBtYXhTaWduYXR1cmVzPzogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVHhiT3V0cHV0IHtcclxuICB0eXBlOiBzdHJpbmc7XHJcbiAgcHVia2V5cz86IFR4YlB1YmtleXM7XHJcbiAgc2lnbmF0dXJlcz86IFR4YlNpZ25hdHVyZXM7XHJcbiAgbWF4U2lnbmF0dXJlcz86IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFR4YlNpZ25Bcmc8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4ge1xyXG4gIHByZXZPdXRTY3JpcHRUeXBlOiBzdHJpbmc7XHJcbiAgdmluOiBudW1iZXI7XHJcbiAga2V5UGFpcjogU2lnbmVyO1xyXG4gIHJlZGVlbVNjcmlwdD86IEJ1ZmZlcjtcclxuICBoYXNoVHlwZT86IG51bWJlcjtcclxuICB3aXRuZXNzVmFsdWU/OiBUTnVtYmVyO1xyXG4gIHdpdG5lc3NTY3JpcHQ/OiBCdWZmZXI7XHJcbiAgY29udHJvbEJsb2NrPzogQnVmZmVyO1xyXG4gIGFubmV4PzogQnVmZmVyO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0Zk1lc3NhZ2UodHlwZTogYW55LCB2YWx1ZTogYW55LCBtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcclxuICB0cnkge1xyXG4gICAgdHlwZWZvcmNlKHR5cGUsIHZhbHVlKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR4SXNTdHJpbmc8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgdHg6IEJ1ZmZlciB8IHN0cmluZyB8IFRyYW5zYWN0aW9uPFROdW1iZXI+XHJcbik6IHR4IGlzIHN0cmluZyB7XHJcbiAgcmV0dXJuIHR5cGVvZiB0eCA9PT0gJ3N0cmluZycgfHwgdHggaW5zdGFuY2VvZiBTdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR4SXNUcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICB0eDogQnVmZmVyIHwgc3RyaW5nIHwgVHJhbnNhY3Rpb248VE51bWJlcj5cclxuKTogdHggaXMgVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gIHJldHVybiB0eCBpbnN0YW5jZW9mIFRyYW5zYWN0aW9uO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+IHtcclxuICBzdGF0aWMgZnJvbVRyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gICAgdHJhbnNhY3Rpb246IFRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gICAgbmV0d29yaz86IE5ldHdvcmssXHJcbiAgICBwcmV2T3V0cHV0cz86IFR4T3V0cHV0PFROdW1iZXI+W11cclxuICApOiBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4ge1xyXG4gICAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihuZXR3b3JrKTtcclxuXHJcbiAgICAvLyBDb3B5IHRyYW5zYWN0aW9uIGZpZWxkc1xyXG4gICAgdHhiLnNldFZlcnNpb24odHJhbnNhY3Rpb24udmVyc2lvbik7XHJcbiAgICB0eGIuc2V0TG9ja1RpbWUodHJhbnNhY3Rpb24ubG9ja3RpbWUpO1xyXG5cclxuICAgIC8vIENvcHkgb3V0cHV0cyAoZG9uZSBmaXJzdCB0byBhdm9pZCBzaWduYXR1cmUgaW52YWxpZGF0aW9uKVxyXG4gICAgdHJhbnNhY3Rpb24ub3V0cy5mb3JFYWNoKCh0eE91dCkgPT4ge1xyXG4gICAgICB0eGIuYWRkT3V0cHV0KHR4T3V0LnNjcmlwdCwgKHR4T3V0IGFzIFR4T3V0cHV0PFROdW1iZXI+KS52YWx1ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDb3B5IGlucHV0c1xyXG4gICAgdHJhbnNhY3Rpb24uaW5zLmZvckVhY2goKHR4SW4pID0+IHtcclxuICAgICAgdHhiLl9fYWRkSW5wdXRVbnNhZmUodHhJbi5oYXNoLCB0eEluLmluZGV4LCB7XHJcbiAgICAgICAgc2VxdWVuY2U6IHR4SW4uc2VxdWVuY2UsXHJcbiAgICAgICAgc2NyaXB0OiB0eEluLnNjcmlwdCxcclxuICAgICAgICB3aXRuZXNzOiB0eEluLndpdG5lc3MsXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gZml4IHNvbWUgdGhpbmdzIG5vdCBwb3NzaWJsZSB0aHJvdWdoIHRoZSBwdWJsaWMgQVBJXHJcbiAgICB0eGIuX19JTlBVVFMuZm9yRWFjaCgoaW5wdXQsIGkpID0+IHtcclxuICAgICAgZml4TXVsdGlzaWdPcmRlcjxUTnVtYmVyPihpbnB1dCwgdHJhbnNhY3Rpb24sIGksIHByZXZPdXRwdXRzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0eGI7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9fUFJFVl9UWF9TRVQ6IHsgW2luZGV4OiBzdHJpbmddOiBib29sZWFuIH07XHJcbiAgcHJpdmF0ZSBfX0lOUFVUUzogQXJyYXk8VHhiSW5wdXQ8VE51bWJlcj4+O1xyXG4gIHByaXZhdGUgX19UWDogVHJhbnNhY3Rpb248VE51bWJlcj47XHJcbiAgcHJpdmF0ZSBfX1VTRV9MT1dfUjogYm9vbGVhbjtcclxuXHJcbiAgLy8gV0FSTklORzogbWF4aW11bUZlZVJhdGUgaXMgX19OT1RfXyB0byBiZSByZWxpZWQgb24sXHJcbiAgLy8gICAgICAgICAgaXQncyBqdXN0IGFub3RoZXIgcG90ZW50aWFsIHNhZmV0eSBtZWNoYW5pc20gKHNhZmV0eSBpbi1kZXB0aClcclxuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmV0d29yazogTmV0d29yayA9IG5ldHdvcmtzLmJpdGNvaW4sIHB1YmxpYyBtYXhpbXVtRmVlUmF0ZTogbnVtYmVyID0gMjUwMCkge1xyXG4gICAgdGhpcy5fX1BSRVZfVFhfU0VUID0ge307XHJcbiAgICB0aGlzLl9fSU5QVVRTID0gW107XHJcbiAgICB0aGlzLl9fVFggPSBuZXcgVHJhbnNhY3Rpb248VE51bWJlcj4oKTtcclxuICAgIHRoaXMuX19UWC52ZXJzaW9uID0gMjtcclxuICAgIHRoaXMuX19VU0VfTE9XX1IgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHNldExvd1Ioc2V0dGluZz86IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgIHR5cGVmb3JjZSh0eXBlZm9yY2UubWF5YmUodHlwZWZvcmNlLkJvb2xlYW4pLCBzZXR0aW5nKTtcclxuICAgIGlmIChzZXR0aW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgc2V0dGluZyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9fVVNFX0xPV19SID0gc2V0dGluZztcclxuICAgIHJldHVybiBzZXR0aW5nO1xyXG4gIH1cclxuXHJcbiAgc2V0TG9ja1RpbWUobG9ja3RpbWU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgdHlwZWZvcmNlKHR5cGVzLlVJbnQzMiwgbG9ja3RpbWUpO1xyXG5cclxuICAgIC8vIGlmIGFueSBzaWduYXR1cmVzIGV4aXN0LCB0aHJvd1xyXG4gICAgaWYgKFxyXG4gICAgICB0aGlzLl9fSU5QVVRTLnNvbWUoKGlucHV0KSA9PiB7XHJcbiAgICAgICAgaWYgKCFpbnB1dC5zaWduYXR1cmVzKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBpbnB1dC5zaWduYXR1cmVzLnNvbWUoKHMpID0+IHMgIT09IHVuZGVmaW5lZCk7XHJcbiAgICAgIH0pXHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObywgdGhpcyB3b3VsZCBpbnZhbGlkYXRlIHNpZ25hdHVyZXMnKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9fVFgubG9ja3RpbWUgPSBsb2NrdGltZTtcclxuICB9XHJcblxyXG4gIHNldFZlcnNpb24odmVyc2lvbjogbnVtYmVyKTogdm9pZCB7XHJcbiAgICB0eXBlZm9yY2UodHlwZXMuVUludDMyLCB2ZXJzaW9uKTtcclxuXHJcbiAgICAvLyBYWFg6IHRoaXMgbWlnaHQgZXZlbnR1YWxseSBiZWNvbWUgbW9yZSBjb21wbGV4IGRlcGVuZGluZyBvbiB3aGF0IHRoZSB2ZXJzaW9ucyByZXByZXNlbnRcclxuICAgIHRoaXMuX19UWC52ZXJzaW9uID0gdmVyc2lvbjtcclxuICB9XHJcblxyXG4gIGFkZElucHV0KFxyXG4gICAgdHhIYXNoOiBCdWZmZXIgfCBzdHJpbmcgfCBUcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICAgIHZvdXQ6IG51bWJlcixcclxuICAgIHNlcXVlbmNlPzogbnVtYmVyLFxyXG4gICAgcHJldk91dFNjcmlwdD86IEJ1ZmZlcixcclxuICAgIHZhbHVlPzogVE51bWJlclxyXG4gICk6IG51bWJlciB7XHJcbiAgICBpZiAoIXRoaXMuX19jYW5Nb2RpZnlJbnB1dHMoKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vLCB0aGlzIHdvdWxkIGludmFsaWRhdGUgc2lnbmF0dXJlcycpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlzIGl0IGEgaGV4IHN0cmluZz9cclxuICAgIGlmICh0eElzU3RyaW5nKHR4SGFzaCkpIHtcclxuICAgICAgLy8gdHJhbnNhY3Rpb24gaGFzaHMncyBhcmUgZGlzcGxheWVkIGluIHJldmVyc2Ugb3JkZXIsIHVuLXJldmVyc2UgaXRcclxuICAgICAgdHhIYXNoID0gYnVmZmVydXRpbHMucmV2ZXJzZUJ1ZmZlcihCdWZmZXIuZnJvbSh0eEhhc2gsICdoZXgnKSk7XHJcblxyXG4gICAgICAvLyBpcyBpdCBhIFRyYW5zYWN0aW9uIG9iamVjdD9cclxuICAgIH0gZWxzZSBpZiAodHhJc1RyYW5zYWN0aW9uKHR4SGFzaCkpIHtcclxuICAgICAgY29uc3QgdHhPdXQgPSB0eEhhc2gub3V0c1t2b3V0XTtcclxuICAgICAgcHJldk91dFNjcmlwdCA9IHR4T3V0LnNjcmlwdDtcclxuICAgICAgdmFsdWUgPSAodHhPdXQgYXMgVHhPdXRwdXQ8VE51bWJlcj4pLnZhbHVlO1xyXG5cclxuICAgICAgdHhIYXNoID0gdHhIYXNoLmdldEhhc2goZmFsc2UpIGFzIEJ1ZmZlcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5fX2FkZElucHV0VW5zYWZlKHR4SGFzaCwgdm91dCwge1xyXG4gICAgICBzZXF1ZW5jZSxcclxuICAgICAgcHJldk91dFNjcmlwdCxcclxuICAgICAgdmFsdWUsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFkZE91dHB1dChzY3JpcHRQdWJLZXk6IHN0cmluZyB8IEJ1ZmZlciwgdmFsdWU6IFROdW1iZXIpOiBudW1iZXIge1xyXG4gICAgaWYgKCF0aGlzLl9fY2FuTW9kaWZ5T3V0cHV0cygpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8sIHRoaXMgd291bGQgaW52YWxpZGF0ZSBzaWduYXR1cmVzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXR0ZW1wdCB0byBnZXQgYSBzY3JpcHQgaWYgaXQncyBhIGJhc2U1OCBvciBiZWNoMzIgYWRkcmVzcyBzdHJpbmdcclxuICAgIGlmICh0eXBlb2Ygc2NyaXB0UHViS2V5ID09PSAnc3RyaW5nJykge1xyXG4gICAgICBzY3JpcHRQdWJLZXkgPSBiYWRkcmVzcy50b091dHB1dFNjcmlwdChzY3JpcHRQdWJLZXksIHRoaXMubmV0d29yayk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX19UWC5hZGRPdXRwdXQoc2NyaXB0UHViS2V5LCB2YWx1ZSk7XHJcbiAgfVxyXG5cclxuICBidWlsZCgpOiBUcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fX2J1aWxkKGZhbHNlKTtcclxuICB9XHJcblxyXG4gIGJ1aWxkSW5jb21wbGV0ZSgpOiBUcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fX2J1aWxkKHRydWUpO1xyXG4gIH1cclxuXHJcbiAgc2lnbihcclxuICAgIHNpZ25QYXJhbXM6IG51bWJlciB8IFR4YlNpZ25Bcmc8VE51bWJlcj4sXHJcbiAgICBrZXlQYWlyPzogU2lnbmVyLFxyXG4gICAgcmVkZWVtU2NyaXB0PzogQnVmZmVyLFxyXG4gICAgaGFzaFR5cGU/OiBudW1iZXIsXHJcbiAgICB3aXRuZXNzVmFsdWU/OiBUTnVtYmVyLFxyXG4gICAgd2l0bmVzc1NjcmlwdD86IEJ1ZmZlcixcclxuICAgIGNvbnRyb2xCbG9jaz86IEJ1ZmZlcixcclxuICAgIGFubmV4PzogQnVmZmVyXHJcbiAgKTogdm9pZCB7XHJcbiAgICB0cnlTaWduPFROdW1iZXI+KFxyXG4gICAgICBnZXRTaWduaW5nRGF0YTxUTnVtYmVyPihcclxuICAgICAgICB0aGlzLm5ldHdvcmssXHJcbiAgICAgICAgdGhpcy5fX0lOUFVUUyxcclxuICAgICAgICB0aGlzLl9fbmVlZHNPdXRwdXRzLmJpbmQodGhpcyksXHJcbiAgICAgICAgdGhpcy5fX1RYLFxyXG4gICAgICAgIHNpZ25QYXJhbXMsXHJcbiAgICAgICAga2V5UGFpcixcclxuICAgICAgICByZWRlZW1TY3JpcHQsXHJcbiAgICAgICAgaGFzaFR5cGUsXHJcbiAgICAgICAgd2l0bmVzc1ZhbHVlLFxyXG4gICAgICAgIHdpdG5lc3NTY3JpcHQsXHJcbiAgICAgICAgY29udHJvbEJsb2NrLFxyXG4gICAgICAgIGFubmV4LFxyXG4gICAgICAgIHRoaXMuX19VU0VfTE9XX1JcclxuICAgICAgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX19hZGRJbnB1dFVuc2FmZSh0eEhhc2g6IEJ1ZmZlciwgdm91dDogbnVtYmVyLCBvcHRpb25zOiBUeGJJbnB1dDxUTnVtYmVyPik6IG51bWJlciB7XHJcbiAgICBpZiAoVHJhbnNhY3Rpb24uaXNDb2luYmFzZUhhc2godHhIYXNoKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvaW5iYXNlIGlucHV0cyBub3Qgc3VwcG9ydGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHJldlR4T3V0ID0gdHhIYXNoLnRvU3RyaW5nKCdoZXgnKSArICc6JyArIHZvdXQ7XHJcbiAgICBpZiAodGhpcy5fX1BSRVZfVFhfU0VUW3ByZXZUeE91dF0gIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKCdEdXBsaWNhdGUgVHhPdXQ6ICcgKyBwcmV2VHhPdXQpO1xyXG5cclxuICAgIGxldCBpbnB1dDogVHhiSW5wdXQ8VE51bWJlcj4gPSB7fTtcclxuXHJcbiAgICAvLyBkZXJpdmUgd2hhdCB3ZSBjYW4gZnJvbSB0aGUgc2NyaXB0U2lnXHJcbiAgICBpZiAob3B0aW9ucy5zY3JpcHQgIT09IHVuZGVmaW5lZCB8fCBvcHRpb25zLndpdG5lc3MgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpbnB1dCA9IGV4cGFuZElucHV0PFROdW1iZXI+KG9wdGlvbnMuc2NyaXB0LCBvcHRpb25zLndpdG5lc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIGFuIGlucHV0IHZhbHVlIHdhcyBnaXZlbiwgcmV0YWluIGl0XHJcbiAgICBpZiAob3B0aW9ucy52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlucHV0LnZhbHVlID0gb3B0aW9ucy52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkZXJpdmUgd2hhdCB3ZSBjYW4gZnJvbSB0aGUgcHJldmlvdXMgdHJhbnNhY3Rpb25zIG91dHB1dCBzY3JpcHRcclxuICAgIGlmICghaW5wdXQucHJldk91dFNjcmlwdCAmJiBvcHRpb25zLnByZXZPdXRTY3JpcHQpIHtcclxuICAgICAgbGV0IHByZXZPdXRUeXBlO1xyXG5cclxuICAgICAgaWYgKCFpbnB1dC5wdWJrZXlzICYmICFpbnB1dC5zaWduYXR1cmVzKSB7XHJcbiAgICAgICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRPdXRwdXQob3B0aW9ucy5wcmV2T3V0U2NyaXB0KTtcclxuICAgICAgICBpZiAoZXhwYW5kZWQucHVia2V5cykge1xyXG4gICAgICAgICAgaW5wdXQucHVia2V5cyA9IGV4cGFuZGVkLnB1YmtleXM7XHJcbiAgICAgICAgICBpbnB1dC5zaWduYXR1cmVzID0gZXhwYW5kZWQuc2lnbmF0dXJlcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByZXZPdXRUeXBlID0gZXhwYW5kZWQudHlwZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaW5wdXQucHJldk91dFNjcmlwdCA9IG9wdGlvbnMucHJldk91dFNjcmlwdDtcclxuICAgICAgaW5wdXQucHJldk91dFR5cGUgPSBwcmV2T3V0VHlwZSB8fCBjbGFzc2lmeS5vdXRwdXQob3B0aW9ucy5wcmV2T3V0U2NyaXB0KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2aW4gPSB0aGlzLl9fVFguYWRkSW5wdXQodHhIYXNoLCB2b3V0LCBvcHRpb25zLnNlcXVlbmNlLCBvcHRpb25zLnNjcmlwdFNpZyk7XHJcbiAgICB0aGlzLl9fSU5QVVRTW3Zpbl0gPSBpbnB1dDtcclxuICAgIHRoaXMuX19QUkVWX1RYX1NFVFtwcmV2VHhPdXRdID0gdHJ1ZTtcclxuICAgIHJldHVybiB2aW47XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9fYnVpbGQoYWxsb3dJbmNvbXBsZXRlPzogYm9vbGVhbik6IFRyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICAgIGlmICghYWxsb3dJbmNvbXBsZXRlKSB7XHJcbiAgICAgIGlmICghdGhpcy5fX1RYLmlucy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignVHJhbnNhY3Rpb24gaGFzIG5vIGlucHV0cycpO1xyXG4gICAgICBpZiAoIXRoaXMuX19UWC5vdXRzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2FjdGlvbiBoYXMgbm8gb3V0cHV0cycpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHR4ID0gdGhpcy5fX1RYLmNsb25lKCk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHNjcmlwdCBzaWduYXR1cmVzIGZyb20gaW5wdXRzXHJcbiAgICB0aGlzLl9fSU5QVVRTLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XHJcbiAgICAgIGlmICghaW5wdXQucHJldk91dFR5cGUgJiYgIWFsbG93SW5jb21wbGV0ZSkgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2FjdGlvbiBpcyBub3QgY29tcGxldGUnKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGJ1aWxkPFROdW1iZXI+KGlucHV0LnByZXZPdXRUeXBlISwgaW5wdXQsIGFsbG93SW5jb21wbGV0ZSk7XHJcbiAgICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKCFhbGxvd0luY29tcGxldGUgJiYgaW5wdXQucHJldk91dFR5cGUgPT09IFNDUklQVF9UWVBFUy5OT05TVEFOREFSRCkgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGlucHV0IHR5cGUnKTtcclxuICAgICAgICBpZiAoIWFsbG93SW5jb21wbGV0ZSkgdGhyb3cgbmV3IEVycm9yKCdOb3QgZW5vdWdoIGluZm9ybWF0aW9uJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocmVzdWx0LmlucHV0KSB7XHJcbiAgICAgICAgdHguc2V0SW5wdXRTY3JpcHQoaSwgcmVzdWx0LmlucHV0KTtcclxuICAgICAgfVxyXG4gICAgICB0eC5zZXRXaXRuZXNzKGksIHJlc3VsdC53aXRuZXNzISk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIWFsbG93SW5jb21wbGV0ZSkge1xyXG4gICAgICAvLyBkbyBub3QgcmVseSBvbiB0aGlzLCBpdHMgbWVyZWx5IGEgbGFzdCByZXNvcnRcclxuICAgICAgaWYgKHRoaXMuX19vdmVyTWF4aW11bUZlZXModHgudmlydHVhbFNpemUoKSkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyYW5zYWN0aW9uIGhhcyBhYnN1cmQgZmVlcycpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHR4O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfX2Nhbk1vZGlmeUlucHV0cygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9fSU5QVVRTLmV2ZXJ5KChpbnB1dCkgPT4ge1xyXG4gICAgICBpZiAoIWlucHV0LnNpZ25hdHVyZXMpIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgcmV0dXJuIGlucHV0LnNpZ25hdHVyZXMuZXZlcnkoKHNpZ25hdHVyZSkgPT4ge1xyXG4gICAgICAgIGlmICghc2lnbmF0dXJlKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBjb25zdCBoYXNoVHlwZSA9IHNpZ25hdHVyZUhhc2hUeXBlKHNpZ25hdHVyZSk7XHJcblxyXG4gICAgICAgIC8vIGlmIFNJR0hBU0hfQU5ZT05FQ0FOUEFZIGlzIHNldCwgc2lnbmF0dXJlcyB3b3VsZCBub3RcclxuICAgICAgICAvLyBiZSBpbnZhbGlkYXRlZCBieSBtb3JlIGlucHV0c1xyXG4gICAgICAgIHJldHVybiAoaGFzaFR5cGUgJiBUcmFuc2FjdGlvbi5TSUdIQVNIX0FOWU9ORUNBTlBBWSkgIT09IDA7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9fbmVlZHNPdXRwdXRzKHNpZ25pbmdIYXNoVHlwZTogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoc2lnbmluZ0hhc2hUeXBlID09PSBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTCB8fCBzaWduaW5nSGFzaFR5cGUgPT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfREVGQVVMVCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fX1RYLm91dHMubGVuZ3RoID09PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIGlucHV0cyBhcmUgYmVpbmcgc2lnbmVkIHdpdGggU0lHSEFTSF9OT05FLCB3ZSBkb24ndCBzdHJpY3RseSBuZWVkIG91dHB1dHNcclxuICAgIC8vIC5idWlsZCgpIHdpbGwgZmFpbCwgYnV0IC5idWlsZEluY29tcGxldGUoKSBpcyBPS1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgdGhpcy5fX1RYLm91dHMubGVuZ3RoID09PSAwICYmXHJcbiAgICAgIHRoaXMuX19JTlBVVFMuc29tZSgoaW5wdXQpID0+IHtcclxuICAgICAgICBpZiAoIWlucHV0LnNpZ25hdHVyZXMpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnNpZ25hdHVyZXMuc29tZSgoc2lnbmF0dXJlKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIXNpZ25hdHVyZSkgcmV0dXJuIGZhbHNlOyAvLyBubyBzaWduYXR1cmUsIG5vIGlzc3VlXHJcbiAgICAgICAgICBjb25zdCBoYXNoVHlwZSA9IHNpZ25hdHVyZUhhc2hUeXBlKHNpZ25hdHVyZSk7XHJcbiAgICAgICAgICBpZiAoaGFzaFR5cGUgJiBUcmFuc2FjdGlvbi5TSUdIQVNIX05PTkUpIHJldHVybiBmYWxzZTsgLy8gU0lHSEFTSF9OT05FIGRvZXNuJ3QgY2FyZSBhYm91dCBvdXRwdXRzXHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gU0lHSEFTSF8qIGRvZXMgY2FyZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX19jYW5Nb2RpZnlPdXRwdXRzKCk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgbklucHV0cyA9IHRoaXMuX19UWC5pbnMubGVuZ3RoO1xyXG4gICAgY29uc3Qgbk91dHB1dHMgPSB0aGlzLl9fVFgub3V0cy5sZW5ndGg7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX19JTlBVVFMuZXZlcnkoKGlucHV0KSA9PiB7XHJcbiAgICAgIGlmIChpbnB1dC5zaWduYXR1cmVzID09PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgcmV0dXJuIGlucHV0LnNpZ25hdHVyZXMuZXZlcnkoKHNpZ25hdHVyZSkgPT4ge1xyXG4gICAgICAgIGlmICghc2lnbmF0dXJlKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBjb25zdCBoYXNoVHlwZSA9IHNpZ25hdHVyZUhhc2hUeXBlKHNpZ25hdHVyZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGhhc2hUeXBlTW9kID0gaGFzaFR5cGUgJiAweDFmO1xyXG4gICAgICAgIGlmIChoYXNoVHlwZU1vZCA9PT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9OT05FKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBpZiAoaGFzaFR5cGVNb2QgPT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfU0lOR0xFKSB7XHJcbiAgICAgICAgICAvLyBpZiBTSUdIQVNIX1NJTkdMRSBpcyBzZXQsIGFuZCBuSW5wdXRzID4gbk91dHB1dHNcclxuICAgICAgICAgIC8vIHNvbWUgc2lnbmF0dXJlcyB3b3VsZCBiZSBpbnZhbGlkYXRlZCBieSB0aGUgYWRkaXRpb25cclxuICAgICAgICAgIC8vIG9mIG1vcmUgb3V0cHV0c1xyXG4gICAgICAgICAgcmV0dXJuIG5JbnB1dHMgPD0gbk91dHB1dHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX19vdmVyTWF4aW11bUZlZXMoYnl0ZXM6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgLy8gbm90IGFsbCBpbnB1dHMgd2lsbCBoYXZlIC52YWx1ZSBkZWZpbmVkXHJcbiAgICBjb25zdCBpbmNvbWluZyA9IHRoaXMuX19JTlBVVFMucmVkdWNlKFxyXG4gICAgICAoYSwgeCkgPT4gYSArICh0eXBlb2YgeC52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgPyBCaWdJbnQoeC52YWx1ZSkgOiBCaWdJbnQoMCkpLFxyXG4gICAgICBCaWdJbnQoMClcclxuICAgICk7XHJcblxyXG4gICAgLy8gYnV0IGFsbCBvdXRwdXRzIGRvLCBhbmQgaWYgd2UgaGF2ZSBhbnkgaW5wdXQgdmFsdWVcclxuICAgIC8vIHdlIGNhbiBpbW1lZGlhdGVseSBkZXRlcm1pbmUgaWYgdGhlIG91dHB1dHMgYXJlIHRvbyBzbWFsbFxyXG4gICAgY29uc3Qgb3V0Z29pbmcgPSB0aGlzLl9fVFgub3V0cy5yZWR1Y2UoKGEsIHgpID0+IGEgKyBCaWdJbnQoKHggYXMgVHhPdXRwdXQ8VE51bWJlcj4pLnZhbHVlKSwgQmlnSW50KDApKTtcclxuICAgIGNvbnN0IGZlZSA9IGluY29taW5nIC0gb3V0Z29pbmc7XHJcbiAgICBjb25zdCBmZWVSYXRlID0gTnVtYmVyKGZlZSkgLyBieXRlczsgLy8gYXNzdW1lIGZlZSBmaXRzIHdpdGhpbiBudW1iZXJcclxuXHJcbiAgICByZXR1cm4gZmVlUmF0ZSA+IHRoaXMubWF4aW11bUZlZVJhdGU7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBleHBhbmRJbnB1dDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBzY3JpcHRTaWc/OiBCdWZmZXIsXHJcbiAgd2l0bmVzc1N0YWNrOiBCdWZmZXJbXSA9IFtdLFxyXG4gIHR5cGU/OiBzdHJpbmcsXHJcbiAgc2NyaXB0UHViS2V5PzogQnVmZmVyXHJcbik6IFR4YklucHV0PFROdW1iZXI+IHtcclxuICBpZiAoc2NyaXB0U2lnICYmIHNjcmlwdFNpZy5sZW5ndGggPT09IDAgJiYgd2l0bmVzc1N0YWNrLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHt9O1xyXG4gIGlmICghdHlwZSkge1xyXG4gICAgbGV0IHNzVHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gc2NyaXB0U2lnID8gY2xhc3NpZnkuaW5wdXQoc2NyaXB0U2lnLCB0cnVlKSA6IHVuZGVmaW5lZDtcclxuICAgIGxldCB3c1R5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGNsYXNzaWZ5LndpdG5lc3Mod2l0bmVzc1N0YWNrLCB0cnVlKTtcclxuICAgIGlmIChzc1R5cGUgPT09IFNDUklQVF9UWVBFUy5OT05TVEFOREFSRCkgc3NUeXBlID0gdW5kZWZpbmVkO1xyXG4gICAgaWYgKHdzVHlwZSA9PT0gU0NSSVBUX1RZUEVTLk5PTlNUQU5EQVJEKSB3c1R5cGUgPSB1bmRlZmluZWQ7XHJcbiAgICB0eXBlID0gc3NUeXBlIHx8IHdzVHlwZTtcclxuICB9XHJcblxyXG4gIHN3aXRjaCAodHlwZSkge1xyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJXUEtIOiB7XHJcbiAgICAgIGNvbnN0IHsgb3V0cHV0LCBwdWJrZXksIHNpZ25hdHVyZSB9ID0gcGF5bWVudHMucDJ3cGtoKHtcclxuICAgICAgICB3aXRuZXNzOiB3aXRuZXNzU3RhY2ssXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcmV2T3V0U2NyaXB0OiBvdXRwdXQsXHJcbiAgICAgICAgcHJldk91dFR5cGU6IFNDUklQVF9UWVBFUy5QMldQS0gsXHJcbiAgICAgICAgcHVia2V5czogW3B1YmtleV0sXHJcbiAgICAgICAgc2lnbmF0dXJlczogW3NpZ25hdHVyZV0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJQS0g6IHtcclxuICAgICAgY29uc3QgeyBvdXRwdXQsIHB1YmtleSwgc2lnbmF0dXJlIH0gPSBwYXltZW50cy5wMnBraCh7XHJcbiAgICAgICAgaW5wdXQ6IHNjcmlwdFNpZyxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHByZXZPdXRTY3JpcHQ6IG91dHB1dCxcclxuICAgICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyUEtILFxyXG4gICAgICAgIHB1YmtleXM6IFtwdWJrZXldLFxyXG4gICAgICAgIHNpZ25hdHVyZXM6IFtzaWduYXR1cmVdLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNhc2UgU0NSSVBUX1RZUEVTLlAyUEs6IHtcclxuICAgICAgY29uc3QgeyBzaWduYXR1cmUgfSA9IHBheW1lbnRzLnAycGsoeyBpbnB1dDogc2NyaXB0U2lnIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyUEssXHJcbiAgICAgICAgcHVia2V5czogW3VuZGVmaW5lZF0sXHJcbiAgICAgICAgc2lnbmF0dXJlczogW3NpZ25hdHVyZV0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJNUzoge1xyXG4gICAgICBjb25zdCB7IG0sIHB1YmtleXMsIHNpZ25hdHVyZXMgfSA9IHBheW1lbnRzLnAybXMoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaW5wdXQ6IHNjcmlwdFNpZyxcclxuICAgICAgICAgIG91dHB1dDogc2NyaXB0UHViS2V5LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgeyBhbGxvd0luY29tcGxldGU6IHRydWUgfVxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyTVMsXHJcbiAgICAgICAgcHVia2V5cyxcclxuICAgICAgICBzaWduYXR1cmVzLFxyXG4gICAgICAgIG1heFNpZ25hdHVyZXM6IG0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJUUl9OUzoge1xyXG4gICAgICBjb25zdCB7IG4sIHB1YmtleXMsIHNpZ25hdHVyZXMgfSA9IHAydHJQYXltZW50cy5wMnRyX25zKFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIFdpdG5lc3Mgc2lnbmF0dXJlcyBhcmUgcmV2ZXJzZSBvZiBwdWJrZXlzLCBiZWNhdXNlIGl0J3MgYSBzdGFja1xyXG4gICAgICAgICAgc2lnbmF0dXJlczogd2l0bmVzc1N0YWNrLmxlbmd0aCA/IHdpdG5lc3NTdGFjay5yZXZlcnNlKCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICBvdXRwdXQ6IHNjcmlwdFB1YktleSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHsgYWxsb3dJbmNvbXBsZXRlOiB0cnVlLCBlY2NMaWIgfVxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyVFJfTlMsXHJcbiAgICAgICAgcHVia2V5cyxcclxuICAgICAgICBzaWduYXR1cmVzLFxyXG4gICAgICAgIG1heFNpZ25hdHVyZXM6IG4sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZSA9PT0gU0NSSVBUX1RZUEVTLlAyU0gpIHtcclxuICAgIGNvbnN0IHsgb3V0cHV0LCByZWRlZW0gfSA9IHBheW1lbnRzLnAyc2goe1xyXG4gICAgICBpbnB1dDogc2NyaXB0U2lnLFxyXG4gICAgICB3aXRuZXNzOiB3aXRuZXNzU3RhY2ssXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBvdXRwdXRUeXBlID0gY2xhc3NpZnkub3V0cHV0KHJlZGVlbSEub3V0cHV0ISk7XHJcbiAgICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZElucHV0PFROdW1iZXI+KHJlZGVlbSEuaW5wdXQhLCByZWRlZW0hLndpdG5lc3MhLCBvdXRwdXRUeXBlLCByZWRlZW0hLm91dHB1dCk7XHJcbiAgICBpZiAoIWV4cGFuZGVkLnByZXZPdXRUeXBlKSByZXR1cm4ge307XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcHJldk91dFNjcmlwdDogb3V0cHV0LFxyXG4gICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyU0gsXHJcbiAgICAgIHJlZGVlbVNjcmlwdDogcmVkZWVtIS5vdXRwdXQsXHJcbiAgICAgIHJlZGVlbVNjcmlwdFR5cGU6IGV4cGFuZGVkLnByZXZPdXRUeXBlLFxyXG4gICAgICB3aXRuZXNzU2NyaXB0OiBleHBhbmRlZC53aXRuZXNzU2NyaXB0LFxyXG4gICAgICB3aXRuZXNzU2NyaXB0VHlwZTogZXhwYW5kZWQud2l0bmVzc1NjcmlwdFR5cGUsXHJcblxyXG4gICAgICBwdWJrZXlzOiBleHBhbmRlZC5wdWJrZXlzLFxyXG4gICAgICBzaWduYXR1cmVzOiBleHBhbmRlZC5zaWduYXR1cmVzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlID09PSBTQ1JJUFRfVFlQRVMuUDJXU0gpIHtcclxuICAgIGNvbnN0IHsgb3V0cHV0LCByZWRlZW0gfSA9IHBheW1lbnRzLnAyd3NoKHtcclxuICAgICAgaW5wdXQ6IHNjcmlwdFNpZyxcclxuICAgICAgd2l0bmVzczogd2l0bmVzc1N0YWNrLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBvdXRwdXRUeXBlID0gY2xhc3NpZnkub3V0cHV0KHJlZGVlbSEub3V0cHV0ISk7XHJcbiAgICBsZXQgZXhwYW5kZWQ7XHJcbiAgICBpZiAob3V0cHV0VHlwZSA9PT0gU0NSSVBUX1RZUEVTLlAyV1BLSCkge1xyXG4gICAgICBleHBhbmRlZCA9IGV4cGFuZElucHV0PFROdW1iZXI+KHJlZGVlbSEuaW5wdXQhLCByZWRlZW0hLndpdG5lc3MhLCBvdXRwdXRUeXBlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4cGFuZGVkID0gZXhwYW5kSW5wdXQ8VE51bWJlcj4oYnNjcmlwdC5jb21waWxlKHJlZGVlbSEud2l0bmVzcyEpLCBbXSwgb3V0cHV0VHlwZSwgcmVkZWVtIS5vdXRwdXQpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFleHBhbmRlZC5wcmV2T3V0VHlwZSkgcmV0dXJuIHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHByZXZPdXRTY3JpcHQ6IG91dHB1dCxcclxuICAgICAgcHJldk91dFR5cGU6IFNDUklQVF9UWVBFUy5QMldTSCxcclxuICAgICAgd2l0bmVzc1NjcmlwdDogcmVkZWVtIS5vdXRwdXQsXHJcbiAgICAgIHdpdG5lc3NTY3JpcHRUeXBlOiBleHBhbmRlZC5wcmV2T3V0VHlwZSxcclxuXHJcbiAgICAgIHB1YmtleXM6IGV4cGFuZGVkLnB1YmtleXMsXHJcbiAgICAgIHNpZ25hdHVyZXM6IGV4cGFuZGVkLnNpZ25hdHVyZXMsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGUgPT09IFNDUklQVF9UWVBFUy5QMlRSKSB7XHJcbiAgICBjb25zdCBwYXJzZWRXaXRuZXNzID0gdGFwcm9vdC5wYXJzZVRhcHJvb3RXaXRuZXNzKHdpdG5lc3NTdGFjayk7XHJcbiAgICBpZiAocGFyc2VkV2l0bmVzcy5zcGVuZFR5cGUgPT09ICdLZXknKSB7XHJcbiAgICAgIC8vIGtleSBwYXRoIHNwZW5kLCBub3RoaW5nIHRvIGV4cGFuZFxyXG4gICAgICBjb25zdCB7IHNpZ25hdHVyZSwgYW5uZXggfSA9IHBhcnNlZFdpdG5lc3M7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcHJldk91dFR5cGU6IFNDUklQVF9UWVBFUy5QMlRSLFxyXG4gICAgICAgIHNpZ25hdHVyZXM6IFtzaWduYXR1cmVdLFxyXG4gICAgICAgIGFubmV4LFxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gc2NyaXB0IHBhdGggc3BlbmRcclxuICAgICAgY29uc3QgeyB0YXBzY3JpcHQsIGNvbnRyb2xCbG9jaywgYW5uZXggfSA9IHBhcnNlZFdpdG5lc3M7XHJcbiAgICAgIGNvbnN0IHByZXZPdXRTY3JpcHQgPSBwMnRyUGF5bWVudHMucDJ0cihcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZWRlZW1zOiBbeyBvdXRwdXQ6IHRhcHNjcmlwdCB9XSxcclxuICAgICAgICAgIHJlZGVlbUluZGV4OiAwLFxyXG4gICAgICAgICAgY29udHJvbEJsb2NrLFxyXG4gICAgICAgICAgYW5uZXgsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7IGVjY0xpYiB9XHJcbiAgICAgICkub3V0cHV0O1xyXG4gICAgICBjb25zdCB3aXRuZXNzU2NyaXB0VHlwZSA9IGNsYXNzaWZ5Lm91dHB1dCh0YXBzY3JpcHQpO1xyXG4gICAgICBjb25zdCB7IHB1YmtleXMsIHNpZ25hdHVyZXMgfSA9IGV4cGFuZElucHV0PFROdW1iZXI+KFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBwYXJzZWRXaXRuZXNzLnNjcmlwdFNpZyxcclxuICAgICAgICB3aXRuZXNzU2NyaXB0VHlwZSxcclxuICAgICAgICB0YXBzY3JpcHRcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcHJldk91dFNjcmlwdCxcclxuICAgICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyVFIsXHJcbiAgICAgICAgd2l0bmVzc1NjcmlwdDogdGFwc2NyaXB0LFxyXG4gICAgICAgIHdpdG5lc3NTY3JpcHRUeXBlLFxyXG5cclxuICAgICAgICBjb250cm9sQmxvY2ssXHJcbiAgICAgICAgYW5uZXgsXHJcblxyXG4gICAgICAgIHB1YmtleXMsXHJcbiAgICAgICAgc2lnbmF0dXJlcyxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLk5PTlNUQU5EQVJELFxyXG4gICAgcHJldk91dFNjcmlwdDogc2NyaXB0U2lnLFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIGNvdWxkIGJlIGRvbmUgaW4gZXhwYW5kSW5wdXQsIGJ1dCByZXF1aXJlcyB0aGUgb3JpZ2luYWwgVHJhbnNhY3Rpb24gZm9yIGhhc2hGb3JTaWduYXR1cmVcclxuZnVuY3Rpb24gZml4TXVsdGlzaWdPcmRlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBpbnB1dDogVHhiSW5wdXQ8VE51bWJlcj4sXHJcbiAgdHJhbnNhY3Rpb246IFRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gIHZpbjogbnVtYmVyLFxyXG4gIHByZXZPdXRwdXRzPzogVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4pOiB2b2lkIHtcclxuICBpZiAoaW5wdXQucmVkZWVtU2NyaXB0VHlwZSAhPT0gU0NSSVBUX1RZUEVTLlAyTVMgfHwgIWlucHV0LnJlZGVlbVNjcmlwdCkgcmV0dXJuO1xyXG4gIGlmIChpbnB1dC5wdWJrZXlzIS5sZW5ndGggPT09IGlucHV0LnNpZ25hdHVyZXMhLmxlbmd0aCkgcmV0dXJuO1xyXG4gIGNvbnN0IHByZXZPdXRwdXQgPSBwcmV2T3V0cHV0cyAmJiBwcmV2T3V0cHV0c1t2aW5dO1xyXG5cclxuICBjb25zdCB1bm1hdGNoZWQgPSBpbnB1dC5zaWduYXR1cmVzIS5jb25jYXQoKTtcclxuXHJcbiAgaW5wdXQuc2lnbmF0dXJlcyA9IGlucHV0LnB1YmtleXMhLm1hcCgocHViS2V5KSA9PiB7XHJcbiAgICBjb25zdCBrZXlQYWlyID0gRUNQYWlyLmZyb21QdWJsaWNLZXkocHViS2V5ISk7XHJcbiAgICBsZXQgbWF0Y2g6IEJ1ZmZlciB8IHVuZGVmaW5lZDtcclxuXHJcbiAgICAvLyBjaGVjayBmb3IgYSBzaWduYXR1cmVcclxuICAgIHVubWF0Y2hlZC5zb21lKChzaWduYXR1cmUsIGkpID0+IHtcclxuICAgICAgLy8gc2tpcCBpZiB1bmRlZmluZWQgfHwgT1BfMFxyXG4gICAgICBpZiAoIXNpZ25hdHVyZSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgLy8gVE9ETzogYXZvaWQgTyhuKSBoYXNoRm9yU2lnbmF0dXJlXHJcbiAgICAgIGNvbnN0IHBhcnNlZCA9IGJzY3JpcHQuc2lnbmF0dXJlLmRlY29kZShzaWduYXR1cmUpO1xyXG4gICAgICBjb25zdCBoYXNoID0gdHJhbnNhY3Rpb24uaGFzaEZvclNpZ25hdHVyZSh2aW4sIGlucHV0LnJlZGVlbVNjcmlwdCEsIHBhcnNlZC5oYXNoVHlwZSwgcHJldk91dHB1dD8udmFsdWUpO1xyXG5cclxuICAgICAgLy8gc2tpcCBpZiBzaWduYXR1cmUgZG9lcyBub3QgbWF0Y2ggcHViS2V5XHJcbiAgICAgIGlmICgha2V5UGFpci52ZXJpZnkoaGFzaCwgcGFyc2VkLnNpZ25hdHVyZSkpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgIC8vIHJlbW92ZSBtYXRjaGVkIHNpZ25hdHVyZSBmcm9tIHVubWF0Y2hlZFxyXG4gICAgICB1bm1hdGNoZWRbaV0gPSB1bmRlZmluZWQ7XHJcbiAgICAgIG1hdGNoID0gc2lnbmF0dXJlO1xyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbWF0Y2g7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4cGFuZE91dHB1dChzY3JpcHQ6IEJ1ZmZlciwgb3VyUHViS2V5PzogQnVmZmVyLCBjb250cm9sQmxvY2s/OiBCdWZmZXIpOiBUeGJPdXRwdXQge1xyXG4gIHR5cGVmb3JjZSh0eXBlcy5CdWZmZXIsIHNjcmlwdCk7XHJcbiAgY29uc3QgdHlwZSA9IGNsYXNzaWZ5Lm91dHB1dChzY3JpcHQpO1xyXG5cclxuICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgIGNhc2UgU0NSSVBUX1RZUEVTLlAyUEtIOiB7XHJcbiAgICAgIGlmICghb3VyUHViS2V5KSByZXR1cm4geyB0eXBlIH07XHJcblxyXG4gICAgICAvLyBkb2VzIG91ciBoYXNoMTYwKHB1YktleSkgbWF0Y2ggdGhlIG91dHB1dCBzY3JpcHRzP1xyXG4gICAgICBjb25zdCBwa2gxID0gcGF5bWVudHMucDJwa2goeyBvdXRwdXQ6IHNjcmlwdCB9KS5oYXNoO1xyXG4gICAgICBjb25zdCBwa2gyID0gYmNyeXB0by5oYXNoMTYwKG91clB1YktleSk7XHJcbiAgICAgIGlmICghcGtoMSEuZXF1YWxzKHBraDIpKSByZXR1cm4geyB0eXBlIH07XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGUsXHJcbiAgICAgICAgcHVia2V5czogW291clB1YktleV0sXHJcbiAgICAgICAgc2lnbmF0dXJlczogW3VuZGVmaW5lZF0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJXUEtIOiB7XHJcbiAgICAgIGlmICghb3VyUHViS2V5KSByZXR1cm4geyB0eXBlIH07XHJcblxyXG4gICAgICAvLyBkb2VzIG91ciBoYXNoMTYwKHB1YktleSkgbWF0Y2ggdGhlIG91dHB1dCBzY3JpcHRzP1xyXG4gICAgICBjb25zdCB3cGtoMSA9IHBheW1lbnRzLnAyd3BraCh7IG91dHB1dDogc2NyaXB0IH0pLmhhc2g7XHJcbiAgICAgIGNvbnN0IHdwa2gyID0gYmNyeXB0by5oYXNoMTYwKG91clB1YktleSk7XHJcbiAgICAgIGlmICghd3BraDEhLmVxdWFscyh3cGtoMikpIHJldHVybiB7IHR5cGUgfTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICBwdWJrZXlzOiBbb3VyUHViS2V5XSxcclxuICAgICAgICBzaWduYXR1cmVzOiBbdW5kZWZpbmVkXSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjYXNlIFNDUklQVF9UWVBFUy5QMlRSOiB7XHJcbiAgICAgIGlmICghb3VyUHViS2V5KSByZXR1cm4geyB0eXBlIH07XHJcbiAgICAgIC8vIEhBQ0sgb3VyUHViS2V5IHRvIEJJUDM0MC1zdHlsZVxyXG4gICAgICBpZiAob3VyUHViS2V5Lmxlbmd0aCA9PT0gMzMpIG91clB1YktleSA9IG91clB1YktleS5zbGljZSgxKTtcclxuICAgICAgLy8gVE9ETzogc3VwcG9ydCBtdWx0aXBsZSBwdWJrZXlzXHJcbiAgICAgIGNvbnN0IHAydHIgPSBwMnRyUGF5bWVudHMucDJ0cih7IHB1YmtleTogb3VyUHViS2V5LCBjb250cm9sQmxvY2sgfSwgeyBlY2NMaWIgfSk7XHJcblxyXG4gICAgICAvLyBEb2VzIHR3ZWFrZWQgb3V0cHV0IGZvciBhIHNpbmdsZSBwdWJrZXkgbWF0Y2g/XHJcbiAgICAgIGlmICghc2NyaXB0LmVxdWFscyhwMnRyLm91dHB1dCEpKSByZXR1cm4geyB0eXBlIH07XHJcblxyXG4gICAgICAvLyBQMlRSIEtleVBhdGgsIHNpbmdsZSBrZXlcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIHB1YmtleXM6IFtvdXJQdWJLZXldLFxyXG4gICAgICAgIHNpZ25hdHVyZXM6IFt1bmRlZmluZWRdLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNhc2UgU0NSSVBUX1RZUEVTLlAyVFJfTlM6IHtcclxuICAgICAgY29uc3QgcDJ0ck5zID0gcDJ0clBheW1lbnRzLnAydHJfbnMoeyBvdXRwdXQ6IHNjcmlwdCB9LCB7IGVjY0xpYiB9KTtcclxuICAgICAgLy8gUDJUUiBTY3JpcHRQYXRoXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICBwdWJrZXlzOiBwMnRyTnMucHVia2V5cyxcclxuICAgICAgICBzaWduYXR1cmVzOiBwMnRyTnMucHVia2V5cyEubWFwKCgpOiB1bmRlZmluZWQgPT4gdW5kZWZpbmVkKSxcclxuICAgICAgICBtYXhTaWduYXR1cmVzOiBwMnRyTnMucHVia2V5cyEubGVuZ3RoLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNhc2UgU0NSSVBUX1RZUEVTLlAyUEs6IHtcclxuICAgICAgY29uc3QgcDJwayA9IHBheW1lbnRzLnAycGsoeyBvdXRwdXQ6IHNjcmlwdCB9KTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIHB1YmtleXM6IFtwMnBrLnB1YmtleV0sXHJcbiAgICAgICAgc2lnbmF0dXJlczogW3VuZGVmaW5lZF0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJNUzoge1xyXG4gICAgICBjb25zdCBwMm1zID0gcGF5bWVudHMucDJtcyh7IG91dHB1dDogc2NyaXB0IH0pO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGUsXHJcbiAgICAgICAgcHVia2V5czogcDJtcy5wdWJrZXlzLFxyXG4gICAgICAgIHNpZ25hdHVyZXM6IHAybXMucHVia2V5cyEubWFwKCgpOiB1bmRlZmluZWQgPT4gdW5kZWZpbmVkKSxcclxuICAgICAgICBtYXhTaWduYXR1cmVzOiBwMm1zLm0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyB0eXBlIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVJbnB1dDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBpbnB1dDogVHhiSW5wdXQ8VE51bWJlcj4sXHJcbiAgb3VyUHViS2V5OiBCdWZmZXIsXHJcbiAgcmVkZWVtU2NyaXB0PzogQnVmZmVyLFxyXG4gIHdpdG5lc3NTY3JpcHQ/OiBCdWZmZXIsXHJcbiAgY29udHJvbEJsb2NrPzogQnVmZmVyLFxyXG4gIGFubmV4PzogQnVmZmVyXHJcbik6IFR4YklucHV0PFROdW1iZXI+IHtcclxuICBpZiAocmVkZWVtU2NyaXB0ICYmIHdpdG5lc3NTY3JpcHQpIHtcclxuICAgIGNvbnN0IHAyd3NoID0gcGF5bWVudHMucDJ3c2goe1xyXG4gICAgICByZWRlZW06IHsgb3V0cHV0OiB3aXRuZXNzU2NyaXB0IH0sXHJcbiAgICB9KSBhcyBQYXltZW50O1xyXG4gICAgY29uc3QgcDJ3c2hBbHQgPSBwYXltZW50cy5wMndzaCh7IG91dHB1dDogcmVkZWVtU2NyaXB0IH0pIGFzIFBheW1lbnQ7XHJcbiAgICBjb25zdCBwMnNoID0gcGF5bWVudHMucDJzaCh7IHJlZGVlbTogeyBvdXRwdXQ6IHJlZGVlbVNjcmlwdCB9IH0pIGFzIFBheW1lbnQ7XHJcbiAgICBjb25zdCBwMnNoQWx0ID0gcGF5bWVudHMucDJzaCh7IHJlZGVlbTogcDJ3c2ggfSkgYXMgUGF5bWVudDtcclxuXHJcbiAgICAvLyBlbmZvcmNlcyBQMlNIKFAyV1NIKC4uLikpXHJcbiAgICBpZiAoIXAyd3NoLmhhc2ghLmVxdWFscyhwMndzaEFsdC5oYXNoISkpIHRocm93IG5ldyBFcnJvcignV2l0bmVzcyBzY3JpcHQgaW5jb25zaXN0ZW50IHdpdGggcHJldk91dFNjcmlwdCcpO1xyXG4gICAgaWYgKCFwMnNoLmhhc2ghLmVxdWFscyhwMnNoQWx0Lmhhc2ghKSkgdGhyb3cgbmV3IEVycm9yKCdSZWRlZW0gc2NyaXB0IGluY29uc2lzdGVudCB3aXRoIHByZXZPdXRTY3JpcHQnKTtcclxuXHJcbiAgICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZE91dHB1dChwMndzaC5yZWRlZW0hLm91dHB1dCEsIG91clB1YktleSk7XHJcbiAgICBpZiAoIWV4cGFuZGVkLnB1YmtleXMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cGFuZGVkLnR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQgYXMgd2l0bmVzc1NjcmlwdCAoJyArIGJzY3JpcHQudG9BU00od2l0bmVzc1NjcmlwdCkgKyAnKScpO1xyXG4gICAgfVxyXG4gICAgaWYgKGlucHV0LnNpZ25hdHVyZXMgJiYgaW5wdXQuc2lnbmF0dXJlcy5zb21lKCh4KSA9PiB4ICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIGV4cGFuZGVkLnNpZ25hdHVyZXMgPSBpbnB1dC5zaWduYXR1cmVzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNpZ25TY3JpcHQgPSB3aXRuZXNzU2NyaXB0O1xyXG4gICAgaWYgKGV4cGFuZGVkLnR5cGUgPT09IFNDUklQVF9UWVBFUy5QMldQS0gpIHRocm93IG5ldyBFcnJvcignUDJTSChQMldTSChQMldQS0gpKSBpcyBhIGNvbnNlbnN1cyBmYWlsdXJlJyk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVkZWVtU2NyaXB0LFxyXG4gICAgICByZWRlZW1TY3JpcHRUeXBlOiBTQ1JJUFRfVFlQRVMuUDJXU0gsXHJcblxyXG4gICAgICB3aXRuZXNzU2NyaXB0LFxyXG4gICAgICB3aXRuZXNzU2NyaXB0VHlwZTogZXhwYW5kZWQudHlwZSxcclxuXHJcbiAgICAgIHByZXZPdXRUeXBlOiBTQ1JJUFRfVFlQRVMuUDJTSCxcclxuICAgICAgcHJldk91dFNjcmlwdDogcDJzaC5vdXRwdXQsXHJcblxyXG4gICAgICB3aXRuZXNzVmVyc2lvbjogMCxcclxuICAgICAgc2lnblNjcmlwdCxcclxuICAgICAgc2lnblR5cGU6IGV4cGFuZGVkLnR5cGUsXHJcblxyXG4gICAgICBwdWJrZXlzOiBleHBhbmRlZC5wdWJrZXlzLFxyXG4gICAgICBzaWduYXR1cmVzOiBleHBhbmRlZC5zaWduYXR1cmVzLFxyXG4gICAgICBtYXhTaWduYXR1cmVzOiBleHBhbmRlZC5tYXhTaWduYXR1cmVzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGlmIChyZWRlZW1TY3JpcHQpIHtcclxuICAgIGNvbnN0IHAyc2ggPSBwYXltZW50cy5wMnNoKHsgcmVkZWVtOiB7IG91dHB1dDogcmVkZWVtU2NyaXB0IH0gfSkgYXMgUGF5bWVudDtcclxuXHJcbiAgICBpZiAoaW5wdXQucHJldk91dFNjcmlwdCkge1xyXG4gICAgICBsZXQgcDJzaEFsdDtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBwMnNoQWx0ID0gcGF5bWVudHMucDJzaCh7IG91dHB1dDogaW5wdXQucHJldk91dFNjcmlwdCB9KSBhcyBQYXltZW50O1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcmV2T3V0U2NyaXB0IG11c3QgYmUgUDJTSCcpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghcDJzaC5oYXNoIS5lcXVhbHMocDJzaEFsdC5oYXNoISkpIHRocm93IG5ldyBFcnJvcignUmVkZWVtIHNjcmlwdCBpbmNvbnNpc3RlbnQgd2l0aCBwcmV2T3V0U2NyaXB0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRPdXRwdXQocDJzaC5yZWRlZW0hLm91dHB1dCEsIG91clB1YktleSk7XHJcbiAgICBpZiAoIWV4cGFuZGVkLnB1YmtleXMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cGFuZGVkLnR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQgYXMgcmVkZWVtU2NyaXB0ICgnICsgYnNjcmlwdC50b0FTTShyZWRlZW1TY3JpcHQpICsgJyknKTtcclxuICAgIH1cclxuICAgIGlmIChpbnB1dC5zaWduYXR1cmVzICYmIGlucHV0LnNpZ25hdHVyZXMuc29tZSgoeCkgPT4geCAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICBleHBhbmRlZC5zaWduYXR1cmVzID0gaW5wdXQuc2lnbmF0dXJlcztcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc2lnblNjcmlwdCA9IHJlZGVlbVNjcmlwdDtcclxuICAgIGlmIChleHBhbmRlZC50eXBlID09PSBTQ1JJUFRfVFlQRVMuUDJXUEtIKSB7XHJcbiAgICAgIHNpZ25TY3JpcHQgPSBwYXltZW50cy5wMnBraCh7IHB1YmtleTogZXhwYW5kZWQucHVia2V5c1swXSB9KS5vdXRwdXQhO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlZGVlbVNjcmlwdCxcclxuICAgICAgcmVkZWVtU2NyaXB0VHlwZTogZXhwYW5kZWQudHlwZSxcclxuXHJcbiAgICAgIHByZXZPdXRUeXBlOiBTQ1JJUFRfVFlQRVMuUDJTSCxcclxuICAgICAgcHJldk91dFNjcmlwdDogcDJzaC5vdXRwdXQsXHJcblxyXG4gICAgICB3aXRuZXNzVmVyc2lvbjogZXhwYW5kZWQudHlwZSA9PT0gU0NSSVBUX1RZUEVTLlAyV1BLSCA/IDAgOiB1bmRlZmluZWQsXHJcbiAgICAgIHNpZ25TY3JpcHQsXHJcbiAgICAgIHNpZ25UeXBlOiBleHBhbmRlZC50eXBlLFxyXG5cclxuICAgICAgcHVia2V5czogZXhwYW5kZWQucHVia2V5cyxcclxuICAgICAgc2lnbmF0dXJlczogZXhwYW5kZWQuc2lnbmF0dXJlcyxcclxuICAgICAgbWF4U2lnbmF0dXJlczogZXhwYW5kZWQubWF4U2lnbmF0dXJlcyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBpZiAod2l0bmVzc1NjcmlwdCAmJiBjb250cm9sQmxvY2spIHtcclxuICAgIC8vIFAyVFIgU2NyaXB0UGF0aFxyXG4gICAgLyogdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXNoYWRvd2VkLXZhcmlhYmxlICovXHJcbiAgICBsZXQgcHJldk91dFNjcmlwdCA9IGlucHV0LnByZXZPdXRTY3JpcHQ7XHJcbiAgICBpZiAoIXByZXZPdXRTY3JpcHQpIHtcclxuICAgICAgcHJldk91dFNjcmlwdCA9IHAydHJQYXltZW50cy5wMnRyKFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHJlZGVlbXM6IFt7IG91dHB1dDogd2l0bmVzc1NjcmlwdCB9XSxcclxuICAgICAgICAgIHJlZGVlbUluZGV4OiAwLFxyXG4gICAgICAgICAgY29udHJvbEJsb2NrLFxyXG4gICAgICAgICAgYW5uZXgsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7IGVjY0xpYiB9XHJcbiAgICAgICkub3V0cHV0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kT3V0cHV0KHdpdG5lc3NTY3JpcHQsIG91clB1YktleSk7XHJcbiAgICBpZiAoIWV4cGFuZGVkLnB1YmtleXMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cGFuZGVkLnR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQgYXMgd2l0bmVzc1NjcmlwdCAoJyArIGJzY3JpcHQudG9BU00od2l0bmVzc1NjcmlwdCkgKyAnKScpO1xyXG4gICAgfVxyXG4gICAgaWYgKGlucHV0LnNpZ25hdHVyZXMgJiYgaW5wdXQuc2lnbmF0dXJlcy5zb21lKCh4KSA9PiB4ICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIGV4cGFuZGVkLnNpZ25hdHVyZXMgPSBpbnB1dC5zaWduYXR1cmVzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHdpdG5lc3NTY3JpcHQsXHJcbiAgICAgIHdpdG5lc3NTY3JpcHRUeXBlOiBleHBhbmRlZC50eXBlLFxyXG5cclxuICAgICAgcHJldk91dFR5cGU6IFNDUklQVF9UWVBFUy5QMlRSLFxyXG4gICAgICBwcmV2T3V0U2NyaXB0LFxyXG5cclxuICAgICAgd2l0bmVzc1ZlcnNpb246IDEsXHJcbiAgICAgIHNpZ25TY3JpcHQ6IHdpdG5lc3NTY3JpcHQsXHJcbiAgICAgIHNpZ25UeXBlOiBleHBhbmRlZC50eXBlLFxyXG5cclxuICAgICAgcHVia2V5czogZXhwYW5kZWQucHVia2V5cyxcclxuICAgICAgc2lnbmF0dXJlczogZXhwYW5kZWQuc2lnbmF0dXJlcyxcclxuICAgICAgbWF4U2lnbmF0dXJlczogZXhwYW5kZWQubWF4U2lnbmF0dXJlcyxcclxuXHJcbiAgICAgIGNvbnRyb2xCbG9jayxcclxuICAgICAgYW5uZXgsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKHdpdG5lc3NTY3JpcHQpIHtcclxuICAgIGNvbnN0IHAyd3NoID0gcGF5bWVudHMucDJ3c2goeyByZWRlZW06IHsgb3V0cHV0OiB3aXRuZXNzU2NyaXB0IH0gfSk7XHJcblxyXG4gICAgaWYgKGlucHV0LnByZXZPdXRTY3JpcHQpIHtcclxuICAgICAgY29uc3QgcDJ3c2hBbHQgPSBwYXltZW50cy5wMndzaCh7IG91dHB1dDogaW5wdXQucHJldk91dFNjcmlwdCB9KTtcclxuICAgICAgaWYgKCFwMndzaC5oYXNoIS5lcXVhbHMocDJ3c2hBbHQuaGFzaCEpKSB0aHJvdyBuZXcgRXJyb3IoJ1dpdG5lc3Mgc2NyaXB0IGluY29uc2lzdGVudCB3aXRoIHByZXZPdXRTY3JpcHQnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZE91dHB1dChwMndzaC5yZWRlZW0hLm91dHB1dCEsIG91clB1YktleSk7XHJcbiAgICBpZiAoIWV4cGFuZGVkLnB1YmtleXMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cGFuZGVkLnR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQgYXMgd2l0bmVzc1NjcmlwdCAoJyArIGJzY3JpcHQudG9BU00od2l0bmVzc1NjcmlwdCkgKyAnKScpO1xyXG4gICAgfVxyXG4gICAgaWYgKGlucHV0LnNpZ25hdHVyZXMgJiYgaW5wdXQuc2lnbmF0dXJlcy5zb21lKCh4KSA9PiB4ICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIGV4cGFuZGVkLnNpZ25hdHVyZXMgPSBpbnB1dC5zaWduYXR1cmVzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNpZ25TY3JpcHQgPSB3aXRuZXNzU2NyaXB0O1xyXG4gICAgaWYgKGV4cGFuZGVkLnR5cGUgPT09IFNDUklQVF9UWVBFUy5QMldQS0gpIHRocm93IG5ldyBFcnJvcignUDJXU0goUDJXUEtIKSBpcyBhIGNvbnNlbnN1cyBmYWlsdXJlJyk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgd2l0bmVzc1NjcmlwdCxcclxuICAgICAgd2l0bmVzc1NjcmlwdFR5cGU6IGV4cGFuZGVkLnR5cGUsXHJcblxyXG4gICAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyV1NILFxyXG4gICAgICBwcmV2T3V0U2NyaXB0OiBwMndzaC5vdXRwdXQsXHJcblxyXG4gICAgICB3aXRuZXNzVmVyc2lvbjogMCxcclxuICAgICAgc2lnblNjcmlwdCxcclxuICAgICAgc2lnblR5cGU6IGV4cGFuZGVkLnR5cGUsXHJcblxyXG4gICAgICBwdWJrZXlzOiBleHBhbmRlZC5wdWJrZXlzLFxyXG4gICAgICBzaWduYXR1cmVzOiBleHBhbmRlZC5zaWduYXR1cmVzLFxyXG4gICAgICBtYXhTaWduYXR1cmVzOiBleHBhbmRlZC5tYXhTaWduYXR1cmVzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGlmIChpbnB1dC5wcmV2T3V0VHlwZSAmJiBpbnB1dC5wcmV2T3V0U2NyaXB0KSB7XHJcbiAgICAvLyBlbWJlZGRlZCBzY3JpcHRzIGFyZSBub3QgcG9zc2libGUgd2l0aG91dCBleHRyYSBpbmZvcm1hdGlvblxyXG4gICAgaWYgKGlucHV0LnByZXZPdXRUeXBlID09PSBTQ1JJUFRfVFlQRVMuUDJTSCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ByZXZPdXRTY3JpcHQgaXMgJyArIGlucHV0LnByZXZPdXRUeXBlICsgJywgcmVxdWlyZXMgcmVkZWVtU2NyaXB0Jyk7XHJcbiAgICB9XHJcbiAgICBpZiAoaW5wdXQucHJldk91dFR5cGUgPT09IFNDUklQVF9UWVBFUy5QMldTSCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ByZXZPdXRTY3JpcHQgaXMgJyArIGlucHV0LnByZXZPdXRUeXBlICsgJywgcmVxdWlyZXMgd2l0bmVzc1NjcmlwdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kT3V0cHV0KGlucHV0LnByZXZPdXRTY3JpcHQsIG91clB1YktleSk7XHJcbiAgICBpZiAoIWV4cGFuZGVkLnB1YmtleXMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cGFuZGVkLnR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQgKCcgKyBic2NyaXB0LnRvQVNNKGlucHV0LnByZXZPdXRTY3JpcHQpICsgJyknKTtcclxuICAgIH1cclxuICAgIGlmIChpbnB1dC5zaWduYXR1cmVzICYmIGlucHV0LnNpZ25hdHVyZXMuc29tZSgoeCkgPT4geCAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICBleHBhbmRlZC5zaWduYXR1cmVzID0gaW5wdXQuc2lnbmF0dXJlcztcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc2lnblNjcmlwdCA9IGlucHV0LnByZXZPdXRTY3JpcHQ7XHJcbiAgICBpZiAoZXhwYW5kZWQudHlwZSA9PT0gU0NSSVBUX1RZUEVTLlAyV1BLSCkge1xyXG4gICAgICBzaWduU2NyaXB0ID0gcGF5bWVudHMucDJwa2goeyBwdWJrZXk6IGV4cGFuZGVkLnB1YmtleXNbMF0gfSkub3V0cHV0IGFzIEJ1ZmZlcjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgd2l0bmVzc1ZlcnNpb247XHJcbiAgICBpZiAoZXhwYW5kZWQudHlwZSA9PT0gU0NSSVBUX1RZUEVTLlAyV1BLSCkge1xyXG4gICAgICB3aXRuZXNzVmVyc2lvbiA9IDA7XHJcbiAgICB9IGVsc2UgaWYgKGV4cGFuZGVkLnR5cGUgPT09IFNDUklQVF9UWVBFUy5QMlRSKSB7XHJcbiAgICAgIHdpdG5lc3NWZXJzaW9uID0gMTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBwcmV2T3V0VHlwZTogZXhwYW5kZWQudHlwZSxcclxuICAgICAgcHJldk91dFNjcmlwdDogaW5wdXQucHJldk91dFNjcmlwdCxcclxuXHJcbiAgICAgIHdpdG5lc3NWZXJzaW9uLFxyXG4gICAgICBzaWduU2NyaXB0LFxyXG4gICAgICBzaWduVHlwZTogZXhwYW5kZWQudHlwZSxcclxuXHJcbiAgICAgIHB1YmtleXM6IGV4cGFuZGVkLnB1YmtleXMsXHJcbiAgICAgIHNpZ25hdHVyZXM6IGV4cGFuZGVkLnNpZ25hdHVyZXMsXHJcbiAgICAgIG1heFNpZ25hdHVyZXM6IGV4cGFuZGVkLm1heFNpZ25hdHVyZXMsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcHJldk91dFNjcmlwdCA9IHBheW1lbnRzLnAycGtoKHsgcHVia2V5OiBvdXJQdWJLZXkgfSkub3V0cHV0O1xyXG4gIHJldHVybiB7XHJcbiAgICBwcmV2T3V0VHlwZTogU0NSSVBUX1RZUEVTLlAyUEtILFxyXG4gICAgcHJldk91dFNjcmlwdCxcclxuXHJcbiAgICBzaWduU2NyaXB0OiBwcmV2T3V0U2NyaXB0LFxyXG4gICAgc2lnblR5cGU6IFNDUklQVF9UWVBFUy5QMlBLSCxcclxuXHJcbiAgICBwdWJrZXlzOiBbb3VyUHViS2V5XSxcclxuICAgIHNpZ25hdHVyZXM6IFt1bmRlZmluZWRdLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gIHR5cGU6IHN0cmluZyxcclxuICBpbnB1dDogVHhiSW5wdXQ8VE51bWJlcj4sXHJcbiAgYWxsb3dJbmNvbXBsZXRlPzogYm9vbGVhblxyXG4pOiBQYXltZW50IHwgdW5kZWZpbmVkIHtcclxuICBjb25zdCBwdWJrZXlzID0gKGlucHV0LnB1YmtleXMgfHwgW10pIGFzIEJ1ZmZlcltdO1xyXG4gIGxldCBzaWduYXR1cmVzID0gKGlucHV0LnNpZ25hdHVyZXMgfHwgW10pIGFzIEJ1ZmZlcltdO1xyXG5cclxuICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgIGNhc2UgU0NSSVBUX1RZUEVTLlAyUEtIOiB7XHJcbiAgICAgIGlmIChwdWJrZXlzLmxlbmd0aCA9PT0gMCkgYnJlYWs7XHJcbiAgICAgIGlmIChzaWduYXR1cmVzLmxlbmd0aCA9PT0gMCkgYnJlYWs7XHJcblxyXG4gICAgICByZXR1cm4gcGF5bWVudHMucDJwa2goeyBwdWJrZXk6IHB1YmtleXNbMF0sIHNpZ25hdHVyZTogc2lnbmF0dXJlc1swXSB9KTtcclxuICAgIH1cclxuICAgIGNhc2UgU0NSSVBUX1RZUEVTLlAyV1BLSDoge1xyXG4gICAgICBpZiAocHVia2V5cy5sZW5ndGggPT09IDApIGJyZWFrO1xyXG4gICAgICBpZiAoc2lnbmF0dXJlcy5sZW5ndGggPT09IDApIGJyZWFrO1xyXG5cclxuICAgICAgcmV0dXJuIHBheW1lbnRzLnAyd3BraCh7IHB1YmtleTogcHVia2V5c1swXSwgc2lnbmF0dXJlOiBzaWduYXR1cmVzWzBdIH0pO1xyXG4gICAgfVxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJQSzoge1xyXG4gICAgICBpZiAocHVia2V5cy5sZW5ndGggPT09IDApIGJyZWFrO1xyXG4gICAgICBpZiAoc2lnbmF0dXJlcy5sZW5ndGggPT09IDApIGJyZWFrO1xyXG5cclxuICAgICAgcmV0dXJuIHBheW1lbnRzLnAycGsoeyBzaWduYXR1cmU6IHNpZ25hdHVyZXNbMF0gfSk7XHJcbiAgICB9XHJcbiAgICBjYXNlIFNDUklQVF9UWVBFUy5QMk1TOiB7XHJcbiAgICAgIGNvbnN0IG0gPSBpbnB1dC5tYXhTaWduYXR1cmVzO1xyXG4gICAgICBpZiAoYWxsb3dJbmNvbXBsZXRlKSB7XHJcbiAgICAgICAgc2lnbmF0dXJlcyA9IHNpZ25hdHVyZXMubWFwKCh4KSA9PiB4IHx8IG9wcy5PUF8wKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaWduYXR1cmVzID0gc2lnbmF0dXJlcy5maWx0ZXIoKHgpID0+IHgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBpZiB0aGUgdHJhbnNhY3Rpb24gaXMgbm90IG5vdCBjb21wbGV0ZSAoY29tcGxldGUpLCBvciBpZiBzaWduYXR1cmVzLmxlbmd0aCA9PT0gbSwgdmFsaWRhdGVcclxuICAgICAgLy8gb3RoZXJ3aXNlLCB0aGUgbnVtYmVyIG9mIE9QXzAncyBtYXkgYmUgPj0gbSwgc28gZG9uJ3QgdmFsaWRhdGUgKGJvbylcclxuICAgICAgY29uc3QgdmFsaWRhdGUgPSAhYWxsb3dJbmNvbXBsZXRlIHx8IG0gPT09IHNpZ25hdHVyZXMubGVuZ3RoO1xyXG4gICAgICByZXR1cm4gcGF5bWVudHMucDJtcyh7IG0sIHB1YmtleXMsIHNpZ25hdHVyZXMgfSwgeyBhbGxvd0luY29tcGxldGUsIHZhbGlkYXRlIH0pO1xyXG4gICAgfVxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJTSDoge1xyXG4gICAgICBjb25zdCByZWRlZW0gPSBidWlsZDxUTnVtYmVyPihpbnB1dC5yZWRlZW1TY3JpcHRUeXBlISwgaW5wdXQsIGFsbG93SW5jb21wbGV0ZSk7XHJcbiAgICAgIGlmICghcmVkZWVtKSByZXR1cm47XHJcblxyXG4gICAgICByZXR1cm4gcGF5bWVudHMucDJzaCh7XHJcbiAgICAgICAgcmVkZWVtOiB7XHJcbiAgICAgICAgICBvdXRwdXQ6IHJlZGVlbS5vdXRwdXQgfHwgaW5wdXQucmVkZWVtU2NyaXB0LFxyXG4gICAgICAgICAgaW5wdXQ6IHJlZGVlbS5pbnB1dCxcclxuICAgICAgICAgIHdpdG5lc3M6IHJlZGVlbS53aXRuZXNzLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJXU0g6IHtcclxuICAgICAgY29uc3QgcmVkZWVtID0gYnVpbGQ8VE51bWJlcj4oaW5wdXQud2l0bmVzc1NjcmlwdFR5cGUhLCBpbnB1dCwgYWxsb3dJbmNvbXBsZXRlKTtcclxuICAgICAgaWYgKCFyZWRlZW0pIHJldHVybjtcclxuXHJcbiAgICAgIHJldHVybiBwYXltZW50cy5wMndzaCh7XHJcbiAgICAgICAgcmVkZWVtOiB7XHJcbiAgICAgICAgICBvdXRwdXQ6IGlucHV0LndpdG5lc3NTY3JpcHQsXHJcbiAgICAgICAgICBpbnB1dDogcmVkZWVtLmlucHV0LFxyXG4gICAgICAgICAgd2l0bmVzczogcmVkZWVtLndpdG5lc3MsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjYXNlIFNDUklQVF9UWVBFUy5QMlRSOiB7XHJcbiAgICAgIGlmIChpbnB1dC53aXRuZXNzU2NyaXB0VHlwZSA9PT0gU0NSSVBUX1RZUEVTLlAyVFJfTlMpIHtcclxuICAgICAgICAvLyBTY3JpcHRQYXRoXHJcbiAgICAgICAgY29uc3QgcmVkZWVtID0gYnVpbGQ8VE51bWJlcj4oaW5wdXQud2l0bmVzc1NjcmlwdFR5cGUhLCBpbnB1dCwgYWxsb3dJbmNvbXBsZXRlKTtcclxuICAgICAgICByZXR1cm4gcDJ0clBheW1lbnRzLnAydHIoXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG91dHB1dDogaW5wdXQucHJldk91dFNjcmlwdCxcclxuICAgICAgICAgICAgY29udHJvbEJsb2NrOiBpbnB1dC5jb250cm9sQmxvY2ssXHJcbiAgICAgICAgICAgIGFubmV4OiBpbnB1dC5hbm5leCxcclxuICAgICAgICAgICAgcmVkZWVtczogW3JlZGVlbSFdLFxyXG4gICAgICAgICAgICByZWRlZW1JbmRleDogMCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7IGVjY0xpYiB9XHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gS2V5UGF0aFxyXG4gICAgICBpZiAoc2lnbmF0dXJlcy5sZW5ndGggPT09IDApIGJyZWFrO1xyXG5cclxuICAgICAgcmV0dXJuIHAydHJQYXltZW50cy5wMnRyKHsgcHVia2V5cywgc2lnbmF0dXJlOiBzaWduYXR1cmVzWzBdIH0sIHsgZWNjTGliIH0pO1xyXG4gICAgfVxyXG4gICAgY2FzZSBTQ1JJUFRfVFlQRVMuUDJUUl9OUzoge1xyXG4gICAgICBjb25zdCBtID0gaW5wdXQubWF4U2lnbmF0dXJlcztcclxuICAgICAgaWYgKGFsbG93SW5jb21wbGV0ZSkge1xyXG4gICAgICAgIHNpZ25hdHVyZXMgPSBzaWduYXR1cmVzLm1hcCgoeCkgPT4geCB8fCBvcHMuT1BfMCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2lnbmF0dXJlcyA9IHNpZ25hdHVyZXMuZmlsdGVyKCh4KSA9PiB4KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gaWYgdGhlIHRyYW5zYWN0aW9uIGlzIG5vdCBub3QgY29tcGxldGUgKGNvbXBsZXRlKSwgb3IgaWYgc2lnbmF0dXJlcy5sZW5ndGggPT09IG0sIHZhbGlkYXRlXHJcbiAgICAgIC8vIG90aGVyd2lzZSwgdGhlIG51bWJlciBvZiBPUF8wJ3MgbWF5IGJlID49IG0sIHNvIGRvbid0IHZhbGlkYXRlIChib28pXHJcbiAgICAgIGNvbnN0IHZhbGlkYXRlID0gIWFsbG93SW5jb21wbGV0ZSB8fCBtID09PSBzaWduYXR1cmVzLmxlbmd0aDtcclxuICAgICAgcmV0dXJuIHAydHJQYXltZW50cy5wMnRyX25zKHsgcHVia2V5cywgc2lnbmF0dXJlcyB9LCB7IGFsbG93SW5jb21wbGV0ZSwgdmFsaWRhdGUsIGVjY0xpYiB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhblNpZ248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oaW5wdXQ6IFR4YklucHV0PFROdW1iZXI+KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChcclxuICAgIGlucHV0LnNpZ25TY3JpcHQgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgaW5wdXQuc2lnblR5cGUgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgaW5wdXQucHVia2V5cyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICBpbnB1dC5zaWduYXR1cmVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgIGlucHV0LnNpZ25hdHVyZXMubGVuZ3RoID09PSBpbnB1dC5wdWJrZXlzLmxlbmd0aCAmJlxyXG4gICAgaW5wdXQucHVia2V5cy5sZW5ndGggPiAwICYmXHJcbiAgICAoaW5wdXQud2l0bmVzc1ZlcnNpb24gPT09IHVuZGVmaW5lZCB8fCBpbnB1dC52YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpZ25hdHVyZUhhc2hUeXBlKGJ1ZmZlcjogQnVmZmVyKTogbnVtYmVyIHtcclxuICBpZiAoYnNjcmlwdC5pc0Nhbm9uaWNhbFNjaG5vcnJTaWduYXR1cmUoYnVmZmVyKSAmJiBidWZmZXIubGVuZ3RoID09PSA2NCkge1xyXG4gICAgcmV0dXJuIFRyYW5zYWN0aW9uLlNJR0hBU0hfREVGQVVMVDtcclxuICB9XHJcbiAgcmV0dXJuIGJ1ZmZlci5yZWFkVUludDgoYnVmZmVyLmxlbmd0aCAtIDEpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja1NpZ25BcmdzPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gIGlucHV0czogQXJyYXk8VHhiSW5wdXQ8VE51bWJlcj4+LFxyXG4gIHNpZ25QYXJhbXM6IFR4YlNpZ25Bcmc8VE51bWJlcj5cclxuKTogdm9pZCB7XHJcbiAgaWYgKCFQUkVWT1VUX1RZUEVTLmhhcyhzaWduUGFyYW1zLnByZXZPdXRTY3JpcHRUeXBlKSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVW5rbm93biBwcmV2T3V0U2NyaXB0VHlwZSBcIiR7c2lnblBhcmFtcy5wcmV2T3V0U2NyaXB0VHlwZX1cImApO1xyXG4gIH1cclxuICB0Zk1lc3NhZ2UodHlwZWZvcmNlLk51bWJlciwgc2lnblBhcmFtcy52aW4sIGBzaWduIG11c3QgaW5jbHVkZSB2aW4gcGFyYW1ldGVyIGFzIE51bWJlciAoaW5wdXQgaW5kZXgpYCk7XHJcbiAgdGZNZXNzYWdlKHRmRnVsbFNpZ25lciwgc2lnblBhcmFtcy5rZXlQYWlyLCBgc2lnbiBtdXN0IGluY2x1ZGUga2V5UGFpciBwYXJhbWV0ZXIgYXMgU2lnbmVyIGludGVyZmFjZWApO1xyXG4gIHRmTWVzc2FnZSh0eXBlZm9yY2UubWF5YmUodHlwZWZvcmNlLk51bWJlciksIHNpZ25QYXJhbXMuaGFzaFR5cGUsIGBzaWduIGhhc2hUeXBlIHBhcmFtZXRlciBtdXN0IGJlIGEgbnVtYmVyYCk7XHJcbiAgY29uc3QgcHJldk91dFR5cGUgPSAoaW5wdXRzW3NpZ25QYXJhbXMudmluXSB8fCBbXSkucHJldk91dFR5cGU7XHJcbiAgY29uc3QgcG9zVHlwZSA9IHNpZ25QYXJhbXMucHJldk91dFNjcmlwdFR5cGU7XHJcbiAgc3dpdGNoIChwb3NUeXBlKSB7XHJcbiAgICBjYXNlICdwMnBraCc6XHJcbiAgICAgIGlmIChwcmV2T3V0VHlwZSAmJiBwcmV2T3V0VHlwZSAhPT0gJ3B1YmtleWhhc2gnKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgaW5wdXQgIyR7c2lnblBhcmFtcy52aW59IGlzIG5vdCBvZiB0eXBlIHAycGtoOiAke3ByZXZPdXRUeXBlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy53aXRuZXNzU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzU2NyaXB0YCk7XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy5yZWRlZW1TY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIE5PIHJlZGVlbVNjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMud2l0bmVzc1ZhbHVlLCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzVmFsdWVgKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdwMnBrJzpcclxuICAgICAgaWYgKHByZXZPdXRUeXBlICYmIHByZXZPdXRUeXBlICE9PSAncHVia2V5Jykge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGlucHV0ICMke3NpZ25QYXJhbXMudmlufSBpcyBub3Qgb2YgdHlwZSBwMnBrOiAke3ByZXZPdXRUeXBlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy53aXRuZXNzU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzU2NyaXB0YCk7XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy5yZWRlZW1TY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIE5PIHJlZGVlbVNjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMud2l0bmVzc1ZhbHVlLCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzVmFsdWVgKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdwMndwa2gnOlxyXG4gICAgICBpZiAocHJldk91dFR5cGUgJiYgcHJldk91dFR5cGUgIT09ICd3aXRuZXNzcHVia2V5aGFzaCcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBpbnB1dCAjJHtzaWduUGFyYW1zLnZpbn0gaXMgbm90IG9mIHR5cGUgcDJ3cGtoOiAke3ByZXZPdXRUeXBlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy53aXRuZXNzU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzU2NyaXB0YCk7XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy5yZWRlZW1TY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIE5PIHJlZGVlbVNjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZXMuU2F0b3NoaSwgc2lnblBhcmFtcy53aXRuZXNzVmFsdWUsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIHdpdG5lc3NWYWx1ZWApO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3AybXMnOlxyXG4gICAgICBpZiAocHJldk91dFR5cGUgJiYgcHJldk91dFR5cGUgIT09ICdtdWx0aXNpZycpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBpbnB1dCAjJHtzaWduUGFyYW1zLnZpbn0gaXMgbm90IG9mIHR5cGUgcDJtczogJHtwcmV2T3V0VHlwZX1gKTtcclxuICAgICAgfVxyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMud2l0bmVzc1NjcmlwdCwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgTk8gd2l0bmVzc1NjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMucmVkZWVtU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyByZWRlZW1TY3JpcHRgKTtcclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS52YWx1ZSh1bmRlZmluZWQpLCBzaWduUGFyYW1zLndpdG5lc3NWYWx1ZSwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgTk8gd2l0bmVzc1ZhbHVlYCk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAncDJzaC1wMndwa2gnOlxyXG4gICAgICBpZiAocHJldk91dFR5cGUgJiYgcHJldk91dFR5cGUgIT09ICdzY3JpcHRoYXNoJykge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGlucHV0ICMke3NpZ25QYXJhbXMudmlufSBpcyBub3Qgb2YgdHlwZSBwMnNoLXAyd3BraDogJHtwcmV2T3V0VHlwZX1gKTtcclxuICAgICAgfVxyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMud2l0bmVzc1NjcmlwdCwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgTk8gd2l0bmVzc1NjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLkJ1ZmZlciwgc2lnblBhcmFtcy5yZWRlZW1TY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIHJlZGVlbVNjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZXMuU2F0b3NoaSwgc2lnblBhcmFtcy53aXRuZXNzVmFsdWUsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIHdpdG5lc3NWYWx1ZWApO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3Ayc2gtcDJtcyc6XHJcbiAgICBjYXNlICdwMnNoLXAycGsnOlxyXG4gICAgY2FzZSAncDJzaC1wMnBraCc6XHJcbiAgICAgIGlmIChwcmV2T3V0VHlwZSAmJiBwcmV2T3V0VHlwZSAhPT0gJ3NjcmlwdGhhc2gnKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgaW5wdXQgIyR7c2lnblBhcmFtcy52aW59IGlzIG5vdCBvZiB0eXBlICR7cG9zVHlwZX06ICR7cHJldk91dFR5cGV9YCk7XHJcbiAgICAgIH1cclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS52YWx1ZSh1bmRlZmluZWQpLCBzaWduUGFyYW1zLndpdG5lc3NTY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIE5PIHdpdG5lc3NTY3JpcHRgKTtcclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS5CdWZmZXIsIHNpZ25QYXJhbXMucmVkZWVtU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyByZWRlZW1TY3JpcHRgKTtcclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS52YWx1ZSh1bmRlZmluZWQpLCBzaWduUGFyYW1zLndpdG5lc3NWYWx1ZSwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgTk8gd2l0bmVzc1ZhbHVlYCk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAncDJ3c2gtcDJtcyc6XHJcbiAgICBjYXNlICdwMndzaC1wMnBrJzpcclxuICAgIGNhc2UgJ3Ayd3NoLXAycGtoJzpcclxuICAgICAgaWYgKHByZXZPdXRUeXBlICYmIHByZXZPdXRUeXBlICE9PSAnd2l0bmVzc3NjcmlwdGhhc2gnKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgaW5wdXQgIyR7c2lnblBhcmFtcy52aW59IGlzIG5vdCBvZiB0eXBlICR7cG9zVHlwZX06ICR7cHJldk91dFR5cGV9YCk7XHJcbiAgICAgIH1cclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS5CdWZmZXIsIHNpZ25QYXJhbXMud2l0bmVzc1NjcmlwdCwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgd2l0bmVzc1NjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMucmVkZWVtU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyByZWRlZW1TY3JpcHRgKTtcclxuICAgICAgdGZNZXNzYWdlKHR5cGVzLlNhdG9zaGksIHNpZ25QYXJhbXMud2l0bmVzc1ZhbHVlLCBgJHtwb3NUeXBlfSByZXF1aXJlcyB3aXRuZXNzVmFsdWVgKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdwMnNoLXAyd3NoLXAybXMnOlxyXG4gICAgY2FzZSAncDJzaC1wMndzaC1wMnBrJzpcclxuICAgIGNhc2UgJ3Ayc2gtcDJ3c2gtcDJwa2gnOlxyXG4gICAgICBpZiAocHJldk91dFR5cGUgJiYgcHJldk91dFR5cGUgIT09ICdzY3JpcHRoYXNoJykge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGlucHV0ICMke3NpZ25QYXJhbXMudmlufSBpcyBub3Qgb2YgdHlwZSAke3Bvc1R5cGV9OiAke3ByZXZPdXRUeXBlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UuQnVmZmVyLCBzaWduUGFyYW1zLndpdG5lc3NTY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIHdpdG5lc3NTY3JpcHRgKTtcclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS5CdWZmZXIsIHNpZ25QYXJhbXMucmVkZWVtU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyB3aXRuZXNzU2NyaXB0YCk7XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlcy5TYXRvc2hpLCBzaWduUGFyYW1zLndpdG5lc3NWYWx1ZSwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgd2l0bmVzc1NjcmlwdGApO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3AydHInOlxyXG4gICAgICBpZiAocHJldk91dFR5cGUgJiYgcHJldk91dFR5cGUgIT09ICd0YXByb290Jykge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGlucHV0ICMke3NpZ25QYXJhbXMudmlufSBpcyBub3Qgb2YgdHlwZSAke3Bvc1R5cGV9OiAke3ByZXZPdXRUeXBlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy53aXRuZXNzU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzU2NyaXB0YCk7XHJcbiAgICAgIHRmTWVzc2FnZSh0eXBlZm9yY2UudmFsdWUodW5kZWZpbmVkKSwgc2lnblBhcmFtcy5yZWRlZW1TY3JpcHQsIGAke3Bvc1R5cGV9IHJlcXVpcmVzIE5PIHJlZGVlbVNjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMud2l0bmVzc1ZhbHVlLCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyB3aXRuZXNzVmFsdWVgKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdwMnRyLXAybnMnOlxyXG4gICAgICBpZiAocHJldk91dFR5cGUgJiYgcHJldk91dFR5cGUgIT09ICd0YXByb290Jykge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGlucHV0ICMke3NpZ25QYXJhbXMudmlufSBpcyBub3Qgb2YgdHlwZSAke3Bvc1R5cGV9OiAke3ByZXZPdXRUeXBlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIGlucHV0c1tzaWduUGFyYW1zLnZpbl0ucHJldk91dFR5cGUgPSBpbnB1dHNbc2lnblBhcmFtcy52aW5dLnByZXZPdXRUeXBlIHx8ICd0YXByb290JztcclxuICAgICAgdGZNZXNzYWdlKHR5cGVmb3JjZS5CdWZmZXIsIHNpZ25QYXJhbXMud2l0bmVzc1NjcmlwdCwgYCR7cG9zVHlwZX0gcmVxdWlyZXMgd2l0bmVzc1NjcmlwdGApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLkJ1ZmZlciwgc2lnblBhcmFtcy5jb250cm9sQmxvY2ssIGAke3Bvc1R5cGV9IHJlcXVpcmVzIGNvbnRyb2xCbG9ja2ApO1xyXG4gICAgICB0Zk1lc3NhZ2UodHlwZWZvcmNlLnZhbHVlKHVuZGVmaW5lZCksIHNpZ25QYXJhbXMucmVkZWVtU2NyaXB0LCBgJHtwb3NUeXBlfSByZXF1aXJlcyBOTyByZWRlZW1TY3JpcHRgKTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0cnlTaWduPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KHtcclxuICBpbnB1dCxcclxuICBvdXJQdWJLZXksXHJcbiAga2V5UGFpcixcclxuICBzaWduYXR1cmVIYXNoLFxyXG4gIGhhc2hUeXBlLFxyXG4gIHVzZUxvd1IsXHJcbiAgdGFwdHJlZVJvb3QsXHJcbn06IFNpZ25pbmdEYXRhPFROdW1iZXI+KTogdm9pZCB7XHJcbiAgaWYgKGlucHV0LndpdG5lc3NWZXJzaW9uID09PSAxICYmIG91clB1YktleS5sZW5ndGggPT09IDMzKSBvdXJQdWJLZXkgPSBvdXJQdWJLZXkuc2xpY2UoMSk7XHJcbiAgLy8gZW5mb3JjZSBpbiBvcmRlciBzaWduaW5nIG9mIHB1YmxpYyBrZXlzXHJcbiAgbGV0IHNpZ25lZCA9IGZhbHNlO1xyXG4gIGZvciAoY29uc3QgW2ksIHB1YktleV0gb2YgaW5wdXQucHVia2V5cyEuZW50cmllcygpKSB7XHJcbiAgICBpZiAoIW91clB1YktleS5lcXVhbHMocHViS2V5ISkpIGNvbnRpbnVlO1xyXG4gICAgaWYgKGlucHV0LnNpZ25hdHVyZXMhW2ldICYmIGlucHV0LnNpZ25hdHVyZXMhW2ldIS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgRXJyb3IoJ1NpZ25hdHVyZSBhbHJlYWR5IGV4aXN0cycpO1xyXG5cclxuICAgIC8vIFRPRE86IGFkZCB0ZXN0c1xyXG4gICAgaWYgKG91clB1YktleS5sZW5ndGggIT09IDMzICYmIGlucHV0LndpdG5lc3NWZXJzaW9uID09PSAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQklQMTQzIChXaXRuZXNzIHYwKSBpbnB1dHMgcmVxdWlyZSBjb21wcmVzc2VkIHB1YmtleXMnKTtcclxuICAgIH0gZWxzZSBpZiAob3VyUHViS2V5Lmxlbmd0aCAhPT0gMzIgJiYgaW5wdXQud2l0bmVzc1ZlcnNpb24gPT09IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCSVAzNDEgKFdpdG5lc3MgdjEpIGlucHV0cyByZXF1aXJlIHgtb25seSBwdWJrZXlzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlucHV0LndpdG5lc3NWZXJzaW9uID09PSAxKSB7XHJcbiAgICAgIGlmICghaW5wdXQud2l0bmVzc1NjcmlwdCkge1xyXG4gICAgICAgIC8vIEZJWE1FOiBXb3JrYXJvdW5kIGZvciBub3QgaGF2aW5nIHByb3BlciB0d2Vha2luZyBzdXBwb3J0IGZvciBrZXkgcGF0aFxyXG4gICAgICAgIGlmICgha2V5UGFpci5wcml2YXRlS2V5KSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZXhwZWN0ZWQga2V5cGFpcmApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwcml2YXRlS2V5ID0gdGFwcm9vdC50YXBUd2Vha1ByaXZrZXkoZWNjTGliLCBvdXJQdWJLZXksIGtleVBhaXIucHJpdmF0ZUtleSwgdGFwdHJlZVJvb3QpO1xyXG4gICAgICAgIGtleVBhaXIgPSBFQ1BhaXIuZnJvbVByaXZhdGVLZXkoQnVmZmVyLmZyb20ocHJpdmF0ZUtleSkpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpcHMvYmxvYi9tYXN0ZXIvYmlwLTAzNDEubWVkaWF3aWtpI2NvbW1vbi1zaWduYXR1cmUtbWVzc2FnZVxyXG4gICAgICBjb25zdCBzaWduYXR1cmUgPSBrZXlQYWlyLnNpZ25TY2hub3JyKHNpZ25hdHVyZUhhc2gpO1xyXG4gICAgICAvLyBTSUdIQVNIX0RFRkFVTFQgaXMgb21pdHRlZCBmcm9tIHRoZSBzaWduYXR1cmVcclxuICAgICAgaWYgKGhhc2hUeXBlID09PSBUcmFuc2FjdGlvbi5TSUdIQVNIX0RFRkFVTFQpIHtcclxuICAgICAgICBpbnB1dC5zaWduYXR1cmVzIVtpXSA9IEJ1ZmZlci5mcm9tKHNpZ25hdHVyZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaW5wdXQuc2lnbmF0dXJlcyFbaV0gPSBCdWZmZXIuY29uY2F0KFtzaWduYXR1cmUsIEJ1ZmZlci5vZihoYXNoVHlwZSldKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3Qgc2lnbmF0dXJlID0ga2V5UGFpci5zaWduKHNpZ25hdHVyZUhhc2gsIHVzZUxvd1IpO1xyXG4gICAgICBpbnB1dC5zaWduYXR1cmVzIVtpXSA9IGJzY3JpcHQuc2lnbmF0dXJlLmVuY29kZShzaWduYXR1cmUsIGhhc2hUeXBlKTtcclxuICAgIH1cclxuICAgIHNpZ25lZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICBpZiAoIXNpZ25lZCkgdGhyb3cgbmV3IEVycm9yKCdLZXkgcGFpciBjYW5ub3Qgc2lnbiBmb3IgdGhpcyBpbnB1dCcpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgU2lnbmluZ0RhdGE8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4ge1xyXG4gIGlucHV0OiBUeGJJbnB1dDxUTnVtYmVyPjtcclxuICBvdXJQdWJLZXk6IEJ1ZmZlcjtcclxuICBrZXlQYWlyOiBTaWduZXI7XHJcbiAgc2lnbmF0dXJlSGFzaDogQnVmZmVyO1xyXG4gIGhhc2hUeXBlOiBudW1iZXI7XHJcbiAgdXNlTG93UjogYm9vbGVhbjtcclxuICB0YXB0cmVlUm9vdD86IEJ1ZmZlcjtcclxufVxyXG5cclxudHlwZSBIYXNoVHlwZUNoZWNrID0gKGhhc2hUeXBlOiBudW1iZXIpID0+IGJvb2xlYW47XHJcblxyXG5mdW5jdGlvbiBnZXRTaWduaW5nRGF0YTxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIGlucHV0czogQXJyYXk8VHhiSW5wdXQ8VE51bWJlcj4+LFxyXG4gIG5lZWRzT3V0cHV0czogSGFzaFR5cGVDaGVjayxcclxuICB0eDogVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgc2lnblBhcmFtczogbnVtYmVyIHwgVHhiU2lnbkFyZzxUTnVtYmVyPixcclxuICBrZXlQYWlyPzogU2lnbmVyLFxyXG4gIHJlZGVlbVNjcmlwdD86IEJ1ZmZlcixcclxuICBoYXNoVHlwZT86IG51bWJlcixcclxuICB3aXRuZXNzVmFsdWU/OiBUTnVtYmVyLFxyXG4gIHdpdG5lc3NTY3JpcHQ/OiBCdWZmZXIsXHJcbiAgY29udHJvbEJsb2NrPzogQnVmZmVyLFxyXG4gIGFubmV4PzogQnVmZmVyLFxyXG4gIHVzZUxvd1I/OiBib29sZWFuXHJcbik6IFNpZ25pbmdEYXRhPFROdW1iZXI+IHtcclxuICBsZXQgdmluOiBudW1iZXI7XHJcbiAgaWYgKHR5cGVvZiBzaWduUGFyYW1zID09PSAnbnVtYmVyJykge1xyXG4gICAgY29uc29sZS53YXJuKFxyXG4gICAgICAnREVQUkVDQVRFRDogVHJhbnNhY3Rpb25CdWlsZGVyIHNpZ24gbWV0aG9kIGFyZ3VtZW50cyAnICsgJ3dpbGwgY2hhbmdlIGluIHY2LCBwbGVhc2UgdXNlIHRoZSBUeGJTaWduQXJnIGludGVyZmFjZSdcclxuICAgICk7XHJcbiAgICB2aW4gPSBzaWduUGFyYW1zO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIHNpZ25QYXJhbXMgPT09ICdvYmplY3QnKSB7XHJcbiAgICBjaGVja1NpZ25BcmdzPFROdW1iZXI+KGlucHV0cywgc2lnblBhcmFtcyk7XHJcbiAgICAoeyB2aW4sIGtleVBhaXIsIHJlZGVlbVNjcmlwdCwgaGFzaFR5cGUsIHdpdG5lc3NWYWx1ZSwgd2l0bmVzc1NjcmlwdCwgY29udHJvbEJsb2NrLCBhbm5leCB9ID0gc2lnblBhcmFtcyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RyYW5zYWN0aW9uQnVpbGRlciBzaWduIGZpcnN0IGFyZyBtdXN0IGJlIFR4YlNpZ25Bcmcgb3IgbnVtYmVyJyk7XHJcbiAgfVxyXG4gIGlmIChrZXlQYWlyID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignc2lnbiByZXF1aXJlcyBrZXlwYWlyJyk7XHJcbiAgfVxyXG4gIGlmICghaW5wdXRzW3Zpbl0pIHRocm93IG5ldyBFcnJvcignTm8gaW5wdXQgYXQgaW5kZXg6ICcgKyB2aW4pO1xyXG5cclxuICBjb25zdCBpbnB1dCA9IGlucHV0c1t2aW5dO1xyXG5cclxuICAvLyBpZiByZWRlZW1TY3JpcHQgd2FzIHByZXZpb3VzbHkgcHJvdmlkZWQsIGVuZm9yY2UgY29uc2lzdGVuY3lcclxuICBpZiAoaW5wdXQucmVkZWVtU2NyaXB0ICE9PSB1bmRlZmluZWQgJiYgcmVkZWVtU2NyaXB0ICYmICFpbnB1dC5yZWRlZW1TY3JpcHQuZXF1YWxzKHJlZGVlbVNjcmlwdCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignSW5jb25zaXN0ZW50IHJlZGVlbVNjcmlwdCcpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgb3VyUHViS2V5ID0ga2V5UGFpci5wdWJsaWNLZXkgfHwgKGtleVBhaXIuZ2V0UHVibGljS2V5ICYmIGtleVBhaXIuZ2V0UHVibGljS2V5KCkpO1xyXG4gIGlmICghY2FuU2lnbjxUTnVtYmVyPihpbnB1dCkpIHtcclxuICAgIGlmICh3aXRuZXNzVmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAoaW5wdXQudmFsdWUgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC52YWx1ZSAhPT0gd2l0bmVzc1ZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnB1dCBkaWQgbm90IG1hdGNoIHdpdG5lc3NWYWx1ZScpO1xyXG4gICAgICB9XHJcbiAgICAgIHR5cGVmb3JjZSh0eXBlcy5TYXRvc2hpLCB3aXRuZXNzVmFsdWUpO1xyXG4gICAgICBpbnB1dC52YWx1ZSA9IHdpdG5lc3NWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWNhblNpZ248VE51bWJlcj4oaW5wdXQpKSB7XHJcbiAgICAgIGNvbnN0IHByZXBhcmVkID0gcHJlcGFyZUlucHV0PFROdW1iZXI+KGlucHV0LCBvdXJQdWJLZXksIHJlZGVlbVNjcmlwdCwgd2l0bmVzc1NjcmlwdCwgY29udHJvbEJsb2NrLCBhbm5leCk7XHJcblxyXG4gICAgICAvLyB1cGRhdGVzIGlubGluZVxyXG4gICAgICBPYmplY3QuYXNzaWduKGlucHV0LCBwcmVwYXJlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFjYW5TaWduPFROdW1iZXI+KGlucHV0KSkgdGhyb3cgRXJyb3IoaW5wdXQucHJldk91dFR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQnKTtcclxuICB9XHJcblxyXG4gIC8vIGhhc2hUeXBlIGNhbiBiZSAwIGluIFRhcHJvb3QsIHNvIGNhbid0IHVzZSBoYXNoVHlwZSB8fCBTSUdIQVNIX0FMTFxyXG4gIGlmIChpbnB1dC53aXRuZXNzVmVyc2lvbiA9PT0gMSkge1xyXG4gICAgaGFzaFR5cGUgPSBoYXNoVHlwZSA9PT0gdW5kZWZpbmVkID8gVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxUIDogaGFzaFR5cGU7XHJcbiAgfSBlbHNlIHtcclxuICAgIGhhc2hUeXBlID0gaGFzaFR5cGUgfHwgVHJhbnNhY3Rpb24uU0lHSEFTSF9BTEw7XHJcbiAgfVxyXG4gIGlmIChuZWVkc091dHB1dHMoaGFzaFR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoJ1RyYW5zYWN0aW9uIG5lZWRzIG91dHB1dHMnKTtcclxuXHJcbiAgLy8gVE9ETzogVGhpcyBpcyBub3QgdGhlIGJlc3QgcGxhY2UgdG8gZG8gdGhpcywgYnV0IG1pZ2h0IHN0aWNrIHdpdGggaXQgdW50aWwgUFNCVFxyXG4gIGxldCBsZWFmSGFzaDtcclxuICBsZXQgdGFwdHJlZVJvb3Q7XHJcbiAgaWYgKGNvbnRyb2xCbG9jayAmJiB3aXRuZXNzU2NyaXB0KSB7XHJcbiAgICBsZWFmSGFzaCA9IHRhcHJvb3QuZ2V0VGFwbGVhZkhhc2goZWNjTGliLCBjb250cm9sQmxvY2ssIHdpdG5lc3NTY3JpcHQpO1xyXG4gICAgdGFwdHJlZVJvb3QgPSB0YXByb290LmdldFRhcHRyZWVSb290KGVjY0xpYiwgY29udHJvbEJsb2NrLCB3aXRuZXNzU2NyaXB0LCBsZWFmSGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZWFkeSB0byBzaWduXHJcbiAgbGV0IHNpZ25hdHVyZUhhc2g6IEJ1ZmZlcjtcclxuICBzd2l0Y2ggKGlucHV0LndpdG5lc3NWZXJzaW9uKSB7XHJcbiAgICBjYXNlIHVuZGVmaW5lZDpcclxuICAgICAgc2lnbmF0dXJlSGFzaCA9IHR4Lmhhc2hGb3JTaWduYXR1cmUodmluLCBpbnB1dC5zaWduU2NyaXB0IGFzIEJ1ZmZlciwgaGFzaFR5cGUsIGlucHV0LnZhbHVlKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDA6XHJcbiAgICAgIHNpZ25hdHVyZUhhc2ggPSB0eC5oYXNoRm9yV2l0bmVzc1YwKHZpbiwgaW5wdXQuc2lnblNjcmlwdCBhcyBCdWZmZXIsIGlucHV0LnZhbHVlIGFzIFROdW1iZXIsIGhhc2hUeXBlKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDE6XHJcbiAgICAgIHNpZ25hdHVyZUhhc2ggPSB0eC5oYXNoRm9yV2l0bmVzc1YxKFxyXG4gICAgICAgIHZpbixcclxuICAgICAgICBpbnB1dHMubWFwKCh7IHByZXZPdXRTY3JpcHQgfSkgPT4gcHJldk91dFNjcmlwdCBhcyBCdWZmZXIpLFxyXG4gICAgICAgIGlucHV0cy5tYXAoKHsgdmFsdWUgfSkgPT4gdmFsdWUgYXMgVE51bWJlciksXHJcbiAgICAgICAgaGFzaFR5cGUsXHJcbiAgICAgICAgbGVhZkhhc2hcclxuICAgICAgKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbnN1cHBvcnRlZCB3aXRuZXNzIHZlcnNpb24nKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBpbnB1dCxcclxuICAgIG91clB1YktleSxcclxuICAgIGtleVBhaXIsXHJcbiAgICBzaWduYXR1cmVIYXNoLFxyXG4gICAgaGFzaFR5cGUsXHJcbiAgICB1c2VMb3dSOiAhIXVzZUxvd1IsXHJcbiAgICB0YXB0cmVlUm9vdCxcclxuICB9O1xyXG59XHJcbiJdfQ==