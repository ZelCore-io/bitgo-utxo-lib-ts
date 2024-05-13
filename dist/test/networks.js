"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const networks_1 = require("../src/networks");
describe('networks', function () {
    // Ideally, all properties for all coins should be distinct.
    // However, there are some exceptions and some networks share the same properties.
    // Here we define some groups of networks that are allowed to share properties.
    const bitcoinSharedMessagePrefix = (network) => (0, networks_1.isBitcoin)(network) || (0, networks_1.isBitcoinCash)(network) || (0, networks_1.isBitcoinSV)(network);
    const bitcoinMainnetSharedPubkeyPrefix = (network) => (0, networks_1.isMainnet)(network) && ((0, networks_1.isBitcoin)(network) || (0, networks_1.isBitcoinCash)(network) || (0, networks_1.isECash)(network) || (0, networks_1.isBitcoinSV)(network));
    const bitcoinMainnetSharedScriptPrefix = (network) => bitcoinMainnetSharedPubkeyPrefix(network);
    const bitcoinTestnetSharedPubkeyPrefix = (network) => (0, networks_1.isTestnet)(network) &&
        ((0, networks_1.isBitcoin)(network) ||
            (0, networks_1.isBitcoinCash)(network) ||
            (0, networks_1.isECash)(network) ||
            (0, networks_1.isBitcoinGold)(network) ||
            (0, networks_1.isBitcoinSV)(network) ||
            (0, networks_1.isLitecoin)(network));
    const bitcoinTestnetSharedScriptPrefix = (network) => (0, networks_1.isTestnet)(network) &&
        ((0, networks_1.isBitcoin)(network) ||
            (0, networks_1.isBitcoinCash)(network) ||
            (0, networks_1.isECash)(network) ||
            (0, networks_1.isBitcoinGold)(network) ||
            (0, networks_1.isBitcoinSV)(network) ||
            (0, networks_1.isDogecoin)(network));
    const bitcoinMainnetSharedWIFPrefix = (network) => (0, networks_1.isMainnet)(network) &&
        ((0, networks_1.isBitcoin)(network) ||
            (0, networks_1.isBitcoinCash)(network) ||
            (0, networks_1.isECash)(network) ||
            (0, networks_1.isBitcoinGold)(network) ||
            (0, networks_1.isBitcoinSV)(network) ||
            (0, networks_1.isZcash)(network));
    const bitcoinTestnetSharedWIFPrefix = (network) => (0, networks_1.isTestnet)(network) && !(0, networks_1.isDogecoin)(network);
    const bech32Coins = (network) => (0, networks_1.isBitcoin)(network) || (0, networks_1.isBitcoinGold)(network) || (0, networks_1.isLitecoin)(network);
    const sameGroup = (group, network, otherNetwork) => group(network) && group(otherNetwork);
    describe('getNetworkList()', function () {
        it('mainnets are sorted alphabetically', function () {
            const mainnets = (0, networks_1.getNetworkList)().filter(networks_1.isMainnet);
            const sortedMainnets = [...mainnets].sort((a, b) => (0, networks_1.getNetworkName)(a).localeCompare((0, networks_1.getNetworkName)(b)));
            assert.deepStrictEqual(mainnets, sortedMainnets);
        });
        it('testnet(s) follow mainnets', function () {
            const list = (0, networks_1.getNetworkList)();
            while (list.length > 0) {
                // first element is a mainnet
                const mainnet = list.shift();
                assert.strict(mainnet);
                assert.strictEqual((0, networks_1.isMainnet)(mainnet), true);
                // subsequent entries are testnets
                while (list.length > 0 && (0, networks_1.isTestnet)(list[0])) {
                    assert.strictEqual((0, networks_1.getMainnet)(list[0]), mainnet);
                    list.shift();
                }
            }
        });
    });
    describe('Features', function () {
        it('have expected values for networks', function () {
            assert.deepStrictEqual((0, networks_1.getNetworkList)().map((n) => [(0, networks_1.getNetworkName)(n), (0, networks_1.supportsSegwit)(n), (0, networks_1.supportsTaproot)(n)]), [
                ['bitcoin', true, true],
                ['testnet', true, true],
                ['bitcoincash', false, false],
                ['bitcoincashTestnet', false, false],
                ['bitcoingold', true, false],
                ['bitcoingoldTestnet', true, false],
                ['bitcoinsv', false, false],
                ['bitcoinsvTestnet', false, false],
                ['dash', false, false],
                ['dashTest', false, false],
                ['dogecoin', false, false],
                ['dogecoinTest', false, false],
                ['ecash', false, false],
                ['ecashTest', false, false],
                ['litecoin', true, false],
                ['litecoinTest', true, false],
                ['zcash', false, false],
                ['zcashTest', false, false],
            ]);
        });
    });
    for (const name in networks_1.networks) {
        const network = networks_1.networks[name];
        describe(`networks.${name}`, function () {
            it('is valid network', function () {
                assert((0, networks_1.isValidNetwork)(network));
            });
            it('getNetworkName() returns network name', function () {
                assert.strictEqual(name, (0, networks_1.getNetworkName)(network));
            });
            it('has corresponding testnet/mainnet', function () {
                if ((0, networks_1.isMainnet)(network)) {
                    assert.strictEqual((0, networks_1.isTestnet)(network), false);
                    assert.strictEqual((0, networks_1.getMainnet)(network), network);
                    assert.strictEqual(typeof (0, networks_1.getTestnet)(network), 'object');
                }
                else {
                    assert.strictEqual((0, networks_1.isMainnet)(network), false);
                    assert.strictEqual((0, networks_1.getTestnet)(network), network);
                    assert.notStrictEqual((0, networks_1.getMainnet)(network), network);
                    assert.strictEqual(typeof (0, networks_1.getMainnet)(network), 'object');
                }
            });
            it('has expected properties', function () {
                assert.strictEqual(typeof network, 'object');
                assert.strictEqual(typeof network.messagePrefix, 'string');
                assert.strictEqual(typeof network.bech32, bech32Coins(network) ? 'string' : 'undefined');
                assert.strictEqual(typeof network.bip32, 'object');
                assert.strictEqual(typeof network.pubKeyHash, 'number');
                assert.strictEqual(typeof network.scriptHash, 'number');
                assert.strictEqual(typeof network.wif, 'number');
                assert.strictEqual(typeof network.coin, 'string');
                if ((0, networks_1.isMainnet)(network)) {
                    assert.strictEqual(network.bip32.public, networks_1.networks.bitcoin.bip32.public);
                    assert.strictEqual(network.bip32.private, networks_1.networks.bitcoin.bip32.private);
                }
                else {
                    assert.strictEqual(network.bip32.public, networks_1.networks.testnet.bip32.public);
                    assert.strictEqual(network.bip32.private, networks_1.networks.testnet.bip32.private);
                }
            });
            for (const otherName in networks_1.networks) {
                const otherNetwork = networks_1.networks[otherName];
                it('isSameCoin() returns true testnet/mainnet variants', function () {
                    assert.strictEqual((0, networks_1.isSameCoin)(network, otherNetwork), otherNetwork === (0, networks_1.getMainnet)(network) || otherNetwork === (0, networks_1.getTestnet)(network));
                    assert.strictEqual(name === otherName, network === otherNetwork);
                });
                if (network === otherNetwork) {
                    continue;
                }
                it(`has distinct properties with ${otherName}`, function () {
                    assert.strictEqual(network.messagePrefix === otherNetwork.messagePrefix, (0, networks_1.isSameCoin)(network, otherNetwork) || sameGroup(bitcoinSharedMessagePrefix, network, otherNetwork));
                    assert.strictEqual(network.pubKeyHash === otherNetwork.pubKeyHash, sameGroup(bitcoinMainnetSharedPubkeyPrefix, network, otherNetwork) ||
                        sameGroup(bitcoinTestnetSharedPubkeyPrefix, network, otherNetwork));
                    assert.strictEqual(network.scriptHash === otherNetwork.scriptHash, sameGroup(bitcoinMainnetSharedScriptPrefix, network, otherNetwork) ||
                        sameGroup(bitcoinTestnetSharedScriptPrefix, network, otherNetwork));
                    assert.strictEqual(network.wif === otherNetwork.wif, sameGroup(bitcoinMainnetSharedWIFPrefix, network, otherNetwork) ||
                        sameGroup(bitcoinTestnetSharedWIFPrefix, network, otherNetwork));
                });
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L25ldHdvcmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBQ2pDLDhDQXFCeUI7QUFFekIsUUFBUSxDQUFDLFVBQVUsRUFBRTtJQUNuQiw0REFBNEQ7SUFDNUQsa0ZBQWtGO0lBRWxGLCtFQUErRTtJQUMvRSxNQUFNLDBCQUEwQixHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDLElBQUksSUFBQSx3QkFBYSxFQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUEsc0JBQVcsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUVySCxNQUFNLGdDQUFnQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDbkQsSUFBQSxvQkFBUyxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxvQkFBUyxFQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUEsd0JBQWEsRUFBQyxPQUFPLENBQUMsSUFBSSxJQUFBLGtCQUFPLEVBQUMsT0FBTyxDQUFDLElBQUksSUFBQSxzQkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFbkgsTUFBTSxnQ0FBZ0MsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFaEcsTUFBTSxnQ0FBZ0MsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ25ELElBQUEsb0JBQVMsRUFBQyxPQUFPLENBQUM7UUFDbEIsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDO1lBQ2pCLElBQUEsd0JBQWEsRUFBQyxPQUFPLENBQUM7WUFDdEIsSUFBQSxrQkFBTyxFQUFDLE9BQU8sQ0FBQztZQUNoQixJQUFBLHdCQUFhLEVBQUMsT0FBTyxDQUFDO1lBQ3RCLElBQUEsc0JBQVcsRUFBQyxPQUFPLENBQUM7WUFDcEIsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFekIsTUFBTSxnQ0FBZ0MsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ25ELElBQUEsb0JBQVMsRUFBQyxPQUFPLENBQUM7UUFDbEIsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDO1lBQ2pCLElBQUEsd0JBQWEsRUFBQyxPQUFPLENBQUM7WUFDdEIsSUFBQSxrQkFBTyxFQUFDLE9BQU8sQ0FBQztZQUNoQixJQUFBLHdCQUFhLEVBQUMsT0FBTyxDQUFDO1lBQ3RCLElBQUEsc0JBQVcsRUFBQyxPQUFPLENBQUM7WUFDcEIsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFekIsTUFBTSw2QkFBNkIsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ2hELElBQUEsb0JBQVMsRUFBQyxPQUFPLENBQUM7UUFDbEIsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDO1lBQ2pCLElBQUEsd0JBQWEsRUFBQyxPQUFPLENBQUM7WUFDdEIsSUFBQSxrQkFBTyxFQUFDLE9BQU8sQ0FBQztZQUNoQixJQUFBLHdCQUFhLEVBQUMsT0FBTyxDQUFDO1lBQ3RCLElBQUEsc0JBQVcsRUFBQyxPQUFPLENBQUM7WUFDcEIsSUFBQSxrQkFBTyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFdEIsTUFBTSw2QkFBNkIsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBQSxvQkFBUyxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTlGLE1BQU0sV0FBVyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDLElBQUksSUFBQSx3QkFBYSxFQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUVyRyxNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRTFGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtRQUMzQixFQUFFLENBQUMsb0NBQW9DLEVBQUU7WUFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBQSx5QkFBYyxHQUFFLENBQUMsTUFBTSxDQUFDLG9CQUFTLENBQUMsQ0FBQztZQUNwRCxNQUFNLGNBQWMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQ2hELElBQUEseUJBQWMsRUFBQyxDQUFDLENBQVksQ0FBQyxhQUFhLENBQUMsSUFBQSx5QkFBYyxFQUFDLENBQUMsQ0FBVyxDQUFDLENBQ3pFLENBQUM7WUFDRixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw0QkFBNEIsRUFBRTtZQUMvQixNQUFNLElBQUksR0FBRyxJQUFBLHlCQUFjLEdBQUUsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN0Qiw2QkFBNkI7Z0JBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTdDLGtDQUFrQztnQkFDbEMsT0FBTyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxJQUFBLG9CQUFTLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxQkFBVSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNqRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ2Q7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsVUFBVSxFQUFFO1FBQ25CLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRTtZQUN0QyxNQUFNLENBQUMsZUFBZSxDQUNwQixJQUFBLHlCQUFjLEdBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBQSx5QkFBYyxFQUFDLENBQUMsQ0FBQyxFQUFFLElBQUEseUJBQWMsRUFBQyxDQUFDLENBQUMsRUFBRSxJQUFBLDBCQUFlLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN2RjtnQkFDRSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUN2QixDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUN2QixDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUM3QixDQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7Z0JBQ3BDLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUM7Z0JBQzVCLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztnQkFDbkMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQztnQkFDM0IsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUNsQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUN0QixDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUMxQixDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUMxQixDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUM5QixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUN2QixDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUMzQixDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO2dCQUN6QixDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO2dCQUM3QixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUN2QixDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQzVCLENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLE1BQU0sSUFBSSxJQUFJLG1CQUFRLEVBQUU7UUFDM0IsTUFBTSxPQUFPLEdBQVksbUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4QyxRQUFRLENBQUMsWUFBWSxJQUFJLEVBQUUsRUFBRTtZQUMzQixFQUFFLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ3JCLE1BQU0sQ0FBQyxJQUFBLHlCQUFjLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztZQUVILEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRTtnQkFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBQSx5QkFBYyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUU7Z0JBQ3RDLElBQUksSUFBQSxvQkFBUyxFQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsb0JBQVMsRUFBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQzFEO3FCQUFNO29CQUNMLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxvQkFBUyxFQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDakQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQzFEO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMseUJBQXlCLEVBQUU7Z0JBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQVEsT0FBZSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2xHLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sT0FBTyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFFbEQsSUFBSSxJQUFBLG9CQUFTLEVBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsbUJBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLG1CQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDM0U7cUJBQU07b0JBQ0wsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxtQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsbUJBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUMzRTtZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxNQUFNLFNBQVMsSUFBSSxtQkFBUSxFQUFFO2dCQUNoQyxNQUFNLFlBQVksR0FBRyxtQkFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUV6QyxFQUFFLENBQUMsb0RBQW9ELEVBQUU7b0JBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQ2hCLElBQUEscUJBQVUsRUFBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLEVBQ2pDLFlBQVksS0FBSyxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLElBQUksWUFBWSxLQUFLLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsQ0FDN0UsQ0FBQztvQkFFRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsT0FBTyxLQUFLLFlBQVksQ0FBQyxDQUFDO2dCQUNuRSxDQUFDLENBQUMsQ0FBQztnQkFFSCxJQUFJLE9BQU8sS0FBSyxZQUFZLEVBQUU7b0JBQzVCLFNBQVM7aUJBQ1Y7Z0JBRUQsRUFBRSxDQUFDLGdDQUFnQyxTQUFTLEVBQUUsRUFBRTtvQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FDaEIsT0FBTyxDQUFDLGFBQWEsS0FBSyxZQUFZLENBQUMsYUFBYSxFQUNwRCxJQUFBLHFCQUFVLEVBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQywwQkFBMEIsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQ2xHLENBQUM7b0JBRUYsTUFBTSxDQUFDLFdBQVcsQ0FDaEIsT0FBTyxDQUFDLFVBQVUsS0FBSyxZQUFZLENBQUMsVUFBVSxFQUM5QyxTQUFTLENBQUMsZ0NBQWdDLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQzt3QkFDaEUsU0FBUyxDQUFDLGdDQUFnQyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FDckUsQ0FBQztvQkFFRixNQUFNLENBQUMsV0FBVyxDQUNoQixPQUFPLENBQUMsVUFBVSxLQUFLLFlBQVksQ0FBQyxVQUFVLEVBQzlDLFNBQVMsQ0FBQyxnQ0FBZ0MsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDO3dCQUNoRSxTQUFTLENBQUMsZ0NBQWdDLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUNyRSxDQUFDO29CQUVGLE1BQU0sQ0FBQyxXQUFXLENBQ2hCLE9BQU8sQ0FBQyxHQUFHLEtBQUssWUFBWSxDQUFDLEdBQUcsRUFDaEMsU0FBUyxDQUFDLDZCQUE2QixFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUM7d0JBQzdELFNBQVMsQ0FBQyw2QkFBNkIsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQ2xFLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQge1xyXG4gIGdldE1haW5uZXQsXHJcbiAgZ2V0TmV0d29ya0xpc3QsXHJcbiAgZ2V0TmV0d29ya05hbWUsXHJcbiAgZ2V0VGVzdG5ldCxcclxuICBpc0JpdGNvaW4sXHJcbiAgaXNCaXRjb2luQ2FzaCxcclxuICBpc0VDYXNoLFxyXG4gIGlzQml0Y29pbkdvbGQsXHJcbiAgaXNCaXRjb2luU1YsXHJcbiAgaXNEb2dlY29pbixcclxuICBpc0xpdGVjb2luLFxyXG4gIGlzTWFpbm5ldCxcclxuICBpc1NhbWVDb2luLFxyXG4gIGlzVGVzdG5ldCxcclxuICBpc1ZhbGlkTmV0d29yayxcclxuICBpc1pjYXNoLFxyXG4gIE5ldHdvcmssXHJcbiAgbmV0d29ya3MsXHJcbiAgc3VwcG9ydHNTZWd3aXQsXHJcbiAgc3VwcG9ydHNUYXByb290LFxyXG59IGZyb20gJy4uL3NyYy9uZXR3b3Jrcyc7XHJcblxyXG5kZXNjcmliZSgnbmV0d29ya3MnLCBmdW5jdGlvbiAoKSB7XHJcbiAgLy8gSWRlYWxseSwgYWxsIHByb3BlcnRpZXMgZm9yIGFsbCBjb2lucyBzaG91bGQgYmUgZGlzdGluY3QuXHJcbiAgLy8gSG93ZXZlciwgdGhlcmUgYXJlIHNvbWUgZXhjZXB0aW9ucyBhbmQgc29tZSBuZXR3b3JrcyBzaGFyZSB0aGUgc2FtZSBwcm9wZXJ0aWVzLlxyXG5cclxuICAvLyBIZXJlIHdlIGRlZmluZSBzb21lIGdyb3VwcyBvZiBuZXR3b3JrcyB0aGF0IGFyZSBhbGxvd2VkIHRvIHNoYXJlIHByb3BlcnRpZXMuXHJcbiAgY29uc3QgYml0Y29pblNoYXJlZE1lc3NhZ2VQcmVmaXggPSAobmV0d29yaykgPT4gaXNCaXRjb2luKG5ldHdvcmspIHx8IGlzQml0Y29pbkNhc2gobmV0d29yaykgfHwgaXNCaXRjb2luU1YobmV0d29yayk7XHJcblxyXG4gIGNvbnN0IGJpdGNvaW5NYWlubmV0U2hhcmVkUHVia2V5UHJlZml4ID0gKG5ldHdvcmspID0+XHJcbiAgICBpc01haW5uZXQobmV0d29yaykgJiYgKGlzQml0Y29pbihuZXR3b3JrKSB8fCBpc0JpdGNvaW5DYXNoKG5ldHdvcmspIHx8IGlzRUNhc2gobmV0d29yaykgfHwgaXNCaXRjb2luU1YobmV0d29yaykpO1xyXG5cclxuICBjb25zdCBiaXRjb2luTWFpbm5ldFNoYXJlZFNjcmlwdFByZWZpeCA9IChuZXR3b3JrKSA9PiBiaXRjb2luTWFpbm5ldFNoYXJlZFB1YmtleVByZWZpeChuZXR3b3JrKTtcclxuXHJcbiAgY29uc3QgYml0Y29pblRlc3RuZXRTaGFyZWRQdWJrZXlQcmVmaXggPSAobmV0d29yaykgPT5cclxuICAgIGlzVGVzdG5ldChuZXR3b3JrKSAmJlxyXG4gICAgKGlzQml0Y29pbihuZXR3b3JrKSB8fFxyXG4gICAgICBpc0JpdGNvaW5DYXNoKG5ldHdvcmspIHx8XHJcbiAgICAgIGlzRUNhc2gobmV0d29yaykgfHxcclxuICAgICAgaXNCaXRjb2luR29sZChuZXR3b3JrKSB8fFxyXG4gICAgICBpc0JpdGNvaW5TVihuZXR3b3JrKSB8fFxyXG4gICAgICBpc0xpdGVjb2luKG5ldHdvcmspKTtcclxuXHJcbiAgY29uc3QgYml0Y29pblRlc3RuZXRTaGFyZWRTY3JpcHRQcmVmaXggPSAobmV0d29yaykgPT5cclxuICAgIGlzVGVzdG5ldChuZXR3b3JrKSAmJlxyXG4gICAgKGlzQml0Y29pbihuZXR3b3JrKSB8fFxyXG4gICAgICBpc0JpdGNvaW5DYXNoKG5ldHdvcmspIHx8XHJcbiAgICAgIGlzRUNhc2gobmV0d29yaykgfHxcclxuICAgICAgaXNCaXRjb2luR29sZChuZXR3b3JrKSB8fFxyXG4gICAgICBpc0JpdGNvaW5TVihuZXR3b3JrKSB8fFxyXG4gICAgICBpc0RvZ2Vjb2luKG5ldHdvcmspKTtcclxuXHJcbiAgY29uc3QgYml0Y29pbk1haW5uZXRTaGFyZWRXSUZQcmVmaXggPSAobmV0d29yaykgPT5cclxuICAgIGlzTWFpbm5ldChuZXR3b3JrKSAmJlxyXG4gICAgKGlzQml0Y29pbihuZXR3b3JrKSB8fFxyXG4gICAgICBpc0JpdGNvaW5DYXNoKG5ldHdvcmspIHx8XHJcbiAgICAgIGlzRUNhc2gobmV0d29yaykgfHxcclxuICAgICAgaXNCaXRjb2luR29sZChuZXR3b3JrKSB8fFxyXG4gICAgICBpc0JpdGNvaW5TVihuZXR3b3JrKSB8fFxyXG4gICAgICBpc1pjYXNoKG5ldHdvcmspKTtcclxuXHJcbiAgY29uc3QgYml0Y29pblRlc3RuZXRTaGFyZWRXSUZQcmVmaXggPSAobmV0d29yaykgPT4gaXNUZXN0bmV0KG5ldHdvcmspICYmICFpc0RvZ2Vjb2luKG5ldHdvcmspO1xyXG5cclxuICBjb25zdCBiZWNoMzJDb2lucyA9IChuZXR3b3JrKSA9PiBpc0JpdGNvaW4obmV0d29yaykgfHwgaXNCaXRjb2luR29sZChuZXR3b3JrKSB8fCBpc0xpdGVjb2luKG5ldHdvcmspO1xyXG5cclxuICBjb25zdCBzYW1lR3JvdXAgPSAoZ3JvdXAsIG5ldHdvcmssIG90aGVyTmV0d29yaykgPT4gZ3JvdXAobmV0d29yaykgJiYgZ3JvdXAob3RoZXJOZXR3b3JrKTtcclxuXHJcbiAgZGVzY3JpYmUoJ2dldE5ldHdvcmtMaXN0KCknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpdCgnbWFpbm5ldHMgYXJlIHNvcnRlZCBhbHBoYWJldGljYWxseScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgbWFpbm5ldHMgPSBnZXROZXR3b3JrTGlzdCgpLmZpbHRlcihpc01haW5uZXQpO1xyXG4gICAgICBjb25zdCBzb3J0ZWRNYWlubmV0cyA9IFsuLi5tYWlubmV0c10uc29ydCgoYSwgYikgPT5cclxuICAgICAgICAoZ2V0TmV0d29ya05hbWUoYSkgYXMgc3RyaW5nKS5sb2NhbGVDb21wYXJlKGdldE5ldHdvcmtOYW1lKGIpIGFzIHN0cmluZylcclxuICAgICAgKTtcclxuICAgICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChtYWlubmV0cywgc29ydGVkTWFpbm5ldHMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Rlc3RuZXQocykgZm9sbG93IG1haW5uZXRzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBsaXN0ID0gZ2V0TmV0d29ya0xpc3QoKTtcclxuICAgICAgd2hpbGUgKGxpc3QubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIC8vIGZpcnN0IGVsZW1lbnQgaXMgYSBtYWlubmV0XHJcbiAgICAgICAgY29uc3QgbWFpbm5ldCA9IGxpc3Quc2hpZnQoKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0KG1haW5uZXQpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc01haW5uZXQobWFpbm5ldCksIHRydWUpO1xyXG5cclxuICAgICAgICAvLyBzdWJzZXF1ZW50IGVudHJpZXMgYXJlIHRlc3RuZXRzXHJcbiAgICAgICAgd2hpbGUgKGxpc3QubGVuZ3RoID4gMCAmJiBpc1Rlc3RuZXQobGlzdFswXSkpIHtcclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChnZXRNYWlubmV0KGxpc3RbMF0pLCBtYWlubmV0KTtcclxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnRmVhdHVyZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpdCgnaGF2ZSBleHBlY3RlZCB2YWx1ZXMgZm9yIG5ldHdvcmtzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKFxyXG4gICAgICAgIGdldE5ldHdvcmtMaXN0KCkubWFwKChuKSA9PiBbZ2V0TmV0d29ya05hbWUobiksIHN1cHBvcnRzU2Vnd2l0KG4pLCBzdXBwb3J0c1RhcHJvb3QobildKSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICBbJ2JpdGNvaW4nLCB0cnVlLCB0cnVlXSxcclxuICAgICAgICAgIFsndGVzdG5ldCcsIHRydWUsIHRydWVdLFxyXG4gICAgICAgICAgWydiaXRjb2luY2FzaCcsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2JpdGNvaW5jYXNoVGVzdG5ldCcsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2JpdGNvaW5nb2xkJywgdHJ1ZSwgZmFsc2VdLFxyXG4gICAgICAgICAgWydiaXRjb2luZ29sZFRlc3RuZXQnLCB0cnVlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2JpdGNvaW5zdicsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2JpdGNvaW5zdlRlc3RuZXQnLCBmYWxzZSwgZmFsc2VdLFxyXG4gICAgICAgICAgWydkYXNoJywgZmFsc2UsIGZhbHNlXSxcclxuICAgICAgICAgIFsnZGFzaFRlc3QnLCBmYWxzZSwgZmFsc2VdLFxyXG4gICAgICAgICAgWydkb2dlY29pbicsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2RvZ2Vjb2luVGVzdCcsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2VjYXNoJywgZmFsc2UsIGZhbHNlXSxcclxuICAgICAgICAgIFsnZWNhc2hUZXN0JywgZmFsc2UsIGZhbHNlXSxcclxuICAgICAgICAgIFsnbGl0ZWNvaW4nLCB0cnVlLCBmYWxzZV0sXHJcbiAgICAgICAgICBbJ2xpdGVjb2luVGVzdCcsIHRydWUsIGZhbHNlXSxcclxuICAgICAgICAgIFsnemNhc2gnLCBmYWxzZSwgZmFsc2VdLFxyXG4gICAgICAgICAgWyd6Y2FzaFRlc3QnLCBmYWxzZSwgZmFsc2VdLFxyXG4gICAgICAgIF1cclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBmb3IgKGNvbnN0IG5hbWUgaW4gbmV0d29ya3MpIHtcclxuICAgIGNvbnN0IG5ldHdvcms6IE5ldHdvcmsgPSBuZXR3b3Jrc1tuYW1lXTtcclxuXHJcbiAgICBkZXNjcmliZShgbmV0d29ya3MuJHtuYW1lfWAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgaXQoJ2lzIHZhbGlkIG5ldHdvcmsnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYXNzZXJ0KGlzVmFsaWROZXR3b3JrKG5ldHdvcmspKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnZ2V0TmV0d29ya05hbWUoKSByZXR1cm5zIG5ldHdvcmsgbmFtZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwobmFtZSwgZ2V0TmV0d29ya05hbWUobmV0d29yaykpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdoYXMgY29ycmVzcG9uZGluZyB0ZXN0bmV0L21haW5uZXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKGlzTWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGlzVGVzdG5ldChuZXR3b3JrKSwgZmFsc2UpO1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGdldE1haW5uZXQobmV0d29yayksIG5ldHdvcmspO1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBnZXRUZXN0bmV0KG5ldHdvcmspLCAnb2JqZWN0Jyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChpc01haW5uZXQobmV0d29yayksIGZhbHNlKTtcclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChnZXRUZXN0bmV0KG5ldHdvcmspLCBuZXR3b3JrKTtcclxuICAgICAgICAgIGFzc2VydC5ub3RTdHJpY3RFcXVhbChnZXRNYWlubmV0KG5ldHdvcmspLCBuZXR3b3JrKTtcclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eXBlb2YgZ2V0TWFpbm5ldChuZXR3b3JrKSwgJ29iamVjdCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnaGFzIGV4cGVjdGVkIHByb3BlcnRpZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBuZXR3b3JrLCAnb2JqZWN0Jyk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBuZXR3b3JrLm1lc3NhZ2VQcmVmaXgsICdzdHJpbmcnKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHlwZW9mIChuZXR3b3JrIGFzIGFueSkuYmVjaDMyLCBiZWNoMzJDb2lucyhuZXR3b3JrKSA/ICdzdHJpbmcnIDogJ3VuZGVmaW5lZCcpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eXBlb2YgbmV0d29yay5iaXAzMiwgJ29iamVjdCcpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eXBlb2YgbmV0d29yay5wdWJLZXlIYXNoLCAnbnVtYmVyJyk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBuZXR3b3JrLnNjcmlwdEhhc2gsICdudW1iZXInKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHlwZW9mIG5ldHdvcmsud2lmLCAnbnVtYmVyJyk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBuZXR3b3JrLmNvaW4sICdzdHJpbmcnKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKG5ldHdvcmsuYmlwMzIucHVibGljLCBuZXR3b3Jrcy5iaXRjb2luLmJpcDMyLnB1YmxpYyk7XHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwobmV0d29yay5iaXAzMi5wcml2YXRlLCBuZXR3b3Jrcy5iaXRjb2luLmJpcDMyLnByaXZhdGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwobmV0d29yay5iaXAzMi5wdWJsaWMsIG5ldHdvcmtzLnRlc3RuZXQuYmlwMzIucHVibGljKTtcclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChuZXR3b3JrLmJpcDMyLnByaXZhdGUsIG5ldHdvcmtzLnRlc3RuZXQuYmlwMzIucHJpdmF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGZvciAoY29uc3Qgb3RoZXJOYW1lIGluIG5ldHdvcmtzKSB7XHJcbiAgICAgICAgY29uc3Qgb3RoZXJOZXR3b3JrID0gbmV0d29ya3Nbb3RoZXJOYW1lXTtcclxuXHJcbiAgICAgICAgaXQoJ2lzU2FtZUNvaW4oKSByZXR1cm5zIHRydWUgdGVzdG5ldC9tYWlubmV0IHZhcmlhbnRzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKFxyXG4gICAgICAgICAgICBpc1NhbWVDb2luKG5ldHdvcmssIG90aGVyTmV0d29yayksXHJcbiAgICAgICAgICAgIG90aGVyTmV0d29yayA9PT0gZ2V0TWFpbm5ldChuZXR3b3JrKSB8fCBvdGhlck5ldHdvcmsgPT09IGdldFRlc3RuZXQobmV0d29yaylcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKG5hbWUgPT09IG90aGVyTmFtZSwgbmV0d29yayA9PT0gb3RoZXJOZXR3b3JrKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKG5ldHdvcmsgPT09IG90aGVyTmV0d29yaykge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpdChgaGFzIGRpc3RpbmN0IHByb3BlcnRpZXMgd2l0aCAke290aGVyTmFtZX1gLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgICAgIG5ldHdvcmsubWVzc2FnZVByZWZpeCA9PT0gb3RoZXJOZXR3b3JrLm1lc3NhZ2VQcmVmaXgsXHJcbiAgICAgICAgICAgIGlzU2FtZUNvaW4obmV0d29yaywgb3RoZXJOZXR3b3JrKSB8fCBzYW1lR3JvdXAoYml0Y29pblNoYXJlZE1lc3NhZ2VQcmVmaXgsIG5ldHdvcmssIG90aGVyTmV0d29yaylcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKFxyXG4gICAgICAgICAgICBuZXR3b3JrLnB1YktleUhhc2ggPT09IG90aGVyTmV0d29yay5wdWJLZXlIYXNoLFxyXG4gICAgICAgICAgICBzYW1lR3JvdXAoYml0Y29pbk1haW5uZXRTaGFyZWRQdWJrZXlQcmVmaXgsIG5ldHdvcmssIG90aGVyTmV0d29yaykgfHxcclxuICAgICAgICAgICAgICBzYW1lR3JvdXAoYml0Y29pblRlc3RuZXRTaGFyZWRQdWJrZXlQcmVmaXgsIG5ldHdvcmssIG90aGVyTmV0d29yaylcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKFxyXG4gICAgICAgICAgICBuZXR3b3JrLnNjcmlwdEhhc2ggPT09IG90aGVyTmV0d29yay5zY3JpcHRIYXNoLFxyXG4gICAgICAgICAgICBzYW1lR3JvdXAoYml0Y29pbk1haW5uZXRTaGFyZWRTY3JpcHRQcmVmaXgsIG5ldHdvcmssIG90aGVyTmV0d29yaykgfHxcclxuICAgICAgICAgICAgICBzYW1lR3JvdXAoYml0Y29pblRlc3RuZXRTaGFyZWRTY3JpcHRQcmVmaXgsIG5ldHdvcmssIG90aGVyTmV0d29yaylcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKFxyXG4gICAgICAgICAgICBuZXR3b3JrLndpZiA9PT0gb3RoZXJOZXR3b3JrLndpZixcclxuICAgICAgICAgICAgc2FtZUdyb3VwKGJpdGNvaW5NYWlubmV0U2hhcmVkV0lGUHJlZml4LCBuZXR3b3JrLCBvdGhlck5ldHdvcmspIHx8XHJcbiAgICAgICAgICAgICAgc2FtZUdyb3VwKGJpdGNvaW5UZXN0bmV0U2hhcmVkV0lGUHJlZml4LCBuZXR3b3JrLCBvdGhlck5ldHdvcmspXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn0pO1xyXG4iXX0=