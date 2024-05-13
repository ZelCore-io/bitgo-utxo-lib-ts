"use strict";
// Taproot-specific key aggregation and taptree logic as defined in:
// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
// https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaprootOutputKey = exports.createTaprootOutputScript = exports.getTweakedOutputKey = exports.getTaptreeRoot = exports.getTapleafHash = exports.parseControlBlock = exports.parseTaprootWitness = exports.getControlBlock = exports.getHuffmanTaptree = exports.getDepthFirstTaptree = exports.tapTweakPubkey = exports.tapTweakPrivkey = exports.calculateTapTweak = exports.hashTapBranch = exports.hashTapLeaf = exports.serializeScriptSize = exports.aggregateMuSigPubkeys = exports.INITIAL_TAPSCRIPT_VERSION = exports.EVEN_Y_COORD_PREFIX = void 0;
const assert = require("assert");
const FastPriorityQueue = require("fastpriorityqueue");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const noble_ecc_1 = require("./noble_ecc");
const varuint = require('varuint-bitcoin');
/**
 * The 0x02 prefix indicating an even Y coordinate which is implicitly assumed
 * on all 32 byte x-only pub keys as defined in BIP340.
 */
exports.EVEN_Y_COORD_PREFIX = Buffer.of(0x02);
exports.INITIAL_TAPSCRIPT_VERSION = 0xc0;
/**
 * Aggregates a list of public keys into a single MuSig2* public key
 * according to the MuSig2 paper.
 * @param ecc Elliptic curve implementation
 * @param pubkeys The list of pub keys to aggregate
 * @returns a 32 byte Buffer representing the aggregate key
 */
function aggregateMuSigPubkeys(ecc, pubkeys) {
    // TODO: Consider enforcing key uniqueness.
    assert(pubkeys.length > 1, 'at least two pubkeys are required for musig key aggregation');
    // Sort the keys in ascending order
    pubkeys.sort(Buffer.compare);
    // In MuSig all signers contribute key material to a single signing key,
    // using the equation
    //
    //     P = sum_i µ_i * P_i
    //
    // where `P_i` is the public key of the `i`th signer and `µ_i` is a so-called
    // _MuSig coefficient_ computed according to the following equation
    //
    // L = H(P_1 || P_2 || ... || P_n)
    // µ_i = H(L || P_i)
    const L = bitcoinjs_lib_1.crypto.taggedHash('KeyAgg list', Buffer.concat(pubkeys));
    const secondUniquePubkey = pubkeys.find((pubkey) => !pubkeys[0].equals(pubkey));
    const tweakedPubkeys = pubkeys.map((pubkey) => {
        const xyPubkey = Buffer.concat([exports.EVEN_Y_COORD_PREFIX, pubkey]);
        if (secondUniquePubkey !== undefined && secondUniquePubkey.equals(pubkey)) {
            // The second unique key in the pubkey list given to ''KeyAgg'' (as well
            // as any keys identical to this key) gets the constant KeyAgg
            // coefficient 1 which saves an exponentiation (see the MuSig2* appendix
            // in the MuSig2 paper).
            return xyPubkey;
        }
        const c = bitcoinjs_lib_1.crypto.taggedHash('KeyAgg coefficient', Buffer.concat([L, pubkey]));
        const tweakedPubkey = ecc.pointMultiply(xyPubkey, c);
        if (!tweakedPubkey) {
            throw new Error('Failed to multiply pubkey by coefficient');
        }
        return tweakedPubkey;
    });
    const aggregatePubkey = tweakedPubkeys.reduce((prev, curr) => {
        const next = ecc.pointAdd(prev, curr);
        if (!next)
            throw new Error('Failed to sum pubkeys');
        return next;
    });
    return aggregatePubkey.slice(1);
}
exports.aggregateMuSigPubkeys = aggregateMuSigPubkeys;
/**
 * Encodes the length of a script as a bitcoin variable length integer.
 * @param script
 * @returns
 */
function serializeScriptSize(script) {
    return varuint.encode(script.length);
}
exports.serializeScriptSize = serializeScriptSize;
/**
 * Gets a tapleaf tagged hash from a script.
 * @param script
 * @returns
 */
function hashTapLeaf(script, leafVersion = exports.INITIAL_TAPSCRIPT_VERSION) {
    const size = serializeScriptSize(script);
    return bitcoinjs_lib_1.crypto.taggedHash('TapLeaf', Buffer.concat([Buffer.of(leafVersion), size, script]));
}
exports.hashTapLeaf = hashTapLeaf;
/**
 * Creates a lexicographically sorted tapbranch from two child taptree nodes
 * and returns its tagged hash.
 * @param child1
 * @param child2
 * @returns the tagged tapbranch hash
 */
function hashTapBranch(child1, child2) {
    // sort the children lexicographically
    const sortedChildren = [child1, child2].sort(Buffer.compare);
    return bitcoinjs_lib_1.crypto.taggedHash('TapBranch', Buffer.concat(sortedChildren));
}
exports.hashTapBranch = hashTapBranch;
function calculateTapTweak(pubkey, taptreeRoot) {
    if (pubkey.length !== 32) {
        throw new Error(`Invalid pubkey size ${pubkey.length}.`);
    }
    if (taptreeRoot) {
        if (taptreeRoot.length !== 32) {
            throw new Error(`Invalid taptreeRoot size ${taptreeRoot.length}.`);
        }
        return bitcoinjs_lib_1.crypto.taggedHash('TapTweak', Buffer.concat([pubkey, taptreeRoot]));
    }
    // If the spending conditions do not require a script path, the output key should commit to an
    // unspendable script path instead of having no script path.
    // https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#cite_note-22
    return bitcoinjs_lib_1.crypto.taggedHash('TapTweak', Buffer.from(pubkey));
}
exports.calculateTapTweak = calculateTapTweak;
/**
 * Tweaks a privkey, using the tagged hash of its pubkey, and (optionally) a taptree root
 * @param ecc Elliptic curve implementation
 * @param pubkey public key, used to calculate the tweak
 * @param privkey the privkey to tweak
 * @param taptreeRoot the taptree root tagged hash
 * @returns {Buffer} the tweaked privkey
 */
function tapTweakPrivkey(ecc, pubkey, privkey, taptreeRoot) {
    const tapTweak = calculateTapTweak(pubkey, taptreeRoot);
    const point = ecc.pointFromScalar(privkey);
    if (!point)
        throw new Error('Invalid private key');
    if (point[0] % 2 === 1)
        privkey = ecc.privateNegate(privkey);
    const result = ecc.privateAdd(privkey, tapTweak);
    if (!result)
        throw new Error('Invalid private key');
    return result;
}
exports.tapTweakPrivkey = tapTweakPrivkey;
/**
 * Tweaks an internal pubkey, using the tagged hash of itself, and (optionally) a taptree root
 * @param ecc Elliptic curve implementation
 * @param pubkey the internal pubkey to tweak
 * @param taptreeRoot the taptree root tagged hash
 * @returns {TweakedPubkey} the tweaked pubkey
 */
function tapTweakPubkey(ecc, pubkey, taptreeRoot) {
    const tapTweak = calculateTapTweak(pubkey, taptreeRoot);
    const result = ecc.xOnlyPointAddTweak(pubkey, tapTweak);
    if (!result)
        throw new Error('Invalid pubkey');
    return result;
}
exports.tapTweakPubkey = tapTweakPubkey;
function recurseTaptree(leaves, targetDepth = 0) {
    const { value, done } = leaves.next();
    assert(!done, 'insufficient leaves to reconstruct tap tree');
    const [index, leaf] = value;
    const tree = {
        root: hashTapLeaf(leaf.script, leaf.leafVersion),
        paths: [],
    };
    tree.paths[index] = [];
    for (let depth = leaf.depth; depth > targetDepth; depth--) {
        const sibling = recurseTaptree(leaves, depth);
        tree.paths.forEach((path) => path.push(sibling.root));
        sibling.paths.forEach((path) => path.push(tree.root));
        tree.root = hashTapBranch(tree.root, sibling.root);
        // Merge disjoint sparse arrays of paths into tree.paths
        Object.assign(tree.paths, sibling.paths);
    }
    return tree;
}
/**
 * Gets the root hash and hash-paths of a taptree from the depth-first
 * construction used in BIP-0371 PSBTs
 * @param tree
 * @returns {Taptree} the tree, represented by its root hash, and the paths to
 * that root from each of the input scripts
 */
function getDepthFirstTaptree(tree) {
    const iter = tree.leaves.entries();
    const ret = recurseTaptree(iter);
    assert(iter.next().done, 'invalid tap tree, no path to some leaves');
    return ret;
}
exports.getDepthFirstTaptree = getDepthFirstTaptree;
/**
 * Gets the root hash of a taptree using a weighted Huffman construction from a
 * list of scripts and corresponding weights.
 * @param scripts
 * @param weights
 * @returns {Taptree} the tree, represented by its root hash, and the paths to that root from each of the input scripts
 */
