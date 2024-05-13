"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpendScriptP2trMusig2 = exports.createSpendScriptP2tr = exports.createKeyPathP2trMusig2 = exports.getLeafHash = exports.createPaymentP2trMusig2 = exports.createPaymentP2tr = exports.checkTxHash = exports.checkTapMerkleRoot = exports.checkPlainPublicKey = exports.checkXOnlyPublicKey = exports.toXOnlyPublicKey = exports.createOutputScript2of3 = exports.getOutputScript = exports.createOutputScriptP2shP2pk = exports.scriptType2Of3AsPrevOutType = exports.isSupportedScriptType = exports.hasWitnessData = exports.isScriptType2Of3 = exports.scriptTypes2Of3 = exports.scriptTypeP2shP2pk = exports.scriptTypeForChain = void 0;
const assert = require("assert");
const bitcoinjs = require("bitcoinjs-lib");
const __1 = require("..");
const types_1 = require("./types");
const noble_ecc_1 = require("../noble_ecc");
const taproot_1 = require("../taproot");
var chains_1 = require("./wallet/chains");
Object.defineProperty(exports, "scriptTypeForChain", { enumerable: true, get: function () { return chains_1.scriptTypeForChain; } });
exports.scriptTypeP2shP2pk = 'p2shP2pk';
exports.scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2'];
function isScriptType2Of3(t) {
    return exports.scriptTypes2Of3.includes(t);
}
exports.isScriptType2Of3 = isScriptType2Of3;
/**
 * @return true iff scriptType requires witness data
 */
function hasWitnessData(scriptType) {
    return ['p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2'].includes(scriptType);
}
exports.hasWitnessData = hasWitnessData;
/**
 * @param network
 * @param scriptType
 * @return true iff script type is supported for network
 */
function isSupportedScriptType(network, scriptType) {
    switch (scriptType) {
        case 'p2sh':
        case 'p2shP2pk':
            return true;
        case 'p2shP2wsh':
        case 'p2wsh':
            return (0, __1.supportsSegwit)(network);
        case 'p2tr':
        case 'p2trMusig2':
            return (0, __1.supportsTaproot)(network);
    }
    /* istanbul ignore next */
    throw new Error(`unexpected script type ${scriptType}`);
}
exports.isSupportedScriptType = isSupportedScriptType;
/**
 * @param t
 * @return string prevOut as defined in PREVOUT_TYPES (bitcoinjs-lib/.../transaction_builder.js)
 */
function scriptType2Of3AsPrevOutType(t) {
    switch (t) {
        case 'p2sh':
            return 'p2sh-p2ms';
        case 'p2shP2wsh':
            return 'p2sh-p2wsh-p2ms';
        case 'p2wsh':
            return 'p2wsh-p2ms';
        case 'p2tr':
            return 'p2tr-p2ns';
        case 'p2trMusig2':
            return 'p2tr';
    }
    /* istanbul ignore next */
    throw new Error(`unsupported script type ${t}`);
}
exports.scriptType2Of3AsPrevOutType = scriptType2Of3AsPrevOutType;
/**
 * Return scripts for p2sh-p2pk (used for BCH/BSV replay protection)
 * @param pubkey
 */
function createOutputScriptP2shP2pk(pubkey) {
    const p2pk = bitcoinjs.payments.p2pk({ pubkey });
    const p2sh = bitcoinjs.payments.p2sh({ redeem: p2pk });
    if (!p2sh.output || !p2pk.output) {
        throw new Error(`invalid state`);
    }
    return {
        scriptPubKey: p2sh.output,
        redeemScript: p2pk.output,
    };
}
exports.createOutputScriptP2shP2pk = createOutputScriptP2shP2pk;
function getOutputScript(scriptType, conditionScript) {
    let output;
    switch (scriptType) {
        case 'p2sh':
            ({ output } = bitcoinjs.payments.p2sh({ redeem: { output: conditionScript } }));
            break;
        case 'p2shP2wsh':
            ({ output } = bitcoinjs.payments.p2sh({
                redeem: { output: getOutputScript('p2wsh', conditionScript) },
            }));
            break;
        case 'p2wsh':
            ({ output } = bitcoinjs.payments.p2wsh({ redeem: { output: conditionScript } }));
            break;
    }
    if (output === undefined) {
        throw new Error(`output undefined`);
    }
    return output;
}
exports.getOutputScript = getOutputScript;
/**
 * Return scripts for 2-of-3 multisig output
 * @param pubkeys - the key triple for multisig
 * @param scriptType
 * @param network - if set, performs sanity check for scriptType support
 * @returns {{redeemScript, witnessScript, scriptPubKey}}
 */
function createOutputScript2of3(pubkeys, scriptType, network) {
    if (network) {
        if (!isSupportedScriptType(network, scriptType)) {
            throw new Error(`unsupported script type ${scriptType} for network`);
        }
    }
    if (!(0, types_1.isTriple)(pubkeys)) {
        throw new Error(`must provide pubkey triple`);
    }
    pubkeys.forEach((key) => {
        if (key.length !== 33) {
            throw new Error(`Unexpected key length ${key.length}. Must use compressed keys.`);
        }
    });
    if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
        // p2tr/p2trMusig2 addresses use a combination of 2 of 2 multisig scripts distinct from
        // the 2 of 3 multisig used for other script types
        return createTaprootScript2of3(scriptType, pubkeys);
    }
    const script2of3 = bitcoinjs.payments.p2ms({ m: 2, pubkeys });
    assert(script2of3.output);
    let redeemScript;
    let witnessScript;
    switch (scriptType) {
        case 'p2sh':
            redeemScript = script2of3;
            break;
        case 'p2shP2wsh':
            witnessScript = script2of3;
            redeemScript = bitcoinjs.payments.p2wsh({ redeem: script2of3 });
            break;
        case 'p2wsh':
            witnessScript = script2of3;
            break;
        default:
            throw new Error(`unknown multisig script type ${scriptType}`);
    }
    return {
        scriptPubKey: getOutputScript(scriptType, script2of3.output),
        redeemScript: redeemScript === null || redeemScript === void 0 ? void 0 : redeemScript.output,
        witnessScript: witnessScript === null || witnessScript === void 0 ? void 0 : witnessScript.output,
    };
}
exports.createOutputScript2of3 = createOutputScript2of3;
function toXOnlyPublicKey(b) {
    if (b.length === 33) {
        return b.slice(1);
    }
    if (b.length === 32) {
        return b;
    }
    throw new Error(`invalid key size ${b.length}`);
}
exports.toXOnlyPublicKey = toXOnlyPublicKey;
function checkSize(b, targetSize, name) {
    if (b.length === targetSize) {
        return b;
    }
    throw new Error(`invalid size ${b.length}. Must use ${name}.`);
}
/**
 * Validates size of the pub key for 32 bytes and returns the same iff true.
 */
function checkXOnlyPublicKey(b) {
    return checkSize(b, 32, 'x-only key');
}
exports.checkXOnlyPublicKey = checkXOnlyPublicKey;
/**
 * Validates size of the pub key for 32 bytes and returns the same iff true.
 */
function checkPlainPublicKey(b) {
    return checkSize(b, 33, 'plain key');
}
exports.checkPlainPublicKey = checkPlainPublicKey;
function checkTapMerkleRoot(b) {
    return checkSize(b, 32, 'tap merkle root');
}
exports.checkTapMerkleRoot = checkTapMerkleRoot;
function checkTxHash(b) {
    return checkSize(b, 32, 'tx hash');
}
exports.checkTxHash = checkTxHash;
function getTaptreeKeyCombinations(scriptType, keys) {
    const [userKey, backupKey, bitGoKey] = keys.map((k) => toXOnlyPublicKey(k));
    return scriptType === 'p2tr'
        ? [
            [userKey, bitGoKey],
            [userKey, backupKey],
            [backupKey, bitGoKey],
        ]
        : [
            [userKey, backupKey],
            [backupKey, bitGoKey],
        ];
}
function getKeyPathCombination(scriptType, keys) {
    const sanitizePublicKey = scriptType === 'p2tr' ? toXOnlyPublicKey : checkPlainPublicKey;
    return [sanitizePublicKey(keys[0]), sanitizePublicKey(keys[2])];
}
function getRedeemIndex(keyCombinations, signer, cosigner) {
    signer = toXOnlyPublicKey(signer);
    cosigner = toXOnlyPublicKey(cosigner);
    const i = keyCombinations.findIndex(([a, b]) => {
        if (a.length !== signer.length || b.length !== cosigner.length) {
            throw new Error(`invalid comparison`);
        }
        return (a.equals(signer) && b.equals(cosigner)) || (a.equals(cosigner) && b.equals(signer));
    });
    if (0 <= i) {
        return i;
    }
    throw new Error(`could not find singer/cosigner combination`);
}
function createPaymentP2trCommon(scriptType, pubkeys, redeemIndex) {
    const keyCombinations2of2 = getTaptreeKeyCombinations(scriptType, pubkeys);
    if (typeof redeemIndex === 'object') {
        redeemIndex = getRedeemIndex(keyCombinations2of2, redeemIndex.signer, redeemIndex.cosigner);
    }
    const redeems = keyCombinations2of2.map((pubkeys, index) => __1.p2trPayments.p2tr_ns({
        pubkeys,
        depth: scriptType === 'p2trMusig2' || index === 0 ? 1 : 2,
    }, { eccLib: noble_ecc_1.ecc }));
    return __1.p2trPayments.p2tr({
        pubkeys: getKeyPathCombination(scriptType, pubkeys),
        redeems,
        redeemIndex,
    }, { eccLib: noble_ecc_1.ecc });
}
function createPaymentP2tr(pubkeys, redeemIndex) {
    return createPaymentP2trCommon('p2tr', pubkeys, redeemIndex);
}
exports.createPaymentP2tr = createPaymentP2tr;
function createPaymentP2trMusig2(pubkeys, redeemIndex) {
    return createPaymentP2trCommon('p2trMusig2', pubkeys, redeemIndex);
}
exports.createPaymentP2trMusig2 = createPaymentP2trMusig2;
function getLeafHashCommon(scriptType, params) {
    if ('publicKeys' in params) {
        params = createPaymentP2trCommon(scriptType, params.publicKeys, params);
    }
    const { output, controlBlock, redeem } = params;
    if (!output || !controlBlock || !redeem || !redeem.output) {
        throw new Error(`invalid state`);
    }
    return __1.taproot.getTapleafHash(noble_ecc_1.ecc, controlBlock, redeem.output);
}
function getLeafHash(params) {
    return getLeafHashCommon('p2tr', params);
}
exports.getLeafHash = getLeafHash;
function createKeyPathP2trMusig2(pubkeys) {
    const payment = createPaymentP2trCommon('p2trMusig2', pubkeys);
    assert(payment.internalPubkey);
    assert(payment.tapTree);
    return {
        internalPubkey: payment.internalPubkey,
        outputPubkey: (0, taproot_1.getTweakedOutputKey)(payment),
        taptreeRoot: (0, taproot_1.getDepthFirstTaptree)(payment.tapTree).root,
    };
}
exports.createKeyPathP2trMusig2 = createKeyPathP2trMusig2;
function createSpendScriptP2trCommon(scriptType, pubkeys, keyCombination) {
    const keyCombinations = getTaptreeKeyCombinations(scriptType, pubkeys);
    const [a, b] = keyCombination.map((k) => toXOnlyPublicKey(k));
    const redeemIndex = keyCombinations.findIndex(([c, d]) => (a.equals(c) && b.equals(d)) || (a.equals(d) && b.equals(c)));
    if (redeemIndex < 0) {
        throw new Error(`could not find redeemIndex for key combination`);
    }
    const payment = createPaymentP2trCommon(scriptType, pubkeys, redeemIndex);
    const { controlBlock } = payment;
    assert(Buffer.isBuffer(controlBlock));
    assert(payment.redeem);
    const leafScript = payment.redeem.output;
    assert(Buffer.isBuffer(leafScript));
    const parsedControlBlock = __1.taproot.parseControlBlock(noble_ecc_1.ecc, controlBlock);
    const { leafVersion } = parsedControlBlock;
    const leafHash = __1.taproot.getTapleafHash(noble_ecc_1.ecc, parsedControlBlock, leafScript);
    return {
        controlBlock,
        witnessScript: leafScript,
        leafVersion,
        leafHash,
    };
}
function createSpendScriptP2tr(pubkeys, keyCombination) {
    return createSpendScriptP2trCommon('p2tr', pubkeys, keyCombination);
}
exports.createSpendScriptP2tr = createSpendScriptP2tr;
function createSpendScriptP2trMusig2(pubkeys, keyCombination) {
    return createSpendScriptP2trCommon('p2trMusig2', pubkeys, keyCombination);
}
exports.createSpendScriptP2trMusig2 = createSpendScriptP2trMusig2;
/**
 * Creates and returns a taproot output script using the user+bitgo keys for the aggregate
 * public key using MuSig2 and a taptree containing either of the following depends on scriptType.
 * p2tr type: a user+bitgo 2-of-2 script at the first depth level of the tree and user+backup
 * and bitgo+backup 2-of-2 scripts one level deeper.
 * p2trMusig2 type: user+backup and bitgo+backup 2-of-2 scripts at the first depth level of the
 * tree.
 * @param pubkeys - a pubkey array containing the user key, backup key, and bitgo key in that order
 * @returns {{scriptPubKey}}
 */
