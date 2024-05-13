"use strict";
// OP_1 {scriptHash}
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const __1 = require("../../");
const __2 = require("../../");
function check(script) {
    const buffer = __1.script.compile(script);
    return buffer.length === 34 && buffer[0] === __2.opcodes.OP_1 && buffer[1] === 0x20;
}
exports.check = check;
check.toJSON = () => {
    return 'Taproot output';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RlbXBsYXRlcy90YXByb290L291dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsb0JBQW9COzs7QUFFcEIsOEJBQTJDO0FBQzNDLDhCQUFpQztBQUVqQyxTQUFnQixLQUFLLENBQUMsTUFBdUM7SUFDM0QsTUFBTSxNQUFNLEdBQUcsVUFBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV2QyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssRUFBRSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxXQUFPLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUM7QUFDbEYsQ0FBQztBQUpELHNCQUlDO0FBQ0QsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFXLEVBQUU7SUFDMUIsT0FBTyxnQkFBZ0IsQ0FBQztBQUMxQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBPUF8xIHtzY3JpcHRIYXNofVxyXG5cclxuaW1wb3J0IHsgc2NyaXB0IGFzIGJzY3JpcHQgfSBmcm9tICcuLi8uLi8nO1xyXG5pbXBvcnQgeyBvcGNvZGVzIH0gZnJvbSAnLi4vLi4vJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVjayhzY3JpcHQ6IEJ1ZmZlciB8IEFycmF5PG51bWJlciB8IEJ1ZmZlcj4pOiBib29sZWFuIHtcclxuICBjb25zdCBidWZmZXIgPSBic2NyaXB0LmNvbXBpbGUoc2NyaXB0KTtcclxuXHJcbiAgcmV0dXJuIGJ1ZmZlci5sZW5ndGggPT09IDM0ICYmIGJ1ZmZlclswXSA9PT0gb3Bjb2Rlcy5PUF8xICYmIGJ1ZmZlclsxXSA9PT0gMHgyMDtcclxufVxyXG5jaGVjay50b0pTT04gPSAoKTogc3RyaW5nID0+IHtcclxuICByZXR1cm4gJ1RhcHJvb3Qgb3V0cHV0JztcclxufTtcclxuIl19