"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletAddress = exports.getWalletOutputScripts = void 0;
const __1 = require("../..");
const __2 = require("..");
const outputScripts_1 = require("../outputScripts");
function getWalletOutputScripts(keys, chain, index) {
    return __2.outputScripts.createOutputScript2of3(keys.deriveForChainAndIndex(chain, index).publicKeys, (0, outputScripts_1.scriptTypeForChain)(chain));
}
exports.getWalletOutputScripts = getWalletOutputScripts;
function getWalletAddress(keys, chain, index, network) {
    return __1.address.fromOutputScript(getWalletOutputScripts(keys, chain, index).scriptPubKey, network);
}
exports.getWalletAddress = getWalletAddress;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2FsbGV0U2NyaXB0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby93YWxsZXQvV2FsbGV0U2NyaXB0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBeUM7QUFDekMsMEJBQThDO0FBRTlDLG9EQUF1RTtBQUV2RSxTQUFnQixzQkFBc0IsQ0FBQyxJQUFvQixFQUFFLEtBQWdCLEVBQUUsS0FBYTtJQUMxRixPQUFPLGlCQUFhLENBQUMsc0JBQXNCLENBQ3pDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsVUFBVSxFQUNwRCxJQUFBLGtDQUFrQixFQUFDLEtBQUssQ0FBQyxDQUMxQixDQUFDO0FBQ0osQ0FBQztBQUxELHdEQUtDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBb0IsRUFBRSxLQUFnQixFQUFFLEtBQWEsRUFBRSxPQUFnQjtJQUN0RyxPQUFPLFdBQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNwRyxDQUFDO0FBRkQsNENBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXR3b3JrLCBhZGRyZXNzIH0gZnJvbSAnLi4vLi4nO1xyXG5pbXBvcnQgeyBDaGFpbkNvZGUsIG91dHB1dFNjcmlwdHMgfSBmcm9tICcuLic7XHJcbmltcG9ydCB7IFJvb3RXYWxsZXRLZXlzIH0gZnJvbSAnLi9XYWxsZXRLZXlzJztcclxuaW1wb3J0IHsgc2NyaXB0VHlwZUZvckNoYWluLCBTcGVuZGFibGVTY3JpcHQgfSBmcm9tICcuLi9vdXRwdXRTY3JpcHRzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRXYWxsZXRPdXRwdXRTY3JpcHRzKGtleXM6IFJvb3RXYWxsZXRLZXlzLCBjaGFpbjogQ2hhaW5Db2RlLCBpbmRleDogbnVtYmVyKTogU3BlbmRhYmxlU2NyaXB0IHtcclxuICByZXR1cm4gb3V0cHV0U2NyaXB0cy5jcmVhdGVPdXRwdXRTY3JpcHQyb2YzKFxyXG4gICAga2V5cy5kZXJpdmVGb3JDaGFpbkFuZEluZGV4KGNoYWluLCBpbmRleCkucHVibGljS2V5cyxcclxuICAgIHNjcmlwdFR5cGVGb3JDaGFpbihjaGFpbilcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2FsbGV0QWRkcmVzcyhrZXlzOiBSb290V2FsbGV0S2V5cywgY2hhaW46IENoYWluQ29kZSwgaW5kZXg6IG51bWJlciwgbmV0d29yazogTmV0d29yayk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGFkZHJlc3MuZnJvbU91dHB1dFNjcmlwdChnZXRXYWxsZXRPdXRwdXRTY3JpcHRzKGtleXMsIGNoYWluLCBpbmRleCkuc2NyaXB0UHViS2V5LCBuZXR3b3JrKTtcclxufVxyXG4iXX0=