"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.musig2DeterministicSign = exports.createMusig2DeterministicNonce = exports.getSigHashTypeFromSigs = exports.assertPsbtMusig2Nonces = exports.assertPsbtMusig2Participants = exports.parsePsbtMusig2PartialSigs = exports.parsePsbtMusig2Nonces = exports.parsePsbtMusig2Participants = exports.createMusig2SigningSession = exports.musig2AggregateSigs = exports.musig2PartialSigVerify = exports.musig2PartialSign = exports.createTapTweak = exports.createAggregateNonce = exports.createTapOutputKey = exports.createTapInternalKey = exports.decodePsbtMusig2PartialSig = exports.decodePsbtMusig2Nonce = exports.decodePsbtMusig2Participants = exports.encodePsbtMusig2PartialSig = exports.encodePsbtMusig2PubNonce = exports.encodePsbtMusig2Participants = exports.Musig2NonceStore = void 0;
const outputScripts_1 = require("./outputScripts");
const noble_ecc_1 = require("../noble_ecc");
const taproot_1 = require("../taproot");
const index_1 = require("../index");
const PsbtUtil_1 = require("./PsbtUtil");
/**
 * Because musig uses reference-equal buffers to cache nonces, we wrap it here to allow using
 * nonces that are byte-equal but not reference-equal.
 */
class Musig2NonceStore {
    constructor() {
        this.nonces = [];
    }
    /**
     * Get original Buffer instance for nonce (which may be a copy).
     * @return byte-equal buffer that is reference-equal to what was stored earlier in createMusig2Nonce
     */
    getRef(nonce) {
        for (const b of this.nonces) {
            if (Buffer.from(b).equals(nonce)) {
                return b;
            }
        }
        throw new Error(`unknown nonce`);
    }
    /**
     * Creates musig2 nonce and stores buffer reference.
     * tapInternalkey, tapMerkleRoot, tapBip32Derivation for rootWalletKey are required per p2trMusig2 key path input.
     * Also participant keys are required from psbt proprietary key values.
     * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
     * @param privateKey - signer private key
     * @param publicKey - signer xy public key
     * @param xOnlyPublicKey - tweaked aggregated key (tapOutputKey)
     * @param sessionId Additional entropy. If provided it must either be a counter unique to this secret key,
     * (converted to an array of 32 bytes), or 32 uniformly random bytes.
     */
    createMusig2Nonce(privateKey, publicKey, xOnlyPublicKey, txHash, sessionId) {
        if (txHash.length != 32) {
            throw new Error(`Invalid txHash size ${txHash}`);
        }
        const buf = noble_ecc_1.musig.nonceGen({ secretKey: privateKey, publicKey, xOnlyPublicKey, msg: txHash, sessionId });
        this.nonces.push(buf);
        return buf;
    }
}
exports.Musig2NonceStore = Musig2NonceStore;
/**
 * Psbt proprietary key val util function for participants pub keys. SubType is 0x01
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return x-only tapOutputKey||tapInternalKey as sub keydata, plain sigining participant keys as valuedata
 */
function encodePsbtMusig2Participants(participants) {
    const keydata = [participants.tapOutputKey, participants.tapInternalKey].map((pubkey) => (0, outputScripts_1.checkXOnlyPublicKey)(pubkey));
    const value = participants.participantPubKeys.map((pubkey) => (0, outputScripts_1.checkPlainPublicKey)(pubkey));
    const key = {
        identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
        keydata: Buffer.concat(keydata),
    };
    return { key, value: Buffer.concat(value) };
}
exports.encodePsbtMusig2Participants = encodePsbtMusig2Participants;
/**
 * Psbt proprietary key val util function for pub nonce. SubType is 0x02
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return plain-participantPubKey||x-only-tapOutputKey as sub keydata, 66 bytes of 2 pub nonces as valuedata
 */
function encodePsbtMusig2PubNonce(nonce) {
    if (nonce.pubNonce.length !== 66) {
        throw new Error(`Invalid pubNonces length ${nonce.pubNonce.length}`);
    }
    const keydata = Buffer.concat([
        (0, outputScripts_1.checkPlainPublicKey)(nonce.participantPubKey),
        (0, outputScripts_1.checkXOnlyPublicKey)(nonce.tapOutputKey),
    ]);
    const key = {
        identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        keydata,
    };
    return { key, value: nonce.pubNonce };
}
exports.encodePsbtMusig2PubNonce = encodePsbtMusig2PubNonce;
function encodePsbtMusig2PartialSig(partialSig) {
    if (partialSig.partialSig.length !== 32 && partialSig.partialSig.length !== 33) {
        throw new Error(`Invalid partialSig length ${partialSig.partialSig.length}`);
    }
    const keydata = Buffer.concat([
        (0, outputScripts_1.checkPlainPublicKey)(partialSig.participantPubKey),
        (0, outputScripts_1.checkXOnlyPublicKey)(partialSig.tapOutputKey),
    ]);
    const key = {
        identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
        keydata,
    };
    return { key, value: partialSig.partialSig };
}
exports.encodePsbtMusig2PartialSig = encodePsbtMusig2PartialSig;
/**
 * Decodes proprietary key value data for participant pub keys
 * @param kv
 */
function decodePsbtMusig2Participants(kv) {
    if (kv.key.identifier !== PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER ||
        kv.key.subtype !== PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS) {
        throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`);
    }
    const key = kv.key.keydata;
    if (key.length !== 64) {
        throw new Error(`Invalid keydata size ${key.length} for participant pub keys`);
    }
    const value = kv.value;
    if (value.length !== 66) {
        throw new Error(`Invalid valuedata size ${value.length} for participant pub keys`);
    }
    const participantPubKeys = [value.subarray(0, 33), value.subarray(33)];
    if (participantPubKeys[0].equals(participantPubKeys[1])) {
        throw new Error(`Duplicate participant pub keys found`);
    }
    return { tapOutputKey: key.subarray(0, 32), tapInternalKey: key.subarray(32), participantPubKeys };
}
exports.decodePsbtMusig2Participants = decodePsbtMusig2Participants;
/**
 * Decodes proprietary key value data for musig2 nonce
 * @param kv
 */
function decodePsbtMusig2Nonce(kv) {
    if (kv.key.identifier !== PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER || kv.key.subtype !== PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PUB_NONCE) {
        throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for nonce`);
    }
    const key = kv.key.keydata;
    if (key.length !== 65) {
        throw new Error(`Invalid keydata size ${key.length} for nonce`);
    }
    const value = kv.value;
    if (value.length !== 66) {
        throw new Error(`Invalid valuedata size ${value.length} for nonce`);
    }
    return { participantPubKey: key.subarray(0, 33), tapOutputKey: key.subarray(33), pubNonce: value };
}
exports.decodePsbtMusig2Nonce = decodePsbtMusig2Nonce;
/**
 * Decodes proprietary key value data for musig2 partial sig
 * @param kv
 */
