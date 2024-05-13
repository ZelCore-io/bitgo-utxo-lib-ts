"use strict";
// <scriptSig> {serialized scriptPubKey script}
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const __1 = require("../../");
const p2ms = require("../multisig");
const p2pk = require("../pubkey");
const p2pkh = require("../pubkeyhash");
const p2wpkho = require("../witnesspubkeyhash/output");
const p2wsho = require("../witnessscripthash/output");
function check(script, allowIncomplete) {
    const chunks = __1.script.decompile(script);
    if (chunks.length < 1)
        return false;
    const lastChunk = chunks[chunks.length - 1];
    if (!Buffer.isBuffer(lastChunk))
        return false;
    const scriptSigChunks = __1.script.decompile(__1.script.compile(chunks.slice(0, -1)));
    const redeemScriptChunks = __1.script.decompile(lastChunk);
    // is redeemScript a valid script?
    if (!redeemScriptChunks)
        return false;
    // is redeemScriptSig push only?
    if (!__1.script.isPushOnly(scriptSigChunks))
        return false;
    // is witness?
    if (chunks.length === 1) {
        return p2wsho.check(redeemScriptChunks) || p2wpkho.check(redeemScriptChunks);
    }
    // match types
    if (p2pkh.input.check(scriptSigChunks) && p2pkh.output.check(redeemScriptChunks))
        return true;
    if (p2ms.input.check(scriptSigChunks, allowIncomplete) && p2ms.output.check(redeemScriptChunks))
        return true;
    if (p2pk.input.check(scriptSigChunks) && p2pk.output.check(redeemScriptChunks))
        return true;
    return false;
}
exports.check = check;
check.toJSON = () => {
    return 'scriptHash input';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdGVtcGxhdGVzL3NjcmlwdGhhc2gvaW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtDQUErQzs7O0FBRS9DLDhCQUEyQztBQUMzQyxvQ0FBb0M7QUFDcEMsa0NBQWtDO0FBQ2xDLHVDQUF1QztBQUN2Qyx1REFBdUQ7QUFDdkQsc0RBQXNEO0FBRXRELFNBQWdCLEtBQUssQ0FBQyxNQUF1QyxFQUFFLGVBQXlCO0lBQ3RGLE1BQU0sTUFBTSxHQUFHLFVBQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFFLENBQUM7SUFDMUMsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUVwQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUU5QyxNQUFNLGVBQWUsR0FBRyxVQUFPLENBQUMsU0FBUyxDQUFDLFVBQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7SUFDakYsTUFBTSxrQkFBa0IsR0FBRyxVQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXhELGtDQUFrQztJQUNsQyxJQUFJLENBQUMsa0JBQWtCO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFFdEMsZ0NBQWdDO0lBQ2hDLElBQUksQ0FBQyxVQUFPLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBRXZELGNBQWM7SUFDZCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUM5RTtJQUVELGNBQWM7SUFDZCxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFOUYsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztJQUU3RyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFNUYsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBN0JELHNCQTZCQztBQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBVyxFQUFFO0lBQzFCLE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gPHNjcmlwdFNpZz4ge3NlcmlhbGl6ZWQgc2NyaXB0UHViS2V5IHNjcmlwdH1cclxuXHJcbmltcG9ydCB7IHNjcmlwdCBhcyBic2NyaXB0IH0gZnJvbSAnLi4vLi4vJztcclxuaW1wb3J0ICogYXMgcDJtcyBmcm9tICcuLi9tdWx0aXNpZyc7XHJcbmltcG9ydCAqIGFzIHAycGsgZnJvbSAnLi4vcHVia2V5JztcclxuaW1wb3J0ICogYXMgcDJwa2ggZnJvbSAnLi4vcHVia2V5aGFzaCc7XHJcbmltcG9ydCAqIGFzIHAyd3BraG8gZnJvbSAnLi4vd2l0bmVzc3B1YmtleWhhc2gvb3V0cHV0JztcclxuaW1wb3J0ICogYXMgcDJ3c2hvIGZyb20gJy4uL3dpdG5lc3NzY3JpcHRoYXNoL291dHB1dCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2soc2NyaXB0OiBCdWZmZXIgfCBBcnJheTxudW1iZXIgfCBCdWZmZXI+LCBhbGxvd0luY29tcGxldGU/OiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgY2h1bmtzID0gYnNjcmlwdC5kZWNvbXBpbGUoc2NyaXB0KSE7XHJcbiAgaWYgKGNodW5rcy5sZW5ndGggPCAxKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGNvbnN0IGxhc3RDaHVuayA9IGNodW5rc1tjaHVua3MubGVuZ3RoIC0gMV07XHJcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIobGFzdENodW5rKSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICBjb25zdCBzY3JpcHRTaWdDaHVua3MgPSBic2NyaXB0LmRlY29tcGlsZShic2NyaXB0LmNvbXBpbGUoY2h1bmtzLnNsaWNlKDAsIC0xKSkpITtcclxuICBjb25zdCByZWRlZW1TY3JpcHRDaHVua3MgPSBic2NyaXB0LmRlY29tcGlsZShsYXN0Q2h1bmspO1xyXG5cclxuICAvLyBpcyByZWRlZW1TY3JpcHQgYSB2YWxpZCBzY3JpcHQ/XHJcbiAgaWYgKCFyZWRlZW1TY3JpcHRDaHVua3MpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgLy8gaXMgcmVkZWVtU2NyaXB0U2lnIHB1c2ggb25seT9cclxuICBpZiAoIWJzY3JpcHQuaXNQdXNoT25seShzY3JpcHRTaWdDaHVua3MpKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIC8vIGlzIHdpdG5lc3M/XHJcbiAgaWYgKGNodW5rcy5sZW5ndGggPT09IDEpIHtcclxuICAgIHJldHVybiBwMndzaG8uY2hlY2socmVkZWVtU2NyaXB0Q2h1bmtzKSB8fCBwMndwa2hvLmNoZWNrKHJlZGVlbVNjcmlwdENodW5rcyk7XHJcbiAgfVxyXG5cclxuICAvLyBtYXRjaCB0eXBlc1xyXG4gIGlmIChwMnBraC5pbnB1dC5jaGVjayhzY3JpcHRTaWdDaHVua3MpICYmIHAycGtoLm91dHB1dC5jaGVjayhyZWRlZW1TY3JpcHRDaHVua3MpKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgaWYgKHAybXMuaW5wdXQuY2hlY2soc2NyaXB0U2lnQ2h1bmtzLCBhbGxvd0luY29tcGxldGUpICYmIHAybXMub3V0cHV0LmNoZWNrKHJlZGVlbVNjcmlwdENodW5rcykpIHJldHVybiB0cnVlO1xyXG5cclxuICBpZiAocDJway5pbnB1dC5jaGVjayhzY3JpcHRTaWdDaHVua3MpICYmIHAycGsub3V0cHV0LmNoZWNrKHJlZGVlbVNjcmlwdENodW5rcykpIHJldHVybiB0cnVlO1xyXG5cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuY2hlY2sudG9KU09OID0gKCk6IHN0cmluZyA9PiB7XHJcbiAgcmV0dXJuICdzY3JpcHRIYXNoIGlucHV0JztcclxufTtcclxuIl19