"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.musig = exports.bip32 = exports.ECPair = exports.ecc = void 0;
const createHash = require("create-hash");
const createHmac = require("create-hmac");
const ecpair_1 = require("ecpair");
const necc = require("@noble/secp256k1");
const bip32_1 = require("bip32");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore base_crypto is exported as a subPath export, ignoring since compiler complains about importing like this
const baseCrypto = require("@brandonblack/musig/base_crypto");
const musig_1 = require("@brandonblack/musig");
necc.utils.sha256Sync = (...messages) => {
    const sha256 = createHash('sha256');
    for (const message of messages)
        sha256.update(message);
    return sha256.digest();
};
necc.utils.hmacSha256Sync = (key, ...messages) => {
    const hash = createHmac('sha256', Buffer.from(key));
    messages.forEach((m) => hash.update(m));
    return Uint8Array.from(hash.digest());
};
const defaultTrue = (param) => param !== false;
function throwToNull(fn) {
    try {
        return fn();
    }
    catch (e) {
        return null;
    }
}
function isPoint(p, xOnly) {
    if ((p.length === 32) !== xOnly)
        return false;
    try {
        return !!necc.Point.fromHex(p);
    }
    catch (e) {
        return false;
    }
}
function toBigInt(b) {
    const buff = Buffer.from(b);
    if (buff.length !== 32) {
        throw new Error('Invalid size ${buff.length}');
    }
    return BigInt(`0x${buff.toString('hex')}`);
}
const ecc = {
    isPoint: (p) => isPoint(p, false),
    isPrivate: (d) => necc.utils.isValidPrivateKey(d),
    isXOnlyPoint: (p) => isPoint(p, true),
    xOnlyPointAddTweak: (p, tweak) => throwToNull(() => {
        const P = necc.utils.pointAddScalar(p, tweak, true);
        const parity = P[0] % 2 === 1 ? 1 : 0;
        return { parity, xOnlyPubkey: P.slice(1) };
    }),
    pointFromScalar: (sk, compressed) => throwToNull(() => necc.getPublicKey(sk, defaultTrue(compressed))),
    pointCompress: (p, compressed) => {
        return necc.Point.fromHex(p).toRawBytes(defaultTrue(compressed));
    },
    pointMultiply: (a, tweak, compressed) => throwToNull(() => necc.utils.pointMultiply(a, tweak, defaultTrue(compressed))),
    pointAdd: (a, b, compressed) => throwToNull(() => {
        const A = necc.Point.fromHex(a);
        const B = necc.Point.fromHex(b);
        return A.add(B).toRawBytes(defaultTrue(compressed));
    }),
    pointAddScalar: (p, tweak, compressed) => throwToNull(() => necc.utils.pointAddScalar(p, tweak, defaultTrue(compressed))),
    privateAdd: (d, tweak) => throwToNull(() => {
        const res = necc.utils.privateAdd(d, tweak);
        // tiny-secp256k1 returns null rather than allowing a 0 private key to be returned
        // ECPair.testEcc() requires that behavior.
        if (res === null || res === void 0 ? void 0 : res.every((i) => i === 0))
            return null;
        return res;
    }),
    privateNegate: (d) => necc.utils.privateNegate(d),
    sign: (h, d, e) => {
        return necc.signSync(h, d, { der: false, extraEntropy: e });
    },
    signSchnorr: (h, d, e = Buffer.alloc(32, 0x00)) => {
        return necc.schnorr.signSync(h, d, e);
    },
    verify: (h, Q, signature, strict) => {
        return necc.verify(signature, h, Q, { strict });
    },
    verifySchnorr: (h, Q, signature) => {
        return necc.schnorr.verifySync(signature, h, Q);
    },
};
exports.ecc = ecc;
const crypto = {
    ...baseCrypto,
    pointMultiplyUnsafe(p, a, compress) {
        try {
            const product = necc.Point.fromHex(p).multiplyAndAddUnsafe(necc.Point.ZERO, toBigInt(a), BigInt(1));
            if (!product)
                return null;
            return product.toRawBytes(compress);
        }
        catch {
            return null;
        }
    },
    pointMultiplyAndAddUnsafe(p1, a, p2, compress) {
        try {
            const p2p = necc.Point.fromHex(p2);
            const p = necc.Point.fromHex(p1).multiplyAndAddUnsafe(p2p, toBigInt(a), BigInt(1));
            if (!p)
                return null;
            return p.toRawBytes(compress);
        }
        catch {
            return null;
        }
    },
    pointAdd(a, b, compress) {
        try {
            return necc.Point.fromHex(a).add(necc.Point.fromHex(b)).toRawBytes(compress);
        }
        catch {
            return null;
        }
    },
    pointAddTweak(p, tweak, compress) {
        try {
            const P = necc.Point.fromHex(p);
            const t = baseCrypto.readSecret(tweak);
            const Q = necc.Point.BASE.multiplyAndAddUnsafe(P, t, BigInt(1));
            if (!Q)
                throw new Error('Tweaked point at infinity');
            return Q.toRawBytes(compress);
        }
        catch {
            return null;
        }
    },
    pointCompress(p, compress = true) {
        return necc.Point.fromHex(p).toRawBytes(compress);
    },
    liftX(p) {
        try {
            return necc.Point.fromHex(p).toRawBytes(false);
        }
        catch {
            return null;
        }
    },
    getPublicKey(s, compress) {
        try {
            return necc.getPublicKey(s, compress);
        }
        catch {
            return null;
        }
    },
    taggedHash: necc.utils.taggedHashSync,
    sha256(...messages) {
        const sha256 = createHash('sha256');
        for (const message of messages)
            sha256.update(message);
        return sha256.digest();
    },
};
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
exports.ECPair = ECPair;
const bip32 = (0, bip32_1.BIP32Factory)(ecc);
exports.bip32 = bip32;
const musig = (0, musig_1.MuSigFactory)(crypto);
exports.musig = musig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ibGVfZWNjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL25vYmxlX2VjYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwwQ0FBMEM7QUFDMUMsMENBQTBDO0FBQzFDLG1DQUFtRTtBQUNuRSx5Q0FBeUM7QUFDekMsaUNBQStEO0FBQy9ELDZEQUE2RDtBQUM3RCxzSEFBc0g7QUFDdEgsOERBQThEO0FBQzlELCtDQUEwRDtBQUUxRCxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLEdBQUcsUUFBc0IsRUFBYyxFQUFFO0lBQ2hFLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNwQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVE7UUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3pCLENBQUMsQ0FBQztBQUVGLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLENBQUMsR0FBZSxFQUFFLEdBQUcsUUFBc0IsRUFBYyxFQUFFO0lBQ3JGLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDO0FBRUYsTUFBTSxXQUFXLEdBQUcsQ0FBQyxLQUFlLEVBQVcsRUFBRSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUM7QUFFbEUsU0FBUyxXQUFXLENBQU8sRUFBYztJQUN2QyxJQUFJO1FBQ0YsT0FBTyxFQUFFLEVB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QU0sR0FBYyxJQUFBLHNCQUFhLEVBQUMsR0FBRyxDQUFDLENBQUM7QUFJL0Isd0JBQU07QUFIcEIsTUFBTSxLQUFLLEdBQWEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQyxDQUFDO0FBR1Esc0JBQUs7QUFGdkQsTUFBTSxLQUFLLEdBQVUsSUFBQSxvQkFBWSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRXlDLHNCQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY3JlYXRlSGFzaCBmcm9tICdjcmVhdGUtaGFzaCc7XHJcbmltcG9ydCAqIGFzIGNyZWF0ZUhtYWMgZnJvbSAnY3JlYXRlLWhtYWMnO1xyXG5pbXBvcnQgeyBFQ1BhaXJBUEksIEVDUGFpckZhY3RvcnksIEVDUGFpckludGVyZmFjZSB9IGZyb20gJ2VjcGFpcic7XHJcbmltcG9ydCAqIGFzIG5lY2MgZnJvbSAnQG5vYmxlL3NlY3AyNTZrMSc7XHJcbmltcG9ydCB7IEJJUDMyQVBJLCBCSVAzMkZhY3RvcnksIEJJUDMySW50ZXJmYWNlIH0gZnJvbSAnYmlwMzInO1xyXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1jb21tZW50XHJcbi8vIEB0cy1pZ25vcmUgYmFzZV9jcnlwdG8gaXMgZXhwb3J0ZWQgYXMgYSBzdWJQYXRoIGV4cG9ydCwgaWdub3Jpbmcgc2luY2UgY29tcGlsZXIgY29tcGxhaW5zIGFib3V0IGltcG9ydGluZyBsaWtlIHRoaXNcclxuaW1wb3J0ICogYXMgYmFzZUNyeXB0byBmcm9tICdAYnJhbmRvbmJsYWNrL211c2lnL2Jhc2VfY3J5cHRvJztcclxuaW1wb3J0IHsgTXVTaWcsIE11U2lnRmFjdG9yeSB9IGZyb20gJ0BicmFuZG9uYmxhY2svbXVzaWcnO1xyXG5cclxubmVjYy51dGlscy5zaGEyNTZTeW5jID0gKC4uLm1lc3NhZ2VzOiBVaW50OEFycmF5W10pOiBVaW50OEFycmF5ID0+IHtcclxuICBjb25zdCBzaGEyNTYgPSBjcmVhdGVIYXNoKCdzaGEyNTYnKTtcclxuICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbWVzc2FnZXMpIHNoYTI1Ni51cGRhdGUobWVzc2FnZSk7XHJcbiAgcmV0dXJuIHNoYTI1Ni5kaWdlc3QoKTtcclxufTtcclxuXHJcbm5lY2MudXRpbHMuaG1hY1NoYTI1NlN5bmMgPSAoa2V5OiBVaW50OEFycmF5LCAuLi5tZXNzYWdlczogVWludDhBcnJheVtdKTogVWludDhBcnJheSA9PiB7XHJcbiAgY29uc3QgaGFzaCA9IGNyZWF0ZUhtYWMoJ3NoYTI1NicsIEJ1ZmZlci5mcm9tKGtleSkpO1xyXG4gIG1lc3NhZ2VzLmZvckVhY2goKG0pID0+IGhhc2gudXBkYXRlKG0pKTtcclxuICByZXR1cm4gVWludDhBcnJheS5mcm9tKGhhc2guZGlnZXN0KCkpO1xyXG59O1xyXG5cclxuY29uc3QgZGVmYXVsdFRydWUgPSAocGFyYW0/OiBib29sZWFuKTogYm9vbGVhbiA9PiBwYXJhbSAhPT0gZmFsc2U7XHJcblxyXG5mdW5jdGlvbiB0aHJvd1RvTnVsbDxUeXBlPihmbjogKCkgPT4gVHlwZSk6IFR5cGUgfCBudWxsIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGZuKCk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc1BvaW50KHA6IFVpbnQ4QXJyYXksIHhPbmx5OiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgaWYgKChwLmxlbmd0aCA9PT0gMzIpICE9PSB4T25seSkgcmV0dXJuIGZhbHNlO1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gISFuZWNjLlBvaW50LmZyb21IZXgocCk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdG9CaWdJbnQoYjogVWludDhBcnJheSB8IEJ1ZmZlcik6IGJpZ2ludCB7XHJcbiAgY29uc3QgYnVmZiA9IEJ1ZmZlci5mcm9tKGIpO1xyXG4gIGlmIChidWZmLmxlbmd0aCAhPT0gMzIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzaXplICR7YnVmZi5sZW5ndGh9Jyk7XHJcbiAgfVxyXG4gIHJldHVybiBCaWdJbnQoYDB4JHtidWZmLnRvU3RyaW5nKCdoZXgnKX1gKTtcclxufVxyXG5cclxuY29uc3QgZWNjID0ge1xyXG4gIGlzUG9pbnQ6IChwOiBVaW50OEFycmF5KTogYm9vbGVhbiA9PiBpc1BvaW50KHAsIGZhbHNlKSxcclxuICBpc1ByaXZhdGU6IChkOiBVaW50OEFycmF5KTogYm9vbGVhbiA9PiBuZWNjLnV0aWxzLmlzVmFsaWRQcml2YXRlS2V5KGQpLFxyXG4gIGlzWE9ubHlQb2ludDogKHA6IFVpbnQ4QXJyYXkpOiBib29sZWFuID0+IGlzUG9pbnQocCwgdHJ1ZSksXHJcblxyXG4gIHhPbmx5UG9pbnRBZGRUd2VhazogKHA6IFVpbnQ4QXJyYXksIHR3ZWFrOiBVaW50OEFycmF5KTogeyBwYXJpdHk6IDAgfCAxOyB4T25seVB1YmtleTogVWludDhBcnJheSB9IHwgbnVsbCA9PlxyXG4gICAgdGhyb3dUb051bGwoKCkgPT4ge1xyXG4gICAgICBjb25zdCBQID0gbmVjYy51dGlscy5wb2ludEFkZFNjYWxhcihwLCB0d2VhaywgdHJ1ZSk7XHJcbiAgICAgIGNvbnN0IHBhcml0eSA9IFBbMF0gJSAyID09PSAxID8gMSA6IDA7XHJcbiAgICAgIHJldHVybiB7IHBhcml0eSwgeE9ubHlQdWJrZXk6IFAuc2xpY2UoMSkgfTtcclxuICAgIH0pLFxyXG5cclxuICBwb2ludEZyb21TY2FsYXI6IChzazogVWludDhBcnJheSwgY29tcHJlc3NlZD86IGJvb2xlYW4pOiBVaW50OEFycmF5IHwgbnVsbCA9PlxyXG4gICAgdGhyb3dUb051bGwoKCkgPT4gbmVjYy5nZXRQdWJsaWNLZXkoc2ssIGRlZmF1bHRUcnVlKGNvbXByZXNzZWQpKSksXHJcblxyXG4gIHBvaW50Q29tcHJlc3M6IChwOiBVaW50OEFycmF5LCBjb21wcmVzc2VkPzogYm9vbGVhbik6IFVpbnQ4QXJyYXkgPT4ge1xyXG4gICAgcmV0dXJuIG5lY2MuUG9pbnQuZnJvbUhleChwKS50b1Jhd0J5dGVzKGRlZmF1bHRUcnVlKGNvbXByZXNzZWQpKTtcclxuICB9LFxyXG5cclxuICBwb2ludE11bHRpcGx5OiAoYTogVWludDhBcnJheSwgdHdlYWs6IFVpbnQ4QXJyYXksIGNvbXByZXNzZWQ/OiBib29sZWFuKTogVWludDhBcnJheSB8IG51bGwgPT5cclxuICAgIHRocm93VG9OdWxsKCgpID0+IG5lY2MudXRpbHMucG9pbnRNdWx0aXBseShhLCB0d2VhaywgZGVmYXVsdFRydWUoY29tcHJlc3NlZCkpKSxcclxuXHJcbiAgcG9pbnRBZGQ6IChhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5LCBjb21wcmVzc2VkPzogYm9vbGVhbik6IFVpbnQ4QXJyYXkgfCBudWxsID0+XHJcbiAgICB0aHJvd1RvTnVsbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IEEgPSBuZWNjLlBvaW50LmZyb21IZXgoYSk7XHJcbiAgICAgIGNvbnN0IEIgPSBuZWNjLlBvaW50LmZyb21IZXgoYik7XHJcbiAgICAgIHJldHVybiBBLmFkZChCKS50b1Jhd0J5dGVzKGRlZmF1bHRUcnVlKGNvbXByZXNzZWQpKTtcclxuICAgIH0pLFxyXG5cclxuICBwb2ludEFkZFNjYWxhcjogKHA6IFVpbnQ4QXJyYXksIHR3ZWFrOiBVaW50OEFycmF5LCBjb21wcmVzc2VkPzogYm9vbGVhbik6IFVpbnQ4QXJyYXkgfCBudWxsID0+XHJcbiAgICB0aHJvd1RvTnVsbCgoKSA9PiBuZWNjLnV0aWxzLnBvaW50QWRkU2NhbGFyKHAsIHR3ZWFrLCBkZWZhdWx0VHJ1ZShjb21wcmVzc2VkKSkpLFxyXG5cclxuICBwcml2YXRlQWRkOiAoZDogVWludDhBcnJheSwgdHdlYWs6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHwgbnVsbCA9PlxyXG4gICAgdGhyb3dUb051bGwoKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXMgPSBuZWNjLnV0aWxzLnByaXZhdGVBZGQoZCwgdHdlYWspO1xyXG4gICAgICAvLyB0aW55LXNlY3AyNTZrMSByZXR1cm5zIG51bGwgcmF0aGVyIHRoYW4gYWxsb3dpbmcgYSAwIHByaXZhdGUga2V5IHRvIGJlIHJldHVybmVkXHJcbiAgICAgIC8vIEVDUGFpci50ZXN0RWNjKCkgcmVxdWlyZXMgdGhhdCBiZWhhdmlvci5cclxuICAgICAgaWYgKHJlcz8uZXZlcnkoKGkpID0+IGkgPT09IDApKSByZXR1cm4gbnVsbDtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pLFxyXG5cclxuICBwcml2YXRlTmVnYXRlOiAoZDogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkgPT4gbmVjYy51dGlscy5wcml2YXRlTmVnYXRlKGQpLFxyXG5cclxuICBzaWduOiAoaDogVWludDhBcnJheSwgZDogVWludDhBcnJheSwgZT86IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5ID0+IHtcclxuICAgIHJldHVybiBuZWNjLnNpZ25TeW5jKGgsIGQsIHsgZGVyOiBmYWxzZSwgZXh0cmFFbnRyb3B5OiBlIH0pO1xyXG4gIH0sXHJcblxyXG4gIHNpZ25TY2hub3JyOiAoaDogVWludDhBcnJheSwgZDogVWludDhBcnJheSwgZTogVWludDhBcnJheSA9IEJ1ZmZlci5hbGxvYygzMiwgMHgwMCkpOiBVaW50OEFycmF5ID0+IHtcclxuICAgIHJldHVybiBuZWNjLnNjaG5vcnIuc2lnblN5bmMoaCwgZCwgZSk7XHJcbiAgfSxcclxuXHJcbiAgdmVyaWZ5OiAoaDogVWludDhBcnJheSwgUTogVWludDhBcnJheSwgc2lnbmF0dXJlOiBVaW50OEFycmF5LCBzdHJpY3Q/OiBib29sZWFuKTogYm9vbGVhbiA9PiB7XHJcbiAgICByZXR1cm4gbmVjYy52ZXJpZnkoc2lnbmF0dXJlLCBoLCBRLCB7IHN0cmljdCB9KTtcclxuICB9LFxyXG5cclxuICB2ZXJpZnlTY2hub3JyOiAoaDogVWludDhBcnJheSwgUTogVWludDhBcnJheSwgc2lnbmF0dXJlOiBVaW50OEFycmF5KTogYm9vbGVhbiA9PiB7XHJcbiAgICByZXR1cm4gbmVjYy5zY2hub3JyLnZlcmlmeVN5bmMoc2lnbmF0dXJlLCBoLCBRKTtcclxuICB9LFxyXG59O1xyXG5cclxuY29uc3QgY3J5cHRvID0ge1xyXG4gIC4uLmJhc2VDcnlwdG8sXHJcbiAgcG9pbnRNdWx0aXBseVVuc2FmZShwOiBVaW50OEFycmF5LCBhOiBVaW50OEFycmF5LCBjb21wcmVzczogYm9vbGVhbik6IFVpbnQ4QXJyYXkgfCBudWxsIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHByb2R1Y3QgPSBuZWNjLlBvaW50LmZyb21IZXgocCkubXVsdGlwbHlBbmRBZGRVbnNhZmUobmVjYy5Qb2ludC5aRVJPLCB0b0JpZ0ludChhKSwgQmlnSW50KDEpKTtcclxuICAgICAgaWYgKCFwcm9kdWN0KSByZXR1cm4gbnVsbDtcclxuICAgICAgcmV0dXJuIHByb2R1Y3QudG9SYXdCeXRlcyhjb21wcmVzcyk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfSxcclxuICBwb2ludE11bHRpcGx5QW5kQWRkVW5zYWZlKHAxOiBVaW50OEFycmF5LCBhOiBVaW50OEFycmF5LCBwMjogVWludDhBcnJheSwgY29tcHJlc3M6IGJvb2xlYW4pOiBVaW50OEFycmF5IHwgbnVsbCB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBwMnAgPSBuZWNjLlBvaW50LmZyb21IZXgocDIpO1xyXG4gICAgICBjb25zdCBwID0gbmVjYy5Qb2ludC5mcm9tSGV4KHAxKS5tdWx0aXBseUFuZEFkZFVuc2FmZShwMnAsIHRvQmlnSW50KGEpLCBCaWdJbnQoMSkpO1xyXG4gICAgICBpZiAoIXApIHJldHVybiBudWxsO1xyXG4gICAgICByZXR1cm4gcC50b1Jhd0J5dGVzKGNvbXByZXNzKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9LFxyXG4gIHBvaW50QWRkKGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXksIGNvbXByZXNzOiBib29sZWFuKTogVWludDhBcnJheSB8IG51bGwge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIG5lY2MuUG9pbnQuZnJvbUhleChhKS5hZGQobmVjYy5Qb2ludC5mcm9tSGV4KGIpKS50b1Jhd0J5dGVzKGNvbXByZXNzKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9LFxyXG4gIHBvaW50QWRkVHdlYWsocDogVWludDhBcnJheSwgdHdlYWs6IFVpbnQ4QXJyYXksIGNvbXByZXNzOiBib29sZWFuKTogVWludDhBcnJheSB8IG51bGwge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgUCA9IG5lY2MuUG9pbnQuZnJvbUhleChwKTtcclxuICAgICAgY29uc3QgdCA9IGJhc2VDcnlwdG8ucmVhZFNlY3JldCh0d2Vhayk7XHJcbiAgICAgIGNvbnN0IFEgPSBuZWNjLlBvaW50LkJBU0UubXVsdGlwbHlBbmRBZGRVbnNhZmUoUCwgdCwgQmlnSW50KDEpKTtcclxuICAgICAgaWYgKCFRKSB0aHJvdyBuZXcgRXJyb3IoJ1R3ZWFrZWQgcG9pbnQgYXQgaW5maW5pdHknKTtcclxuICAgICAgcmV0dXJuIFEudG9SYXdCeXRlcyhjb21wcmVzcyk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfSxcclxuICBwb2ludENvbXByZXNzKHA6IFVpbnQ4QXJyYXksIGNvbXByZXNzID0gdHJ1ZSk6IFVpbnQ4QXJyYXkge1xyXG4gICAgcmV0dXJuIG5lY2MuUG9pbnQuZnJvbUhleChwKS50b1Jhd0J5dGVzKGNvbXByZXNzKTtcclxuICB9LFxyXG4gIGxpZnRYKHA6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHwgbnVsbCB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXR1cm4gbmVjYy5Qb2ludC5mcm9tSGV4KHApLnRvUmF3Qnl0ZXMoZmFsc2UpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgZ2V0UHVibGljS2V5KHM6IFVpbnQ4QXJyYXksIGNvbXByZXNzOiBib29sZWFuKTogVWludDhBcnJheSB8IG51bGwge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIG5lY2MuZ2V0UHVibGljS2V5KHMsIGNvbXByZXNzKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9LFxyXG4gIHRhZ2dlZEhhc2g6IG5lY2MudXRpbHMudGFnZ2VkSGFzaFN5bmMsXHJcbiAgc2hhMjU2KC4uLm1lc3NhZ2VzOiBVaW50OEFycmF5W10pOiBVaW50OEFycmF5IHtcclxuICAgIGNvbnN0IHNoYTI1NiA9IGNyZWF0ZUhhc2goJ3NoYTI1NicpO1xyXG4gICAgZm9yIChjb25zdCBtZXNzYWdlIG9mIG1lc3NhZ2VzKSBzaGEyNTYudXBkYXRlKG1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIHNoYTI1Ni5kaWdlc3QoKTtcclxuICB9LFxyXG59O1xyXG5cclxuY29uc3QgRUNQYWlyOiBFQ1BhaXJBUEkgPSBFQ1BhaXJGYWN0b3J5KGVjYyk7XHJcbmNvbnN0IGJpcDMyOiBCSVAzMkFQSSA9IEJJUDMyRmFjdG9yeShlY2MpO1xyXG5jb25zdCBtdXNpZzogTXVTaWcgPSBNdVNpZ0ZhY3RvcnkoY3J5cHRvKTtcclxuXHJcbmV4cG9ydCB7IGVjYywgRUNQYWlyLCBFQ1BhaXJBUEksIEVDUGFpckludGVyZmFjZSwgYmlwMzIsIEJJUDMyQVBJLCBCSVAzMkludGVyZmFjZSwgbXVzaWcsIE11U2lnIH07XHJcbiJdfQ==