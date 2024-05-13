"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const childProcess = require("child_process");
const src_1 = require("../../src");
const fixtures_1 = require("./fixtures");
function downloadAndUnpackTestFixtures(network) {
    const fixtureInfo = (0, fixtures_1.getFixtureInfo)(network);
    const archivePath = `/tmp/${(0, src_1.getNetworkName)(network)}.tar.gz`;
    if (!fs.existsSync(archivePath)) {
        childProcess.execFileSync('wget', [(0, fixtures_1.getArchiveUrl)(fixtureInfo), '--quiet', `-O${archivePath}`, '--no-clobber']);
    }
    childProcess.execFileSync('tar', [
        '-xf',
        archivePath,
        `--directory=test/fixtures_thirdparty/nodes/`,
        `${(0, fixtures_1.getArchiveRoot)(fixtureInfo)}/src/test/data/${fixtures_1.sigHashTestFile}`,
        `${(0, fixtures_1.getArchiveRoot)(fixtureInfo)}/src/test/data/${fixtures_1.txValidTestFile}`,
    ]);
}
async function main() {
    for (const network of (0, src_1.getNetworkList)().filter(src_1.isMainnet)) {
        downloadAndUnpackTestFixtures(network);
        console.log(`${(0, src_1.getNetworkName)(network)} done`);
    }
}
if (require.main === module) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2ZpeHR1cmVzX3RoaXJkcGFydHkvZG93bmxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsOENBQThDO0FBRTlDLG1DQUErRTtBQUMvRSx5Q0FBNkc7QUFFN0csU0FBUyw2QkFBNkIsQ0FBQyxPQUFnQjtJQUNyRCxNQUFNLFdBQVcsR0FBRyxJQUFBLHlCQUFjLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsTUFBTSxXQUFXLEdBQUcsUUFBUSxJQUFBLG9CQUFjLEVBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztJQUM3RCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUMvQixZQUFZLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUEsd0JBQWEsRUFBQyxXQUFXLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxXQUFXLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0tBQ2hIO0lBRUQsWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7UUFDL0IsS0FBSztRQUNMLFdBQVc7UUFDWCw2Q0FBNkM7UUFDN0MsR0FBRyxJQUFBLHlCQUFjLEVBQUMsV0FBVyxDQUFDLGtCQUFrQiwwQkFBZSxFQUFFO1FBQ2pFLEdBQUcsSUFBQSx5QkFBYyxFQUFDLFdBQVcsQ0FBQyxrQkFBa0IsMEJBQWUsRUFBRTtLQUNsRSxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLElBQUk7SUFDakIsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFBLG9CQUFjLEdBQUUsQ0FBQyxNQUFNLENBQUMsZUFBUyxDQUFDLEVBQUU7UUFDeEQsNkJBQTZCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUEsb0JBQWMsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDaEQ7QUFDSCxDQUFDO0FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUNqQixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcclxuaW1wb3J0ICogYXMgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5cclxuaW1wb3J0IHsgTmV0d29yaywgZ2V0TmV0d29ya0xpc3QsIGdldE5ldHdvcmtOYW1lLCBpc01haW5uZXQgfSBmcm9tICcuLi8uLi9zcmMnO1xyXG5pbXBvcnQgeyBnZXRBcmNoaXZlVXJsLCBnZXRGaXh0dXJlSW5mbywgZ2V0QXJjaGl2ZVJvb3QsIHNpZ0hhc2hUZXN0RmlsZSwgdHhWYWxpZFRlc3RGaWxlIH0gZnJvbSAnLi9maXh0dXJlcyc7XHJcblxyXG5mdW5jdGlvbiBkb3dubG9hZEFuZFVucGFja1Rlc3RGaXh0dXJlcyhuZXR3b3JrOiBOZXR3b3JrKSB7XHJcbiAgY29uc3QgZml4dHVyZUluZm8gPSBnZXRGaXh0dXJlSW5mbyhuZXR3b3JrKTtcclxuICBjb25zdCBhcmNoaXZlUGF0aCA9IGAvdG1wLyR7Z2V0TmV0d29ya05hbWUobmV0d29yayl9LnRhci5nemA7XHJcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGFyY2hpdmVQYXRoKSkge1xyXG4gICAgY2hpbGRQcm9jZXNzLmV4ZWNGaWxlU3luYygnd2dldCcsIFtnZXRBcmNoaXZlVXJsKGZpeHR1cmVJbmZvKSwgJy0tcXVpZXQnLCBgLU8ke2FyY2hpdmVQYXRofWAsICctLW5vLWNsb2JiZXInXSk7XHJcbiAgfVxyXG5cclxuICBjaGlsZFByb2Nlc3MuZXhlY0ZpbGVTeW5jKCd0YXInLCBbXHJcbiAgICAnLXhmJyxcclxuICAgIGFyY2hpdmVQYXRoLFxyXG4gICAgYC0tZGlyZWN0b3J5PXRlc3QvZml4dHVyZXNfdGhpcmRwYXJ0eS9ub2Rlcy9gLFxyXG4gICAgYCR7Z2V0QXJjaGl2ZVJvb3QoZml4dHVyZUluZm8pfS9zcmMvdGVzdC9kYXRhLyR7c2lnSGFzaFRlc3RGaWxlfWAsXHJcbiAgICBgJHtnZXRBcmNoaXZlUm9vdChmaXh0dXJlSW5mbyl9L3NyYy90ZXN0L2RhdGEvJHt0eFZhbGlkVGVzdEZpbGV9YCxcclxuICBdKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcclxuICBmb3IgKGNvbnN0IG5ldHdvcmsgb2YgZ2V0TmV0d29ya0xpc3QoKS5maWx0ZXIoaXNNYWlubmV0KSkge1xyXG4gICAgZG93bmxvYWRBbmRVbnBhY2tUZXN0Rml4dHVyZXMobmV0d29yayk7XHJcbiAgICBjb25zb2xlLmxvZyhgJHtnZXROZXR3b3JrTmFtZShuZXR3b3JrKX0gZG9uZWApO1xyXG4gIH1cclxufVxyXG5cclxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XHJcbiAgbWFpbigpLmNhdGNoKChlKSA9PiB7XHJcbiAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xyXG4gIH0pO1xyXG59XHJcbiJdfQ==