"use strict";
// {pubKey} OP_CHECKSIG
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const __1 = require("../../");
const __2 = require("../../");
function check(script) {
    const chunks = __1.script.decompile(script);
    return chunks.length === 2 && __1.script.isCanonicalPubKey(chunks[0]) && chunks[1] === __2.opcodes.OP_CHECKSIG;
}
exports.check = check;
check.toJSON = () => {
    return 'pubKey output';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RlbXBsYXRlcy9wdWJrZXkvb3V0cHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1QkFBdUI7OztBQUd2Qiw4QkFBMkM7QUFDM0MsOEJBQWlDO0FBRWpDLFNBQWdCLEtBQUssQ0FBQyxNQUFzQjtJQUMxQyxNQUFNLE1BQU0sR0FBRyxVQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBVSxDQUFDO0lBRWxELE9BQU8sTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksVUFBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQVcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxXQUFPLENBQUMsV0FBVyxDQUFDO0FBQ3BILENBQUM7QUFKRCxzQkFJQztBQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBVyxFQUFFO0lBQzFCLE9BQU8sZUFBZSxDQUFDO0FBQ3pCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHtwdWJLZXl9IE9QX0NIRUNLU0lHXHJcblxyXG5pbXBvcnQgeyBTdGFjayB9IGZyb20gJy4uLy4uLyc7XHJcbmltcG9ydCB7IHNjcmlwdCBhcyBic2NyaXB0IH0gZnJvbSAnLi4vLi4vJztcclxuaW1wb3J0IHsgb3Bjb2RlcyB9IGZyb20gJy4uLy4uLyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2soc2NyaXB0OiBCdWZmZXIgfCBTdGFjayk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IGNodW5rcyA9IGJzY3JpcHQuZGVjb21waWxlKHNjcmlwdCkgYXMgU3RhY2s7XHJcblxyXG4gIHJldHVybiBjaHVua3MubGVuZ3RoID09PSAyICYmIGJzY3JpcHQuaXNDYW5vbmljYWxQdWJLZXkoY2h1bmtzWzBdIGFzIEJ1ZmZlcikgJiYgY2h1bmtzWzFdID09PSBvcGNvZGVzLk9QX0NIRUNLU0lHO1xyXG59XHJcbmNoZWNrLnRvSlNPTiA9ICgpOiBzdHJpbmcgPT4ge1xyXG4gIHJldHVybiAncHViS2V5IG91dHB1dCc7XHJcbn07XHJcbiJdfQ==