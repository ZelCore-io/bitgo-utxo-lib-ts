"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mocha_1 = require("mocha");
const classify = require("../src/classify");
const src_1 = require("../src/");
const fixtures = require("./fixtures/templates.json");
const multisig = require("../src/templates/multisig");
const nullData = require("../src/templates/nulldata");
const pubKey = require("../src/templates/pubkey");
const pubKeyHash = require("../src/templates/pubkeyhash");
const scriptHash = require("../src/templates/scripthash");
const taproot = require("../src/templates/taproot");
const taprootnofn = require("../src/templates/taprootnofn");
const witnessCommitment = require("../src/templates/witnesscommitment");
const witnessPubKeyHash = require("../src/templates/witnesspubkeyhash");
const witnessScriptHash = require("../src/templates/witnessscripthash");
const tmap = {
    pubKey,
    pubKeyHash,
    scriptHash,
    witnessPubKeyHash,
    witnessScriptHash,
    taproot,
    taprootnofn,
    multisig,
    nullData,
    witnessCommitment,
};
(0, mocha_1.describe)('classify', () => {
    (0, mocha_1.describe)('input', () => {
        fixtures.valid.forEach((f) => {
            if (!f.input)
                return;
            (0, mocha_1.it)('classifies ' + f.input + ' as ' + f.type, () => {
                const input = src_1.script.fromASM(f.input);
                const type = classify.input(input);
                assert.strictEqual(type, f.type);
            });
        });
        fixtures.valid.forEach((f) => {
            if (!f.input)
                return;
            if (!f.typeIncomplete)
                return;
            (0, mocha_1.it)('classifies incomplete ' + f.input + ' as ' + f.typeIncomplete, () => {
                const input = src_1.script.fromASM(f.input);
                const type = classify.input(input, true);
                assert.strictEqual(type, f.typeIncomplete);
            });
        });
    });
    (0, mocha_1.describe)('classifyOutput', () => {
        fixtures.valid.forEach((f) => {
            if (!f.output)
                return;
            (0, mocha_1.it)('classifies ' + f.output + ' as ' + f.type, () => {
                const output = src_1.script.fromASM(f.output);
                const type = classify.output(output);
                assert.strictEqual(type, f.type);
            });
        });
    });
    (0, mocha_1.describe)('classifyWitness', () => {
        fixtures.valid.forEach((f) => {
            if (!f.witnessData)
                return;
            (0, mocha_1.it)('classifies ' + f.witnessData + ' as ' + f.type, () => {
                const chunks = f.witnessData.map((chunkStr) => Buffer.from(chunkStr, 'hex'));
                if (f.witnessScript) {
                    const witnessScript = src_1.script.fromASM(f.witnessScript);
                    chunks.push(witnessScript);
                }
                const type = classify.witness(chunks);
                assert.strictEqual(type, f.type);
            });
        });
    });
    [
        'pubKey',
        'pubKeyHash',
        'scriptHash',
        'witnessPubKeyHash',
        'witnessScriptHash',
        'taproot',
        'taprootnofn',
        'multisig',
        'nullData',
        'witnessCommitment',
    ].forEach((name) => {
        const inputType = tmap[name].input;
        const outputType = tmap[name].output;
        (0, mocha_1.describe)(name + '.input.check', () => {
            fixtures.valid.forEach((f) => {
                if (name.toLowerCase() === classify.types.P2WPKH)
                    return;
                if (name.toLowerCase() === classify.types.P2WSH)
                    return;
                const expected = name.toLowerCase() === f.type.toLowerCase();
                if (inputType && f.input) {
                    const input = src_1.script.fromASM(f.input);
                    (0, mocha_1.it)('returns ' + expected + ' for ' + f.input, () => {
                        assert.strictEqual(inputType.check(input), expected);
                    });
                    if (f.typeIncomplete) {
                        const expectedIncomplete = name.toLowerCase() === f.typeIncomplete;
                        (0, mocha_1.it)('returns ' + expected + ' for ' + f.input, () => {
                            assert.strictEqual(inputType.check(input, true), expectedIncomplete);
                        });
                    }
                }
            });
            if (!fixtures.invalid[name])
                return;
            fixtures.invalid[name].inputs.forEach((f) => {
                if (!f.input && !f.inputHex)
                    return;
                (0, mocha_1.it)('returns false for ' + f.description + ' (' + (f.input || f.inputHex) + ')', () => {
                    let input;
                    if (f.input) {
                        input = src_1.script.fromASM(f.input);
                    }
                    else {
                        input = Buffer.from(f.inputHex, 'hex');
                    }
                    assert.strictEqual(inputType.check(input), false);
                });
            });
        });
        (0, mocha_1.describe)(name + '.output.check', () => {
            fixtures.valid.forEach((f) => {
                const expected = name.toLowerCase() === f.type;
                if (outputType && f.output) {
                    (0, mocha_1.it)('returns ' + expected + ' for ' + f.output, () => {
                        const output = src_1.script.fromASM(f.output);
                        if (name.toLowerCase() === 'nulldata' && f.type === classify.types.WITNESS_COMMITMENT)
                            return;
                        if (name.toLowerCase() === 'witnesscommitment' && f.type === classify.types.NULLDATA)
                            return;
                        assert.strictEqual(outputType.check(output), expected);
                    });
                }
            });
            if (!fixtures.invalid[name])
                return;
            fixtures.invalid[name].outputs.forEach((f) => {
                if (!f.output && !f.outputHex)
                    return;
                (0, mocha_1.it)('returns false for ' + f.description + ' (' + (f.output || f.outputHex) + ')', () => {
                    let output;
                    if (f.output) {
                        output = src_1.script.fromASM(f.output);
                    }
                    else {
                        output = Buffer.from(f.outputHex, 'hex');
                    }
                    assert.strictEqual(outputType.check(output), false);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NpZnkuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvY2xhc3NpZnkuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFpQztBQUNqQyxpQ0FBcUM7QUFDckMsNENBQTRDO0FBQzVDLGlDQUE0QztBQUU1QyxzREFBc0Q7QUFFdEQsc0RBQXNEO0FBQ3RELHNEQUFzRDtBQUN0RCxrREFBa0Q7QUFDbEQsMERBQTBEO0FBQzFELDBEQUEwRDtBQUMxRCxvREFBb0Q7QUFDcEQsNERBQTREO0FBQzVELHdFQUF3RTtBQUN4RSx3RUFBd0U7QUFDeEUsd0VBQXdFO0FBRXhFLE1BQU0sSUFBSSxHQUFHO0lBQ1gsTUFBTTtJQUNOLFVBQVU7SUFDVixVQUFVO0lBQ1YsaUJBQWlCO0lBQ2pCLGlCQUFpQjtJQUNqQixPQUFPO0lBQ1AsV0FBVztJQUNYLFFBQVE7SUFDUixRQUFRO0lBQ1IsaUJBQWlCO0NBQ2xCLENBQUM7QUFFRixJQUFBLGdCQUFRLEVBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixJQUFBLGdCQUFRLEVBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtRQUNyQixRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQzNCLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztnQkFBRSxPQUFPO1lBRXJCLElBQUEsVUFBRSxFQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDakQsTUFBTSxLQUFLLEdBQUcsWUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRW5DLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJ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UztvQkFBRSxPQUFPO2dCQUV0QyxJQUFBLFVBQUUsRUFBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUU7b0JBQ3JGLElBQUksTUFBTSxDQUFDO29CQUVYLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTt3QkFDWixNQUFNLEdBQUcsWUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ3BDO3lCQUFNO3dCQUNMLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7cUJBQzFDO29CQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdEQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgeyBkZXNjcmliZSwgaXQgfSBmcm9tICdtb2NoYSc7XHJcbmltcG9ydCAqIGFzIGNsYXNzaWZ5IGZyb20gJy4uL3NyYy9jbGFzc2lmeSc7XHJcbmltcG9ydCB7IHNjcmlwdCBhcyBic2NyaXB0IH0gZnJvbSAnLi4vc3JjLyc7XHJcblxyXG5pbXBvcnQgKiBhcyBmaXh0dXJlcyBmcm9tICcuL2ZpeHR1cmVzL3RlbXBsYXRlcy5qc29uJztcclxuXHJcbmltcG9ydCAqIGFzIG11bHRpc2lnIGZyb20gJy4uL3NyYy90ZW1wbGF0ZXMvbXVsdGlzaWcnO1xyXG5pbXBvcnQgKiBhcyBudWxsRGF0YSBmcm9tICcuLi9zcmMvdGVtcGxhdGVzL251bGxkYXRhJztcclxuaW1wb3J0ICogYXMgcHViS2V5IGZyb20gJy4uL3NyYy90ZW1wbGF0ZXMvcHVia2V5JztcclxuaW1wb3J0ICogYXMgcHViS2V5SGFzaCBmcm9tICcuLi9zcmMvdGVtcGxhdGVzL3B1YmtleWhhc2gnO1xyXG5pbXBvcnQgKiBhcyBzY3JpcHRIYXNoIGZyb20gJy4uL3NyYy90ZW1wbGF0ZXMvc2NyaXB0aGFzaCc7XHJcbmltcG9ydCAqIGFzIHRhcHJvb3QgZnJvbSAnLi4vc3JjL3RlbXBsYXRlcy90YXByb290JztcclxuaW1wb3J0ICogYXMgdGFwcm9vdG5vZm4gZnJvbSAnLi4vc3JjL3RlbXBsYXRlcy90YXByb290bm9mbic7XHJcbmltcG9ydCAqIGFzIHdpdG5lc3NDb21taXRtZW50IGZyb20gJy4uL3NyYy90ZW1wbGF0ZXMvd2l0bmVzc2NvbW1pdG1lbnQnO1xyXG5pbXBvcnQgKiBhcyB3aXRuZXNzUHViS2V5SGFzaCBmcm9tICcuLi9zcmMvdGVtcGxhdGVzL3dpdG5lc3NwdWJrZXloYXNoJztcclxuaW1wb3J0ICogYXMgd2l0bmVzc1NjcmlwdEhhc2ggZnJvbSAnLi4vc3JjL3RlbXBsYXRlcy93aXRuZXNzc2NyaXB0aGFzaCc7XHJcblxyXG5jb25zdCB0bWFwID0ge1xyXG4gIHB1YktleSxcclxuICBwdWJLZXlIYXNoLFxyXG4gIHNjcmlwdEhhc2gsXHJcbiAgd2l0bmVzc1B1YktleUhhc2gsXHJcbiAgd2l0bmVzc1NjcmlwdEhhc2gsXHJcbiAgdGFwcm9vdCxcclxuICB0YXByb290bm9mbixcclxuICBtdWx0aXNpZyxcclxuICBudWxsRGF0YSxcclxuICB3aXRuZXNzQ29tbWl0bWVudCxcclxufTtcclxuXHJcbmRlc2NyaWJlKCdjbGFzc2lmeScsICgpID0+IHtcclxuICBkZXNjcmliZSgnaW5wdXQnLCAoKSA9PiB7XHJcbiAgICBmaXh0dXJlcy52YWxpZC5mb3JFYWNoKChmKSA9PiB7XHJcbiAgICAgIGlmICghZi5pbnB1dCkgcmV0dXJuO1xyXG5cclxuICAgICAgaXQoJ2NsYXNzaWZpZXMgJyArIGYuaW5wdXQgKyAnIGFzICcgKyBmLnR5cGUsICgpID0+IHtcclxuICAgICAgICBjb25zdCBpbnB1dCA9IGJzY3JpcHQuZnJvbUFTTShmLmlucHV0KTtcclxuICAgICAgICBjb25zdCB0eXBlID0gY2xhc3NpZnkuaW5wdXQoaW5wdXQpO1xyXG5cclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHlwZSwgZi50eXBlKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmaXh0dXJlcy52YWxpZC5mb3JFYWNoKChmKSA9PiB7XHJcbiAgICAgIGlmICghZi5pbnB1dCkgcmV0dXJuO1xyXG4gICAgICBpZiAoIWYudHlwZUluY29tcGxldGUpIHJldHVybjtcclxuXHJcbiAgICAgIGl0KCdjbGFzc2lmaWVzIGluY29tcGxldGUgJyArIGYuaW5wdXQgKyAnIGFzICcgKyBmLnR5cGVJbmNvbXBsZXRlLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW5wdXQgPSBic2NyaXB0LmZyb21BU00oZi5pbnB1dCk7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IGNsYXNzaWZ5LmlucHV0KGlucHV0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGUsIGYudHlwZUluY29tcGxldGUpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnY2xhc3NpZnlPdXRwdXQnLCAoKSA9PiB7XHJcbiAgICBmaXh0dXJlcy52YWxpZC5mb3JFYWNoKChmKSA9PiB7XHJcbiAgICAgIGlmICghZi5vdXRwdXQpIHJldHVybjtcclxuXHJcbiAgICAgIGl0KCdjbGFzc2lmaWVzICcgKyBmLm91dHB1dCArICcgYXMgJyArIGYudHlwZSwgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGJzY3JpcHQuZnJvbUFTTShmLm91dHB1dCk7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IGNsYXNzaWZ5Lm91dHB1dChvdXRwdXQpO1xyXG5cclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHlwZSwgZi50eXBlKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ2NsYXNzaWZ5V2l0bmVzcycsICgpID0+IHtcclxuICAgIGZpeHR1cmVzLnZhbGlkLmZvckVhY2goKGYpID0+IHtcclxuICAgICAgaWYgKCFmLndpdG5lc3NEYXRhKSByZXR1cm47XHJcblxyXG4gICAgICBpdCgnY2xhc3NpZmllcyAnICsgZi53aXRuZXNzRGF0YSArICcgYXMgJyArIGYudHlwZSwgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNodW5rcyA9IGYud2l0bmVzc0RhdGEubWFwKChjaHVua1N0cikgPT4gQnVmZmVyLmZyb20oY2h1bmtTdHIsICdoZXgnKSk7XHJcbiAgICAgICAgaWYgKGYud2l0bmVzc1NjcmlwdCkge1xyXG4gICAgICAgICAgY29uc3Qgd2l0bmVzc1NjcmlwdCA9IGJzY3JpcHQuZnJvbUFTTShmLndpdG5lc3NTY3JpcHQpO1xyXG4gICAgICAgICAgY2h1bmtzLnB1c2god2l0bmVzc1NjcmlwdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBjbGFzc2lmeS53aXRuZXNzKGNodW5rcyk7XHJcblxyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eXBlLCBmLnR5cGUpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBbXHJcbiAgICAncHViS2V5JyxcclxuICAgICdwdWJLZXlIYXNoJyxcclxuICAgICdzY3JpcHRIYXNoJyxcclxuICAgICd3aXRuZXNzUHViS2V5SGFzaCcsXHJcbiAgICAnd2l0bmVzc1NjcmlwdEhhc2gnLFxyXG4gICAgJ3RhcHJvb3QnLFxyXG4gICAgJ3RhcHJvb3Rub2ZuJyxcclxuICAgICdtdWx0aXNpZycsXHJcbiAgICAnbnVsbERhdGEnLFxyXG4gICAgJ3dpdG5lc3NDb21taXRtZW50JyxcclxuICBdLmZvckVhY2goKG5hbWUpID0+IHtcclxuICAgIGNvbnN0IGlucHV0VHlwZSA9ICh0bWFwIGFzIGFueSlbbmFtZV0uaW5wdXQ7XHJcbiAgICBjb25zdCBvdXRwdXRUeXBlID0gKHRtYXAgYXMgYW55KVtuYW1lXS5vdXRwdXQ7XHJcblxyXG4gICAgZGVzY3JpYmUobmFtZSArICcuaW5wdXQuY2hlY2snLCAoKSA9PiB7XHJcbiAgICAgIGZpeHR1cmVzLnZhbGlkLmZvckVhY2goKGYpID0+IHtcclxuICAgICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpID09PSBjbGFzc2lmeS50eXBlcy5QMldQS0gpIHJldHVybjtcclxuICAgICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpID09PSBjbGFzc2lmeS50eXBlcy5QMldTSCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkID0gbmFtZS50b0xvd2VyQ2FzZSgpID09PSBmLnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgaWYgKGlucHV0VHlwZSAmJiBmLmlucHV0KSB7XHJcbiAgICAgICAgICBjb25zdCBpbnB1dCA9IGJzY3JpcHQuZnJvbUFTTShmLmlucHV0KTtcclxuXHJcbiAgICAgICAgICBpdCgncmV0dXJucyAnICsgZXhwZWN0ZWQgKyAnIGZvciAnICsgZi5pbnB1dCwgKCkgPT4ge1xyXG4gICAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaW5wdXRUeXBlLmNoZWNrKGlucHV0KSwgZXhwZWN0ZWQpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgaWYgKGYudHlwZUluY29tcGxldGUpIHtcclxuICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWRJbmNvbXBsZXRlID0gbmFtZS50b0xvd2VyQ2FzZSgpID09PSBmLnR5cGVJbmNvbXBsZXRlO1xyXG5cclxuICAgICAgICAgICAgaXQoJ3JldHVybnMgJyArIGV4cGVjdGVkICsgJyBmb3IgJyArIGYuaW5wdXQsICgpID0+IHtcclxuICAgICAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaW5wdXRUeXBlLmNoZWNrKGlucHV0LCB0cnVlKSwgZXhwZWN0ZWRJbmNvbXBsZXRlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICghKGZpeHR1cmVzLmludmFsaWQgYXMgYW55KVtuYW1lXSkgcmV0dXJuO1xyXG5cclxuICAgICAgKGZpeHR1cmVzLmludmFsaWQgYXMgYW55KVtuYW1lXS5pbnB1dHMuZm9yRWFjaCgoZjogYW55KSA9PiB7XHJcbiAgICAgICAgaWYgKCFmLmlucHV0ICYmICFmLmlucHV0SGV4KSByZXR1cm47XHJcblxyXG4gICAgICAgIGl0KCdyZXR1cm5zIGZhbHNlIGZvciAnICsgZi5kZXNjcmlwdGlvbiArICcgKCcgKyAoZi5pbnB1dCB8fCBmLmlucHV0SGV4KSArICcpJywgKCkgPT4ge1xyXG4gICAgICAgICAgbGV0IGlucHV0O1xyXG5cclxuICAgICAgICAgIGlmIChmLmlucHV0KSB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gYnNjcmlwdC5mcm9tQVNNKGYuaW5wdXQpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBCdWZmZXIuZnJvbShmLmlucHV0SGV4LCAnaGV4Jyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlucHV0VHlwZS5jaGVjayhpbnB1dCksIGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkZXNjcmliZShuYW1lICsgJy5vdXRwdXQuY2hlY2snLCAoKSA9PiB7XHJcbiAgICAgIGZpeHR1cmVzLnZhbGlkLmZvckVhY2goKGYpID0+IHtcclxuICAgICAgICBjb25zdCBleHBlY3RlZCA9IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZi50eXBlO1xyXG5cclxuICAgICAgICBpZiAob3V0cHV0VHlwZSAmJiBmLm91dHB1dCkge1xyXG4gICAgICAgICAgaXQoJ3JldHVybnMgJyArIGV4cGVjdGVkICsgJyBmb3IgJyArIGYub3V0cHV0LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGJzY3JpcHQuZnJvbUFTTShmLm91dHB1dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbnVsbGRhdGEnICYmIGYudHlwZSA9PT0gY2xhc3NpZnkudHlwZXMuV0lUTkVTU19DT01NSVRNRU5UKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd3aXRuZXNzY29tbWl0bWVudCcgJiYgZi50eXBlID09PSBjbGFzc2lmeS50eXBlcy5OVUxMREFUQSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwob3V0cHV0VHlwZS5jaGVjayhvdXRwdXQpLCBleHBlY3RlZCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYgKCEoZml4dHVyZXMuaW52YWxpZCBhcyBhbnkpW25hbWVdKSByZXR1cm47XHJcblxyXG4gICAgICAoZml4dHVyZXMuaW52YWxpZCBhcyBhbnkpW25hbWVdLm91dHB1dHMuZm9yRWFjaCgoZjogYW55KSA9PiB7XHJcbiAgICAgICAgaWYgKCFmLm91dHB1dCAmJiAhZi5vdXRwdXRIZXgpIHJldHVybjtcclxuXHJcbiAgICAgICAgaXQoJ3JldHVybnMgZmFsc2UgZm9yICcgKyBmLmRlc2NyaXB0aW9uICsgJyAoJyArIChmLm91dHB1dCB8fCBmLm91dHB1dEhleCkgKyAnKScsICgpID0+IHtcclxuICAgICAgICAgIGxldCBvdXRwdXQ7XHJcblxyXG4gICAgICAgICAgaWYgKGYub3V0cHV0KSB7XHJcbiAgICAgICAgICAgIG91dHB1dCA9IGJzY3JpcHQuZnJvbUFTTShmLm91dHB1dCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvdXRwdXQgPSBCdWZmZXIuZnJvbShmLm91dHB1dEhleCwgJ2hleCcpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChvdXRwdXRUeXBlLmNoZWNrKG91dHB1dCksIGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufSk7XHJcbiJdfQ==