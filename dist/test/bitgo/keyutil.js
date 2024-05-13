"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('assert');
const crypto = require('crypto');
const keyutil_1 = require("../../src/bitgo/keyutil");
const noble_ecc_1 = require("../../src/noble_ecc");
describe('privateKeyBufferFromECPair', function () {
    it('pads short private keys', function () {
        const keyPair = noble_ecc_1.ECPair.fromPrivateKey(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex'));
        assert.strictEqual((0, keyutil_1.privateKeyBufferFromECPair)(keyPair).length, 32);
        assert.strictEqual((0, keyutil_1.privateKeyBufferFromECPair)(keyPair).toString('hex'), '0000000000000000000000000000000000000000000000000000000000000001');
    });
    it('does not pad 32 bytes private keys', function () {
        const hexString = 'a000000000000000000000000000000000000000000000000000000000000000';
        const keyPair = noble_ecc_1.ECPair.fromPrivateKey(Buffer.from(hexString, 'hex'));
        assert.strictEqual((0, keyutil_1.privateKeyBufferFromECPair)(keyPair).length, 32);
        assert.strictEqual((0, keyutil_1.privateKeyBufferFromECPair)(keyPair).toString('hex'), hexString);
    });
    it('throws if passed value is not ecpair', function () {
        assert.throws(function () {
            (0, keyutil_1.privateKeyBufferFromECPair)({});
        }, new RegExp('invalid argument ecpair'));
    });
});
describe('privateKeyBufferToECPair', function () {
    it('constructs an ECPair from a random private key buffer', function () {
        const prvKeyBuffer = crypto.randomBytes(32);
        const ecPair = (0, keyutil_1.privateKeyBufferToECPair)(prvKeyBuffer);
        const ecPairPrvBuffer = (0, keyutil_1.privateKeyBufferFromECPair)(ecPair);
        assert.strictEqual(Buffer.compare(ecPairPrvBuffer, prvKeyBuffer), 0);
    });
    it('throws if the private key buffer is not a buffer', function () {
        assert.throws(function () {
            (0, keyutil_1.privateKeyBufferToECPair)('not a buffer');
        }, new RegExp('invalid private key buffer'));
    });
    it('throws if the private key buffer is not 32 bytes', function () {
        assert.throws(function () {
            (0, keyutil_1.privateKeyBufferToECPair)(Buffer.alloc(31, 0x00));
        }, new RegExp('invalid private key buffer'));
        assert.throws(function () {
            (0, keyutil_1.privateKeyBufferToECPair)(Buffer.alloc(33, 0x00));
        }, new RegExp('invalid private key buffer'));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5dXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvYml0Z28va2V5dXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFHakMscURBQStGO0FBQy9GLG1EQUE2QztBQUU3QyxRQUFRLENBQUMsNEJBQTRCLEVBQUU7SUFDckMsRUFBRSxDQUFDLHlCQUF5QixFQUFFO1FBQzVCLE1BQU0sT0FBTyxHQUFHLGtCQUFNLENBQUMsY0FBYyxDQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssQ0FBQyxDQUN2RixDQUFDO1FBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLG9DQUEwQixFQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuRSxNQUFNLENBQUMsV0FBVyxDQUNoQixJQUFBLG9DQUEwQixFQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFDbkQsa0VBQWtFLENBQ25FLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtRQUN2QyxNQUFNLFNBQVMsR0FBRyxrRUFBa0UsQ0FBQztRQUNyRixNQUFNLE9BQU8sR0FBRyxrQkFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxvQ0FBMEIsRUFBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLG9DQUEwQixFQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNyRixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRTtRQUN6QyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ1osSUFBQSxvQ0FBMEIsRUFBQyxFQUFxQixDQUFDLENBQUM7UUFDcEQsQ0FBQyxFQUFFLElBQUksTUFBTSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsUUFBUSxDQUFDLDBCQUEwQixFQUFFO0lBQ25DLEVBQUUsQ0FBQyx1REFBdUQsRUFBRTtRQUMxRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLElBQUEsa0NBQXdCLEVBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEQsTUFBTSxlQUFlLEdBQUcsSUFBQSxvQ0FBMEIsRUFBQyxNQUFNLENBQUMsQ0FBQztRQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGtEQUFrRCxFQUFFO1FBQ3JELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDWixJQUFBLGtDQUF3QixFQUFDLGNBQXFCLENBQUMsQ0FBQztRQUNsRCxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGtEQUFrRCxFQUFFO1FBQ3JELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDWixJQUFBLGtDQUF3QixFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxFQUFFLElBQUksTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQztRQUU3QyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ1osSUFBQSxrQ0FBd0IsRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xyXG5jb25zdCBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTtcclxuXHJcbmltcG9ydCB7IEVDUGFpckludGVyZmFjZSB9IGZyb20gJ2VjcGFpcic7XHJcbmltcG9ydCB7IHByaXZhdGVLZXlCdWZmZXJGcm9tRUNQYWlyLCBwcml2YXRlS2V5QnVmZmVyVG9FQ1BhaXIgfSBmcm9tICcuLi8uLi9zcmMvYml0Z28va2V5dXRpbCc7XHJcbmltcG9ydCB7IEVDUGFpciB9IGZyb20gJy4uLy4uL3NyYy9ub2JsZV9lY2MnO1xyXG5cclxuZGVzY3JpYmUoJ3ByaXZhdGVLZXlCdWZmZXJGcm9tRUNQYWlyJywgZnVuY3Rpb24gKCkge1xyXG4gIGl0KCdwYWRzIHNob3J0IHByaXZhdGUga2V5cycsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IGtleVBhaXIgPSBFQ1BhaXIuZnJvbVByaXZhdGVLZXkoXHJcbiAgICAgIEJ1ZmZlci5mcm9tKCcwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxJywgJ2hleCcpXHJcbiAgICApO1xyXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHByaXZhdGVLZXlCdWZmZXJGcm9tRUNQYWlyKGtleVBhaXIpLmxlbmd0aCwgMzIpO1xyXG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKFxyXG4gICAgICBwcml2YXRlS2V5QnVmZmVyRnJvbUVDUGFpcihrZXlQYWlyKS50b1N0cmluZygnaGV4JyksXHJcbiAgICAgICcwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxJ1xyXG4gICAgKTtcclxuICB9KTtcclxuXHJcbiAgaXQoJ2RvZXMgbm90IHBhZCAzMiBieXRlcyBwcml2YXRlIGtleXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBoZXhTdHJpbmcgPSAnYTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCc7XHJcbiAgICBjb25zdCBrZXlQYWlyID0gRUNQYWlyLmZyb21Qcml2YXRlS2V5KEJ1ZmZlci5mcm9tKGhleFN0cmluZywgJ2hleCcpKTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChwcml2YXRlS2V5QnVmZmVyRnJvbUVDUGFpcihrZXlQYWlyKS5sZW5ndGgsIDMyKTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChwcml2YXRlS2V5QnVmZmVyRnJvbUVDUGFpcihrZXlQYWlyKS50b1N0cmluZygnaGV4JyksIGhleFN0cmluZyk7XHJcbiAgfSk7XHJcblxyXG4gIGl0KCd0aHJvd3MgaWYgcGFzc2VkIHZhbHVlIGlzIG5vdCBlY3BhaXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgcHJpdmF0ZUtleUJ1ZmZlckZyb21FQ1BhaXIoe30gYXMgRUNQYWlySW50ZXJmYWNlKTtcclxuICAgIH0sIG5ldyBSZWdFeHAoJ2ludmFsaWQgYXJndW1lbnQgZWNwYWlyJykpO1xyXG4gIH0pO1xyXG59KTtcclxuXHJcbmRlc2NyaWJlKCdwcml2YXRlS2V5QnVmZmVyVG9FQ1BhaXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgaXQoJ2NvbnN0cnVjdHMgYW4gRUNQYWlyIGZyb20gYSByYW5kb20gcHJpdmF0ZSBrZXkgYnVmZmVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgcHJ2S2V5QnVmZmVyID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDMyKTtcclxuICAgIGNvbnN0IGVjUGFpciA9IHByaXZhdGVLZXlCdWZmZXJUb0VDUGFpcihwcnZLZXlCdWZmZXIpO1xyXG4gICAgY29uc3QgZWNQYWlyUHJ2QnVmZmVyID0gcHJpdmF0ZUtleUJ1ZmZlckZyb21FQ1BhaXIoZWNQYWlyKTtcclxuICAgIGFzc2VydC5zdHJpY3RFcXVhbChCdWZmZXIuY29tcGFyZShlY1BhaXJQcnZCdWZmZXIsIHBydktleUJ1ZmZlciksIDApO1xyXG4gIH0pO1xyXG5cclxuICBpdCgndGhyb3dzIGlmIHRoZSBwcml2YXRlIGtleSBidWZmZXIgaXMgbm90IGEgYnVmZmVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHByaXZhdGVLZXlCdWZmZXJUb0VDUGFpcignbm90IGEgYnVmZmVyJyBhcyBhbnkpO1xyXG4gICAgfSwgbmV3IFJlZ0V4cCgnaW52YWxpZCBwcml2YXRlIGtleSBidWZmZXInKSk7XHJcbiAgfSk7XHJcblxyXG4gIGl0KCd0aHJvd3MgaWYgdGhlIHByaXZhdGUga2V5IGJ1ZmZlciBpcyBub3QgMzIgYnl0ZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgcHJpdmF0ZUtleUJ1ZmZlclRvRUNQYWlyKEJ1ZmZlci5hbGxvYygzMSwgMHgwMCkpO1xyXG4gICAgfSwgbmV3IFJlZ0V4cCgnaW52YWxpZCBwcml2YXRlIGtleSBidWZmZXInKSk7XHJcblxyXG4gICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHByaXZhdGVLZXlCdWZmZXJUb0VDUGFpcihCdWZmZXIuYWxsb2MoMzMsIDB4MDApKTtcclxuICAgIH0sIG5ldyBSZWdFeHAoJ2ludmFsaWQgcHJpdmF0ZSBrZXkgYnVmZmVyJykpO1xyXG4gIH0pO1xyXG59KTtcclxuIl19