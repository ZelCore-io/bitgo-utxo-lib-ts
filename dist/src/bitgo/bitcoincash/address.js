"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOutputScriptWithFormat = exports.fromOutputScriptWithFormat = exports.toOutputScriptFromCashAddress = exports.fromOutputScriptToCashAddress = exports.getPrefix = void 0;
/**
 * Wrapper around `cashaddress` library.
 *
 * Performs some address sanitation:
 * - add prefix if missing
 * - normalize to lower-case
 * - reject mixed-case
 *
 * Based on these documents
 *
 * - https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
 * - https://www.bitcoinabc.org/cashaddr/
 */
const cashaddress = require("cashaddress");
const bitcoinjs = require("bitcoinjs-lib");
const networks_1 = require("../../networks");
/**
 * @param name
 * @param output
 * @return the encoded pubkeyhash or scripthash
 */
function getHashFromOutputScript(name, output) {
    const func = bitcoinjs.payments[name];
    if (!func) {
        throw new Error(`no payment with name ${name}`);
    }
    try {
        return func({ output }).hash;
    }
    catch (e) {
        return undefined;
    }
}
/**
 * @param network
 * @return network-specific cashaddr prefix
 */
function getPrefix(network) {
    switch (network) {
        case networks_1.networks.bitcoincash:
            return 'bitcoincash';
        case networks_1.networks.bitcoincashTestnet:
            return 'bchtest';
        case networks_1.networks.ecash:
            return 'ecash';
        case networks_1.networks.ecashTest:
            return 'ectest';
        default:
            throw new Error(`unsupported prefix for ${(0, networks_1.getNetworkName)(network)}`);
    }
}
exports.getPrefix = getPrefix;
/**
 * @param outputScript
 * @param network
 * @return outputScript encoded as cashaddr (prefixed, lowercase)
 */
function fromOutputScriptToCashAddress(outputScript, network) {
    if (!(0, networks_1.isBitcoinCash)(network) && !(0, networks_1.isECash)(network)) {
        throw new Error(`invalid network`);
    }
    for (const [paymentName, scriptType] of [
        ['p2pkh', 'pubkeyhash'],
        ['p2sh', 'scripthash'],
    ]) {
        const hash = getHashFromOutputScript(paymentName, outputScript);
        if (hash) {
            return cashaddress.encode(getPrefix(network), scriptType, hash);
        }
    }
    throw new Error(`could not determine hash for outputScript`);
}
exports.fromOutputScriptToCashAddress = fromOutputScriptToCashAddress;
/**
 * @param address - Accepts addresses with and without prefix. Accepts all-lowercase and all-uppercase addresses. Rejects mixed-case addresses.
 * @param network
 * @return decoded output script
 */
function toOutputScriptFromCashAddress(address, network) {
    if (!(0, networks_1.isBitcoinCash)(network) && !(0, networks_1.isECash)(network)) {
        throw new Error(`invalid network`);
    }
    if (address === address.toUpperCase()) {
        address = address.toLowerCase();
    }
    if (address !== address.toLowerCase()) {
        throw new Error(`mixed-case addresses not allowed`);
    }
    if (!address.startsWith(getPrefix(network) + ':')) {
        address = `${getPrefix(network)}:${address}`;
    }
    const decoded = cashaddress.decode(address);
    let outputScript;
    switch (decoded.version) {
        case 'scripthash':
            outputScript = bitcoinjs.payments.p2sh({ hash: decoded.hash }).output;
            break;
        case 'pubkeyhash':
            outputScript = bitcoinjs.payments.p2pkh({ hash: decoded.hash }).output;
            break;
        default:
            throw new Error(`unknown version ${decoded.version}`);
    }
    if (!outputScript) {
        throw new Error(`could not determine output script`);
    }
    return outputScript;
}
exports.toOutputScriptFromCashAddress = toOutputScriptFromCashAddress;
/**
 * @param outputScript
 * @param format
 * @param network
 * @return address in specified format
 */
