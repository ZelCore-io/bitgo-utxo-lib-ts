"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegtestNodeUrl = exports.getRegtestNodeHelp = exports.getRegtestNode = void 0;
const crypto = require("crypto");
const util = require("util");
const child_process_1 = require("child_process");
const utxolib = require("../../../src");
const networks_1 = require("../../../src/networks");
const rpcPort = 18333;
const rpcUser = 'utxolib';
const rpcPassword = crypto.randomBytes(16).toString('hex');
function dockerImage(image, binary, extraArgsNode = [], extraArgsDocker = []) {
    return { image, binary, extraArgsNode, extraArgsDocker };
}
function getDockerParams(network) {
    switch (network) {
        case utxolib.networks.testnet:
            return dockerImage('ruimarinho/bitcoin-core:0.21.1', 'bitcoind', ['-fallbackfee=0.0001']);
        case utxolib.networks.bitcoincashTestnet:
            return dockerImage('zquestz/bitcoin-cash-node:23.0.0', 'bitcoind', ['-usecashaddr=0']);
        case utxolib.networks.bitcoinsvTestnet:
            return dockerImage('bitcoinsv/bitcoin-sv:1.0.5', 'bitcoind', [
                '-excessiveblocksize=0',
                '-maxstackmemoryusageconsensus=0',
            ]);
        case utxolib.networks.bitcoingoldTestnet:
            return dockerImage('uphold/bitcoin-gold:0.17.3', 'bgoldd');
        case utxolib.networks.dashTest:
            return dockerImage('dashpay/dashd:0.16.1.1', 'dashd');
        case utxolib.networks.dogecoinTest:
            return dockerImage('williamqinbitgo/dogeimage:1.14.5-v3', 'dogecoind');
        case utxolib.networks.ecashTest:
            return dockerImage('bitcoinabc/bitcoin-abc:0.26.9', 'bitcoind', ['-ecash=0 -usecashaddr=0']);
        case utxolib.networks.litecoinTest:
            return dockerImage('uphold/litecoin-core:0.17.1', 'litecoind');
        case utxolib.networks.zcashTest:
            const paramsDir = process.env.ZCASH_PARAMS_DIR;
            if (!paramsDir) {
                throw new Error(`envvar ZCASH_PARAMS_DIR not set`);
            }
            return dockerImage('electriccoinco/zcashd:v4.7.0', undefined, // `zcashd` is implicit
            [
                '-nuparams=5ba81b19:10',
                '-nuparams=76b809bb:20',
                '-nuparams=2bb40e60:30',
                '-nuparams=f5b9230b:40',
                '-nuparams=e9ff75a6:400',
                // https://zips.z.cash/zip-0252
                '-nuparams=c2d6d0b4:500',
            ], [`--volume=${paramsDir}:/srv/zcashd/.zcash-params`]);
    }
    throw new Error(`unsupported network ${(0, networks_1.getNetworkName)(network)}`);
}
async function getRegtestNode(network) {
    const dockerParams = getDockerParams(network);
    const args = [
        'run',
        `--publish=${rpcPort}:${rpcPort}`,
        ...dockerParams.extraArgsDocker,
        dockerParams.image,
        ...(dockerParams.binary ? [dockerParams.binary] : []),
        '-regtest',
        '-txindex',
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        `-rpcbind=0.0.0.0:${rpcPort}`,
        `-rpcallowip=0.0.0.0/0`,
        ...dockerParams.extraArgsNode,
    ];
    let stdio = 'ignore';
    if (process.env.UTXOLIB_TESTS_LOG_DOCKER === '1') {
        stdio = 'inherit';
    }
    const proc = (0, child_process_1.spawn)('docker', args, { stdio });
    return {
        stop() {
            proc.kill();
            return new Promise((resolve, reject) => {
                proc.on('exit', (code, signal) => {
                    if (code === 0) {
                        return resolve();
                    }
                    reject(new Error(`code=${code} signal=${signal}`));
                });
            });
        },
    };
}
exports.getRegtestNode = getRegtestNode;
async function getRegtestNodeHelp(network) {
    const dockerParams = getDockerParams(network);
    const args = [
        'run',
        ...dockerParams.extraArgsDocker,
        dockerParams.image,
        ...(dockerParams.binary ? [dockerParams.binary] : []),
        '--help',
        '-help-debug',
        '-regtest',
    ];
    return await util.promisify(child_process_1.execFile)('docker', args);
}
exports.getRegtestNodeHelp = getRegtestNodeHelp;
function getRegtestNodeUrl(network) {
    return `http://${rpcUser}:${rpcPassword}@localhost:${rpcPort}`;
}
exports.getRegtestNodeUrl = getRegtestNodeUrl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVndGVzdE5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2ludGVncmF0aW9uX2xvY2FsX3JwYy9nZW5lcmF0ZS9yZWd0ZXN0Tm9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsNkJBQTZCO0FBQzdCLGlEQUFnRDtBQUVoRCx3Q0FBd0M7QUFDeEMsb0RBQWdFO0FBU2hFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQztBQUN0QixNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFDMUIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFM0QsU0FBUyxXQUFXLENBQ2xCLEtBQWEsRUFDYixNQUEwQixFQUMxQixnQkFBMEIsRUFBRSxFQUM1QixrQkFBNEIsRUFBRTtJQUU5QixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLENBQUM7QUFDM0QsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLE9BQWdCO0lBQ3ZDLFFBQVEsT0FBTyxFQUFFO1FBQ2YsS0FBSyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU87WUFDM0IsT0FBTyxXQUFXLENBQUMsZ0NBQWdDLEVBQUUsVUFBVSxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBQzVGLEtBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0I7WUFDdEMsT0FBTyxXQUFXLENBQUMsa0NBQWtDLEVBQUUsVUFBVSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLEtBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0I7WUFDcEMsT0FBTyxXQUFXLENBQUMsNEJBQTRCLEVBQUUsVUFBVSxFQUFFO2dCQUMzRCx1QkFBdUI7Z0JBQ3ZCLGlDQUFpQzthQUNsQyxDQUFDLENBQUM7UUFDTCxL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RSxDQUFDLENBQUMsQ0FBQztnQkFDckQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXJDRCx3Q0FxQ0M7QUFFTSxLQUFLLFVBQVUsa0JBQWtCLENBQUMsT0FBZ0I7SUFDdkQsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLE1BQU0sSUFBSSxHQUFHO1FBQ1gsS0FBSztRQUNMLEdBQUcsWUFBWSxDQUFDLGVBQWU7UUFDL0IsWUFBWSxDQUFDLEtBQUs7UUFDbEIsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDckQsUUFBUTtRQUNSLGFBQWE7UUFDYixVQUFVO0tBQ1gsQ0FBQztJQUVGLE9BQU8sTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQWJELGdEQWFDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsT0FBZ0I7SUFDaEQsT0FBTyxVQUFVLE9BQU8sSUFBSSxXQUFXLGNBQWMsT0FBTyxFQUFFLENBQUM7QUFDakUsQ0FBQztBQUZELDhDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XHJcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XHJcbmltcG9ydCB7IHNwYXduLCBleGVjRmlsZSB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5cclxuaW1wb3J0ICogYXMgdXR4b2xpYiBmcm9tICcuLi8uLi8uLi9zcmMnO1xyXG5pbXBvcnQgeyBOZXR3b3JrLCBnZXROZXR3b3JrTmFtZSB9IGZyb20gJy4uLy4uLy4uL3NyYy9uZXR3b3Jrcyc7XHJcblxyXG50eXBlIERvY2tlckltYWdlUGFyYW1zID0ge1xyXG4gIGV4dHJhQXJnc0RvY2tlcjogc3RyaW5nW107XHJcbiAgaW1hZ2U6IHN0cmluZztcclxuICBiaW5hcnk6IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuICBleHRyYUFyZ3NOb2RlOiBzdHJpbmdbXTtcclxufTtcclxuXHJcbmNvbnN0IHJwY1BvcnQgPSAxODMzMztcclxuY29uc3QgcnBjVXNlciA9ICd1dHhvbGliJztcclxuY29uc3QgcnBjUGFzc3dvcmQgPSBjcnlwdG8ucmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKCdoZXgnKTtcclxuXHJcbmZ1bmN0aW9uIGRvY2tlckltYWdlKFxyXG4gIGltYWdlOiBzdHJpbmcsXHJcbiAgYmluYXJ5OiBzdHJpbmcgfCB1bmRlZmluZWQsXHJcbiAgZXh0cmFBcmdzTm9kZTogc3RyaW5nW10gPSBbXSxcclxuICBleHRyYUFyZ3NEb2NrZXI6IHN0cmluZ1tdID0gW11cclxuKTogRG9ja2VySW1hZ2VQYXJhbXMge1xyXG4gIHJldHVybiB7IGltYWdlLCBiaW5hcnksIGV4dHJhQXJnc05vZGUsIGV4dHJhQXJnc0RvY2tlciB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREb2NrZXJQYXJhbXMobmV0d29yazogTmV0d29yayk6IERvY2tlckltYWdlUGFyYW1zIHtcclxuICBzd2l0Y2ggKG5ldHdvcmspIHtcclxuICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy50ZXN0bmV0OlxyXG4gICAgICByZXR1cm4gZG9ja2VySW1hZ2UoJ3J1aW1hcmluaG8vYml0Y29pbi1jb3JlOjAuMjEuMScsICdiaXRjb2luZCcsIFsnLWZhbGxiYWNrZmVlPTAuMDAwMSddKTtcclxuICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy5iaXRjb2luY2FzaFRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBkb2NrZXJJbWFnZSgnenF1ZXN0ei9iaXRjb2luLWNhc2gtbm9kZToyMy4wLjAnLCAnYml0Y29pbmQnLCBbJy11c2VjYXNoYWRkcj0wJ10pO1xyXG4gICAgY2FzZSB1dHhvbGliLm5ldHdvcmtzLmJpdGNvaW5zdlRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBkb2NrZXJJbWFnZSgnYml0Y29pbnN2L2JpdGNvaW4tc3Y6MS4wLjUnLCAnYml0Y29pbmQnLCBbXHJcbiAgICAgICAgJy1leGNlc3NpdmVibG9ja3NpemU9MCcsXHJcbiAgICAgICAgJy1tYXhzdGFja21lbW9yeXVzYWdlY29uc2Vuc3VzPTAnLFxyXG4gICAgICBdKTtcclxuICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy5iaXRjb2luZ29sZFRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBkb2NrZXJJbWFnZSgndXBob2xkL2JpdGNvaW4tZ29sZDowLjE3LjMnLCAnYmdvbGRkJyk7XHJcbiAgICBjYXNlIHV0eG9saWIubmV0d29ya3MuZGFzaFRlc3Q6XHJcbiAgICAgIHJldHVybiBkb2NrZXJJbWFnZSgnZGFzaHBheS9kYXNoZDowLjE2LjEuMScsICdkYXNoZCcpO1xyXG4gICAgY2FzZSB1dHhvbGliLm5ldHdvcmtzLmRvZ2Vjb2luVGVzdDpcclxuICAgICAgcmV0dXJuIGRvY2tlckltYWdlKCd3aWxsaWFtcWluYml0Z28vZG9nZWltYWdlOjEuMTQuNS12MycsICdkb2dlY29pbmQnKTtcclxuICAgIGNhc2UgdXR4b2xpYi5uZXR3b3Jrcy5lY2FzaFRlc3Q6XHJcbiAgICAgIHJldHVybiBkb2NrZXJJbWFnZSgnYml0Y29pbmFiYy9iaXRjb2luLWFiYzowLjI2LjknLCAnYml0Y29pbmQnLCBbJy1lY2FzaD0wIC11c2VjYXNoYWRkcj0wJ10pO1xyXG4gICAgY2FzZSB1dHhvbGliLm5ldHdvcmtzLmxpdGVjb2luVGVzdDpcclxuICAgICAgcmV0dXJuIGRvY2tlckltYWdlKCd1cGhvbGQvbGl0ZWNvaW4tY29yZTowLjE3LjEnLCAnbGl0ZWNvaW5kJyk7XHJcbiAgICBjYXNlIHV0eG9saWIubmV0d29ya3MuemNhc2hUZXN0OlxyXG4gICAgICBjb25zdCBwYXJhbXNEaXIgPSBwcm9jZXNzLmVudi5aQ0FTSF9QQVJBTVNfRElSO1xyXG4gICAgICBpZiAoIXBhcmFtc0Rpcikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgZW52dmFyIFpDQVNIX1BBUkFNU19ESVIgbm90IHNldGApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkb2NrZXJJbWFnZShcclxuICAgICAgICAnZWxlY3RyaWNjb2luY28vemNhc2hkOnY0LjcuMCcsXHJcbiAgICAgICAgdW5kZWZpbmVkLCAvLyBgemNhc2hkYCBpcyBpbXBsaWNpdFxyXG4gICAgICAgIFtcclxuICAgICAgICAgICctbnVwYXJhbXM9NWJhODFiMTk6MTAnLFxyXG4gICAgICAgICAgJy1udXBhcmFtcz03NmI4MDliYjoyMCcsXHJcbiAgICAgICAgICAnLW51cGFyYW1zPTJiYjQwZTYwOjMwJyxcclxuICAgICAgICAgICctbnVwYXJhbXM9ZjViOTIzMGI6NDAnLFxyXG4gICAgICAgICAgJy1udXBhcmFtcz1lOWZmNzVhNjo0MDAnLFxyXG4gICAgICAgICAgLy8gaHR0cHM6Ly96aXBzLnouY2FzaC96aXAtMDI1MlxyXG4gICAgICAgICAgJy1udXBhcmFtcz1jMmQ2ZDBiNDo1MDAnLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgW2AtLXZvbHVtZT0ke3BhcmFtc0Rpcn06L3Nydi96Y2FzaGQvLnpjYXNoLXBhcmFtc2BdXHJcbiAgICAgICk7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgbmV0d29yayAke2dldE5ldHdvcmtOYW1lKG5ldHdvcmspfWApO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE5vZGUge1xyXG4gIHN0b3AoKTogUHJvbWlzZTx2b2lkPjtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFJlZ3Rlc3ROb2RlKG5ldHdvcms6IE5ldHdvcmspOiBQcm9taXNlPE5vZGU+IHtcclxuICBjb25zdCBkb2NrZXJQYXJhbXMgPSBnZXREb2NrZXJQYXJhbXMobmV0d29yayk7XHJcbiAgY29uc3QgYXJncyA9IFtcclxuICAgICdydW4nLFxyXG4gICAgYC0tcHVibGlzaD0ke3JwY1BvcnR9OiR7cnBjUG9ydH1gLFxyXG4gICAgLi4uZG9ja2VyUGFyYW1zLmV4dHJhQXJnc0RvY2tlcixcclxuICAgIGRvY2tlclBhcmFtcy5pbWFnZSxcclxuICAgIC4uLihkb2NrZXJQYXJhbXMuYmluYXJ5ID8gW2RvY2tlclBhcmFtcy5iaW5hcnldIDogW10pLFxyXG4gICAgJy1yZWd0ZXN0JyxcclxuICAgICctdHhpbmRleCcsXHJcbiAgICBgLXJwY3VzZXI9JHtycGNVc2VyfWAsXHJcbiAgICBgLXJwY3Bhc3N3b3JkPSR7cnBjUGFzc3dvcmR9YCxcclxuICAgIGAtcnBjYmluZD0wLjAuMC4wOiR7cnBjUG9ydH1gLFxyXG4gICAgYC1ycGNhbGxvd2lwPTAuMC4wLjAvMGAsXHJcbiAgICAuLi5kb2NrZXJQYXJhbXMuZXh0cmFBcmdzTm9kZSxcclxuICBdIGFzIHN0cmluZ1tdO1xyXG5cclxuICBsZXQgc3RkaW86ICdpZ25vcmUnIHwgJ2luaGVyaXQnID0gJ2lnbm9yZSc7XHJcbiAgaWYgKHByb2Nlc3MuZW52LlVUWE9MSUJfVEVTVFNfTE9HX0RPQ0tFUiA9PT0gJzEnKSB7XHJcbiAgICBzdGRpbyA9ICdpbmhlcml0JztcclxuICB9XHJcblxyXG4gIGNvbnN0IHByb2MgPSBzcGF3bignZG9ja2VyJywgYXJncywgeyBzdGRpbyB9KTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIHByb2Mua2lsbCgpO1xyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHByb2Mub24oJ2V4aXQnLCAoY29kZSwgc2lnbmFsKSA9PiB7XHJcbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgY29kZT0ke2NvZGV9IHNpZ25hbD0ke3NpZ25hbH1gKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UmVndGVzdE5vZGVIZWxwKG5ldHdvcms6IE5ldHdvcmspOiBQcm9taXNlPHsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+IHtcclxuICBjb25zdCBkb2NrZXJQYXJhbXMgPSBnZXREb2NrZXJQYXJhbXMobmV0d29yayk7XHJcbiAgY29uc3QgYXJncyA9IFtcclxuICAgICdydW4nLFxyXG4gICAgLi4uZG9ja2VyUGFyYW1zLmV4dHJhQXJnc0RvY2tlcixcclxuICAgIGRvY2tlclBhcmFtcy5pbWFnZSxcclxuICAgIC4uLihkb2NrZXJQYXJhbXMuYmluYXJ5ID8gW2RvY2tlclBhcmFtcy5iaW5hcnldIDogW10pLFxyXG4gICAgJy0taGVscCcsXHJcbiAgICAnLWhlbHAtZGVidWcnLFxyXG4gICAgJy1yZWd0ZXN0JyxcclxuICBdO1xyXG5cclxuICByZXR1cm4gYXdhaXQgdXRpbC5wcm9taXNpZnkoZXhlY0ZpbGUpKCdkb2NrZXInLCBhcmdzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlZ3Rlc3ROb2RlVXJsKG5ldHdvcms6IE5ldHdvcmspOiBzdHJpbmcge1xyXG4gIHJldHVybiBgaHR0cDovLyR7cnBjVXNlcn06JHtycGNQYXNzd29yZH1AbG9jYWxob3N0OiR7cnBjUG9ydH1gO1xyXG59XHJcbiJdfQ==