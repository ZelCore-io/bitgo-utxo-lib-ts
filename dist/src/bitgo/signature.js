"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInput2Of3 = exports.signInputP2shP2pk = exports.getDefaultSigHash = exports.verifySignatureWithPublicKey = exports.verifySignatureWithPublicKeys = exports.getSignaturesWithPublicKeys = exports.verifySignature = exports.getSignatureVerifications = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const UtxoTransaction_1 = require("./UtxoTransaction");
const outputScripts_1 = require("./outputScripts");
const networks_1 = require("../networks");
const noble_ecc_1 = require("../noble_ecc");
const parseInput_1 = require("./parseInput");
const taproot_1 = require("../taproot");
/**
 * @deprecated - use {@see verifySignaturesWithPublicKeys} instead
 * Get signature verifications for multsig transaction
 * @param transaction
 * @param inputIndex
 * @param amount - must be set for segwit transactions and BIP143 transactions
 * @param verificationSettings
 * @param prevOutputs - must be set for p2tr and p2trMusig2 transactions
 * @returns SignatureVerification[] - in order of parsed non-empty signatures
 */
function getSignatureVerifications(transaction, inputIndex, amount, verificationSettings = {}, prevOutputs) {
    /* istanbul ignore next */
    if (!transaction.ins) {
        throw new Error(`invalid transaction`);
    }
    const input = transaction.ins[inputIndex];
    /* istanbul ignore next */
    if (!input) {
        throw new Error(`no input at index ${inputIndex}`);
    }
    if ((!input.script || input.script.length === 0) && input.witness.length === 0) {
        // Unsigned input: no signatures.
        return [];
    }
    const parsedScript = (0, parseInput_1.parseSignatureScript2Of3)(input);
    if (parsedScript.scriptType === 'taprootKeyPathSpend' || parsedScript.scriptType === 'taprootScriptPathSpend') {
        if (parsedScript.scriptType === 'taprootKeyPathSpend' &&
            (verificationSettings.signatureIndex || verificationSettings.publicKey)) {
            throw new Error(`signatureIndex and publicKey parameters not supported for taprootKeyPathSpend`);
        }
        if (verificationSettings.signatureIndex !== undefined) {
            throw new Error(`signatureIndex parameter not supported for taprootScriptPathSpend`);
        }
        if (!prevOutputs) {
            throw new Error(`prevOutputs not set`);
        }
        if (prevOutputs.length !== transaction.ins.length) {
            throw new Error(`prevOutputs length ${prevOutputs.length}, expected ${transaction.ins.length}`);
        }
    }
    if (parsedScript.scriptType !== 'taprootKeyPathSpend' &&
        parsedScript.scriptType !== 'taprootScriptPathSpend' &&
        prevOutputs) {
        const prevOutScript = prevOutputs[inputIndex].script;
        const output = (0, outputScripts_1.getOutputScript)(parsedScript.scriptType, parsedScript.pubScript);
        if (!prevOutScript.equals(output)) {
            throw new Error(`prevout script ${prevOutScript.toString('hex')} does not match computed script ${output.toString('hex')}`);
        }
    }
    let publicKeys;
    if (parsedScript.scriptType === 'taprootKeyPathSpend') {
        if (!prevOutputs) {
            throw new Error(`prevOutputs not set`);
        }
        publicKeys = [(0, taproot_1.getTaprootOutputKey)(prevOutputs[inputIndex].script)];
    }
    else {
        publicKeys = parsedScript.publicKeys.filter((buf) => verificationSettings.publicKey === undefined ||
            verificationSettings.publicKey.equals(buf) ||
            verificationSettings.publicKey.slice(1).equals(buf));
    }
    const signatures = parsedScript.signatures
        .filter((s) => s && s.length)
        .filter((s, i) => verificationSettings.signatureIndex === undefined || verificationSettings.signatureIndex === i);
    return signatures.map((signatureBuffer) => {
        if (signatureBuffer === 0 || signatureBuffer.length === 0) {
            return { signedBy: undefined, signature: undefined };
        }
        let hashType = bitcoinjs_lib_1.Transaction.SIGHASH_DEFAULT;
        if (signatureBuffer.length === 65) {
            hashType = signatureBuffer[signatureBuffer.length - 1];
            signatureBuffer = signatureBuffer.slice(0, -1);
        }
        if (parsedScript.scriptType === 'taprootScriptPathSpend') {
            if (!prevOutputs) {
                throw new Error(`prevOutputs not set`);
            }
            const { controlBlock, pubScript } = parsedScript;
            const leafHash = bitcoinjs_lib_1.taproot.getTapleafHash(noble_ecc_1.ecc, controlBlock, pubScript);
            const signatureHash = transaction.hashForWitnessV1(inputIndex, prevOutputs.map(({ script }) => script), prevOutputs.map(({ value }) => value), hashType, leafHash);
            const signedBy = publicKeys.filter((k) => Buffer.isBuffer(signatureBuffer) && noble_ecc_1.ecc.verifySchnorr(signatureHash, k, signatureBuffer));
            if (signedBy.length === 0) {
                return { signedBy: undefined, signature: undefined };
            }
            if (signedBy.length === 1) {
                return { signedBy: signedBy[0], signature: signatureBuffer };
            }
            throw new Error(`illegal state: signed by multiple public keys`);
        }
        else if (parsedScript.scriptType === 'taprootKeyPathSpend') {
            if (!prevOutputs) {
                throw new Error(`prevOutputs not set`);
            }
            const signatureHash = transaction.hashForWitnessV1(inputIndex, prevOutputs.map(({ script }) => script), prevOutputs.map(({ value }) => value), hashType);
            const result = noble_ecc_1.ecc.verifySchnorr(signatureHash, publicKeys[0], signatureBuffer);
            return result
                ? { signedBy: publicKeys[0], signature: signatureBuffer }
                : { signedBy: undefined, signature: undefined };
        }
        else {
            // slice the last byte from the signature hash input because it's the hash type
            const { signature, hashType } = bitcoinjs_lib_1.ScriptSignature.decode(signatureBuffer);
            const transactionHash = parsedScript.scriptType === 'p2shP2wsh' || parsedScript.scriptType === 'p2wsh'
                ? transaction.hashForWitnessV0(inputIndex, parsedScript.pubScript, amount, hashType)
                : transaction.hashForSignatureByNetwork(inputIndex, parsedScript.pubScript, amount, hashType);
            const signedBy = publicKeys.filter((publicKey) => noble_ecc_1.ecc.verify(transactionHash, publicKey, signature, 
            /*
              Strict verification (require lower-S value), as required by BIP-0146
              https://github.com/bitcoin/bips/blob/master/bip-0146.mediawiki
              https://github.com/bitcoin-core/secp256k1/blob/ac83be33/include/secp256k1.h#L478-L508
              https://github.com/bitcoinjs/tiny-secp256k1/blob/v1.1.6/js.js#L231-L233
            */
            true));
            if (signedBy.length === 0) {
                return { signedBy: undefined, signature: undefined };
            }
            if (signedBy.length === 1) {
                return { signedBy: signedBy[0], signature: signatureBuffer };
            }
            throw new Error(`illegal state: signed by multiple public keys`);
        }
    });
}
exports.getSignatureVerifications = getSignatureVerifications;
/**
 * @deprecated use {@see verifySignatureWithPublicKeys} instead
 * @param transaction
 * @param inputIndex
 * @param amount
 * @param verificationSettings - if publicKey is specified, returns true iff any signature is signed by publicKey.
 * @param prevOutputs - must be set for p2tr transactions
 */
