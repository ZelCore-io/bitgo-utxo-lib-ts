"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWalletOutputForPsbt = exports.addWalletOutputToPsbt = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const chains_1 = require("./chains");
const outputScripts_1 = require("../outputScripts");
/**
 * Add a verifiable wallet output to the PSBT. The output and all data
 * needed to verify it from public keys only are added to the PSBT.
 * Typically these are change outputs.
 *
 * @param psbt the PSBT to add change output to
 * @param rootWalletKeys keys that will be able to spend the output
 * @param chain chain code to use for deriving scripts (and to determine script
 *              type) chain is an API parameter in the BitGo API, and may be
 *              any valid ChainCode
 * @param index derivation index for the change address
 * @param value value of the change output
 */
function addWalletOutputToPsbt(psbt, rootWalletKeys, chain, index, value) {
    const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
    const scriptType = (0, chains_1.scriptTypeForChain)(chain);
    if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
        const payment = scriptType === 'p2tr' ? (0, outputScripts_1.createPaymentP2tr)(walletKeys.publicKeys) : (0, outputScripts_1.createPaymentP2trMusig2)(walletKeys.publicKeys);
        psbt.addOutput({ script: payment.output, value });
    }
    else {
        const { scriptPubKey: script } = (0, outputScripts_1.createOutputScript2of3)(walletKeys.publicKeys, scriptType);
        psbt.addOutput({ script, value });
    }
    updateWalletOutputForPsbt(psbt, rootWalletKeys, psbt.data.outputs.length - 1, chain, index);
}
exports.addWalletOutputToPsbt = addWalletOutputToPsbt;
/**
 * Update the wallet output with the required information when necessary. If the
 * information is there already, it will skip over it.
 *
 * This function assumes that the output script and value have already been set.
 *
 * @param psbt the PSBT to update change output at
 * @param rootWalletKeys keys that will be able to spend the output
 * @param outputIndex output index where to update the output
 * @param chain chain code to use for deriving scripts (and to determine script
 *              type) chain is an API parameter in the BitGo API, and may be
 *              any valid ChainCode
 * @param index derivation index for the change address
 * @param value value of the change output
 */
