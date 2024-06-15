"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromBase58Check = exports.toBase58Check = exports.toOutputScript = exports.fromOutputScript = exports.payments = void 0;
var groestlcoinjs_lib_1 = require("groestlcoinjs-lib");
Object.defineProperty(exports, "payments", { enumerable: true, get: function () { return groestlcoinjs_lib_1.payments; } });
var address_1 = require("groestlcoinjs-lib/src/address");
Object.defineProperty(exports, "fromOutputScript", { enumerable: true, get: function () { return address_1.fromOutputScript; } });
Object.defineProperty(exports, "toOutputScript", { enumerable: true, get: function () { return address_1.toOutputScript; } });
Object.defineProperty(exports, "toBase58Check", { enumerable: true, get: function () { return address_1.toBase58GrsCheck; } });
Object.defineProperty(exports, "fromBase58Check", { enumerable: true, get: function () { return address_1.fromBase58GrsCheck; } });
__exportStar(require("./GrsTransaction"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYml0Z28vZ3JvZXN0bGNvaW4vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBNkM7QUFBcEMsNkdBQUEsUUFBUSxPQUFBO0FBQ2pCLHlEQUt1QztBQUpyQywyR0FBQSxnQkFBZ0IsT0FBQTtBQUNoQix5R0FBQSxjQUFjLE9BQUE7QUFDZCx3R0FBQSxnQkFBZ0IsT0FBaUI7QUFDakMsMEdBQUEsa0JBQWtCLE9BQW1CO0FBRXZDLG1EQUFpQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IHBheW1lbnRzIH0gZnJvbSAnZ3JvZXN0bGNvaW5qcy1saWInO1xyXG5leHBvcnQge1xyXG4gIGZyb21PdXRwdXRTY3JpcHQsXHJcbiAgdG9PdXRwdXRTY3JpcHQsXHJcbiAgdG9CYXNlNThHcnNDaGVjayBhcyB0b0Jhc2U1OENoZWNrLFxyXG4gIGZyb21CYXNlNThHcnNDaGVjayBhcyBmcm9tQmFzZTU4Q2hlY2ssXHJcbn0gZnJvbSAnZ3JvZXN0bGNvaW5qcy1saWIvc3JjL2FkZHJlc3MnO1xyXG5leHBvcnQgKiBmcm9tICcuL0dyc1RyYW5zYWN0aW9uJztcclxuIl19