function fromOutputScriptWithFormat(outputScript, format, network) {
    if (!(0, networks_1.isBitcoinCash)(network) && !(0, networks_1.isECash)(network)) {
        throw new Error(`invalid network`);
    }
    if (format === 'cashaddr') {
        return fromOutputScriptToCashAddress(outputScript, network);
    }
    if (format === 'default') {
        return bitcoinjs.address.fromOutputScript(outputScript, network);
    }
    throw new Error(`invalid format`);
}
exports.fromOutputScriptWithFormat = fromOutputScriptWithFormat;
/**
 * @param address
 * @param format
 * @param network
 * @return output script from address in specified format
 */
function toOutputScriptWithFormat(address, format, network) {
    if (!(0, networks_1.isBitcoinCash)(network) && !(0, networks_1.isECash)(network)) {
        throw new Error(`invalid network`);
    }
    if (format === 'cashaddr') {
        return toOutputScriptFromCashAddress(address, network);
    }
    if (format === 'default') {
        return bitcoinjs.address.toOutputScript(address, network);
    }
    throw new Error(`invalid format`);
}
exports.toOutputScriptWithFormat = toOutputScriptWithFormat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkcmVzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby9iaXRjb2luY2FzaC9hZGRyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsNkNBQTJGO0FBRzNGOzs7O0dBSUc7QUFDSCxTQUFTLHVCQUF1QixDQUFDLElBQVksRUFBRSxNQUFjO0lBRTNELE1BQU0sSUFBSSxHQUFJLFNBQVMsQ0FBQyxRQUFtRCxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xGLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDVCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ2pEO0lBQ0QsSUFBSTtRQUNGLE9BQU8sSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDOUI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxPQUFnQjtJQUN4QyxRQUFRLE9BQU8sRUFBRTtRQUNmLEtBQUssbUJBQVEsQ0FBQyxXQUFXO1lBQ3ZCLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLEtBQUssbUJBQVEsQ0FBQyxrQkFBa0I7WUFDOUIsT0FBTyxTQUFTLENBQUM7UUFDbkIsS0FBSyxtQkFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTyxPQUFPLENBQUM7UUFDakIsS0FBSyxtQkFBUSxDQUFDLFNBQVM7WUFDckIsT0FBTyxRQUFRLENBQUM7UUFDbEI7WUFDRSxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixJQUFBLHlCQUFjLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ3hFO0FBQ0gsQ0FBQztBQWJELDhCQWFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLDZCQUE2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QUN6QixPQUFPLDZCQUE2QixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztLQUM3RDtJQUVELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUN4QixPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLE9BQTRCLENBQUMsQ0FBQztLQUN2RjtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBZEQsZ0VBY0M7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLHdCQUF3QixDQUFDLE9BQWUsRUFBRSxNQUFxQixFQUFFLE9BQWdCO0lBQy9GLElBQUksQ0FBQyxJQUFBLHdCQUFhLEVBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLGtCQUFPLEVBQUMsT0FBTyxDQUFDLEVBQUU7UUFDaEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3BDO0lBRUQsSUFBSSxNQUFNLEtBQUssVUFBVSxFQUFFO1FBQ3pCLE9BQU8sNkJBQTZCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3hEO0lBRUQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1FBQ3hCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQTRCLENBQUMsQ0FBQztLQUNoRjtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBZEQsNERBY0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogV3JhcHBlciBhcm91bmQgYGNhc2hhZGRyZXNzYCBsaWJyYXJ5LlxyXG4gKlxyXG4gKiBQZXJmb3JtcyBzb21lIGFkZHJlc3Mgc2FuaXRhdGlvbjpcclxuICogLSBhZGQgcHJlZml4IGlmIG1pc3NpbmdcclxuICogLSBub3JtYWxpemUgdG8gbG93ZXItY2FzZVxyXG4gKiAtIHJlamVjdCBtaXhlZC1jYXNlXHJcbiAqXHJcbiAqIEJhc2VkIG9uIHRoZXNlIGRvY3VtZW50c1xyXG4gKlxyXG4gKiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luY2FzaG9yZy9iaXRjb2luY2FzaC5vcmcvYmxvYi9tYXN0ZXIvc3BlYy9jYXNoYWRkci5tZFxyXG4gKiAtIGh0dHBzOi8vd3d3LmJpdGNvaW5hYmMub3JnL2Nhc2hhZGRyL1xyXG4gKi9cclxuaW1wb3J0ICogYXMgY2FzaGFkZHJlc3MgZnJvbSAnY2FzaGFkZHJlc3MnO1xyXG5pbXBvcnQgKiBhcyBiaXRjb2luanMgZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcbmltcG9ydCB7IGdldE5ldHdvcmtOYW1lLCBpc0JpdGNvaW5DYXNoLCBpc0VDYXNoLCBOZXR3b3JrLCBuZXR3b3JrcyB9IGZyb20gJy4uLy4uL25ldHdvcmtzJztcclxuaW1wb3J0IHsgQWRkcmVzc0Zvcm1hdCB9IGZyb20gJy4uLy4uL2FkZHJlc3NGb3JtYXQnO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBuYW1lXHJcbiAqIEBwYXJhbSBvdXRwdXRcclxuICogQHJldHVybiB0aGUgZW5jb2RlZCBwdWJrZXloYXNoIG9yIHNjcmlwdGhhc2hcclxuICovXHJcbmZ1bmN0aW9uIGdldEhhc2hGcm9tT3V0cHV0U2NyaXB0KG5hbWU6IHN0cmluZywgb3V0cHV0OiBCdWZmZXIpOiBCdWZmZXIgfCB1bmRlZmluZWQge1xyXG4gIHR5cGUgUGF5bWVudEZ1bmMgPSAoeyBvdXRwdXQgfTogeyBvdXRwdXQ6IEJ1ZmZlciB9KSA9PiBiaXRjb2luanMuUGF5bWVudDtcclxuICBjb25zdCBmdW5jID0gKGJpdGNvaW5qcy5wYXltZW50cyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIFBheW1lbnRGdW5jPilbbmFtZV07XHJcbiAgaWYgKCFmdW5jKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5vIHBheW1lbnQgd2l0aCBuYW1lICR7bmFtZX1gKTtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBmdW5jKHsgb3V0cHV0IH0pLmhhc2g7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gbmV0d29ya1xyXG4gKiBAcmV0dXJuIG5ldHdvcmstc3BlY2lmaWMgY2FzaGFkZHIgcHJlZml4XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlZml4KG5ldHdvcms6IE5ldHdvcmspOiBzdHJpbmcge1xyXG4gIHN3aXRjaCAobmV0d29yaykge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgICAgcmV0dXJuICdiaXRjb2luY2FzaCc7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoVGVzdG5ldDpcclxuICAgICAgcmV0dXJuICdiY2h0ZXN0JztcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiAnZWNhc2gnO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaFRlc3Q6XHJcbiAgICAgIHJldHVybiAnZWN0ZXN0JztcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgcHJlZml4IGZvciAke2dldE5ldHdvcmtOYW1lKG5ldHdvcmspfWApO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBvdXRwdXRTY3JpcHRcclxuICogQHBhcmFtIG5ldHdvcmtcclxuICogQHJldHVybiBvdXRwdXRTY3JpcHQgZW5jb2RlZCBhcyBjYXNoYWRkciAocHJlZml4ZWQsIGxvd2VyY2FzZSlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tT3V0cHV0U2NyaXB0VG9DYXNoQWRkcmVzcyhvdXRwdXRTY3JpcHQ6IEJ1ZmZlciwgbmV0d29yazogTmV0d29yayk6IHN0cmluZyB7XHJcbiAgaWYgKCFpc0JpdGNvaW5DYXNoKG5ldHdvcmspICYmICFpc0VDYXNoKG5ldHdvcmspKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG4gIH1cclxuICBmb3IgKGNvbnN0IFtwYXltZW50TmFtZSwgc2NyaXB0VHlwZV0gb2YgW1xyXG4gICAgWydwMnBraCcsICdwdWJrZXloYXNoJ10sXHJcbiAgICBbJ3Ayc2gnLCAnc2NyaXB0aGFzaCddLFxyXG4gIF0pIHtcclxuICAgIGNvbnN0IGhhc2ggPSBnZXRIYXNoRnJvbU91dHB1dFNjcmlwdChwYXltZW50TmFtZSwgb3V0cHV0U2NyaXB0KTtcclxuICAgIGlmIChoYXNoKSB7XHJcbiAgICAgIHJldHVybiBjYXNoYWRkcmVzcy5lbmNvZGUoZ2V0UHJlZml4KG5ldHdvcmspLCBzY3JpcHRUeXBlIGFzIGNhc2hhZGRyZXNzLlNjcmlwdFR5cGUsIGhhc2gpO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBkZXRlcm1pbmUgaGFzaCBmb3Igb3V0cHV0U2NyaXB0YCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gYWRkcmVzcyAtIEFjY2VwdHMgYWRkcmVzc2VzIHdpdGggYW5kIHdpdGhvdXQgcHJlZml4LiBBY2NlcHRzIGFsbC1sb3dlcmNhc2UgYW5kIGFsbC11cHBlcmNhc2UgYWRkcmVzc2VzLiBSZWplY3RzIG1peGVkLWNhc2UgYWRkcmVzc2VzLlxyXG4gKiBAcGFyYW0gbmV0d29ya1xyXG4gKiBAcmV0dXJuIGRlY29kZWQgb3V0cHV0IHNjcmlwdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHRvT3V0cHV0U2NyaXB0RnJvbUNhc2hBZGRyZXNzKGFkZHJlc3M6IHN0cmluZywgbmV0d29yazogTmV0d29yayk6IEJ1ZmZlciB7XHJcbiAgaWYgKCFpc0JpdGNvaW5DYXNoKG5ldHdvcmspICYmICFpc0VDYXNoKG5ldHdvcmspKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG4gIH1cclxuICBpZiAoYWRkcmVzcyA9PT0gYWRkcmVzcy50b1VwcGVyQ2FzZSgpKSB7XHJcbiAgICBhZGRyZXNzID0gYWRkcmVzcy50b0xvd2VyQ2FzZSgpO1xyXG4gIH1cclxuICBpZiAoYWRkcmVzcyAhPT0gYWRkcmVzcy50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG1peGVkLWNhc2UgYWRkcmVzc2VzIG5vdCBhbGxvd2VkYCk7XHJcbiAgfVxyXG4gIGlmICghYWRkcmVzcy5zdGFydHNXaXRoKGdldFByZWZpeChuZXR3b3JrKSArICc6JykpIHtcclxuICAgIGFkZHJlc3MgPSBgJHtnZXRQcmVmaXgobmV0d29yayl9OiR7YWRkcmVzc31gO1xyXG4gIH1cclxuICBjb25zdCBkZWNvZGVkID0gY2FzaGFkZHJlc3MuZGVjb2RlKGFkZHJlc3MpO1xyXG4gIGxldCBvdXRwdXRTY3JpcHQ6IEJ1ZmZlciB8IHVuZGVmaW5lZDtcclxuICBzd2l0Y2ggKGRlY29kZWQudmVyc2lvbikge1xyXG4gICAgY2FzZSAnc2NyaXB0aGFzaCc6XHJcbiAgICAgIG91dHB1dFNjcmlwdCA9IGJpdGNvaW5qcy5wYXltZW50cy5wMnNoKHsgaGFzaDogZGVjb2RlZC5oYXNoIH0pLm91dHB1dDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdwdWJrZXloYXNoJzpcclxuICAgICAgb3V0cHV0U2NyaXB0ID0gYml0Y29pbmpzLnBheW1lbnRzLnAycGtoKHsgaGFzaDogZGVjb2RlZC5oYXNoIH0pLm91dHB1dDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdmVyc2lvbiAke2RlY29kZWQudmVyc2lvbn1gKTtcclxuICB9XHJcbiAgaWYgKCFvdXRwdXRTY3JpcHQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgY291bGQgbm90IGRldGVybWluZSBvdXRwdXQgc2NyaXB0YCk7XHJcbiAgfVxyXG4gIHJldHVybiBvdXRwdXRTY3JpcHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gb3V0cHV0U2NyaXB0XHJcbiAqIEBwYXJhbSBmb3JtYXRcclxuICogQHBhcmFtIG5ldHdvcmtcclxuICogQHJldHVybiBhZGRyZXNzIGluIHNwZWNpZmllZCBmb3JtYXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tT3V0cHV0U2NyaXB0V2l0aEZvcm1hdChvdXRwdXRTY3JpcHQ6IEJ1ZmZlciwgZm9ybWF0OiBBZGRyZXNzRm9ybWF0LCBuZXR3b3JrOiBOZXR3b3JrKTogc3RyaW5nIHtcclxuICBpZiAoIWlzQml0Y29pbkNhc2gobmV0d29yaykgJiYgIWlzRUNhc2gobmV0d29yaykpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XHJcbiAgfVxyXG5cclxuICBpZiAoZm9ybWF0ID09PSAnY2FzaGFkZHInKSB7XHJcbiAgICByZXR1cm4gZnJvbU91dHB1dFNjcmlwdFRvQ2FzaEFkZHJlc3Mob3V0cHV0U2NyaXB0LCBuZXR3b3JrKTtcclxuICB9XHJcblxyXG4gIGlmIChmb3JtYXQgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgcmV0dXJuIGJpdGNvaW5qcy5hZGRyZXNzLmZyb21PdXRwdXRTY3JpcHQob3V0cHV0U2NyaXB0LCBuZXR3b3JrIGFzIGJpdGNvaW5qcy5OZXR3b3JrKTtcclxuICB9XHJcblxyXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBmb3JtYXRgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBhZGRyZXNzXHJcbiAqIEBwYXJhbSBmb3JtYXRcclxuICogQHBhcmFtIG5ldHdvcmtcclxuICogQHJldHVybiBvdXRwdXQgc2NyaXB0IGZyb20gYWRkcmVzcyBpbiBzcGVjaWZpZWQgZm9ybWF0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9PdXRwdXRTY3JpcHRXaXRoRm9ybWF0KGFkZHJlc3M6IHN0cmluZywgZm9ybWF0OiBBZGRyZXNzRm9ybWF0LCBuZXR3b3JrOiBOZXR3b3JrKTogQnVmZmVyIHtcclxuICBpZiAoIWlzQml0Y29pbkNhc2gobmV0d29yaykgJiYgIWlzRUNhc2gobmV0d29yaykpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XHJcbiAgfVxyXG5cclxuICBpZiAoZm9ybWF0ID09PSAnY2FzaGFkZHInKSB7XHJcbiAgICByZXR1cm4gdG9PdXRwdXRTY3JpcHRGcm9tQ2FzaEFkZHJlc3MoYWRkcmVzcywgbmV0d29yayk7XHJcbiAgfVxyXG5cclxuICBpZiAoZm9ybWF0ID09PSAnZGVmYXVsdCcpIHtcclxuICAgIHJldHVybiBiaXRjb2luanMuYWRkcmVzcy50b091dHB1dFNjcmlwdChhZGRyZXNzLCBuZXR3b3JrIGFzIGJpdGNvaW5qcy5OZXR3b3JrKTtcclxuICB9XHJcblxyXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBmb3JtYXRgKTtcclxufVxyXG4iXX0=