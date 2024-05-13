"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFixtureArray = exports.testFixture = exports.txValidTestFile = exports.sigHashTestFile = exports.readJSON = exports.readFile = exports.getFixtureInfo = exports.getArchiveRoot = exports.getArchiveUrl = void 0;
const fs = require("fs-extra");
const networks_1 = require("../../src/networks");
function getArchiveUrl(fixtureInfo) {
    return `http://github.com/${fixtureInfo.projectPath}/archive/refs/tags/${fixtureInfo.tag}.tar.gz`;
}
exports.getArchiveUrl = getArchiveUrl;
function getArchiveRoot(fixtureInfo) {
    const [, projectName] = fixtureInfo.projectPath.split('/');
    return `${projectName}-${fixtureInfo.tag.substr(1)}`;
}
exports.getArchiveRoot = getArchiveRoot;
function getFixtureInfo(network) {
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoin:
            return {
                projectPath: 'bitcoin/bitcoin',
                tag: 'v0.21.1',
            };
        case networks_1.networks.bitcoincash:
            return {
                projectPath: 'bitcoin-cash-node/bitcoin-cash-node',
                tag: 'v23.0.0',
            };
        case networks_1.networks.bitcoinsv:
            return {
                projectPath: 'bitcoin-sv/bitcoin-sv',
                tag: 'v1.0.8',
            };
        case networks_1.networks.bitcoingold:
            return {
                projectPath: 'BTCGPU/BTCGPU',
                tag: 'v0.17.3',
            };
        case networks_1.networks.dash:
            return {
                projectPath: 'dashpay/dash',
                tag: 'v0.17.0.3',
            };
        case networks_1.networks.ecash:
            return {
                projectPath: 'Bitcoin-ABC/bitcoin-abc',
                tag: 'v0.26.4',
            };
        case networks_1.networks.dogecoin:
            return {
                projectPath: 'dogecoin/dogecoin',
                tag: 'v1.14.5',
            };
        case networks_1.networks.litecoin:
            return {
                projectPath: 'litecoin-project/litecoin',
                tag: 'v0.18.1',
            };
        case networks_1.networks.zcash:
            return {
                projectPath: 'zcash/zcash',
                tag: 'v4.4.1',
            };
    }
    throw new Error(`${(0, networks_1.getNetworkName)(network)} not supported`);
}
exports.getFixtureInfo = getFixtureInfo;
async function readFile(network, path) {
    const root = getArchiveRoot(getFixtureInfo(network));
    return await fs.readFile(`test/fixtures_thirdparty/nodes/${root}/src/test/data/${path}`, 'utf8');
}
exports.readFile = readFile;
async function readJSON(network, path) {
    return JSON.parse(await readFile(network, path));
}
exports.readJSON = readJSON;
exports.sigHashTestFile = 'sighash.json';
exports.txValidTestFile = 'tx_valid.json';
function testFixture(ctx, network, filename, callback) {
    it(filename, async function () {
        callback.call(this, await readJSON(network, filename));
    });
}
exports.testFixture = testFixture;
function testFixtureArray(ctx, network, filename, callback) {
    testFixture(ctx, network, filename, function (arr) {
        callback.call(this, arr.filter((v) => v.length !== 1));
    });
}
exports.testFixtureArray = testFixtureArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2ZpeHR1cmVzX3RoaXJkcGFydHkvZml4dHVyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQStCO0FBQy9CLGlEQUFtRjtBQU9uRixTQUFnQixhQUFhLENBQUMsV0FBd0I7SUFDcEQsT0FBTyxxQkFBcUIsV0FBVyxDQUFDLFdBQVcsc0JBQXNCLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztBQUNwRyxDQUFDO0FBRkQsc0NBRUM7QUFFRCxTQUFnQixjQUFjLENBQUMsV0FBd0I7SUFDckQsTUFBTSxDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0QsT0FBTyxHQUFHLFdBQVcsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3ZELENBQUM7QUFIRCx3Q0FHQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxPQUFnQjtJQUM3QyxRQUFRLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsRUFBRTtRQUMzQixLQUFLLG1CQUFRLENBQUMsT0FBTztZQUNuQixPQUFPO2dCQUNMLFdBQVcsRUFBRSxpQkFBaUI7Z0JBQzlCLEdBQUcsRUFBRSxTQUFTO2FBQ2YsQ0FBQztRQUNKLEtBQUssbUJBQVEsQ0FBQyxXQUFXO1lBQ3ZCLE9BQU87Z0JBQ0wsV0FBVyxFQUFFLHFDQUFxQztnQkFDbEQsR0FBRyxFQUFFLFNBQVM7YUFDZixDQUFDO1FBQ0osS0FBSyxtQkFBUSxDQUFDLFNBQVM7WUFDckIsT0FBTztnQkFDTCxXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxHQUFHLEVBQUUsUUFBUTthQUNkLENBQUM7UUFDSixLQUFLLG1CQUFRLENBQUMsV0FBVztZQUN2QixPQUFPO2dCQUNMLFdBQVcsRUFBRSxlQUFlO2dCQUM1QixHQUFHLEVBQUUsU0FBUzthQUNmLENBQUM7UUFDSixLQUFLLG1CQUFRLENBQUMsSUFBSTtZQUNoQixPQUFPO2dCQUNMLFdBQVcsRUFBRSxjQUFjO2dCQUMzQixHQUFHLEVBQUUsV0FBVzthQUNqQixDQUFDO1FBQ0osS0FBSyxtQkFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTztnQkFDTCxXQUFXLEVBQUUseUJBQXlCO2dCQUN0QyxHQUFHLEVBQUUsU0FBUzthQUNmLENBQUM7UUFDSixLQUFLLG1CQUFRLENBQUMsUUFBUTtZQUNwQixPQUFPO2dCQUNMLFdBQVcsRUFBRSxtQkFBbUI7Z0JBQ2hDLEdBQUcsRUFBRSxTQUFTO2FBQ2YsQ0FBQztRQUNKLEtBQUssbUJBQVEsQ0FBQyxRQUFRO1lBQ3BCLE9BQU87Z0JBQ0wsV0FBVyxFQUFFLDJCQUEyQjtnQkFDeEMsR0FBRyxFQUFFLFNBQVM7YUFDZixDQUFDO1FBQ0osS0FBSyxtQkFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTztnQkFDTCxXQUFXLEVBQUUsYUFBYTtnQkFDMUIsR0FBRyxFQUFFLFFBQVE7YUFDZCxDQUFDO0tBQ0w7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBQSx5QkFBYyxFQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFqREQsd0NBaURDO0FBRU0sS0FBSyxVQUFVLFFBQVEsQ0FBQyxPQUFnQixFQUFFLElBQVk7SUFDM0QsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLGtDQUFrQyxJQUFJLGtCQUFrQixJQUFJLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNuRyxDQUFDO0FBSEQsNEJBR0M7QUFFTSxLQUFLLFVBQVUsUUFBUSxDQUFJLE9BQWdCLEVBQUUsSUFBWTtJQUM5RCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELDRCQUVDO0FBRVksUUFBQSxlQUFlLEdBQUcsY0FBYyxDQUFDO0FBc0JqQyxRQUFBLGVBQWUsR0FBRyxlQUFlLENBQUM7QUFPL0MsU0FBZ0IsV0FBVyxDQUN6QixHQUFnQixFQUNoQixPQUFnQixFQUNoQixRQUFnQixFQUNoQixRQUFnRDtJQUVoRCxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUs7UUFDaEIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBVEQsa0NBU0M7QUFFRCxTQUFnQixnQkFBZ0IsQ0FDOUIsR0FBZ0IsRUFDaEIsT0FBZ0IsRUFDaEIsUUFBZ0IsRUFDaEIsUUFBa0Q7SUFFbEQsV0FBVyxDQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFVBQVUsR0FBUTtRQUN6RCxRQUFRLENBQUMsSUFBSSxDQUNYLElBQUksRUFDSixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBVSxFQUFFLEVBQUUsQ0FBRSxDQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUN6RCxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBWkQsNENBWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCB7IE5ldHdvcmssIG5ldHdvcmtzLCBnZXRNYWlubmV0LCBnZXROZXR3b3JrTmFtZSB9IGZyb20gJy4uLy4uL3NyYy9uZXR3b3Jrcyc7XHJcblxyXG5leHBvcnQgdHlwZSBGaXh0dXJlSW5mbyA9IHtcclxuICBwcm9qZWN0UGF0aDogc3RyaW5nO1xyXG4gIHRhZzogc3RyaW5nO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFyY2hpdmVVcmwoZml4dHVyZUluZm86IEZpeHR1cmVJbmZvKTogc3RyaW5nIHtcclxuICByZXR1cm4gYGh0dHA6Ly9naXRodWIuY29tLyR7Zml4dHVyZUluZm8ucHJvamVjdFBhdGh9L2FyY2hpdmUvcmVmcy90YWdzLyR7Zml4dHVyZUluZm8udGFnfS50YXIuZ3pgO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXJjaGl2ZVJvb3QoZml4dHVyZUluZm86IEZpeHR1cmVJbmZvKTogc3RyaW5nIHtcclxuICBjb25zdCBbLCBwcm9qZWN0TmFtZV0gPSBmaXh0dXJlSW5mby5wcm9qZWN0UGF0aC5zcGxpdCgnLycpO1xyXG4gIHJldHVybiBgJHtwcm9qZWN0TmFtZX0tJHtmaXh0dXJlSW5mby50YWcuc3Vic3RyKDEpfWA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRGaXh0dXJlSW5mbyhuZXR3b3JrOiBOZXR3b3JrKTogRml4dHVyZUluZm8ge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHByb2plY3RQYXRoOiAnYml0Y29pbi9iaXRjb2luJyxcclxuICAgICAgICB0YWc6ICd2MC4yMS4xJyxcclxuICAgICAgfTtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcHJvamVjdFBhdGg6ICdiaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZScsXHJcbiAgICAgICAgdGFnOiAndjIzLjAuMCcsXHJcbiAgICAgIH07XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcm9qZWN0UGF0aDogJ2JpdGNvaW4tc3YvYml0Y29pbi1zdicsXHJcbiAgICAgICAgdGFnOiAndjEuMC44JyxcclxuICAgICAgfTtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcHJvamVjdFBhdGg6ICdCVENHUFUvQlRDR1BVJyxcclxuICAgICAgICB0YWc6ICd2MC4xNy4zJyxcclxuICAgICAgfTtcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcm9qZWN0UGF0aDogJ2Rhc2hwYXkvZGFzaCcsXHJcbiAgICAgICAgdGFnOiAndjAuMTcuMC4zJyxcclxuICAgICAgfTtcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcHJvamVjdFBhdGg6ICdCaXRjb2luLUFCQy9iaXRjb2luLWFiYycsXHJcbiAgICAgICAgdGFnOiAndjAuMjYuNCcsXHJcbiAgICAgIH07XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHByb2plY3RQYXRoOiAnZG9nZWNvaW4vZG9nZWNvaW4nLFxyXG4gICAgICAgIHRhZzogJ3YxLjE0LjUnLFxyXG4gICAgICB9O1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcm9qZWN0UGF0aDogJ2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4nLFxyXG4gICAgICAgIHRhZzogJ3YwLjE4LjEnLFxyXG4gICAgICB9O1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwcm9qZWN0UGF0aDogJ3pjYXNoL3pjYXNoJyxcclxuICAgICAgICB0YWc6ICd2NC40LjEnLFxyXG4gICAgICB9O1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoYCR7Z2V0TmV0d29ya05hbWUobmV0d29yayl9IG5vdCBzdXBwb3J0ZWRgKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRGaWxlKG5ldHdvcms6IE5ldHdvcmssIHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgY29uc3Qgcm9vdCA9IGdldEFyY2hpdmVSb290KGdldEZpeHR1cmVJbmZvKG5ldHdvcmspKTtcclxuICByZXR1cm4gYXdhaXQgZnMucmVhZEZpbGUoYHRlc3QvZml4dHVyZXNfdGhpcmRwYXJ0eS9ub2Rlcy8ke3Jvb3R9L3NyYy90ZXN0L2RhdGEvJHtwYXRofWAsICd1dGY4Jyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkSlNPTjxUPihuZXR3b3JrOiBOZXR3b3JrLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcclxuICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCByZWFkRmlsZShuZXR3b3JrLCBwYXRoKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzaWdIYXNoVGVzdEZpbGUgPSAnc2lnaGFzaC5qc29uJztcclxuXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpdGNvaW4vYmxvYi92MC4yMS4xL3NyYy90ZXN0L2RhdGEvc2lnaGFzaC5qc29uI0wyXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZS9ibG9iL21hc3Rlci9zcmMvdGVzdC9kYXRhL3NpZ2hhc2guanNvblxyXG5leHBvcnQgdHlwZSBTaWdIYXNoVGVzdFZlY3RvciA9IFtcclxuICByYXdUcmFuc2FjdGlvbjogc3RyaW5nLFxyXG4gIHNjcmlwdDogc3RyaW5nLFxyXG4gIGlucHV0SW5kZXg6IG51bWJlcixcclxuICBoYXNoVHlwZTogbnVtYmVyLFxyXG4gIHNpZ25hdHVyZUhhc2g6IHN0cmluZ1xyXG4gIC8vIEJDSCBhbmQgQlNWIGhhdmUgdHdvIGV4dHJhIGVudHJpZXMgdGhhdCB3ZSBkb24ndCBjYXJlIGFib3VudFxyXG5dO1xyXG5cclxuZXhwb3J0IHR5cGUgWmNhc2hTaWdIYXNoVGVzdFZlY3RvciA9IFtcclxuICByYXdUcmFuc2FjdGlvbjogc3RyaW5nLFxyXG4gIHNjcmlwdDogc3RyaW5nLFxyXG4gIGlucHV0SW5kZXg6IG51bWJlcixcclxuICBoYXNoVHlwZTogbnVtYmVyLFxyXG4gIGJyYW5jaElkOiBudW1iZXIsXHJcbiAgc2lnbmF0dXJlSGFzaDogc3RyaW5nXHJcbl07XHJcblxyXG5leHBvcnQgY29uc3QgdHhWYWxpZFRlc3RGaWxlID0gJ3R4X3ZhbGlkLmpzb24nO1xyXG5leHBvcnQgdHlwZSBUeFZhbGlkVmVjdG9yID0gW1xyXG4gIGlucHV0RGF0YTogW3ByZXZvdXRIYXNoOiBzdHJpbmcsIHByZXZvdXRJbmRleDogc3RyaW5nLCBwcmV2b3V0U2NyaXB0UHViS2V5OiBzdHJpbmddW10sXHJcbiAgc2VyaWFsaXplZFRyYW5zYWN0aW9uOiBzdHJpbmcsXHJcbiAgdmVyaWZ5RmxhZ3M6IHN0cmluZ1xyXG5dO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RGaXh0dXJlPFQ+KFxyXG4gIGN0eDogTW9jaGEuU3VpdGUsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICBmaWxlbmFtZTogc3RyaW5nLFxyXG4gIGNhbGxiYWNrOiAodGhpczogTW9jaGEuQ29udGV4dCwgZGF0YTogVCkgPT4gdm9pZFxyXG4pOiB2b2lkIHtcclxuICBpdChmaWxlbmFtZSwgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgY2FsbGJhY2suY2FsbCh0aGlzLCBhd2FpdCByZWFkSlNPTihuZXR3b3JrLCBmaWxlbmFtZSkpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGVzdEZpeHR1cmVBcnJheTxUPihcclxuICBjdHg6IE1vY2hhLlN1aXRlLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgZmlsZW5hbWU6IHN0cmluZyxcclxuICBjYWxsYmFjazogKHRoaXM6IE1vY2hhLkNvbnRleHQsIGRhdGE6IFRbXSkgPT4gdm9pZFxyXG4pOiB2b2lkIHtcclxuICB0ZXN0Rml4dHVyZTxUW10+KGN0eCwgbmV0d29yaywgZmlsZW5hbWUsIGZ1bmN0aW9uIChhcnI6IFRbXSkge1xyXG4gICAgY2FsbGJhY2suY2FsbChcclxuICAgICAgdGhpcyxcclxuICAgICAgYXJyLmZpbHRlcigodjogdW5rbm93bikgPT4gKHYgYXMgc3RyaW5nW10pLmxlbmd0aCAhPT0gMSlcclxuICAgICk7XHJcbiAgfSk7XHJcbn1cclxuIl19