function decodePsbtMusig2PartialSig(kv) {
    if (kv.key.identifier !== PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER ||
        kv.key.subtype !== PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG) {
        throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for partial sig`);
    }
    const key = kv.key.keydata;
    if (key.length !== 65) {
        throw new Error(`Invalid keydata size ${key.length} for partial sig`);
    }
    const value = kv.value;
    if (value.length !== 32 && value.length !== 33) {
        throw new Error(`Invalid valuedata size ${value.length} for partial sig`);
    }
    return { participantPubKey: key.subarray(0, 33), tapOutputKey: key.subarray(33), partialSig: value };
}
exports.decodePsbtMusig2PartialSig = decodePsbtMusig2PartialSig;
function createTapInternalKey(plainPubKeys) {
    return Buffer.from(noble_ecc_1.musig.getXOnlyPubkey(noble_ecc_1.musig.keyAgg(plainPubKeys)));
}
exports.createTapInternalKey = createTapInternalKey;
function createTapOutputKey(internalPubKey, tapTreeRoot) {
    return Buffer.from((0, taproot_1.tapTweakPubkey)(noble_ecc_1.ecc, (0, outputScripts_1.toXOnlyPublicKey)(internalPubKey), (0, outputScripts_1.checkTapMerkleRoot)(tapTreeRoot)).xOnlyPubkey);
}
exports.createTapOutputKey = createTapOutputKey;
function createAggregateNonce(pubNonces) {
    return Buffer.from(noble_ecc_1.musig.nonceAgg(pubNonces));
}
exports.createAggregateNonce = createAggregateNonce;
function createTapTweak(tapInternalKey, tapMerkleRoot) {
    return Buffer.from((0, taproot_1.calculateTapTweak)((0, outputScripts_1.checkXOnlyPublicKey)(tapInternalKey), (0, outputScripts_1.checkTapMerkleRoot)(tapMerkleRoot)));
}
exports.createTapTweak = createTapTweak;
function startMusig2SigningSession(aggNonce, hash, publicKeys, tweak) {
    return noble_ecc_1.musig.startSigningSession(aggNonce, hash, publicKeys, { tweak, xOnly: true });
}
function musig2PartialSign(privateKey, publicNonce, sessionKey, nonceStore) {
    (0, outputScripts_1.checkTxHash)(Buffer.from(sessionKey.msg));
    return Buffer.from(noble_ecc_1.musig.partialSign({
        secretKey: privateKey,
        publicNonce: nonceStore.getRef(publicNonce),
        sessionKey,
    }));
}
exports.musig2PartialSign = musig2PartialSign;
function musig2PartialSigVerify(sig, publicKey, publicNonce, sessionKey) {
    (0, outputScripts_1.checkTxHash)(Buffer.from(sessionKey.msg));
    return noble_ecc_1.musig.partialVerify({ sig, publicKey, publicNonce, sessionKey });
}
exports.musig2PartialSigVerify = musig2PartialSigVerify;
function musig2AggregateSigs(sigs, sessionKey) {
    return Buffer.from(noble_ecc_1.musig.signAgg(sigs, sessionKey));
}
exports.musig2AggregateSigs = musig2AggregateSigs;
/** @return session key that can be used to reference the session later */
function createMusig2SigningSession(sessionArgs) {
    (0, outputScripts_1.checkTxHash)(sessionArgs.txHash);
    const aggNonce = createAggregateNonce(sessionArgs.pubNonces);
    const tweak = createTapTweak(sessionArgs.internalPubKey, sessionArgs.tapTreeRoot);
    return startMusig2SigningSession(aggNonce, sessionArgs.txHash, sessionArgs.pubKeys, tweak);
}
exports.createMusig2SigningSession = createMusig2SigningSession;
/**
 * @returns psbt proprietary key for musig2 participant key value data
 * If no key value exists, undefined is returned.
 */
function parsePsbtMusig2Participants(input) {
    const participantsKeyVals = (0, PsbtUtil_1.getPsbtInputProprietaryKeyVals)(input, {
        identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
    });
    if (!participantsKeyVals.length) {
        return undefined;
    }
    if (participantsKeyVals.length > 1) {
        throw new Error(`Found ${participantsKeyVals.length} matching participant key value instead of 1`);
    }
    return decodePsbtMusig2Participants(participantsKeyVals[0]);
}
exports.parsePsbtMusig2Participants = parsePsbtMusig2Participants;
/**
 * @returns psbt proprietary key for musig2 public nonce key value data
 * If no key value exists, undefined is returned.
 */
function parsePsbtMusig2Nonces(input) {
    const nonceKeyVals = (0, PsbtUtil_1.getPsbtInputProprietaryKeyVals)(input, {
        identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
    });
    if (!nonceKeyVals.length) {
        return undefined;
    }
    if (nonceKeyVals.length > 2) {
        throw new Error(`Found ${nonceKeyVals.length} matching nonce key value instead of 1 or 2`);
    }
    return nonceKeyVals.map((kv) => decodePsbtMusig2Nonce(kv));
}
exports.parsePsbtMusig2Nonces = parsePsbtMusig2Nonces;
/**
 * @returns psbt proprietary key for musig2 partial sig key value data
 * If no key value exists, undefined is returned.
 */
function parsePsbtMusig2PartialSigs(input) {
    const sigKeyVals = (0, PsbtUtil_1.getPsbtInputProprietaryKeyVals)(input, {
        identifier: PsbtUtil_1.PSBT_PROPRIETARY_IDENTIFIER,
        subtype: PsbtUtil_1.ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
    });
    if (!sigKeyVals.length) {
        return undefined;
    }
    if (sigKeyVals.length > 2) {
        throw new Error(`Found ${sigKeyVals.length} matching partial signature key value instead of 1 or 2`);
    }
    return sigKeyVals.map((kv) => decodePsbtMusig2PartialSig(kv));
}
exports.parsePsbtMusig2PartialSigs = parsePsbtMusig2PartialSigs;
/**
 * Assert musig2 participant key value data with tapInternalKey and tapMerkleRoot.
 * <tapOutputKey><tapInputKey> => <participantKey1><participantKey2>
 * Using tapMerkleRoot and 2 participant keys, the tapInputKey is validated and using tapMerkleRoot and tapInputKey,
 * the tapOutputKey is validated.
 */
function assertPsbtMusig2Participants(participantKeyValData, tapInternalKey, tapMerkleRoot) {
    (0, outputScripts_1.checkXOnlyPublicKey)(tapInternalKey);
    (0, outputScripts_1.checkTapMerkleRoot)(tapMerkleRoot);
    const participantPubKeys = participantKeyValData.participantPubKeys;
    const internalKey = createTapInternalKey(participantPubKeys);
    if (!internalKey.equals(participantKeyValData.tapInternalKey)) {
        throw new Error('Invalid participants keydata tapInternalKey');
    }
    const outputKey = createTapOutputKey(internalKey, tapMerkleRoot);
    if (!outputKey.equals(participantKeyValData.tapOutputKey)) {
        throw new Error('Invalid participants keydata tapOutputKey');
    }
    if (!internalKey.equals(tapInternalKey)) {
        throw new Error('tapInternalKey and aggregated participant pub keys does not match');
    }
}
exports.assertPsbtMusig2Participants = assertPsbtMusig2Participants;
/**
 * Assert musig2 public nonce key value data with participant key value data
 * (refer assertPsbtMusig2ParticipantsKeyValData).
 * <participantKey1><tapOutputKey> => <pubNonce1>
 * <participantKey2><tapOutputKey> => <pubNonce2>
 * Checks against participant keys and tapOutputKey
 */
function assertPsbtMusig2Nonces(noncesKeyValData, participantKeyValData) {
    (0, outputScripts_1.checkXOnlyPublicKey)(participantKeyValData.tapOutputKey);
    participantKeyValData.participantPubKeys.forEach((kv) => (0, outputScripts_1.checkPlainPublicKey)(kv));
    if (participantKeyValData.participantPubKeys[0].equals(participantKeyValData.participantPubKeys[1])) {
        throw new Error(`Duplicate participant pub keys found`);
    }
    if (noncesKeyValData.length > 2) {
        throw new Error(`Invalid nonce key value count ${noncesKeyValData.length}`);
    }
    noncesKeyValData.forEach((nonceKv) => {
        const index = participantKeyValData.participantPubKeys.findIndex((pubKey) => nonceKv.participantPubKey.equals(pubKey));
        if (index < 0) {
            throw new Error('Invalid nonce keydata participant pub key');
        }
        if (!nonceKv.tapOutputKey.equals(participantKeyValData.tapOutputKey)) {
            throw new Error('Invalid nonce keydata tapOutputKey');
        }
    });
}
exports.assertPsbtMusig2Nonces = assertPsbtMusig2Nonces;
/**
 * @returns Input object but sig hash type data is taken out from partialSig field.
 * If sig hash type is not common for all sigs, error out, otherwise returns the modified object and single hash type.
 */
function getSigHashTypeFromSigs(partialSigs) {
    if (!partialSigs.length) {
        throw new Error('partialSigs array can not be empty');
    }
    const pSigsWithHashType = partialSigs.map((kv) => {
        const { partialSig, participantPubKey, tapOutputKey } = kv;
        return partialSig.length === 33
            ? { pSig: { partialSig: partialSig.slice(0, 32), participantPubKey, tapOutputKey }, sigHashType: partialSig[32] }
            : { pSig: { partialSig, participantPubKey, tapOutputKey }, sigHashType: index_1.Transaction.SIGHASH_DEFAULT };
    });
    const sigHashType = pSigsWithHashType[0].sigHashType;
    if (!pSigsWithHashType.every((pSig) => pSig.sigHashType === sigHashType)) {
        throw new Error('signatures must use same sig hash type');
    }
    return { partialSigs: pSigsWithHashType.map(({ pSig }) => pSig), sigHashType };
}
exports.getSigHashTypeFromSigs = getSigHashTypeFromSigs;
function createMusig2DeterministicNonce(params) {
    return Buffer.from(noble_ecc_1.musig.deterministicNonceGen({
        secretKey: params.privateKey,
        aggOtherNonce: noble_ecc_1.musig.nonceAgg([params.otherNonce]),
        publicKeys: params.publicKeys,
        tweaks: [{ tweak: createTapTweak(params.internalPubKey, params.tapTreeRoot), xOnly: true }],
        msg: params.hash,
    }).publicNonce);
}
exports.createMusig2DeterministicNonce = createMusig2DeterministicNonce;
function musig2DeterministicSign(params) {
    const { sig, sessionKey, publicNonce } = noble_ecc_1.musig.deterministicSign({
        secretKey: params.privateKey,
        aggOtherNonce: noble_ecc_1.musig.nonceAgg([params.otherNonce]),
        publicKeys: params.publicKeys,
        tweaks: [{ tweak: createTapTweak(params.internalPubKey, params.tapTreeRoot), xOnly: true }],
        msg: params.hash,
    });
    return { sig: Buffer.from(sig), sessionKey, publicNonce: Buffer.from(publicNonce) };
}
exports.musig2DeterministicSign = musig2DeterministicSign;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWcyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL011c2lnMi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtREFNeUI7QUFDekIsNENBQTBDO0FBRTFDLHdDQUErRDtBQUMvRCxvQ0FBdUM7QUFFdkMseUNBS29CO0FBc0NwQjs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUE3QjtRQUNVLFdBQU0sR0FBaUIsRUFBRSxDQUFDO0lBd0NwQyxDQUFDO0lBdENDOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxLQUFpQjtRQUN0QixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDM0IsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDaEMsT0FBTyxDQUFDLENBQUM7YUFDVjtTQUNGO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILGlCQUFpQixDQUNmLFVBQXNCLEVBQ3RCLFNBQXFCLEVBQ3JCLGNBQTBCLEVBQzFCLE1BQWtCLEVBQ2xCLFNBQWtCO1FBRWxCLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQUU7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsTUFBTSxFQUFFLENBQUMsQ0FBQztTQUNsRDtRQUNELE1BQU0sR0FBRyxHQUFHLGlCQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN6RyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQXpDRCw0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QUFLLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUMzRixHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDLFdBQVcsQ0FDZixDQUFDO0FBQ0osQ0FBQztBQVZELHdFQVVDO0FBRUQsU0FBZ0IsdUJBQXVCLENBQUMsTUFBcUM7SUFLM0UsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLEdBQUcsaUJBQUssQ0FBQyxpQkFBaUIsQ0FBQztRQUMvRCxTQUFTLEVBQUUsTUFBTSxDQUFDLFVBQVU7UUFDNUIsYUFBYSxFQUFFLGlCQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtRQUM3QixNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzNGLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSTtLQUNqQixDQUFDLENBQUM7SUFDSCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7QUFDdEYsQ0FBQztBQWJELDBEQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Vzc2lvbktleSB9IGZyb20gJ0BicmFuZG9uYmxhY2svbXVzaWcnO1xyXG5cclxuaW1wb3J0IHtcclxuICBjaGVja1BsYWluUHVibGljS2V5LFxyXG4gIGNoZWNrVGFwTWVya2xlUm9vdCxcclxuICBjaGVja1R4SGFzaCxcclxuICBjaGVja1hPbmx5UHVibGljS2V5LFxyXG4gIHRvWE9ubHlQdWJsaWNLZXksXHJcbn0gZnJvbSAnLi9vdXRwdXRTY3JpcHRzJztcclxuaW1wb3J0IHsgZWNjLCBtdXNpZyB9IGZyb20gJy4uL25vYmxlX2VjYyc7XHJcbmltcG9ydCB7IFR1cGxlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGNhbGN1bGF0ZVRhcFR3ZWFrLCB0YXBUd2Vha1B1YmtleSB9IGZyb20gJy4uL3RhcHJvb3QnO1xyXG5pbXBvcnQgeyBUcmFuc2FjdGlvbiB9IGZyb20gJy4uL2luZGV4JztcclxuaW1wb3J0IHsgUHNidElucHV0IH0gZnJvbSAnYmlwMTc0L3NyYy9saWIvaW50ZXJmYWNlcyc7XHJcbmltcG9ydCB7XHJcbiAgZ2V0UHNidElucHV0UHJvcHJpZXRhcnlLZXlWYWxzLFxyXG4gIFByb3ByaWV0YXJ5S2V5U3VidHlwZSxcclxuICBQcm9wcmlldGFyeUtleVZhbHVlLFxyXG4gIFBTQlRfUFJPUFJJRVRBUllfSURFTlRJRklFUixcclxufSBmcm9tICcuL1BzYnRVdGlsJztcclxuXHJcbi8qKlxyXG4gKiAgUGFydGljaXBhbnQga2V5IHZhbHVlIG9iamVjdC5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHNidE11c2lnMlBhcnRpY2lwYW50cyB7XHJcbiAgdGFwT3V0cHV0S2V5OiBCdWZmZXI7XHJcbiAgdGFwSW50ZXJuYWxLZXk6IEJ1ZmZlcjtcclxuICBwYXJ0aWNpcGFudFB1YktleXM6IFR1cGxlPEJ1ZmZlcj47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHNidE11c2lnMkRldGVybWluaXN0aWNQYXJhbXMge1xyXG4gIHByaXZhdGVLZXk6IEJ1ZmZlcjtcclxuICBvdGhlck5vbmNlOiBCdWZmZXI7XHJcbiAgcHVibGljS2V5czogVHVwbGU8QnVmZmVyPjtcclxuICBpbnRlcm5hbFB1YktleTogQnVmZmVyO1xyXG4gIHRhcFRyZWVSb290OiBCdWZmZXI7XHJcbiAgaGFzaDogQnVmZmVyO1xyXG59XHJcblxyXG4vKipcclxuICogIE5vbmNlIGtleSB2YWx1ZSBvYmplY3QuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFBzYnRNdXNpZzJQdWJOb25jZSB7XHJcbiAgcGFydGljaXBhbnRQdWJLZXk6IEJ1ZmZlcjtcclxuICB0YXBPdXRwdXRLZXk6IEJ1ZmZlcjtcclxuICBwdWJOb25jZTogQnVmZmVyO1xyXG59XHJcblxyXG4vKipcclxuICogIFBhcnRpYWwgc2lnbmF0dXJlIGtleSB2YWx1ZSBvYmplY3QuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFBzYnRNdXNpZzJQYXJ0aWFsU2lnIHtcclxuICBwYXJ0aWNpcGFudFB1YktleTogQnVmZmVyO1xyXG4gIHRhcE91dHB1dEtleTogQnVmZmVyO1xyXG4gIHBhcnRpYWxTaWc6IEJ1ZmZlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJlY2F1c2UgbXVzaWcgdXNlcyByZWZlcmVuY2UtZXF1YWwgYnVmZmVycyB0byBjYWNoZSBub25jZXMsIHdlIHdyYXAgaXQgaGVyZSB0byBhbGxvdyB1c2luZ1xyXG4gKiBub25jZXMgdGhhdCBhcmUgYnl0ZS1lcXVhbCBidXQgbm90IHJlZmVyZW5jZS1lcXVhbC5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBNdXNpZzJOb25jZVN0b3JlIHtcclxuICBwcml2YXRlIG5vbmNlczogVWludDhBcnJheVtdID0gW107XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBvcmlnaW5hbCBCdWZmZXIgaW5zdGFuY2UgZm9yIG5vbmNlICh3aGljaCBtYXkgYmUgYSBjb3B5KS5cclxuICAgKiBAcmV0dXJuIGJ5dGUtZXF1YWwgYnVmZmVyIHRoYXQgaXMgcmVmZXJlbmNlLWVxdWFsIHRvIHdoYXQgd2FzIHN0b3JlZCBlYXJsaWVyIGluIGNyZWF0ZU11c2lnMk5vbmNlXHJcbiAgICovXHJcbiAgZ2V0UmVmKG5vbmNlOiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XHJcbiAgICBmb3IgKGNvbnN0IGIgb2YgdGhpcy5ub25jZXMpIHtcclxuICAgICAgaWYgKEJ1ZmZlci5mcm9tKGIpLmVxdWFscyhub25jZSkpIHtcclxuICAgICAgICByZXR1cm4gYjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIG5vbmNlYCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIG11c2lnMiBub25jZSBhbmQgc3RvcmVzIGJ1ZmZlciByZWZlcmVuY2UuXHJcbiAgICogdGFwSW50ZXJuYWxrZXksIHRhcE1lcmtsZVJvb3QsIHRhcEJpcDMyRGVyaXZhdGlvbiBmb3Igcm9vdFdhbGxldEtleSBhcmUgcmVxdWlyZWQgcGVyIHAydHJNdXNpZzIga2V5IHBhdGggaW5wdXQuXHJcbiAgICogQWxzbyBwYXJ0aWNpcGFudCBrZXlzIGFyZSByZXF1aXJlZCBmcm9tIHBzYnQgcHJvcHJpZXRhcnkga2V5IHZhbHVlcy5cclxuICAgKiBSZWY6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3NhbmtldDE3MjkvNGI1MjVjNjA0OWY0ZDllMDM0ZDI3MzY4YzQ5ZjI4YTZcclxuICAgKiBAcGFyYW0gcHJpdmF0ZUtleSAtIHNpZ25lciBwcml2YXRlIGtleVxyXG4gICAqIEBwYXJhbSBwdWJsaWNLZXkgLSBzaWduZXIgeHkgcHVibGljIGtleVxyXG4gICAqIEBwYXJhbSB4T25seVB1YmxpY0tleSAtIHR3ZWFrZWQgYWdncmVnYXRlZCBrZXkgKHRhcE91dHB1dEtleSlcclxuICAgKiBAcGFyYW0gc2Vzc2lvbklkIEFkZGl0aW9uYWwgZW50cm9weS4gSWYgcHJvdmlkZWQgaXQgbXVzdCBlaXRoZXIgYmUgYSBjb3VudGVyIHVuaXF1ZSB0byB0aGlzIHNlY3JldCBrZXksXHJcbiAgICogKGNvbnZlcnRlZCB0byBhbiBhcnJheSBvZiAzMiBieXRlcyksIG9yIDMyIHVuaWZvcm1seSByYW5kb20gYnl0ZXMuXHJcbiAgICovXHJcbiAgY3JlYXRlTXVzaWcyTm9uY2UoXHJcbiAgICBwcml2YXRlS2V5OiBVaW50OEFycmF5LFxyXG4gICAgcHVibGljS2V5OiBVaW50OEFycmF5LFxyXG4gICAgeE9ubHlQdWJsaWNLZXk6IFVpbnQ4QXJyYXksXHJcbiAgICB0eEhhc2g6IFVpbnQ4QXJyYXksXHJcbiAgICBzZXNzaW9uSWQ/OiBCdWZmZXJcclxuICApOiBVaW50OEFycmF5IHtcclxuICAgIGlmICh0eEhhc2gubGVuZ3RoICE9IDMyKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB0eEhhc2ggc2l6ZSAke3R4SGFzaH1gKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGJ1ZiA9IG11c2lnLm5vbmNlR2VuKHsgc2VjcmV0S2V5OiBwcml2YXRlS2V5LCBwdWJsaWNLZXksIHhPbmx5UHVibGljS2V5LCBtc2c6IHR4SGFzaCwgc2Vzc2lvbklkIH0pO1xyXG4gICAgdGhpcy5ub25jZXMucHVzaChidWYpO1xyXG4gICAgcmV0dXJuIGJ1ZjtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQc2J0IHByb3ByaWV0YXJ5IGtleSB2YWwgdXRpbCBmdW5jdGlvbiBmb3IgcGFydGljaXBhbnRzIHB1YiBrZXlzLiBTdWJUeXBlIGlzIDB4MDFcclxuICogUmVmOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9zYW5rZXQxNzI5LzRiNTI1YzYwNDlmNGQ5ZTAzNGQyNzM2OGM0OWYyOGE2XHJcbiAqIEByZXR1cm4geC1vbmx5IHRhcE91dHB1dEtleXx8dGFwSW50ZXJuYWxLZXkgYXMgc3ViIGtleWRhdGEsIHBsYWluIHNpZ2luaW5nIHBhcnRpY2lwYW50IGtleXMgYXMgdmFsdWVkYXRhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHNidE11c2lnMlBhcnRpY2lwYW50cyhwYXJ0aWNpcGFudHM6IFBzYnRNdXNpZzJQYXJ0aWNpcGFudHMpOiBQcm9wcmlldGFyeUtleVZhbHVlIHtcclxuICBjb25zdCBrZXlkYXRhID0gW3BhcnRpY2lwYW50cy50YXBPdXRwdXRLZXksIHBhcnRpY2lwYW50cy50YXBJbnRlcm5hbEtleV0ubWFwKChwdWJrZXkpID0+IGNoZWNrWE9ubHlQdWJsaWNLZXkocHVia2V5KSk7XHJcbiAgY29uc3QgdmFsdWUgPSBwYXJ0aWNpcGFudHMucGFydGljaXBhbnRQdWJLZXlzLm1hcCgocHVia2V5KSA9PiBjaGVja1BsYWluUHVibGljS2V5KHB1YmtleSkpO1xyXG4gIGNvbnN0IGtleSA9IHtcclxuICAgIGlkZW50aWZpZXI6IFBTQlRfUFJPUFJJRVRBUllfSURFTlRJRklFUixcclxuICAgIHN1YnR5cGU6IFByb3ByaWV0YXJ5S2V5U3VidHlwZS5NVVNJRzJfUEFSVElDSVBBTlRfUFVCX0tFWVMsXHJcbiAgICBrZXlkYXRhOiBCdWZmZXIuY29uY2F0KGtleWRhdGEpLFxyXG4gIH07XHJcbiAgcmV0dXJuIHsga2V5LCB2YWx1ZTogQnVmZmVyLmNvbmNhdCh2YWx1ZSkgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBzYnQgcHJvcHJpZXRhcnkga2V5IHZhbCB1dGlsIGZ1bmN0aW9uIGZvciBwdWIgbm9uY2UuIFN1YlR5cGUgaXMgMHgwMlxyXG4gKiBSZWY6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3NhbmtldDE3MjkvNGI1MjVjNjA0OWY0ZDllMDM0ZDI3MzY4YzQ5ZjI4YTZcclxuICogQHJldHVybiBwbGFpbi1wYXJ0aWNpcGFudFB1YktleXx8eC1vbmx5LXRhcE91dHB1dEtleSBhcyBzdWIga2V5ZGF0YSwgNjYgYnl0ZXMgb2YgMiBwdWIgbm9uY2VzIGFzIHZhbHVlZGF0YVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVBzYnRNdXNpZzJQdWJOb25jZShub25jZTogUHNidE11c2lnMlB1Yk5vbmNlKTogUHJvcHJpZXRhcnlLZXlWYWx1ZSB7XHJcbiAgaWYgKG5vbmNlLnB1Yk5vbmNlLmxlbmd0aCAhPT0gNjYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBwdWJOb25jZXMgbGVuZ3RoICR7bm9uY2UucHViTm9uY2UubGVuZ3RofWApO1xyXG4gIH1cclxuICBjb25zdCBrZXlkYXRhID0gQnVmZmVyLmNvbmNhdChbXHJcbiAgICBjaGVja1BsYWluUHVibGljS2V5KG5vbmNlLnBhcnRpY2lwYW50UHViS2V5KSxcclxuICAgIGNoZWNrWE9ubHlQdWJsaWNLZXkobm9uY2UudGFwT3V0cHV0S2V5KSxcclxuICBdKTtcclxuICBjb25zdCBrZXkgPSB7XHJcbiAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BVQl9OT05DRSxcclxuICAgIGtleWRhdGEsXHJcbiAgfTtcclxuICByZXR1cm4geyBrZXksIHZhbHVlOiBub25jZS5wdWJOb25jZSB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUHNidE11c2lnMlBhcnRpYWxTaWcocGFydGlhbFNpZzogUHNidE11c2lnMlBhcnRpYWxTaWcpOiBQcm9wcmlldGFyeUtleVZhbHVlIHtcclxuICBpZiAocGFydGlhbFNpZy5wYXJ0aWFsU2lnLmxlbmd0aCAhPT0gMzIgJiYgcGFydGlhbFNpZy5wYXJ0aWFsU2lnLmxlbmd0aCAhPT0gMzMpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBwYXJ0aWFsU2lnIGxlbmd0aCAke3BhcnRpYWxTaWcucGFydGlhbFNpZy5sZW5ndGh9YCk7XHJcbiAgfVxyXG4gIGNvbnN0IGtleWRhdGEgPSBCdWZmZXIuY29uY2F0KFtcclxuICAgIGNoZWNrUGxhaW5QdWJsaWNLZXkocGFydGlhbFNpZy5wYXJ0aWNpcGFudFB1YktleSksXHJcbiAgICBjaGVja1hPbmx5UHVibGljS2V5KHBhcnRpYWxTaWcudGFwT3V0cHV0S2V5KSxcclxuICBdKTtcclxuICBjb25zdCBrZXkgPSB7XHJcbiAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BBUlRJQUxfU0lHLFxyXG4gICAga2V5ZGF0YSxcclxuICB9O1xyXG4gIHJldHVybiB7IGtleSwgdmFsdWU6IHBhcnRpYWxTaWcucGFydGlhbFNpZyB9O1xyXG59XHJcblxyXG4vKipcclxuICogRGVjb2RlcyBwcm9wcmlldGFyeSBrZXkgdmFsdWUgZGF0YSBmb3IgcGFydGljaXBhbnQgcHViIGtleXNcclxuICogQHBhcmFtIGt2XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHNidE11c2lnMlBhcnRpY2lwYW50cyhrdjogUHJvcHJpZXRhcnlLZXlWYWx1ZSk6IFBzYnRNdXNpZzJQYXJ0aWNpcGFudHMge1xyXG4gIGlmIChcclxuICAgIGt2LmtleS5pZGVudGlmaWVyICE9PSBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIgfHxcclxuICAgIGt2LmtleS5zdWJ0eXBlICE9PSBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BBUlRJQ0lQQU5UX1BVQl9LRVlTXHJcbiAgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaWRlbnRpZmllciAke2t2LmtleS5pZGVudGlmaWVyfSBvciBzdWJ0eXBlICR7a3Yua2V5LnN1YnR5cGV9IGZvciBwYXJ0aWNpcGFudHMgcHViIGtleXNgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGtleSA9IGt2LmtleS5rZXlkYXRhO1xyXG4gIGlmIChrZXkubGVuZ3RoICE9PSA2NCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGtleWRhdGEgc2l6ZSAke2tleS5sZW5ndGh9IGZvciBwYXJ0aWNpcGFudCBwdWIga2V5c2ApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdmFsdWUgPSBrdi52YWx1ZTtcclxuICBpZiAodmFsdWUubGVuZ3RoICE9PSA2Nikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlZGF0YSBzaXplICR7dmFsdWUubGVuZ3RofSBmb3IgcGFydGljaXBhbnQgcHViIGtleXNgKTtcclxuICB9XHJcbiAgY29uc3QgcGFydGljaXBhbnRQdWJLZXlzOiBUdXBsZTxCdWZmZXI+ID0gW3ZhbHVlLnN1YmFycmF5KDAsIDMzKSwgdmFsdWUuc3ViYXJyYXkoMzMpXTtcclxuICBpZiAocGFydGljaXBhbnRQdWJLZXlzWzBdLmVxdWFscyhwYXJ0aWNpcGFudFB1YktleXNbMV0pKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBwYXJ0aWNpcGFudCBwdWIga2V5cyBmb3VuZGApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgdGFwT3V0cHV0S2V5OiBrZXkuc3ViYXJyYXkoMCwgMzIpLCB0YXBJbnRlcm5hbEtleToga2V5LnN1YmFycmF5KDMyKSwgcGFydGljaXBhbnRQdWJLZXlzIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIHByb3ByaWV0YXJ5IGtleSB2YWx1ZSBkYXRhIGZvciBtdXNpZzIgbm9uY2VcclxuICogQHBhcmFtIGt2XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHNidE11c2lnMk5vbmNlKGt2OiBQcm9wcmlldGFyeUtleVZhbHVlKTogUHNidE11c2lnMlB1Yk5vbmNlIHtcclxuICBpZiAoa3Yua2V5LmlkZW50aWZpZXIgIT09IFBTQlRfUFJPUFJJRVRBUllfSURFTlRJRklFUiB8fCBrdi5rZXkuc3VidHlwZSAhPT0gUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLk1VU0lHMl9QVUJfTk9OQ0UpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpZGVudGlmaWVyICR7a3Yua2V5LmlkZW50aWZpZXJ9IG9yIHN1YnR5cGUgJHtrdi5rZXkuc3VidHlwZX0gZm9yIG5vbmNlYCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBrZXkgPSBrdi5rZXkua2V5ZGF0YTtcclxuICBpZiAoa2V5Lmxlbmd0aCAhPT0gNjUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBrZXlkYXRhIHNpemUgJHtrZXkubGVuZ3RofSBmb3Igbm9uY2VgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHZhbHVlID0ga3YudmFsdWU7XHJcbiAgaWYgKHZhbHVlLmxlbmd0aCAhPT0gNjYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZWRhdGEgc2l6ZSAke3ZhbHVlLmxlbmd0aH0gZm9yIG5vbmNlYCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBwYXJ0aWNpcGFudFB1YktleToga2V5LnN1YmFycmF5KDAsIDMzKSwgdGFwT3V0cHV0S2V5OiBrZXkuc3ViYXJyYXkoMzMpLCBwdWJOb25jZTogdmFsdWUgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlY29kZXMgcHJvcHJpZXRhcnkga2V5IHZhbHVlIGRhdGEgZm9yIG11c2lnMiBwYXJ0aWFsIHNpZ1xyXG4gKiBAcGFyYW0ga3ZcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVQc2J0TXVzaWcyUGFydGlhbFNpZyhrdjogUHJvcHJpZXRhcnlLZXlWYWx1ZSk6IFBzYnRNdXNpZzJQYXJ0aWFsU2lnIHtcclxuICBpZiAoXHJcbiAgICBrdi5rZXkuaWRlbnRpZmllciAhPT0gUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSIHx8XHJcbiAgICBrdi5rZXkuc3VidHlwZSAhPT0gUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLk1VU0lHMl9QQVJUSUFMX1NJR1xyXG4gICkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlkZW50aWZpZXIgJHtrdi5rZXkuaWRlbnRpZmllcn0gb3Igc3VidHlwZSAke2t2LmtleS5zdWJ0eXBlfSBmb3IgcGFydGlhbCBzaWdgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGtleSA9IGt2LmtleS5rZXlkYXRhO1xyXG4gIGlmIChrZXkubGVuZ3RoICE9PSA2NSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGtleWRhdGEgc2l6ZSAke2tleS5sZW5ndGh9IGZvciBwYXJ0aWFsIHNpZ2ApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdmFsdWUgPSBrdi52YWx1ZTtcclxuICBpZiAodmFsdWUubGVuZ3RoICE9PSAzMiAmJiB2YWx1ZS5sZW5ndGggIT09IDMzKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWVkYXRhIHNpemUgJHt2YWx1ZS5sZW5ndGh9IGZvciBwYXJ0aWFsIHNpZ2ApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgcGFydGljaXBhbnRQdWJLZXk6IGtleS5zdWJhcnJheSgwLCAzMyksIHRhcE91dHB1dEtleToga2V5LnN1YmFycmF5KDMzKSwgcGFydGlhbFNpZzogdmFsdWUgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRhcEludGVybmFsS2V5KHBsYWluUHViS2V5czogQnVmZmVyW10pOiBCdWZmZXIge1xyXG4gIHJldHVybiBCdWZmZXIuZnJvbShtdXNpZy5nZXRYT25seVB1YmtleShtdXNpZy5rZXlBZ2cocGxhaW5QdWJLZXlzKSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGFwT3V0cHV0S2V5KGludGVybmFsUHViS2V5OiBCdWZmZXIsIHRhcFRyZWVSb290OiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gIHJldHVybiBCdWZmZXIuZnJvbShcclxuICAgIHRhcFR3ZWFrUHVia2V5KGVjYywgdG9YT25seVB1YmxpY0tleShpbnRlcm5hbFB1YktleSksIGNoZWNrVGFwTWVya2xlUm9vdCh0YXBUcmVlUm9vdCkpLnhPbmx5UHVia2V5XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFnZ3JlZ2F0ZU5vbmNlKHB1Yk5vbmNlczogVHVwbGU8QnVmZmVyPik6IEJ1ZmZlciB7XHJcbiAgcmV0dXJuIEJ1ZmZlci5mcm9tKG11c2lnLm5vbmNlQWdnKHB1Yk5vbmNlcykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGFwVHdlYWsodGFwSW50ZXJuYWxLZXk6IEJ1ZmZlciwgdGFwTWVya2xlUm9vdDogQnVmZmVyKTogQnVmZmVyIHtcclxuICByZXR1cm4gQnVmZmVyLmZyb20oY2FsY3VsYXRlVGFwVHdlYWsoY2hlY2tYT25seVB1YmxpY0tleSh0YXBJbnRlcm5hbEtleSksIGNoZWNrVGFwTWVya2xlUm9vdCh0YXBNZXJrbGVSb290KSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdGFydE11c2lnMlNpZ25pbmdTZXNzaW9uKFxyXG4gIGFnZ05vbmNlOiBCdWZmZXIsXHJcbiAgaGFzaDogQnVmZmVyLFxyXG4gIHB1YmxpY0tleXM6IFR1cGxlPEJ1ZmZlcj4sXHJcbiAgdHdlYWs6IEJ1ZmZlclxyXG4pOiBTZXNzaW9uS2V5IHtcclxuICByZXR1cm4gbXVzaWcuc3RhcnRTaWduaW5nU2Vzc2lvbihhZ2dOb25jZSwgaGFzaCwgcHVibGljS2V5cywgeyB0d2VhaywgeE9ubHk6IHRydWUgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtdXNpZzJQYXJ0aWFsU2lnbihcclxuICBwcml2YXRlS2V5OiBCdWZmZXIsXHJcbiAgcHVibGljTm9uY2U6IFVpbnQ4QXJyYXksXHJcbiAgc2Vzc2lvbktleTogU2Vzc2lvbktleSxcclxuICBub25jZVN0b3JlOiBNdXNpZzJOb25jZVN0b3JlXHJcbik6IEJ1ZmZlciB7XHJcbiAgY2hlY2tUeEhhc2goQnVmZmVyLmZyb20oc2Vzc2lvbktleS5tc2cpKTtcclxuICByZXR1cm4gQnVmZmVyLmZyb20oXHJcbiAgICBtdXNpZy5wYXJ0aWFsU2lnbih7XHJcbiAgICAgIHNlY3JldEtleTogcHJpdmF0ZUtleSxcclxuICAgICAgcHVibGljTm9uY2U6IG5vbmNlU3RvcmUuZ2V0UmVmKHB1YmxpY05vbmNlKSxcclxuICAgICAgc2Vzc2lvbktleSxcclxuICAgIH0pXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG11c2lnMlBhcnRpYWxTaWdWZXJpZnkoXHJcbiAgc2lnOiBCdWZmZXIsXHJcbiAgcHVibGljS2V5OiBCdWZmZXIsXHJcbiAgcHVibGljTm9uY2U6IEJ1ZmZlcixcclxuICBzZXNzaW9uS2V5OiBTZXNzaW9uS2V5XHJcbik6IGJvb2xlYW4ge1xyXG4gIGNoZWNrVHhIYXNoKEJ1ZmZlci5mcm9tKHNlc3Npb25LZXkubXNnKSk7XHJcbiAgcmV0dXJuIG11c2lnLnBhcnRpYWxWZXJpZnkoeyBzaWcsIHB1YmxpY0tleSwgcHVibGljTm9uY2UsIHNlc3Npb25LZXkgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtdXNpZzJBZ2dyZWdhdGVTaWdzKHNpZ3M6IEJ1ZmZlcltdLCBzZXNzaW9uS2V5OiBTZXNzaW9uS2V5KTogQnVmZmVyIHtcclxuICByZXR1cm4gQnVmZmVyLmZyb20obXVzaWcuc2lnbkFnZyhzaWdzLCBzZXNzaW9uS2V5KSk7XHJcbn1cclxuXHJcbi8qKiBAcmV0dXJuIHNlc3Npb24ga2V5IHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIHRoZSBzZXNzaW9uIGxhdGVyICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNdXNpZzJTaWduaW5nU2Vzc2lvbihzZXNzaW9uQXJnczoge1xyXG4gIHB1Yk5vbmNlczogVHVwbGU8QnVmZmVyPjtcclxuICB0eEhhc2g6IEJ1ZmZlcjtcclxuICBwdWJLZXlzOiBUdXBsZTxCdWZmZXI+O1xyXG4gIGludGVybmFsUHViS2V5OiBCdWZmZXI7XHJcbiAgdGFwVHJlZVJvb3Q6IEJ1ZmZlcjtcclxufSk6IFNlc3Npb25LZXkge1xyXG4gIGNoZWNrVHhIYXNoKHNlc3Npb25BcmdzLnR4SGFzaCk7XHJcbiAgY29uc3QgYWdnTm9uY2UgPSBjcmVhdGVBZ2dyZWdhdGVOb25jZShzZXNzaW9uQXJncy5wdWJOb25jZXMpO1xyXG4gIGNvbnN0IHR3ZWFrID0gY3JlYXRlVGFwVHdlYWsoc2Vzc2lvbkFyZ3MuaW50ZXJuYWxQdWJLZXksIHNlc3Npb25BcmdzLnRhcFRyZWVSb290KTtcclxuICByZXR1cm4gc3RhcnRNdXNpZzJTaWduaW5nU2Vzc2lvbihhZ2dOb25jZSwgc2Vzc2lvbkFyZ3MudHhIYXNoLCBzZXNzaW9uQXJncy5wdWJLZXlzLCB0d2Vhayk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJucyBwc2J0IHByb3ByaWV0YXJ5IGtleSBmb3IgbXVzaWcyIHBhcnRpY2lwYW50IGtleSB2YWx1ZSBkYXRhXHJcbiAqIElmIG5vIGtleSB2YWx1ZSBleGlzdHMsIHVuZGVmaW5lZCBpcyByZXR1cm5lZC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBzYnRNdXNpZzJQYXJ0aWNpcGFudHMoaW5wdXQ6IFBzYnRJbnB1dCk6IFBzYnRNdXNpZzJQYXJ0aWNpcGFudHMgfCB1bmRlZmluZWQge1xyXG4gIGNvbnN0IHBhcnRpY2lwYW50c0tleVZhbHMgPSBnZXRQc2J0SW5wdXRQcm9wcmlldGFyeUtleVZhbHMoaW5wdXQsIHtcclxuICAgIGlkZW50aWZpZXI6IFBTQlRfUFJPUFJJRVRBUllfSURFTlRJRklFUixcclxuICAgIHN1YnR5cGU6IFByb3ByaWV0YXJ5S2V5U3VidHlwZS5NVVNJRzJfUEFSVElDSVBBTlRfUFVCX0tFWVMsXHJcbiAgfSk7XHJcblxyXG4gIGlmICghcGFydGljaXBhbnRzS2V5VmFscy5sZW5ndGgpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBpZiAocGFydGljaXBhbnRzS2V5VmFscy5sZW5ndGggPiAxKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZvdW5kICR7cGFydGljaXBhbnRzS2V5VmFscy5sZW5ndGh9IG1hdGNoaW5nIHBhcnRpY2lwYW50IGtleSB2YWx1ZSBpbnN0ZWFkIG9mIDFgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkZWNvZGVQc2J0TXVzaWcyUGFydGljaXBhbnRzKHBhcnRpY2lwYW50c0tleVZhbHNbMF0pO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybnMgcHNidCBwcm9wcmlldGFyeSBrZXkgZm9yIG11c2lnMiBwdWJsaWMgbm9uY2Uga2V5IHZhbHVlIGRhdGFcclxuICogSWYgbm8ga2V5IHZhbHVlIGV4aXN0cywgdW5kZWZpbmVkIGlzIHJldHVybmVkLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHNidE11c2lnMk5vbmNlcyhpbnB1dDogUHNidElucHV0KTogUHNidE11c2lnMlB1Yk5vbmNlW10gfCB1bmRlZmluZWQge1xyXG4gIGNvbnN0IG5vbmNlS2V5VmFscyA9IGdldFBzYnRJbnB1dFByb3ByaWV0YXJ5S2V5VmFscyhpbnB1dCwge1xyXG4gICAgaWRlbnRpZmllcjogUFNCVF9QUk9QUklFVEFSWV9JREVOVElGSUVSLFxyXG4gICAgc3VidHlwZTogUHJvcHJpZXRhcnlLZXlTdWJ0eXBlLk1VU0lHMl9QVUJfTk9OQ0UsXHJcbiAgfSk7XHJcblxyXG4gIGlmICghbm9uY2VLZXlWYWxzLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGlmIChub25jZUtleVZhbHMubGVuZ3RoID4gMikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBGb3VuZCAke25vbmNlS2V5VmFscy5sZW5ndGh9IG1hdGNoaW5nIG5vbmNlIGtleSB2YWx1ZSBpbnN0ZWFkIG9mIDEgb3IgMmApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5vbmNlS2V5VmFscy5tYXAoKGt2KSA9PiBkZWNvZGVQc2J0TXVzaWcyTm9uY2Uoa3YpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm5zIHBzYnQgcHJvcHJpZXRhcnkga2V5IGZvciBtdXNpZzIgcGFydGlhbCBzaWcga2V5IHZhbHVlIGRhdGFcclxuICogSWYgbm8ga2V5IHZhbHVlIGV4aXN0cywgdW5kZWZpbmVkIGlzIHJldHVybmVkLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHNidE11c2lnMlBhcnRpYWxTaWdzKGlucHV0OiBQc2J0SW5wdXQpOiBQc2J0TXVzaWcyUGFydGlhbFNpZ1tdIHwgdW5kZWZpbmVkIHtcclxuICBjb25zdCBzaWdLZXlWYWxzID0gZ2V0UHNidElucHV0UHJvcHJpZXRhcnlLZXlWYWxzKGlucHV0LCB7XHJcbiAgICBpZGVudGlmaWVyOiBQU0JUX1BST1BSSUVUQVJZX0lERU5USUZJRVIsXHJcbiAgICBzdWJ0eXBlOiBQcm9wcmlldGFyeUtleVN1YnR5cGUuTVVTSUcyX1BBUlRJQUxfU0lHLFxyXG4gIH0pO1xyXG5cclxuICBpZiAoIXNpZ0tleVZhbHMubGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgaWYgKHNpZ0tleVZhbHMubGVuZ3RoID4gMikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBGb3VuZCAke3NpZ0tleVZhbHMubGVuZ3RofSBtYXRjaGluZyBwYXJ0aWFsIHNpZ25hdHVyZSBrZXkgdmFsdWUgaW5zdGVhZCBvZiAxIG9yIDJgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzaWdLZXlWYWxzLm1hcCgoa3YpID0+IGRlY29kZVBzYnRNdXNpZzJQYXJ0aWFsU2lnKGt2KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBc3NlcnQgbXVzaWcyIHBhcnRpY2lwYW50IGtleSB2YWx1ZSBkYXRhIHdpdGggdGFwSW50ZXJuYWxLZXkgYW5kIHRhcE1lcmtsZVJvb3QuXHJcbiAqIDx0YXBPdXRwdXRLZXk+PHRhcElucHV0S2V5PiA9PiA8cGFydGljaXBhbnRLZXkxPjxwYXJ0aWNpcGFudEtleTI+XHJcbiAqIFVzaW5nIHRhcE1lcmtsZVJvb3QgYW5kIDIgcGFydGljaXBhbnQga2V5cywgdGhlIHRhcElucHV0S2V5IGlzIHZhbGlkYXRlZCBhbmQgdXNpbmcgdGFwTWVya2xlUm9vdCBhbmQgdGFwSW5wdXRLZXksXHJcbiAqIHRoZSB0YXBPdXRwdXRLZXkgaXMgdmFsaWRhdGVkLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFBzYnRNdXNpZzJQYXJ0aWNpcGFudHMoXHJcbiAgcGFydGljaXBhbnRLZXlWYWxEYXRhOiBQc2J0TXVzaWcyUGFydGljaXBhbnRzLFxyXG4gIHRhcEludGVybmFsS2V5OiBCdWZmZXIsXHJcbiAgdGFwTWVya2xlUm9vdDogQnVmZmVyXHJcbik6IHZvaWQge1xyXG4gIGNoZWNrWE9ubHlQdWJsaWNLZXkodGFwSW50ZXJuYWxLZXkpO1xyXG4gIGNoZWNrVGFwTWVya2xlUm9vdCh0YXBNZXJrbGVSb290KTtcclxuXHJcbiAgY29uc3QgcGFydGljaXBhbnRQdWJLZXlzID0gcGFydGljaXBhbnRLZXlWYWxEYXRhLnBhcnRpY2lwYW50UHViS2V5cztcclxuXHJcbiAgY29uc3QgaW50ZXJuYWxLZXkgPSBjcmVhdGVUYXBJbnRlcm5hbEtleShwYXJ0aWNpcGFudFB1YktleXMpO1xyXG4gIGlmICghaW50ZXJuYWxLZXkuZXF1YWxzKHBhcnRpY2lwYW50S2V5VmFsRGF0YS50YXBJbnRlcm5hbEtleSkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJ0aWNpcGFudHMga2V5ZGF0YSB0YXBJbnRlcm5hbEtleScpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgb3V0cHV0S2V5ID0gY3JlYXRlVGFwT3V0cHV0S2V5KGludGVybmFsS2V5LCB0YXBNZXJrbGVSb290KTtcclxuICBpZiAoIW91dHB1dEtleS5lcXVhbHMocGFydGljaXBhbnRLZXlWYWxEYXRhLnRhcE91dHB1dEtleSkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJ0aWNpcGFudHMga2V5ZGF0YSB0YXBPdXRwdXRLZXknKTtcclxuICB9XHJcblxyXG4gIGlmICghaW50ZXJuYWxLZXkuZXF1YWxzKHRhcEludGVybmFsS2V5KSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCd0YXBJbnRlcm5hbEtleSBhbmQgYWdncmVnYXRlZCBwYXJ0aWNpcGFudCBwdWIga2V5cyBkb2VzIG5vdCBtYXRjaCcpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFzc2VydCBtdXNpZzIgcHVibGljIG5vbmNlIGtleSB2YWx1ZSBkYXRhIHdpdGggcGFydGljaXBhbnQga2V5IHZhbHVlIGRhdGFcclxuICogKHJlZmVyIGFzc2VydFBzYnRNdXNpZzJQYXJ0aWNpcGFudHNLZXlWYWxEYXRhKS5cclxuICogPHBhcnRpY2lwYW50S2V5MT48dGFwT3V0cHV0S2V5PiA9PiA8cHViTm9uY2UxPlxyXG4gKiA8cGFydGljaXBhbnRLZXkyPjx0YXBPdXRwdXRLZXk+ID0+IDxwdWJOb25jZTI+XHJcbiAqIENoZWNrcyBhZ2FpbnN0IHBhcnRpY2lwYW50IGtleXMgYW5kIHRhcE91dHB1dEtleVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFBzYnRNdXNpZzJOb25jZXMoXHJcbiAgbm9uY2VzS2V5VmFsRGF0YTogUHNidE11c2lnMlB1Yk5vbmNlW10sXHJcbiAgcGFydGljaXBhbnRLZXlWYWxEYXRhOiBQc2J0TXVzaWcyUGFydGljaXBhbnRzXHJcbik6IHZvaWQge1xyXG4gIGNoZWNrWE9ubHlQdWJsaWNLZXkocGFydGljaXBhbnRLZXlWYWxEYXRhLnRhcE91dHB1dEtleSk7XHJcbiAgcGFydGljaXBhbnRLZXlWYWxEYXRhLnBhcnRpY2lwYW50UHViS2V5cy5mb3JFYWNoKChrdikgPT4gY2hlY2tQbGFpblB1YmxpY0tleShrdikpO1xyXG4gIGlmIChwYXJ0aWNpcGFudEtleVZhbERhdGEucGFydGljaXBhbnRQdWJLZXlzWzBdLmVxdWFscyhwYXJ0aWNpcGFudEtleVZhbERhdGEucGFydGljaXBhbnRQdWJLZXlzWzFdKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgcGFydGljaXBhbnQgcHViIGtleXMgZm91bmRgKTtcclxuICB9XHJcblxyXG4gIGlmIChub25jZXNLZXlWYWxEYXRhLmxlbmd0aCA+IDIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBub25jZSBrZXkgdmFsdWUgY291bnQgJHtub25jZXNLZXlWYWxEYXRhLmxlbmd0aH1gKTtcclxuICB9XHJcblxyXG4gIG5vbmNlc0tleVZhbERhdGEuZm9yRWFjaCgobm9uY2VLdikgPT4ge1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJ0aWNpcGFudEtleVZhbERhdGEucGFydGljaXBhbnRQdWJLZXlzLmZpbmRJbmRleCgocHViS2V5KSA9PlxyXG4gICAgICBub25jZUt2LnBhcnRpY2lwYW50UHViS2V5LmVxdWFscyhwdWJLZXkpXHJcbiAgICApO1xyXG4gICAgaWYgKGluZGV4IDwgMCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9uY2Uga2V5ZGF0YSBwYXJ0aWNpcGFudCBwdWIga2V5Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFub25jZUt2LnRhcE91dHB1dEtleS5lcXVhbHMocGFydGljaXBhbnRLZXlWYWxEYXRhLnRhcE91dHB1dEtleSkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vbmNlIGtleWRhdGEgdGFwT3V0cHV0S2V5Jyk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJucyBJbnB1dCBvYmplY3QgYnV0IHNpZyBoYXNoIHR5cGUgZGF0YSBpcyB0YWtlbiBvdXQgZnJvbSBwYXJ0aWFsU2lnIGZpZWxkLlxyXG4gKiBJZiBzaWcgaGFzaCB0eXBlIGlzIG5vdCBjb21tb24gZm9yIGFsbCBzaWdzLCBlcnJvciBvdXQsIG90aGVyd2lzZSByZXR1cm5zIHRoZSBtb2RpZmllZCBvYmplY3QgYW5kIHNpbmdsZSBoYXNoIHR5cGUuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2lnSGFzaFR5cGVGcm9tU2lncyhwYXJ0aWFsU2lnczogUHNidE11c2lnMlBhcnRpYWxTaWdbXSk6IHtcclxuICBwYXJ0aWFsU2lnczogUHNidE11c2lnMlBhcnRpYWxTaWdbXTtcclxuICBzaWdIYXNoVHlwZTogbnVtYmVyO1xyXG59IHtcclxuICBpZiAoIXBhcnRpYWxTaWdzLmxlbmd0aCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdwYXJ0aWFsU2lncyBhcnJheSBjYW4gbm90IGJlIGVtcHR5Jyk7XHJcbiAgfVxyXG4gIGNvbnN0IHBTaWdzV2l0aEhhc2hUeXBlID0gcGFydGlhbFNpZ3MubWFwKChrdikgPT4ge1xyXG4gICAgY29uc3QgeyBwYXJ0aWFsU2lnLCBwYXJ0aWNpcGFudFB1YktleSwgdGFwT3V0cHV0S2V5IH0gPSBrdjtcclxuICAgIHJldHVybiBwYXJ0aWFsU2lnLmxlbmd0aCA9PT0gMzNcclxuICAgICAgPyB7IHBTaWc6IHsgcGFydGlhbFNpZzogcGFydGlhbFNpZy5zbGljZSgwLCAzMiksIHBhcnRpY2lwYW50UHViS2V5LCB0YXBPdXRwdXRLZXkgfSwgc2lnSGFzaFR5cGU6IHBhcnRpYWxTaWdbMzJdIH1cclxuICAgICAgOiB7IHBTaWc6IHsgcGFydGlhbFNpZywgcGFydGljaXBhbnRQdWJLZXksIHRhcE91dHB1dEtleSB9LCBzaWdIYXNoVHlwZTogVHJhbnNhY3Rpb24uU0lHSEFTSF9ERUZBVUxUIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHNpZ0hhc2hUeXBlID0gcFNpZ3NXaXRoSGFzaFR5cGVbMF0uc2lnSGFzaFR5cGU7XHJcbiAgaWYgKCFwU2lnc1dpdGhIYXNoVHlwZS5ldmVyeSgocFNpZykgPT4gcFNpZy5zaWdIYXNoVHlwZSA9PT0gc2lnSGFzaFR5cGUpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NpZ25hdHVyZXMgbXVzdCB1c2Ugc2FtZSBzaWcgaGFzaCB0eXBlJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBwYXJ0aWFsU2lnczogcFNpZ3NXaXRoSGFzaFR5cGUubWFwKCh7IHBTaWcgfSkgPT4gcFNpZyksIHNpZ0hhc2hUeXBlIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNdXNpZzJEZXRlcm1pbmlzdGljTm9uY2UocGFyYW1zOiBQc2J0TXVzaWcyRGV0ZXJtaW5pc3RpY1BhcmFtcyk6IEJ1ZmZlciB7XHJcbiAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxyXG4gICAgbXVzaWcuZGV0ZXJtaW5pc3RpY05vbmNlR2VuKHtcclxuICAgICAgc2VjcmV0S2V5OiBwYXJhbXMucHJpdmF0ZUtleSxcclxuICAgICAgYWdnT3RoZXJOb25jZTogbXVzaWcubm9uY2VBZ2coW3BhcmFtcy5vdGhlck5vbmNlXSksXHJcbiAgICAgIHB1YmxpY0tleXM6IHBhcmFtcy5wdWJsaWNLZXlzLFxyXG4gICAgICB0d2Vha3M6IFt7IHR3ZWFrOiBjcmVhdGVUYXBUd2VhayhwYXJhbXMuaW50ZXJuYWxQdWJLZXksIHBhcmFtcy50YXBUcmVlUm9vdCksIHhPbmx5OiB0cnVlIH1dLFxyXG4gICAgICBtc2c6IHBhcmFtcy5oYXNoLFxyXG4gICAgfSkucHVibGljTm9uY2VcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbXVzaWcyRGV0ZXJtaW5pc3RpY1NpZ24ocGFyYW1zOiBQc2J0TXVzaWcyRGV0ZXJtaW5pc3RpY1BhcmFtcyk6IHtcclxuICBzaWc6IEJ1ZmZlcjtcclxuICBzZXNzaW9uS2V5OiBTZXNzaW9uS2V5O1xyXG4gIHB1YmxpY05vbmNlOiBCdWZmZXI7XHJcbn0ge1xyXG4gIGNvbnN0IHsgc2lnLCBzZXNzaW9uS2V5LCBwdWJsaWNOb25jZSB9ID0gbXVzaWcuZGV0ZXJtaW5pc3RpY1NpZ24oe1xyXG4gICAgc2VjcmV0S2V5OiBwYXJhbXMucHJpdmF0ZUtleSxcclxuICAgIGFnZ090aGVyTm9uY2U6IG11c2lnLm5vbmNlQWdnKFtwYXJhbXMub3RoZXJOb25jZV0pLFxyXG4gICAgcHVibGljS2V5czogcGFyYW1zLnB1YmxpY0tleXMsXHJcbiAgICB0d2Vha3M6IFt7IHR3ZWFrOiBjcmVhdGVUYXBUd2VhayhwYXJhbXMuaW50ZXJuYWxQdWJLZXksIHBhcmFtcy50YXBUcmVlUm9vdCksIHhPbmx5OiB0cnVlIH1dLFxyXG4gICAgbXNnOiBwYXJhbXMuaGFzaCxcclxuICB9KTtcclxuICByZXR1cm4geyBzaWc6IEJ1ZmZlci5mcm9tKHNpZyksIHNlc3Npb25LZXksIHB1YmxpY05vbmNlOiBCdWZmZXIuZnJvbShwdWJsaWNOb25jZSkgfTtcclxufVxyXG4iXX0=