function verifySignature(transaction, inputIndex, amount, verificationSettings = {}, prevOutputs) {
    const signatureVerifications = getSignatureVerifications(transaction, inputIndex, amount, verificationSettings, prevOutputs).filter((v) => 
    // If no publicKey is set in verificationSettings, all signatures must be valid.
    // Otherwise, a single valid signature by the specified pubkey is sufficient.
    verificationSettings.publicKey === undefined ||
        (v.signedBy !== undefined &&
            (verificationSettings.publicKey.equals(v.signedBy) ||
                verificationSettings.publicKey.slice(1).equals(v.signedBy))));
    return signatureVerifications.length > 0 && signatureVerifications.every((v) => v.signedBy !== undefined);
}
exports.verifySignature = verifySignature;
/**
 * @param v
 * @param publicKey
 * @return true iff signature is by publicKey (or xonly variant of publicKey)
 */
function isSignatureByPublicKey(v, publicKey) {
    return (!!v.signedBy &&
        (v.signedBy.equals(publicKey) ||
            /* for p2tr signatures, we pass the pubkey in 33-byte format recover it from the signature in 32-byte format */
            (publicKey.length === 33 && isSignatureByPublicKey(v, publicKey.slice(1)))));
}
/**
 * @param transaction
 * @param inputIndex
 * @param prevOutputs
 * @param publicKeys
 * @return array with signature corresponding to n-th key, undefined if no match found
 */
function getSignaturesWithPublicKeys(transaction, inputIndex, prevOutputs, publicKeys) {
    if (transaction.ins.length !== prevOutputs.length) {
        throw new Error(`input length must match prevOutputs length`);
    }
    const signatureVerifications = getSignatureVerifications(transaction, inputIndex, prevOutputs[inputIndex].value, {}, prevOutputs);
    return publicKeys.map((publicKey) => {
        const v = signatureVerifications.find((v) => isSignatureByPublicKey(v, publicKey));
        return v ? v.signature : undefined;
    });
}
exports.getSignaturesWithPublicKeys = getSignaturesWithPublicKeys;
/**
 * @param transaction
 * @param inputIndex
 * @param prevOutputs - transaction outputs for inputs
 * @param publicKeys - public keys to check signatures for
 * @return array of booleans indicating a valid signature for every pubkey in _publicKeys_
 */
function verifySignatureWithPublicKeys(transaction, inputIndex, prevOutputs, publicKeys) {
    return getSignaturesWithPublicKeys(transaction, inputIndex, prevOutputs, publicKeys).map((s) => s !== undefined);
}
exports.verifySignatureWithPublicKeys = verifySignatureWithPublicKeys;
/**
 * Wrapper for {@see verifySignatureWithPublicKeys} for single pubkey
 * @param transaction
 * @param inputIndex
 * @param prevOutputs
 * @param publicKey
 * @return true iff signature is valid
 */
function verifySignatureWithPublicKey(transaction, inputIndex, prevOutputs, publicKey) {
    return verifySignatureWithPublicKeys(transaction, inputIndex, prevOutputs, [publicKey])[0];
}
exports.verifySignatureWithPublicKey = verifySignatureWithPublicKey;
function getDefaultSigHash(network, scriptType) {
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.ecash:
            return bitcoinjs_lib_1.Transaction.SIGHASH_ALL | UtxoTransaction_1.UtxoTransaction.SIGHASH_FORKID;
        default:
            switch (scriptType) {
                case 'p2tr':
                case 'p2trMusig2':
                    return bitcoinjs_lib_1.Transaction.SIGHASH_DEFAULT;
                default:
                    return bitcoinjs_lib_1.Transaction.SIGHASH_ALL;
            }
    }
}
exports.getDefaultSigHash = getDefaultSigHash;
function signInputP2shP2pk(txBuilder, vin, keyPair) {
    const prevOutScriptType = 'p2sh-p2pk';
    const { redeemScript, witnessScript } = (0, outputScripts_1.createOutputScriptP2shP2pk)(keyPair.publicKey);
    keyPair.network = txBuilder.network;
    txBuilder.sign({
        vin,
        prevOutScriptType,
        keyPair,
        hashType: getDefaultSigHash(txBuilder.network),
        redeemScript,
        witnessScript,
        witnessValue: undefined,
    });
}
exports.signInputP2shP2pk = signInputP2shP2pk;
function signInput2Of3(txBuilder, vin, scriptType, pubkeys, keyPair, cosigner, amount) {
    let controlBlock;
    let redeemScript;
    let witnessScript;
    const prevOutScriptType = (0, outputScripts_1.scriptType2Of3AsPrevOutType)(scriptType);
    if (scriptType === 'p2tr') {
        ({ witnessScript, controlBlock } = (0, outputScripts_1.createSpendScriptP2tr)(pubkeys, [keyPair.publicKey, cosigner]));
    }
    else {
        ({ redeemScript, witnessScript } = (0, outputScripts_1.createOutputScript2of3)(pubkeys, scriptType));
    }
    keyPair.network = txBuilder.network;
    txBuilder.sign({
        vin,
        prevOutScriptType,
        keyPair,
        hashType: getDefaultSigHash(txBuilder.network, scriptType),
        redeemScript,
        witnessScript,
        witnessValue: amount,
        controlBlock,
    });
}
exports.signInput2Of3 = signInput2Of3;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL3NpZ25hdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxpREFBZ0Y7QUFFaEYsdURBQW9EO0FBRXBELG1EQVF5QjtBQUV6QiwwQ0FBNEQ7QUFDNUQsNENBQTZDO0FBQzdDLDZDQUF3RDtBQUN4RCx3Q0FBaUQ7QUE4QmpEOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLHlCQUF5QixDQUN2QyxXQUFxQyxFQUNyQyxVQUFrQixFQUNsQixNQUFlLEVBQ2YsdUJBQTZDLEVBQUUsRUFDL0MsV0FBaUM7SUFFakMsMEJBQTBCO0lBQzFCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO1FBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztLQUN4QztJQUVELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUMsMEJBQTBCO0lBQzFCLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixVQUFVLEVBQUUsQ0FBQyxDQUFDO0tBQ3BEO0lBRUQsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDOUUsaUNBQWlDO1FBQ2pDLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFFRCxNQUFNLFlBQVksR0FBRyxJQUFBLHFDQUF3QixFQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksWUFBWSxDQUFDLFVBQVUsS0FBSyxxQkFBcUIsSUFBSSxZQUFZLENBQUMsVUFBVSxLQUFLLHdCQUF3QixFQUFFO1FBQzdHLElBQ0UsWUFBWSxDQUFDLFVBQVUsS0FBSyxxQkFBcUI7WUFDakQs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QUFDO0lBQ2xFLElBQUksVUFBVSxLQUFLLE1BQU0sRUFBRTtRQUN6QixDQUFDLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUEscUNBQXFCLEVBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbkc7U0FBTTtRQUNMLENBQUMsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztLQUNqRjtJQUVELE9BQU8sQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQztJQUVwQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ2IsR0FBRztRQUNILGlCQUFpQjtRQUNqQixPQUFPO1FBQ1AsUUFBUSxFQUFFLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxPQUFrQixFQUFFLFVBQVUsQ0FBQztRQUNyRSxZQUFZO1FBQ1osYUFBYTtRQUNiLFlBQVksRUFBRSxNQUFNO1FBQ3BCLFlBQVk7S0FDYixDQUFDLENBQUM7QUFDTCxDQUFDO0FBaENELHNDQWdDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJJUDMySW50ZXJmYWNlIH0gZnJvbSAnYmlwMzInO1xyXG5cclxuaW1wb3J0IHsgVHJhbnNhY3Rpb24sIHRhcHJvb3QsIFR4T3V0cHV0LCBTY3JpcHRTaWduYXR1cmUgfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuXHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbiB9IGZyb20gJy4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4vVXR4b1RyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7XHJcbiAgY3JlYXRlT3V0cHV0U2NyaXB0Mm9mMyxcclxuICBjcmVhdGVPdXRwdXRTY3JpcHRQMnNoUDJwayxcclxuICBjcmVhdGVTcGVuZFNjcmlwdFAydHIsXHJcbiAgZ2V0T3V0cHV0U2NyaXB0LFxyXG4gIFNjcmlwdFR5cGUsXHJcbiAgU2NyaXB0VHlwZTJPZjMsXHJcbiAgc2NyaXB0VHlwZTJPZjNBc1ByZXZPdXRUeXBlLFxyXG59IGZyb20gJy4vb3V0cHV0U2NyaXB0cyc7XHJcbmltcG9ydCB7IFRyaXBsZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZXRNYWlubmV0LCBOZXR3b3JrLCBuZXR3b3JrcyB9IGZyb20gJy4uL25ldHdvcmtzJztcclxuaW1wb3J0IHsgZWNjIGFzIGVjY0xpYiB9IGZyb20gJy4uL25vYmxlX2VjYyc7XHJcbmltcG9ydCB7IHBhcnNlU2lnbmF0dXJlU2NyaXB0Mk9mMyB9IGZyb20gJy4vcGFyc2VJbnB1dCc7XHJcbmltcG9ydCB7IGdldFRhcHJvb3RPdXRwdXRLZXkgfSBmcm9tICcuLi90YXByb290JztcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJhaW50cyBmb3Igc2lnbmF0dXJlIHZlcmlmaWNhdGlvbnMuXHJcbiAqIFBhcmFtZXRlcnMgYXJlIGNvbmp1bmN0aXZlOiBpZiBtdWx0aXBsZSBwYXJhbWV0ZXJzIGFyZSBzZXQsIGEgdmVyaWZpY2F0aW9uIGZvciBhbiBpbmRpdmlkdWFsXHJcbiAqIHNpZ25hdHVyZSBtdXN0IHNhdGlzZnkgYWxsIG9mIHRoZW0uXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBWZXJpZmljYXRpb25TZXR0aW5ncyA9IHtcclxuICAvKipcclxuICAgKiBUaGUgaW5kZXggb2YgdGhlIHNpZ25hdHVyZSB0byB2ZXJpZnkuIE9ubHkgaXRlcmF0ZXMgb3ZlciBub24tZW1wdHkgc2lnbmF0dXJlcy5cclxuICAgKi9cclxuICBzaWduYXR1cmVJbmRleD86IG51bWJlcjtcclxuICAvKipcclxuICAgKiBUaGUgcHVibGljIGtleSB0byB2ZXJpZnkuXHJcbiAgICovXHJcbiAgcHVibGljS2V5PzogQnVmZmVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc3VsdCBmb3IgYSBpbmRpdmlkdWFsIHNpZ25hdHVyZSB2ZXJpZmljYXRpb25cclxuICovXHJcbmV4cG9ydCB0eXBlIFNpZ25hdHVyZVZlcmlmaWNhdGlvbiA9XHJcbiAgfCB7XHJcbiAgICAgIC8qKiBTZXQgdG8gdGhlIHB1YmxpYyBrZXkgdGhhdCBzaWduZWQgZm9yIHRoZSBzaWduYXR1cmUgKi9cclxuICAgICAgc2lnbmVkQnk6IEJ1ZmZlcjtcclxuICAgICAgLyoqIFNldCB0byB0aGUgc2lnbmF0dXJlIGJ1ZmZlciAqL1xyXG4gICAgICBzaWduYXR1cmU6IEJ1ZmZlcjtcclxuICAgIH1cclxuICB8IHsgc2lnbmVkQnk6IHVuZGVmaW5lZDsgc2lnbmF0dXJlOiB1bmRlZmluZWQgfTtcclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZCAtIHVzZSB7QHNlZSB2ZXJpZnlTaWduYXR1cmVzV2l0aFB1YmxpY0tleXN9IGluc3RlYWRcclxuICogR2V0IHNpZ25hdHVyZSB2ZXJpZmljYXRpb25zIGZvciBtdWx0c2lnIHRyYW5zYWN0aW9uXHJcbiAqIEBwYXJhbSB0cmFuc2FjdGlvblxyXG4gKiBAcGFyYW0gaW5wdXRJbmRleFxyXG4gKiBAcGFyYW0gYW1vdW50IC0gbXVzdCBiZSBzZXQgZm9yIHNlZ3dpdCB0cmFuc2FjdGlvbnMgYW5kIEJJUDE0MyB0cmFuc2FjdGlvbnNcclxuICogQHBhcmFtIHZlcmlmaWNhdGlvblNldHRpbmdzXHJcbiAqIEBwYXJhbSBwcmV2T3V0cHV0cyAtIG11c3QgYmUgc2V0IGZvciBwMnRyIGFuZCBwMnRyTXVzaWcyIHRyYW5zYWN0aW9uc1xyXG4gKiBAcmV0dXJucyBTaWduYXR1cmVWZXJpZmljYXRpb25bXSAtIGluIG9yZGVyIG9mIHBhcnNlZCBub24tZW1wdHkgc2lnbmF0dXJlc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNpZ25hdHVyZVZlcmlmaWNhdGlvbnM8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHJhbnNhY3Rpb246IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgYW1vdW50OiBUTnVtYmVyLFxyXG4gIHZlcmlmaWNhdGlvblNldHRpbmdzOiBWZXJpZmljYXRpb25TZXR0aW5ncyA9IHt9LFxyXG4gIHByZXZPdXRwdXRzPzogVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4pOiBTaWduYXR1cmVWZXJpZmljYXRpb25bXSB7XHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICBpZiAoIXRyYW5zYWN0aW9uLmlucykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHRyYW5zYWN0aW9uYCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnB1dCA9IHRyYW5zYWN0aW9uLmluc1tpbnB1dEluZGV4XTtcclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIGlmICghaW5wdXQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgbm8gaW5wdXQgYXQgaW5kZXggJHtpbnB1dEluZGV4fWApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCghaW5wdXQuc2NyaXB0IHx8IGlucHV0LnNjcmlwdC5sZW5ndGggPT09IDApICYmIGlucHV0LndpdG5lc3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBVbnNpZ25lZCBpbnB1dDogbm8gc2lnbmF0dXJlcy5cclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhcnNlZFNjcmlwdCA9IHBhcnNlU2lnbmF0dXJlU2NyaXB0Mk9mMyhpbnB1dCk7XHJcblxyXG4gIGlmIChwYXJzZWRTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnIHx8IHBhcnNlZFNjcmlwdC5zY3JpcHRUeXBlID09PSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcpIHtcclxuICAgIGlmIChcclxuICAgICAgcGFyc2VkU2NyaXB0LnNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJyAmJlxyXG4gICAgICAodmVyaWZpY2F0aW9uU2V0dGluZ3Muc2lnbmF0dXJlSW5kZXggfHwgdmVyaWZpY2F0aW9uU2V0dGluZ3MucHVibGljS2V5KVxyXG4gICAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgc2lnbmF0dXJlSW5kZXggYW5kIHB1YmxpY0tleSBwYXJhbWV0ZXJzIG5vdCBzdXBwb3J0ZWQgZm9yIHRhcHJvb3RLZXlQYXRoU3BlbmRgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodmVyaWZpY2F0aW9uU2V0dGluZ3Muc2lnbmF0dXJlSW5kZXggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHNpZ25hdHVyZUluZGV4IHBhcmFtZXRlciBub3Qgc3VwcG9ydGVkIGZvciB0YXByb290U2NyaXB0UGF0aFNwZW5kYCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFwcmV2T3V0cHV0cykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHByZXZPdXRwdXRzIG5vdCBzZXRgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocHJldk91dHB1dHMubGVuZ3RoICE9PSB0cmFuc2FjdGlvbi5pbnMubGVuZ3RoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgcHJldk91dHB1dHMgbGVuZ3RoICR7cHJldk91dHB1dHMubGVuZ3RofSwgZXhwZWN0ZWQgJHt0cmFuc2FjdGlvbi5pbnMubGVuZ3RofWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKFxyXG4gICAgcGFyc2VkU2NyaXB0LnNjcmlwdFR5cGUgIT09ICd0YXByb290S2V5UGF0aFNwZW5kJyAmJlxyXG4gICAgcGFyc2VkU2NyaXB0LnNjcmlwdFR5cGUgIT09ICd0YXByb290U2NyaXB0UGF0aFNwZW5kJyAmJlxyXG4gICAgcHJldk91dHB1dHNcclxuICApIHtcclxuICAgIGNvbnN0IHByZXZPdXRTY3JpcHQgPSBwcmV2T3V0cHV0c1tpbnB1dEluZGV4XS5zY3JpcHQ7XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0ID0gZ2V0T3V0cHV0U2NyaXB0KHBhcnNlZFNjcmlwdC5zY3JpcHRUeXBlLCBwYXJzZWRTY3JpcHQucHViU2NyaXB0KTtcclxuICAgIGlmICghcHJldk91dFNjcmlwdC5lcXVhbHMob3V0cHV0KSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgYHByZXZvdXQgc2NyaXB0ICR7cHJldk91dFNjcmlwdC50b1N0cmluZygnaGV4Jyl9IGRvZXMgbm90IG1hdGNoIGNvbXB1dGVkIHNjcmlwdCAke291dHB1dC50b1N0cmluZygnaGV4Jyl9YFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHB1YmxpY0tleXM6IEJ1ZmZlcltdO1xyXG4gIGlmIChwYXJzZWRTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnKSB7XHJcbiAgICBpZiAoIXByZXZPdXRwdXRzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgcHJldk91dHB1dHMgbm90IHNldGApO1xyXG4gICAgfVxyXG4gICAgcHVibGljS2V5cyA9IFtnZXRUYXByb290T3V0cHV0S2V5KHByZXZPdXRwdXRzW2lucHV0SW5kZXhdLnNjcmlwdCldO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBwdWJsaWNLZXlzID0gcGFyc2VkU2NyaXB0LnB1YmxpY0tleXMuZmlsdGVyKFxyXG4gICAgICAoYnVmKSA9PlxyXG4gICAgICAgIHZlcmlmaWNhdGlvblNldHRpbmdzLnB1YmxpY0tleSA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgdmVyaWZpY2F0aW9uU2V0dGluZ3MucHVibGljS2V5LmVxdWFscyhidWYpIHx8XHJcbiAgICAgICAgdmVyaWZpY2F0aW9uU2V0dGluZ3MucHVibGljS2V5LnNsaWNlKDEpLmVxdWFscyhidWYpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2lnbmF0dXJlcyA9IHBhcnNlZFNjcmlwdC5zaWduYXR1cmVzXHJcbiAgICAuZmlsdGVyKChzKSA9PiBzICYmIHMubGVuZ3RoKVxyXG4gICAgLmZpbHRlcigocywgaSkgPT4gdmVyaWZpY2F0aW9uU2V0dGluZ3Muc2lnbmF0dXJlSW5kZXggPT09IHVuZGVmaW5lZCB8fCB2ZXJpZmljYXRpb25TZXR0aW5ncy5zaWduYXR1cmVJbmRleCA9PT0gaSk7XHJcblxyXG4gIHJldHVybiBzaWduYXR1cmVzLm1hcCgoc2lnbmF0dXJlQnVmZmVyKTogU2lnbmF0dXJlVmVyaWZpY2F0aW9uID0+IHtcclxuICAgIGlmIChzaWduYXR1cmVCdWZmZXIgPT09IDAgfHwgc2lnbmF0dXJlQnVmZmVyLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4geyBzaWduZWRCeTogdW5kZWZpbmVkLCBzaWduYXR1cmU6IHVuZGVmaW5lZCB9O1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBoYXNoVHlwZSA9IFRyYW5zYWN0aW9uLlNJR0hBU0hfREVGQVVMVDtcclxuXHJcbiAgICBpZiAoc2lnbmF0dXJlQnVmZmVyLmxlbmd0aCA9PT0gNjUpIHtcclxuICAgICAgaGFzaFR5cGUgPSBzaWduYXR1cmVCdWZmZXJbc2lnbmF0dXJlQnVmZmVyLmxlbmd0aCAtIDFdO1xyXG4gICAgICBzaWduYXR1cmVCdWZmZXIgPSBzaWduYXR1cmVCdWZmZXIuc2xpY2UoMCwgLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwYXJzZWRTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnKSB7XHJcbiAgICAgIGlmICghcHJldk91dHB1dHMpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHByZXZPdXRwdXRzIG5vdCBzZXRgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCB7IGNvbnRyb2xCbG9jaywgcHViU2NyaXB0IH0gPSBwYXJzZWRTY3JpcHQ7XHJcbiAgICAgIGNvbnN0IGxlYWZIYXNoID0gdGFwcm9vdC5nZXRUYXBsZWFmSGFzaChlY2NMaWIsIGNvbnRyb2xCbG9jaywgcHViU2NyaXB0KTtcclxuICAgICAgY29uc3Qgc2lnbmF0dXJlSGFzaCA9IHRyYW5zYWN0aW9uLmhhc2hGb3JXaXRuZXNzVjEoXHJcbiAgICAgICAgaW5wdXRJbmRleCxcclxuICAgICAgICBwcmV2T3V0cHV0cy5tYXAoKHsgc2NyaXB0IH0pID0+IHNjcmlwdCksXHJcbiAgICAgICAgcHJldk91dHB1dHMubWFwKCh7IHZhbHVlIH0pID0+IHZhbHVlKSxcclxuICAgICAgICBoYXNoVHlwZSxcclxuICAgICAgICBsZWFmSGFzaFxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3Qgc2lnbmVkQnkgPSBwdWJsaWNLZXlzLmZpbHRlcihcclxuICAgICAgICAoaykgPT4gQnVmZmVyLmlzQnVmZmVyKHNpZ25hdHVyZUJ1ZmZlcikgJiYgZWNjTGliLnZlcmlmeVNjaG5vcnIoc2lnbmF0dXJlSGFzaCwgaywgc2lnbmF0dXJlQnVmZmVyKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKHNpZ25lZEJ5Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiB7IHNpZ25lZEJ5OiB1bmRlZmluZWQsIHNpZ25hdHVyZTogdW5kZWZpbmVkIH07XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNpZ25lZEJ5Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiB7IHNpZ25lZEJ5OiBzaWduZWRCeVswXSwgc2lnbmF0dXJlOiBzaWduYXR1cmVCdWZmZXIgfTtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGlsbGVnYWwgc3RhdGU6IHNpZ25lZCBieSBtdWx0aXBsZSBwdWJsaWMga2V5c2ApO1xyXG4gICAgfSBlbHNlIGlmIChwYXJzZWRTY3JpcHQuc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnKSB7XHJcbiAgICAgIGlmICghcHJldk91dHB1dHMpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHByZXZPdXRwdXRzIG5vdCBzZXRgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzaWduYXR1cmVIYXNoID0gdHJhbnNhY3Rpb24uaGFzaEZvcldpdG5lc3NWMShcclxuICAgICAgICBpbnB1dEluZGV4LFxyXG4gICAgICAgIHByZXZPdXRwdXRzLm1hcCgoeyBzY3JpcHQgfSkgPT4gc2NyaXB0KSxcclxuICAgICAgICBwcmV2T3V0cHV0cy5tYXAoKHsgdmFsdWUgfSkgPT4gdmFsdWUpLFxyXG4gICAgICAgIGhhc2hUeXBlXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGVjY0xpYi52ZXJpZnlTY2hub3JyKHNpZ25hdHVyZUhhc2gsIHB1YmxpY0tleXNbMF0sIHNpZ25hdHVyZUJ1ZmZlcik7XHJcbiAgICAgIHJldHVybiByZXN1bHRcclxuICAgICAgICA/IHsgc2lnbmVkQnk6IHB1YmxpY0tleXNbMF0sIHNpZ25hdHVyZTogc2lnbmF0dXJlQnVmZmVyIH1cclxuICAgICAgICA6IHsgc2lnbmVkQnk6IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiB1bmRlZmluZWQgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHNsaWNlIHRoZSBsYXN0IGJ5dGUgZnJvbSB0aGUgc2lnbmF0dXJlIGhhc2ggaW5wdXQgYmVjYXVzZSBpdCdzIHRoZSBoYXNoIHR5cGVcclxuICAgICAgY29uc3QgeyBzaWduYXR1cmUsIGhhc2hUeXBlIH0gPSBTY3JpcHRTaWduYXR1cmUuZGVjb2RlKHNpZ25hdHVyZUJ1ZmZlcik7XHJcbiAgICAgIGNvbnN0IHRyYW5zYWN0aW9uSGFzaCA9XHJcbiAgICAgICAgcGFyc2VkU2NyaXB0LnNjcmlwdFR5cGUgPT09ICdwMnNoUDJ3c2gnIHx8IHBhcnNlZFNjcmlwdC5zY3JpcHRUeXBlID09PSAncDJ3c2gnXHJcbiAgICAgICAgICA/IHRyYW5zYWN0aW9uLmhhc2hGb3JXaXRuZXNzVjAoaW5wdXRJbmRleCwgcGFyc2VkU2NyaXB0LnB1YlNjcmlwdCwgYW1vdW50LCBoYXNoVHlwZSlcclxuICAgICAgICAgIDogdHJhbnNhY3Rpb24uaGFzaEZvclNpZ25hdHVyZUJ5TmV0d29yayhpbnB1dEluZGV4LCBwYXJzZWRTY3JpcHQucHViU2NyaXB0LCBhbW91bnQsIGhhc2hUeXBlKTtcclxuICAgICAgY29uc3Qgc2lnbmVkQnkgPSBwdWJsaWNLZXlzLmZpbHRlcigocHVibGljS2V5KSA9PlxyXG4gICAgICAgIGVjY0xpYi52ZXJpZnkoXHJcbiAgICAgICAgICB0cmFuc2FjdGlvbkhhc2gsXHJcbiAgICAgICAgICBwdWJsaWNLZXksXHJcbiAgICAgICAgICBzaWduYXR1cmUsXHJcbiAgICAgICAgICAvKlxyXG4gICAgICAgICAgICBTdHJpY3QgdmVyaWZpY2F0aW9uIChyZXF1aXJlIGxvd2VyLVMgdmFsdWUpLCBhcyByZXF1aXJlZCBieSBCSVAtMDE0NlxyXG4gICAgICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXBzL2Jsb2IvbWFzdGVyL2JpcC0wMTQ2Lm1lZGlhd2lraVxyXG4gICAgICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1jb3JlL3NlY3AyNTZrMS9ibG9iL2FjODNiZTMzL2luY2x1ZGUvc2VjcDI1NmsxLmgjTDQ3OC1MNTA4XHJcbiAgICAgICAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luanMvdGlueS1zZWNwMjU2azEvYmxvYi92MS4xLjYvanMuanMjTDIzMS1MMjMzXHJcbiAgICAgICAgICAqL1xyXG4gICAgICAgICAgdHJ1ZVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChzaWduZWRCeS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4geyBzaWduZWRCeTogdW5kZWZpbmVkLCBzaWduYXR1cmU6IHVuZGVmaW5lZCB9O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzaWduZWRCeS5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXR1cm4geyBzaWduZWRCeTogc2lnbmVkQnlbMF0sIHNpZ25hdHVyZTogc2lnbmF0dXJlQnVmZmVyIH07XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbGxlZ2FsIHN0YXRlOiBzaWduZWQgYnkgbXVsdGlwbGUgcHVibGljIGtleXNgKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBkZXByZWNhdGVkIHVzZSB7QHNlZSB2ZXJpZnlTaWduYXR1cmVXaXRoUHVibGljS2V5c30gaW5zdGVhZFxyXG4gKiBAcGFyYW0gdHJhbnNhY3Rpb25cclxuICogQHBhcmFtIGlucHV0SW5kZXhcclxuICogQHBhcmFtIGFtb3VudFxyXG4gKiBAcGFyYW0gdmVyaWZpY2F0aW9uU2V0dGluZ3MgLSBpZiBwdWJsaWNLZXkgaXMgc3BlY2lmaWVkLCByZXR1cm5zIHRydWUgaWZmIGFueSBzaWduYXR1cmUgaXMgc2lnbmVkIGJ5IHB1YmxpY0tleS5cclxuICogQHBhcmFtIHByZXZPdXRwdXRzIC0gbXVzdCBiZSBzZXQgZm9yIHAydHIgdHJhbnNhY3Rpb25zXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmVyaWZ5U2lnbmF0dXJlPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHRyYW5zYWN0aW9uOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgaW5wdXRJbmRleDogbnVtYmVyLFxyXG4gIGFtb3VudDogVE51bWJlcixcclxuICB2ZXJpZmljYXRpb25TZXR0aW5nczogVmVyaWZpY2F0aW9uU2V0dGluZ3MgPSB7fSxcclxuICBwcmV2T3V0cHV0cz86IFR4T3V0cHV0PFROdW1iZXI+W11cclxuKTogYm9vbGVhbiB7XHJcbiAgY29uc3Qgc2lnbmF0dXJlVmVyaWZpY2F0aW9ucyA9IGdldFNpZ25hdHVyZVZlcmlmaWNhdGlvbnMoXHJcbiAgICB0cmFuc2FjdGlvbixcclxuICAgIGlucHV0SW5kZXgsXHJcbiAgICBhbW91bnQsXHJcbiAgICB2ZXJpZmljYXRpb25TZXR0aW5ncyxcclxuICAgIHByZXZPdXRwdXRzXHJcbiAgKS5maWx0ZXIoXHJcbiAgICAodikgPT5cclxuICAgICAgLy8gSWYgbm8gcHVibGljS2V5IGlzIHNldCBpbiB2ZXJpZmljYXRpb25TZXR0aW5ncywgYWxsIHNpZ25hdHVyZXMgbXVzdCBiZSB2YWxpZC5cclxuICAgICAgLy8gT3RoZXJ3aXNlLCBhIHNpbmdsZSB2YWxpZCBzaWduYXR1cmUgYnkgdGhlIHNwZWNpZmllZCBwdWJrZXkgaXMgc3VmZmljaWVudC5cclxuICAgICAgdmVyaWZpY2F0aW9uU2V0dGluZ3MucHVibGljS2V5ID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgKHYuc2lnbmVkQnkgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgICh2ZXJpZmljYXRpb25TZXR0aW5ncy5wdWJsaWNLZXkuZXF1YWxzKHYuc2lnbmVkQnkpIHx8XHJcbiAgICAgICAgICB2ZXJpZmljYXRpb25TZXR0aW5ncy5wdWJsaWNLZXkuc2xpY2UoMSkuZXF1YWxzKHYuc2lnbmVkQnkpKSlcclxuICApO1xyXG5cclxuICByZXR1cm4gc2lnbmF0dXJlVmVyaWZpY2F0aW9ucy5sZW5ndGggPiAwICYmIHNpZ25hdHVyZVZlcmlmaWNhdGlvbnMuZXZlcnkoKHYpID0+IHYuc2lnbmVkQnkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gdlxyXG4gKiBAcGFyYW0gcHVibGljS2V5XHJcbiAqIEByZXR1cm4gdHJ1ZSBpZmYgc2lnbmF0dXJlIGlzIGJ5IHB1YmxpY0tleSAob3IgeG9ubHkgdmFyaWFudCBvZiBwdWJsaWNLZXkpXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1NpZ25hdHVyZUJ5UHVibGljS2V5KHY6IFNpZ25hdHVyZVZlcmlmaWNhdGlvbiwgcHVibGljS2V5OiBCdWZmZXIpOiBib29sZWFuIHtcclxuICByZXR1cm4gKFxyXG4gICAgISF2LnNpZ25lZEJ5ICYmXHJcbiAgICAodi5zaWduZWRCeS5lcXVhbHMocHVibGljS2V5KSB8fFxyXG4gICAgICAvKiBmb3IgcDJ0ciBzaWduYXR1cmVzLCB3ZSBwYXNzIHRoZSBwdWJrZXkgaW4gMzMtYnl0ZSBmb3JtYXQgcmVjb3ZlciBpdCBmcm9tIHRoZSBzaWduYXR1cmUgaW4gMzItYnl0ZSBmb3JtYXQgKi9cclxuICAgICAgKHB1YmxpY0tleS5sZW5ndGggPT09IDMzICYmIGlzU2lnbmF0dXJlQnlQdWJsaWNLZXkodiwgcHVibGljS2V5LnNsaWNlKDEpKSkpXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB0cmFuc2FjdGlvblxyXG4gKiBAcGFyYW0gaW5wdXRJbmRleFxyXG4gKiBAcGFyYW0gcHJldk91dHB1dHNcclxuICogQHBhcmFtIHB1YmxpY0tleXNcclxuICogQHJldHVybiBhcnJheSB3aXRoIHNpZ25hdHVyZSBjb3JyZXNwb25kaW5nIHRvIG4tdGgga2V5LCB1bmRlZmluZWQgaWYgbm8gbWF0Y2ggZm91bmRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTaWduYXR1cmVzV2l0aFB1YmxpY0tleXM8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHJhbnNhY3Rpb246IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICBpbnB1dEluZGV4OiBudW1iZXIsXHJcbiAgcHJldk91dHB1dHM6IFR4T3V0cHV0PFROdW1iZXI+W10sXHJcbiAgcHVibGljS2V5czogQnVmZmVyW11cclxuKTogQXJyYXk8QnVmZmVyIHwgdW5kZWZpbmVkPiB7XHJcbiAgaWYgKHRyYW5zYWN0aW9uLmlucy5sZW5ndGggIT09IHByZXZPdXRwdXRzLmxlbmd0aCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnB1dCBsZW5ndGggbXVzdCBtYXRjaCBwcmV2T3V0cHV0cyBsZW5ndGhgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNpZ25hdHVyZVZlcmlmaWNhdGlvbnMgPSBnZXRTaWduYXR1cmVWZXJpZmljYXRpb25zKFxyXG4gICAgdHJhbnNhY3Rpb24sXHJcbiAgICBpbnB1dEluZGV4LFxyXG4gICAgcHJldk91dHB1dHNbaW5wdXRJbmRleF0udmFsdWUsXHJcbiAgICB7fSxcclxuICAgIHByZXZPdXRwdXRzXHJcbiAgKTtcclxuXHJcbiAgcmV0dXJuIHB1YmxpY0tleXMubWFwKChwdWJsaWNLZXkpID0+IHtcclxuICAgIGNvbnN0IHYgPSBzaWduYXR1cmVWZXJpZmljYXRpb25zLmZpbmQoKHYpID0+IGlzU2lnbmF0dXJlQnlQdWJsaWNLZXkodiwgcHVibGljS2V5KSk7XHJcbiAgICByZXR1cm4gdiA/IHYuc2lnbmF0dXJlIDogdW5kZWZpbmVkO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHRyYW5zYWN0aW9uXHJcbiAqIEBwYXJhbSBpbnB1dEluZGV4XHJcbiAqIEBwYXJhbSBwcmV2T3V0cHV0cyAtIHRyYW5zYWN0aW9uIG91dHB1dHMgZm9yIGlucHV0c1xyXG4gKiBAcGFyYW0gcHVibGljS2V5cyAtIHB1YmxpYyBrZXlzIHRvIGNoZWNrIHNpZ25hdHVyZXMgZm9yXHJcbiAqIEByZXR1cm4gYXJyYXkgb2YgYm9vbGVhbnMgaW5kaWNhdGluZyBhIHZhbGlkIHNpZ25hdHVyZSBmb3IgZXZlcnkgcHVia2V5IGluIF9wdWJsaWNLZXlzX1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHZlcmlmeVNpZ25hdHVyZVdpdGhQdWJsaWNLZXlzPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHRyYW5zYWN0aW9uOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgaW5wdXRJbmRleDogbnVtYmVyLFxyXG4gIHByZXZPdXRwdXRzOiBUeE91dHB1dDxUTnVtYmVyPltdLFxyXG4gIHB1YmxpY0tleXM6IEJ1ZmZlcltdXHJcbik6IGJvb2xlYW5bXSB7XHJcbiAgcmV0dXJuIGdldFNpZ25hdHVyZXNXaXRoUHVibGljS2V5cyh0cmFuc2FjdGlvbiwgaW5wdXRJbmRleCwgcHJldk91dHB1dHMsIHB1YmxpY0tleXMpLm1hcCgocykgPT4gcyAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFdyYXBwZXIgZm9yIHtAc2VlIHZlcmlmeVNpZ25hdHVyZVdpdGhQdWJsaWNLZXlzfSBmb3Igc2luZ2xlIHB1YmtleVxyXG4gKiBAcGFyYW0gdHJhbnNhY3Rpb25cclxuICogQHBhcmFtIGlucHV0SW5kZXhcclxuICogQHBhcmFtIHByZXZPdXRwdXRzXHJcbiAqIEBwYXJhbSBwdWJsaWNLZXlcclxuICogQHJldHVybiB0cnVlIGlmZiBzaWduYXR1cmUgaXMgdmFsaWRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2ZXJpZnlTaWduYXR1cmVXaXRoUHVibGljS2V5PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHRyYW5zYWN0aW9uOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgaW5wdXRJbmRleDogbnVtYmVyLFxyXG4gIHByZXZPdXRwdXRzOiBUeE91dHB1dDxUTnVtYmVyPltdLFxyXG4gIHB1YmxpY0tleTogQnVmZmVyXHJcbik6IGJvb2xlYW4ge1xyXG4gIHJldHVybiB2ZXJpZnlTaWduYXR1cmVXaXRoUHVibGljS2V5cyh0cmFuc2FjdGlvbiwgaW5wdXRJbmRleCwgcHJldk91dHB1dHMsIFtwdWJsaWNLZXldKVswXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRTaWdIYXNoKG5ldHdvcms6IE5ldHdvcmssIHNjcmlwdFR5cGU/OiBTY3JpcHRUeXBlKTogbnVtYmVyIHtcclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICByZXR1cm4gVHJhbnNhY3Rpb24uU0lHSEFTSF9BTEwgfCBVdHhvVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSUQ7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICBzd2l0Y2ggKHNjcmlwdFR5cGUpIHtcclxuICAgICAgICBjYXNlICdwMnRyJzpcclxuICAgICAgICBjYXNlICdwMnRyTXVzaWcyJzpcclxuICAgICAgICAgIHJldHVybiBUcmFuc2FjdGlvbi5TSUdIQVNIX0RFRkFVTFQ7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHJldHVybiBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTDtcclxuICAgICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25JbnB1dFAyc2hQMnBrPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4QnVpbGRlcjogVXR4b1RyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPixcclxuICB2aW46IG51bWJlcixcclxuICBrZXlQYWlyOiBCSVAzMkludGVyZmFjZVxyXG4pOiB2b2lkIHtcclxuICBjb25zdCBwcmV2T3V0U2NyaXB0VHlwZSA9ICdwMnNoLXAycGsnO1xyXG4gIGNvbnN0IHsgcmVkZWVtU2NyaXB0LCB3aXRuZXNzU2NyaXB0IH0gPSBjcmVhdGVPdXRwdXRTY3JpcHRQMnNoUDJwayhrZXlQYWlyLnB1YmxpY0tleSk7XHJcbiAga2V5UGFpci5uZXR3b3JrID0gdHhCdWlsZGVyLm5ldHdvcms7XHJcblxyXG4gIHR4QnVpbGRlci5zaWduKHtcclxuICAgIHZpbixcclxuICAgIHByZXZPdXRTY3JpcHRUeXBlLFxyXG4gICAga2V5UGFpcixcclxuICAgIGhhc2hUeXBlOiBnZXREZWZhdWx0U2lnSGFzaCh0eEJ1aWxkZXIubmV0d29yayBhcyBOZXR3b3JrKSxcclxuICAgIHJlZGVlbVNjcmlwdCxcclxuICAgIHdpdG5lc3NTY3JpcHQsXHJcbiAgICB3aXRuZXNzVmFsdWU6IHVuZGVmaW5lZCxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25JbnB1dDJPZjM8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHhCdWlsZGVyOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+LFxyXG4gIHZpbjogbnVtYmVyLFxyXG4gIHNjcmlwdFR5cGU6IFNjcmlwdFR5cGUyT2YzLFxyXG4gIHB1YmtleXM6IFRyaXBsZTxCdWZmZXI+LFxyXG4gIGtleVBhaXI6IEJJUDMySW50ZXJmYWNlLFxyXG4gIGNvc2lnbmVyOiBCdWZmZXIsXHJcbiAgYW1vdW50OiBUTnVtYmVyXHJcbik6IHZvaWQge1xyXG4gIGxldCBjb250cm9sQmxvY2s7XHJcbiAgbGV0IHJlZGVlbVNjcmlwdDtcclxuICBsZXQgd2l0bmVzc1NjcmlwdDtcclxuXHJcbiAgY29uc3QgcHJldk91dFNjcmlwdFR5cGUgPSBzY3JpcHRUeXBlMk9mM0FzUHJldk91dFR5cGUoc2NyaXB0VHlwZSk7XHJcbiAgaWYgKHNjcmlwdFR5cGUgPT09ICdwMnRyJykge1xyXG4gICAgKHsgd2l0bmVzc1NjcmlwdCwgY29udHJvbEJsb2NrIH0gPSBjcmVhdGVTcGVuZFNjcmlwdFAydHIocHVia2V5cywgW2tleVBhaXIucHVibGljS2V5LCBjb3NpZ25lcl0pKTtcclxuICB9IGVsc2Uge1xyXG4gICAgKHsgcmVkZWVtU2NyaXB0LCB3aXRuZXNzU2NyaXB0IH0gPSBjcmVhdGVPdXRwdXRTY3JpcHQyb2YzKHB1YmtleXMsIHNjcmlwdFR5cGUpKTtcclxuICB9XHJcblxyXG4gIGtleVBhaXIubmV0d29yayA9IHR4QnVpbGRlci5uZXR3b3JrO1xyXG5cclxuICB0eEJ1aWxkZXIuc2lnbih7XHJcbiAgICB2aW4sXHJcbiAgICBwcmV2T3V0U2NyaXB0VHlwZSxcclxuICAgIGtleVBhaXIsXHJcbiAgICBoYXNoVHlwZTogZ2V0RGVmYXVsdFNpZ0hhc2godHhCdWlsZGVyLm5ldHdvcmsgYXMgTmV0d29yaywgc2NyaXB0VHlwZSksXHJcbiAgICByZWRlZW1TY3JpcHQsXHJcbiAgICB3aXRuZXNzU2NyaXB0LFxyXG4gICAgd2l0bmVzc1ZhbHVlOiBhbW91bnQsXHJcbiAgICBjb250cm9sQmxvY2ssXHJcbiAgfSk7XHJcbn1cclxuIl19