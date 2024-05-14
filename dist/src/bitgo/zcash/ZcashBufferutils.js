"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBufferV5 = exports.toBufferV4 = exports.writeOutputs = exports.writeInputs = exports.fromBufferV5 = exports.fromBufferV4 = exports.writeEmptySamplingBundle = exports.readEmptySaplingBundle = exports.writeEmptyOrchardBundle = exports.readEmptyOrchardBundle = exports.readEmptyVector = exports.readOutputs = exports.readInputs = exports.VALUE_INT64_ZERO = void 0;
const ZcashTransaction_1 = require("./ZcashTransaction");
exports.VALUE_INT64_ZERO = Buffer.from('0000000000000000', 'hex');
function readInputs(bufferReader) {
    const vinLen = bufferReader.readVarInt();
    const ins = [];
    for (let i = 0; i < vinLen; ++i) {
        ins.push({
            hash: bufferReader.readSlice(32),
            index: bufferReader.readUInt32(),
            script: bufferReader.readVarSlice(),
            sequence: bufferReader.readUInt32(),
            witness: [],
        });
    }
    return ins;
}
exports.readInputs = readInputs;
function readOutputs(bufferReader, amountType = 'number') {
    const voutLen = bufferReader.readVarInt();
    const outs = [];
    for (let i = 0; i < voutLen; ++i) {
        outs.push({
            value: (amountType === 'bigint' ? bufferReader.readUInt64BigInt() : bufferReader.readUInt64()),
            script: bufferReader.readVarSlice(),
        });
    }
    return outs;
}
exports.readOutputs = readOutputs;
function readEmptyVector(bufferReader) {
    const n = bufferReader.readVarInt();
    if (n !== 0) {
        throw new ZcashTransaction_1.UnsupportedTransactionError(`expected empty vector`);
    }
}
exports.readEmptyVector = readEmptyVector;
function readEmptyOrchardBundle(bufferReader) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/orchard.h#L66
    // https://github.com/zcash/librustzcash/blob/edcde252de221d4851f1e5145306c2caf95453bc/zcash_primitives/src/transaction/components/orchard.rs#L36
    const v = bufferReader.readUInt8();
    if (v !== 0x00) {
        throw new ZcashTransaction_1.UnsupportedTransactionError(`expected byte 0x00`);
    }
}
exports.readEmptyOrchardBundle = readEmptyOrchardBundle;
function writeEmptyOrchardBundle(bufferWriter) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/orchard.h#L66
    // https://github.com/zcash/librustzcash/blob/edcde252de221d4851f1e5145306c2caf95453bc/zcash_primitives/src/transaction/components/orchard.rs#L201
    bufferWriter.writeUInt8(0);
}
exports.writeEmptyOrchardBundle = writeEmptyOrchardBundle;
function readEmptySaplingBundle(bufferReader) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L283
    readEmptyVector(bufferReader) /* vSpendsSapling */;
    readEmptyVector(bufferReader) /* vOutputsSapling */;
}
exports.readEmptySaplingBundle = readEmptySaplingBundle;
function writeEmptySamplingBundle(bufferWriter) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L283
    bufferWriter.writeVarInt(0) /* vSpendsSapling */;
    bufferWriter.writeVarInt(0) /* vOutputsSapling */;
}
exports.writeEmptySamplingBundle = writeEmptySamplingBundle;
function fromBufferV4(bufferReader, tx, amountType = 'number') {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L855-L857
    tx.ins = readInputs(bufferReader);
    tx.outs = readOutputs(bufferReader, amountType);
    tx.locktime = bufferReader.readUInt32();
    if (tx.isOverwinterCompatible()) {
        tx.expiryHeight = bufferReader.readUInt32();
    }
    if (tx.isSaplingCompatible()) {
        const valueBalance = bufferReader.readSlice(8);
        if (!valueBalance.equals(exports.VALUE_INT64_ZERO)) {
            /* istanbul ignore next */
            throw new ZcashTransaction_1.UnsupportedTransactionError(`valueBalance must be zero`);
        }
        // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L863
        readEmptySaplingBundle(bufferReader);
    }
    if (tx.supportsJoinSplits()) {
        // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L869
        readEmptyVector(bufferReader) /* vJoinSplit */;
    }
}
exports.fromBufferV4 = fromBufferV4;
function fromBufferV5(bufferReader, tx, amountType = 'number') {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L815
    tx.consensusBranchId = bufferReader.readUInt32();
    tx.locktime = bufferReader.readUInt32();
    tx.expiryHeight = bufferReader.readUInt32();
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L828
    tx.ins = readInputs(bufferReader);
    tx.outs = readOutputs(bufferReader, amountType);
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L835
    readEmptySaplingBundle(bufferReader);
    readEmptyOrchardBundle(bufferReader);
}
exports.fromBufferV5 = fromBufferV5;
function writeInputs(bufferWriter, ins) {
    bufferWriter.writeVarInt(ins.length);
    ins.forEach(function (txIn) {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
        bufferWriter.writeVarSlice(txIn.script);
        bufferWriter.writeUInt32(txIn.sequence);
    });
}
exports.writeInputs = writeInputs;
function writeOutputs(bufferWriter, outs) {
    bufferWriter.writeVarInt(outs.length);
    outs.forEach(function (txOut) {
        if (txOut.valueBuffer) {
            bufferWriter.writeSlice(txOut.valueBuffer);
        }
        else {
            bufferWriter.writeUInt64(txOut.value);
        }
        bufferWriter.writeVarSlice(txOut.script);
    });
}
exports.writeOutputs = writeOutputs;
function toBufferV4(bufferWriter, tx) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L1083
    writeInputs(bufferWriter, tx.ins);
    writeOutputs(bufferWriter, tx.outs);
    bufferWriter.writeUInt32(tx.locktime);
    if (tx.isOverwinterCompatible()) {
        bufferWriter.writeUInt32(tx.expiryHeight);
    }
    if (tx.isSaplingCompatible()) {
        bufferWriter.writeSlice(exports.VALUE_INT64_ZERO);
        bufferWriter.writeVarInt(0); // vShieldedSpendLength
        bufferWriter.writeVarInt(0); // vShieldedOutputLength
    }
    if (tx.supportsJoinSplits()) {
        bufferWriter.writeVarInt(0); // joinsSplits length
    }
}
exports.toBufferV4 = toBufferV4;
function toBufferV5(bufferWriter, tx) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L825-L826
    bufferWriter.writeUInt32(tx.consensusBranchId);
    bufferWriter.writeUInt32(tx.locktime);
    bufferWriter.writeUInt32(tx.expiryHeight);
    writeInputs(bufferWriter, tx.ins);
    writeOutputs(bufferWriter, tx.outs);
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L1063
    writeEmptySamplingBundle(bufferWriter);
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L1081
    writeEmptyOrchardBundle(bufferWriter);
}
exports.toBufferV5 = toBufferV5;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWmNhc2hCdWZmZXJ1dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby96Y2FzaC9aY2FzaEJ1ZmZlcnV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVVBLHlEQUFtRjtBQUV0RSxRQUFBLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFdkUsU0FBZ0IsVUFBVSxDQUFDLFlBQTBCO0lBQ25ELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUN6QyxNQUFNLEdBQUcsR0FBYyxFQUFFLENBQUM7SUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUMvQixHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsSUFBSSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ2hDLEtBQUssRUFBRSxZQUFZLENBQUMsVUFBVSxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxZQUFZLENBQUMsWUFBWSxFQUFFO1lBQ25DLFFBQVEsRUFBRSxZQUFZLENBQUMsVUFBVSxFQUFFO1lBQ25DLE9BQU8sRUFBRSxFQUFFO1NBQ1osQ0FBQyxDQUFDO0tBQ0o7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFiRCxnQ0FhQztBQUVELFNBQWdCLFdBQVcsQ0FDekIsWUFBMEIsRUFDMUIsYUFBa0MsUUFBUTtJQUUxQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDMUMsTUFBTSxJQUFJLEdBQXdCLEVBQUUsQ0FBQztJQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDUixLQUFLLEVBQUUs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QUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQy9DLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLFlBQVksQ0FBVSxZQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTdDLGdGQUFnRjtJQUNoRix3QkFBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN2QyxnRkFBZ0Y7SUFDaEYsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQWZELGdDQWVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRyYW5zYWN0aW9uIChkZSlzZXJpYWxpemF0aW9uIGhlbHBlcnMuXHJcbiAqIE9ubHkgc3VwcG9ydHMgZnVsbCB0cmFuc3BhcmVudCB0cmFuc2FjdGlvbnMgd2l0aG91dCBzaGllbGRlZCBpbnB1dHMgb3Igb3V0cHV0cy5cclxuICpcclxuICogUmVmZXJlbmNlczpcclxuICogLSBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMNzcxXHJcbiAqL1xyXG5pbXBvcnQgeyBUeElucHV0LCBUeE91dHB1dCB9IGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgeyBCdWZmZXJSZWFkZXIsIEJ1ZmZlcldyaXRlciB9IGZyb20gJ2JpdGNvaW5qcy1saWIvc3JjL2J1ZmZlcnV0aWxzJztcclxuXHJcbmltcG9ydCB7IFVuc3VwcG9ydGVkVHJhbnNhY3Rpb25FcnJvciwgWmNhc2hUcmFuc2FjdGlvbiB9IGZyb20gJy4vWmNhc2hUcmFuc2FjdGlvbic7XHJcblxyXG5leHBvcnQgY29uc3QgVkFMVUVfSU5UNjRfWkVSTyA9IEJ1ZmZlci5mcm9tKCcwMDAwMDAwMDAwMDAwMDAwJywgJ2hleCcpO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRJbnB1dHMoYnVmZmVyUmVhZGVyOiBCdWZmZXJSZWFkZXIpOiBUeElucHV0W10ge1xyXG4gIGNvbnN0IHZpbkxlbiA9IGJ1ZmZlclJlYWRlci5yZWFkVmFySW50KCk7XHJcbiAgY29uc3QgaW5zOiBUeElucHV0W10gPSBbXTtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHZpbkxlbjsgKytpKSB7XHJcbiAgICBpbnMucHVzaCh7XHJcbiAgICAgIGhhc2g6IGJ1ZmZlclJlYWRlci5yZWFkU2xpY2UoMzIpLFxyXG4gICAgICBpbmRleDogYnVmZmVyUmVhZGVyLnJlYWRVSW50MzIoKSxcclxuICAgICAgc2NyaXB0OiBidWZmZXJSZWFkZXIucmVhZFZhclNsaWNlKCksXHJcbiAgICAgIHNlcXVlbmNlOiBidWZmZXJSZWFkZXIucmVhZFVJbnQzMigpLFxyXG4gICAgICB3aXRuZXNzOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gaW5zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZE91dHB1dHM8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgYnVmZmVyUmVhZGVyOiBCdWZmZXJSZWFkZXIsXHJcbiAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInXHJcbik6IFR4T3V0cHV0PFROdW1iZXI+W10ge1xyXG4gIGNvbnN0IHZvdXRMZW4gPSBidWZmZXJSZWFkZXIucmVhZFZhckludCgpO1xyXG4gIGNvbnN0IG91dHM6IFR4T3V0cHV0PFROdW1iZXI+W10gPSBbXTtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHZvdXRMZW47ICsraSkge1xyXG4gICAgb3V0cy5wdXNoKHtcclxuICAgICAgdmFsdWU6IChhbW91bnRUeXBlID09PSAnYmlnaW50JyA/IGJ1ZmZlclJlYWRlci5yZWFkVUludDY0QmlnSW50KCkgOiBidWZmZXJSZWFkZXIucmVhZFVJbnQ2NCgpKSBhcyBUTnVtYmVyLFxyXG4gICAgICBzY3JpcHQ6IGJ1ZmZlclJlYWRlci5yZWFkVmFyU2xpY2UoKSxcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gb3V0cztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRFbXB0eVZlY3RvcihidWZmZXJSZWFkZXI6IEJ1ZmZlclJlYWRlcik6IHZvaWQge1xyXG4gIGNvbnN0IG4gPSBidWZmZXJSZWFkZXIucmVhZFZhckludCgpO1xyXG4gIGlmIChuICE9PSAwKSB7XHJcbiAgICB0aHJvdyBuZXcgVW5zdXBwb3J0ZWRUcmFuc2FjdGlvbkVycm9yKGBleHBlY3RlZCBlbXB0eSB2ZWN0b3JgKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkRW1wdHlPcmNoYXJkQnVuZGxlKGJ1ZmZlclJlYWRlcjogQnVmZmVyUmVhZGVyKTogdm9pZCB7XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNS4xL3NyYy9wcmltaXRpdmVzL29yY2hhcmQuaCNMNjZcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvbGlicnVzdHpjYXNoL2Jsb2IvZWRjZGUyNTJkZTIyMWQ0ODUxZjFlNTE0NTMwNmMyY2FmOTU0NTNiYy96Y2FzaF9wcmltaXRpdmVzL3NyYy90cmFuc2FjdGlvbi9jb21wb25lbnRzL29yY2hhcmQucnMjTDM2XHJcbiAgY29uc3QgdiA9IGJ1ZmZlclJlYWRlci5yZWFkVUludDgoKTtcclxuICBpZiAodiAhPT0gMHgwMCkge1xyXG4gICAgdGhyb3cgbmV3IFVuc3VwcG9ydGVkVHJhbnNhY3Rpb25FcnJvcihgZXhwZWN0ZWQgYnl0ZSAweDAwYCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVFbXB0eU9yY2hhcmRCdW5kbGUoYnVmZmVyV3JpdGVyOiBCdWZmZXJXcml0ZXIpOiB2b2lkIHtcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvb3JjaGFyZC5oI0w2NlxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC9saWJydXN0emNhc2gvYmxvYi9lZGNkZTI1MmRlMjIxZDQ4NTFmMWU1MTQ1MzA2YzJjYWY5NTQ1M2JjL3pjYXNoX3ByaW1pdGl2ZXMvc3JjL3RyYW5zYWN0aW9uL2NvbXBvbmVudHMvb3JjaGFyZC5ycyNMMjAxXHJcbiAgYnVmZmVyV3JpdGVyLndyaXRlVUludDgoMCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkRW1wdHlTYXBsaW5nQnVuZGxlKGJ1ZmZlclJlYWRlcjogQnVmZmVyUmVhZGVyKTogdm9pZCB7XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNS4xL3NyYy9wcmltaXRpdmVzL3RyYW5zYWN0aW9uLmgjTDI4M1xyXG4gIHJlYWRFbXB0eVZlY3RvcihidWZmZXJSZWFkZXIpIC8qIHZTcGVuZHNTYXBsaW5nICovO1xyXG4gIHJlYWRFbXB0eVZlY3RvcihidWZmZXJSZWFkZXIpIC8qIHZPdXRwdXRzU2FwbGluZyAqLztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRW1wdHlTYW1wbGluZ0J1bmRsZShidWZmZXJXcml0ZXI6IEJ1ZmZlcldyaXRlcik6IHZvaWQge1xyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0wyODNcclxuICBidWZmZXJXcml0ZXIud3JpdGVWYXJJbnQoMCkgLyogdlNwZW5kc1NhcGxpbmcgKi87XHJcbiAgYnVmZmVyV3JpdGVyLndyaXRlVmFySW50KDApIC8qIHZPdXRwdXRzU2FwbGluZyAqLztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21CdWZmZXJWNDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICBidWZmZXJSZWFkZXI6IEJ1ZmZlclJlYWRlcixcclxuICB0eDogWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICBhbW91bnRUeXBlOiAnbnVtYmVyJyB8ICdiaWdpbnQnID0gJ251bWJlcidcclxuKTogdm9pZCB7XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNS4xL3NyYy9wcmltaXRpdmVzL3RyYW5zYWN0aW9uLmgjTDg1NS1MODU3XHJcbiAgdHguaW5zID0gcmVhZElucHV0cyhidWZmZXJSZWFkZXIpO1xyXG4gIHR4Lm91dHMgPSByZWFkT3V0cHV0czxUTnVtYmVyPihidWZmZXJSZWFkZXIsIGFtb3VudFR5cGUpO1xyXG4gIHR4LmxvY2t0aW1lID0gYnVmZmVyUmVhZGVyLnJlYWRVSW50MzIoKTtcclxuXHJcbiAgaWYgKHR4LmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgdHguZXhwaXJ5SGVpZ2h0ID0gYnVmZmVyUmVhZGVyLnJlYWRVSW50MzIoKTtcclxuICB9XHJcblxyXG4gIGlmICh0eC5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcclxuICAgIGNvbnN0IHZhbHVlQmFsYW5jZSA9IGJ1ZmZlclJlYWRlci5yZWFkU2xpY2UoOCk7XHJcbiAgICBpZiAoIXZhbHVlQmFsYW5jZS5lcXVhbHMoVkFMVUVfSU5UNjRfWkVSTykpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IFVuc3VwcG9ydGVkVHJhbnNhY3Rpb25FcnJvcihgdmFsdWVCYWxhbmNlIG11c3QgYmUgemVyb2ApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w4NjNcclxuICAgIHJlYWRFbXB0eVNhcGxpbmdCdW5kbGUoYnVmZmVyUmVhZGVyKTtcclxuICB9XHJcblxyXG4gIGlmICh0eC5zdXBwb3J0c0pvaW5TcGxpdHMoKSkge1xyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvdjQuNS4xL3NyYy9wcmltaXRpdmVzL3RyYW5zYWN0aW9uLmgjTDg2OVxyXG4gICAgcmVhZEVtcHR5VmVjdG9yKGJ1ZmZlclJlYWRlcikgLyogdkpvaW5TcGxpdCAqLztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tQnVmZmVyVjU8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgYnVmZmVyUmVhZGVyOiBCdWZmZXJSZWFkZXIsXHJcbiAgdHg6IFpjYXNoVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JyA9ICdudW1iZXInXHJcbik6IHZvaWQge1xyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w4MTVcclxuICB0eC5jb25zZW5zdXNCcmFuY2hJZCA9IGJ1ZmZlclJlYWRlci5yZWFkVUludDMyKCk7XHJcbiAgdHgubG9ja3RpbWUgPSBidWZmZXJSZWFkZXIucmVhZFVJbnQzMigpO1xyXG4gIHR4LmV4cGlyeUhlaWdodCA9IGJ1ZmZlclJlYWRlci5yZWFkVUludDMyKCk7XHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w4MjhcclxuICB0eC5pbnMgPSByZWFkSW5wdXRzKGJ1ZmZlclJlYWRlcik7XHJcbiAgdHgub3V0cyA9IHJlYWRPdXRwdXRzPFROdW1iZXI+KGJ1ZmZlclJlYWRlciwgYW1vdW50VHlwZSk7XHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0w4MzVcclxuICByZWFkRW1wdHlTYXBsaW5nQnVuZGxlKGJ1ZmZlclJlYWRlcik7XHJcbiAgcmVhZEVtcHR5T3JjaGFyZEJ1bmRsZShidWZmZXJSZWFkZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVJbnB1dHMoYnVmZmVyV3JpdGVyOiBCdWZmZXJXcml0ZXIsIGluczogVHhJbnB1dFtdKTogdm9pZCB7XHJcbiAgYnVmZmVyV3JpdGVyLndyaXRlVmFySW50KGlucy5sZW5ndGgpO1xyXG4gIGlucy5mb3JFYWNoKGZ1bmN0aW9uICh0eEluKSB7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZSh0eEluLmhhc2gpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4SW4uaW5kZXgpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVmFyU2xpY2UodHhJbi5zY3JpcHQpO1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4SW4uc2VxdWVuY2UpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVPdXRwdXRzPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIGJ1ZmZlcldyaXRlcjogQnVmZmVyV3JpdGVyLFxyXG4gIG91dHM6IFR4T3V0cHV0PFROdW1iZXI+W11cclxuKTogdm9pZCB7XHJcbiAgYnVmZmVyV3JpdGVyLndyaXRlVmFySW50KG91dHMubGVuZ3RoKTtcclxuICBvdXRzLmZvckVhY2goZnVuY3Rpb24gKHR4T3V0KSB7XHJcbiAgICBpZiAoKHR4T3V0IGFzIGFueSkudmFsdWVCdWZmZXIpIHtcclxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoKHR4T3V0IGFzIGFueSkudmFsdWVCdWZmZXIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDY0KHR4T3V0LnZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJTbGljZSh0eE91dC5zY3JpcHQpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9CdWZmZXJWNDxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICBidWZmZXJXcml0ZXI6IEJ1ZmZlcldyaXRlcixcclxuICB0eDogWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPlxyXG4pOiB2b2lkIHtcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMMTA4M1xyXG4gIHdyaXRlSW5wdXRzKGJ1ZmZlcldyaXRlciwgdHguaW5zKTtcclxuICB3cml0ZU91dHB1dHM8VE51bWJlcj4oYnVmZmVyV3JpdGVyLCB0eC5vdXRzKTtcclxuXHJcbiAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4LmxvY2t0aW1lKTtcclxuXHJcbiAgaWYgKHR4LmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xyXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4LmV4cGlyeUhlaWdodCk7XHJcbiAgfVxyXG5cclxuICBpZiAodHguaXNTYXBsaW5nQ29tcGF0aWJsZSgpKSB7XHJcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShWQUxVRV9JTlQ2NF9aRVJPKTtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVZhckludCgwKTsgLy8gdlNoaWVsZGVkU3BlbmRMZW5ndGhcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVZhckludCgwKTsgLy8gdlNoaWVsZGVkT3V0cHV0TGVuZ3RoXHJcbiAgfVxyXG5cclxuICBpZiAodHguc3VwcG9ydHNKb2luU3BsaXRzKCkpIHtcclxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVZhckludCgwKTsgLy8gam9pbnNTcGxpdHMgbGVuZ3RoXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9CdWZmZXJWNTxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICBidWZmZXJXcml0ZXI6IEJ1ZmZlcldyaXRlcixcclxuICB0eDogWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPlxyXG4pOiB2b2lkIHtcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMODI1LUw4MjZcclxuICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodHguY29uc2Vuc3VzQnJhbmNoSWQpO1xyXG4gIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0eC5sb2NrdGltZSk7XHJcbiAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4LmV4cGlyeUhlaWdodCk7XHJcbiAgd3JpdGVJbnB1dHMoYnVmZmVyV3JpdGVyLCB0eC5pbnMpO1xyXG4gIHdyaXRlT3V0cHV0czxUTnVtYmVyPihidWZmZXJXcml0ZXIsIHR4Lm91dHMpO1xyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi92NC41LjEvc3JjL3ByaW1pdGl2ZXMvdHJhbnNhY3Rpb24uaCNMMTA2M1xyXG4gIHdyaXRlRW1wdHlTYW1wbGluZ0J1bmRsZShidWZmZXJXcml0ZXIpO1xyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL3Y0LjUuMS9zcmMvcHJpbWl0aXZlcy90cmFuc2FjdGlvbi5oI0wxMDgxXHJcbiAgd3JpdGVFbXB0eU9yY2hhcmRCdW5kbGUoYnVmZmVyV3JpdGVyKTtcclxufVxyXG4iXX0=