function updateWalletOutputForPsbt(psbt, rootWalletKeys, outputIndex, chain, index) {
    if (psbt.data.outputs.length <= outputIndex) {
        throw new Error(`outputIndex (${outputIndex}) is too large for the number of outputs (${psbt.data.outputs.length})`);
    }
    const outputScript = psbt.getOutputScript(outputIndex);
    const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
    const scriptType = (0, chains_1.scriptTypeForChain)(chain);
    const output = psbt.data.outputs[outputIndex];
    const update = {};
    if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
        const payment = scriptType === 'p2tr' ? (0, outputScripts_1.createPaymentP2tr)(walletKeys.publicKeys) : (0, outputScripts_1.createPaymentP2trMusig2)(walletKeys.publicKeys);
        if (!payment.output || !payment.output.equals(outputScript)) {
            throw new Error(`cannot update a p2tr output where the scripts do not match - Failing.`);
        }
        const allLeafHashes = payment.redeems.map((r) => bitcoinjs_lib_1.taproot.hashTapLeaf(r.output));
        if (!output.tapTree) {
            update.tapTree = payment.tapTree;
        }
        if (!output.tapInternalKey) {
            update.tapInternalKey = payment.internalPubkey;
        }
        if (!output.tapBip32Derivation) {
            update.tapBip32Derivation = [0, 1, 2].map((idx) => {
                const pubkey = (0, outputScripts_1.toXOnlyPublicKey)(walletKeys.triple[idx].publicKey);
                const leafHashes = [];
                payment.redeems.forEach((r, idx) => {
                    if (r.pubkeys.find((pk) => pk.equals(pubkey))) {
                        leafHashes.push(allLeafHashes[idx]);
                    }
                });
                return {
                    leafHashes,
                    pubkey,
                    path: walletKeys.paths[idx],
                    masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
                };
            });
        }
    }
    else {
        const { scriptPubKey, witnessScript, redeemScript } = (0, outputScripts_1.createOutputScript2of3)(walletKeys.publicKeys, scriptType);
        if (!scriptPubKey.equals(outputScript)) {
            throw new Error(`cannot update an output where the scripts do not match - Failing.`);
        }
        if (!output.bip32Derivation) {
            update.bip32Derivation = [0, 1, 2].map((idx) => ({
                pubkey: walletKeys.triple[idx].publicKey,
                path: walletKeys.paths[idx],
                masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
            }));
        }
        if (!output.witnessScript && witnessScript) {
            update.witnessScript = witnessScript;
        }
        if (!output.redeemScript && redeemScript) {
            update.redeemScript = redeemScript;
        }
    }
    psbt.updateOutput(outputIndex, update);
}
exports.updateWalletOutputForPsbt = updateWalletOutputForPsbt;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2FsbGV0T3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpdGdvL3dhbGxldC9XYWxsZXRPdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaURBQXdDO0FBSXhDLHFDQUF5RDtBQUN6RCxvREFBd0g7QUFFeEg7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsU0FBZ0IscUJBQXFCLENBQ25DLElBQWMsRUFDZCxjQUE4QixFQUM5QixLQUFnQixFQUNoQixLQUFhLEVBQ2IsS0FBYTtJQUViLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkUsTUFBTSxVQUFVLEdBQUcsSUFBQSwyQkFBa0IsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUM3QyxJQUFJLFVBQVUsS0FBSyxNQUFNLElBQUksVUFBVSxLQUFLLFlBQVksRUFBRTtRQUN4RCxNQUFNLE9BQU8sR0FDWCxVQUFVLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFBLGlDQUFpQixFQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSx1Q0FBdUIsRUFBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7S0FDcEQ7U0FBTTtRQUNMLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNGLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUNuQztJQUNELHlCQUF5QixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFP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O0FBQ3pDLENBQUM7QUF0RUQsOERBc0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdGFwcm9vdCB9IGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgeyBQc2J0T3V0cHV0VXBkYXRlIH0gZnJvbSAnYmlwMTc0L3NyYy9saWIvaW50ZXJmYWNlcyc7XHJcbmltcG9ydCB7IFV0eG9Qc2J0IH0gZnJvbSAnLi4vVXR4b1BzYnQnO1xyXG5pbXBvcnQgeyBSb290V2FsbGV0S2V5cyB9IGZyb20gJy4vV2FsbGV0S2V5cyc7XHJcbmltcG9ydCB7IENoYWluQ29kZSwgc2NyaXB0VHlwZUZvckNoYWluIH0gZnJvbSAnLi9jaGFpbnMnO1xyXG5pbXBvcnQgeyBjcmVhdGVPdXRwdXRTY3JpcHQyb2YzLCBjcmVhdGVQYXltZW50UDJ0ciwgY3JlYXRlUGF5bWVudFAydHJNdXNpZzIsIHRvWE9ubHlQdWJsaWNLZXkgfSBmcm9tICcuLi9vdXRwdXRTY3JpcHRzJztcclxuXHJcbi8qKlxyXG4gKiBBZGQgYSB2ZXJpZmlhYmxlIHdhbGxldCBvdXRwdXQgdG8gdGhlIFBTQlQuIFRoZSBvdXRwdXQgYW5kIGFsbCBkYXRhXHJcbiAqIG5lZWRlZCB0byB2ZXJpZnkgaXQgZnJvbSBwdWJsaWMga2V5cyBvbmx5IGFyZSBhZGRlZCB0byB0aGUgUFNCVC5cclxuICogVHlwaWNhbGx5IHRoZXNlIGFyZSBjaGFuZ2Ugb3V0cHV0cy5cclxuICpcclxuICogQHBhcmFtIHBzYnQgdGhlIFBTQlQgdG8gYWRkIGNoYW5nZSBvdXRwdXQgdG9cclxuICogQHBhcmFtIHJvb3RXYWxsZXRLZXlzIGtleXMgdGhhdCB3aWxsIGJlIGFibGUgdG8gc3BlbmQgdGhlIG91dHB1dFxyXG4gKiBAcGFyYW0gY2hhaW4gY2hhaW4gY29kZSB0byB1c2UgZm9yIGRlcml2aW5nIHNjcmlwdHMgKGFuZCB0byBkZXRlcm1pbmUgc2NyaXB0XHJcbiAqICAgICAgICAgICAgICB0eXBlKSBjaGFpbiBpcyBhbiBBUEkgcGFyYW1ldGVyIGluIHRoZSBCaXRHbyBBUEksIGFuZCBtYXkgYmVcclxuICogICAgICAgICAgICAgIGFueSB2YWxpZCBDaGFpbkNvZGVcclxuICogQHBhcmFtIGluZGV4IGRlcml2YXRpb24gaW5kZXggZm9yIHRoZSBjaGFuZ2UgYWRkcmVzc1xyXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWUgb2YgdGhlIGNoYW5nZSBvdXRwdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRXYWxsZXRPdXRwdXRUb1BzYnQoXHJcbiAgcHNidDogVXR4b1BzYnQsXHJcbiAgcm9vdFdhbGxldEtleXM6IFJvb3RXYWxsZXRLZXlzLFxyXG4gIGNoYWluOiBDaGFpbkNvZGUsXHJcbiAgaW5kZXg6IG51bWJlcixcclxuICB2YWx1ZTogYmlnaW50XHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IHdhbGxldEtleXMgPSByb290V2FsbGV0S2V5cy5kZXJpdmVGb3JDaGFpbkFuZEluZGV4KGNoYWluLCBpbmRleCk7XHJcbiAgY29uc3Qgc2NyaXB0VHlwZSA9IHNjcmlwdFR5cGVGb3JDaGFpbihjaGFpbik7XHJcbiAgaWYgKHNjcmlwdFR5cGUgPT09ICdwMnRyJyB8fCBzY3JpcHRUeXBlID09PSAncDJ0ck11c2lnMicpIHtcclxuICAgIGNvbnN0IHBheW1lbnQgPVxyXG4gICAgICBzY3JpcHRUeXBlID09PSAncDJ0cicgPyBjcmVhdGVQYXltZW50UDJ0cih3YWxsZXRLZXlzLnB1YmxpY0tleXMpIDogY3JlYXRlUGF5bWVudFAydHJNdXNpZzIod2FsbGV0S2V5cy5wdWJsaWNLZXlzKTtcclxuICAgIHBzYnQuYWRkT3V0cHV0KHsgc2NyaXB0OiBwYXltZW50Lm91dHB1dCEsIHZhbHVlIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCB7IHNjcmlwdFB1YktleTogc2NyaXB0IH0gPSBjcmVhdGVPdXRwdXRTY3JpcHQyb2YzKHdhbGxldEtleXMucHVibGljS2V5cywgc2NyaXB0VHlwZSk7XHJcbiAgICBwc2J0LmFkZE91dHB1dCh7IHNjcmlwdCwgdmFsdWUgfSk7XHJcbiAgfVxyXG4gIHVwZGF0ZVdhbGxldE91dHB1dEZvclBzYnQocHNidCwgcm9vdFdhbGxldEtleXMsIHBzYnQuZGF0YS5vdXRwdXRzLmxlbmd0aCAtIDEsIGNoYWluLCBpbmRleCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgdGhlIHdhbGxldCBvdXRwdXQgd2l0aCB0aGUgcmVxdWlyZWQgaW5mb3JtYXRpb24gd2hlbiBuZWNlc3NhcnkuIElmIHRoZVxyXG4gKiBpbmZvcm1hdGlvbiBpcyB0aGVyZSBhbHJlYWR5LCBpdCB3aWxsIHNraXAgb3ZlciBpdC5cclxuICpcclxuICogVGhpcyBmdW5jdGlvbiBhc3N1bWVzIHRoYXQgdGhlIG91dHB1dCBzY3JpcHQgYW5kIHZhbHVlIGhhdmUgYWxyZWFkeSBiZWVuIHNldC5cclxuICpcclxuICogQHBhcmFtIHBzYnQgdGhlIFBTQlQgdG8gdXBkYXRlIGNoYW5nZSBvdXRwdXQgYXRcclxuICogQHBhcmFtIHJvb3RXYWxsZXRLZXlzIGtleXMgdGhhdCB3aWxsIGJlIGFibGUgdG8gc3BlbmQgdGhlIG91dHB1dFxyXG4gKiBAcGFyYW0gb3V0cHV0SW5kZXggb3V0cHV0IGluZGV4IHdoZXJlIHRvIHVwZGF0ZSB0aGUgb3V0cHV0XHJcbiAqIEBwYXJhbSBjaGFpbiBjaGFpbiBjb2RlIHRvIHVzZSBmb3IgZGVyaXZpbmcgc2NyaXB0cyAoYW5kIHRvIGRldGVybWluZSBzY3JpcHRcclxuICogICAgICAgICAgICAgIHR5cGUpIGNoYWluIGlzIGFuIEFQSSBwYXJhbWV0ZXIgaW4gdGhlIEJpdEdvIEFQSSwgYW5kIG1heSBiZVxyXG4gKiAgICAgICAgICAgICAgYW55IHZhbGlkIENoYWluQ29kZVxyXG4gKiBAcGFyYW0gaW5kZXggZGVyaXZhdGlvbiBpbmRleCBmb3IgdGhlIGNoYW5nZSBhZGRyZXNzXHJcbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBvZiB0aGUgY2hhbmdlIG91dHB1dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVdhbGxldE91dHB1dEZvclBzYnQoXHJcbiAgcHNidDogVXR4b1BzYnQsXHJcbiAgcm9vdFdhbGxldEtleXM6IFJvb3RXYWxsZXRLZXlzLFxyXG4gIG91dHB1dEluZGV4OiBudW1iZXIsXHJcbiAgY2hhaW46IENoYWluQ29kZSxcclxuICBpbmRleDogbnVtYmVyXHJcbik6IHZvaWQge1xyXG4gIGlmIChwc2J0LmRhdGEub3V0cHV0cy5sZW5ndGggPD0gb3V0cHV0SW5kZXgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgYG91dHB1dEluZGV4ICgke291dHB1dEluZGV4fSkgaXMgdG9vIGxhcmdlIGZvciB0aGUgbnVtYmVyIG9mIG91dHB1dHMgKCR7cHNidC5kYXRhLm91dHB1dHMubGVuZ3RofSlgXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgb3V0cHV0U2NyaXB0ID0gcHNidC5nZXRPdXRwdXRTY3JpcHQob3V0cHV0SW5kZXgpO1xyXG5cclxuICBjb25zdCB3YWxsZXRLZXlzID0gcm9vdFdhbGxldEtleXMuZGVyaXZlRm9yQ2hhaW5BbmRJbmRleChjaGFpbiwgaW5kZXgpO1xyXG4gIGNvbnN0IHNjcmlwdFR5cGUgPSBzY3JpcHRUeXBlRm9yQ2hhaW4oY2hhaW4pO1xyXG4gIGNvbnN0IG91dHB1dCA9IHBzYnQuZGF0YS5vdXRwdXRzW291dHB1dEluZGV4XTtcclxuICBjb25zdCB1cGRhdGU6IFBzYnRPdXRwdXRVcGRhdGUgPSB7fTtcclxuICBpZiAoc2NyaXB0VHlwZSA9PT0gJ3AydHInIHx8IHNjcmlwdFR5cGUgPT09ICdwMnRyTXVzaWcyJykge1xyXG4gICAgY29uc3QgcGF5bWVudCA9XHJcbiAgICAgIHNjcmlwdFR5cGUgPT09ICdwMnRyJyA/IGNyZWF0ZVBheW1lbnRQMnRyKHdhbGxldEtleXMucHVibGljS2V5cykgOiBjcmVhdGVQYXltZW50UDJ0ck11c2lnMih3YWxsZXRLZXlzLnB1YmxpY0tleXMpO1xyXG4gICAgaWYgKCFwYXltZW50Lm91dHB1dCB8fCAhcGF5bWVudC5vdXRwdXQuZXF1YWxzKG91dHB1dFNjcmlwdCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjYW5ub3QgdXBkYXRlIGEgcDJ0ciBvdXRwdXQgd2hlcmUgdGhlIHNjcmlwdHMgZG8gbm90IG1hdGNoIC0gRmFpbGluZy5gKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGFsbExlYWZIYXNoZXMgPSBwYXltZW50LnJlZGVlbXMhLm1hcCgocikgPT4gdGFwcm9vdC5oYXNoVGFwTGVhZihyLm91dHB1dCEpKTtcclxuXHJcbiAgICBpZiAoIW91dHB1dC50YXBUcmVlKSB7XHJcbiAgICAgIHVwZGF0ZS50YXBUcmVlID0gcGF5bWVudC50YXBUcmVlO1xyXG4gICAgfVxyXG4gICAgaWYgKCFvdXRwdXQudGFwSW50ZXJuYWxLZXkpIHtcclxuICAgICAgdXBkYXRlLnRhcEludGVybmFsS2V5ID0gcGF5bWVudC5pbnRlcm5hbFB1YmtleTtcclxuICAgIH1cclxuICAgIGlmICghb3V0cHV0LnRhcEJpcDMyRGVyaXZhdGlvbikge1xyXG4gICAgICB1cGRhdGUudGFwQmlwMzJEZXJpdmF0aW9uID0gWzAsIDEsIDJdLm1hcCgoaWR4KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcHVia2V5ID0gdG9YT25seVB1YmxpY0tleSh3YWxsZXRLZXlzLnRyaXBsZVtpZHhdLnB1YmxpY0tleSk7XHJcbiAgICAgICAgY29uc3QgbGVhZkhhc2hlczogQnVmZmVyW10gPSBbXTtcclxuICAgICAgICBwYXltZW50LnJlZGVlbXMhLmZvckVhY2goKHIsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgaWYgKHIucHVia2V5cyEuZmluZCgocGspID0+IHBrLmVxdWFscyhwdWJrZXkpKSkge1xyXG4gICAgICAgICAgICBsZWFmSGFzaGVzLnB1c2goYWxsTGVhZkhhc2hlc1tpZHhdKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgbGVhZkhhc2hlcyxcclxuICAgICAgICAgIHB1YmtleSxcclxuICAgICAgICAgIHBhdGg6IHdhbGxldEtleXMucGF0aHNbaWR4XSxcclxuICAgICAgICAgIG1hc3RlckZpbmdlcnByaW50OiByb290V2FsbGV0S2V5cy50cmlwbGVbaWR4XS5maW5nZXJwcmludCxcclxuICAgICAgICB9O1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgeyBzY3JpcHRQdWJLZXksIHdpdG5lc3NTY3JpcHQsIHJlZGVlbVNjcmlwdCB9ID0gY3JlYXRlT3V0cHV0U2NyaXB0Mm9mMyh3YWxsZXRLZXlzLnB1YmxpY0tleXMsIHNjcmlwdFR5cGUpO1xyXG4gICAgaWYgKCFzY3JpcHRQdWJLZXkuZXF1YWxzKG91dHB1dFNjcmlwdCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjYW5ub3QgdXBkYXRlIGFuIG91dHB1dCB3aGVyZSB0aGUgc2NyaXB0cyBkbyBub3QgbWF0Y2ggLSBGYWlsaW5nLmApO1xyXG4gICAgfVxyXG4gICAgaWYgKCFvdXRwdXQuYmlwMzJEZXJpdmF0aW9uKSB7XHJcbiAgICAgIHVwZGF0ZS5iaXAzMkRlcml2YXRpb24gPSBbMCwgMSwgMl0ubWFwKChpZHgpID0+ICh7XHJcbiAgICAgICAgcHVia2V5OiB3YWxsZXRLZXlzLnRyaXBsZVtpZHhdLnB1YmxpY0tleSxcclxuICAgICAgICBwYXRoOiB3YWxsZXRLZXlzLnBhdGhzW2lkeF0sXHJcbiAgICAgICAgbWFzdGVyRmluZ2VycHJpbnQ6IHJvb3RXYWxsZXRLZXlzLnRyaXBsZVtpZHhdLmZpbmdlcnByaW50LFxyXG4gICAgICB9KSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIW91dHB1dC53aXRuZXNzU2NyaXB0ICYmIHdpdG5lc3NTY3JpcHQpIHtcclxuICAgICAgdXBkYXRlLndpdG5lc3NTY3JpcHQgPSB3aXRuZXNzU2NyaXB0O1xyXG4gICAgfVxyXG4gICAgaWYgKCFvdXRwdXQucmVkZWVtU2NyaXB0ICYmIHJlZGVlbVNjcmlwdCkge1xyXG4gICAgICB1cGRhdGUucmVkZWVtU2NyaXB0ID0gcmVkZWVtU2NyaXB0O1xyXG4gICAgfVxyXG4gIH1cclxuICBwc2J0LnVwZGF0ZU91dHB1dChvdXRwdXRJbmRleCwgdXBkYXRlKTtcclxufVxyXG4iXX0=