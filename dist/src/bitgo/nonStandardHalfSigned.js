"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.padInputScript = void 0;
const assert = require("assert");
const opcodes = require("bitcoin-ops");
const __1 = require("../");
/**
 * @param input - Input of non-standard half-signed transaction created with `tx.build()` instead of `tx.buildIncomplete()`.
 * @param signatureIndex - Position to map the existing signatures to. Other signatures will be padded with OP_0.
 */
function padInputScript(input, signatureIndex) {
    if (![0, 1, 2].includes(signatureIndex)) {
        /* istanbul ignore next */
        throw new Error(`invalid signature index: must be one of [0, 1, 2]`);
    }
    let decompiledSigScript;
    if (input.witness && input.witness.length > 0) {
        decompiledSigScript = input.witness;
    }
    else {
        decompiledSigScript = __1.script.decompile(input.script);
    }
    // The shape of a non-standard half-signed input is
    //   OP_0 <signature> <p2ms>
    if (!decompiledSigScript || decompiledSigScript.length !== 3) {
        /* istanbul ignore next */
        return;
    }
    const [op0, signatureBuffer, sigScript] = decompiledSigScript;
    if (op0 !== opcodes.OP_0 && !(Buffer.isBuffer(op0) && op0.length === 0)) {
        /* istanbul ignore next */
        return;
    }
    if (!Buffer.isBuffer(sigScript)) {
        /* istanbul ignore next */
        return;
    }
    if (__1.classify.output(sigScript) !== __1.classify.types.P2MS) {
        /* istanbul ignore next */
        return;
    }
    const paddedSigScript = [
        op0,
        ...[0, 1, 2].map((i) => (i === signatureIndex ? signatureBuffer : Buffer.from([]))),
        sigScript,
    ];
    if (input.witness.length) {
        paddedSigScript.forEach((b) => assert(Buffer.isBuffer(b)));
        input.witness = paddedSigScript;
    }
    else {
        input.script = __1.script.compile(paddedSigScript);
    }
}
exports.padInputScript = padInputScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uU3RhbmRhcmRIYWxmU2lnbmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL25vblN0YW5kYXJkSGFsZlNpZ25lZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsdUNBQXVDO0FBQ3ZDLDJCQUEyRDtBQUUzRDs7O0dBR0c7QUFDSCxTQUFnQixjQUFjLENBQUMsS0FBYyxFQUFFLGNBQXNCO0lBQ25FLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1FBQ3ZDLDBCQUEwQjtRQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7S0FDdEU7SUFFRCxJQUFJLG1CQUFtQixDQUFDO0lBQ3hCLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDN0MsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztLQUNyQztTQUFNO1FBQ0wsbUJBQW1CLEdBQUcsVUFBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdkQ7SUFFRCxtREFBbUQ7SUFDbkQsNEJBQTRCO0lBQzVCLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQzVELDBCQUEwQjtRQUMxQixPQUFPO0tBQ1I7SUFFRCxNQUFNLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRSxTQUFTLENBQUMsR0FBRyxtQkFBbUIsQ0FBQztJQUM5RCxJQUFJLEdBQUcsS0FBSyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDdkUsMEJBQTBCO1FBQzFCLE9BQU87S0FDUjtJQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQy9CLDBCQUEwQjtRQUMxQixPQUFPO0tBQ1I7SUFFRCxJQUFJLFlBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssWUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7UUFDdEQsMEJBQTBCO1FBQzFCLE9BQU87S0FDUjtJQUVELE1BQU0sZUFBZSxHQUFHO1FBQ3RCLEdBQUc7UUFDSCxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkYsU0FBUztLQUNWLENBQUM7SUFFRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1FBQ3hCLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxLQUFLLENBQUMsT0FBTyxHQUFHLGVBQTJCLENBQUM7S0FDN0M7U0FBTTtRQUNMLEtBQUssQ0FBQyxNQUFNLEdBQUcsVUFBTyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUNqRDtBQUNILENBQUM7QUFoREQsd0NBZ0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCAqIGFzIG9wY29kZXMgZnJvbSAnYml0Y29pbi1vcHMnO1xyXG5pbXBvcnQgeyBjbGFzc2lmeSwgc2NyaXB0IGFzIGJzY3JpcHQsIFR4SW5wdXQgfSBmcm9tICcuLi8nO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbnB1dCAtIElucHV0IG9mIG5vbi1zdGFuZGFyZCBoYWxmLXNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIHdpdGggYHR4LmJ1aWxkKClgIGluc3RlYWQgb2YgYHR4LmJ1aWxkSW5jb21wbGV0ZSgpYC5cclxuICogQHBhcmFtIHNpZ25hdHVyZUluZGV4IC0gUG9zaXRpb24gdG8gbWFwIHRoZSBleGlzdGluZyBzaWduYXR1cmVzIHRvLiBPdGhlciBzaWduYXR1cmVzIHdpbGwgYmUgcGFkZGVkIHdpdGggT1BfMC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYWRJbnB1dFNjcmlwdChpbnB1dDogVHhJbnB1dCwgc2lnbmF0dXJlSW5kZXg6IG51bWJlcik6IHZvaWQge1xyXG4gIGlmICghWzAsIDEsIDJdLmluY2x1ZGVzKHNpZ25hdHVyZUluZGV4KSkge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzaWduYXR1cmUgaW5kZXg6IG11c3QgYmUgb25lIG9mIFswLCAxLCAyXWApO1xyXG4gIH1cclxuXHJcbiAgbGV0IGRlY29tcGlsZWRTaWdTY3JpcHQ7XHJcbiAgaWYgKGlucHV0LndpdG5lc3MgJiYgaW5wdXQud2l0bmVzcy5sZW5ndGggPiAwKSB7XHJcbiAgICBkZWNvbXBpbGVkU2lnU2NyaXB0ID0gaW5wdXQud2l0bmVzcztcclxuICB9IGVsc2Uge1xyXG4gICAgZGVjb21waWxlZFNpZ1NjcmlwdCA9IGJzY3JpcHQuZGVjb21waWxlKGlucHV0LnNjcmlwdCk7XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgc2hhcGUgb2YgYSBub24tc3RhbmRhcmQgaGFsZi1zaWduZWQgaW5wdXQgaXNcclxuICAvLyAgIE9QXzAgPHNpZ25hdHVyZT4gPHAybXM+XHJcbiAgaWYgKCFkZWNvbXBpbGVkU2lnU2NyaXB0IHx8IGRlY29tcGlsZWRTaWdTY3JpcHQubGVuZ3RoICE9PSAzKSB7XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgW29wMCwgc2lnbmF0dXJlQnVmZmVyLCBzaWdTY3JpcHRdID0gZGVjb21waWxlZFNpZ1NjcmlwdDtcclxuICBpZiAob3AwICE9PSBvcGNvZGVzLk9QXzAgJiYgIShCdWZmZXIuaXNCdWZmZXIob3AwKSAmJiBvcDAubGVuZ3RoID09PSAwKSkge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHNpZ1NjcmlwdCkpIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoY2xhc3NpZnkub3V0cHV0KHNpZ1NjcmlwdCkgIT09IGNsYXNzaWZ5LnR5cGVzLlAyTVMpIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWRkZWRTaWdTY3JpcHQgPSBbXHJcbiAgICBvcDAsXHJcbiAgICAuLi5bMCwgMSwgMl0ubWFwKChpKSA9PiAoaSA9PT0gc2lnbmF0dXJlSW5kZXggPyBzaWduYXR1cmVCdWZmZXIgOiBCdWZmZXIuZnJvbShbXSkpKSxcclxuICAgIHNpZ1NjcmlwdCxcclxuICBdO1xyXG5cclxuICBpZiAoaW5wdXQud2l0bmVzcy5sZW5ndGgpIHtcclxuICAgIHBhZGRlZFNpZ1NjcmlwdC5mb3JFYWNoKChiKSA9PiBhc3NlcnQoQnVmZmVyLmlzQnVmZmVyKGIpKSk7XHJcbiAgICBpbnB1dC53aXRuZXNzID0gcGFkZGVkU2lnU2NyaXB0IGFzIEJ1ZmZlcltdO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBpbnB1dC5zY3JpcHQgPSBic2NyaXB0LmNvbXBpbGUocGFkZGVkU2lnU2NyaXB0KTtcclxuICB9XHJcbn1cclxuIl19