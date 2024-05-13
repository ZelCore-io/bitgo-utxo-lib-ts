"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsign = exports.getInputUpdate = void 0;
const assert = require("assert");
const __1 = require("../..");
const parseInput_1 = require("../parseInput");
const signature_1 = require("../signature");
const outputScripts_1 = require("../outputScripts");
function omitUndefined(v) {
    return Object.fromEntries(Object.entries(v).filter(([k, v]) => v !== undefined));
}
function getInputUpdate(tx, vin, prevOuts) {
    const nonWitnessUtxo = prevOuts[vin].prevTx;
    const { script, witness } = tx.ins[vin];
    if (script.length === 0 && witness.length === 0) {
        return nonWitnessUtxo ? { nonWitnessUtxo } : {};
    }
    const parsedInput = (0, parseInput_1.parseSignatureScript)(tx.ins[vin]);
    assert.ok(parsedInput.scriptType !== 'taprootKeyPathSpend');
    function getPartialSigs() {
        assert.ok(parsedInput.scriptType !== 'taprootKeyPathSpend');
        return (0, signature_1.getSignaturesWithPublicKeys)(tx, vin, prevOuts, parsedInput.publicKeys).flatMap((signature, i) => signature
            ? [
                {
                    pubkey: parsedInput.publicKeys[i],
                    signature,
                },
            ]
            : []);
    }
    // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
    // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
    // segwit transactions
    if (parsedInput.scriptType !== 'taprootScriptPathSpend' &&
        !(0, outputScripts_1.hasWitnessData)(parsedInput.scriptType) &&
        !nonWitnessUtxo &&
        (0, __1.getMainnet)(tx.network) !== __1.networks.zcash) {
        throw new Error(`scriptType ${parsedInput.scriptType} requires prevTx Buffer`);
    }
    switch (parsedInput.scriptType) {
        case 'p2shP2pk':
            return {
                nonWitnessUtxo,
                partialSig: [{ pubkey: parsedInput.publicKeys[0], signature: parsedInput.signatures[0] }],
            };
        case 'p2sh':
        case 'p2wsh':
        case 'p2shP2wsh':
            return omitUndefined({
                nonWitnessUtxo,
                partialSig: getPartialSigs(),
                redeemScript: parsedInput.redeemScript,
                witnessScript: parsedInput.witnessScript,
            });
        case 'taprootScriptPathSpend':
            const leafHash = __1.taproot.getTapleafHash(__1.ecc, parsedInput.controlBlock, parsedInput.pubScript);
            return {
                tapLeafScript: [
                    {
                        controlBlock: parsedInput.controlBlock,
                        script: parsedInput.pubScript,
                        leafVersion: parsedInput.leafVersion,
                    },
                ],
                tapScriptSig: getPartialSigs().map((obj) => ({ ...obj, leafHash })),
            };
    }
}
exports.getInputUpdate = getInputUpdate;
/**
 * Takes a partially signed transaction and removes the scripts and signatures.
 *
 * Inputs must be one of:
 *  - p2shP2pk
 *  - p2sh 2-of-3
 *  - p2shP2wsh 2-of-3
 *  - p2wsh 2-of-3
 *  - p2tr script path 2-of-2
 *
 * @param tx the partially signed transaction
 * @param prevOuts
 *
 * @return the removed scripts and signatures, ready to be added to a PSBT
 */
function unsign(tx, prevOuts) {
    return tx.ins.map((input, vin) => {
        const update = getInputUpdate(tx, vin, prevOuts);
        input.witness = [];
        input.script = Buffer.alloc(0);
        return update;
    });
}
exports.unsign = unsign;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbUhhbGZTaWduZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYml0Z28vcHNidC9mcm9tSGFsZlNpZ25lZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFFakMsNkJBQStFO0FBRS9FLDhDQUFxRDtBQUNyRCw0Q0FBMkQ7QUFDM0Qsb0RBQWtEO0FBRWxELFNBQVMsYUFBYSxDQUFvQyxDQUEwQjtJQUNsRixPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFNLENBQUM7QUFDeEYsQ0FBQztBQUVELFNBQWdCLGNBQWMsQ0FDNUIsRUFBMkIsRUFDM0IsR0FBVyxFQUNYLFFBQW9EO0lBRXBELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDNUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDL0MsT0FBTyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNqRDtJQUVELE1BQU0sV0FBVyxHQUFHLElBQUEsaUNBQW9CLEVBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFVBQVUsS0FBSyxxQkFBcUIsQ0FBQyxDQUFDO0lBRTVELFNBQVMsY0FBYztRQUNyQixNQUFNLENBQUMsRUFB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IFBzYnRJbnB1dFVwZGF0ZSwgUGFydGlhbFNpZyB9IGZyb20gJ2JpcDE3NC9zcmMvbGliL2ludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBlY2MgYXMgZWNjTGliLCBUeE91dHB1dCwgdGFwcm9vdCwgZ2V0TWFpbm5ldCwgbmV0d29ya3MgfSBmcm9tICcuLi8uLic7XHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbiB9IGZyb20gJy4uL1V0eG9UcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IHBhcnNlU2lnbmF0dXJlU2NyaXB0IH0gZnJvbSAnLi4vcGFyc2VJbnB1dCc7XHJcbmltcG9ydCB7IGdldFNpZ25hdHVyZXNXaXRoUHVibGljS2V5cyB9IGZyb20gJy4uL3NpZ25hdHVyZSc7XHJcbmltcG9ydCB7IGhhc1dpdG5lc3NEYXRhIH0gZnJvbSAnLi4vb3V0cHV0U2NyaXB0cyc7XHJcblxyXG5mdW5jdGlvbiBvbWl0VW5kZWZpbmVkPFQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4odjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBUIHtcclxuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHYpLmZpbHRlcigoW2ssIHZdKSA9PiB2ICE9PSB1bmRlZmluZWQpKSBhcyBUO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5wdXRVcGRhdGUoXHJcbiAgdHg6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+LFxyXG4gIHZpbjogbnVtYmVyLFxyXG4gIHByZXZPdXRzOiAoVHhPdXRwdXQ8YmlnaW50PiAmIHsgcHJldlR4PzogQnVmZmVyIH0pW11cclxuKTogUHNidElucHV0VXBkYXRlIHtcclxuICBjb25zdCBub25XaXRuZXNzVXR4byA9IHByZXZPdXRzW3Zpbl0ucHJldlR4O1xyXG4gIGNvbnN0IHsgc2NyaXB0LCB3aXRuZXNzIH0gPSB0eC5pbnNbdmluXTtcclxuICBpZiAoc2NyaXB0Lmxlbmd0aCA9PT0gMCAmJiB3aXRuZXNzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIG5vbldpdG5lc3NVdHhvID8geyBub25XaXRuZXNzVXR4byB9IDoge307XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYXJzZWRJbnB1dCA9IHBhcnNlU2lnbmF0dXJlU2NyaXB0KHR4Lmluc1t2aW5dKTtcclxuICBhc3NlcnQub2socGFyc2VkSW5wdXQuc2NyaXB0VHlwZSAhPT0gJ3RhcHJvb3RLZXlQYXRoU3BlbmQnKTtcclxuXHJcbiAgZnVuY3Rpb24gZ2V0UGFydGlhbFNpZ3MoKTogUGFydGlhbFNpZ1tdIHtcclxuICAgIGFzc2VydC5vayhwYXJzZWRJbnB1dC5zY3JpcHRUeXBlICE9PSAndGFwcm9vdEtleVBhdGhTcGVuZCcpO1xyXG4gICAgcmV0dXJuIGdldFNpZ25hdHVyZXNXaXRoUHVibGljS2V5cyh0eCwgdmluLCBwcmV2T3V0cywgcGFyc2VkSW5wdXQucHVibGljS2V5cykuZmxhdE1hcCgoc2lnbmF0dXJlLCBpKSA9PlxyXG4gICAgICBzaWduYXR1cmVcclxuICAgICAgICA/IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHB1YmtleTogcGFyc2VkSW5wdXQucHVibGljS2V5c1tpXSxcclxuICAgICAgICAgICAgICBzaWduYXR1cmUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgOiBbXVxyXG4gICAgKTtcclxuICB9XHJcbiAgLy8gQmVjYXVzZSBaY2FzaCBkaXJlY3RseSBoYXNoZXMgdGhlIHZhbHVlIGZvciBub24tc2Vnd2l0IHRyYW5zYWN0aW9ucywgd2UgZG8gbm90IG5lZWQgdG8gY2hlY2sgaW5kaXJlY3RseVxyXG4gIC8vIHdpdGggdGhlIHByZXZpb3VzIHRyYW5zYWN0aW9uLiBUaGVyZWZvcmUsIHdlIGNhbiB0cmVhdCBaY2FzaCBub24tc2Vnd2l0IHRyYW5zYWN0aW9ucyBhcyBCaXRjb2luXHJcbiAgLy8gc2Vnd2l0IHRyYW5zYWN0aW9uc1xyXG4gIGlmIChcclxuICAgIHBhcnNlZElucHV0LnNjcmlwdFR5cGUgIT09ICd0YXByb290U2NyaXB0UGF0aFNwZW5kJyAmJlxyXG4gICAgIWhhc1dpdG5lc3NEYXRhKHBhcnNlZElucHV0LnNjcmlwdFR5cGUpICYmXHJcbiAgICAhbm9uV2l0bmVzc1V0eG8gJiZcclxuICAgIGdldE1haW5uZXQodHgubmV0d29yaykgIT09IG5ldHdvcmtzLnpjYXNoXHJcbiAgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHNjcmlwdFR5cGUgJHtwYXJzZWRJbnB1dC5zY3JpcHRUeXBlfSByZXF1aXJlcyBwcmV2VHggQnVmZmVyYCk7XHJcbiAgfVxyXG5cclxuICBzd2l0Y2ggKHBhcnNlZElucHV0LnNjcmlwdFR5cGUpIHtcclxuICAgIGNhc2UgJ3Ayc2hQMnBrJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBub25XaXRuZXNzVXR4byxcclxuICAgICAgICBwYXJ0aWFsU2lnOiBbeyBwdWJrZXk6IHBhcnNlZElucHV0LnB1YmxpY0tleXNbMF0sIHNpZ25hdHVyZTogcGFyc2VkSW5wdXQuc2lnbmF0dXJlc1swXSB9XSxcclxuICAgICAgfTtcclxuICAgIGNhc2UgJ3Ayc2gnOlxyXG4gICAgY2FzZSAncDJ3c2gnOlxyXG4gICAgY2FzZSAncDJzaFAyd3NoJzpcclxuICAgICAgcmV0dXJuIG9taXRVbmRlZmluZWQoe1xyXG4gICAgICAgIG5vbldpdG5lc3NVdHhvLFxyXG4gICAgICAgIHBhcnRpYWxTaWc6IGdldFBhcnRpYWxTaWdzKCksXHJcbiAgICAgICAgcmVkZWVtU2NyaXB0OiBwYXJzZWRJbnB1dC5yZWRlZW1TY3JpcHQsXHJcbiAgICAgICAgd2l0bmVzc1NjcmlwdDogcGFyc2VkSW5wdXQud2l0bmVzc1NjcmlwdCxcclxuICAgICAgfSk7XHJcbiAgICBjYXNlICd0YXByb290U2NyaXB0UGF0aFNwZW5kJzpcclxuICAgICAgY29uc3QgbGVhZkhhc2ggPSB0YXByb290LmdldFRhcGxlYWZIYXNoKGVjY0xpYiwgcGFyc2VkSW5wdXQuY29udHJvbEJsb2NrLCBwYXJzZWRJbnB1dC5wdWJTY3JpcHQpO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRhcExlYWZTY3JpcHQ6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgY29udHJvbEJsb2NrOiBwYXJzZWRJbnB1dC5jb250cm9sQmxvY2ssXHJcbiAgICAgICAgICAgIHNjcmlwdDogcGFyc2VkSW5wdXQucHViU2NyaXB0LFxyXG4gICAgICAgICAgICBsZWFmVmVyc2lvbjogcGFyc2VkSW5wdXQubGVhZlZlcnNpb24sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdGFwU2NyaXB0U2lnOiBnZXRQYXJ0aWFsU2lncygpLm1hcCgob2JqKSA9PiAoeyAuLi5vYmosIGxlYWZIYXNoIH0pKSxcclxuICAgICAgfTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIHBhcnRpYWxseSBzaWduZWQgdHJhbnNhY3Rpb24gYW5kIHJlbW92ZXMgdGhlIHNjcmlwdHMgYW5kIHNpZ25hdHVyZXMuXHJcbiAqXHJcbiAqIElucHV0cyBtdXN0IGJlIG9uZSBvZjpcclxuICogIC0gcDJzaFAycGtcclxuICogIC0gcDJzaCAyLW9mLTNcclxuICogIC0gcDJzaFAyd3NoIDItb2YtM1xyXG4gKiAgLSBwMndzaCAyLW9mLTNcclxuICogIC0gcDJ0ciBzY3JpcHQgcGF0aCAyLW9mLTJcclxuICpcclxuICogQHBhcmFtIHR4IHRoZSBwYXJ0aWFsbHkgc2lnbmVkIHRyYW5zYWN0aW9uXHJcbiAqIEBwYXJhbSBwcmV2T3V0c1xyXG4gKlxyXG4gKiBAcmV0dXJuIHRoZSByZW1vdmVkIHNjcmlwdHMgYW5kIHNpZ25hdHVyZXMsIHJlYWR5IHRvIGJlIGFkZGVkIHRvIGEgUFNCVFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVuc2lnbih0eDogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4sIHByZXZPdXRzOiBUeE91dHB1dDxiaWdpbnQ+W10pOiBQc2J0SW5wdXRVcGRhdGVbXSB7XHJcbiAgcmV0dXJuIHR4Lmlucy5tYXAoKGlucHV0LCB2aW4pID0+IHtcclxuICAgIGNvbnN0IHVwZGF0ZSA9IGdldElucHV0VXBkYXRlKHR4LCB2aW4sIHByZXZPdXRzKTtcclxuICAgIGlucHV0LndpdG5lc3MgPSBbXTtcclxuICAgIGlucHV0LnNjcmlwdCA9IEJ1ZmZlci5hbGxvYygwKTtcclxuICAgIHJldHVybiB1cGRhdGU7XHJcbiAgfSk7XHJcbn1cclxuIl19