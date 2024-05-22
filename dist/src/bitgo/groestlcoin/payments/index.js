"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazy = exports.p2wsh = exports.p2wpkh = exports.p2tr_ns = exports.p2tr = exports.p2sh = exports.p2pkh = exports.p2pk = exports.p2ms = exports.embed = void 0;
const embed_1 = require("bitcoinjs-lib/src/payments/embed");
Object.defineProperty(exports, "embed", { enumerable: true, get: function () { return embed_1.p2data; } });
const p2ms_1 = require("bitcoinjs-lib/src/payments/p2ms");
Object.defineProperty(exports, "p2ms", { enumerable: true, get: function () { return p2ms_1.p2ms; } });
const p2pk_1 = require("bitcoinjs-lib/src/payments/p2pk");
Object.defineProperty(exports, "p2pk", { enumerable: true, get: function () { return p2pk_1.p2pk; } });
const p2pkh_1 = require("./p2pkh");
Object.defineProperty(exports, "p2pkh", { enumerable: true, get: function () { return p2pkh_1.p2pkh; } });
const p2sh_1 = require("./p2sh");
Object.defineProperty(exports, "p2sh", { enumerable: true, get: function () { return p2sh_1.p2sh; } });
const p2tr_1 = require("bitcoinjs-lib/src/payments/p2tr");
Object.defineProperty(exports, "p2tr", { enumerable: true, get: function () { return p2tr_1.p2tr; } });
const p2tr_ns_1 = require("bitcoinjs-lib/src/payments/p2tr_ns");
Object.defineProperty(exports, "p2tr_ns", { enumerable: true, get: function () { return p2tr_ns_1.p2tr_ns; } });
const p2wpkh_1 = require("bitcoinjs-lib/src/payments/p2wpkh");
Object.defineProperty(exports, "p2wpkh", { enumerable: true, get: function () { return p2wpkh_1.p2wpkh; } });
const p2wsh_1 = require("bitcoinjs-lib/src/payments/p2wsh");
Object.defineProperty(exports, "p2wsh", { enumerable: true, get: function () { return p2wsh_1.p2wsh; } });
const lazy = require("bitcoinjs-lib/src/payments/lazy");
exports.lazy = lazy;
// TODO
// witness commitment
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYml0Z28vZ3JvZXN0bGNvaW4vcGF5bWVudHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsNERBQW1FO0FBb0QxRCxzRkFwRFUsY0FBSyxPQW9EVjtBQW5EZCwwREFBdUQ7QUFtRHZDLHFGQW5EUCxXQUFJLE9BbURPO0FBbERwQiwwREFBdUQ7QUFrRGpDLHFGQWxEYixXQUFJLE9Ba0RhO0FBakQxQixtQ0FBZ0M7QUFpREosc0ZBakRuQixhQUFLLE9BaURtQjtBQWhEakMsaUNBQThCO0FBZ0RLLHFGQWhEMUIsV0FBSSxPQWdEMEI7QUEvQ3ZDLDBEQUF1RDtBQStDZCxxRkEvQ2hDLFdBQUksT0ErQ2dDO0FBOUM3QyxnRUFBNkQ7QUE4Q2Qsd0ZBOUN0QyxpQkFBTyxPQThDc0M7QUE3Q3RELDhEQUEyRDtBQTZDSCx1RkE3Qy9DLGVBQU0sT0E2QytDO0FBNUM5RCw0REFBeUQ7QUE0Q08sc0ZBNUN2RCxhQUFLLE9BNEN1RDtBQTNDckUsd0RBQXdEO0FBMkNlLG9CQUFJO0FBRTNFLE9BQU87QUFDUCxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXR3b3JrIH0gZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvbmV0d29ya3MnO1xuaW1wb3J0IHsgVGFwVHJlZSB9IGZyb20gJ2JpcDE3NC9zcmMvbGliL2ludGVyZmFjZXMnO1xuaW1wb3J0IHsgVGlueVNlY3AyNTZrMUludGVyZmFjZSB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3R5cGVzJztcbmltcG9ydCB7IHAyZGF0YSBhcyBlbWJlZCB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3BheW1lbnRzL2VtYmVkJztcbmltcG9ydCB7IHAybXMgfSBmcm9tICdiaXRjb2luanMtbGliL3NyYy9wYXltZW50cy9wMm1zJztcbmltcG9ydCB7IHAycGsgfSBmcm9tICdiaXRjb2luanMtbGliL3NyYy9wYXltZW50cy9wMnBrJztcbmltcG9ydCB7IHAycGtoIH0gZnJvbSAnLi9wMnBraCc7XG5pbXBvcnQgeyBwMnNoIH0gZnJvbSAnLi9wMnNoJztcbmltcG9ydCB7IHAydHIgfSBmcm9tICdiaXRjb2luanMtbGliL3NyYy9wYXltZW50cy9wMnRyJztcbmltcG9ydCB7IHAydHJfbnMgfSBmcm9tICdiaXRjb2luanMtbGliL3NyYy9wYXltZW50cy9wMnRyX25zJztcbmltcG9ydCB7IHAyd3BraCB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3BheW1lbnRzL3Ayd3BraCc7XG5pbXBvcnQgeyBwMndzaCB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL3BheW1lbnRzL3Ayd3NoJztcbmltcG9ydCAqIGFzIGxhenkgZnJvbSAnYml0Y29pbmpzLWxpYi9zcmMvcGF5bWVudHMvbGF6eSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGF5bWVudCB7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIG5ldHdvcms/OiBOZXR3b3JrO1xuICBvdXRwdXQ/OiBCdWZmZXI7XG4gIGRhdGE/OiBCdWZmZXJbXTtcbiAgbT86IG51bWJlcjtcbiAgbj86IG51bWJlcjtcbiAgcHVia2V5cz86IEJ1ZmZlcltdO1xuICBpbnB1dD86IEJ1ZmZlcjtcbiAgc2lnbmF0dXJlcz86IEJ1ZmZlcltdO1xuICBwdWJrZXk/OiBCdWZmZXI7XG4gIHRhcHRyZWVSb290PzogQnVmZmVyO1xuICBpbnRlcm5hbFB1YmtleT86IEJ1ZmZlcjtcbiAgc2lnbmF0dXJlPzogQnVmZmVyO1xuICBhZGRyZXNzPzogc3RyaW5nO1xuICBoYXNoPzogQnVmZmVyO1xuICByZWRlZW0/OiBQYXltZW50O1xuICByZWRlZW1zPzogUGF5bWVudFtdO1xuICByZWRlZW1JbmRleD86IG51bWJlcjtcbiAgd2l0bmVzcz86IEJ1ZmZlcltdO1xuICB3ZWlnaHQ/OiBudW1iZXI7XG4gIGRlcHRoPzogbnVtYmVyO1xuICBjb250cm9sQmxvY2s/OiBCdWZmZXI7XG4gIHRhcFRyZWU/OiBUYXBUcmVlO1xuICBhbm5leD86IEJ1ZmZlcjtcbn1cblxuZXhwb3J0IHR5cGUgUGF5bWVudENyZWF0b3IgPSAoYTogUGF5bWVudCwgb3B0cz86IFBheW1lbnRPcHRzKSA9PiBQYXltZW50O1xuXG5leHBvcnQgdHlwZSBQYXltZW50RnVuY3Rpb24gPSAoKSA9PiBQYXltZW50O1xuXG5leHBvcnQgaW50ZXJmYWNlIFBheW1lbnRPcHRzIHtcbiAgdmFsaWRhdGU/OiBib29sZWFuO1xuICBhbGxvd0luY29tcGxldGU/OiBib29sZWFuO1xuICBlY2NMaWI/OiBUaW55U2VjcDI1NmsxSW50ZXJmYWNlO1xufVxuXG5leHBvcnQgdHlwZSBTdGFja0VsZW1lbnQgPSBCdWZmZXIgfCBudW1iZXI7XG5leHBvcnQgdHlwZSBTdGFjayA9IFN0YWNrRWxlbWVudFtdO1xuZXhwb3J0IHR5cGUgU3RhY2tGdW5jdGlvbiA9ICgpID0+IFN0YWNrO1xuXG5leHBvcnQgeyBlbWJlZCwgcDJtcywgcDJwaywgcDJwa2gsIHAyc2gsIHAydHIsIHAydHJfbnMsIHAyd3BraCwgcDJ3c2gsIGxhenkgfTtcblxuLy8gVE9ET1xuLy8gd2l0bmVzcyBjb21taXRtZW50XG4iXX0=