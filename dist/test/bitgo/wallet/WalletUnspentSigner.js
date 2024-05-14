"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const bitgo_1 = require("../../../src/bitgo");
const testutil_1 = require("../../../src/testutil");
describe('WalletUnspentSigner', function () {
    it('derives expected keys', function () {
        const keys = (0, testutil_1.getDefaultWalletKeys)();
        const derivedWalletKeys = keys.deriveForChainAndIndex(1, 2);
        const signer = new bitgo_1.WalletUnspentSigner(keys, keys.user, keys.bitgo);
        const derivedSigner = signer.deriveForChainAndIndex(1, 2);
        assert.deepStrictEqual(derivedSigner.walletKeys.publicKeys, derivedWalletKeys.publicKeys);
        assert.deepStrictEqual(derivedSigner.signer, derivedWalletKeys.user);
        assert.deepStrictEqual(derivedSigner.cosigner, derivedWalletKeys.bitgo);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2FsbGV0VW5zcGVudFNpZ25lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvYml0Z28vd2FsbGV0L1dhbGxldFVuc3BlbnRTaWduZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFFakMsOENBQXlEO0FBQ3pELG9EQUE2RDtBQUU3RCxRQUFRLENBQUMscUJBQXFCLEVBQUU7SUFDOUIsRUFBRSxDQUFDLHVCQUF1QixFQUFFO1FBQzFCLE1BQU0sSUFBSSxHQUFHLElBQUEsK0JBQW9CLEdBQUUsQ0FBQztRQUNwQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUQsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQkFBbUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEUsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRCxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUUsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5cclxuaW1wb3J0IHsgV2FsbGV0VW5zcGVudFNpZ25lciB9IGZyb20gJy4uLy4uLy4uL3NyYy9iaXRnbyc7XHJcbmltcG9ydCB7IGdldERlZmF1bHRXYWxsZXRLZXlzIH0gZnJvbSAnLi4vLi4vLi4vc3JjL3Rlc3R1dGlsJztcclxuXHJcbmRlc2NyaWJlKCdXYWxsZXRVbnNwZW50U2lnbmVyJywgZnVuY3Rpb24gKCkge1xyXG4gIGl0KCdkZXJpdmVzIGV4cGVjdGVkIGtleXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBrZXlzID0gZ2V0RGVmYXVsdFdhbGxldEtleXMoKTtcclxuICAgIGNvbnN0IGRlcml2ZWRXYWxsZXRLZXlzID0ga2V5cy5kZXJpdmVGb3JDaGFpbkFuZEluZGV4KDEsIDIpO1xyXG4gICAgY29uc3Qgc2lnbmVyID0gbmV3IFdhbGxldFVuc3BlbnRTaWduZXIoa2V5cywga2V5cy51c2VyLCBrZXlzLmJpdGdvKTtcclxuICAgIGNvbnN0IGRlcml2ZWRTaWduZXIgPSBzaWduZXIuZGVyaXZlRm9yQ2hhaW5BbmRJbmRleCgxLCAyKTtcclxuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoZGVyaXZlZFNpZ25lci53YWxsZXRLZXlzLnB1YmxpY0tleXMsIGRlcml2ZWRXYWxsZXRLZXlzLnB1YmxpY0tleXMpO1xyXG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChkZXJpdmVkU2lnbmVyLnNpZ25lciwgZGVyaXZlZFdhbGxldEtleXMudXNlcik7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKGRlcml2ZWRTaWduZXIuY29zaWduZXIsIGRlcml2ZWRXYWxsZXRLZXlzLmJpdGdvKTtcclxuICB9KTtcclxufSk7XHJcbiJdfQ==