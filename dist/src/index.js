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
exports.TransactionBuilder = exports.supportsSegwit = exports.supportsTaproot = exports.isTestnet = exports.isMainnet = exports.getTestnet = exports.getMainnet = exports.getNetworkName = exports.isValidNetwork = exports.getNetworkList = exports.networks = exports.p2trPayments = exports.testutil = exports.taproot = exports.classify = exports.addressFormat = exports.address = exports.bitgo = void 0;
__exportStar(require("bitcoinjs-lib"), exports);
exports.bitgo = require("./bitgo");
exports.address = require("./address");
exports.addressFormat = require("./addressFormat");
exports.classify = require("./classify");
exports.taproot = require("./taproot");
exports.testutil = require("./testutil");
__exportStar(require("./noble_ecc"), exports);
exports.p2trPayments = require("./payments");
var networks_1 = require("./networks");
Object.defineProperty(exports, "networks", { enumerable: true, get: function () { return networks_1.networks; } });
Object.defineProperty(exports, "getNetworkList", { enumerable: true, get: function () { return networks_1.getNetworkList; } });
Object.defineProperty(exports, "isValidNetwork", { enumerable: true, get: function () { return networks_1.isValidNetwork; } });
Object.defineProperty(exports, "getNetworkName", { enumerable: true, get: function () { return networks_1.getNetworkName; } });
Object.defineProperty(exports, "getMainnet", { enumerable: true, get: function () { return networks_1.getMainnet; } });
Object.defineProperty(exports, "getTestnet", { enumerable: true, get: function () { return networks_1.getTestnet; } });
Object.defineProperty(exports, "isMainnet", { enumerable: true, get: function () { return networks_1.isMainnet; } });
Object.defineProperty(exports, "isTestnet", { enumerable: true, get: function () { return networks_1.isTestnet; } });
Object.defineProperty(exports, "supportsTaproot", { enumerable: true, get: function () { return networks_1.supportsTaproot; } });
Object.defineProperty(exports, "supportsSegwit", { enumerable: true, get: function () { return networks_1.supportsSegwit; } });
var transaction_builder_1 = require("./transaction_builder");
Object.defineProperty(exports, "TransactionBuilder", { enumerable: true, get: function () { return transaction_builder_1.TransactionBuilder; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBOEI7QUFFOUIsbUNBQWlDO0FBRWpDLHVDQUFxQztBQUVyQyxtREFBaUQ7QUFFakQseUNBQXVDO0FBRXZDLHVDQUFxQztBQUVyQyx5Q0FBdUM7QUFFdkMsOENBQTRCO0FBRTVCLDZDQUEyQztBQUUzQyx1Q0Fhb0I7QUFabEIsb0dBQUEsUUFBUSxPQUFBO0FBR1IsMEdBQUEsY0FBYyxPQUFBO0FBQ2QsMEdBQUEsY0FBYyxPQUFBO0FBQ2QsMEdBQUEsY0FBYyxPQUFBO0FBQ2Qsc0dBQUEsVUFBVSxPQUFBO0FBQ1Ysc0dBQUEsVUFBVSxPQUFBO0FBQ1YscUdBQUEsU0FBUyxPQUFBO0FBQ1QscUdBQUEsU0FBUyxPQUFBO0FBQ1QsMkdBQUEsZUFBZSxPQUFBO0FBQ2YsMEdBQUEsY0FBYyxPQUFBO0FBR2hCLDZEQUEyRDtBQUFsRCx5SEFBQSxrQkFBa0IsT0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5cclxuZXhwb3J0ICogYXMgYml0Z28gZnJvbSAnLi9iaXRnbyc7XHJcblxyXG5leHBvcnQgKiBhcyBhZGRyZXNzIGZyb20gJy4vYWRkcmVzcyc7XHJcblxyXG5leHBvcnQgKiBhcyBhZGRyZXNzRm9ybWF0IGZyb20gJy4vYWRkcmVzc0Zvcm1hdCc7XHJcblxyXG5leHBvcnQgKiBhcyBjbGFzc2lmeSBmcm9tICcuL2NsYXNzaWZ5JztcclxuXHJcbmV4cG9ydCAqIGFzIHRhcHJvb3QgZnJvbSAnLi90YXByb290JztcclxuXHJcbmV4cG9ydCAqIGFzIHRlc3R1dGlsIGZyb20gJy4vdGVzdHV0aWwnO1xyXG5cclxuZXhwb3J0ICogZnJvbSAnLi9ub2JsZV9lY2MnO1xyXG5cclxuZXhwb3J0ICogYXMgcDJ0clBheW1lbnRzIGZyb20gJy4vcGF5bWVudHMnO1xyXG5cclxuZXhwb3J0IHtcclxuICBuZXR3b3JrcyxcclxuICBOZXR3b3JrLFxyXG4gIE5ldHdvcmtOYW1lLFxyXG4gIGdldE5ldHdvcmtMaXN0LFxyXG4gIGlzVmFsaWROZXR3b3JrLFxyXG4gIGdldE5ldHdvcmtOYW1lLFxyXG4gIGdldE1haW5uZXQsXHJcbiAgZ2V0VGVzdG5ldCxcclxuICBpc01haW5uZXQsXHJcbiAgaXNUZXN0bmV0LFxyXG4gIHN1cHBvcnRzVGFwcm9vdCxcclxuICBzdXBwb3J0c1NlZ3dpdCxcclxufSBmcm9tICcuL25ldHdvcmtzJztcclxuXHJcbmV4cG9ydCB7IFRyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4vdHJhbnNhY3Rpb25fYnVpbGRlcic7XHJcblxyXG5leHBvcnQgeyBOZXR3b3JrIGFzIEJpdGNvaW5KU05ldHdvcmsgfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuIl19