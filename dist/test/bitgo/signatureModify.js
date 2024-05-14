"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrevOutsWithInvalidOutputScript = exports.getTransactionWithHighS = void 0;
/* eslint-disable no-redeclare */
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bitgo_1 = require("../../src/bitgo");
const BN = require('bn.js');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
const n = secp256k1.curve.n;
const nDiv2 = n.shrn(1);
function changeSignatureToHighS(signatureBuffer) {
    if (!bitcoinjs_lib_1.script.isCanonicalScriptSignature(signatureBuffer)) {
        throw new Error(`not canonical`);
    }
    const { signature, hashType } = bitcoinjs_lib_1.ScriptSignature.decode(signatureBuffer);
    const r = signature.subarray(0, 32);
    const s = signature.subarray(32);
    if (r.length !== 32 || s.length !== 32) {
        throw new Error(`invalid scalar length`);
    }
    let ss = new BN(s);
    if (ss.cmp(nDiv2) > 0) {
        throw new Error(`signature already has high s value`);
    }
    // convert to high-S
    ss = n.sub(ss);
    const newSig = bitcoinjs_lib_1.ScriptSignature.encode(Buffer.concat([r, ss.toArrayLike(Buffer, 'be', 32)]), hashType);
    if (!bitcoinjs_lib_1.script.isCanonicalScriptSignature(newSig)) {
        throw new Error(`newSig not canonical`);
    }
    return newSig;
}
function changeSignatureScriptToHighS(v, signature) {
    const parts = Buffer.isBuffer(v) ? bitcoinjs_lib_1.script.decompile(v) : v;
    if (!parts) {
        throw new Error(`could not decompile input`);
    }
    const newParts = parts.map((p) => {
        if (typeof p === 'number') {
            return p;
        }
        return p.equals(signature) ? changeSignatureToHighS(p) : Buffer.from(p);
    });
    return Buffer.isBuffer(v) ? bitcoinjs_lib_1.script.compile(newParts) : newParts;
}
function getTransactionWithHighS(tx, inputIndex) {
    const parsed = (0, bitgo_1.parseSignatureScript)(tx.ins[inputIndex]);
    switch (parsed.scriptType) {
        case 'p2sh':
        case 'p2shP2wsh':
        case 'p2wsh':
            break;
        default:
            return [];
    }
    return parsed.signatures.flatMap((signature) => {
        if ((0, bitgo_1.isPlaceholderSignature)(signature)) {
            return [];
        }
        const cloned = tx.clone();
        cloned.ins[inputIndex].script = changeSignatureScriptToHighS(cloned.ins[inputIndex].script, signature);
        cloned.ins[inputIndex].witness = changeSignatureScriptToHighS(cloned.ins[inputIndex].witness, signature);
        if ((0, bitgo_1.parseSignatureScript)(cloned.ins[inputIndex]).scriptType !== parsed.scriptType) {
            throw new Error(`could not parse modified input`);
        }
        return [cloned];
    });
}
exports.getTransactionWithHighS = getTransactionWithHighS;
/** Return transaction with script xored with 0xff for the given input */
function getPrevOutsWithInvalidOutputScript(prevOuts, inputIndex) {
    return prevOuts.map((prevOut, i) => {
        return i === inputIndex
            ? {
                ...prevOut,
                script: prevOut.script.map((v) => v ^ 0xff),
            }
            : prevOut;
    });
}
exports.getPrevOutsWithInvalidOutputScript = getPrevOutsWithInvalidOutputScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlTW9kaWZ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9iaXRnby9zaWduYXR1cmVNb2RpZnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQWlDO0FBQ2pDLGlEQUFrRTtBQUNsRSwyQ0FBZ0c7QUFFaEcsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzVCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDdEMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUV4QixTQUFTLHNCQUFzQixDQUFDLGVBQXVCO0lBQ3JELElBQUksQ0FBQyxzQkFBTSxDQUFDLDBCQUEwQixDQUFDLGVBQWUsQ0FBQyxFQUFFO1FBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDbEM7SUFDRCxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxHQUFHLCtCQUFlLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBRXhFLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFakMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtRQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7S0FDMUM7SUFFRCxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVuQixJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztLQUN2RDtJQUVELG9CQUFvQjtJQUNwQixFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVmLE1BQU0sTUFBTSxHQUFHLCtCQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RyxJQUFJLENBQUMsc0JBQU0sQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUM5QyxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7S0FDekM7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBSUQsU0FBUyw0QkFBNEIsQ0FBQyxDQUFvQixFQUFFLFNBQWlCO0lBQzNFLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0QsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztLQUM5QztJQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUMvQixJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtZQUN6QixPQUFPLENBQUMsQ0FBQztTQUNWO1FBQ0QsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFFLFFBQXFCLENBQUM7QUFDaEYsQ0FBQztBQUVELFNBQWdCLHVCQUF1QixDQUNyQyxFQUE0QixFQUM1QixVQUFrQjtJQUVsQixNQUFNLE1BQU0sR0FBRyxJQUFBLDRCQUFvQixFQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUN4RCxRQUFRLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDekIsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLFdBQVcsQ0FBQztRQUNqQixLQUFLLE9BQU87WUFDVixNQUFNO1FBQ1I7WUFDRSxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBQ0QsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1FBQzdDLElBQUksSUFBQSw4QkFBc0IsRUFBQyxTQUFTLENBQUMsRUFBRTtZQUNyQyxPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxHQUFHLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxHQUFHLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3pHLElBQUksSUFBQSw0QkFBb0IsRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxLQUFLLE1BQU0sQ0FBQyxVQUFVLEVBQUU7WUFDakYsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXpCRCwwREF5QkM7QUFFRCx5RUFBeUU7QUFDekUsU0FBZ0Isa0NBQWtDLENBQ2hELFFBQTZCLEVBQzdCLFVBQWtCO0lBRWxCLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNqQyxPQUFPLENBQUMsS0FBSyxVQUFVO1lBQ3JCLENBQUMsQ0FBQztnQkFDRSxHQUFHLE9BQU87Z0JBQ1YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUEwQjthQUNyRTtZQUNILENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFaRCxnRkFZQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXJlZGVjbGFyZSAqL1xyXG5pbXBvcnQgeyBzY3JpcHQsIFNjcmlwdFNpZ25hdHVyZSwgVHhPdXRwdXQgfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuaW1wb3J0IHsgaXNQbGFjZWhvbGRlclNpZ25hdHVyZSwgcGFyc2VTaWduYXR1cmVTY3JpcHQsIFV0eG9UcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3NyYy9iaXRnbyc7XHJcblxyXG5jb25zdCBCTiA9IHJlcXVpcmUoJ2JuLmpzJyk7XHJcbmNvbnN0IEVDID0gcmVxdWlyZSgnZWxsaXB0aWMnKS5lYztcclxuY29uc3Qgc2VjcDI1NmsxID0gbmV3IEVDKCdzZWNwMjU2azEnKTtcclxuY29uc3QgbiA9IHNlY3AyNTZrMS5jdXJ2ZS5uO1xyXG5jb25zdCBuRGl2MiA9IG4uc2hybigxKTtcclxuXHJcbmZ1bmN0aW9uIGNoYW5nZVNpZ25hdHVyZVRvSGlnaFMoc2lnbmF0dXJlQnVmZmVyOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gIGlmICghc2NyaXB0LmlzQ2Fub25pY2FsU2NyaXB0U2lnbmF0dXJlKHNpZ25hdHVyZUJ1ZmZlcikpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgbm90IGNhbm9uaWNhbGApO1xyXG4gIH1cclxuICBjb25zdCB7IHNpZ25hdHVyZSwgaGFzaFR5cGUgfSA9IFNjcmlwdFNpZ25hdHVyZS5kZWNvZGUoc2lnbmF0dXJlQnVmZmVyKTtcclxuXHJcbiAgY29uc3QgciA9IHNpZ25hdHVyZS5zdWJhcnJheSgwLCAzMik7XHJcbiAgY29uc3QgcyA9IHNpZ25hdHVyZS5zdWJhcnJheSgzMik7XHJcblxyXG4gIGlmIChyLmxlbmd0aCAhPT0gMzIgfHwgcy5sZW5ndGggIT09IDMyKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgc2NhbGFyIGxlbmd0aGApO1xyXG4gIH1cclxuXHJcbiAgbGV0IHNzID0gbmV3IEJOKHMpO1xyXG5cclxuICBpZiAoc3MuY21wKG5EaXYyKSA+IDApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgc2lnbmF0dXJlIGFscmVhZHkgaGFzIGhpZ2ggcyB2YWx1ZWApO1xyXG4gIH1cclxuXHJcbiAgLy8gY29udmVydCB0byBoaWdoLVNcclxuICBzcyA9IG4uc3ViKHNzKTtcclxuXHJcbiAgY29uc3QgbmV3U2lnID0gU2NyaXB0U2lnbmF0dXJlLmVuY29kZShCdWZmZXIuY29uY2F0KFtyLCBzcy50b0FycmF5TGlrZShCdWZmZXIsICdiZScsIDMyKV0pLCBoYXNoVHlwZSk7XHJcbiAgaWYgKCFzY3JpcHQuaXNDYW5vbmljYWxTY3JpcHRTaWduYXR1cmUobmV3U2lnKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBuZXdTaWcgbm90IGNhbm9uaWNhbGApO1xyXG4gIH1cclxuICByZXR1cm4gbmV3U2lnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGFuZ2VTaWduYXR1cmVTY3JpcHRUb0hpZ2hTKHNjcmlwdDogQnVmZmVyLCBzaWduYXR1cmU6IEJ1ZmZlcik6IEJ1ZmZlcjtcclxuZnVuY3Rpb24gY2hhbmdlU2lnbmF0dXJlU2NyaXB0VG9IaWdoUyh3aXRuZXNzOiBCdWZmZXJbXSwgc2lnbmF0dXJlOiBCdWZmZXIpOiBCdWZmZXJbXTtcclxuZnVuY3Rpb24gY2hhbmdlU2lnbmF0dXJlU2NyaXB0VG9IaWdoUyh2OiBCdWZmZXIgfCBCdWZmZXJbXSwgc2lnbmF0dXJlOiBCdWZmZXIpOiBCdWZmZXIgfCBCdWZmZXJbXSB7XHJcbiAgY29uc3QgcGFydHMgPSBCdWZmZXIuaXNCdWZmZXIodikgPyBzY3JpcHQuZGVjb21waWxlKHYpIDogdjtcclxuICBpZiAoIXBhcnRzKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBkZWNvbXBpbGUgaW5wdXRgKTtcclxuICB9XHJcbiAgY29uc3QgbmV3UGFydHMgPSBwYXJ0cy5tYXAoKHApID0+IHtcclxuICAgIGlmICh0eXBlb2YgcCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgcmV0dXJuIHA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcC5lcXVhbHMoc2lnbmF0dXJlKSA/IGNoYW5nZVNpZ25hdHVyZVRvSGlnaFMocCkgOiBCdWZmZXIuZnJvbShwKTtcclxuICB9KTtcclxuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKHYpID8gc2NyaXB0LmNvbXBpbGUobmV3UGFydHMpIDogKG5ld1BhcnRzIGFzIEJ1ZmZlcltdKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9uV2l0aEhpZ2hTPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4OiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgaW5wdXRJbmRleDogbnVtYmVyXHJcbik6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPltdIHtcclxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVNpZ25hdHVyZVNjcmlwdCh0eC5pbnNbaW5wdXRJbmRleF0pO1xyXG4gIHN3aXRjaCAocGFyc2VkLnNjcmlwdFR5cGUpIHtcclxuICAgIGNhc2UgJ3Ayc2gnOlxyXG4gICAgY2FzZSAncDJzaFAyd3NoJzpcclxuICAgIGNhc2UgJ3Ayd3NoJzpcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIHJldHVybiBwYXJzZWQuc2lnbmF0dXJlcy5mbGF0TWFwKChzaWduYXR1cmUpID0+IHtcclxuICAgIGlmIChpc1BsYWNlaG9sZGVyU2lnbmF0dXJlKHNpZ25hdHVyZSkpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY2xvbmVkID0gdHguY2xvbmUoKTtcclxuICAgIGNsb25lZC5pbnNbaW5wdXRJbmRleF0uc2NyaXB0ID0gY2hhbmdlU2lnbmF0dXJlU2NyaXB0VG9IaWdoUyhjbG9uZWQuaW5zW2lucHV0SW5kZXhdLnNjcmlwdCwgc2lnbmF0dXJlKTtcclxuICAgIGNsb25lZC5pbnNbaW5wdXRJbmRleF0ud2l0bmVzcyA9IGNoYW5nZVNpZ25hdHVyZVNjcmlwdFRvSGlnaFMoY2xvbmVkLmluc1tpbnB1dEluZGV4XS53aXRuZXNzLCBzaWduYXR1cmUpO1xyXG4gICAgaWYgKHBhcnNlU2lnbmF0dXJlU2NyaXB0KGNsb25lZC5pbnNbaW5wdXRJbmRleF0pLnNjcmlwdFR5cGUgIT09IHBhcnNlZC5zY3JpcHRUeXBlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgY291bGQgbm90IHBhcnNlIG1vZGlmaWVkIGlucHV0YCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW2Nsb25lZF07XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBSZXR1cm4gdHJhbnNhY3Rpb24gd2l0aCBzY3JpcHQgeG9yZWQgd2l0aCAweGZmIGZvciB0aGUgZ2l2ZW4gaW5wdXQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZPdXRzV2l0aEludmFsaWRPdXRwdXRTY3JpcHQ8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgcHJldk91dHM6IFR4T3V0cHV0PFROdW1iZXI+W10sXHJcbiAgaW5wdXRJbmRleDogbnVtYmVyXHJcbik6IFR4T3V0cHV0PFROdW1iZXI+W10ge1xyXG4gIHJldHVybiBwcmV2T3V0cy5tYXAoKHByZXZPdXQsIGkpID0+IHtcclxuICAgIHJldHVybiBpID09PSBpbnB1dEluZGV4XHJcbiAgICAgID8ge1xyXG4gICAgICAgICAgLi4ucHJldk91dCxcclxuICAgICAgICAgIHNjcmlwdDogcHJldk91dC5zY3JpcHQubWFwKCh2KSA9PiB2IF4gMHhmZikgYXMgdHlwZW9mIHByZXZPdXQuc2NyaXB0LFxyXG4gICAgICAgIH1cclxuICAgICAgOiBwcmV2T3V0O1xyXG4gIH0pO1xyXG59XHJcbiJdfQ==