function getHuffmanTaptree(scripts, weights) {
    assert(scripts.length > 0, 'at least one script is required to construct a tap tree');
    // Create a queue/heap of the provided scripts prioritized according to their
    // corresponding weights.
    const queue = new FastPriorityQueue((a, b) => {
        return a.weight < b.weight;
    });
    scripts.forEach((script, index) => {
        const weight = weights[index] || 1;
        assert(weight > 0, 'script weight must be a positive value');
        queue.add({
            weight,
            taggedHash: hashTapLeaf(script),
            paths: { [index]: [] },
        });
    });
    // Now that we have a queue of weighted scripts, we begin a loop whereby we
    // remove the two lowest weighted items from the queue. We create a tap branch
    // node from the two items, and add the branch back to the queue with the
    // combined weight of both its children. Each loop reduces the number of items
    // in the queue by one, and we repeat until we are left with only one item -
    // this becomes the tap tree root.
    //
    // For example, if we begin with scripts A, B, C, D with weights 6, 3, 1, 1
    // After first loop: A(6), B(3), CD(1 + 1)
    // After second loop: A(6), B[CD](3 + 2)
    // Final loop: A[B[CD]](6+5)
    // The final tree will look like:
    //
    //        A[B[CD]]
    //       /        \
    //      A         B[CD]
    //               /     \
    //              B      [CD]
    //                    /    \
    //                   C      D
    //
    // This ensures that the spending conditions we believe to have the highest
    // probability of being used are further up the tree than less likely scripts,
    // thereby reducing the size of the merkle proofs for the more likely scripts.
    while (queue.size > 1) {
        // We can safely expect two polls to return non-null elements since we've
        // checked that the queue has at least two elements before looping.
        const child1 = queue.poll();
        const child2 = queue.poll();
        Object.values(child1.paths).forEach((path) => path.push(child2.taggedHash));
        Object.values(child2.paths).forEach((path) => path.push(child1.taggedHash));
        queue.add({
            taggedHash: hashTapBranch(child1.taggedHash, child2.taggedHash),
            weight: child1.weight + child2.weight,
            paths: { ...child1.paths, ...child2.paths },
        });
    }
    // After the while loop above completes we should have exactly one element
    // remaining in the queue, which we can safely extract below.
    const rootNode = queue.poll();
    const paths = Object.entries(rootNode.paths).reduce((acc, [index, path]) => {
        acc[Number(index)] = path; // TODO: Why doesn't TS know it's a number?
        return acc;
    }, Array(scripts.length));
    return { root: rootNode.taggedHash, paths };
}
exports.getHuffmanTaptree = getHuffmanTaptree;
function getControlBlock(parity, pubkey, path, leafVersion = exports.INITIAL_TAPSCRIPT_VERSION) {
    const parityVersion = leafVersion + parity;
    return Buffer.concat([Buffer.of(parityVersion), pubkey, ...path]);
}
exports.getControlBlock = getControlBlock;
/**
 * Parses a taproot witness stack and extracts key data elements.
 * @param witnessStack
 * @returns {ScriptPathWitness|KeyPathWitness} an object representing the
 * parsed witness for a script path or key path spend.
 * @throws {Error} if the witness stack does not conform to the BIP 341 script validation rules
 */
function parseTaprootWitness(witnessStack) {
    let annex;
    if (witnessStack.length >= 2 && witnessStack[witnessStack.length - 1][0] === 0x50) {
        // If there are at least two witness elements, and the first byte of the last element is
        // 0x50, this last element is called annex a and is removed from the witness stack
        annex = witnessStack[witnessStack.length - 1];
        witnessStack = witnessStack.slice(0, -1);
    }
    if (witnessStack.length < 1) {
        throw new Error('witness stack must have at least one element');
    }
    else if (witnessStack.length === 1) {
        // key path spend
        const signature = witnessStack[0];
        if (!bitcoinjs_lib_1.script.isCanonicalSchnorrSignature(signature)) {
            throw new Error('invalid signature');
        }
        return { spendType: 'Key', signature, annex };
    }
    // script path spend
    // second to last element is the tapscript
    const tapscript = witnessStack[witnessStack.length - 2];
    const tapscriptChunks = bitcoinjs_lib_1.script.decompile(tapscript);
    if (!tapscriptChunks || tapscriptChunks.length === 0) {
        throw new Error('tapscript is not a valid script');
    }
    // The last stack element is called the control block c, and must have length 33 + 32m,
    // for a value of m that is an integer between 0 and 128, inclusive
    const controlBlock = witnessStack[witnessStack.length - 1];
    if (controlBlock.length < 33 || controlBlock.length > 33 + 32 * 128 || controlBlock.length % 32 !== 1) {
        throw new Error('invalid control block length');
    }
    return {
        spendType: 'Script',
        scriptSig: witnessStack.slice(0, -2),
        tapscript,
        controlBlock,
        annex,
    };
}
exports.parseTaprootWitness = parseTaprootWitness;
/**
 * Parses a taproot control block.
 * @param ecc Elliptic curve implementation
 * @param controlBlock the control block to parse
 * @returns {ControlBlock} the parsed control block
 * @throws {Error} if the witness stack does not conform to the BIP 341 script validation rules
 */
function parseControlBlock(ecc, controlBlock) {
    if ((controlBlock.length - 1) % 32 !== 0) {
        throw new TypeError('Invalid control block length');
    }
    const parity = controlBlock[0] & 0x01;
    // Let p = c[1:33] and let P = lift_x(int(p)) where lift_x and [:] are defined as in BIP340.
    // Fail if this point is not on the curve
    const internalPubkey = controlBlock.slice(1, 33);
    if (!ecc.isXOnlyPoint(internalPubkey)) {
        throw new Error('internal pubkey is not an EC point');
    }
    // The leaf version cannot be 0x50 as that would result in ambiguity with the annex.
    const leafVersion = controlBlock[0] & 0xfe;
    if (leafVersion === 0x50) {
        throw new Error('invalid leaf version');
    }
    const path = [];
    for (let j = 33; j < controlBlock.length; j += 32) {
        path.push(controlBlock.slice(j, j + 32));
    }
    return {
        parity,
        internalPubkey,
        leafVersion,
        path,
    };
}
exports.parseControlBlock = parseControlBlock;
/**
 * Calculates the tapleaf hash from a control block and script.
 * @param ecc Elliptic curve implementation
 * @param controlBlock the control block, either raw or parsed
 * @param tapscript the leaf script corresdponding to the control block
 * @returns {Buffer} the tapleaf hash
 */
function getTapleafHash(ecc, controlBlock, tapscript) {
    if (Buffer.isBuffer(controlBlock)) {
        controlBlock = parseControlBlock(ecc, controlBlock);
    }
    const { leafVersion } = controlBlock;
    return bitcoinjs_lib_1.crypto.taggedHash('TapLeaf', Buffer.concat([Buffer.of(leafVersion), serializeScriptSize(tapscript), tapscript]));
}
exports.getTapleafHash = getTapleafHash;
/**
 * Calculates the taptree root hash from a control block and script.
 * @param ecc Elliptic curve implementation
 * @param controlBlock the control block, either raw or parsed
 * @param tapscript the leaf script corresdponding to the control block
 * @param tapleafHash the leaf hash if already calculated
 * @returns {Buffer} the taptree root hash
 */
function getTaptreeRoot(ecc, controlBlock, tapscript, tapleafHash) {
    if (Buffer.isBuffer(controlBlock)) {
        controlBlock = parseControlBlock(ecc, controlBlock);
    }
    const { path } = controlBlock;
    tapleafHash = tapleafHash || getTapleafHash(ecc, controlBlock, tapscript);
    // `taptreeMerkleHash` begins as our tapscript tapleaf hash and its value iterates
    // through its parent tapbranch hashes until it ends up as the taptree root hash
    let taptreeMerkleHash = tapleafHash;
    for (const taptreeSiblingHash of path) {
        taptreeMerkleHash =
            Buffer.compare(taptreeMerkleHash, taptreeSiblingHash) === -1
                ? bitcoinjs_lib_1.crypto.taggedHash('TapBranch', Buffer.concat([taptreeMerkleHash, taptreeSiblingHash]))
                : bitcoinjs_lib_1.crypto.taggedHash('TapBranch', Buffer.concat([taptreeSiblingHash, taptreeMerkleHash]));
    }
    return taptreeMerkleHash;
}
exports.getTaptreeRoot = getTaptreeRoot;
function getTweakedOutputKey(payment) {
    var _a;
    assert(payment.output);
    if (payment.output.length === 34) {
        return (_a = payment.output) === null || _a === void 0 ? void 0 : _a.subarray(2);
    }
    throw new Error(`invalid p2tr tweaked output key size ${payment.output.length}`);
}
exports.getTweakedOutputKey = getTweakedOutputKey;
/**
 * @returns output script for either script path input controlBlock
 * & leafScript OR key path input internalPubKey & taptreeRoot
 */
function createTaprootOutputScript(p2trArgs) {
    let internalPubKey;
    let taptreeRoot;
    if ('internalPubKey' in p2trArgs) {
        internalPubKey = p2trArgs.internalPubKey;
        taptreeRoot = p2trArgs.taptreeRoot;
    }
    else {
        internalPubKey = parseControlBlock(noble_ecc_1.ecc, p2trArgs.controlBlock).internalPubkey;
        taptreeRoot = getTaptreeRoot(noble_ecc_1.ecc, p2trArgs.controlBlock, p2trArgs.leafScript);
    }
    const outputKey = tapTweakPubkey(noble_ecc_1.ecc, internalPubKey, taptreeRoot).xOnlyPubkey;
    return bitcoinjs_lib_1.script.compile([bitcoinjs_lib_1.script.OPS.OP_1, Buffer.from(outputKey)]);
}
exports.createTaprootOutputScript = createTaprootOutputScript;
/**
 * @returns x-only taproot output key (tapOutputKey)
 */