function createTaprootScript2of3(scriptType, pubkeys) {
    const { output } = createPaymentP2trCommon(scriptType, pubkeys);
    assert(Buffer.isBuffer(output));
    return {
        scriptPubKey: output,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0U2NyaXB0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaXRnby9vdXRwdXRTY3JpcHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUFpQztBQUNqQywyQ0FBMkM7QUFFM0MsMEJBQXFGO0FBRXJGLG1DQUFrRDtBQUVsRCw0Q0FBNkM7QUFDN0Msd0NBQXVFO0FBRXZFLDBDQUFxRDtBQUE1Qyw0R0FBQSxrQkFBa0IsT0FBQTtBQUVkLFFBQUEsa0JBQWtCLEdBQUcsVUFBVSxDQUFDO0FBR2hDLFFBQUEsZUFBZSxHQUFHLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBVSxDQUFDO0FBRzdGLFNBQWdCLGdCQUFnQixDQUFDLENBQVM7SUFDeEMsT0FBTyx1QkFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFtQixDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUZELDRDQUVDO0FBSUQ7O0dBRUc7QUFDSCxTQUFnQixjQUFjLENBQUMsVUFBc0I7SUFDbkQsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBRkQsd0NBRUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IscUJBQXFCLENBQUMsT0FBZ0IsRUFBRSxVQUFzQjtJQUM1RSxRQUFRLFVBQVUsRUFBRTtRQUNsQixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDO1FBQ2QsS0FBSyxXQUFXLENBQUM7UUFDakIsS0FBSyxPQUFPO1lBQ1YsT0FBTyxJQUFBLGtCQUFjLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDakMsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLFlBQVk7WUFDZixPQUFPLElBQUEsbUJBQWUsRUFBQyxPQUFPLENBQUMsQ0FBQztLQUNuQztJQUVELDBC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QU8sMkJBQTJCLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztBQUM1RSxDQUFDO0FBRkQsa0VBRUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFVBQWlDLEVBQUUsT0FBdUI7SUFDekYsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNoRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE9BQU87UUFDTCxZQUFZLEVBQUUsTUFBTTtLQUNyQixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgKiBhcyBiaXRjb2luanMgZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcblxyXG5pbXBvcnQgeyBOZXR3b3JrLCBwMnRyUGF5bWVudHMsIHN1cHBvcnRzU2Vnd2l0LCBzdXBwb3J0c1RhcHJvb3QsIHRhcHJvb3QgfSBmcm9tICcuLic7XHJcblxyXG5pbXBvcnQgeyBpc1RyaXBsZSwgVHJpcGxlLCBUdXBsZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgZWNjIGFzIGVjY0xpYiB9IGZyb20gJy4uL25vYmxlX2VjYyc7XHJcbmltcG9ydCB7IGdldERlcHRoRmlyc3RUYXB0cmVlLCBnZXRUd2Vha2VkT3V0cHV0S2V5IH0gZnJvbSAnLi4vdGFwcm9vdCc7XHJcblxyXG5leHBvcnQgeyBzY3JpcHRUeXBlRm9yQ2hhaW4gfSBmcm9tICcuL3dhbGxldC9jaGFpbnMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHNjcmlwdFR5cGVQMnNoUDJwayA9ICdwMnNoUDJwayc7XHJcbmV4cG9ydCB0eXBlIFNjcmlwdFR5cGVQMnNoUDJwayA9IHR5cGVvZiBzY3JpcHRUeXBlUDJzaFAycGs7XHJcblxyXG5leHBvcnQgY29uc3Qgc2NyaXB0VHlwZXMyT2YzID0gWydwMnNoJywgJ3Ayc2hQMndzaCcsICdwMndzaCcsICdwMnRyJywgJ3AydHJNdXNpZzInXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgU2NyaXB0VHlwZTJPZjMgPSAodHlwZW9mIHNjcmlwdFR5cGVzMk9mMylbbnVtYmVyXTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NjcmlwdFR5cGUyT2YzKHQ6IHN0cmluZyk6IHQgaXMgU2NyaXB0VHlwZTJPZjMge1xyXG4gIHJldHVybiBzY3JpcHRUeXBlczJPZjMuaW5jbHVkZXModCBhcyBTY3JpcHRUeXBlMk9mMyk7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFNjcmlwdFR5cGUgPSBTY3JpcHRUeXBlUDJzaFAycGsgfCBTY3JpcHRUeXBlMk9mMztcclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIHRydWUgaWZmIHNjcmlwdFR5cGUgcmVxdWlyZXMgd2l0bmVzcyBkYXRhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaGFzV2l0bmVzc0RhdGEoc2NyaXB0VHlwZTogU2NyaXB0VHlwZSk6IHNjcmlwdFR5cGUgaXMgJ3Ayc2hQMndzaCcgfCAncDJ3c2gnIHwgJ3AydHInIHwgJ3AydHJNdXNpZzInIHtcclxuICByZXR1cm4gWydwMnNoUDJ3c2gnLCAncDJ3c2gnLCAncDJ0cicsICdwMnRyTXVzaWcyJ10uaW5jbHVkZXMoc2NyaXB0VHlwZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gbmV0d29ya1xyXG4gKiBAcGFyYW0gc2NyaXB0VHlwZVxyXG4gKiBAcmV0dXJuIHRydWUgaWZmIHNjcmlwdCB0eXBlIGlzIHN1cHBvcnRlZCBmb3IgbmV0d29ya1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU3VwcG9ydGVkU2NyaXB0VHlwZShuZXR3b3JrOiBOZXR3b3JrLCBzY3JpcHRUeXBlOiBTY3JpcHRUeXBlKTogYm9vbGVhbiB7XHJcbiAgc3dpdGNoIChzY3JpcHRUeXBlKSB7XHJcbiAgICBjYXNlICdwMnNoJzpcclxuICAgIGNhc2UgJ3Ayc2hQMnBrJzpcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICBjYXNlICdwMnNoUDJ3c2gnOlxyXG4gICAgY2FzZSAncDJ3c2gnOlxyXG4gICAgICByZXR1cm4gc3VwcG9ydHNTZWd3aXQobmV0d29yayk7XHJcbiAgICBjYXNlICdwMnRyJzpcclxuICAgIGNhc2UgJ3AydHJNdXNpZzInOlxyXG4gICAgICByZXR1cm4gc3VwcG9ydHNUYXByb290KG5ldHdvcmspO1xyXG4gIH1cclxuXHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICB0aHJvdyBuZXcgRXJyb3IoYHVuZXhwZWN0ZWQgc2NyaXB0IHR5cGUgJHtzY3JpcHRUeXBlfWApO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHRcclxuICogQHJldHVybiBzdHJpbmcgcHJldk91dCBhcyBkZWZpbmVkIGluIFBSRVZPVVRfVFlQRVMgKGJpdGNvaW5qcy1saWIvLi4uL3RyYW5zYWN0aW9uX2J1aWxkZXIuanMpXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2NyaXB0VHlwZTJPZjNBc1ByZXZPdXRUeXBlKHQ6IFNjcmlwdFR5cGUyT2YzKTogc3RyaW5nIHtcclxuICBzd2l0Y2ggKHQpIHtcclxuICAgIGNhc2UgJ3Ayc2gnOlxyXG4gICAgICByZXR1cm4gJ3Ayc2gtcDJtcyc7XHJcbiAgICBjYXNlICdwMnNoUDJ3c2gnOlxyXG4gICAgICByZXR1cm4gJ3Ayc2gtcDJ3c2gtcDJtcyc7XHJcbiAgICBjYXNlICdwMndzaCc6XHJcbiAgICAgIHJldHVybiAncDJ3c2gtcDJtcyc7XHJcbiAgICBjYXNlICdwMnRyJzpcclxuICAgICAgcmV0dXJuICdwMnRyLXAybnMnO1xyXG4gICAgY2FzZSAncDJ0ck11c2lnMic6XHJcbiAgICAgIHJldHVybiAncDJ0cic7XHJcbiAgfVxyXG5cclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgc2NyaXB0IHR5cGUgJHt0fWApO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBTcGVuZGFibGVTY3JpcHQgPSB7XHJcbiAgc2NyaXB0UHViS2V5OiBCdWZmZXI7XHJcbiAgcmVkZWVtU2NyaXB0PzogQnVmZmVyO1xyXG4gIHdpdG5lc3NTY3JpcHQ/OiBCdWZmZXI7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBTcGVuZFNjcmlwdFAydHIgPSB7XHJcbiAgY29udHJvbEJsb2NrOiBCdWZmZXI7XHJcbiAgd2l0bmVzc1NjcmlwdDogQnVmZmVyO1xyXG4gIGxlYWZWZXJzaW9uOiBudW1iZXI7XHJcbiAgbGVhZkhhc2g6IEJ1ZmZlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUd2VhayBkYXRhIGhvbGRlciBmb3IgUDJ0ciBNdXNpZzIga2V5IHBhdGguXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBLZXlQYXRoUDJ0ck11c2lnMiA9IHtcclxuICBpbnRlcm5hbFB1YmtleTogQnVmZmVyO1xyXG4gIG91dHB1dFB1YmtleTogQnVmZmVyO1xyXG4gIHRhcHRyZWVSb290OiBCdWZmZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuIHNjcmlwdHMgZm9yIHAyc2gtcDJwayAodXNlZCBmb3IgQkNIL0JTViByZXBsYXkgcHJvdGVjdGlvbilcclxuICogQHBhcmFtIHB1YmtleVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU91dHB1dFNjcmlwdFAyc2hQMnBrKHB1YmtleTogQnVmZmVyKTogU3BlbmRhYmxlU2NyaXB0IHtcclxuICBjb25zdCBwMnBrID0gYml0Y29pbmpzLnBheW1lbnRzLnAycGsoeyBwdWJrZXkgfSk7XHJcbiAgY29uc3QgcDJzaCA9IGJpdGNvaW5qcy5wYXltZW50cy5wMnNoKHsgcmVkZWVtOiBwMnBrIH0pO1xyXG4gIGlmICghcDJzaC5vdXRwdXQgfHwgIXAycGsub3V0cHV0KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgc3RhdGVgKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHNjcmlwdFB1YktleTogcDJzaC5vdXRwdXQsXHJcbiAgICByZWRlZW1TY3JpcHQ6IHAycGsub3V0cHV0LFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRPdXRwdXRTY3JpcHQoc2NyaXB0VHlwZTogJ3Ayc2gnIHwgJ3Ayc2hQMndzaCcgfCAncDJ3c2gnLCBjb25kaXRpb25TY3JpcHQ6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgbGV0IG91dHB1dDtcclxuICBzd2l0Y2ggKHNjcmlwdFR5cGUpIHtcclxuICAgIGNhc2UgJ3Ayc2gnOlxyXG4gICAgICAoeyBvdXRwdXQgfSA9IGJpdGNvaW5qcy5wYXltZW50cy5wMnNoKHsgcmVkZWVtOiB7IG91dHB1dDogY29uZGl0aW9uU2NyaXB0IH0gfSkpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3Ayc2hQMndzaCc6XHJcbiAgICAgICh7IG91dHB1dCB9ID0gYml0Y29pbmpzLnBheW1lbnRzLnAyc2goe1xyXG4gICAgICAgIHJlZGVlbTogeyBvdXRwdXQ6IGdldE91dHB1dFNjcmlwdCgncDJ3c2gnLCBjb25kaXRpb25TY3JpcHQpIH0sXHJcbiAgICAgIH0pKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdwMndzaCc6XHJcbiAgICAgICh7IG91dHB1dCB9ID0gYml0Y29pbmpzLnBheW1lbnRzLnAyd3NoKHsgcmVkZWVtOiB7IG91dHB1dDogY29uZGl0aW9uU2NyaXB0IH0gfSkpO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbiAgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG91dHB1dCB1bmRlZmluZWRgKTtcclxuICB9XHJcbiAgcmV0dXJuIG91dHB1dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybiBzY3JpcHRzIGZvciAyLW9mLTMgbXVsdGlzaWcgb3V0cHV0XHJcbiAqIEBwYXJhbSBwdWJrZXlzIC0gdGhlIGtleSB0cmlwbGUgZm9yIG11bHRpc2lnXHJcbiAqIEBwYXJhbSBzY3JpcHRUeXBlXHJcbiAqIEBwYXJhbSBuZXR3b3JrIC0gaWYgc2V0LCBwZXJmb3JtcyBzYW5pdHkgY2hlY2sgZm9yIHNjcmlwdFR5cGUgc3VwcG9ydFxyXG4gKiBAcmV0dXJucyB7e3JlZGVlbVNjcmlwdCwgd2l0bmVzc1NjcmlwdCwgc2NyaXB0UHViS2V5fX1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVPdXRwdXRTY3JpcHQyb2YzKFxyXG4gIHB1YmtleXM6IEJ1ZmZlcltdLFxyXG4gIHNjcmlwdFR5cGU6IFNjcmlwdFR5cGUyT2YzLFxyXG4gIG5ldHdvcms/OiBOZXR3b3JrXHJcbik6IFNwZW5kYWJsZVNjcmlwdCB7XHJcbiAgaWYgKG5ldHdvcmspIHtcclxuICAgIGlmICghaXNTdXBwb3J0ZWRTY3JpcHRUeXBlKG5ldHdvcmssIHNjcmlwdFR5cGUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgc2NyaXB0IHR5cGUgJHtzY3JpcHRUeXBlfSBmb3IgbmV0d29ya2ApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKCFpc1RyaXBsZShwdWJrZXlzKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgcHVia2V5IHRyaXBsZWApO1xyXG4gIH1cclxuXHJcbiAgcHVia2V5cy5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgIGlmIChrZXkubGVuZ3RoICE9PSAzMykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQga2V5IGxlbmd0aCAke2tleS5sZW5ndGh9LiBNdXN0IHVzZSBjb21wcmVzc2VkIGtleXMuYCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGlmIChzY3JpcHRUeXBlID09PSAncDJ0cicgfHwgc2NyaXB0VHlwZSA9PT0gJ3AydHJNdXNpZzInKSB7XHJcbiAgICAvLyBwMnRyL3AydHJNdXNpZzIgYWRkcmVzc2VzIHVzZSBhIGNvbWJpbmF0aW9uIG9mIDIgb2YgMiBtdWx0aXNpZyBzY3JpcHRzIGRpc3RpbmN0IGZyb21cclxuICAgIC8vIHRoZSAyIG9mIDMgbXVsdGlzaWcgdXNlZCBmb3Igb3RoZXIgc2NyaXB0IHR5cGVzXHJcbiAgICByZXR1cm4gY3JlYXRlVGFwcm9vdFNjcmlwdDJvZjMoc2NyaXB0VHlwZSwgcHVia2V5cyk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzY3JpcHQyb2YzID0gYml0Y29pbmpzLnBheW1lbnRzLnAybXMoeyBtOiAyLCBwdWJrZXlzIH0pO1xyXG4gIGFzc2VydChzY3JpcHQyb2YzLm91dHB1dCk7XHJcblxyXG4gIGxldCByZWRlZW1TY3JpcHQ6IGJpdGNvaW5qcy5QYXltZW50IHwgdW5kZWZpbmVkO1xyXG4gIGxldCB3aXRuZXNzU2NyaXB0OiBiaXRjb2luanMuUGF5bWVudCB8IHVuZGVmaW5lZDtcclxuICBzd2l0Y2ggKHNjcmlwdFR5cGUpIHtcclxuICAgIGNhc2UgJ3Ayc2gnOlxyXG4gICAgICByZWRlZW1TY3JpcHQgPSBzY3JpcHQyb2YzO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3Ayc2hQMndzaCc6XHJcbiAgICAgIHdpdG5lc3NTY3JpcHQgPSBzY3JpcHQyb2YzO1xyXG4gICAgICByZWRlZW1TY3JpcHQgPSBiaXRjb2luanMucGF5bWVudHMucDJ3c2goeyByZWRlZW06IHNjcmlwdDJvZjMgfSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAncDJ3c2gnOlxyXG4gICAgICB3aXRuZXNzU2NyaXB0ID0gc2NyaXB0Mm9mMztcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gbXVsdGlzaWcgc2NyaXB0IHR5cGUgJHtzY3JpcHRUeXBlfWApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHNjcmlwdFB1YktleTogZ2V0T3V0cHV0U2NyaXB0KHNjcmlwdFR5cGUsIHNjcmlwdDJvZjMub3V0cHV0KSxcclxuICAgIHJlZGVlbVNjcmlwdDogcmVkZWVtU2NyaXB0Py5vdXRwdXQsXHJcbiAgICB3aXRuZXNzU2NyaXB0OiB3aXRuZXNzU2NyaXB0Py5vdXRwdXQsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvWE9ubHlQdWJsaWNLZXkoYjogQnVmZmVyKTogQnVmZmVyIHtcclxuICBpZiAoYi5sZW5ndGggPT09IDMzKSB7XHJcbiAgICByZXR1cm4gYi5zbGljZSgxKTtcclxuICB9XHJcbiAgaWYgKGIubGVuZ3RoID09PSAzMikge1xyXG4gICAgcmV0dXJuIGI7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBrZXkgc2l6ZSAke2IubGVuZ3RofWApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja1NpemUoYjogQnVmZmVyLCB0YXJnZXRTaXplOiBudW1iZXIsIG5hbWU6IHN0cmluZyk6IEJ1ZmZlciB7XHJcbiAgaWYgKGIubGVuZ3RoID09PSB0YXJnZXRTaXplKSB7XHJcbiAgICByZXR1cm4gYjtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHNpemUgJHtiLmxlbmd0aH0uIE11c3QgdXNlICR7bmFtZX0uYCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgc2l6ZSBvZiB0aGUgcHViIGtleSBmb3IgMzIgYnl0ZXMgYW5kIHJldHVybnMgdGhlIHNhbWUgaWZmIHRydWUuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tYT25seVB1YmxpY0tleShiOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gIHJldHVybiBjaGVja1NpemUoYiwgMzIsICd4LW9ubHkga2V5Jyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgc2l6ZSBvZiB0aGUgcHViIGtleSBmb3IgMzIgYnl0ZXMgYW5kIHJldHVybnMgdGhlIHNhbWUgaWZmIHRydWUuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tQbGFpblB1YmxpY0tleShiOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gIHJldHVybiBjaGVja1NpemUoYiwgMzMsICdwbGFpbiBrZXknKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVGFwTWVya2xlUm9vdChiOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gIHJldHVybiBjaGVja1NpemUoYiwgMzIsICd0YXAgbWVya2xlIHJvb3QnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVHhIYXNoKGI6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgcmV0dXJuIGNoZWNrU2l6ZShiLCAzMiwgJ3R4IGhhc2gnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VGFwdHJlZUtleUNvbWJpbmF0aW9ucyhzY3JpcHRUeXBlOiAncDJ0cicgfCAncDJ0ck11c2lnMicsIGtleXM6IFRyaXBsZTxCdWZmZXI+KTogVHVwbGU8QnVmZmVyPltdIHtcclxuICBjb25zdCBbdXNlcktleSwgYmFja3VwS2V5LCBiaXRHb0tleV0gPSBrZXlzLm1hcCgoaykgPT4gdG9YT25seVB1YmxpY0tleShrKSk7XHJcbiAgcmV0dXJuIHNjcmlwdFR5cGUgPT09ICdwMnRyJ1xyXG4gICAgPyBbXHJcbiAgICAgICAgW3VzZXJLZXksIGJpdEdvS2V5XSxcclxuICAgICAgICBbdXNlcktleSwgYmFja3VwS2V5XSxcclxuICAgICAgICBbYmFja3VwS2V5LCBiaXRHb0tleV0sXHJcbiAgICAgIF1cclxuICAgIDogW1xyXG4gICAgICAgIFt1c2VyS2V5LCBiYWNrdXBLZXldLFxyXG4gICAgICAgIFtiYWNrdXBLZXksIGJpdEdvS2V5XSxcclxuICAgICAgXTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0S2V5UGF0aENvbWJpbmF0aW9uKHNjcmlwdFR5cGU6ICdwMnRyJyB8ICdwMnRyTXVzaWcyJywga2V5czogVHJpcGxlPEJ1ZmZlcj4pOiBUdXBsZTxCdWZmZXI+IHtcclxuICBjb25zdCBzYW5pdGl6ZVB1YmxpY0tleSA9IHNjcmlwdFR5cGUgPT09ICdwMnRyJyA/IHRvWE9ubHlQdWJsaWNLZXkgOiBjaGVja1BsYWluUHVibGljS2V5O1xyXG4gIHJldHVybiBbc2FuaXRpemVQdWJsaWNLZXkoa2V5c1swXSksIHNhbml0aXplUHVibGljS2V5KGtleXNbMl0pXTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UmVkZWVtSW5kZXgoa2V5Q29tYmluYXRpb25zOiBbQnVmZmVyLCBCdWZmZXJdW10sIHNpZ25lcjogQnVmZmVyLCBjb3NpZ25lcjogQnVmZmVyKTogbnVtYmVyIHtcclxuICBzaWduZXIgPSB0b1hPbmx5UHVibGljS2V5KHNpZ25lcik7XHJcbiAgY29zaWduZXIgPSB0b1hPbmx5UHVibGljS2V5KGNvc2lnbmVyKTtcclxuICBjb25zdCBpID0ga2V5Q29tYmluYXRpb25zLmZpbmRJbmRleCgoW2EsIGJdKSA9PiB7XHJcbiAgICBpZiAoYS5sZW5ndGggIT09IHNpZ25lci5sZW5ndGggfHwgYi5sZW5ndGggIT09IGNvc2lnbmVyLmxlbmd0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgY29tcGFyaXNvbmApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIChhLmVxdWFscyhzaWduZXIpICYmIGIuZXF1YWxzKGNvc2lnbmVyKSkgfHwgKGEuZXF1YWxzKGNvc2lnbmVyKSAmJiBiLmVxdWFscyhzaWduZXIpKTtcclxuICB9KTtcclxuICBpZiAoMCA8PSBpKSB7XHJcbiAgICByZXR1cm4gaTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmluZCBzaW5nZXIvY29zaWduZXIgY29tYmluYXRpb25gKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGF5bWVudFAydHJDb21tb24oXHJcbiAgc2NyaXB0VHlwZTogJ3AydHInIHwgJ3AydHJNdXNpZzInLFxyXG4gIHB1YmtleXM6IFRyaXBsZTxCdWZmZXI+LFxyXG4gIHJlZGVlbUluZGV4PzogbnVtYmVyIHwgeyBzaWduZXI6IEJ1ZmZlcjsgY29zaWduZXI6IEJ1ZmZlciB9XHJcbik6IGJpdGNvaW5qcy5QYXltZW50IHtcclxuICBjb25zdCBrZXlDb21iaW5hdGlvbnMyb2YyID0gZ2V0VGFwdHJlZUtleUNvbWJpbmF0aW9ucyhzY3JpcHRUeXBlLCBwdWJrZXlzKTtcclxuICBpZiAodHlwZW9mIHJlZGVlbUluZGV4ID09PSAnb2JqZWN0Jykge1xyXG4gICAgcmVkZWVtSW5kZXggPSBnZXRSZWRlZW1JbmRleChrZXlDb21iaW5hdGlvbnMyb2YyLCByZWRlZW1JbmRleC5zaWduZXIsIHJlZGVlbUluZGV4LmNvc2lnbmVyKTtcclxuICB9XHJcbiAgY29uc3QgcmVkZWVtcyA9IGtleUNvbWJpbmF0aW9uczJvZjIubWFwKChwdWJrZXlzLCBpbmRleCkgPT5cclxuICAgIHAydHJQYXltZW50cy5wMnRyX25zKFxyXG4gICAgICB7XHJcbiAgICAgICAgcHVia2V5cyxcclxuICAgICAgICBkZXB0aDogc2NyaXB0VHlwZSA9PT0gJ3AydHJNdXNpZzInIHx8IGluZGV4ID09PSAwID8gMSA6IDIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHsgZWNjTGliIH1cclxuICAgIClcclxuICApO1xyXG5cclxuICByZXR1cm4gcDJ0clBheW1lbnRzLnAydHIoXHJcbiAgICB7XHJcbiAgICAgIHB1YmtleXM6IGdldEtleVBhdGhDb21iaW5hdGlvbihzY3JpcHRUeXBlLCBwdWJrZXlzKSxcclxuICAgICAgcmVkZWVtcyxcclxuICAgICAgcmVkZWVtSW5kZXgsXHJcbiAgICB9LFxyXG4gICAgeyBlY2NMaWIgfVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYXltZW50UDJ0cihcclxuICBwdWJrZXlzOiBUcmlwbGU8QnVmZmVyPixcclxuICByZWRlZW1JbmRleD86IG51bWJlciB8IHsgc2lnbmVyOiBCdWZmZXI7IGNvc2lnbmVyOiBCdWZmZXIgfVxyXG4pOiBiaXRjb2luanMuUGF5bWVudCB7XHJcbiAgcmV0dXJuIGNyZWF0ZVBheW1lbnRQMnRyQ29tbW9uKCdwMnRyJywgcHVia2V5cywgcmVkZWVtSW5kZXgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGF5bWVudFAydHJNdXNpZzIoXHJcbiAgcHVia2V5czogVHJpcGxlPEJ1ZmZlcj4sXHJcbiAgcmVkZWVtSW5kZXg/OiBudW1iZXIgfCB7IHNpZ25lcjogQnVmZmVyOyBjb3NpZ25lcjogQnVmZmVyIH1cclxuKTogYml0Y29pbmpzLlBheW1lbnQge1xyXG4gIHJldHVybiBjcmVhdGVQYXltZW50UDJ0ckNvbW1vbigncDJ0ck11c2lnMicsIHB1YmtleXMsIHJlZGVlbUluZGV4KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGVhZkhhc2hDb21tb24oXHJcbiAgc2NyaXB0VHlwZTogJ3AydHInIHwgJ3AydHJNdXNpZzInLFxyXG4gIHBhcmFtczogYml0Y29pbmpzLlBheW1lbnQgfCB7IHB1YmxpY0tleXM6IFRyaXBsZTxCdWZmZXI+OyBzaWduZXI6IEJ1ZmZlcjsgY29zaWduZXI6IEJ1ZmZlciB9XHJcbik6IEJ1ZmZlciB7XHJcbiAgaWYgKCdwdWJsaWNLZXlzJyBpbiBwYXJhbXMpIHtcclxuICAgIHBhcmFtcyA9IGNyZWF0ZVBheW1lbnRQMnRyQ29tbW9uKHNjcmlwdFR5cGUsIHBhcmFtcy5wdWJsaWNLZXlzLCBwYXJhbXMpO1xyXG4gIH1cclxuICBjb25zdCB7IG91dHB1dCwgY29udHJvbEJsb2NrLCByZWRlZW0gfSA9IHBhcmFtcztcclxuICBpZiAoIW91dHB1dCB8fCAhY29udHJvbEJsb2NrIHx8ICFyZWRlZW0gfHwgIXJlZGVlbS5vdXRwdXQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzdGF0ZWApO1xyXG4gIH1cclxuICByZXR1cm4gdGFwcm9vdC5nZXRUYXBsZWFmSGFzaChlY2NMaWIsIGNvbnRyb2xCbG9jaywgcmVkZWVtLm91dHB1dCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMZWFmSGFzaChcclxuICBwYXJhbXM6IGJpdGNvaW5qcy5QYXltZW50IHwgeyBwdWJsaWNLZXlzOiBUcmlwbGU8QnVmZmVyPjsgc2lnbmVyOiBCdWZmZXI7IGNvc2lnbmVyOiBCdWZmZXIgfVxyXG4pOiBCdWZmZXIge1xyXG4gIHJldHVybiBnZXRMZWFmSGFzaENvbW1vbigncDJ0cicsIHBhcmFtcyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLZXlQYXRoUDJ0ck11c2lnMihwdWJrZXlzOiBUcmlwbGU8QnVmZmVyPik6IEtleVBhdGhQMnRyTXVzaWcyIHtcclxuICBjb25zdCBwYXltZW50ID0gY3JlYXRlUGF5bWVudFAydHJDb21tb24oJ3AydHJNdXNpZzInLCBwdWJrZXlzKTtcclxuICBhc3NlcnQocGF5bWVudC5pbnRlcm5hbFB1YmtleSk7XHJcbiAgYXNzZXJ0KHBheW1lbnQudGFwVHJlZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIGludGVybmFsUHVia2V5OiBwYXltZW50LmludGVybmFsUHVia2V5LFxyXG4gICAgb3V0cHV0UHVia2V5OiBnZXRUd2Vha2VkT3V0cHV0S2V5KHBheW1lbnQpLFxyXG4gICAgdGFwdHJlZVJvb3Q6IGdldERlcHRoRmlyc3RUYXB0cmVlKHBheW1lbnQudGFwVHJlZSkucm9vdCxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVTcGVuZFNjcmlwdFAydHJDb21tb24oXHJcbiAgc2NyaXB0VHlwZTogJ3AydHInIHwgJ3AydHJNdXNpZzInLFxyXG4gIHB1YmtleXM6IFRyaXBsZTxCdWZmZXI+LFxyXG4gIGtleUNvbWJpbmF0aW9uOiBUdXBsZTxCdWZmZXI+XHJcbik6IFNwZW5kU2NyaXB0UDJ0ciB7XHJcbiAgY29uc3Qga2V5Q29tYmluYXRpb25zID0gZ2V0VGFwdHJlZUtleUNvbWJpbmF0aW9ucyhzY3JpcHRUeXBlLCBwdWJrZXlzKTtcclxuICBjb25zdCBbYSwgYl0gPSBrZXlDb21iaW5hdGlvbi5tYXAoKGspID0+IHRvWE9ubHlQdWJsaWNLZXkoaykpO1xyXG4gIGNvbnN0IHJlZGVlbUluZGV4ID0ga2V5Q29tYmluYXRpb25zLmZpbmRJbmRleChcclxuICAgIChbYywgZF0pID0+IChhLmVxdWFscyhjKSAmJiBiLmVxdWFscyhkKSkgfHwgKGEuZXF1YWxzKGQpICYmIGIuZXF1YWxzKGMpKVxyXG4gICk7XHJcblxyXG4gIGlmIChyZWRlZW1JbmRleCA8IDApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgY291bGQgbm90IGZpbmQgcmVkZWVtSW5kZXggZm9yIGtleSBjb21iaW5hdGlvbmApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGF5bWVudCA9IGNyZWF0ZVBheW1lbnRQMnRyQ29tbW9uKHNjcmlwdFR5cGUsIHB1YmtleXMsIHJlZGVlbUluZGV4KTtcclxuICBjb25zdCB7IGNvbnRyb2xCbG9jayB9ID0gcGF5bWVudDtcclxuICBhc3NlcnQoQnVmZmVyLmlzQnVmZmVyKGNvbnRyb2xCbG9jaykpO1xyXG5cclxuICBhc3NlcnQocGF5bWVudC5yZWRlZW0pO1xyXG4gIGNvbnN0IGxlYWZTY3JpcHQgPSBwYXltZW50LnJlZGVlbS5vdXRwdXQ7XHJcbiAgYXNzZXJ0KEJ1ZmZlci5pc0J1ZmZlcihsZWFmU2NyaXB0KSk7XHJcblxyXG4gIGNvbnN0IHBhcnNlZENvbnRyb2xCbG9jayA9IHRhcHJvb3QucGFyc2VDb250cm9sQmxvY2soZWNjTGliLCBjb250cm9sQmxvY2spO1xyXG4gIGNvbnN0IHsgbGVhZlZlcnNpb24gfSA9IHBhcnNlZENvbnRyb2xCbG9jaztcclxuICBjb25zdCBsZWFmSGFzaCA9IHRhcHJvb3QuZ2V0VGFwbGVhZkhhc2goZWNjTGliLCBwYXJzZWRDb250cm9sQmxvY2ssIGxlYWZTY3JpcHQpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgY29udHJvbEJsb2NrLFxyXG4gICAgd2l0bmVzc1NjcmlwdDogbGVhZlNjcmlwdCxcclxuICAgIGxlYWZWZXJzaW9uLFxyXG4gICAgbGVhZkhhc2gsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNwZW5kU2NyaXB0UDJ0cihwdWJrZXlzOiBUcmlwbGU8QnVmZmVyPiwga2V5Q29tYmluYXRpb246IFR1cGxlPEJ1ZmZlcj4pOiBTcGVuZFNjcmlwdFAydHIge1xyXG4gIHJldHVybiBjcmVhdGVTcGVuZFNjcmlwdFAydHJDb21tb24oJ3AydHInLCBwdWJrZXlzLCBrZXlDb21iaW5hdGlvbik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTcGVuZFNjcmlwdFAydHJNdXNpZzIocHVia2V5czogVHJpcGxlPEJ1ZmZlcj4sIGtleUNvbWJpbmF0aW9uOiBUdXBsZTxCdWZmZXI+KTogU3BlbmRTY3JpcHRQMnRyIHtcclxuICByZXR1cm4gY3JlYXRlU3BlbmRTY3JpcHRQMnRyQ29tbW9uKCdwMnRyTXVzaWcyJywgcHVia2V5cywga2V5Q29tYmluYXRpb24pO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhIHRhcHJvb3Qgb3V0cHV0IHNjcmlwdCB1c2luZyB0aGUgdXNlcitiaXRnbyBrZXlzIGZvciB0aGUgYWdncmVnYXRlXHJcbiAqIHB1YmxpYyBrZXkgdXNpbmcgTXVTaWcyIGFuZCBhIHRhcHRyZWUgY29udGFpbmluZyBlaXRoZXIgb2YgdGhlIGZvbGxvd2luZyBkZXBlbmRzIG9uIHNjcmlwdFR5cGUuXHJcbiAqIHAydHIgdHlwZTogYSB1c2VyK2JpdGdvIDItb2YtMiBzY3JpcHQgYXQgdGhlIGZpcnN0IGRlcHRoIGxldmVsIG9mIHRoZSB0cmVlIGFuZCB1c2VyK2JhY2t1cFxyXG4gKiBhbmQgYml0Z28rYmFja3VwIDItb2YtMiBzY3JpcHRzIG9uZSBsZXZlbCBkZWVwZXIuXHJcbiAqIHAydHJNdXNpZzIgdHlwZTogdXNlcitiYWNrdXAgYW5kIGJpdGdvK2JhY2t1cCAyLW9mLTIgc2NyaXB0cyBhdCB0aGUgZmlyc3QgZGVwdGggbGV2ZWwgb2YgdGhlXHJcbiAqIHRyZWUuXHJcbiAqIEBwYXJhbSBwdWJrZXlzIC0gYSBwdWJrZXkgYXJyYXkgY29udGFpbmluZyB0aGUgdXNlciBrZXksIGJhY2t1cCBrZXksIGFuZCBiaXRnbyBrZXkgaW4gdGhhdCBvcmRlclxyXG4gKiBAcmV0dXJucyB7e3NjcmlwdFB1YktleX19XHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVUYXByb290U2NyaXB0Mm9mMyhzY3JpcHRUeXBlOiAncDJ0cicgfCAncDJ0ck11c2lnMicsIHB1YmtleXM6IFRyaXBsZTxCdWZmZXI+KTogU3BlbmRhYmxlU2NyaXB0IHtcclxuICBjb25zdCB7IG91dHB1dCB9ID0gY3JlYXRlUGF5bWVudFAydHJDb21tb24oc2NyaXB0VHlwZSwgcHVia2V5cyk7XHJcbiAgYXNzZXJ0KEJ1ZmZlci5pc0J1ZmZlcihvdXRwdXQpKTtcclxuICByZXR1cm4ge1xyXG4gICAgc2NyaXB0UHViS2V5OiBvdXRwdXQsXHJcbiAgfTtcclxufVxyXG4iXX0=