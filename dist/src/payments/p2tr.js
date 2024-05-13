"use strict";
// SegWit version 1 P2TR output type for Taproot defined in
// https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2tr = void 0;
const networks_1 = require("../networks");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const taproot = require("../taproot");
const noble_ecc_1 = require("../noble_ecc");
const necc = require("@noble/secp256k1");
const typef = require('typeforce');
const OPS = bitcoinjs_lib_1.script.OPS;
const { bech32m } = require('bech32');
const BITCOIN_NETWORK = networks_1.networks.bitcoin;
/**
 * A secp256k1 x coordinate with unknown discrete logarithm used for eliminating
 * keypath spends, equal to SHA256(uncompressedDER(SECP256K1_GENERATOR_POINT)).
 */
const H = Buffer.from('50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0', 'hex');
const EMPTY_BUFFER = Buffer.alloc(0);
function isPlainPubkey(pubKey) {
    if (pubKey.length !== 33)
        return false;
    try {
        return !!necc.Point.fromHex(pubKey);
    }
    catch (e) {
        return false;
    }
}
function isPlainPubkeys(pubkeys) {
    return pubkeys.every(isPlainPubkey);
}
// output: OP_1 {witnessProgram}
function p2tr(a, opts) {
    var _a, _b, _c, _d;
    if (!a.address && !a.pubkey && !a.pubkeys && !(a.redeems && a.redeems.length) && !a.output && !a.witness) {
        throw new TypeError('Not enough data');
    }
    opts = Object.assign({ validate: true }, opts || {});
    if (!opts.eccLib)
        throw new Error('ECC Library is required for p2tr.');
    const ecc = opts.eccLib;
    typef({
        network: typef.maybe(typef.Object),
        address: typef.maybe(typef.String),
        // the output script should be a fixed 34 bytes.
        // 1 byte for OP_1 indicating segwit version 1, one byte for 0x20 to push
        // the next 32 bytes, followed by the 32 byte witness program
        output: typef.maybe(typef.BufferN(34)),
        // a single pubkey
        pubkey: typef.maybe(ecc.isXOnlyPoint),
        // the pub key(s) used for keypath signing.
        // aggregated with MuSig2* if > 1
        pubkeys: typef.maybe(typef.anyOf(typef.arrayOf(ecc.isXOnlyPoint), typef.arrayOf(isPlainPubkey))),
        redeems: typef.maybe(typef.arrayOf({
            network: typef.maybe(typef.Object),
            output: typef.maybe(typef.Buffer),
            weight: typef.maybe(typef.Number),
            depth: typef.maybe(typef.Number),
            witness: typef.maybe(typef.arrayOf(typef.Buffer)),
        })),
        redeemIndex: typef.maybe(typef.Number),
        signature: typef.maybe(bitcoinjs_lib_1.script.isCanonicalSchnorrSignature),
        controlBlock: typef.maybe(typef.Buffer),
        annex: typef.maybe(typef.Buffer),
    }, a);
    const _address = bitcoinjs_lib_1.lazy.value(() => {
        if (!a.address)
            return undefined;
        const result = bech32m.decode(a.address);
        const version = result.words.shift();
        const data = bech32m.fromWords(result.words);
        return {
            version,
            prefix: result.prefix,
            data: Buffer.from(data),
        };
    });
    const _outputPubkey = bitcoinjs_lib_1.lazy.value(() => {
        // we remove the first two bytes (OP_1 0x20) from the output script to
        // extract the 32 byte taproot pubkey (aka witness program)
        return a.output && a.output.slice(2);
    });
    const network = a.network || BITCOIN_NETWORK;
    const o = { network };
    const _taprootPaths = bitcoinjs_lib_1.lazy.value(() => {
        if (!a.redeems)
            return;
        if (o.tapTree) {
            return taproot.getDepthFirstTaptree(o.tapTree);
        }
        const outputs = a.redeems.map(({ output }) => output);
        if (!outputs.every((output) => output))
            return;
        return taproot.getHuffmanTaptree(outputs, a.redeems.map(({ weight }) => weight));
    });
    const _parsedWitness = bitcoinjs_lib_1.lazy.value(() => {
        if (!a.witness)
            return;
        return taproot.parseTaprootWitness(a.witness);
    });
    const _parsedControlBlock = bitcoinjs_lib_1.lazy.value(() => {
        // Can't use o.controlBlock, because it could be circular
        if (a.controlBlock)
            return taproot.parseControlBlock(ecc, a.controlBlock);
        const parsedWitness = _parsedWitness();
        if (parsedWitness && parsedWitness.spendType === 'Script') {
            return taproot.parseControlBlock(ecc, parsedWitness.controlBlock);
        }
    });
    bitcoinjs_lib_1.lazy.prop(o, 'internalPubkey', () => {
        var _a;
        if (a.pubkey) {
            // single pubkey
            return a.pubkey;
        }
        else if (a.pubkeys && a.pubkeys.length === 1) {
            return a.pubkeys[0];
        }
        else if (a.pubkeys && a.pubkeys.length > 1) {
            // multiple pubkeys
            if (isPlainPubkeys(a.pubkeys)) {
                return Buffer.from(noble_ecc_1.musig.getXOnlyPubkey(noble_ecc_1.musig.keyAgg(a.pubkeys)));
            }
            return Buffer.from(taproot.aggregateMuSigPubkeys(ecc, a.pubkeys));
        }
        else if (_parsedControlBlock()) {
            return (_a = _parsedControlBlock()) === null || _a === void 0 ? void 0 : _a.internalPubkey;
        }
        else {
            // If there is no key path spending condition, we use an internal key with unknown secret key.
            // TODO: In order to avoid leaking the information that key path spending is not possible it
            // is recommended to pick a fresh integer r in the range 0...n-1 uniformly at random and use
            // H + rG as internal key. It is possible to prove that this internal key does not have a
            // known discrete logarithm with respect to G by revealing r to a verifier who can then
            // reconstruct how the internal key was created.
            return H;
        }
    });
    bitcoinjs_lib_1.lazy.prop(o, 'taptreeRoot', () => {
        var _a;
        const parsedControlBlock = _parsedControlBlock();
        const parsedWitness = _parsedWitness();
        let taptreeRoot;
        // Prefer to get the root via the control block because not all redeems may
        // be available
        if (parsedControlBlock) {
            let tapscript;
            if (parsedWitness && parsedWitness.spendType === 'Script') {
                tapscript = parsedWitness.tapscript;
            }
            else if (o.redeem && o.redeem.output) {
                tapscript = o.redeem.output;
            }
            if (tapscript)
                taptreeRoot = taproot.getTaptreeRoot(ecc, parsedControlBlock, tapscript);
        }
        if (!taptreeRoot && _taprootPaths())
            taptreeRoot = (_a = _taprootPaths()) === null || _a === void 0 ? void 0 : _a.root;
        return taptreeRoot;
    });
    const _taprootPubkey = bitcoinjs_lib_1.lazy.value(() => {
        const taptreeRoot = o.taptreeRoot;
        // Refuse to create an unspendable key
        if (!a.pubkey && !(a.pubkeys && a.pubkeys.length) && !a.redeems && !taptreeRoot) {
            return;
        }
        return taproot.tapTweakPubkey(ecc, o === null || o === void 0 ? void 0 : o.internalPubkey, taptreeRoot);
    });
    bitcoinjs_lib_1.lazy.prop(o, 'tapTree', () => {
        if (!a.redeems)
            return;
        if (a.redeems.find(({ depth }) => depth === undefined)) {
            console.warn('Deprecation Warning: Weight-based tap tree construction will be removed in the future. ' +
                'Please use depth-first coding as specified in BIP-0371.');
            return;
        }
        if (!a.redeems.every(({ output }) => output))
            return;
        return {
            leaves: a.redeems.map(({ output, depth }) => {
                return {
                    script: output,
                    leafVersion: taproot.INITIAL_TAPSCRIPT_VERSION,
                    depth,
                };
            }),
        };
    });
    bitcoinjs_lib_1.lazy.prop(o, 'address', () => {
        var _a;
        const pubkey = _outputPubkey() || (_taprootPubkey() && ((_a = _taprootPubkey()) === null || _a === void 0 ? void 0 : _a.xOnlyPubkey));
        // only encode the 32 byte witness program as bech32m
        const words = bech32m.toWords(pubkey);
        words.unshift(0x01);
        return bech32m.encode(network.bech32, words);
    });
    bitcoinjs_lib_1.lazy.prop(o, 'controlBlock', () => {
        const parsedWitness = _parsedWitness();
        if (parsedWitness && parsedWitness.spendType === 'Script') {
            return parsedWitness.controlBlock;
        }
        const taprootPubkey = _taprootPubkey();
        const taprootPaths = _taprootPaths();
        if (!taprootPaths || !taprootPubkey || a.redeemIndex === undefined)
            return;
        return taproot.getControlBlock(taprootPubkey.parity, o.internalPubkey, taprootPaths.paths[a.redeemIndex]);
    });
    bitcoinjs_lib_1.lazy.prop(o, 'signature', () => {
        const parsedWitness = _parsedWitness();
        if (parsedWitness && parsedWitness.spendType === 'Key') {
            return parsedWitness.signature;
        }
    });
    bitcoinjs_lib_1.lazy.prop(o, 'annex', () => {
        if (!_parsedWitness())
            return;
        return _parsedWitness().annex;
    });
    bitcoinjs_lib_1.lazy.prop(o, 'output', () => {
        if (a.address) {
            const { data } = _address();
            return bitcoinjs_lib_1.script.compile([OPS.OP_1, data]);
        }
        const taprootPubkey = _taprootPubkey();
        if (!taprootPubkey)
            return;
        // OP_1 indicates segwit version 1
        return bitcoinjs_lib_1.script.compile([OPS.OP_1, Buffer.from(taprootPubkey.xOnlyPubkey)]);
    });
    bitcoinjs_lib_1.lazy.prop(o, 'witness', () => {
        if (!a.redeems) {
            if (a.signature)
                return [a.signature]; // Keypath spend
            return;
        }
        else if (!o.redeem) {
            return; // No chosen redeem script, can't make witness
        }
        else if (!o.controlBlock) {
            return;
        }
        let redeemWitness;
        // some callers may provide witness elements in the input script
        if (o.redeem.input && o.redeem.input.length > 0 && o.redeem.output && o.redeem.output.length > 0) {
            // transform redeem input to witness stack
            redeemWitness = bitcoinjs_lib_1.script.toStack(bitcoinjs_lib_1.script.decompile(o.redeem.input));
            // assigns a new object to o.redeem
            o.redeems[a.redeemIndex] = Object.assign({ witness: redeemWitness }, o.redeem);
            o.redeem.input = EMPTY_BUFFER;
        }
        else if (o.redeem.output && o.redeem.output.length > 0 && o.redeem.witness && o.redeem.witness.length > 0) {
            redeemWitness = o.redeem.witness;
        }
        else {
            return;
        }
        const witness = [...redeemWitness, o.redeem.output, o.controlBlock];
        if (a.annex) {
            witness.push(a.annex);
        }
        return witness;
    });
    bitcoinjs_lib_1.lazy.prop(o, 'name', () => {
        const nameParts = ['p2tr'];
        return nameParts.join('-');
    });
    bitcoinjs_lib_1.lazy.prop(o, 'redeem', () => {
        if (a.redeems) {
            if (a.redeemIndex === undefined)
                return;
            return a.redeems[a.redeemIndex];
        }
        const parsedWitness = _parsedWitness();
        if (parsedWitness && parsedWitness.spendType === 'Script') {
            return {
                witness: parsedWitness.scriptSig,
                output: parsedWitness.tapscript,
            };
        }
    });
    // extended validation
    if (opts.validate) {
        const taprootPubkey = _taprootPubkey();
        if (a.output) {
            if (a.output[0] !== OPS.OP_1 || a.output[1] !== 0x20) {
                throw new TypeError('Output is invalid');
            }
            // if we're passed both an output script and an address, ensure they match
            if (a.address && _outputPubkey && !((_a = _outputPubkey()) === null || _a === void 0 ? void 0 : _a.equals((_b = _address()) === null || _b === void 0 ? void 0 : _b.data))) {
                throw new TypeError('mismatch between address & output');
            }
            // Wrapping `taprootPubkey.xOnlyPubkey` in Buffer because of a peculiar issue in the frontend
            // where a polyfill for Buffer is used. Refer: https://bitgoinc.atlassian.net/browse/BG-61420
            if (taprootPubkey && _outputPubkey && !((_c = _outputPubkey()) === null || _c === void 0 ? void 0 : _c.equals(Buffer.from(taprootPubkey.xOnlyPubkey)))) {
                throw new TypeError('mismatch between output and taproot pubkey');
            }
        }
        if (a.address) {
            if (taprootPubkey && !((_d = _address()) === null || _d === void 0 ? void 0 : _d.data.equals(Buffer.from(taprootPubkey.xOnlyPubkey)))) {
                throw new TypeError('mismatch between address and taproot pubkey');
            }
        }
        const parsedControlBlock = _parsedControlBlock();
        if (parsedControlBlock) {
            if (!parsedControlBlock.internalPubkey.equals(o === null || o === void 0 ? void 0 : o.internalPubkey)) {
                throw new TypeError('Internal pubkey mismatch');
            }
            if (taprootPubkey && parsedControlBlock.parity !== taprootPubkey.parity) {
                throw new TypeError('Parity mismatch');
            }
        }
        if (a.redeems) {
            if (!a.redeems.length)
                throw new TypeError('Empty redeems');
            if (a.redeemIndex !== undefined && (a.redeemIndex < 0 || a.redeemIndex >= a.redeems.length)) {
                throw new TypeError('invalid redeem index');
            }
            a.redeems.forEach((redeem) => {
                if (redeem.network && redeem.network !== network) {
                    throw new TypeError('Network mismatch');
                }
            });
        }
        const chosenRedeem = a.redeems && a.redeemIndex !== undefined && a.redeems[a.redeemIndex];
        const parsedWitness = _parsedWitness();
        if (parsedWitness && parsedWitness.spendType === 'Key') {
            if (a.controlBlock) {
                throw new TypeError('unexpected control block for key path');
            }
            if (a.signature && !a.signature.equals(parsedWitness.signature)) {
                throw new TypeError('mismatch between witness & signature');
            }
        }
        if (parsedWitness && parsedWitness.spendType === 'Script') {
            if (a.signature) {
                throw new TypeError('unexpected signature with script path witness');
            }
            if (a.controlBlock && !a.controlBlock.equals(parsedWitness.controlBlock)) {
                throw new TypeError('control block mismatch');
            }
            if (a.annex && parsedWitness.annex && !a.annex.equals(parsedWitness.annex)) {
                throw new TypeError('annex mismatch');
            }
            if (chosenRedeem && chosenRedeem.output && !chosenRedeem.output.equals(parsedWitness.tapscript)) {
                throw new TypeError('tapscript mismatch');
            }
        }
    }
    return Object.assign(o, a);
}
exports.p2tr = p2tr;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicDJ0ci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wYXltZW50cy9wMnRyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwyREFBMkQ7QUFDM0QsaUVBQWlFOzs7QUFFakUsMENBQXVDO0FBQ3ZDLGlEQUE4RTtBQUM5RSxzQ0FBc0M7QUFDdEMsNENBQXFDO0FBQ3JDLHlDQUF5QztBQUV6QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDbkMsTUFBTSxHQUFHLEdBQUcsc0JBQU8sQ0FBQyxHQUFHLENBQUM7QUFFeEIsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUV0QyxNQUFNLGVBQWUsR0FBRyxtQkFBUSxDQUFDLE9BQU8sQ0FBQztBQUV6Qzs7O0dBR0c7QUFDSCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2pHLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFckMsU0FBUyxhQUFhLENBQUMsTUFBa0I7SUFDdkMsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLEVBQUU7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUN2QyxJQUFJO1FBQ0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDckM7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsT0FBaUI7SUFDdkMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRCxnQ0FBZ0M7QUFDaEMsU0FBZ0IsSUFBSSxDQUFDLENBQVUsRUFBRSxJQUFrQjs7SUFDakQsSUFBSSxDQUFDLENB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Q0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDL0YsTUFBTSxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQzNDO1NBQ0Y7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQS9VRCxvQkErVUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTZWdXaXQgdmVyc2lvbiAxIFAyVFIgb3V0cHV0IHR5cGUgZm9yIFRhcHJvb3QgZGVmaW5lZCBpblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXBzL2Jsb2IvbWFzdGVyL2JpcC0wMzQxLm1lZGlhd2lraVxyXG5cclxuaW1wb3J0IHsgbmV0d29ya3MgfSBmcm9tICcuLi9uZXR3b3Jrcyc7XHJcbmltcG9ydCB7IHNjcmlwdCBhcyBic2NyaXB0LCBQYXltZW50LCBQYXltZW50T3B0cywgbGF6eSB9IGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgKiBhcyB0YXByb290IGZyb20gJy4uL3RhcHJvb3QnO1xyXG5pbXBvcnQgeyBtdXNpZyB9IGZyb20gJy4uL25vYmxlX2VjYyc7XHJcbmltcG9ydCAqIGFzIG5lY2MgZnJvbSAnQG5vYmxlL3NlY3AyNTZrMSc7XHJcblxyXG5jb25zdCB0eXBlZiA9IHJlcXVpcmUoJ3R5cGVmb3JjZScpO1xyXG5jb25zdCBPUFMgPSBic2NyaXB0Lk9QUztcclxuXHJcbmNvbnN0IHsgYmVjaDMybSB9ID0gcmVxdWlyZSgnYmVjaDMyJyk7XHJcblxyXG5jb25zdCBCSVRDT0lOX05FVFdPUksgPSBuZXR3b3Jrcy5iaXRjb2luO1xyXG5cclxuLyoqXHJcbiAqIEEgc2VjcDI1NmsxIHggY29vcmRpbmF0ZSB3aXRoIHVua25vd24gZGlzY3JldGUgbG9nYXJpdGhtIHVzZWQgZm9yIGVsaW1pbmF0aW5nXHJcbiAqIGtleXBhdGggc3BlbmRzLCBlcXVhbCB0byBTSEEyNTYodW5jb21wcmVzc2VkREVSKFNFQ1AyNTZLMV9HRU5FUkFUT1JfUE9JTlQpKS5cclxuICovXHJcbmNvbnN0IEggPSBCdWZmZXIuZnJvbSgnNTA5MjliNzRjMWEwNDk1NGI3OGI0YjYwMzVlOTdhNWUwNzhhNWEwZjI4ZWM5NmQ1NDdiZmVlOWFjZTgwM2FjMCcsICdoZXgnKTtcclxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jKDApO1xyXG5cclxuZnVuY3Rpb24gaXNQbGFpblB1YmtleShwdWJLZXk6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcclxuICBpZiAocHViS2V5Lmxlbmd0aCAhPT0gMzMpIHJldHVybiBmYWxzZTtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuICEhbmVjYy5Qb2ludC5mcm9tSGV4KHB1YktleSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNQbGFpblB1YmtleXMocHVia2V5czogQnVmZmVyW10pIHtcclxuICByZXR1cm4gcHVia2V5cy5ldmVyeShpc1BsYWluUHVia2V5KTtcclxufVxyXG5cclxuLy8gb3V0cHV0OiBPUF8xIHt3aXRuZXNzUHJvZ3JhbX1cclxuZXhwb3J0IGZ1bmN0aW9uIHAydHIoYTogUGF5bWVudCwgb3B0cz86IFBheW1lbnRPcHRzKTogUGF5bWVudCB7XHJcbiAgaWYgKCFhLmFkZHJlc3MgJiYgIWEucHVia2V5ICYmICFhLnB1YmtleXMgJiYgIShhLnJlZGVlbXMgJiYgYS5yZWRlZW1zLmxlbmd0aCkgJiYgIWEub3V0cHV0ICYmICFhLndpdG5lc3MpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBlbm91Z2ggZGF0YScpO1xyXG4gIH1cclxuICBvcHRzID0gT2JqZWN0LmFzc2lnbih7IHZhbGlkYXRlOiB0cnVlIH0sIG9wdHMgfHwge30pO1xyXG5cclxuICBpZiAoIW9wdHMuZWNjTGliKSB0aHJvdyBuZXcgRXJyb3IoJ0VDQyBMaWJyYXJ5IGlzIHJlcXVpcmVkIGZvciBwMnRyLicpO1xyXG4gIGNvbnN0IGVjYyA9IG9wdHMuZWNjTGliO1xyXG5cclxuICB0eXBlZihcclxuICAgIHtcclxuICAgICAgbmV0d29yazogdHlwZWYubWF5YmUodHlwZWYuT2JqZWN0KSxcclxuXHJcbiAgICAgIGFkZHJlc3M6IHR5cGVmLm1heWJlKHR5cGVmLlN0cmluZyksXHJcbiAgICAgIC8vIHRoZSBvdXRwdXQgc2NyaXB0IHNob3VsZCBiZSBhIGZpeGVkIDM0IGJ5dGVzLlxyXG4gICAgICAvLyAxIGJ5dGUgZm9yIE9QXzEgaW5kaWNhdGluZyBzZWd3aXQgdmVyc2lvbiAxLCBvbmUgYnl0ZSBmb3IgMHgyMCB0byBwdXNoXHJcbiAgICAgIC8vIHRoZSBuZXh0IDMyIGJ5dGVzLCBmb2xsb3dlZCBieSB0aGUgMzIgYnl0ZSB3aXRuZXNzIHByb2dyYW1cclxuICAgICAgb3V0cHV0OiB0eXBlZi5tYXliZSh0eXBlZi5CdWZmZXJOKDM0KSksXHJcbiAgICAgIC8vIGEgc2luZ2xlIHB1YmtleVxyXG4gICAgICBwdWJrZXk6IHR5cGVmLm1heWJlKGVjYy5pc1hPbmx5UG9pbnQpLFxyXG4gICAgICAvLyB0aGUgcHViIGtleShzKSB1c2VkIGZvciBrZXlwYXRoIHNpZ25pbmcuXHJcbiAgICAgIC8vIGFnZ3JlZ2F0ZWQgd2l0aCBNdVNpZzIqIGlmID4gMVxyXG4gICAgICBwdWJrZXlzOiB0eXBlZi5tYXliZSh0eXBlZi5hbnlPZih0eXBlZi5hcnJheU9mKGVjYy5pc1hPbmx5UG9pbnQpLCB0eXBlZi5hcnJheU9mKGlzUGxhaW5QdWJrZXkpKSksXHJcblxyXG4gICAgICByZWRlZW1zOiB0eXBlZi5tYXliZShcclxuICAgICAgICB0eXBlZi5hcnJheU9mKHtcclxuICAgICAgICAgIG5ldHdvcms6IHR5cGVmLm1heWJlKHR5cGVmLk9iamVjdCksXHJcbiAgICAgICAgICBvdXRwdXQ6IHR5cGVmLm1heWJlKHR5cGVmLkJ1ZmZlciksXHJcbiAgICAgICAgICB3ZWlnaHQ6IHR5cGVmLm1heWJlKHR5cGVmLk51bWJlciksXHJcbiAgICAgICAgICBkZXB0aDogdHlwZWYubWF5YmUodHlwZWYuTnVtYmVyKSxcclxuICAgICAgICAgIHdpdG5lc3M6IHR5cGVmLm1heWJlKHR5cGVmLmFycmF5T2YodHlwZWYuQnVmZmVyKSksXHJcbiAgICAgICAgfSlcclxuICAgICAgKSxcclxuICAgICAgcmVkZWVtSW5kZXg6IHR5cGVmLm1heWJlKHR5cGVmLk51bWJlciksIC8vIFNlbGVjdHMgdGhlIHJlZGVlbSB0byBzcGVuZFxyXG5cclxuICAgICAgc2lnbmF0dXJlOiB0eXBlZi5tYXliZShic2NyaXB0LmlzQ2Fub25pY2FsU2Nobm9yclNpZ25hdHVyZSksXHJcbiAgICAgIGNvbnRyb2xCbG9jazogdHlwZWYubWF5YmUodHlwZWYuQnVmZmVyKSxcclxuICAgICAgYW5uZXg6IHR5cGVmLm1heWJlKHR5cGVmLkJ1ZmZlciksXHJcbiAgICB9LFxyXG4gICAgYVxyXG4gICk7XHJcblxyXG4gIGNvbnN0IF9hZGRyZXNzID0gbGF6eS52YWx1ZSgoKSA9PiB7XHJcbiAgICBpZiAoIWEuYWRkcmVzcykgcmV0dXJuIHVuZGVmaW5lZDtcclxuXHJcbiAgICBjb25zdCByZXN1bHQgPSBiZWNoMzJtLmRlY29kZShhLmFkZHJlc3MpO1xyXG4gICAgY29uc3QgdmVyc2lvbiA9IHJlc3VsdC53b3Jkcy5zaGlmdCgpO1xyXG4gICAgY29uc3QgZGF0YSA9IGJlY2gzMm0uZnJvbVdvcmRzKHJlc3VsdC53b3Jkcyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB2ZXJzaW9uLFxyXG4gICAgICBwcmVmaXg6IHJlc3VsdC5wcmVmaXgsXHJcbiAgICAgIGRhdGE6IEJ1ZmZlci5mcm9tKGRhdGEpLFxyXG4gICAgfTtcclxuICB9KTtcclxuICBjb25zdCBfb3V0cHV0UHVia2V5ID0gbGF6eS52YWx1ZSgoKSA9PiB7XHJcbiAgICAvLyB3ZSByZW1vdmUgdGhlIGZpcnN0IHR3byBieXRlcyAoT1BfMSAweDIwKSBmcm9tIHRoZSBvdXRwdXQgc2NyaXB0IHRvXHJcbiAgICAvLyBleHRyYWN0IHRoZSAzMiBieXRlIHRhcHJvb3QgcHVia2V5IChha2Egd2l0bmVzcyBwcm9ncmFtKVxyXG4gICAgcmV0dXJuIGEub3V0cHV0ICYmIGEub3V0cHV0LnNsaWNlKDIpO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBuZXR3b3JrID0gYS5uZXR3b3JrIHx8IEJJVENPSU5fTkVUV09SSztcclxuXHJcbiAgY29uc3QgbzogUGF5bWVudCA9IHsgbmV0d29yayB9O1xyXG5cclxuICBjb25zdCBfdGFwcm9vdFBhdGhzID0gbGF6eS52YWx1ZSgoKSA9PiB7XHJcbiAgICBpZiAoIWEucmVkZWVtcykgcmV0dXJuO1xyXG4gICAgaWYgKG8udGFwVHJlZSkge1xyXG4gICAgICByZXR1cm4gdGFwcm9vdC5nZXREZXB0aEZpcnN0VGFwdHJlZShvLnRhcFRyZWUpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgb3V0cHV0czogQXJyYXk8QnVmZmVyIHwgdW5kZWZpbmVkPiA9IGEucmVkZWVtcy5tYXAoKHsgb3V0cHV0IH0pID0+IG91dHB1dCk7XHJcbiAgICBpZiAoIW91dHB1dHMuZXZlcnkoKG91dHB1dCkgPT4gb3V0cHV0KSkgcmV0dXJuO1xyXG4gICAgcmV0dXJuIHRhcHJvb3QuZ2V0SHVmZm1hblRhcHRyZWUoXHJcbiAgICAgIG91dHB1dHMgYXMgQnVmZmVyW10sXHJcbiAgICAgIGEucmVkZWVtcy5tYXAoKHsgd2VpZ2h0IH0pID0+IHdlaWdodClcclxuICAgICk7XHJcbiAgfSk7XHJcbiAgY29uc3QgX3BhcnNlZFdpdG5lc3MgPSBsYXp5LnZhbHVlKCgpID0+IHtcclxuICAgIGlmICghYS53aXRuZXNzKSByZXR1cm47XHJcbiAgICByZXR1cm4gdGFwcm9vdC5wYXJzZVRhcHJvb3RXaXRuZXNzKGEud2l0bmVzcyk7XHJcbiAgfSk7XHJcbiAgY29uc3QgX3BhcnNlZENvbnRyb2xCbG9jayA9IGxhenkudmFsdWUoKCkgPT4ge1xyXG4gICAgLy8gQ2FuJ3QgdXNlIG8uY29udHJvbEJsb2NrLCBiZWNhdXNlIGl0IGNvdWxkIGJlIGNpcmN1bGFyXHJcbiAgICBpZiAoYS5jb250cm9sQmxvY2spIHJldHVybiB0YXByb290LnBhcnNlQ29udHJvbEJsb2NrKGVjYywgYS5jb250cm9sQmxvY2spO1xyXG4gICAgY29uc3QgcGFyc2VkV2l0bmVzcyA9IF9wYXJzZWRXaXRuZXNzKCk7XHJcbiAgICBpZiAocGFyc2VkV2l0bmVzcyAmJiBwYXJzZWRXaXRuZXNzLnNwZW5kVHlwZSA9PT0gJ1NjcmlwdCcpIHtcclxuICAgICAgcmV0dXJuIHRhcHJvb3QucGFyc2VDb250cm9sQmxvY2soZWNjLCBwYXJzZWRXaXRuZXNzLmNvbnRyb2xCbG9jayk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGxhenkucHJvcChvLCAnaW50ZXJuYWxQdWJrZXknLCAoKSA9PiB7XHJcbiAgICBpZiAoYS5wdWJrZXkpIHtcclxuICAgICAgLy8gc2luZ2xlIHB1YmtleVxyXG4gICAgICByZXR1cm4gYS5wdWJrZXk7XHJcbiAgICB9IGVsc2UgaWYgKGEucHVia2V5cyAmJiBhLnB1YmtleXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHJldHVybiBhLnB1YmtleXNbMF07XHJcbiAgICB9IGVsc2UgaWYgKGEucHVia2V5cyAmJiBhLnB1YmtleXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAvLyBtdWx0aXBsZSBwdWJrZXlzXHJcbiAgICAgIGlmIChpc1BsYWluUHVia2V5cyhhLnB1YmtleXMpKSB7XHJcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKG11c2lnLmdldFhPbmx5UHVia2V5KG11c2lnLmtleUFnZyhhLnB1YmtleXMpKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBCdWZmZXIuZnJvbSh0YXByb290LmFnZ3JlZ2F0ZU11U2lnUHVia2V5cyhlY2MsIGEucHVia2V5cykpO1xyXG4gICAgfSBlbHNlIGlmIChfcGFyc2VkQ29udHJvbEJsb2NrKCkpIHtcclxuICAgICAgcmV0dXJuIF9wYXJzZWRDb250cm9sQmxvY2soKT8uaW50ZXJuYWxQdWJrZXk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBrZXkgcGF0aCBzcGVuZGluZyBjb25kaXRpb24sIHdlIHVzZSBhbiBpbnRlcm5hbCBrZXkgd2l0aCB1bmtub3duIHNlY3JldCBrZXkuXHJcbiAgICAgIC8vIFRPRE86IEluIG9yZGVyIHRvIGF2b2lkIGxlYWtpbmcgdGhlIGluZm9ybWF0aW9uIHRoYXQga2V5IHBhdGggc3BlbmRpbmcgaXMgbm90IHBvc3NpYmxlIGl0XHJcbiAgICAgIC8vIGlzIHJlY29tbWVuZGVkIHRvIHBpY2sgYSBmcmVzaCBpbnRlZ2VyIHIgaW4gdGhlIHJhbmdlIDAuLi5uLTEgdW5pZm9ybWx5IGF0IHJhbmRvbSBhbmQgdXNlXHJcbiAgICAgIC8vIEggKyByRyBhcyBpbnRlcm5hbCBrZXkuIEl0IGlzIHBvc3NpYmxlIHRvIHByb3ZlIHRoYXQgdGhpcyBpbnRlcm5hbCBrZXkgZG9lcyBub3QgaGF2ZSBhXHJcbiAgICAgIC8vIGtub3duIGRpc2NyZXRlIGxvZ2FyaXRobSB3aXRoIHJlc3BlY3QgdG8gRyBieSByZXZlYWxpbmcgciB0byBhIHZlcmlmaWVyIHdobyBjYW4gdGhlblxyXG4gICAgICAvLyByZWNvbnN0cnVjdCBob3cgdGhlIGludGVybmFsIGtleSB3YXMgY3JlYXRlZC5cclxuICAgICAgcmV0dXJuIEg7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGxhenkucHJvcChvLCAndGFwdHJlZVJvb3QnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBwYXJzZWRDb250cm9sQmxvY2sgPSBfcGFyc2VkQ29udHJvbEJsb2NrKCk7XHJcbiAgICBjb25zdCBwYXJzZWRXaXRuZXNzID0gX3BhcnNlZFdpdG5lc3MoKTtcclxuICAgIGxldCB0YXB0cmVlUm9vdDtcclxuICAgIC8vIFByZWZlciB0byBnZXQgdGhlIHJvb3QgdmlhIHRoZSBjb250cm9sIGJsb2NrIGJlY2F1c2Ugbm90IGFsbCByZWRlZW1zIG1heVxyXG4gICAgLy8gYmUgYXZhaWxhYmxlXHJcbiAgICBpZiAocGFyc2VkQ29udHJvbEJsb2NrKSB7XHJcbiAgICAgIGxldCB0YXBzY3JpcHQ7XHJcbiAgICAgIGlmIChwYXJzZWRXaXRuZXNzICYmIHBhcnNlZFdpdG5lc3Muc3BlbmRUeXBlID09PSAnU2NyaXB0Jykge1xyXG4gICAgICAgIHRhcHNjcmlwdCA9IHBhcnNlZFdpdG5lc3MudGFwc2NyaXB0O1xyXG4gICAgICB9IGVsc2UgaWYgKG8ucmVkZWVtICYmIG8ucmVkZWVtLm91dHB1dCkge1xyXG4gICAgICAgIHRhcHNjcmlwdCA9IG8ucmVkZWVtLm91dHB1dDtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGFwc2NyaXB0KSB0YXB0cmVlUm9vdCA9IHRhcHJvb3QuZ2V0VGFwdHJlZVJvb3QoZWNjLCBwYXJzZWRDb250cm9sQmxvY2ssIHRhcHNjcmlwdCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRhcHRyZWVSb290ICYmIF90YXByb290UGF0aHMoKSkgdGFwdHJlZVJvb3QgPSBfdGFwcm9vdFBhdGhzKCk/LnJvb3Q7XHJcblxyXG4gICAgcmV0dXJuIHRhcHRyZWVSb290O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBfdGFwcm9vdFB1YmtleSA9IGxhenkudmFsdWUoKCkgPT4ge1xyXG4gICAgY29uc3QgdGFwdHJlZVJvb3QgPSBvLnRhcHRyZWVSb290O1xyXG4gICAgLy8gUmVmdXNlIHRvIGNyZWF0ZSBhbiB1bnNwZW5kYWJsZSBrZXlcclxuICAgIGlmICghYS5wdWJrZXkgJiYgIShhLnB1YmtleXMgJiYgYS5wdWJrZXlzLmxlbmd0aCkgJiYgIWEucmVkZWVtcyAmJiAhdGFwdHJlZVJvb3QpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRhcHJvb3QudGFwVHdlYWtQdWJrZXkoZWNjLCBvPy5pbnRlcm5hbFB1YmtleSBhcyBVaW50OEFycmF5LCB0YXB0cmVlUm9vdCk7XHJcbiAgfSk7XHJcblxyXG4gIGxhenkucHJvcChvLCAndGFwVHJlZScsICgpID0+IHtcclxuICAgIGlmICghYS5yZWRlZW1zKSByZXR1cm47XHJcbiAgICBpZiAoYS5yZWRlZW1zLmZpbmQoKHsgZGVwdGggfSkgPT4gZGVwdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICdEZXByZWNhdGlvbiBXYXJuaW5nOiBXZWlnaHQtYmFzZWQgdGFwIHRyZWUgY29uc3RydWN0aW9uIHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgZnV0dXJlLiAnICtcclxuICAgICAgICAgICdQbGVhc2UgdXNlIGRlcHRoLWZpcnN0IGNvZGluZyBhcyBzcGVjaWZpZWQgaW4gQklQLTAzNzEuJ1xyXG4gICAgICApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoIWEucmVkZWVtcy5ldmVyeSgoeyBvdXRwdXQgfSkgPT4gb3V0cHV0KSkgcmV0dXJuO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbGVhdmVzOiBhLnJlZGVlbXMubWFwKCh7IG91dHB1dCwgZGVwdGggfSkgPT4ge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBzY3JpcHQ6IG91dHB1dCxcclxuICAgICAgICAgIGxlYWZWZXJzaW9uOiB0YXByb290LklOSVRJQUxfVEFQU0NSSVBUX1ZFUlNJT04sXHJcbiAgICAgICAgICBkZXB0aCxcclxuICAgICAgICB9O1xyXG4gICAgICB9KSxcclxuICAgIH07XHJcbiAgfSk7XHJcbiAgbGF6eS5wcm9wKG8sICdhZGRyZXNzJywgKCkgPT4ge1xyXG4gICAgY29uc3QgcHVia2V5ID0gX291dHB1dFB1YmtleSgpIHx8IChfdGFwcm9vdFB1YmtleSgpICYmIF90YXByb290UHVia2V5KCk/LnhPbmx5UHVia2V5KTtcclxuICAgIC8vIG9ubHkgZW5jb2RlIHRoZSAzMiBieXRlIHdpdG5lc3MgcHJvZ3JhbSBhcyBiZWNoMzJtXHJcbiAgICBjb25zdCB3b3JkcyA9IGJlY2gzMm0udG9Xb3JkcyhwdWJrZXkpO1xyXG4gICAgd29yZHMudW5zaGlmdCgweDAxKTtcclxuICAgIHJldHVybiBiZWNoMzJtLmVuY29kZShuZXR3b3JrLmJlY2gzMiwgd29yZHMpO1xyXG4gIH0pO1xyXG4gIGxhenkucHJvcChvLCAnY29udHJvbEJsb2NrJywgKCkgPT4ge1xyXG4gICAgY29uc3QgcGFyc2VkV2l0bmVzcyA9IF9wYXJzZWRXaXRuZXNzKCk7XHJcbiAgICBpZiAocGFyc2VkV2l0bmVzcyAmJiBwYXJzZWRXaXRuZXNzLnNwZW5kVHlwZSA9PT0gJ1NjcmlwdCcpIHtcclxuICAgICAgcmV0dXJuIHBhcnNlZFdpdG5lc3MuY29udHJvbEJsb2NrO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdGFwcm9vdFB1YmtleSA9IF90YXByb290UHVia2V5KCk7XHJcbiAgICBjb25zdCB0YXByb290UGF0aHMgPSBfdGFwcm9vdFBhdGhzKCk7XHJcbiAgICBpZiAoIXRhcHJvb3RQYXRocyB8fCAhdGFwcm9vdFB1YmtleSB8fCBhLnJlZGVlbUluZGV4ID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIHJldHVybiB0YXByb290LmdldENvbnRyb2xCbG9jayh0YXByb290UHVia2V5LnBhcml0eSwgby5pbnRlcm5hbFB1YmtleSEsIHRhcHJvb3RQYXRocy5wYXRoc1thLnJlZGVlbUluZGV4XSk7XHJcbiAgfSk7XHJcbiAgbGF6eS5wcm9wKG8sICdzaWduYXR1cmUnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBwYXJzZWRXaXRuZXNzID0gX3BhcnNlZFdpdG5lc3MoKTtcclxuICAgIGlmIChwYXJzZWRXaXRuZXNzICYmIHBhcnNlZFdpdG5lc3Muc3BlbmRUeXBlID09PSAnS2V5Jykge1xyXG4gICAgICByZXR1cm4gcGFyc2VkV2l0bmVzcy5zaWduYXR1cmU7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgbGF6eS5wcm9wKG8sICdhbm5leCcsICgpID0+IHtcclxuICAgIGlmICghX3BhcnNlZFdpdG5lc3MoKSkgcmV0dXJuO1xyXG4gICAgcmV0dXJuIF9wYXJzZWRXaXRuZXNzKCkhLmFubmV4O1xyXG4gIH0pO1xyXG4gIGxhenkucHJvcChvLCAnb3V0cHV0JywgKCkgPT4ge1xyXG4gICAgaWYgKGEuYWRkcmVzcykge1xyXG4gICAgICBjb25zdCB7IGRhdGEgfSA9IF9hZGRyZXNzKCkhO1xyXG4gICAgICByZXR1cm4gYnNjcmlwdC5jb21waWxlKFtPUFMuT1BfMSwgZGF0YV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRhcHJvb3RQdWJrZXkgPSBfdGFwcm9vdFB1YmtleSgpO1xyXG4gICAgaWYgKCF0YXByb290UHVia2V5KSByZXR1cm47XHJcblxyXG4gICAgLy8gT1BfMSBpbmRpY2F0ZXMgc2Vnd2l0IHZlcnNpb24gMVxyXG4gICAgcmV0dXJuIGJzY3JpcHQuY29tcGlsZShbT1BTLk9QXzEsIEJ1ZmZlci5mcm9tKHRhcHJvb3RQdWJrZXkueE9ubHlQdWJrZXkpXSk7XHJcbiAgfSk7XHJcbiAgbGF6eS5wcm9wKG8sICd3aXRuZXNzJywgKCkgPT4ge1xyXG4gICAgaWYgKCFhLnJlZGVlbXMpIHtcclxuICAgICAgaWYgKGEuc2lnbmF0dXJlKSByZXR1cm4gW2Euc2lnbmF0dXJlXTsgLy8gS2V5cGF0aCBzcGVuZFxyXG4gICAgICByZXR1cm47XHJcbiAgICB9IGVsc2UgaWYgKCFvLnJlZGVlbSkge1xyXG4gICAgICByZXR1cm47IC8vIE5vIGNob3NlbiByZWRlZW0gc2NyaXB0LCBjYW4ndCBtYWtlIHdpdG5lc3NcclxuICAgIH0gZWxzZSBpZiAoIW8uY29udHJvbEJsb2NrKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVkZWVtV2l0bmVzcztcclxuICAgIC8vIHNvbWUgY2FsbGVycyBtYXkgcHJvdmlkZSB3aXRuZXNzIGVsZW1lbnRzIGluIHRoZSBpbnB1dCBzY3JpcHRcclxuICAgIGlmIChvLnJlZGVlbS5pbnB1dCAmJiBvLnJlZGVlbS5pbnB1dC5sZW5ndGggPiAwICYmIG8ucmVkZWVtLm91dHB1dCAmJiBvLnJlZGVlbS5vdXRwdXQubGVuZ3RoID4gMCkge1xyXG4gICAgICAvLyB0cmFuc2Zvcm0gcmVkZWVtIGlucHV0IHRvIHdpdG5lc3Mgc3RhY2tcclxuICAgICAgcmVkZWVtV2l0bmVzcyA9IGJzY3JpcHQudG9TdGFjayhic2NyaXB0LmRlY29tcGlsZShvLnJlZGVlbS5pbnB1dCkhKTtcclxuXHJcbiAgICAgIC8vIGFzc2lnbnMgYSBuZXcgb2JqZWN0IHRvIG8ucmVkZWVtXHJcbiAgICAgIG8ucmVkZWVtcyFbYS5yZWRlZW1JbmRleCFdID0gT2JqZWN0LmFzc2lnbih7IHdpdG5lc3M6IHJlZGVlbVdpdG5lc3MgfSwgby5yZWRlZW0pO1xyXG4gICAgICBvLnJlZGVlbS5pbnB1dCA9IEVNUFRZX0JVRkZFUjtcclxuICAgIH0gZWxzZSBpZiAoby5yZWRlZW0ub3V0cHV0ICYmIG8ucmVkZWVtLm91dHB1dC5sZW5ndGggPiAwICYmIG8ucmVkZWVtLndpdG5lc3MgJiYgby5yZWRlZW0ud2l0bmVzcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHJlZGVlbVdpdG5lc3MgPSBvLnJlZGVlbS53aXRuZXNzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHdpdG5lc3MgPSBbLi4ucmVkZWVtV2l0bmVzcywgby5yZWRlZW0ub3V0cHV0LCBvLmNvbnRyb2xCbG9ja107XHJcblxyXG4gICAgaWYgKGEuYW5uZXgpIHtcclxuICAgICAgd2l0bmVzcy5wdXNoKGEuYW5uZXgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB3aXRuZXNzO1xyXG4gIH0pO1xyXG4gIGxhenkucHJvcChvLCAnbmFtZScsICgpID0+IHtcclxuICAgIGNvbnN0IG5hbWVQYXJ0cyA9IFsncDJ0ciddO1xyXG4gICAgcmV0dXJuIG5hbWVQYXJ0cy5qb2luKCctJyk7XHJcbiAgfSk7XHJcbiAgbGF6eS5wcm9wKG8sICdyZWRlZW0nLCAoKSA9PiB7XHJcbiAgICBpZiAoYS5yZWRlZW1zKSB7XHJcbiAgICAgIGlmIChhLnJlZGVlbUluZGV4ID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgcmV0dXJuIGEucmVkZWVtc1thLnJlZGVlbUluZGV4XTtcclxuICAgIH1cclxuICAgIGNvbnN0IHBhcnNlZFdpdG5lc3MgPSBfcGFyc2VkV2l0bmVzcygpO1xyXG4gICAgaWYgKHBhcnNlZFdpdG5lc3MgJiYgcGFyc2VkV2l0bmVzcy5zcGVuZFR5cGUgPT09ICdTY3JpcHQnKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgd2l0bmVzczogcGFyc2VkV2l0bmVzcy5zY3JpcHRTaWcsXHJcbiAgICAgICAgb3V0cHV0OiBwYXJzZWRXaXRuZXNzLnRhcHNjcmlwdCxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gZXh0ZW5kZWQgdmFsaWRhdGlvblxyXG4gIGlmIChvcHRzLnZhbGlkYXRlKSB7XHJcbiAgICBjb25zdCB0YXByb290UHVia2V5ID0gX3RhcHJvb3RQdWJrZXkoKTtcclxuXHJcbiAgICBpZiAoYS5vdXRwdXQpIHtcclxuICAgICAgaWYgKGEub3V0cHV0WzBdICE9PSBPUFMuT1BfMSB8fCBhLm91dHB1dFsxXSAhPT0gMHgyMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ091dHB1dCBpcyBpbnZhbGlkJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGlmIHdlJ3JlIHBhc3NlZCBib3RoIGFuIG91dHB1dCBzY3JpcHQgYW5kIGFuIGFkZHJlc3MsIGVuc3VyZSB0aGV5IG1hdGNoXHJcbiAgICAgIGlmIChhLmFkZHJlc3MgJiYgX291dHB1dFB1YmtleSAmJiAhX291dHB1dFB1YmtleSgpPy5lcXVhbHMoX2FkZHJlc3MoKT8uZGF0YSBhcyBCdWZmZXIpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbWlzbWF0Y2ggYmV0d2VlbiBhZGRyZXNzICYgb3V0cHV0Jyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdyYXBwaW5nIGB0YXByb290UHVia2V5LnhPbmx5UHVia2V5YCBpbiBCdWZmZXIgYmVjYXVzZSBvZiBhIHBlY3VsaWFyIGlzc3VlIGluIHRoZSBmcm9udGVuZFxyXG4gICAgICAvLyB3aGVyZSBhIHBvbHlmaWxsIGZvciBCdWZmZXIgaXMgdXNlZC4gUmVmZXI6IGh0dHBzOi8vYml0Z29pbmMuYXRsYXNzaWFuLm5ldC9icm93c2UvQkctNjE0MjBcclxuICAgICAgaWYgKHRhcHJvb3RQdWJrZXkgJiYgX291dHB1dFB1YmtleSAmJiAhX291dHB1dFB1YmtleSgpPy5lcXVhbHMoQnVmZmVyLmZyb20odGFwcm9vdFB1YmtleS54T25seVB1YmtleSkpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbWlzbWF0Y2ggYmV0d2VlbiBvdXRwdXQgYW5kIHRhcHJvb3QgcHVia2V5Jyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYS5hZGRyZXNzKSB7XHJcbiAgICAgIGlmICh0YXByb290UHVia2V5ICYmICFfYWRkcmVzcygpPy5kYXRhLmVxdWFscyhCdWZmZXIuZnJvbSh0YXByb290UHVia2V5LnhPbmx5UHVia2V5KSkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtaXNtYXRjaCBiZXR3ZWVuIGFkZHJlc3MgYW5kIHRhcHJvb3QgcHVia2V5Jyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJzZWRDb250cm9sQmxvY2sgPSBfcGFyc2VkQ29udHJvbEJsb2NrKCk7XHJcbiAgICBpZiAocGFyc2VkQ29udHJvbEJsb2NrKSB7XHJcbiAgICAgIGlmICghcGFyc2VkQ29udHJvbEJsb2NrLmludGVybmFsUHVia2V5LmVxdWFscyhvPy5pbnRlcm5hbFB1YmtleSBhcyBVaW50OEFycmF5KSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludGVybmFsIHB1YmtleSBtaXNtYXRjaCcpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0YXByb290UHVia2V5ICYmIHBhcnNlZENvbnRyb2xCbG9jay5wYXJpdHkgIT09IHRhcHJvb3RQdWJrZXkucGFyaXR5KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUGFyaXR5IG1pc21hdGNoJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYS5yZWRlZW1zKSB7XHJcbiAgICAgIGlmICghYS5yZWRlZW1zLmxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcignRW1wdHkgcmVkZWVtcycpO1xyXG4gICAgICBpZiAoYS5yZWRlZW1JbmRleCAhPT0gdW5kZWZpbmVkICYmIChhLnJlZGVlbUluZGV4IDwgMCB8fCBhLnJlZGVlbUluZGV4ID49IGEucmVkZWVtcy5sZW5ndGgpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCByZWRlZW0gaW5kZXgnKTtcclxuICAgICAgfVxyXG4gICAgICBhLnJlZGVlbXMuZm9yRWFjaCgocmVkZWVtKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlZGVlbS5uZXR3b3JrICYmIHJlZGVlbS5uZXR3b3JrICE9PSBuZXR3b3JrKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdOZXR3b3JrIG1pc21hdGNoJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjaG9zZW5SZWRlZW0gPSBhLnJlZGVlbXMgJiYgYS5yZWRlZW1JbmRleCAhPT0gdW5kZWZpbmVkICYmIGEucmVkZWVtc1thLnJlZGVlbUluZGV4XTtcclxuXHJcbiAgICBjb25zdCBwYXJzZWRXaXRuZXNzID0gX3BhcnNlZFdpdG5lc3MoKTtcclxuICAgIGlmIChwYXJzZWRXaXRuZXNzICYmIHBhcnNlZFdpdG5lc3Muc3BlbmRUeXBlID09PSAnS2V5Jykge1xyXG4gICAgICBpZiAoYS5jb250cm9sQmxvY2spIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd1bmV4cGVjdGVkIGNvbnRyb2wgYmxvY2sgZm9yIGtleSBwYXRoJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhLnNpZ25hdHVyZSAmJiAhYS5zaWduYXR1cmUuZXF1YWxzKHBhcnNlZFdpdG5lc3Muc2lnbmF0dXJlKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ21pc21hdGNoIGJldHdlZW4gd2l0bmVzcyAmIHNpZ25hdHVyZScpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAocGFyc2VkV2l0bmVzcyAmJiBwYXJzZWRXaXRuZXNzLnNwZW5kVHlwZSA9PT0gJ1NjcmlwdCcpIHtcclxuICAgICAgaWYgKGEuc2lnbmF0dXJlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndW5leHBlY3RlZCBzaWduYXR1cmUgd2l0aCBzY3JpcHQgcGF0aCB3aXRuZXNzJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhLmNvbnRyb2xCbG9jayAmJiAhYS5jb250cm9sQmxvY2suZXF1YWxzKHBhcnNlZFdpdG5lc3MuY29udHJvbEJsb2NrKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2NvbnRyb2wgYmxvY2sgbWlzbWF0Y2gnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGEuYW5uZXggJiYgcGFyc2VkV2l0bmVzcy5hbm5leCAmJiAhYS5hbm5leC5lcXVhbHMocGFyc2VkV2l0bmVzcy5hbm5leCkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhbm5leCBtaXNtYXRjaCcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY2hvc2VuUmVkZWVtICYmIGNob3NlblJlZGVlbS5vdXRwdXQgJiYgIWNob3NlblJlZGVlbS5vdXRwdXQuZXF1YWxzKHBhcnNlZFdpdG5lc3MudGFwc2NyaXB0KSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3RhcHNjcmlwdCBtaXNtYXRjaCcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihvLCBhKTtcclxufVxyXG4iXX0=