function getTaprootOutputKey(outputScript) {
    const outputDecompiled = bitcoinjs_lib_1.script.decompile(outputScript);
    if ((outputDecompiled === null || outputDecompiled === void 0 ? void 0 : outputDecompiled.length) !== 2) {
        throw new Error('invalid taproot output script');
    }
    const [op1, outputKey] = outputDecompiled;
    if (op1 !== bitcoinjs_lib_1.script.OPS.OP_1 || !Buffer.isBuffer(outputKey) || outputKey.length !== 32) {
        throw new Error('invalid taproot output script');
    }
    return outputKey;
}
exports.getTaprootOutputKey = getTaprootOutputKey;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwcm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXByb290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxvRUFBb0U7QUFDcEUsaUVBQWlFO0FBQ2pFLGlFQUFpRTs7O0FBR2pFLGlDQUFrQztBQUNsQyx1REFBd0Q7QUFDeEQsaURBQTRGO0FBQzVGLDJDQUE0QztBQUM1QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUUzQzs7O0dBR0c7QUFDVSxRQUFBLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEMsUUFBQSx5QkFBeUIsR0FBRyxJQUFJLENBQUM7QUFZOUM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IscUJBQXFCLENBQUMsR0FBMkIsRUFBRSxPQUFpQjtJQUNsRiwyQ0FBMkM7SUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLDZEQUE2RCxDQUFDLENBQUM7SUFFMUYsbUNBQW1DO0lBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTdCLHdFQUF3RTtJQUN4RSxxQkFBcUI7SUFDckIsRUFBRTtJQUNGLDBCQUEwQjtJQUMxQixFQUFFO0lBQ0YsNkVBQTZFO0lBQzdFLG1FQUFtRTtJQUNuRSxFQUFFO0lBQ0Ysa0NBQWtDO0lBQ2xDLG9CQUFvQjtJQUVwQixNQUFNLENBQUMsR0FBRyxzQkFBTyxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRXBFLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFaEYsTUFBTSxj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QUFnQixDQUFDO0lBQzFDLElBQUksR0FBRyxLQUFLLHNCQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7UUFDdEYsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQVZELGtEQVVDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVGFwcm9vdC1zcGVjaWZpYyBrZXkgYWdncmVnYXRpb24gYW5kIHRhcHRyZWUgbG9naWMgYXMgZGVmaW5lZCBpbjpcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYmlwcy9ibG9iL21hc3Rlci9iaXAtMDM0MC5tZWRpYXdpa2lcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYmlwcy9ibG9iL21hc3Rlci9iaXAtMDM0MS5tZWRpYXdpa2lcclxuXHJcbmltcG9ydCB7IFRhcFRyZWUgYXMgUHNidFRhcFRyZWUsIFRhcExlYWYgYXMgUHNidFRhcExlYWYgfSBmcm9tICdiaXAxNzQvc3JjL2xpYi9pbnRlcmZhY2VzJztcclxuaW1wb3J0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xyXG5pbXBvcnQgRmFzdFByaW9yaXR5UXVldWUgPSByZXF1aXJlKCdmYXN0cHJpb3JpdHlxdWV1ZScpO1xyXG5pbXBvcnQgeyBzY3JpcHQgYXMgYnNjcmlwdCwgY3J5cHRvIGFzIGJjcnlwdG8sIHBheW1lbnRzIGFzIGJwYXltZW50cyB9IGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgeyBlY2MgYXMgZWNjTGliIH0gZnJvbSAnLi9ub2JsZV9lY2MnO1xyXG5jb25zdCB2YXJ1aW50ID0gcmVxdWlyZSgndmFydWludC1iaXRjb2luJyk7XHJcblxyXG4vKipcclxuICogVGhlIDB4MDIgcHJlZml4IGluZGljYXRpbmcgYW4gZXZlbiBZIGNvb3JkaW5hdGUgd2hpY2ggaXMgaW1wbGljaXRseSBhc3N1bWVkXHJcbiAqIG9uIGFsbCAzMiBieXRlIHgtb25seSBwdWIga2V5cyBhcyBkZWZpbmVkIGluIEJJUDM0MC5cclxuICovXHJcbmV4cG9ydCBjb25zdCBFVkVOX1lfQ09PUkRfUFJFRklYID0gQnVmZmVyLm9mKDB4MDIpO1xyXG5leHBvcnQgY29uc3QgSU5JVElBTF9UQVBTQ1JJUFRfVkVSU0lPTiA9IDB4YzA7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRpbnlTZWNwMjU2azFJbnRlcmZhY2Uge1xyXG4gIGlzWE9ubHlQb2ludChwOiBVaW50OEFycmF5KTogYm9vbGVhbjtcclxuICB4T25seVBvaW50QWRkVHdlYWsocDogVWludDhBcnJheSwgdHdlYWs6IFVpbnQ4QXJyYXkpOiBYT25seVBvaW50QWRkVHdlYWtSZXN1bHQgfCBudWxsO1xyXG4gIHBvaW50RnJvbVNjYWxhcihzazogVWludDhBcnJheSwgY29tcHJlc3NlZD86IGJvb2xlYW4pOiBVaW50OEFycmF5IHwgbnVsbDtcclxuICBwb2ludE11bHRpcGx5KGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHwgbnVsbDtcclxuICBwb2ludEFkZChhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KTogVWludDhBcnJheSB8IG51bGw7XHJcbiAgcHJpdmF0ZUFkZChkOiBVaW50OEFycmF5LCB0d2VhazogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkgfCBudWxsO1xyXG4gIHByaXZhdGVOZWdhdGUoZDogVWludDhBcnJheSk6IFVpbnQ4QXJyYXk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZ2dyZWdhdGVzIGEgbGlzdCBvZiBwdWJsaWMga2V5cyBpbnRvIGEgc2luZ2xlIE11U2lnMiogcHVibGljIGtleVxyXG4gKiBhY2NvcmRpbmcgdG8gdGhlIE11U2lnMiBwYXBlci5cclxuICogQHBhcmFtIGVjYyBFbGxpcHRpYyBjdXJ2ZSBpbXBsZW1lbnRhdGlvblxyXG4gKiBAcGFyYW0gcHVia2V5cyBUaGUgbGlzdCBvZiBwdWIga2V5cyB0byBhZ2dyZWdhdGVcclxuICogQHJldHVybnMgYSAzMiBieXRlIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIGFnZ3JlZ2F0ZSBrZXlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZ2dyZWdhdGVNdVNpZ1B1YmtleXMoZWNjOiBUaW55U2VjcDI1NmsxSW50ZXJmYWNlLCBwdWJrZXlzOiBCdWZmZXJbXSk6IFVpbnQ4QXJyYXkge1xyXG4gIC8vIFRPRE86IENvbnNpZGVyIGVuZm9yY2luZyBrZXkgdW5pcXVlbmVzcy5cclxuICBhc3NlcnQocHVia2V5cy5sZW5ndGggPiAxLCAnYXQgbGVhc3QgdHdvIHB1YmtleXMgYXJlIHJlcXVpcmVkIGZvciBtdXNpZyBrZXkgYWdncmVnYXRpb24nKTtcclxuXHJcbiAgLy8gU29ydCB0aGUga2V5cyBpbiBhc2NlbmRpbmcgb3JkZXJcclxuICBwdWJrZXlzLnNvcnQoQnVmZmVyLmNvbXBhcmUpO1xyXG5cclxuICAvLyBJbiBNdVNpZyBhbGwgc2lnbmVycyBjb250cmlidXRlIGtleSBtYXRlcmlhbCB0byBhIHNpbmdsZSBzaWduaW5nIGtleSxcclxuICAvLyB1c2luZyB0aGUgZXF1YXRpb25cclxuICAvL1xyXG4gIC8vICAgICBQID0gc3VtX2kgwrVfaSAqIFBfaVxyXG4gIC8vXHJcbiAgLy8gd2hlcmUgYFBfaWAgaXMgdGhlIHB1YmxpYyBrZXkgb2YgdGhlIGBpYHRoIHNpZ25lciBhbmQgYMK1X2lgIGlzIGEgc28tY2FsbGVkXHJcbiAgLy8gX011U2lnIGNvZWZmaWNpZW50XyBjb21wdXRlZCBhY2NvcmRpbmcgdG8gdGhlIGZvbGxvd2luZyBlcXVhdGlvblxyXG4gIC8vXHJcbiAgLy8gTCA9IEgoUF8xIHx8IFBfMiB8fCAuLi4gfHwgUF9uKVxyXG4gIC8vIMK1X2kgPSBIKEwgfHwgUF9pKVxyXG5cclxuICBjb25zdCBMID0gYmNyeXB0by50YWdnZWRIYXNoKCdLZXlBZ2cgbGlzdCcsIEJ1ZmZlci5jb25jYXQocHVia2V5cykpO1xyXG5cclxuICBjb25zdCBzZWNvbmRVbmlxdWVQdWJrZXkgPSBwdWJrZXlzLmZpbmQoKHB1YmtleSkgPT4gIXB1YmtleXNbMF0uZXF1YWxzKHB1YmtleSkpO1xyXG5cclxuICBjb25zdCB0d2Vha2VkUHVia2V5czogVWludDhBcnJheVtdID0gcHVia2V5cy5tYXAoKHB1YmtleSkgPT4ge1xyXG4gICAgY29uc3QgeHlQdWJrZXkgPSBCdWZmZXIuY29uY2F0KFtFVkVOX1lfQ09PUkRfUFJFRklYLCBwdWJrZXldKTtcclxuXHJcbiAgICBpZiAoc2Vjb25kVW5pcXVlUHVia2V5ICE9PSB1bmRlZmluZWQgJiYgc2Vjb25kVW5pcXVlUHVia2V5LmVxdWFscyhwdWJrZXkpKSB7XHJcbiAgICAgIC8vIFRoZSBzZWNvbmQgdW5pcXVlIGtleSBpbiB0aGUgcHVia2V5IGxpc3QgZ2l2ZW4gdG8gJydLZXlBZ2cnJyAoYXMgd2VsbFxyXG4gICAgICAvLyBhcyBhbnkga2V5cyBpZGVudGljYWwgdG8gdGhpcyBrZXkpIGdldHMgdGhlIGNvbnN0YW50IEtleUFnZ1xyXG4gICAgICAvLyBjb2VmZmljaWVudCAxIHdoaWNoIHNhdmVzIGFuIGV4cG9uZW50aWF0aW9uIChzZWUgdGhlIE11U2lnMiogYXBwZW5kaXhcclxuICAgICAgLy8gaW4gdGhlIE11U2lnMiBwYXBlcikuXHJcbiAgICAgIHJldHVybiB4eVB1YmtleTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjID0gYmNyeXB0by50YWdnZWRIYXNoKCdLZXlBZ2cgY29lZmZpY2llbnQnLCBCdWZmZXIuY29uY2F0KFtMLCBwdWJrZXldKSk7XHJcblxyXG4gICAgY29uc3QgdHdlYWtlZFB1YmtleSA9IGVjYy5wb2ludE11bHRpcGx5KHh5UHVia2V5LCBjKTtcclxuICAgIGlmICghdHdlYWtlZFB1YmtleSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBtdWx0aXBseSBwdWJrZXkgYnkgY29lZmZpY2llbnQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0d2Vha2VkUHVia2V5O1xyXG4gIH0pO1xyXG4gIGNvbnN0IGFnZ3JlZ2F0ZVB1YmtleSA9IHR3ZWFrZWRQdWJrZXlzLnJlZHVjZSgocHJldiwgY3VycikgPT4ge1xyXG4gICAgY29uc3QgbmV4dCA9IGVjYy5wb2ludEFkZChwcmV2LCBjdXJyKTtcclxuICAgIGlmICghbmV4dCkgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gc3VtIHB1YmtleXMnKTtcclxuICAgIHJldHVybiBuZXh0O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYWdncmVnYXRlUHVia2V5LnNsaWNlKDEpO1xyXG59XHJcblxyXG4vKipcclxuICogRW5jb2RlcyB0aGUgbGVuZ3RoIG9mIGEgc2NyaXB0IGFzIGEgYml0Y29pbiB2YXJpYWJsZSBsZW5ndGggaW50ZWdlci5cclxuICogQHBhcmFtIHNjcmlwdFxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVNjcmlwdFNpemUoc2NyaXB0OiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gIHJldHVybiB2YXJ1aW50LmVuY29kZShzY3JpcHQubGVuZ3RoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSB0YXBsZWFmIHRhZ2dlZCBoYXNoIGZyb20gYSBzY3JpcHQuXHJcbiAqIEBwYXJhbSBzY3JpcHRcclxuICogQHJldHVybnNcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBoYXNoVGFwTGVhZihzY3JpcHQ6IEJ1ZmZlciwgbGVhZlZlcnNpb24gPSBJTklUSUFMX1RBUFNDUklQVF9WRVJTSU9OKTogQnVmZmVyIHtcclxuICBjb25zdCBzaXplID0gc2VyaWFsaXplU2NyaXB0U2l6ZShzY3JpcHQpO1xyXG4gIHJldHVybiBiY3J5cHRvLnRhZ2dlZEhhc2goJ1RhcExlYWYnLCBCdWZmZXIuY29uY2F0KFtCdWZmZXIub2YobGVhZlZlcnNpb24pLCBzaXplLCBzY3JpcHRdKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbGV4aWNvZ3JhcGhpY2FsbHkgc29ydGVkIHRhcGJyYW5jaCBmcm9tIHR3byBjaGlsZCB0YXB0cmVlIG5vZGVzXHJcbiAqIGFuZCByZXR1cm5zIGl0cyB0YWdnZWQgaGFzaC5cclxuICogQHBhcmFtIGNoaWxkMVxyXG4gKiBAcGFyYW0gY2hpbGQyXHJcbiAqIEByZXR1cm5zIHRoZSB0YWdnZWQgdGFwYnJhbmNoIGhhc2hcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBoYXNoVGFwQnJhbmNoKGNoaWxkMTogQnVmZmVyLCBjaGlsZDI6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgLy8gc29ydCB0aGUgY2hpbGRyZW4gbGV4aWNvZ3JhcGhpY2FsbHlcclxuICBjb25zdCBzb3J0ZWRDaGlsZHJlbiA9IFtjaGlsZDEsIGNoaWxkMl0uc29ydChCdWZmZXIuY29tcGFyZSk7XHJcblxyXG4gIHJldHVybiBiY3J5cHRvLnRhZ2dlZEhhc2goJ1RhcEJyYW5jaCcsIEJ1ZmZlci5jb25jYXQoc29ydGVkQ2hpbGRyZW4pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZVRhcFR3ZWFrKHB1YmtleTogVWludDhBcnJheSwgdGFwdHJlZVJvb3Q/OiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XHJcbiAgaWYgKHB1YmtleS5sZW5ndGggIT09IDMyKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcHVia2V5IHNpemUgJHtwdWJrZXkubGVuZ3RofS5gKTtcclxuICB9XHJcbiAgaWYgKHRhcHRyZWVSb290KSB7XHJcbiAgICBpZiAodGFwdHJlZVJvb3QubGVuZ3RoICE9PSAzMikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdGFwdHJlZVJvb3Qgc2l6ZSAke3RhcHRyZWVSb290Lmxlbmd0aH0uYCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmNyeXB0by50YWdnZWRIYXNoKCdUYXBUd2VhaycsIEJ1ZmZlci5jb25jYXQoW3B1YmtleSwgdGFwdHJlZVJvb3RdKSk7XHJcbiAgfVxyXG4gIC8vIElmIHRoZSBzcGVuZGluZyBjb25kaXRpb25zIGRvIG5vdCByZXF1aXJlIGEgc2NyaXB0IHBhdGgsIHRoZSBvdXRwdXQga2V5IHNob3VsZCBjb21taXQgdG8gYW5cclxuICAvLyB1bnNwZW5kYWJsZSBzY3JpcHQgcGF0aCBpbnN0ZWFkIG9mIGhhdmluZyBubyBzY3JpcHQgcGF0aC5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXBzL2Jsb2IvbWFzdGVyL2JpcC0wMzQxLm1lZGlhd2lraSNjaXRlX25vdGUtMjJcclxuICByZXR1cm4gYmNyeXB0by50YWdnZWRIYXNoKCdUYXBUd2VhaycsIEJ1ZmZlci5mcm9tKHB1YmtleSkpO1xyXG59XHJcblxyXG4vKipcclxuICogVHdlYWtzIGEgcHJpdmtleSwgdXNpbmcgdGhlIHRhZ2dlZCBoYXNoIG9mIGl0cyBwdWJrZXksIGFuZCAob3B0aW9uYWxseSkgYSB0YXB0cmVlIHJvb3RcclxuICogQHBhcmFtIGVjYyBFbGxpcHRpYyBjdXJ2ZSBpbXBsZW1lbnRhdGlvblxyXG4gKiBAcGFyYW0gcHVia2V5IHB1YmxpYyBrZXksIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSB0d2Vha1xyXG4gKiBAcGFyYW0gcHJpdmtleSB0aGUgcHJpdmtleSB0byB0d2Vha1xyXG4gKiBAcGFyYW0gdGFwdHJlZVJvb3QgdGhlIHRhcHRyZWUgcm9vdCB0YWdnZWQgaGFzaFxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSB0aGUgdHdlYWtlZCBwcml2a2V5XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGFwVHdlYWtQcml2a2V5KFxyXG4gIGVjYzogVGlueVNlY3AyNTZrMUludGVyZmFjZSxcclxuICBwdWJrZXk6IFVpbnQ4QXJyYXksXHJcbiAgcHJpdmtleTogVWludDhBcnJheSxcclxuICB0YXB0cmVlUm9vdD86IFVpbnQ4QXJyYXlcclxuKTogVWludDhBcnJheSB7XHJcbiAgY29uc3QgdGFwVHdlYWsgPSBjYWxjdWxhdGVUYXBUd2VhayhwdWJrZXksIHRhcHRyZWVSb290KTtcclxuXHJcbiAgY29uc3QgcG9pbnQgPSBlY2MucG9pbnRGcm9tU2NhbGFyKHByaXZrZXkpO1xyXG4gIGlmICghcG9pbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcml2YXRlIGtleScpO1xyXG4gIGlmIChwb2ludFswXSAlIDIgPT09IDEpIHByaXZrZXkgPSBlY2MucHJpdmF0ZU5lZ2F0ZShwcml2a2V5KTtcclxuICBjb25zdCByZXN1bHQgPSBlY2MucHJpdmF0ZUFkZChwcml2a2V5LCB0YXBUd2Vhayk7XHJcbiAgaWYgKCFyZXN1bHQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcml2YXRlIGtleScpO1xyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgWE9ubHlQb2ludEFkZFR3ZWFrUmVzdWx0IHtcclxuICBwYXJpdHk6IDEgfCAwO1xyXG4gIHhPbmx5UHVia2V5OiBVaW50OEFycmF5O1xyXG59XHJcblxyXG4vKipcclxuICogVHdlYWtzIGFuIGludGVybmFsIHB1YmtleSwgdXNpbmcgdGhlIHRhZ2dlZCBoYXNoIG9mIGl0c2VsZiwgYW5kIChvcHRpb25hbGx5KSBhIHRhcHRyZWUgcm9vdFxyXG4gKiBAcGFyYW0gZWNjIEVsbGlwdGljIGN1cnZlIGltcGxlbWVudGF0aW9uXHJcbiAqIEBwYXJhbSBwdWJrZXkgdGhlIGludGVybmFsIHB1YmtleSB0byB0d2Vha1xyXG4gKiBAcGFyYW0gdGFwdHJlZVJvb3QgdGhlIHRhcHRyZWUgcm9vdCB0YWdnZWQgaGFzaFxyXG4gKiBAcmV0dXJucyB7VHdlYWtlZFB1YmtleX0gdGhlIHR3ZWFrZWQgcHVia2V5XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGFwVHdlYWtQdWJrZXkoXHJcbiAgZWNjOiBUaW55U2VjcDI1NmsxSW50ZXJmYWNlLFxyXG4gIHB1YmtleTogVWludDhBcnJheSxcclxuICB0YXB0cmVlUm9vdD86IEJ1ZmZlclxyXG4pOiBYT25seVBvaW50QWRkVHdlYWtSZXN1bHQge1xyXG4gIGNvbnN0IHRhcFR3ZWFrID0gY2FsY3VsYXRlVGFwVHdlYWsocHVia2V5LCB0YXB0cmVlUm9vdCk7XHJcbiAgY29uc3QgcmVzdWx0ID0gZWNjLnhPbmx5UG9pbnRBZGRUd2VhayhwdWJrZXksIHRhcFR3ZWFrKTtcclxuICBpZiAoIXJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHB1YmtleScpO1xyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVGFwdHJlZSB7XHJcbiAgcm9vdDogQnVmZmVyO1xyXG4gIHBhdGhzOiBCdWZmZXJbXVtdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgV2VpZ2h0ZWRUYXBTY3JpcHQge1xyXG4gIC8qKiBBIFRhcExlYWYgb3IgVGFwQnJhbmNoIHRhZ2dlZCBoYXNoICovXHJcbiAgdGFnZ2VkSGFzaDogQnVmZmVyO1xyXG4gIHdlaWdodDogbnVtYmVyO1xyXG4gIHBhdGhzOiB7XHJcbiAgICBbaW5kZXg6IG51bWJlcl06IEJ1ZmZlcltdO1xyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlY3Vyc2VUYXB0cmVlKGxlYXZlczogSXRlcmF0b3I8W251bWJlciwgUHNidFRhcExlYWZdPiwgdGFyZ2V0RGVwdGggPSAwKTogVGFwdHJlZSB7XHJcbiAgY29uc3QgeyB2YWx1ZSwgZG9uZSB9ID0gbGVhdmVzLm5leHQoKTtcclxuICBhc3NlcnQoIWRvbmUsICdpbnN1ZmZpY2llbnQgbGVhdmVzIHRvIHJlY29uc3RydWN0IHRhcCB0cmVlJyk7XHJcbiAgY29uc3QgW2luZGV4LCBsZWFmXSA9IHZhbHVlO1xyXG4gIGNvbnN0IHRyZWU6IFRhcHRyZWUgPSB7XHJcbiAgICByb290OiBoYXNoVGFwTGVhZihsZWFmLnNjcmlwdCwgbGVhZi5sZWFmVmVyc2lvbiksXHJcbiAgICBwYXRoczogW10sXHJcbiAgfTtcclxuICB0cmVlLnBhdGhzW2luZGV4XSA9IFtdO1xyXG4gIGZvciAobGV0IGRlcHRoID0gbGVhZi5kZXB0aDsgZGVwdGggPiB0YXJnZXREZXB0aDsgZGVwdGgtLSkge1xyXG4gICAgY29uc3Qgc2libGluZyA9IHJlY3Vyc2VUYXB0cmVlKGxlYXZlcywgZGVwdGgpO1xyXG4gICAgdHJlZS5wYXRocy5mb3JFYWNoKChwYXRoKSA9PiBwYXRoLnB1c2goc2libGluZy5yb290KSk7XHJcbiAgICBzaWJsaW5nLnBhdGhzLmZvckVhY2goKHBhdGgpID0+IHBhdGgucHVzaCh0cmVlLnJvb3QpKTtcclxuICAgIHRyZWUucm9vdCA9IGhhc2hUYXBCcmFuY2godHJlZS5yb290LCBzaWJsaW5nLnJvb3QpO1xyXG4gICAgLy8gTWVyZ2UgZGlzam9pbnQgc3BhcnNlIGFycmF5cyBvZiBwYXRocyBpbnRvIHRyZWUucGF0aHNcclxuICAgIE9iamVjdC5hc3NpZ24odHJlZS5wYXRocywgc2libGluZy5wYXRocyk7XHJcbiAgfVxyXG4gIHJldHVybiB0cmVlO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgcm9vdCBoYXNoIGFuZCBoYXNoLXBhdGhzIG9mIGEgdGFwdHJlZSBmcm9tIHRoZSBkZXB0aC1maXJzdFxyXG4gKiBjb25zdHJ1Y3Rpb24gdXNlZCBpbiBCSVAtMDM3MSBQU0JUc1xyXG4gKiBAcGFyYW0gdHJlZVxyXG4gKiBAcmV0dXJucyB7VGFwdHJlZX0gdGhlIHRyZWUsIHJlcHJlc2VudGVkIGJ5IGl0cyByb290IGhhc2gsIGFuZCB0aGUgcGF0aHMgdG9cclxuICogdGhhdCByb290IGZyb20gZWFjaCBvZiB0aGUgaW5wdXQgc2NyaXB0c1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERlcHRoRmlyc3RUYXB0cmVlKHRyZWU6IFBzYnRUYXBUcmVlKTogVGFwdHJlZSB7XHJcbiAgY29uc3QgaXRlciA9IHRyZWUubGVhdmVzLmVudHJpZXMoKTtcclxuICBjb25zdCByZXQgPSByZWN1cnNlVGFwdHJlZShpdGVyKTtcclxuICBhc3NlcnQoaXRlci5uZXh0KCkuZG9uZSwgJ2ludmFsaWQgdGFwIHRyZWUsIG5vIHBhdGggdG8gc29tZSBsZWF2ZXMnKTtcclxuICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgcm9vdCBoYXNoIG9mIGEgdGFwdHJlZSB1c2luZyBhIHdlaWdodGVkIEh1ZmZtYW4gY29uc3RydWN0aW9uIGZyb20gYVxyXG4gKiBsaXN0IG9mIHNjcmlwdHMgYW5kIGNvcnJlc3BvbmRpbmcgd2VpZ2h0cy5cclxuICogQHBhcmFtIHNjcmlwdHNcclxuICogQHBhcmFtIHdlaWdodHNcclxuICogQHJldHVybnMge1RhcHRyZWV9IHRoZSB0cmVlLCByZXByZXNlbnRlZCBieSBpdHMgcm9vdCBoYXNoLCBhbmQgdGhlIHBhdGhzIHRvIHRoYXQgcm9vdCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0IHNjcmlwdHNcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRIdWZmbWFuVGFwdHJlZShzY3JpcHRzOiBCdWZmZXJbXSwgd2VpZ2h0czogQXJyYXk8bnVtYmVyIHwgdW5kZWZpbmVkPik6IFRhcHRyZWUge1xyXG4gIGFzc2VydChzY3JpcHRzLmxlbmd0aCA+IDAsICdhdCBsZWFzdCBvbmUgc2NyaXB0IGlzIHJlcXVpcmVkIHRvIGNvbnN0cnVjdCBhIHRhcCB0cmVlJyk7XHJcblxyXG4gIC8vIENyZWF0ZSBhIHF1ZXVlL2hlYXAgb2YgdGhlIHByb3ZpZGVkIHNjcmlwdHMgcHJpb3JpdGl6ZWQgYWNjb3JkaW5nIHRvIHRoZWlyXHJcbiAgLy8gY29ycmVzcG9uZGluZyB3ZWlnaHRzLlxyXG4gIGNvbnN0IHF1ZXVlID0gbmV3IEZhc3RQcmlvcml0eVF1ZXVlPFdlaWdodGVkVGFwU2NyaXB0PigoYSwgYik6IGJvb2xlYW4gPT4ge1xyXG4gICAgcmV0dXJuIGEud2VpZ2h0IDwgYi53ZWlnaHQ7XHJcbiAgfSk7XHJcbiAgc2NyaXB0cy5mb3JFYWNoKChzY3JpcHQsIGluZGV4KSA9PiB7XHJcbiAgICBjb25zdCB3ZWlnaHQgPSB3ZWlnaHRzW2luZGV4XSB8fCAxO1xyXG4gICAgYXNzZXJ0KHdlaWdodCA+IDAsICdzY3JpcHQgd2VpZ2h0IG11c3QgYmUgYSBwb3NpdGl2ZSB2YWx1ZScpO1xyXG5cclxuICAgIHF1ZXVlLmFkZCh7XHJcbiAgICAgIHdlaWdodCxcclxuICAgICAgdGFnZ2VkSGFzaDogaGFzaFRhcExlYWYoc2NyaXB0KSxcclxuICAgICAgcGF0aHM6IHsgW2luZGV4XTogW10gfSxcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGEgcXVldWUgb2Ygd2VpZ2h0ZWQgc2NyaXB0cywgd2UgYmVnaW4gYSBsb29wIHdoZXJlYnkgd2VcclxuICAvLyByZW1vdmUgdGhlIHR3byBsb3dlc3Qgd2VpZ2h0ZWQgaXRlbXMgZnJvbSB0aGUgcXVldWUuIFdlIGNyZWF0ZSBhIHRhcCBicmFuY2hcclxuICAvLyBub2RlIGZyb20gdGhlIHR3byBpdGVtcywgYW5kIGFkZCB0aGUgYnJhbmNoIGJhY2sgdG8gdGhlIHF1ZXVlIHdpdGggdGhlXHJcbiAgLy8gY29tYmluZWQgd2VpZ2h0IG9mIGJvdGggaXRzIGNoaWxkcmVuLiBFYWNoIGxvb3AgcmVkdWNlcyB0aGUgbnVtYmVyIG9mIGl0ZW1zXHJcbiAgLy8gaW4gdGhlIHF1ZXVlIGJ5IG9uZSwgYW5kIHdlIHJlcGVhdCB1bnRpbCB3ZSBhcmUgbGVmdCB3aXRoIG9ubHkgb25lIGl0ZW0gLVxyXG4gIC8vIHRoaXMgYmVjb21lcyB0aGUgdGFwIHRyZWUgcm9vdC5cclxuICAvL1xyXG4gIC8vIEZvciBleGFtcGxlLCBpZiB3ZSBiZWdpbiB3aXRoIHNjcmlwdHMgQSwgQiwgQywgRCB3aXRoIHdlaWdodHMgNiwgMywgMSwgMVxyXG4gIC8vIEFmdGVyIGZpcnN0IGxvb3A6IEEoNiksIEIoMyksIENEKDEgKyAxKVxyXG4gIC8vIEFmdGVyIHNlY29uZCBsb29wOiBBKDYpLCBCW0NEXSgzICsgMilcclxuICAvLyBGaW5hbCBsb29wOiBBW0JbQ0RdXSg2KzUpXHJcbiAgLy8gVGhlIGZpbmFsIHRyZWUgd2lsbCBsb29rIGxpa2U6XHJcbiAgLy9cclxuICAvLyAgICAgICAgQVtCW0NEXV1cclxuICAvLyAgICAgICAvICAgICAgICBcXFxyXG4gIC8vICAgICAgQSAgICAgICAgIEJbQ0RdXHJcbiAgLy8gICAgICAgICAgICAgICAvICAgICBcXFxyXG4gIC8vICAgICAgICAgICAgICBCICAgICAgW0NEXVxyXG4gIC8vICAgICAgICAgICAgICAgICAgICAvICAgIFxcXHJcbiAgLy8gICAgICAgICAgICAgICAgICAgQyAgICAgIERcclxuICAvL1xyXG4gIC8vIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBzcGVuZGluZyBjb25kaXRpb25zIHdlIGJlbGlldmUgdG8gaGF2ZSB0aGUgaGlnaGVzdFxyXG4gIC8vIHByb2JhYmlsaXR5IG9mIGJlaW5nIHVzZWQgYXJlIGZ1cnRoZXIgdXAgdGhlIHRyZWUgdGhhbiBsZXNzIGxpa2VseSBzY3JpcHRzLFxyXG4gIC8vIHRoZXJlYnkgcmVkdWNpbmcgdGhlIHNpemUgb2YgdGhlIG1lcmtsZSBwcm9vZnMgZm9yIHRoZSBtb3JlIGxpa2VseSBzY3JpcHRzLlxyXG4gIHdoaWxlIChxdWV1ZS5zaXplID4gMSkge1xyXG4gICAgLy8gV2UgY2FuIHNhZmVseSBleHBlY3QgdHdvIHBvbGxzIHRvIHJldHVybiBub24tbnVsbCBlbGVtZW50cyBzaW5jZSB3ZSd2ZVxyXG4gICAgLy8gY2hlY2tlZCB0aGF0IHRoZSBxdWV1ZSBoYXMgYXQgbGVhc3QgdHdvIGVsZW1lbnRzIGJlZm9yZSBsb29waW5nLlxyXG4gICAgY29uc3QgY2hpbGQxID0gcXVldWUucG9sbCgpIGFzIFdlaWdodGVkVGFwU2NyaXB0O1xyXG4gICAgY29uc3QgY2hpbGQyID0gcXVldWUucG9sbCgpIGFzIFdlaWdodGVkVGFwU2NyaXB0O1xyXG5cclxuICAgIE9iamVjdC52YWx1ZXMoY2hpbGQxLnBhdGhzKS5mb3JFYWNoKChwYXRoKSA9PiBwYXRoLnB1c2goY2hpbGQyLnRhZ2dlZEhhc2gpKTtcclxuICAgIE9iamVjdC52YWx1ZXMoY2hpbGQyLnBhdGhzKS5mb3JFYWNoKChwYXRoKSA9PiBwYXRoLnB1c2goY2hpbGQxLnRhZ2dlZEhhc2gpKTtcclxuXHJcbiAgICBxdWV1ZS5hZGQoe1xyXG4gICAgICB0YWdnZWRIYXNoOiBoYXNoVGFwQnJhbmNoKGNoaWxkMS50YWdnZWRIYXNoLCBjaGlsZDIudGFnZ2VkSGFzaCksXHJcbiAgICAgIHdlaWdodDogY2hpbGQxLndlaWdodCArIGNoaWxkMi53ZWlnaHQsXHJcbiAgICAgIHBhdGhzOiB7IC4uLmNoaWxkMS5wYXRocywgLi4uY2hpbGQyLnBhdGhzIH0sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIEFmdGVyIHRoZSB3aGlsZSBsb29wIGFib3ZlIGNvbXBsZXRlcyB3ZSBzaG91bGQgaGF2ZSBleGFjdGx5IG9uZSBlbGVtZW50XHJcbiAgLy8gcmVtYWluaW5nIGluIHRoZSBxdWV1ZSwgd2hpY2ggd2UgY2FuIHNhZmVseSBleHRyYWN0IGJlbG93LlxyXG4gIGNvbnN0IHJvb3ROb2RlID0gcXVldWUucG9sbCgpIGFzIFdlaWdodGVkVGFwU2NyaXB0O1xyXG5cclxuICBjb25zdCBwYXRocyA9IE9iamVjdC5lbnRyaWVzKHJvb3ROb2RlLnBhdGhzKS5yZWR1Y2UoKGFjYywgW2luZGV4LCBwYXRoXSkgPT4ge1xyXG4gICAgYWNjW051bWJlcihpbmRleCldID0gcGF0aDsgLy8gVE9ETzogV2h5IGRvZXNuJ3QgVFMga25vdyBpdCdzIGEgbnVtYmVyP1xyXG4gICAgcmV0dXJuIGFjYztcclxuICB9LCBBcnJheShzY3JpcHRzLmxlbmd0aCkpO1xyXG4gIHJldHVybiB7IHJvb3Q6IHJvb3ROb2RlLnRhZ2dlZEhhc2gsIHBhdGhzIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250cm9sQmxvY2soXHJcbiAgcGFyaXR5OiAwIHwgMSxcclxuICBwdWJrZXk6IFVpbnQ4QXJyYXksXHJcbiAgcGF0aDogQnVmZmVyW10sXHJcbiAgbGVhZlZlcnNpb24gPSBJTklUSUFMX1RBUFNDUklQVF9WRVJTSU9OXHJcbik6IEJ1ZmZlciB7XHJcbiAgY29uc3QgcGFyaXR5VmVyc2lvbiA9IGxlYWZWZXJzaW9uICsgcGFyaXR5O1xyXG5cclxuICByZXR1cm4gQnVmZmVyLmNvbmNhdChbQnVmZmVyLm9mKHBhcml0eVZlcnNpb24pLCBwdWJrZXksIC4uLnBhdGhdKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBLZXlQYXRoV2l0bmVzcyB7XHJcbiAgc3BlbmRUeXBlOiAnS2V5JztcclxuICBzaWduYXR1cmU6IEJ1ZmZlcjtcclxuICBhbm5leD86IEJ1ZmZlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTY3JpcHRQYXRoV2l0bmVzcyB7XHJcbiAgc3BlbmRUeXBlOiAnU2NyaXB0JztcclxuICBzY3JpcHRTaWc6IEJ1ZmZlcltdO1xyXG4gIHRhcHNjcmlwdDogQnVmZmVyO1xyXG4gIGNvbnRyb2xCbG9jazogQnVmZmVyO1xyXG4gIGFubmV4PzogQnVmZmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvbnRyb2xCbG9jayB7XHJcbiAgcGFyaXR5OiBudW1iZXI7XHJcbiAgaW50ZXJuYWxQdWJrZXk6IEJ1ZmZlcjtcclxuICBsZWFmVmVyc2lvbjogbnVtYmVyO1xyXG4gIHBhdGg6IEJ1ZmZlcltdO1xyXG59XHJcblxyXG4vKipcclxuICogUGFyc2VzIGEgdGFwcm9vdCB3aXRuZXNzIHN0YWNrIGFuZCBleHRyYWN0cyBrZXkgZGF0YSBlbGVtZW50cy5cclxuICogQHBhcmFtIHdpdG5lc3NTdGFja1xyXG4gKiBAcmV0dXJucyB7U2NyaXB0UGF0aFdpdG5lc3N8S2V5UGF0aFdpdG5lc3N9IGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlXHJcbiAqIHBhcnNlZCB3aXRuZXNzIGZvciBhIHNjcmlwdCBwYXRoIG9yIGtleSBwYXRoIHNwZW5kLlxyXG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhlIHdpdG5lc3Mgc3RhY2sgZG9lcyBub3QgY29uZm9ybSB0byB0aGUgQklQIDM0MSBzY3JpcHQgdmFsaWRhdGlvbiBydWxlc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGFwcm9vdFdpdG5lc3Mod2l0bmVzc1N0YWNrOiBCdWZmZXJbXSk6IFNjcmlwdFBhdGhXaXRuZXNzIHwgS2V5UGF0aFdpdG5lc3Mge1xyXG4gIGxldCBhbm5leDtcclxuICBpZiAod2l0bmVzc1N0YWNrLmxlbmd0aCA+PSAyICYmIHdpdG5lc3NTdGFja1t3aXRuZXNzU3RhY2subGVuZ3RoIC0gMV1bMF0gPT09IDB4NTApIHtcclxuICAgIC8vIElmIHRoZXJlIGFyZSBhdCBsZWFzdCB0d28gd2l0bmVzcyBlbGVtZW50cywgYW5kIHRoZSBmaXJzdCBieXRlIG9mIHRoZSBsYXN0IGVsZW1lbnQgaXNcclxuICAgIC8vIDB4NTAsIHRoaXMgbGFzdCBlbGVtZW50IGlzIGNhbGxlZCBhbm5leCBhIGFuZCBpcyByZW1vdmVkIGZyb20gdGhlIHdpdG5lc3Mgc3RhY2tcclxuICAgIGFubmV4ID0gd2l0bmVzc1N0YWNrW3dpdG5lc3NTdGFjay5sZW5ndGggLSAxXTtcclxuICAgIHdpdG5lc3NTdGFjayA9IHdpdG5lc3NTdGFjay5zbGljZSgwLCAtMSk7XHJcbiAgfVxyXG5cclxuICBpZiAod2l0bmVzc1N0YWNrLmxlbmd0aCA8IDEpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignd2l0bmVzcyBzdGFjayBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGVsZW1lbnQnKTtcclxuICB9IGVsc2UgaWYgKHdpdG5lc3NTdGFjay5sZW5ndGggPT09IDEpIHtcclxuICAgIC8vIGtleSBwYXRoIHNwZW5kXHJcbiAgICBjb25zdCBzaWduYXR1cmUgPSB3aXRuZXNzU3RhY2tbMF07XHJcbiAgICBpZiAoIWJzY3JpcHQuaXNDYW5vbmljYWxTY2hub3JyU2lnbmF0dXJlKHNpZ25hdHVyZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHNpZ25hdHVyZScpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgc3BlbmRUeXBlOiAnS2V5Jywgc2lnbmF0dXJlLCBhbm5leCB9O1xyXG4gIH1cclxuXHJcbiAgLy8gc2NyaXB0IHBhdGggc3BlbmRcclxuICAvLyBzZWNvbmQgdG8gbGFzdCBlbGVtZW50IGlzIHRoZSB0YXBzY3JpcHRcclxuICBjb25zdCB0YXBzY3JpcHQgPSB3aXRuZXNzU3RhY2tbd2l0bmVzc1N0YWNrLmxlbmd0aCAtIDJdO1xyXG4gIGNvbnN0IHRhcHNjcmlwdENodW5rcyA9IGJzY3JpcHQuZGVjb21waWxlKHRhcHNjcmlwdCk7XHJcblxyXG4gIGlmICghdGFwc2NyaXB0Q2h1bmtzIHx8IHRhcHNjcmlwdENodW5rcy5sZW5ndGggPT09IDApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcigndGFwc2NyaXB0IGlzIG5vdCBhIHZhbGlkIHNjcmlwdCcpO1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIGxhc3Qgc3RhY2sgZWxlbWVudCBpcyBjYWxsZWQgdGhlIGNvbnRyb2wgYmxvY2sgYywgYW5kIG11c3QgaGF2ZSBsZW5ndGggMzMgKyAzMm0sXHJcbiAgLy8gZm9yIGEgdmFsdWUgb2YgbSB0aGF0IGlzIGFuIGludGVnZXIgYmV0d2VlbiAwIGFuZCAxMjgsIGluY2x1c2l2ZVxyXG4gIGNvbnN0IGNvbnRyb2xCbG9jayA9IHdpdG5lc3NTdGFja1t3aXRuZXNzU3RhY2subGVuZ3RoIC0gMV07XHJcbiAgaWYgKGNvbnRyb2xCbG9jay5sZW5ndGggPCAzMyB8fCBjb250cm9sQmxvY2subGVuZ3RoID4gMzMgKyAzMiAqIDEyOCB8fCBjb250cm9sQmxvY2subGVuZ3RoICUgMzIgIT09IDEpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBjb250cm9sIGJsb2NrIGxlbmd0aCcpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHNwZW5kVHlwZTogJ1NjcmlwdCcsXHJcbiAgICBzY3JpcHRTaWc6IHdpdG5lc3NTdGFjay5zbGljZSgwLCAtMiksXHJcbiAgICB0YXBzY3JpcHQsXHJcbiAgICBjb250cm9sQmxvY2ssXHJcbiAgICBhbm5leCxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogUGFyc2VzIGEgdGFwcm9vdCBjb250cm9sIGJsb2NrLlxyXG4gKiBAcGFyYW0gZWNjIEVsbGlwdGljIGN1cnZlIGltcGxlbWVudGF0aW9uXHJcbiAqIEBwYXJhbSBjb250cm9sQmxvY2sgdGhlIGNvbnRyb2wgYmxvY2sgdG8gcGFyc2VcclxuICogQHJldHVybnMge0NvbnRyb2xCbG9ja30gdGhlIHBhcnNlZCBjb250cm9sIGJsb2NrXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiB0aGUgd2l0bmVzcyBzdGFjayBkb2VzIG5vdCBjb25mb3JtIHRvIHRoZSBCSVAgMzQxIHNjcmlwdCB2YWxpZGF0aW9uIHJ1bGVzXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb250cm9sQmxvY2soZWNjOiBUaW55U2VjcDI1NmsxSW50ZXJmYWNlLCBjb250cm9sQmxvY2s6IEJ1ZmZlcik6IENvbnRyb2xCbG9jayB7XHJcbiAgaWYgKChjb250cm9sQmxvY2subGVuZ3RoIC0gMSkgJSAzMiAhPT0gMCkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjb250cm9sIGJsb2NrIGxlbmd0aCcpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGFyaXR5ID0gY29udHJvbEJsb2NrWzBdICYgMHgwMTtcclxuXHJcbiAgLy8gTGV0IHAgPSBjWzE6MzNdIGFuZCBsZXQgUCA9IGxpZnRfeChpbnQocCkpIHdoZXJlIGxpZnRfeCBhbmQgWzpdIGFyZSBkZWZpbmVkIGFzIGluIEJJUDM0MC5cclxuICAvLyBGYWlsIGlmIHRoaXMgcG9pbnQgaXMgbm90IG9uIHRoZSBjdXJ2ZVxyXG4gIGNvbnN0IGludGVybmFsUHVia2V5ID0gY29udHJvbEJsb2NrLnNsaWNlKDEsIDMzKTtcclxuICBpZiAoIWVjYy5pc1hPbmx5UG9pbnQoaW50ZXJuYWxQdWJrZXkpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludGVybmFsIHB1YmtleSBpcyBub3QgYW4gRUMgcG9pbnQnKTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBsZWFmIHZlcnNpb24gY2Fubm90IGJlIDB4NTAgYXMgdGhhdCB3b3VsZCByZXN1bHQgaW4gYW1iaWd1aXR5IHdpdGggdGhlIGFubmV4LlxyXG4gIGNvbnN0IGxlYWZWZXJzaW9uID0gY29udHJvbEJsb2NrWzBdICYgMHhmZTtcclxuICBpZiAobGVhZlZlcnNpb24gPT09IDB4NTApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBsZWFmIHZlcnNpb24nKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhdGg6IEJ1ZmZlcltdID0gW107XHJcbiAgZm9yIChsZXQgaiA9IDMzOyBqIDwgY29udHJvbEJsb2NrLmxlbmd0aDsgaiArPSAzMikge1xyXG4gICAgcGF0aC5wdXNoKGNvbnRyb2xCbG9jay5zbGljZShqLCBqICsgMzIpKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwYXJpdHksXHJcbiAgICBpbnRlcm5hbFB1YmtleSxcclxuICAgIGxlYWZWZXJzaW9uLFxyXG4gICAgcGF0aCxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgdGFwbGVhZiBoYXNoIGZyb20gYSBjb250cm9sIGJsb2NrIGFuZCBzY3JpcHQuXHJcbiAqIEBwYXJhbSBlY2MgRWxsaXB0aWMgY3VydmUgaW1wbGVtZW50YXRpb25cclxuICogQHBhcmFtIGNvbnRyb2xCbG9jayB0aGUgY29udHJvbCBibG9jaywgZWl0aGVyIHJhdyBvciBwYXJzZWRcclxuICogQHBhcmFtIHRhcHNjcmlwdCB0aGUgbGVhZiBzY3JpcHQgY29ycmVzZHBvbmRpbmcgdG8gdGhlIGNvbnRyb2wgYmxvY2tcclxuICogQHJldHVybnMge0J1ZmZlcn0gdGhlIHRhcGxlYWYgaGFzaFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhcGxlYWZIYXNoKFxyXG4gIGVjYzogVGlueVNlY3AyNTZrMUludGVyZmFjZSxcclxuICBjb250cm9sQmxvY2s6IEJ1ZmZlciB8IENvbnRyb2xCbG9jayxcclxuICB0YXBzY3JpcHQ6IEJ1ZmZlclxyXG4pOiBCdWZmZXIge1xyXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoY29udHJvbEJsb2NrKSkge1xyXG4gICAgY29udHJvbEJsb2NrID0gcGFyc2VDb250cm9sQmxvY2soZWNjLCBjb250cm9sQmxvY2spO1xyXG4gIH1cclxuICBjb25zdCB7IGxlYWZWZXJzaW9uIH0gPSBjb250cm9sQmxvY2s7XHJcblxyXG4gIHJldHVybiBiY3J5cHRvLnRhZ2dlZEhhc2goXHJcbiAgICAnVGFwTGVhZicsXHJcbiAgICBCdWZmZXIuY29uY2F0KFtCdWZmZXIub2YobGVhZlZlcnNpb24pLCBzZXJpYWxpemVTY3JpcHRTaXplKHRhcHNjcmlwdCksIHRhcHNjcmlwdF0pXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIHRhcHRyZWUgcm9vdCBoYXNoIGZyb20gYSBjb250cm9sIGJsb2NrIGFuZCBzY3JpcHQuXHJcbiAqIEBwYXJhbSBlY2MgRWxsaXB0aWMgY3VydmUgaW1wbGVtZW50YXRpb25cclxuICogQHBhcmFtIGNvbnRyb2xCbG9jayB0aGUgY29udHJvbCBibG9jaywgZWl0aGVyIHJhdyBvciBwYXJzZWRcclxuICogQHBhcmFtIHRhcHNjcmlwdCB0aGUgbGVhZiBzY3JpcHQgY29ycmVzZHBvbmRpbmcgdG8gdGhlIGNvbnRyb2wgYmxvY2tcclxuICogQHBhcmFtIHRhcGxlYWZIYXNoIHRoZSBsZWFmIGhhc2ggaWYgYWxyZWFkeSBjYWxjdWxhdGVkXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ9IHRoZSB0YXB0cmVlIHJvb3QgaGFzaFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhcHRyZWVSb290KFxyXG4gIGVjYzogVGlueVNlY3AyNTZrMUludGVyZmFjZSxcclxuICBjb250cm9sQmxvY2s6IEJ1ZmZlciB8IENvbnRyb2xCbG9jayxcclxuICB0YXBzY3JpcHQ6IEJ1ZmZlcixcclxuICB0YXBsZWFmSGFzaD86IEJ1ZmZlclxyXG4pOiBCdWZmZXIge1xyXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoY29udHJvbEJsb2NrKSkge1xyXG4gICAgY29udHJvbEJsb2NrID0gcGFyc2VDb250cm9sQmxvY2soZWNjLCBjb250cm9sQmxvY2spO1xyXG4gIH1cclxuICBjb25zdCB7IHBhdGggfSA9IGNvbnRyb2xCbG9jaztcclxuXHJcbiAgdGFwbGVhZkhhc2ggPSB0YXBsZWFmSGFzaCB8fCBnZXRUYXBsZWFmSGFzaChlY2MsIGNvbnRyb2xCbG9jaywgdGFwc2NyaXB0KTtcclxuXHJcbiAgLy8gYHRhcHRyZWVNZXJrbGVIYXNoYCBiZWdpbnMgYXMgb3VyIHRhcHNjcmlwdCB0YXBsZWFmIGhhc2ggYW5kIGl0cyB2YWx1ZSBpdGVyYXRlc1xyXG4gIC8vIHRocm91Z2ggaXRzIHBhcmVudCB0YXBicmFuY2ggaGFzaGVzIHVudGlsIGl0IGVuZHMgdXAgYXMgdGhlIHRhcHRyZWUgcm9vdCBoYXNoXHJcbiAgbGV0IHRhcHRyZWVNZXJrbGVIYXNoID0gdGFwbGVhZkhhc2g7XHJcbiAgZm9yIChjb25zdCB0YXB0cmVlU2libGluZ0hhc2ggb2YgcGF0aCkge1xyXG4gICAgdGFwdHJlZU1lcmtsZUhhc2ggPVxyXG4gICAgICBCdWZmZXIuY29tcGFyZSh0YXB0cmVlTWVya2xlSGFzaCwgdGFwdHJlZVNpYmxpbmdIYXNoKSA9PT0gLTFcclxuICAgICAgICA/IGJjcnlwdG8udGFnZ2VkSGFzaCgnVGFwQnJhbmNoJywgQnVmZmVyLmNvbmNhdChbdGFwdHJlZU1lcmtsZUhhc2gsIHRhcHRyZWVTaWJsaW5nSGFzaF0pKVxyXG4gICAgICAgIDogYmNyeXB0by50YWdnZWRIYXNoKCdUYXBCcmFuY2gnLCBCdWZmZXIuY29uY2F0KFt0YXB0cmVlU2libGluZ0hhc2gsIHRhcHRyZWVNZXJrbGVIYXNoXSkpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRhcHRyZWVNZXJrbGVIYXNoO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHdlYWtlZE91dHB1dEtleShwYXltZW50OiBicGF5bWVudHMuUGF5bWVudCk6IEJ1ZmZlciB7XHJcbiAgYXNzZXJ0KHBheW1lbnQub3V0cHV0KTtcclxuICBpZiAocGF5bWVudC5vdXRwdXQubGVuZ3RoID09PSAzNCkge1xyXG4gICAgcmV0dXJuIHBheW1lbnQub3V0cHV0Py5zdWJhcnJheSgyKTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHAydHIgdHdlYWtlZCBvdXRwdXQga2V5IHNpemUgJHtwYXltZW50Lm91dHB1dC5sZW5ndGh9YCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJucyBvdXRwdXQgc2NyaXB0IGZvciBlaXRoZXIgc2NyaXB0IHBhdGggaW5wdXQgY29udHJvbEJsb2NrXHJcbiAqICYgbGVhZlNjcmlwdCBPUiBrZXkgcGF0aCBpbnB1dCBpbnRlcm5hbFB1YktleSAmIHRhcHRyZWVSb290XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGFwcm9vdE91dHB1dFNjcmlwdChcclxuICBwMnRyQXJnczogeyBpbnRlcm5hbFB1YktleTogQnVmZmVyOyB0YXB0cmVlUm9vdDogQnVmZmVyIH0gfCB7IGNvbnRyb2xCbG9jazogQnVmZmVyOyBsZWFmU2NyaXB0OiBCdWZmZXIgfVxyXG4pOiBCdWZmZXIge1xyXG4gIGxldCBpbnRlcm5hbFB1YktleTogQnVmZmVyIHwgdW5kZWZpbmVkO1xyXG4gIGxldCB0YXB0cmVlUm9vdDogQnVmZmVyIHwgdW5kZWZpbmVkO1xyXG4gIGlmICgnaW50ZXJuYWxQdWJLZXknIGluIHAydHJBcmdzKSB7XHJcbiAgICBpbnRlcm5hbFB1YktleSA9IHAydHJBcmdzLmludGVybmFsUHViS2V5O1xyXG4gICAgdGFwdHJlZVJvb3QgPSBwMnRyQXJncy50YXB0cmVlUm9vdDtcclxuICB9IGVsc2Uge1xyXG4gICAgaW50ZXJuYWxQdWJLZXkgPSBwYXJzZUNvbnRyb2xCbG9jayhlY2NMaWIsIHAydHJBcmdzLmNvbnRyb2xCbG9jaykuaW50ZXJuYWxQdWJrZXk7XHJcbiAgICB0YXB0cmVlUm9vdCA9IGdldFRhcHRyZWVSb290KGVjY0xpYiwgcDJ0ckFyZ3MuY29udHJvbEJsb2NrLCBwMnRyQXJncy5sZWFmU2NyaXB0KTtcclxuICB9XHJcbiAgY29uc3Qgb3V0cHV0S2V5ID0gdGFwVHdlYWtQdWJrZXkoZWNjTGliLCBpbnRlcm5hbFB1YktleSwgdGFwdHJlZVJvb3QpLnhPbmx5UHVia2V5O1xyXG4gIHJldHVybiBic2NyaXB0LmNvbXBpbGUoW2JzY3JpcHQuT1BTLk9QXzEsIEJ1ZmZlci5mcm9tKG91dHB1dEtleSldKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm5zIHgtb25seSB0YXByb290IG91dHB1dCBrZXkgKHRhcE91dHB1dEtleSlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXByb290T3V0cHV0S2V5KG91dHB1dFNjcmlwdDogQnVmZmVyIHwgKG51bWJlciB8IEJ1ZmZlcilbXSk6IEJ1ZmZlciB7XHJcbiAgY29uc3Qgb3V0cHV0RGVjb21waWxlZCA9IGJzY3JpcHQuZGVjb21waWxlKG91dHB1dFNjcmlwdCk7XHJcbiAgaWYgKG91dHB1dERlY29tcGlsZWQ/Lmxlbmd0aCAhPT0gMikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHRhcHJvb3Qgb3V0cHV0IHNjcmlwdCcpO1xyXG4gIH1cclxuICBjb25zdCBbb3AxLCBvdXRwdXRLZXldID0gb3V0cHV0RGVjb21waWxlZDtcclxuICBpZiAob3AxICE9PSBic2NyaXB0Lk9QUy5PUF8xIHx8ICFCdWZmZXIuaXNCdWZmZXIob3V0cHV0S2V5KSB8fCBvdXRwdXRLZXkubGVuZ3RoICE9PSAzMikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHRhcHJvb3Qgb3V0cHV0IHNjcmlwdCcpO1xyXG4gIH1cclxuICByZXR1cm4gb3V0cHV0S2V5O1xyXG59XHJcbiJdfQ==