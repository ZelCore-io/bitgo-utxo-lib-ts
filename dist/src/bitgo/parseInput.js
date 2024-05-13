"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePubScript = exports.parsePubScript2Of3 = exports.parseSignatureScript2Of3 = exports.parseSignatureScript = exports.getLeafVersion = exports.calculateScriptPathLevel = exports.isValidControlBock = exports.isPlaceholderSignature = void 0;
/* eslint no-redeclare: 0 */
const opcodes = require("bitcoin-ops");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const types_1 = require("./types");
const outputScripts_1 = require("./outputScripts");
function isPlaceholderSignature(v) {
    if (Buffer.isBuffer(v)) {
        return v.length === 0;
    }
    return v === 0;
}
exports.isPlaceholderSignature = isPlaceholderSignature;
/**
 * @return true iff P2TR script path's control block matches BitGo's need
 */
function isValidControlBock(controlBlock) {
    // The last stack element is called the control block c, and must have length 33 + 32m
    return Buffer.isBuffer(controlBlock) && 33 <= controlBlock.length && controlBlock.length % 32 === 1;
}
exports.isValidControlBock = isValidControlBock;
/**
 * @return script path level for P2TR control block
 */
function calculateScriptPathLevel(controlBlock) {
    if (!Buffer.isBuffer(controlBlock)) {
        throw new Error('Invalid control block type.');
    }
    if (controlBlock.length === 65) {
        return 1;
    }
    if (controlBlock.length === 97) {
        return 2;
    }
    throw new Error('unexpected control block length.');
}
exports.calculateScriptPathLevel = calculateScriptPathLevel;
/**
 * @return leaf version for P2TR control block.
 */
function getLeafVersion(controlBlock) {
    if (Buffer.isBuffer(controlBlock) && controlBlock.length > 0) {
        return controlBlock[0] & 0xfe;
    }
    throw new Error('unexpected leafVersion.');
}
exports.getLeafVersion = getLeafVersion;
function emptyMatchResult() {
    return {
        ':pubkey': [],
        ':pubkey-xonly': [],
        ':control-block': [],
        ':signature': [],
        ':script': [],
    };
}
class MatchError extends Error {
    constructor(message) {
        super(message);
        // this property is required to prohibit `return new Error()` when the return type demands `MatchError`
        this.__type = 'MatchError';
    }
    static forPatternElement(p) {
        if (typeof p === 'object' && ':script' in p) {
            return new MatchError(`error matching nested script`);
        }
        return new MatchError(`error matching ${p}`);
    }
}
/**
 * @param script
 * @param pattern
 * @return MatchResult if script matches pattern. The result will contain the matched values.
 */
function matchScript(script, pattern) {
    /**
     * Match a single script element with a ScriptPatternElement
     */
    function matchElement(e, p) {
        switch (p) {
            case 'OP_0':
                return e === opcodes.OP_0 || (Buffer.isBuffer(e) && e.length === 0);
            case 'OP_1':
            case 'OP_2':
            case 'OP_3':
            case 'OP_CHECKMULTISIG':
            case 'OP_CHECKSIG':
            case 'OP_CHECKSIGVERIFY':
                return e === opcodes[p];
            case ':pubkey':
                return Buffer.isBuffer(e) && (e.length === 33 || e.length === 65);
            case ':pubkey-xonly':
                return Buffer.isBuffer(e) && e.length === 32;
            case ':signature':
                return Buffer.isBuffer(e) || isPlaceholderSignature(e);
            case ':control-block':
                return Buffer.isBuffer(e) && isValidControlBock(e);
            default:
                throw new Error(`unknown pattern element ${p}`);
        }
    }
    if (script.length !== pattern.length) {
        return new MatchError(`length mismatch`);
    }
    // Go over each pattern element.
    // Collect captures into a result object.
    return pattern.reduce((obj, p, i) => {
        // if we had a previous mismatch, short-circuit
        if (obj instanceof MatchError) {
            return obj;
        }
        const e = script[i];
        // for ':script' pattern elements, decompile script element and recurse
        if (typeof p === 'object' && ':script' in p) {
            if (!Buffer.isBuffer(e)) {
                return new MatchError(`expected buffer for :script`);
            }
            const dec = bitcoinjs_lib_1.script.decompile(e);
            if (!dec) {
                return new MatchError(`error decompiling nested script`);
            }
            const match = matchScript(dec, p[':script']);
            if (match instanceof MatchError) {
                return match;
            }
            obj[':script'].push({
                buffer: e,
                match,
            });
            return obj;
        }
        const match = matchElement(e, p);
        if (!match) {
            return MatchError.forPatternElement(p);
        }
        // if pattern element is a capture, add it to the result obj
        if (p === ':signature' && e === 0) {
            obj[p].push(e);
        }
        else if (p in obj) {
            if (!Buffer.isBuffer(e)) {
                throw new Error(`invalid capture value`);
            }
            obj[p].push(e);
        }
        return obj;
    }, emptyMatchResult());
}
/**
 * @param script
 * @param patterns
 * @return first match
 */
function matchScriptSome(script, patterns) {
    for (const p of patterns) {
        const m = matchScript(script, p);
        if (m instanceof MatchError) {
            continue;
        }
        return m;
    }
    return new MatchError(`no match for script`);
}
function isLegacy(p) {
    return Boolean(p.script && !p.witness);
}
function isWrappedSegwit(p) {
    return Boolean(p.script && p.witness);
}
function isNativeSegwit(p) {
    return Boolean(!p.script && p.witness);
}
const parseP2shP2pk = (p) => {
    if (!isLegacy(p)) {
        return new MatchError(`expected legacy input`);
    }
    const match = matchScript(p.script, [':signature', { ':script': [':pubkey', 'OP_CHECKSIG'] }]);
    if (match instanceof MatchError) {
        return match;
    }
    return {
        scriptType: 'p2shP2pk',
        publicKeys: match[':script'][0].match[':pubkey'],
        signatures: match[':signature'],
    };
};
function parseP2ms(decScript, scriptType) {
    const pattern2Of3 = ['OP_2', ':pubkey', ':pubkey', ':pubkey', 'OP_3', 'OP_CHECKMULTISIG'];
    const match = matchScriptSome(decScript, [
        /* full-signed, no placeholder signature */
        ['OP_0', ':signature', ':signature', { ':script': pattern2Of3 }],
        /* half-signed, placeholder signatures */
        ['OP_0', ':signature', ':signature', ':signature', { ':script': pattern2Of3 }],
    ]);
    if (match instanceof MatchError) {
        return match;
    }
    const [redeemScript] = match[':script'];
    if (!(0, types_1.isTriple)(redeemScript.match[':pubkey'])) {
        throw new Error(`invalid pubkey count`);
    }
    return {
        scriptType,
        publicKeys: redeemScript.match[':pubkey'],
        pubScript: redeemScript.buffer,
        signatures: match[':signature'],
        redeemScript: scriptType === 'p2sh' ? redeemScript.buffer : undefined,
        witnessScript: scriptType === 'p2shP2wsh' || scriptType === 'p2wsh' ? redeemScript.buffer : undefined,
    };
}
const parseP2sh2Of3 = (p) => {
    if (!isLegacy(p)) {
        return new MatchError(`expected legacy input`);
    }
    return parseP2ms(p.script, 'p2sh');
};
const parseP2shP2wsh2Of3 = (p) => {
    if (!isWrappedSegwit(p)) {
        return new MatchError(`expected wrapped segwit input`);
    }
    return { ...parseP2ms(p.witness, 'p2shP2wsh'), redeemScript: p.script[0] };
};
const parseP2wsh2Of3 = (p) => {
    if (!isNativeSegwit(p)) {
        return new MatchError(`expected native segwit`);
    }
    return parseP2ms(p.witness, 'p2wsh');
};
const parseTaprootKeyPath2Of3 = (p) => {
    if (!isNativeSegwit(p)) {
        return new MatchError(`expected native segwit`);
    }
    const match = matchScript(p.witness, [':signature']);
    if (match instanceof MatchError) {
        return match;
    }
    const signatures = match[':signature'];
    if (isPlaceholderSignature(signatures[0])) {
        throw new Error(`invalid taproot key path signature`);
    }
    return {
        scriptType: 'taprootKeyPathSpend',
        signatures,
    };
};
const parseTaprootScriptPath2Of3 = (p) => {
    if (!isNativeSegwit(p)) {
        return new MatchError(`expected native segwit`);
    }
    // assumes no annex
    const match = matchScript(p.witness, [
        ':signature',
        ':signature',
        { ':script': [':pubkey-xonly', 'OP_CHECKSIGVERIFY', ':pubkey-xonly', 'OP_CHECKSIG'] },
        ':control-block',
    ]);
    if (match instanceof MatchError) {
        return match;
    }
    const [controlBlock] = match[':control-block'];
    const scriptPathLevel = calculateScriptPathLevel(controlBlock);
    const leafVersion = getLeafVersion(controlBlock);
    return {
        scriptType: 'taprootScriptPathSpend',
        pubScript: match[':script'][0].buffer,
        publicKeys: match[':script'][0].match[':pubkey-xonly'],
        signatures: match[':signature'],
        controlBlock,
        scriptPathLevel,
        leafVersion,
    };
};
/**
 * Parse a transaction's signature script to obtain public keys, signatures, the sig script,
 * and other properties.
 *
 * Only supports script types used in BitGo transactions.
 *
 * @param input
 * @returns ParsedSignatureScript
 */
function parseSignatureScript(input) {
    const decScript = bitcoinjs_lib_1.script.decompile(input.script);
    const parsers = [
        parseP2sh2Of3,
        parseP2shP2wsh2Of3,
        parseP2wsh2Of3,
        parseTaprootKeyPath2Of3,
        parseTaprootScriptPath2Of3,
        parseP2shP2pk,
    ];
    for (const f of parsers) {
        const parsed = f({
            script: (decScript === null || decScript === void 0 ? void 0 : decScript.length) === 0 ? null : decScript,
            witness: input.witness.length === 0 ? null : input.witness,
        });
        if (parsed instanceof MatchError) {
            continue;
        }
        return parsed;
    }
    throw new Error(`could not parse input`);
}
exports.parseSignatureScript = parseSignatureScript;
function parseSignatureScript2Of3(input) {
    const result = parseSignatureScript(input);
    if (!(0, outputScripts_1.isScriptType2Of3)(result.scriptType) &&
        result.scriptType !== 'taprootKeyPathSpend' &&
        result.scriptType !== 'taprootScriptPathSpend') {
        throw new Error(`invalid script type`);
    }
    if (!result.signatures) {
        throw new Error(`missing signatures`);
    }
    if (result.scriptType !== 'taprootKeyPathSpend' &&
        result.publicKeys.length !== 3 &&
        (result.publicKeys.length !== 2 || result.scriptType !== 'taprootScriptPathSpend')) {
        throw new Error(`unexpected pubkey count`);
    }
    return result;
}
exports.parseSignatureScript2Of3 = parseSignatureScript2Of3;
const parseP2shP2pkPubScript = (pubScript, scriptType) => {
    if (scriptType !== 'p2shP2pk') {
        throw new Error('invalid script type');
    }
    const match = matchScript([pubScript], [{ ':script': [':pubkey', 'OP_CHECKSIG'] }]);
    if (match instanceof MatchError) {
        return match;
    }
    const [script] = match[':script'];
    return {
        scriptType,
        publicKeys: script.match[':pubkey'],
        pubScript: pubScript,
        redeemScript: pubScript,
    };
};
const parseP2msPubScript = (pubScript, scriptType) => {
    if (scriptType === 'taprootScriptPathSpend' || scriptType === 'taprootKeyPathSpend' || scriptType === 'p2shP2pk') {
        throw new Error('invalid script type');
    }
    const match = matchScript([pubScript], [{ ':script': ['OP_2', ':pubkey', ':pubkey', ':pubkey', 'OP_3', 'OP_CHECKMULTISIG'] }]);
    if (match instanceof MatchError) {
        return match;
    }
    const [redeemScript] = match[':script'];
    if (!(0, types_1.isTriple)(redeemScript.match[':pubkey'])) {
        throw new Error('invalid pubkey count');
    }
    return {
        scriptType,
        publicKeys: redeemScript.match[':pubkey'],
        pubScript: redeemScript.buffer,
        redeemScript: scriptType === 'p2sh' ? redeemScript.buffer : undefined,
        witnessScript: scriptType === 'p2shP2wsh' || scriptType === 'p2wsh' ? redeemScript.buffer : undefined,
    };
};
const parseTaprootKeyPathPubScript = (pubScript, scriptType) => {
    if (scriptType === 'p2sh' ||
        scriptType === 'p2wsh' ||
        scriptType === 'p2shP2wsh' ||
        scriptType === 'taprootScriptPathSpend' ||
        scriptType === 'p2shP2pk') {
        throw new Error('invalid script type');
    }
    const match = matchScript([pubScript], [{ ':script': ['OP_1', ':pubkey-xonly'] }]);
    if (match instanceof MatchError) {
        return match;
    }
    const [script] = match[':script'];
    return {
        scriptType: 'taprootKeyPathSpend',
        publicKeys: script.match[':pubkey-xonly'],
        pubScript: pubScript,
    };
};
const parseTaprootScriptPathPubScript = (pubScript, scriptType) => {
    if (scriptType === 'p2sh' ||
        scriptType === 'p2wsh' ||
        scriptType === 'p2shP2wsh' ||
        scriptType === 'taprootKeyPathSpend' ||
        scriptType === 'p2shP2pk') {
        throw new Error('invalid script type');
    }
    const match = matchScript([pubScript], [{ ':script': [':pubkey-xonly', 'OP_CHECKSIGVERIFY', ':pubkey-xonly', 'OP_CHECKSIG'] }]);
    if (match instanceof MatchError) {
        return match;
    }
    return {
        scriptType,
        pubScript: match[':script'][0].buffer,
        publicKeys: match[':script'][0].match[':pubkey-xonly'],
    };
};
function parsePubScript2Of3(inputPubScript, scriptType) {
    const result = scriptType === 'taprootKeyPathSpend'
        ? parseTaprootKeyPathPubScript(inputPubScript, scriptType)
        : scriptType === 'taprootScriptPathSpend'
            ? parseTaprootScriptPathPubScript(inputPubScript, scriptType)
            : parseP2msPubScript(inputPubScript, scriptType);
    if (result instanceof MatchError) {
        throw new Error(result.message);
    }
    if ((result.scriptType === 'taprootKeyPathSpend' && result.publicKeys.length !== 1) ||
        (result.scriptType === 'taprootScriptPathSpend' && result.publicKeys.length !== 2) ||
        ((0, outputScripts_1.isScriptType2Of3)(result.scriptType) && result.publicKeys.length !== 3)) {
        throw new Error('unexpected pubkey count');
    }
    return result;
}
exports.parsePubScript2Of3 = parsePubScript2Of3;
function parsePubScript(inputPubScript, scriptType) {
    const result = scriptType === 'p2shP2pk'
        ? parseP2shP2pkPubScript(inputPubScript, scriptType)
        : parsePubScript2Of3(inputPubScript, scriptType);
    if (result instanceof MatchError) {
        throw new Error(result.message);
    }
    if (result.scriptType === 'p2shP2pk' && result.publicKeys.length !== 1) {
        throw new Error('unexpected pubkey count');
    }
    return result;
}
exports.parsePubScript = parsePubScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaXRnby9wYXJzZUlucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRCQUE0QjtBQUM1Qix1Q0FBdUM7QUFDdkMsaURBQTJEO0FBRTNELG1DQUFtQztBQUNuQyxtREFBbUQ7QUFFbkQsU0FBZ0Isc0JBQXNCLENBQUMsQ0FBa0I7SUFDdkQsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ3RCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakIsQ0FBQztBQUxELHdEQUtDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxZQUFvQjtJQUNyRCxzRkFBc0Y7SUFDdEYsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxZQUFZLENBQUMsTUFBTSxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN0RyxDQUFDO0FBSEQsZ0RBR0M7QUFFRDs7R0FFRztBQUNILFNBQWdCLHdCQUF3QixDQUFDLFlBQW9CO0lBQzNELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFO1FBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztLQUNoRDtJQUNELElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7UUFDOUIsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7UUFDOUIsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBWEQsNERBV0M7QUFFRDs7R0FF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SSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDdEUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0tBQzVDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQWxCRCx3Q0FrQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tcmVkZWNsYXJlOiAwICovXHJcbmltcG9ydCAqIGFzIG9wY29kZXMgZnJvbSAnYml0Y29pbi1vcHMnO1xyXG5pbXBvcnQgeyBUeElucHV0LCBzY3JpcHQgYXMgYnNjcmlwdCB9IGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5cclxuaW1wb3J0IHsgaXNUcmlwbGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgaXNTY3JpcHRUeXBlMk9mMyB9IGZyb20gJy4vb3V0cHV0U2NyaXB0cyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNQbGFjZWhvbGRlclNpZ25hdHVyZSh2OiBudW1iZXIgfCBCdWZmZXIpOiBib29sZWFuIHtcclxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHYpKSB7XHJcbiAgICByZXR1cm4gdi5sZW5ndGggPT09IDA7XHJcbiAgfVxyXG4gIHJldHVybiB2ID09PSAwO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybiB0cnVlIGlmZiBQMlRSIHNjcmlwdCBwYXRoJ3MgY29udHJvbCBibG9jayBtYXRjaGVzIEJpdEdvJ3MgbmVlZFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRDb250cm9sQm9jayhjb250cm9sQmxvY2s6IEJ1ZmZlcik6IGJvb2xlYW4ge1xyXG4gIC8vIFRoZSBsYXN0IHN0YWNrIGVsZW1lbnQgaXMgY2FsbGVkIHRoZSBjb250cm9sIGJsb2NrIGMsIGFuZCBtdXN0IGhhdmUgbGVuZ3RoIDMzICsgMzJtXHJcbiAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcihjb250cm9sQmxvY2spICYmIDMzIDw9IGNvbnRyb2xCbG9jay5sZW5ndGggJiYgY29udHJvbEJsb2NrLmxlbmd0aCAlIDMyID09PSAxO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybiBzY3JpcHQgcGF0aCBsZXZlbCBmb3IgUDJUUiBjb250cm9sIGJsb2NrXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlU2NyaXB0UGF0aExldmVsKGNvbnRyb2xCbG9jazogQnVmZmVyKTogbnVtYmVyIHtcclxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihjb250cm9sQmxvY2spKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udHJvbCBibG9jayB0eXBlLicpO1xyXG4gIH1cclxuICBpZiAoY29udHJvbEJsb2NrLmxlbmd0aCA9PT0gNjUpIHtcclxuICAgIHJldHVybiAxO1xyXG4gIH1cclxuICBpZiAoY29udHJvbEJsb2NrLmxlbmd0aCA9PT0gOTcpIHtcclxuICAgIHJldHVybiAyO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwZWN0ZWQgY29udHJvbCBibG9jayBsZW5ndGguJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIGxlYWYgdmVyc2lvbiBmb3IgUDJUUiBjb250cm9sIGJsb2NrLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExlYWZWZXJzaW9uKGNvbnRyb2xCbG9jazogQnVmZmVyKTogbnVtYmVyIHtcclxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKGNvbnRyb2xCbG9jaykgJiYgY29udHJvbEJsb2NrLmxlbmd0aCA+IDApIHtcclxuICAgIHJldHVybiBjb250cm9sQmxvY2tbMF0gJiAweGZlO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwZWN0ZWQgbGVhZlZlcnNpb24uJyk7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFBhcnNlZFNjcmlwdFR5cGUyT2YzID1cclxuICB8ICdwMnNoJ1xyXG4gIHwgJ3Ayc2hQMndzaCdcclxuICB8ICdwMndzaCdcclxuICB8ICd0YXByb290S2V5UGF0aFNwZW5kJyAvLyBvbmx5IGltcGxlbWVudGVkIGZvciBwMnRyTXVzaWcyXHJcbiAgfCAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCc7IC8vIGNhbiBiZSBmb3IgZWl0aGVyIHAydHIgb3IgcDJ0ck11c2lnMiBvdXRwdXQgc2NyaXB0XHJcblxyXG5leHBvcnQgdHlwZSBQYXJzZWRTY3JpcHRUeXBlID0gUGFyc2VkU2NyaXB0VHlwZTJPZjMgfCAncDJzaFAycGsnO1xyXG5cclxuZXhwb3J0IHR5cGUgUGFyc2VkUHViU2NyaXB0ID0ge1xyXG4gIHNjcmlwdFR5cGU6IFBhcnNlZFNjcmlwdFR5cGU7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQYXJzZWRTaWduYXR1cmVTY3JpcHQgPSB7XHJcbiAgc2NyaXB0VHlwZTogUGFyc2VkU2NyaXB0VHlwZTtcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJzaFAycGsgZXh0ZW5kcyBQYXJzZWRTaWduYXR1cmVTY3JpcHQge1xyXG4gIHNjcmlwdFR5cGU6ICdwMnNoUDJwayc7XHJcbiAgcHVibGljS2V5czogW0J1ZmZlcl07XHJcbiAgc2lnbmF0dXJlczogW0J1ZmZlcl07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkUHViU2NyaXB0VGFwcm9vdEtleVBhdGggZXh0ZW5kcyBQYXJzZWRQdWJTY3JpcHQge1xyXG4gIHNjcmlwdFR5cGU6ICd0YXByb290S2V5UGF0aFNwZW5kJztcclxuICAvLyB4LW9ubHkgdGFwT3V0cHV0S2V5XHJcbiAgcHVibGljS2V5czogW0J1ZmZlcl07XHJcbiAgcHViU2NyaXB0OiBCdWZmZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkUHViU2NyaXB0VGFwcm9vdFNjcmlwdFBhdGggZXh0ZW5kcyBQYXJzZWRQdWJTY3JpcHQge1xyXG4gIHNjcmlwdFR5cGU6ICd0YXByb290U2NyaXB0UGF0aFNwZW5kJztcclxuICBwdWJsaWNLZXlzOiBbQnVmZmVyLCBCdWZmZXJdO1xyXG4gIHB1YlNjcmlwdDogQnVmZmVyO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBQYXJzZWRQdWJTY3JpcHRUYXByb290ID0gUGFyc2VkUHViU2NyaXB0VGFwcm9vdEtleVBhdGggfCBQYXJzZWRQdWJTY3JpcHRUYXByb290U2NyaXB0UGF0aDtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkUHViU2NyaXB0UDJtcyBleHRlbmRzIFBhcnNlZFB1YlNjcmlwdCB7XHJcbiAgc2NyaXB0VHlwZTogJ3Ayc2gnIHwgJ3Ayc2hQMndzaCcgfCAncDJ3c2gnO1xyXG4gIHB1YmxpY0tleXM6IFtCdWZmZXIsIEJ1ZmZlciwgQnVmZmVyXTtcclxuICBwdWJTY3JpcHQ6IEJ1ZmZlcjtcclxuICByZWRlZW1TY3JpcHQ6IEJ1ZmZlciB8IHVuZGVmaW5lZDtcclxuICB3aXRuZXNzU2NyaXB0OiBCdWZmZXIgfCB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkUHViU2NyaXB0UDJzaFAycGsgZXh0ZW5kcyBQYXJzZWRQdWJTY3JpcHQge1xyXG4gIHNjcmlwdFR5cGU6ICdwMnNoUDJwayc7XHJcbiAgcHVibGljS2V5czogW0J1ZmZlcl07XHJcbiAgcHViU2NyaXB0OiBCdWZmZXI7XHJcbiAgcmVkZWVtU2NyaXB0OiBCdWZmZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJtcyBleHRlbmRzIFBhcnNlZFNpZ25hdHVyZVNjcmlwdCB7XHJcbiAgc2NyaXB0VHlwZTogJ3Ayc2gnIHwgJ3Ayc2hQMndzaCcgfCAncDJ3c2gnO1xyXG4gIHB1YmxpY0tleXM6IFtCdWZmZXIsIEJ1ZmZlciwgQnVmZmVyXTtcclxuICBzaWduYXR1cmVzOlxyXG4gICAgfCBbQnVmZmVyLCBCdWZmZXJdIC8vIGZ1bGx5LXNpZ25lZCB0cmFuc2FjdGlvbnMgd2l0aCBzaWduYXR1cmVzXHJcbiAgICAvKiBQYXJ0aWFsbHkgc2lnbmVkIHRyYW5zYWN0aW9ucyB3aXRoIHBsYWNlaG9sZGVyIHNpZ25hdHVyZXMuXHJcbiAgICAgICBGb3IgcDJzaCwgdGhlIHBsYWNlaG9sZGVyIGlzIE9QXzAgKG51bWJlciAwKSAqL1xyXG4gICAgfCBbQnVmZmVyIHwgMCwgQnVmZmVyIHwgMCwgQnVmZmVyIHwgMF07XHJcbiAgcHViU2NyaXB0OiBCdWZmZXI7XHJcbiAgcmVkZWVtU2NyaXB0OiBCdWZmZXIgfCB1bmRlZmluZWQ7XHJcbiAgd2l0bmVzc1NjcmlwdDogQnVmZmVyIHwgdW5kZWZpbmVkO1xyXG59XHJcblxyXG4vKipcclxuICogS2V5cGF0aCBzcGVuZHMgb25seSBoYXZlIGEgc2luZ2xlIHNpZ25hdHVyZVxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWRTaWduYXR1cmVTY3JpcHRUYXByb290S2V5UGF0aCBleHRlbmRzIFBhcnNlZFNpZ25hdHVyZVNjcmlwdCB7XHJcbiAgc2NyaXB0VHlwZTogJ3RhcHJvb3RLZXlQYXRoU3BlbmQnO1xyXG4gIHNpZ25hdHVyZXM6IFtCdWZmZXJdO1xyXG59XHJcblxyXG4vKipcclxuICogVGFwcm9vdCBTY3JpcHRwYXRoIHNwZW5kcyBhcmUgbW9yZSBzaW1pbGFyIHRvIHJlZ3VsYXIgcDJtcyBzcGVuZHMgYW5kIGhhdmUgdHdvIHB1YmxpYyBrZXlzIGFuZFxyXG4gKiB0d28gc2lnbmF0dXJlc1xyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWRTaWduYXR1cmVTY3JpcHRUYXByb290U2NyaXB0UGF0aCBleHRlbmRzIFBhcnNlZFNpZ25hdHVyZVNjcmlwdCB7XHJcbiAgc2NyaXB0VHlwZTogJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnO1xyXG4gIHB1YmxpY0tleXM6IFtCdWZmZXIsIEJ1ZmZlcl07XHJcbiAgc2lnbmF0dXJlczogW0J1ZmZlciwgQnVmZmVyXTtcclxuICBjb250cm9sQmxvY2s6IEJ1ZmZlcjtcclxuICBsZWFmVmVyc2lvbjogbnVtYmVyO1xyXG4gIC8qKiBJbmRpY2F0ZXMgdGhlIGxldmVsIGluc2lkZSB0aGUgdGFwdHJlZS4gKi9cclxuICBzY3JpcHRQYXRoTGV2ZWw6IG51bWJlcjtcclxuICBwdWJTY3JpcHQ6IEJ1ZmZlcjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgUGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdCA9IFBhcnNlZFNpZ25hdHVyZVNjcmlwdFRhcHJvb3RLZXlQYXRoIHwgUGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdFNjcmlwdFBhdGg7XHJcblxyXG50eXBlIERlY29tcGlsZWRTY3JpcHQgPSBBcnJheTxCdWZmZXIgfCBudW1iZXI+O1xyXG5cclxuLyoqXHJcbiAqIFN0YXRpYyBzY3JpcHQgZWxlbWVudHNcclxuICovXHJcbnR5cGUgU2NyaXB0UGF0dGVybkNvbnN0YW50ID1cclxuICB8ICdPUF8wJ1xyXG4gIHwgJ09QXzEnXHJcbiAgfCAnT1BfMidcclxuICB8ICdPUF8zJ1xyXG4gIHwgJ09QX0NIRUNLTVVMVElTSUcnXHJcbiAgfCAnT1BfQ0hFQ0tTSUcnXHJcbiAgfCAnT1BfQ0hFQ0tTSUdWRVJJRlknO1xyXG5cclxuLyoqXHJcbiAqIFNjcmlwdCBlbGVtZW50cyB0aGF0IGNhbiBiZSBjYXB0dXJlZFxyXG4gKi9cclxudHlwZSBTY3JpcHRQYXR0ZXJuQ2FwdHVyZSA9XHJcbiAgfCAnOnB1YmtleSdcclxuICB8ICc6cHVia2V5LXhvbmx5J1xyXG4gIHwgJzpzaWduYXR1cmUnXHJcbiAgfCAnOmNvbnRyb2wtYmxvY2snXHJcbiAgfCB7ICc6c2NyaXB0JzogU2NyaXB0UGF0dGVybkVsZW1lbnRbXSB9O1xyXG5cclxudHlwZSBTY3JpcHRQYXR0ZXJuRWxlbWVudCA9IFNjcmlwdFBhdHRlcm5Db25zdGFudCB8IFNjcmlwdFBhdHRlcm5DYXB0dXJlO1xyXG5cclxuLyoqXHJcbiAqIFJlc3VsdCBmb3IgYSBzdWNjZXNzZnVsIHNjcmlwdCBtYXRjaFxyXG4gKi9cclxudHlwZSBNYXRjaFJlc3VsdCA9IHtcclxuICAnOnB1YmtleSc6IEJ1ZmZlcltdO1xyXG4gICc6cHVia2V5LXhvbmx5JzogQnVmZmVyW107XHJcbiAgJzpjb250cm9sLWJsb2NrJzogQnVmZmVyW107XHJcbiAgJzpzaWduYXR1cmUnOiAoQnVmZmVyIHwgMClbXTtcclxuICAnOnNjcmlwdCc6IHsgYnVmZmVyOiBCdWZmZXI7IG1hdGNoOiBNYXRjaFJlc3VsdCB9W107XHJcbn07XHJcblxyXG5mdW5jdGlvbiBlbXB0eU1hdGNoUmVzdWx0KCk6IE1hdGNoUmVzdWx0IHtcclxuICByZXR1cm4ge1xyXG4gICAgJzpwdWJrZXknOiBbXSxcclxuICAgICc6cHVia2V5LXhvbmx5JzogW10sXHJcbiAgICAnOmNvbnRyb2wtYmxvY2snOiBbXSxcclxuICAgICc6c2lnbmF0dXJlJzogW10sXHJcbiAgICAnOnNjcmlwdCc6IFtdLFxyXG4gIH07XHJcbn1cclxuXHJcbmNsYXNzIE1hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgLy8gdGhpcyBwcm9wZXJ0eSBpcyByZXF1aXJlZCB0byBwcm9oaWJpdCBgcmV0dXJuIG5ldyBFcnJvcigpYCB3aGVuIHRoZSByZXR1cm4gdHlwZSBkZW1hbmRzIGBNYXRjaEVycm9yYFxyXG4gIF9fdHlwZSA9ICdNYXRjaEVycm9yJztcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKG1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZvclBhdHRlcm5FbGVtZW50KHA6IFNjcmlwdFBhdHRlcm5FbGVtZW50KTogTWF0Y2hFcnJvciB7XHJcbiAgICBpZiAodHlwZW9mIHAgPT09ICdvYmplY3QnICYmICc6c2NyaXB0JyBpbiBwKSB7XHJcbiAgICAgIHJldHVybiBuZXcgTWF0Y2hFcnJvcihgZXJyb3IgbWF0Y2hpbmcgbmVzdGVkIHNjcmlwdGApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBNYXRjaEVycm9yKGBlcnJvciBtYXRjaGluZyAke3B9YCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHNjcmlwdFxyXG4gKiBAcGFyYW0gcGF0dGVyblxyXG4gKiBAcmV0dXJuIE1hdGNoUmVzdWx0IGlmIHNjcmlwdCBtYXRjaGVzIHBhdHRlcm4uIFRoZSByZXN1bHQgd2lsbCBjb250YWluIHRoZSBtYXRjaGVkIHZhbHVlcy5cclxuICovXHJcbmZ1bmN0aW9uIG1hdGNoU2NyaXB0KHNjcmlwdDogRGVjb21waWxlZFNjcmlwdCwgcGF0dGVybjogU2NyaXB0UGF0dGVybkVsZW1lbnRbXSk6IE1hdGNoUmVzdWx0IHwgTWF0Y2hFcnJvciB7XHJcbiAgLyoqXHJcbiAgICogTWF0Y2ggYSBzaW5nbGUgc2NyaXB0IGVsZW1lbnQgd2l0aCBhIFNjcmlwdFBhdHRlcm5FbGVtZW50XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gbWF0Y2hFbGVtZW50KGU6IEJ1ZmZlciB8IG51bWJlciwgcDogU2NyaXB0UGF0dGVybkVsZW1lbnQpOiBNYXRjaFJlc3VsdCB8IGJvb2xlYW4ge1xyXG4gICAgc3dpdGNoIChwKSB7XHJcbiAgICAgIGNhc2UgJ09QXzAnOlxyXG4gICAgICAgIHJldHVybiBlID09PSBvcGNvZGVzLk9QXzAgfHwgKEJ1ZmZlci5pc0J1ZmZlcihlKSAmJiBlLmxlbmd0aCA9PT0gMCk7XHJcbiAgICAgIGNhc2UgJ09QXzEnOlxyXG4gICAgICBjYXNlICdPUF8yJzpcclxuICAgICAgY2FzZSAnT1BfMyc6XHJcbiAgICAgIGNhc2UgJ09QX0NIRUNLTVVMVElTSUcnOlxyXG4gICAgICBjYXNlICdPUF9DSEVDS1NJRyc6XHJcbiAgICAgIGNhc2UgJ09QX0NIRUNLU0lHVkVSSUZZJzpcclxuICAgICAgICByZXR1cm4gZSA9PT0gb3Bjb2Rlc1twXTtcclxuICAgICAgY2FzZSAnOnB1YmtleSc6XHJcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcihlKSAmJiAoZS5sZW5ndGggPT09IDMzIHx8IGUubGVuZ3RoID09PSA2NSk7XHJcbiAgICAgIGNhc2UgJzpwdWJrZXkteG9ubHknOlxyXG4gICAgICAgIHJldHVybiBCdWZmZXIuaXNCdWZmZXIoZSkgJiYgZS5sZW5ndGggPT09IDMyO1xyXG4gICAgICBjYXNlICc6c2lnbmF0dXJlJzpcclxuICAgICAgICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGUpIHx8IGlzUGxhY2Vob2xkZXJTaWduYXR1cmUoZSk7XHJcbiAgICAgIGNhc2UgJzpjb250cm9sLWJsb2NrJzpcclxuICAgICAgICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGUpICYmIGlzVmFsaWRDb250cm9sQm9jayhlKTtcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gcGF0dGVybiBlbGVtZW50ICR7cH1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChzY3JpcHQubGVuZ3RoICE9PSBwYXR0ZXJuLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXRjaEVycm9yKGBsZW5ndGggbWlzbWF0Y2hgKTtcclxuICB9XHJcblxyXG4gIC8vIEdvIG92ZXIgZWFjaCBwYXR0ZXJuIGVsZW1lbnQuXHJcbiAgLy8gQ29sbGVjdCBjYXB0dXJlcyBpbnRvIGEgcmVzdWx0IG9iamVjdC5cclxuICByZXR1cm4gcGF0dGVybi5yZWR1Y2UoKG9iajogTWF0Y2hSZXN1bHQgfCBNYXRjaEVycm9yLCBwLCBpKTogTWF0Y2hSZXN1bHQgfCBNYXRjaEVycm9yID0+IHtcclxuICAgIC8vIGlmIHdlIGhhZCBhIHByZXZpb3VzIG1pc21hdGNoLCBzaG9ydC1jaXJjdWl0XHJcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xyXG4gICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGUgPSBzY3JpcHRbaV07XHJcblxyXG4gICAgLy8gZm9yICc6c2NyaXB0JyBwYXR0ZXJuIGVsZW1lbnRzLCBkZWNvbXBpbGUgc2NyaXB0IGVsZW1lbnQgYW5kIHJlY3Vyc2VcclxuICAgIGlmICh0eXBlb2YgcCA9PT0gJ29iamVjdCcgJiYgJzpzY3JpcHQnIGluIHApIHtcclxuICAgICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoZSkpIHtcclxuICAgICAgICByZXR1cm4gbmV3IE1hdGNoRXJyb3IoYGV4cGVjdGVkIGJ1ZmZlciBmb3IgOnNjcmlwdGApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGRlYyA9IGJzY3JpcHQuZGVjb21waWxlKGUpO1xyXG4gICAgICBpZiAoIWRlYykge1xyXG4gICAgICAgIHJldHVybiBuZXcgTWF0Y2hFcnJvcihgZXJyb3IgZGVjb21waWxpbmcgbmVzdGVkIHNjcmlwdGApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1hdGNoID0gbWF0Y2hTY3JpcHQoZGVjLCBwWyc6c2NyaXB0J10pO1xyXG4gICAgICBpZiAobWF0Y2ggaW5zdGFuY2VvZiBNYXRjaEVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICB9XHJcbiAgICAgIG9ialsnOnNjcmlwdCddLnB1c2goe1xyXG4gICAgICAgIGJ1ZmZlcjogZSxcclxuICAgICAgICBtYXRjaCxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2ggPSBtYXRjaEVsZW1lbnQoZSwgcCk7XHJcbiAgICBpZiAoIW1hdGNoKSB7XHJcbiAgICAgIHJldHVybiBNYXRjaEVycm9yLmZvclBhdHRlcm5FbGVtZW50KHApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHBhdHRlcm4gZWxlbWVudCBpcyBhIGNhcHR1cmUsIGFkZCBpdCB0byB0aGUgcmVzdWx0IG9ialxyXG4gICAgaWYgKHAgPT09ICc6c2lnbmF0dXJlJyAmJiBlID09PSAwKSB7XHJcbiAgICAgIG9ialtwXS5wdXNoKGUpO1xyXG4gICAgfSBlbHNlIGlmIChwIGluIG9iaikge1xyXG4gICAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihlKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBjYXB0dXJlIHZhbHVlYCk7XHJcbiAgICAgIH1cclxuICAgICAgb2JqW3BdLnB1c2goZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxuICB9LCBlbXB0eU1hdGNoUmVzdWx0KCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHNjcmlwdFxyXG4gKiBAcGFyYW0gcGF0dGVybnNcclxuICogQHJldHVybiBmaXJzdCBtYXRjaFxyXG4gKi9cclxuZnVuY3Rpb24gbWF0Y2hTY3JpcHRTb21lKHNjcmlwdDogRGVjb21waWxlZFNjcmlwdCwgcGF0dGVybnM6IFNjcmlwdFBhdHRlcm5FbGVtZW50W11bXSk6IE1hdGNoUmVzdWx0IHwgTWF0Y2hFcnJvciB7XHJcbiAgZm9yIChjb25zdCBwIG9mIHBhdHRlcm5zKSB7XHJcbiAgICBjb25zdCBtID0gbWF0Y2hTY3JpcHQoc2NyaXB0LCBwKTtcclxuICAgIGlmIChtIGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBtO1xyXG4gIH1cclxuICByZXR1cm4gbmV3IE1hdGNoRXJyb3IoYG5vIG1hdGNoIGZvciBzY3JpcHRgKTtcclxufVxyXG5cclxudHlwZSBJbnB1dFNjcmlwdHM8VFNjcmlwdCwgVFdpdG5lc3M+ID0ge1xyXG4gIHNjcmlwdDogVFNjcmlwdDtcclxuICB3aXRuZXNzOiBUV2l0bmVzcztcclxufTtcclxuXHJcbnR5cGUgSW5wdXRTY3JpcHRzTGVnYWN5ID0gSW5wdXRTY3JpcHRzPERlY29tcGlsZWRTY3JpcHQsIG51bGw+O1xyXG50eXBlIElucHV0U2NyaXB0c1dyYXBwZWRTZWd3aXQgPSBJbnB1dFNjcmlwdHM8RGVjb21waWxlZFNjcmlwdCwgQnVmZmVyW10+O1xyXG50eXBlIElucHV0U2NyaXB0c05hdGl2ZVNlZ3dpdCA9IElucHV0U2NyaXB0czxudWxsLCBCdWZmZXJbXT47XHJcblxyXG50eXBlIElucHV0U2NyaXB0c1Vua25vd24gPSBJbnB1dFNjcmlwdHM8RGVjb21waWxlZFNjcmlwdCB8IG51bGwsIEJ1ZmZlcltdIHwgbnVsbD47XHJcblxyXG50eXBlIElucHV0UGFyc2VyPFQgZXh0ZW5kcyBQYXJzZWRTaWduYXR1cmVTY3JpcHRQMnNoUDJwayB8IFBhcnNlZFNpZ25hdHVyZVNjcmlwdFAybXMgfCBQYXJzZWRTaWduYXR1cmVTY3JpcHRUYXByb290PiA9IChcclxuICBwOiBJbnB1dFNjcmlwdHNVbmtub3duXHJcbikgPT4gVCB8IE1hdGNoRXJyb3I7XHJcblxyXG5leHBvcnQgdHlwZSBJbnB1dFB1YlNjcmlwdCA9IEJ1ZmZlcjtcclxuXHJcbnR5cGUgUHViU2NyaXB0UGFyc2VyPFQgZXh0ZW5kcyBQYXJzZWRQdWJTY3JpcHRUYXByb290IHwgUGFyc2VkUHViU2NyaXB0UDJtcyB8IFBhcnNlZFB1YlNjcmlwdFAyc2hQMnBrPiA9IChcclxuICBwOiBJbnB1dFB1YlNjcmlwdCxcclxuICB0OiBQYXJzZWRTY3JpcHRUeXBlXHJcbikgPT4gVCB8IE1hdGNoRXJyb3I7XHJcblxyXG5mdW5jdGlvbiBpc0xlZ2FjeShwOiBJbnB1dFNjcmlwdHNVbmtub3duKTogcCBpcyBJbnB1dFNjcmlwdHNMZWdhY3kge1xyXG4gIHJldHVybiBCb29sZWFuKHAuc2NyaXB0ICYmICFwLndpdG5lc3MpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1dyYXBwZWRTZWd3aXQocDogSW5wdXRTY3JpcHRzVW5rbm93bik6IHAgaXMgSW5wdXRTY3JpcHRzV3JhcHBlZFNlZ3dpdCB7XHJcbiAgcmV0dXJuIEJvb2xlYW4ocC5zY3JpcHQgJiYgcC53aXRuZXNzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNOYXRpdmVTZWd3aXQocDogSW5wdXRTY3JpcHRzVW5rbm93bik6IHAgaXMgSW5wdXRTY3JpcHRzTmF0aXZlU2Vnd2l0IHtcclxuICByZXR1cm4gQm9vbGVhbighcC5zY3JpcHQgJiYgcC53aXRuZXNzKTtcclxufVxyXG5cclxuY29uc3QgcGFyc2VQMnNoUDJwazogSW5wdXRQYXJzZXI8UGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJzaFAycGs+ID0gKHApID0+IHtcclxuICBpZiAoIWlzTGVnYWN5KHApKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdGNoRXJyb3IoYGV4cGVjdGVkIGxlZ2FjeSBpbnB1dGApO1xyXG4gIH1cclxuICBjb25zdCBtYXRjaCA9IG1hdGNoU2NyaXB0KHAuc2NyaXB0LCBbJzpzaWduYXR1cmUnLCB7ICc6c2NyaXB0JzogWyc6cHVia2V5JywgJ09QX0NIRUNLU0lHJ10gfV0pO1xyXG4gIGlmIChtYXRjaCBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcclxuICAgIHJldHVybiBtYXRjaDtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHNjcmlwdFR5cGU6ICdwMnNoUDJwaycsXHJcbiAgICBwdWJsaWNLZXlzOiBtYXRjaFsnOnNjcmlwdCddWzBdLm1hdGNoWyc6cHVia2V5J10gYXMgW0J1ZmZlcl0sXHJcbiAgICBzaWduYXR1cmVzOiBtYXRjaFsnOnNpZ25hdHVyZSddIGFzIFtCdWZmZXJdLFxyXG4gIH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiBwYXJzZVAybXMoXHJcbiAgZGVjU2NyaXB0OiBEZWNvbXBpbGVkU2NyaXB0LFxyXG4gIHNjcmlwdFR5cGU6ICdwMnNoJyB8ICdwMnNoUDJ3c2gnIHwgJ3Ayd3NoJ1xyXG4pOiBQYXJzZWRTaWduYXR1cmVTY3JpcHRQMm1zIHwgTWF0Y2hFcnJvciB7XHJcbiAgY29uc3QgcGF0dGVybjJPZjM6IFNjcmlwdFBhdHRlcm5FbGVtZW50W10gPSBbJ09QXzInLCAnOnB1YmtleScsICc6cHVia2V5JywgJzpwdWJrZXknLCAnT1BfMycsICdPUF9DSEVDS01VTFRJU0lHJ107XHJcblxyXG4gIGNvbnN0IG1hdGNoID0gbWF0Y2hTY3JpcHRTb21lKGRlY1NjcmlwdCwgW1xyXG4gICAgLyogZnVsbC1zaWduZWQsIG5vIHBsYWNlaG9sZGVyIHNpZ25hdHVyZSAqL1xyXG4gICAgWydPUF8wJywgJzpzaWduYXR1cmUnLCAnOnNpZ25hdHVyZScsIHsgJzpzY3JpcHQnOiBwYXR0ZXJuMk9mMyB9XSxcclxuICAgIC8qIGhhbGYtc2lnbmVkLCBwbGFjZWhvbGRlciBzaWduYXR1cmVzICovXHJcbiAgICBbJ09QXzAnLCAnOnNpZ25hdHVyZScsICc6c2lnbmF0dXJlJywgJzpzaWduYXR1cmUnLCB7ICc6c2NyaXB0JzogcGF0dGVybjJPZjMgfV0sXHJcbiAgXSk7XHJcbiAgaWYgKG1hdGNoIGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xyXG4gICAgcmV0dXJuIG1hdGNoO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgW3JlZGVlbVNjcmlwdF0gPSBtYXRjaFsnOnNjcmlwdCddO1xyXG5cclxuICBpZiAoIWlzVHJpcGxlKHJlZGVlbVNjcmlwdC5tYXRjaFsnOnB1YmtleSddKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHB1YmtleSBjb3VudGApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHNjcmlwdFR5cGUsXHJcbiAgICBwdWJsaWNLZXlzOiByZWRlZW1TY3JpcHQubWF0Y2hbJzpwdWJrZXknXSxcclxuICAgIHB1YlNjcmlwdDogcmVkZWVtU2NyaXB0LmJ1ZmZlcixcclxuICAgIHNpZ25hdHVyZXM6IG1hdGNoWyc6c2lnbmF0dXJlJ10gYXMgUGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJtc1snc2lnbmF0dXJlcyddLFxyXG4gICAgcmVkZWVtU2NyaXB0OiBzY3JpcHRUeXBlID09PSAncDJzaCcgPyByZWRlZW1TY3JpcHQuYnVmZmVyIDogdW5kZWZpbmVkLFxyXG4gICAgd2l0bmVzc1NjcmlwdDogc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMndzaCcgfHwgc2NyaXB0VHlwZSA9PT0gJ3Ayd3NoJyA/IHJlZGVlbVNjcmlwdC5idWZmZXIgOiB1bmRlZmluZWQsXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgcGFyc2VQMnNoMk9mMzogSW5wdXRQYXJzZXI8UGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJtcz4gPSAocCkgPT4ge1xyXG4gIGlmICghaXNMZWdhY3kocCkpIHtcclxuICAgIHJldHVybiBuZXcgTWF0Y2hFcnJvcihgZXhwZWN0ZWQgbGVnYWN5IGlucHV0YCk7XHJcbiAgfVxyXG4gIHJldHVybiBwYXJzZVAybXMocC5zY3JpcHQsICdwMnNoJyk7XHJcbn07XHJcblxyXG5jb25zdCBwYXJzZVAyc2hQMndzaDJPZjM6IElucHV0UGFyc2VyPFBhcnNlZFNpZ25hdHVyZVNjcmlwdFAybXM+ID0gKHApID0+IHtcclxuICBpZiAoIWlzV3JhcHBlZFNlZ3dpdChwKSkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXRjaEVycm9yKGBleHBlY3RlZCB3cmFwcGVkIHNlZ3dpdCBpbnB1dGApO1xyXG4gIH1cclxuICByZXR1cm4geyAuLi5wYXJzZVAybXMocC53aXRuZXNzLCAncDJzaFAyd3NoJyksIHJlZGVlbVNjcmlwdDogcC5zY3JpcHRbMF0gYXMgQnVmZmVyIH07XHJcbn07XHJcblxyXG5jb25zdCBwYXJzZVAyd3NoMk9mMzogSW5wdXRQYXJzZXI8UGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJtcz4gPSAocCkgPT4ge1xyXG4gIGlmICghaXNOYXRpdmVTZWd3aXQocCkpIHtcclxuICAgIHJldHVybiBuZXcgTWF0Y2hFcnJvcihgZXhwZWN0ZWQgbmF0aXZlIHNlZ3dpdGApO1xyXG4gIH1cclxuICByZXR1cm4gcGFyc2VQMm1zKHAud2l0bmVzcywgJ3Ayd3NoJyk7XHJcbn07XHJcblxyXG5jb25zdCBwYXJzZVRhcHJvb3RLZXlQYXRoMk9mMzogSW5wdXRQYXJzZXI8UGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdEtleVBhdGg+ID0gKHApID0+IHtcclxuICBpZiAoIWlzTmF0aXZlU2Vnd2l0KHApKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdGNoRXJyb3IoYGV4cGVjdGVkIG5hdGl2ZSBzZWd3aXRgKTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBtYXRjaFNjcmlwdChwLndpdG5lc3MsIFsnOnNpZ25hdHVyZSddKTtcclxuICBpZiAobWF0Y2ggaW5zdGFuY2VvZiBNYXRjaEVycm9yKSB7XHJcbiAgICByZXR1cm4gbWF0Y2g7XHJcbiAgfVxyXG4gIGNvbnN0IHNpZ25hdHVyZXMgPSBtYXRjaFsnOnNpZ25hdHVyZSddIGFzIFtCdWZmZXJdO1xyXG4gIGlmIChpc1BsYWNlaG9sZGVyU2lnbmF0dXJlKHNpZ25hdHVyZXNbMF0pKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdGFwcm9vdCBrZXkgcGF0aCBzaWduYXR1cmVgKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHNjcmlwdFR5cGU6ICd0YXByb290S2V5UGF0aFNwZW5kJyxcclxuICAgIHNpZ25hdHVyZXMsXHJcbiAgfTtcclxufTtcclxuXHJcbmNvbnN0IHBhcnNlVGFwcm9vdFNjcmlwdFBhdGgyT2YzOiBJbnB1dFBhcnNlcjxQYXJzZWRTaWduYXR1cmVTY3JpcHRUYXByb290PiA9IChwKSA9PiB7XHJcbiAgaWYgKCFpc05hdGl2ZVNlZ3dpdChwKSkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXRjaEVycm9yKGBleHBlY3RlZCBuYXRpdmUgc2Vnd2l0YCk7XHJcbiAgfVxyXG4gIC8vIGFzc3VtZXMgbm8gYW5uZXhcclxuICBjb25zdCBtYXRjaCA9IG1hdGNoU2NyaXB0KHAud2l0bmVzcywgW1xyXG4gICAgJzpzaWduYXR1cmUnLFxyXG4gICAgJzpzaWduYXR1cmUnLFxyXG4gICAgeyAnOnNjcmlwdCc6IFsnOnB1YmtleS14b25seScsICdPUF9DSEVDS1NJR1ZFUklGWScsICc6cHVia2V5LXhvbmx5JywgJ09QX0NIRUNLU0lHJ10gfSxcclxuICAgICc6Y29udHJvbC1ibG9jaycsXHJcbiAgXSk7XHJcbiAgaWYgKG1hdGNoIGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xyXG4gICAgcmV0dXJuIG1hdGNoO1xyXG4gIH1cclxuICBjb25zdCBbY29udHJvbEJsb2NrXSA9IG1hdGNoWyc6Y29udHJvbC1ibG9jayddO1xyXG4gIGNvbnN0IHNjcmlwdFBhdGhMZXZlbCA9IGNhbGN1bGF0ZVNjcmlwdFBhdGhMZXZlbChjb250cm9sQmxvY2spO1xyXG5cclxuICBjb25zdCBsZWFmVmVyc2lvbiA9IGdldExlYWZWZXJzaW9uKGNvbnRyb2xCbG9jayk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzY3JpcHRUeXBlOiAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcsXHJcbiAgICBwdWJTY3JpcHQ6IG1hdGNoWyc6c2NyaXB0J11bMF0uYnVmZmVyLFxyXG4gICAgcHVibGljS2V5czogbWF0Y2hbJzpzY3JpcHQnXVswXS5tYXRjaFsnOnB1YmtleS14b25seSddIGFzIFtCdWZmZXIsIEJ1ZmZlcl0sXHJcbiAgICBzaWduYXR1cmVzOiBtYXRjaFsnOnNpZ25hdHVyZSddIGFzIFtCdWZmZXIsIEJ1ZmZlcl0sXHJcbiAgICBjb250cm9sQmxvY2ssXHJcbiAgICBzY3JpcHRQYXRoTGV2ZWwsXHJcbiAgICBsZWFmVmVyc2lvbixcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFBhcnNlIGEgdHJhbnNhY3Rpb24ncyBzaWduYXR1cmUgc2NyaXB0IHRvIG9idGFpbiBwdWJsaWMga2V5cywgc2lnbmF0dXJlcywgdGhlIHNpZyBzY3JpcHQsXHJcbiAqIGFuZCBvdGhlciBwcm9wZXJ0aWVzLlxyXG4gKlxyXG4gKiBPbmx5IHN1cHBvcnRzIHNjcmlwdCB0eXBlcyB1c2VkIGluIEJpdEdvIHRyYW5zYWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIGlucHV0XHJcbiAqIEByZXR1cm5zIFBhcnNlZFNpZ25hdHVyZVNjcmlwdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2lnbmF0dXJlU2NyaXB0KFxyXG4gIGlucHV0OiBUeElucHV0XHJcbik6IFBhcnNlZFNpZ25hdHVyZVNjcmlwdFAyc2hQMnBrIHwgUGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJtcyB8IFBhcnNlZFNpZ25hdHVyZVNjcmlwdFRhcHJvb3Qge1xyXG4gIGNvbnN0IGRlY1NjcmlwdCA9IGJzY3JpcHQuZGVjb21waWxlKGlucHV0LnNjcmlwdCk7XHJcbiAgY29uc3QgcGFyc2VycyA9IFtcclxuICAgIHBhcnNlUDJzaDJPZjMsXHJcbiAgICBwYXJzZVAyc2hQMndzaDJPZjMsXHJcbiAgICBwYXJzZVAyd3NoMk9mMyxcclxuICAgIHBhcnNlVGFwcm9vdEtleVBhdGgyT2YzLFxyXG4gICAgcGFyc2VUYXByb290U2NyaXB0UGF0aDJPZjMsXHJcbiAgICBwYXJzZVAyc2hQMnBrLFxyXG4gIF0gYXMgY29uc3Q7XHJcbiAgZm9yIChjb25zdCBmIG9mIHBhcnNlcnMpIHtcclxuICAgIGNvbnN0IHBhcnNlZCA9IGYoe1xyXG4gICAgICBzY3JpcHQ6IGRlY1NjcmlwdD8ubGVuZ3RoID09PSAwID8gbnVsbCA6IGRlY1NjcmlwdCxcclxuICAgICAgd2l0bmVzczogaW5wdXQud2l0bmVzcy5sZW5ndGggPT09IDAgPyBudWxsIDogaW5wdXQud2l0bmVzcyxcclxuICAgIH0pO1xyXG4gICAgaWYgKHBhcnNlZCBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGFyc2VkO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBwYXJzZSBpbnB1dGApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTaWduYXR1cmVTY3JpcHQyT2YzKGlucHV0OiBUeElucHV0KTogUGFyc2VkU2lnbmF0dXJlU2NyaXB0UDJtcyB8IFBhcnNlZFNpZ25hdHVyZVNjcmlwdFRhcHJvb3Qge1xyXG4gIGNvbnN0IHJlc3VsdCA9IHBhcnNlU2lnbmF0dXJlU2NyaXB0KGlucHV0KTtcclxuXHJcbiAgaWYgKFxyXG4gICAgIWlzU2NyaXB0VHlwZTJPZjMocmVzdWx0LnNjcmlwdFR5cGUpICYmXHJcbiAgICByZXN1bHQuc2NyaXB0VHlwZSAhPT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnICYmXHJcbiAgICByZXN1bHQuc2NyaXB0VHlwZSAhPT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnXHJcbiAgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgc2NyaXB0IHR5cGVgKTtcclxuICB9XHJcblxyXG4gIGlmICghcmVzdWx0LnNpZ25hdHVyZXMpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgbWlzc2luZyBzaWduYXR1cmVzYCk7XHJcbiAgfVxyXG4gIGlmIChcclxuICAgIHJlc3VsdC5zY3JpcHRUeXBlICE9PSAndGFwcm9vdEtleVBhdGhTcGVuZCcgJiZcclxuICAgIHJlc3VsdC5wdWJsaWNLZXlzLmxlbmd0aCAhPT0gMyAmJlxyXG4gICAgKHJlc3VsdC5wdWJsaWNLZXlzLmxlbmd0aCAhPT0gMiB8fCByZXN1bHQuc2NyaXB0VHlwZSAhPT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnKVxyXG4gICkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bmV4cGVjdGVkIHB1YmtleSBjb3VudGApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdCBhcyBQYXJzZWRTaWduYXR1cmVTY3JpcHRQMm1zIHwgUGFyc2VkU2lnbmF0dXJlU2NyaXB0VGFwcm9vdDtcclxufVxyXG5cclxuY29uc3QgcGFyc2VQMnNoUDJwa1B1YlNjcmlwdDogUHViU2NyaXB0UGFyc2VyPFBhcnNlZFB1YlNjcmlwdFAyc2hQMnBrPiA9IChwdWJTY3JpcHQsIHNjcmlwdFR5cGUpID0+IHtcclxuICBpZiAoc2NyaXB0VHlwZSAhPT0gJ3Ayc2hQMnBrJykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHNjcmlwdCB0eXBlJyk7XHJcbiAgfVxyXG4gIGNvbnN0IG1hdGNoID0gbWF0Y2hTY3JpcHQoW3B1YlNjcmlwdF0sIFt7ICc6c2NyaXB0JzogWyc6cHVia2V5JywgJ09QX0NIRUNLU0lHJ10gfV0pO1xyXG4gIGlmIChtYXRjaCBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcclxuICAgIHJldHVybiBtYXRjaDtcclxuICB9XHJcbiAgY29uc3QgW3NjcmlwdF0gPSBtYXRjaFsnOnNjcmlwdCddO1xyXG4gIHJldHVybiB7XHJcbiAgICBzY3JpcHRUeXBlLFxyXG4gICAgcHVibGljS2V5czogc2NyaXB0Lm1hdGNoWyc6cHVia2V5J10gYXMgW0J1ZmZlcl0sXHJcbiAgICBwdWJTY3JpcHQ6IHB1YlNjcmlwdCxcclxuICAgIHJlZGVlbVNjcmlwdDogcHViU2NyaXB0LFxyXG4gIH07XHJcbn07XHJcblxyXG5jb25zdCBwYXJzZVAybXNQdWJTY3JpcHQ6IFB1YlNjcmlwdFBhcnNlcjxQYXJzZWRQdWJTY3JpcHRQMm1zPiA9IChwdWJTY3JpcHQsIHNjcmlwdFR5cGUpID0+IHtcclxuICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnIHx8IHNjcmlwdFR5cGUgPT09ICd0YXByb290S2V5UGF0aFNwZW5kJyB8fCBzY3JpcHRUeXBlID09PSAncDJzaFAycGsnKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc2NyaXB0IHR5cGUnKTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBtYXRjaFNjcmlwdChcclxuICAgIFtwdWJTY3JpcHRdLFxyXG4gICAgW3sgJzpzY3JpcHQnOiBbJ09QXzInLCAnOnB1YmtleScsICc6cHVia2V5JywgJzpwdWJrZXknLCAnT1BfMycsICdPUF9DSEVDS01VTFRJU0lHJ10gfV1cclxuICApO1xyXG4gIGlmIChtYXRjaCBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcclxuICAgIHJldHVybiBtYXRjaDtcclxuICB9XHJcblxyXG4gIGNvbnN0IFtyZWRlZW1TY3JpcHRdID0gbWF0Y2hbJzpzY3JpcHQnXTtcclxuXHJcbiAgaWYgKCFpc1RyaXBsZShyZWRlZW1TY3JpcHQubWF0Y2hbJzpwdWJrZXknXSkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwdWJrZXkgY291bnQnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzY3JpcHRUeXBlLFxyXG4gICAgcHVibGljS2V5czogcmVkZWVtU2NyaXB0Lm1hdGNoWyc6cHVia2V5J10sXHJcbiAgICBwdWJTY3JpcHQ6IHJlZGVlbVNjcmlwdC5idWZmZXIsXHJcbiAgICByZWRlZW1TY3JpcHQ6IHNjcmlwdFR5cGUgPT09ICdwMnNoJyA/IHJlZGVlbVNjcmlwdC5idWZmZXIgOiB1bmRlZmluZWQsXHJcbiAgICB3aXRuZXNzU2NyaXB0OiBzY3JpcHRUeXBlID09PSAncDJzaFAyd3NoJyB8fCBzY3JpcHRUeXBlID09PSAncDJ3c2gnID8gcmVkZWVtU2NyaXB0LmJ1ZmZlciA6IHVuZGVmaW5lZCxcclxuICB9O1xyXG59O1xyXG5cclxuY29uc3QgcGFyc2VUYXByb290S2V5UGF0aFB1YlNjcmlwdDogUHViU2NyaXB0UGFyc2VyPFBhcnNlZFB1YlNjcmlwdFRhcHJvb3RLZXlQYXRoPiA9IChwdWJTY3JpcHQsIHNjcmlwdFR5cGUpID0+IHtcclxuICBpZiAoXHJcbiAgICBzY3JpcHRUeXBlID09PSAncDJzaCcgfHxcclxuICAgIHNjcmlwdFR5cGUgPT09ICdwMndzaCcgfHxcclxuICAgIHNjcmlwdFR5cGUgPT09ICdwMnNoUDJ3c2gnIHx8XHJcbiAgICBzY3JpcHRUeXBlID09PSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcgfHxcclxuICAgIHNjcmlwdFR5cGUgPT09ICdwMnNoUDJwaydcclxuICApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzY3JpcHQgdHlwZScpO1xyXG4gIH1cclxuICBjb25zdCBtYXRjaCA9IG1hdGNoU2NyaXB0KFtwdWJTY3JpcHRdLCBbeyAnOnNjcmlwdCc6IFsnT1BfMScsICc6cHVia2V5LXhvbmx5J10gfV0pO1xyXG4gIGlmIChtYXRjaCBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpIHtcclxuICAgIHJldHVybiBtYXRjaDtcclxuICB9XHJcblxyXG4gIGNvbnN0IFtzY3JpcHRdID0gbWF0Y2hbJzpzY3JpcHQnXTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHNjcmlwdFR5cGU6ICd0YXByb290S2V5UGF0aFNwZW5kJyxcclxuICAgIHB1YmxpY0tleXM6IHNjcmlwdC5tYXRjaFsnOnB1YmtleS14b25seSddIGFzIFtCdWZmZXJdLFxyXG4gICAgcHViU2NyaXB0OiBwdWJTY3JpcHQsXHJcbiAgfTtcclxufTtcclxuXHJcbmNvbnN0IHBhcnNlVGFwcm9vdFNjcmlwdFBhdGhQdWJTY3JpcHQ6IFB1YlNjcmlwdFBhcnNlcjxQYXJzZWRQdWJTY3JpcHRUYXByb290U2NyaXB0UGF0aD4gPSAocHViU2NyaXB0LCBzY3JpcHRUeXBlKSA9PiB7XHJcbiAgaWYgKFxyXG4gICAgc2NyaXB0VHlwZSA9PT0gJ3Ayc2gnIHx8XHJcbiAgICBzY3JpcHRUeXBlID09PSAncDJ3c2gnIHx8XHJcbiAgICBzY3JpcHRUeXBlID09PSAncDJzaFAyd3NoJyB8fFxyXG4gICAgc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnIHx8XHJcbiAgICBzY3JpcHRUeXBlID09PSAncDJzaFAycGsnXHJcbiAgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc2NyaXB0IHR5cGUnKTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2ggPSBtYXRjaFNjcmlwdChcclxuICAgIFtwdWJTY3JpcHRdLFxyXG4gICAgW3sgJzpzY3JpcHQnOiBbJzpwdWJrZXkteG9ubHknLCAnT1BfQ0hFQ0tTSUdWRVJJRlknLCAnOnB1YmtleS14b25seScsICdPUF9DSEVDS1NJRyddIH1dXHJcbiAgKTtcclxuICBpZiAobWF0Y2ggaW5zdGFuY2VvZiBNYXRjaEVycm9yKSB7XHJcbiAgICByZXR1cm4gbWF0Y2g7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgc2NyaXB0VHlwZSxcclxuICAgIHB1YlNjcmlwdDogbWF0Y2hbJzpzY3JpcHQnXVswXS5idWZmZXIsXHJcbiAgICBwdWJsaWNLZXlzOiBtYXRjaFsnOnNjcmlwdCddWzBdLm1hdGNoWyc6cHVia2V5LXhvbmx5J10gYXMgW0J1ZmZlciwgQnVmZmVyXSxcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEByZXR1cm4gcHViU2NyaXB0IChzY3JpcHRQdWJLZXkvcmVkZWVtU2NyaXB0L3dpdG5lc3NTY3JpcHQpIGlzIHBhcnNlZC5cclxuICogUDJTSCA9PiBzY3JpcHRUeXBlLCBwdWJTY3JpcHQgKHJlZGVlbVNjcmlwdCksIHJlZGVlbVNjcmlwdCwgcHVibGljIGtleXNcclxuICogUFcyU0ggPT4gc2NyaXB0VHlwZSwgcHViU2NyaXB0ICh3aXRuZXNzU2NyaXB0KSwgd2l0bmVzc1NjcmlwdCwgcHVibGljIGtleXMuXHJcbiAqIFAyU0gtUFcyU0ggPT4gc2NyaXB0VHlwZSwgcHViU2NyaXB0ICh3aXRuZXNzU2NyaXB0KSwgd2l0bmVzc1NjcmlwdCwgcHVibGljIGtleXMuXHJcbiAqIHRhcHJvb3RTY3JpcHRQYXRoU3BlbmQgKFAyVFIgYW5kIFAyVFJNVUlTRzIgc2NyaXB0IHBhdGgpID0+IHNjcmlwdFR5cGUsIHB1YlNjcmlwdCwgcHViIGtleXMuXHJcbiAqIHRhcHJvb3RLZXlQYXRoU3BlbmQgKFAyVFJNVUlTRzIga2V5IHBhdGgpID0+IHNjcmlwdFR5cGUsIHB1YlNjcmlwdCAoMzQtYnl0ZSBvdXRwdXQgc2NyaXB0KSwgcHViIGtleSAodGFwT3V0cHV0S2V5KS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVB1YlNjcmlwdDJPZjMoXHJcbiAgaW5wdXRQdWJTY3JpcHQ6IElucHV0UHViU2NyaXB0LFxyXG4gIHNjcmlwdFR5cGU6ICd0YXByb290S2V5UGF0aFNwZW5kJ1xyXG4pOiBQYXJzZWRQdWJTY3JpcHRUYXByb290S2V5UGF0aDtcclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHViU2NyaXB0Mk9mMyhcclxuICBpbnB1dFB1YlNjcmlwdDogSW5wdXRQdWJTY3JpcHQsXHJcbiAgc2NyaXB0VHlwZTogJ3RhcHJvb3RTY3JpcHRQYXRoU3BlbmQnXHJcbik6IFBhcnNlZFB1YlNjcmlwdFRhcHJvb3RTY3JpcHRQYXRoO1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQdWJTY3JpcHQyT2YzKFxyXG4gIGlucHV0UHViU2NyaXB0OiBJbnB1dFB1YlNjcmlwdCxcclxuICBzY3JpcHRUeXBlOiAncDJzaCcgfCAncDJzaFAyd3NoJyB8ICdwMndzaCdcclxuKTogUGFyc2VkUHViU2NyaXB0UDJtcztcclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHViU2NyaXB0Mk9mMyhcclxuICBpbnB1dFB1YlNjcmlwdDogSW5wdXRQdWJTY3JpcHQsXHJcbiAgc2NyaXB0VHlwZTogUGFyc2VkU2NyaXB0VHlwZTJPZjNcclxuKTogUGFyc2VkUHViU2NyaXB0UDJtcyB8IFBhcnNlZFB1YlNjcmlwdFRhcHJvb3Q7XHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVB1YlNjcmlwdDJPZjMoXHJcbiAgaW5wdXRQdWJTY3JpcHQ6IElucHV0UHViU2NyaXB0LFxyXG4gIHNjcmlwdFR5cGU6IFBhcnNlZFNjcmlwdFR5cGUyT2YzXHJcbik6IFBhcnNlZFB1YlNjcmlwdFAybXMgfCBQYXJzZWRQdWJTY3JpcHRUYXByb290IHtcclxuICBjb25zdCByZXN1bHQgPVxyXG4gICAgc2NyaXB0VHlwZSA9PT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnXHJcbiAgICAgID8gcGFyc2VUYXByb290S2V5UGF0aFB1YlNjcmlwdChpbnB1dFB1YlNjcmlwdCwgc2NyaXB0VHlwZSlcclxuICAgICAgOiBzY3JpcHRUeXBlID09PSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCdcclxuICAgICAgPyBwYXJzZVRhcHJvb3RTY3JpcHRQYXRoUHViU2NyaXB0KGlucHV0UHViU2NyaXB0LCBzY3JpcHRUeXBlKVxyXG4gICAgICA6IHBhcnNlUDJtc1B1YlNjcmlwdChpbnB1dFB1YlNjcmlwdCwgc2NyaXB0VHlwZSk7XHJcblxyXG4gIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBNYXRjaEVycm9yKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0Lm1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgaWYgKFxyXG4gICAgKHJlc3VsdC5zY3JpcHRUeXBlID09PSAndGFwcm9vdEtleVBhdGhTcGVuZCcgJiYgcmVzdWx0LnB1YmxpY0tleXMubGVuZ3RoICE9PSAxKSB8fFxyXG4gICAgKHJlc3VsdC5zY3JpcHRUeXBlID09PSAndGFwcm9vdFNjcmlwdFBhdGhTcGVuZCcgJiYgcmVzdWx0LnB1YmxpY0tleXMubGVuZ3RoICE9PSAyKSB8fFxyXG4gICAgKGlzU2NyaXB0VHlwZTJPZjMocmVzdWx0LnNjcmlwdFR5cGUpICYmIHJlc3VsdC5wdWJsaWNLZXlzLmxlbmd0aCAhPT0gMylcclxuICApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcigndW5leHBlY3RlZCBwdWJrZXkgY291bnQnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJuIHB1YlNjcmlwdCAoc2NyaXB0UHViS2V5L3JlZGVlbVNjcmlwdC93aXRuZXNzU2NyaXB0KSBpcyBwYXJzZWQuXHJcbiAqIFAyU0ggPT4gc2NyaXB0VHlwZSwgcHViU2NyaXB0IChyZWRlZW1TY3JpcHQpLCByZWRlZW1TY3JpcHQsIHB1YmxpYyBrZXlzXHJcbiAqIFBXMlNIID0+IHNjcmlwdFR5cGUsIHB1YlNjcmlwdCAod2l0bmVzc1NjcmlwdCksIHdpdG5lc3NTY3JpcHQsIHB1YmxpYyBrZXlzLlxyXG4gKiBQMlNILVBXMlNIID0+IHNjcmlwdFR5cGUsIHB1YlNjcmlwdCAod2l0bmVzc1NjcmlwdCksIHdpdG5lc3NTY3JpcHQsIHB1YmxpYyBrZXlzLlxyXG4gKiB0YXByb290U2NyaXB0UGF0aFNwZW5kIChQMlRSIGFuZCBQMlRSTVVJU0cyIHNjcmlwdCBwYXRoKSA9PiBzY3JpcHRUeXBlLCBwdWJTY3JpcHQsIHB1YiBrZXlzLlxyXG4gKiB0YXByb290S2V5UGF0aFNwZW5kIChQMlRSTVVJU0cyIGtleSBwYXRoKSA9PiBzY3JpcHRUeXBlLCBwdWJTY3JpcHQgKDM0LWJ5dGUgb3V0cHV0IHNjcmlwdCksIHB1YiBrZXkgKHRhcE91dHB1dEtleSkuXHJcbiAqIFAyU0gtUDJQSyA9PiBzY3JpcHRUeXBlLCBwdWJTY3JpcHQsIHB1YiBrZXksIHJlZGVlbVNjcmlwdC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVB1YlNjcmlwdChcclxuICBpbnB1dFB1YlNjcmlwdDogSW5wdXRQdWJTY3JpcHQsXHJcbiAgc2NyaXB0VHlwZTogJ3RhcHJvb3RLZXlQYXRoU3BlbmQnXHJcbik6IFBhcnNlZFB1YlNjcmlwdFRhcHJvb3RLZXlQYXRoO1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQdWJTY3JpcHQoXHJcbiAgaW5wdXRQdWJTY3JpcHQ6IElucHV0UHViU2NyaXB0LFxyXG4gIHNjcmlwdFR5cGU6ICd0YXByb290U2NyaXB0UGF0aFNwZW5kJ1xyXG4pOiBQYXJzZWRQdWJTY3JpcHRUYXByb290U2NyaXB0UGF0aDtcclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHViU2NyaXB0KGlucHV0UHViU2NyaXB0OiBJbnB1dFB1YlNjcmlwdCwgc2NyaXB0VHlwZTogJ3Ayc2hQMnBrJyk6IFBhcnNlZFB1YlNjcmlwdFAyc2hQMnBrO1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQdWJTY3JpcHQoXHJcbiAgaW5wdXRQdWJTY3JpcHQ6IElucHV0UHViU2NyaXB0LFxyXG4gIHNjcmlwdFR5cGU6ICdwMnNoJyB8ICdwMnNoUDJ3c2gnIHwgJ3Ayd3NoJ1xyXG4pOiBQYXJzZWRQdWJTY3JpcHRQMm1zO1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQdWJTY3JpcHQoXHJcbiAgaW5wdXRQdWJTY3JpcHQ6IElucHV0UHViU2NyaXB0LFxyXG4gIHNjcmlwdFR5cGU6IFBhcnNlZFNjcmlwdFR5cGVcclxuKTogUGFyc2VkUHViU2NyaXB0UDJtcyB8IFBhcnNlZFB1YlNjcmlwdFRhcHJvb3QgfCBQYXJzZWRQdWJTY3JpcHRQMnNoUDJwaztcclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHViU2NyaXB0KFxyXG4gIGlucHV0UHViU2NyaXB0OiBJbnB1dFB1YlNjcmlwdCxcclxuICBzY3JpcHRUeXBlOiBQYXJzZWRTY3JpcHRUeXBlXHJcbik6IFBhcnNlZFB1YlNjcmlwdFAybXMgfCBQYXJzZWRQdWJTY3JpcHRUYXByb290IHwgUGFyc2VkUHViU2NyaXB0UDJzaFAycGsge1xyXG4gIGNvbnN0IHJlc3VsdCA9XHJcbiAgICBzY3JpcHRUeXBlID09PSAncDJzaFAycGsnXHJcbiAgICAgID8gcGFyc2VQMnNoUDJwa1B1YlNjcmlwdChpbnB1dFB1YlNjcmlwdCwgc2NyaXB0VHlwZSlcclxuICAgICAgOiBwYXJzZVB1YlNjcmlwdDJPZjMoaW5wdXRQdWJTY3JpcHQsIHNjcmlwdFR5cGUpO1xyXG5cclxuICBpZiAocmVzdWx0IGluc3RhbmNlb2YgTWF0Y2hFcnJvcikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5tZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIGlmIChyZXN1bHQuc2NyaXB0VHlwZSA9PT0gJ3Ayc2hQMnBrJyAmJiByZXN1bHQucHVibGljS2V5cy5sZW5ndGggIT09IDEpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcigndW5leHBlY3RlZCBwdWJrZXkgY291bnQnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuIl19