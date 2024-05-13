"use strict";
// OP_HASH160 {scriptHash} OP_EQUAL
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const __1 = require("../../");
const __2 = require("../../");
function check(script) {
    const buffer = __1.script.compile(script);
    return (buffer.length === 23 && buffer[0] === __2.opcodes.OP_HASH160 && buffer[1] === 0x14 && buffer[22] === __2.opcodes.OP_EQUAL);
}
exports.check = check;
check.toJSON = () => {
    return 'scriptHash output';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RlbXBsYXRlcy9zY3JpcHRoYXNoL291dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsbUNBQW1DOzs7QUFFbkMsOEJBQTJDO0FBQzNDLDhCQUFpQztBQUVqQyxTQUFnQixLQUFLLENBQUMsTUFBdUM7SUFDM0QsTUFBTSxNQUFNLEdBQUcsVUFBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV2QyxPQUFPLENBQ0wsTUFBTSxDQUFDLE1BQU0sS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLFdBQU8sQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssV0FBTyxDQUFDLFFBQVEsQ0FDbEgsQ0FBQztBQUNKLENBQUM7QUFORCxzQkFNQztBQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBVyxFQUFFO0lBQzFCLE9BQU8sbUJBQW1CLENBQUM7QUFDN0IsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gT1BfSEFTSDE2MCB7c2NyaXB0SGFzaH0gT1BfRVFVQUxcclxuXHJcbmltcG9ydCB7IHNjcmlwdCBhcyBic2NyaXB0IH0gZnJvbSAnLi4vLi4vJztcclxuaW1wb3J0IHsgb3Bjb2RlcyB9IGZyb20gJy4uLy4uLyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2soc2NyaXB0OiBCdWZmZXIgfCBBcnJheTxudW1iZXIgfCBCdWZmZXI+KTogYm9vbGVhbiB7XHJcbiAgY29uc3QgYnVmZmVyID0gYnNjcmlwdC5jb21waWxlKHNjcmlwdCk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICBidWZmZXIubGVuZ3RoID09PSAyMyAmJiBidWZmZXJbMF0gPT09IG9wY29kZXMuT1BfSEFTSDE2MCAmJiBidWZmZXJbMV0gPT09IDB4MTQgJiYgYnVmZmVyWzIyXSA9PT0gb3Bjb2Rlcy5PUF9FUVVBTFxyXG4gICk7XHJcbn1cclxuY2hlY2sudG9KU09OID0gKCk6IHN0cmluZyA9PiB7XHJcbiAgcmV0dXJuICdzY3JpcHRIYXNoIG91dHB1dCc7XHJcbn07XHJcbiJdfQ==