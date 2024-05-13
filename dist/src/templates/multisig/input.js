"use strict";
// OP_0 [signatures ...]
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const __1 = require("../../");
const __2 = require("../../");
function partialSignature(value) {
    return value === __2.opcodes.OP_0 || __1.script.isCanonicalScriptSignature(value);
}
function check(script, allowIncomplete) {
    const chunks = __1.script.decompile(script);
    if (chunks.length < 2)
        return false;
    if (chunks[0] !== __2.opcodes.OP_0)
        return false;
    if (allowIncomplete) {
        return chunks.slice(1).every(partialSignature);
    }
    return chunks.slice(1).every(__1.script.isCanonicalScriptSignature);
}
exports.check = check;
check.toJSON = () => {
    return 'multisig input';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdGVtcGxhdGVzL211bHRpc2lnL2lucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx3QkFBd0I7OztBQUd4Qiw4QkFBMkM7QUFDM0MsOEJBQWlDO0FBRWpDLFNBQVMsZ0JBQWdCLENBQUMsS0FBc0I7SUFDOUMsT0FBTyxLQUFLLEtBQUssV0FBTyxDQUFDLElBQUksSUFBSSxVQUFPLENBQUMsMEJBQTBCLENBQUMsS0FBZSxDQUFDLENBQUM7QUFDdkYsQ0FBQztBQUVELFNBQWdCLEtBQUssQ0FBQyxNQUFzQixFQUFFLGVBQXlCO0lBQ3JFLE1BQU0sTUFBTSxHQUFHLFVBQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFVLENBQUM7SUFDbEQsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNwQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxXQUFPLENBQUMsSUFBSTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBRTdDLElBQUksZUFBZSxFQUFFO1FBQ25CLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNoRDtJQUVELE9BQVEsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQWMsQ0FBQyxLQUFLLENBQUMsVUFBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDakYsQ0FBQztBQVZELHNCQVVDO0FBQ0QsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFXLEVBQUU7SUFDMUIsT0FBTyxnQkFBZ0IsQ0FBQztBQUMxQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBPUF8wIFtzaWduYXR1cmVzIC4uLl1cclxuXHJcbmltcG9ydCB7IFN0YWNrIH0gZnJvbSAnLi4vLi4vJztcclxuaW1wb3J0IHsgc2NyaXB0IGFzIGJzY3JpcHQgfSBmcm9tICcuLi8uLi8nO1xyXG5pbXBvcnQgeyBvcGNvZGVzIH0gZnJvbSAnLi4vLi4vJztcclxuXHJcbmZ1bmN0aW9uIHBhcnRpYWxTaWduYXR1cmUodmFsdWU6IG51bWJlciB8IEJ1ZmZlcik6IGJvb2xlYW4ge1xyXG4gIHJldHVybiB2YWx1ZSA9PT0gb3Bjb2Rlcy5PUF8wIHx8IGJzY3JpcHQuaXNDYW5vbmljYWxTY3JpcHRTaWduYXR1cmUodmFsdWUgYXMgQnVmZmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrKHNjcmlwdDogQnVmZmVyIHwgU3RhY2ssIGFsbG93SW5jb21wbGV0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICBjb25zdCBjaHVua3MgPSBic2NyaXB0LmRlY29tcGlsZShzY3JpcHQpIGFzIFN0YWNrO1xyXG4gIGlmIChjaHVua3MubGVuZ3RoIDwgMikgcmV0dXJuIGZhbHNlO1xyXG4gIGlmIChjaHVua3NbMF0gIT09IG9wY29kZXMuT1BfMCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICBpZiAoYWxsb3dJbmNvbXBsZXRlKSB7XHJcbiAgICByZXR1cm4gY2h1bmtzLnNsaWNlKDEpLmV2ZXJ5KHBhcnRpYWxTaWduYXR1cmUpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChjaHVua3Muc2xpY2UoMSkgYXMgQnVmZmVyW10pLmV2ZXJ5KGJzY3JpcHQuaXNDYW5vbmljYWxTY3JpcHRTaWduYXR1cmUpO1xyXG59XHJcbmNoZWNrLnRvSlNPTiA9ICgpOiBzdHJpbmcgPT4ge1xyXG4gIHJldHVybiAnbXVsdGlzaWcgaW5wdXQnO1xyXG59O1xyXG4iXX0=