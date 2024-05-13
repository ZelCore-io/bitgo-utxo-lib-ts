"use strict";
/*

The values for the various fork coins can be found in these files:

property       filename                  varname                           notes
------------------------------------------------------------------------------------------------------------------------
messagePrefix  src/validation.cpp        strMessageMagic                   Format `${CoinName} Signed Message`
bech32_hrp     src/chainparams.cpp       bech32_hrp                        Only for some networks
bip32.public   src/chainparams.cpp       base58Prefixes[EXT_PUBLIC_KEY]    Mainnets have same value, testnets have same value
bip32.private  src/chainparams.cpp       base58Prefixes[EXT_SECRET_KEY]    Mainnets have same value, testnets have same value
pubKeyHash     src/chainparams.cpp       base58Prefixes[PUBKEY_ADDRESS]
scriptHash     src/chainparams.cpp       base58Prefixes[SCRIPT_ADDRESS]
wif            src/chainparams.cpp       base58Prefixes[SECRET_KEY]        Testnets have same value
forkId         src/script/interpreter.h  FORKID_*

*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportsTaproot = exports.supportsSegwit = exports.isValidNetwork = exports.isZcash = exports.isLitecoin = exports.isDogecoin = exports.isDash = exports.isBitcoinSV = exports.isBitcoinGold = exports.isECash = exports.isBitcoinCash = exports.isBitcoin = exports.getTestnet = exports.isSameCoin = exports.isTestnet = exports.isMainnet = exports.getMainnet = exports.getNetworkName = exports.getNetworkList = exports.networks = void 0;
/**
 * @deprecated
 */
const coins = {
    /*
     * The original Bitcoin Cash was renamed to bitcoin-abc, and bitcoin-cash-node forked from it.
     * Later, bitcoin-abc is rebranded to ecash. Here, 'bch' corresponds to bitcoin-cash-node, and
     * 'bcha' corresponds to ecash. Ref: https://github.com/bitcoin-cash-node/bitcoin-cash-node
     * */
    BCH: 'bch',
    BCHA: 'bcha',
    BSV: 'bsv',
    BTC: 'btc',
    BTG: 'btg',
    LTC: 'ltc',
    ZEC: 'zec',
    DASH: 'dash',
    DOGE: 'doge',
};
function getDefaultBip32Mainnet() {
    return {
        // base58 'xpub'
        public: 0x0488b21e,
        // base58 'xprv'
        private: 0x0488ade4,
    };
}
function getDefaultBip32Testnet() {
    return {
        // base58 'tpub'
        public: 0x043587cf,
        // base58 'tprv'
        private: 0x04358394,
    };
}
exports.networks = {
    // https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp
    // https://github.com/bitcoin/bitcoin/blob/master/src/chainparams.cpp
    bitcoin: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'bc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.BTC,
    },
    testnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'tb',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: coins.BTC,
    },
    // https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/master/src/validation.cpp
    // https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/master/src/chainparams.cpp
    // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
    bitcoincash: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.BCH,
        forkId: 0x00,
        cashAddr: {
            prefix: 'bitcoincash',
            pubKeyHash: 0x00,
            scriptHash: 0x08,
        },
    },
    bitcoincashTestnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: coins.BCH,
        cashAddr: {
            prefix: 'bchtest',
            pubKeyHash: 0x00,
            scriptHash: 0x08,
        },
    },
    // https://github.com/BTCGPU/BTCGPU/blob/master/src/validation.cpp
    // https://github.com/BTCGPU/BTCGPU/blob/master/src/chainparams.cpp
    // https://github.com/BTCGPU/BTCGPU/blob/master/src/script/interpreter.h
    bitcoingold: {
        messagePrefix: '\x18Bitcoin Gold Signed Message:\n',
        bech32: 'btg',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x26,
        scriptHash: 0x17,
        wif: 0x80,
        forkId: 79,
        coin: coins.BTG,
    },
    bitcoingoldTestnet: {
        messagePrefix: '\x18Bitcoin Gold Signed Message:\n',
        bech32: 'tbtg',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 111,
        scriptHash: 196,
        wif: 0xef,
        forkId: 79,
        coin: coins.BTG,
    },
    // https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/validation.cpp
    // https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/chainparams.cpp
    bitcoinsv: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.BSV,
        forkId: 0x00,
    },
    bitcoinsvTestnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: coins.BSV,
        forkId: 0x00,
    },
    // https://github.com/dashpay/dash/blob/master/src/validation.cpp
    // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp
    dash: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x4c,
        scriptHash: 0x10,
        wif: 0xcc,
        coin: coins.DASH,
    },
    dashTest: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x8c,
        scriptHash: 0x13,
        wif: 0xef,
        coin: coins.DASH,
    },
    // https://github.com/dogecoin/dogecoin/blob/master/src/validation.cpp
    // https://github.com/dogecoin/dogecoin/blob/master/src/chainparams.cpp
    // Mainnet bip32 here does not match dogecoin core, this is intended (see BG-53241)
    dogecoin: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e,
        coin: coins.DOGE,
    },
    dogecoinTest: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x71,
        scriptHash: 0xc4,
        wif: 0xf1,
        coin: coins.DOGE,
    },
    // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/validation.cpp
    // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/chainparams.cpp
    // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/util/message.cpp
    ecash: {
        messagePrefix: '\x16eCash Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.BCHA,
        forkId: 0x00,
        cashAddr: {
            prefix: 'ecash',
            pubKeyHash: 0x00,
            scriptHash: 0x08,
        },
    },
    ecashTest: {
        messagePrefix: '\x16eCash Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: coins.BCHA,
        cashAddr: {
            prefix: 'ectest',
            pubKeyHash: 0x00,
            scriptHash: 0x08,
        },
    },
    // https://github.com/litecoin-project/litecoin/blob/master/src/validation.cpp
    // https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp
    litecoin: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bech32: 'ltc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x30,
        scriptHash: 0x32,
        wif: 0xb0,
        coin: coins.LTC,
    },
    litecoinTest: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bech32: 'tltc',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0x3a,
        wif: 0xef,
        coin: coins.LTC,
    },
    // https://github.com/zcash/zcash/blob/master/src/validation.cpp
    // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp
    zcash: {
        messagePrefix: '\x18ZCash Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC,
    },
    zcashTest: {
        messagePrefix: '\x18ZCash Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x1d25,
        scriptHash: 0x1cba,
        wif: 0xef,
        coin: coins.ZEC,
    },
};
/**
 * @returns {Network[]} all known networks as array
 */
function getNetworkList() {
    return Object.values(exports.networks);
}
exports.getNetworkList = getNetworkList;
/**
 * @param {Network} network
 * @returns {NetworkName} the name of the network. Returns undefined if network is not a value
 *                        of `networks`
 */
function getNetworkName(network) {
    return Object.keys(exports.networks).find((n) => exports.networks[n] === network);
}
exports.getNetworkName = getNetworkName;
/**
 * @param {Network} network
 * @returns {Object} the mainnet corresponding to a testnet
 */
function getMainnet(network) {
    switch (network) {
        case exports.networks.bitcoin:
        case exports.networks.testnet:
            return exports.networks.bitcoin;
        case exports.networks.bitcoincash:
        case exports.networks.bitcoincashTestnet:
            return exports.networks.bitcoincash;
        case exports.networks.bitcoingold:
        case exports.networks.bitcoingoldTestnet:
            return exports.networks.bitcoingold;
        case exports.networks.bitcoinsv:
        case exports.networks.bitcoinsvTestnet:
            return exports.networks.bitcoinsv;
        case exports.networks.dash:
        case exports.networks.dashTest:
            return exports.networks.dash;
        case exports.networks.ecash:
        case exports.networks.ecashTest:
            return exports.networks.ecash;
        case exports.networks.litecoin:
        case exports.networks.litecoinTest:
            return exports.networks.litecoin;
        case exports.networks.zcash:
        case exports.networks.zcashTest:
            return exports.networks.zcash;
        case exports.networks.dogecoin:
        case exports.networks.dogecoinTest:
            return exports.networks.dogecoin;
    }
    throw new TypeError(`invalid network`);
}
exports.getMainnet = getMainnet;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is a mainnet
 */
function isMainnet(network) {
    return getMainnet(network) === network;
}
exports.isMainnet = isMainnet;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is a testnet
 */
function isTestnet(network) {
    return getMainnet(network) !== network;
}
exports.isTestnet = isTestnet;
/**
 *
 * @param {Network} network
 * @param {Network} otherNetwork
 * @returns {boolean} true iff both networks are for the same coin
 */
function isSameCoin(network, otherNetwork) {
    return getMainnet(network) === getMainnet(otherNetwork);
}
exports.isSameCoin = isSameCoin;
const mainnets = getNetworkList().filter(isMainnet);
const testnets = getNetworkList().filter(isTestnet);
/**
 * Map where keys are mainnet networks and values are testnet networks
 * @type {Map<Network, Network[]>}
 */
const mainnetTestnetPairs = new Map(mainnets.map((m) => [m, testnets.filter((t) => getMainnet(t) === m)]));
/**
 * @param {Network} network
 * @returns {Network|undefined} - The testnet corresponding to a mainnet.
 *                               Returns undefined if a network has no testnet.
 */
function getTestnet(network) {
    if (isTestnet(network)) {
        return network;
    }
    const testnets = mainnetTestnetPairs.get(network);
    if (testnets === undefined) {
        throw new Error(`invalid argument`);
    }
    if (testnets.length === 0) {
        return;
    }
    if (testnets.length === 1) {
        return testnets[0];
    }
    throw new Error(`more than one testnet for ${getNetworkName(network)}`);
}
exports.getTestnet = getTestnet;
/**
 * @param {Network} network
 * @returns {boolean} true iff network bitcoin or testnet
 */
function isBitcoin(network) {
    return getMainnet(network) === exports.networks.bitcoin;
}
exports.isBitcoin = isBitcoin;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
function isBitcoinCash(network) {
    return getMainnet(network) === exports.networks.bitcoincash;
}
exports.isBitcoinCash = isBitcoinCash;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is ecash or ecashTest
 */
function isECash(network) {
    return getMainnet(network) === exports.networks.ecash;
}
exports.isECash = isECash;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoingold
 */
function isBitcoinGold(network) {
    return getMainnet(network) === exports.networks.bitcoingold;
}
exports.isBitcoinGold = isBitcoinGold;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
function isBitcoinSV(network) {
    return getMainnet(network) === exports.networks.bitcoinsv;
}
exports.isBitcoinSV = isBitcoinSV;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is dash or dashTest
 */
function isDash(network) {
    return getMainnet(network) === exports.networks.dash;
}
exports.isDash = isDash;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is dogecoin or dogecoinTest
 */
function isDogecoin(network) {
    return getMainnet(network) === exports.networks.dogecoin;
}
exports.isDogecoin = isDogecoin;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
function isLitecoin(network) {
    return getMainnet(network) === exports.networks.litecoin;
}
exports.isLitecoin = isLitecoin;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
function isZcash(network) {
    return getMainnet(network) === exports.networks.zcash;
}
exports.isZcash = isZcash;
/**
 * @param {unknown} network
 * @returns {boolean} returns true iff network is any of the network stated in the argument
 */
function isValidNetwork(network) {
    return getNetworkList().includes(network);
}
exports.isValidNetwork = isValidNetwork;
function supportsSegwit(network) {
    return [exports.networks.bitcoin, exports.networks.litecoin, exports.networks.bitcoingold].includes(getMainnet(network));
}
exports.supportsSegwit = supportsSegwit;
function supportsTaproot(network) {
    return getMainnet(network) === exports.networks.bitcoin;
}
exports.supportsTaproot = supportsTaproot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbmV0d29ya3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7RUFlRTs7O0FBRUY7O0dBRUc7QUFDSCxNQUFNLEtBQUssR0FBRztJQUNaOzs7O1NBSUs7SUFDTCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0lBQ1osR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBSSxFQUFFLE1BQU07Q0FDSixDQUFDO0FBNENYLFNBQVMsc0JBQXNCO0lBQzdCLE9BQU87UUFDTCxnQkFBZ0I7UUFDaEIsTUFBTSxFQUFFLFVBQVU7UUFDbEIsZ0JBQWdCO1FBQ2hCLE9BQU8sRUFBRSxVQUFVO0tBQ3BCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxzQkFBc0I7SUFDN0IsT0FBTztRQUNMLGdCQUFnQjtRQUNoQixNQUFNLEVBQUUsVUFBVTtRQUNsQixnQkFBZ0I7UUFDaEIsT0FBTyxFQUFFLFVBQVU7S0FDcEIsQ0FBQztBQUNKLENBQUM7QUFFWSxRQUFBLFFBQVEsR0FBaUM7SUFDcEQsb0VBQW9FO0lBQ3BFLHFFQUFxRTtJQUNyRSxPQUFPLEVBQUU7UUFDUCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsYUFBYSxFQUFFLCtCQUErQjtRQUM5QyxNQUFNLEVBQUUsSUFBSTtRQUNaLEtB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Q0FBQyxXQUFXLENBQWUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDbEgsQ0FBQztBQUZELHdDQUVDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLE9BQWdCO0lBQzlDLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGdCQUFRLENBQUMsT0FBTyxDQUFDO0FBQ2xELENBQUM7QUFGRCwwQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcblxyXG5UaGUgdmFsdWVzIGZvciB0aGUgdmFyaW91cyBmb3JrIGNvaW5zIGNhbiBiZSBmb3VuZCBpbiB0aGVzZSBmaWxlczpcclxuXHJcbnByb3BlcnR5ICAgICAgIGZpbGVuYW1lICAgICAgICAgICAgICAgICAgdmFybmFtZSAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5tZXNzYWdlUHJlZml4ICBzcmMvdmFsaWRhdGlvbi5jcHAgICAgICAgIHN0ck1lc3NhZ2VNYWdpYyAgICAgICAgICAgICAgICAgICBGb3JtYXQgYCR7Q29pbk5hbWV9IFNpZ25lZCBNZXNzYWdlYFxyXG5iZWNoMzJfaHJwICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJlY2gzMl9ocnAgICAgICAgICAgICAgICAgICAgICAgICBPbmx5IGZvciBzb21lIG5ldHdvcmtzXHJcbmJpcDMyLnB1YmxpYyAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbRVhUX1BVQkxJQ19LRVldICAgIE1haW5uZXRzIGhhdmUgc2FtZSB2YWx1ZSwgdGVzdG5ldHMgaGF2ZSBzYW1lIHZhbHVlXHJcbmJpcDMyLnByaXZhdGUgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbRVhUX1NFQ1JFVF9LRVldICAgIE1haW5uZXRzIGhhdmUgc2FtZSB2YWx1ZSwgdGVzdG5ldHMgaGF2ZSBzYW1lIHZhbHVlXHJcbnB1YktleUhhc2ggICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbUFVCS0VZX0FERFJFU1NdXHJcbnNjcmlwdEhhc2ggICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbU0NSSVBUX0FERFJFU1NdXHJcbndpZiAgICAgICAgICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbU0VDUkVUX0tFWV0gICAgICAgIFRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxyXG5mb3JrSWQgICAgICAgICBzcmMvc2NyaXB0L2ludGVycHJldGVyLmggIEZPUktJRF8qXHJcblxyXG4qL1xyXG5cclxuLyoqXHJcbiAqIEBkZXByZWNhdGVkXHJcbiAqL1xyXG5jb25zdCBjb2lucyA9IHtcclxuICAvKlxyXG4gICAqIFRoZSBvcmlnaW5hbCBCaXRjb2luIENhc2ggd2FzIHJlbmFtZWQgdG8gYml0Y29pbi1hYmMsIGFuZCBiaXRjb2luLWNhc2gtbm9kZSBmb3JrZWQgZnJvbSBpdC5cclxuICAgKiBMYXRlciwgYml0Y29pbi1hYmMgaXMgcmVicmFuZGVkIHRvIGVjYXNoLiBIZXJlLCAnYmNoJyBjb3JyZXNwb25kcyB0byBiaXRjb2luLWNhc2gtbm9kZSwgYW5kXHJcbiAgICogJ2JjaGEnIGNvcnJlc3BvbmRzIHRvIGVjYXNoLiBSZWY6IGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZVxyXG4gICAqICovXHJcbiAgQkNIOiAnYmNoJyxcclxuICBCQ0hBOiAnYmNoYScsXHJcbiAgQlNWOiAnYnN2JyxcclxuICBCVEM6ICdidGMnLFxyXG4gIEJURzogJ2J0ZycsXHJcbiAgTFRDOiAnbHRjJyxcclxuICBaRUM6ICd6ZWMnLFxyXG4gIERBU0g6ICdkYXNoJyxcclxuICBET0dFOiAnZG9nZScsXHJcbn0gYXMgY29uc3Q7XHJcblxyXG5leHBvcnQgdHlwZSBOZXR3b3JrTmFtZSA9XHJcbiAgfCAnYml0Y29pbidcclxuICB8ICd0ZXN0bmV0J1xyXG4gIHwgJ2JpdGNvaW5jYXNoJ1xyXG4gIHwgJ2JpdGNvaW5jYXNoVGVzdG5ldCdcclxuICB8ICdlY2FzaCdcclxuICB8ICdlY2FzaFRlc3QnXHJcbiAgfCAnYml0Y29pbmdvbGQnXHJcbiAgfCAnYml0Y29pbmdvbGRUZXN0bmV0J1xyXG4gIHwgJ2JpdGNvaW5zdidcclxuICB8ICdiaXRjb2luc3ZUZXN0bmV0J1xyXG4gIHwgJ2Rhc2gnXHJcbiAgfCAnZGFzaFRlc3QnXHJcbiAgfCAnZG9nZWNvaW4nXHJcbiAgfCAnZG9nZWNvaW5UZXN0J1xyXG4gIHwgJ2xpdGVjb2luJ1xyXG4gIHwgJ2xpdGVjb2luVGVzdCdcclxuICB8ICd6Y2FzaCdcclxuICB8ICd6Y2FzaFRlc3QnO1xyXG5cclxuZXhwb3J0IHR5cGUgTmV0d29yayA9IHtcclxuICBtZXNzYWdlUHJlZml4OiBzdHJpbmc7XHJcbiAgcHViS2V5SGFzaDogbnVtYmVyO1xyXG4gIHNjcmlwdEhhc2g6IG51bWJlcjtcclxuICB3aWY6IG51bWJlcjtcclxuICBiaXAzMjoge1xyXG4gICAgcHVibGljOiBudW1iZXI7XHJcbiAgICBwcml2YXRlOiBudW1iZXI7XHJcbiAgfTtcclxuICBjYXNoQWRkcj86IHtcclxuICAgIHByZWZpeDogc3RyaW5nO1xyXG4gICAgcHViS2V5SGFzaDogbnVtYmVyO1xyXG4gICAgc2NyaXB0SGFzaDogbnVtYmVyO1xyXG4gIH07XHJcbiAgYmVjaDMyPzogc3RyaW5nO1xyXG4gIGZvcmtJZD86IG51bWJlcjtcclxuICAvKipcclxuICAgKiBAZGVwcmVjYXRlZFxyXG4gICAqL1xyXG4gIGNvaW46IHN0cmluZztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGJhc2U1OCAneHB1YidcclxuICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgIC8vIGJhc2U1OCAneHBydidcclxuICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpIHtcclxuICByZXR1cm4ge1xyXG4gICAgLy8gYmFzZTU4ICd0cHViJ1xyXG4gICAgcHVibGljOiAweDA0MzU4N2NmLFxyXG4gICAgLy8gYmFzZTU4ICd0cHJ2J1xyXG4gICAgcHJpdmF0ZTogMHgwNDM1ODM5NCxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgbmV0d29ya3M6IFJlY29yZDxOZXR3b3JrTmFtZSwgTmV0d29yaz4gPSB7XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXRjb2luL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICBiaXRjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICdiYycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MDUsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CVEMsXHJcbiAgfSxcclxuICB0ZXN0bmV0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICd0YicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CVEMsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4tY2FzaC1ub2RlL2JpdGNvaW4tY2FzaC1ub2RlL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL2Nhc2hhZGRyLm1kXHJcbiAgYml0Y29pbmNhc2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJDSCxcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2JpdGNvaW5jYXNoJyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBiaXRjb2luY2FzaFRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxyXG4gICAgc2NyaXB0SGFzaDogMHhjNCxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkJDSCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2JjaHRlc3QnLFxyXG4gICAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgICBzY3JpcHRIYXNoOiAweDA4LFxyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi9tYXN0ZXIvc3JjL3NjcmlwdC9pbnRlcnByZXRlci5oXHJcbiAgYml0Y29pbmdvbGQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnYnRnJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDI2LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxNyxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGZvcmtJZDogNzksXHJcbiAgICBjb2luOiBjb2lucy5CVEcsXHJcbiAgfSxcclxuICBiaXRjb2luZ29sZFRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAndGJ0ZycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMTExLFxyXG4gICAgc2NyaXB0SGFzaDogMTk2LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgZm9ya0lkOiA3OSxcclxuICAgIGNvaW46IGNvaW5zLkJURyxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1zdi9iaXRjb2luLXN2L2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLXN2L2JpdGNvaW4tc3YvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGJpdGNvaW5zdjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlNWLFxyXG4gICAgZm9ya0lkOiAweDAwLFxyXG4gIH0sXHJcbiAgYml0Y29pbnN2VGVzdG5ldDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuQlNWLFxyXG4gICAgZm9ya0lkOiAweDAwLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXNocGF5L2Rhc2gvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhc2hwYXkvZGFzaC9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgZGFzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDRjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxMCxcclxuICAgIHdpZjogMHhjYyxcclxuICAgIGNvaW46IGNvaW5zLkRBU0gsXHJcbiAgfSxcclxuICBkYXNoVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDhjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxMyxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkRBU0gsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2RvZ2Vjb2luL2RvZ2Vjb2luL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb2dlY29pbi9kb2dlY29pbi9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gTWFpbm5ldCBiaXAzMiBoZXJlIGRvZXMgbm90IG1hdGNoIGRvZ2Vjb2luIGNvcmUsIHRoaXMgaXMgaW50ZW5kZWQgKHNlZSBCRy01MzI0MSlcclxuICBkb2dlY29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RG9nZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFlLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxNixcclxuICAgIHdpZjogMHg5ZSxcclxuICAgIGNvaW46IGNvaW5zLkRPR0UsXHJcbiAgfSxcclxuICBkb2dlY29pblRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURvZ2Vjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg3MSxcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZjEsXHJcbiAgICBjb2luOiBjb2lucy5ET0dFLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQml0Y29pbi1BQkMvYml0Y29pbi1hYmMvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdXRpbC9tZXNzYWdlLmNwcFxyXG4gIGVjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTZlQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQkNIQSxcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2VjYXNoJyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBlY2FzaFRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxNmVDYXNoIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CQ0hBLFxyXG4gICAgY2FzaEFkZHI6IHtcclxuICAgICAgcHJlZml4OiAnZWN0ZXN0JyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGxpdGVjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlMaXRlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnbHRjJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDMwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzMixcclxuICAgIHdpZjogMHhiMCxcclxuICAgIGNvaW46IGNvaW5zLkxUQyxcclxuICB9LFxyXG4gIGxpdGVjb2luVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5TGl0ZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ3RsdGMnLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweDNhLFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuTFRDLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIHpjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQyxcclxuICB9LFxyXG4gIHpjYXNoVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WkNhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFkMjUsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmEsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5aRUMsXHJcbiAgfSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJucyB7TmV0d29ya1tdfSBhbGwga25vd24gbmV0d29ya3MgYXMgYXJyYXlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROZXR3b3JrTGlzdCgpOiBOZXR3b3JrW10ge1xyXG4gIHJldHVybiBPYmplY3QudmFsdWVzKG5ldHdvcmtzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7TmV0d29ya05hbWV9IHRoZSBuYW1lIG9mIHRoZSBuZXR3b3JrLiBSZXR1cm5zIHVuZGVmaW5lZCBpZiBuZXR3b3JrIGlzIG5vdCBhIHZhbHVlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgb2YgYG5ldHdvcmtzYFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE5ldHdvcmtOYW1lKG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrTmFtZSB8IHVuZGVmaW5lZCB7XHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG5ldHdvcmtzKS5maW5kKChuKSA9PiAobmV0d29ya3MgYXMgUmVjb3JkPHN0cmluZywgTmV0d29yaz4pW25dID09PSBuZXR3b3JrKSBhc1xyXG4gICAgfCBOZXR3b3JrTmFtZVxyXG4gICAgfCB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge09iamVjdH0gdGhlIG1haW5uZXQgY29ycmVzcG9uZGluZyB0byBhIHRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNYWlubmV0KG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrIHtcclxuICBzd2l0Y2ggKG5ldHdvcmspIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MudGVzdG5ldDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvaW47XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2hUZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbmNhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGRUZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbmdvbGQ7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdlRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luc3Y7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoVGVzdDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmRhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2hUZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZWNhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW5UZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MubGl0ZWNvaW47XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2hUZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuemNhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW5UZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZG9nZWNvaW47XHJcbiAgfVxyXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGEgbWFpbm5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFpbm5ldChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcms7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYSB0ZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNUZXN0bmV0KG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSAhPT0gbmV0d29yaztcclxufVxyXG5cclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG90aGVyTmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgYm90aCBuZXR3b3JrcyBhcmUgZm9yIHRoZSBzYW1lIGNvaW5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVDb2luKG5ldHdvcms6IE5ldHdvcmssIG90aGVyTmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBnZXRNYWlubmV0KG90aGVyTmV0d29yayk7XHJcbn1cclxuXHJcbmNvbnN0IG1haW5uZXRzID0gZ2V0TmV0d29ya0xpc3QoKS5maWx0ZXIoaXNNYWlubmV0KTtcclxuY29uc3QgdGVzdG5ldHMgPSBnZXROZXR3b3JrTGlzdCgpLmZpbHRlcihpc1Rlc3RuZXQpO1xyXG5cclxuLyoqXHJcbiAqIE1hcCB3aGVyZSBrZXlzIGFyZSBtYWlubmV0IG5ldHdvcmtzIGFuZCB2YWx1ZXMgYXJlIHRlc3RuZXQgbmV0d29ya3NcclxuICogQHR5cGUge01hcDxOZXR3b3JrLCBOZXR3b3JrW10+fVxyXG4gKi9cclxuY29uc3QgbWFpbm5ldFRlc3RuZXRQYWlycyA9IG5ldyBNYXAobWFpbm5ldHMubWFwKChtKSA9PiBbbSwgdGVzdG5ldHMuZmlsdGVyKCh0KSA9PiBnZXRNYWlubmV0KHQpID09PSBtKV0pKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge05ldHdvcmt8dW5kZWZpbmVkfSAtIFRoZSB0ZXN0bmV0IGNvcnJlc3BvbmRpbmcgdG8gYSBtYWlubmV0LlxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXR1cm5zIHVuZGVmaW5lZCBpZiBhIG5ldHdvcmsgaGFzIG5vIHRlc3RuZXQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdG5ldChuZXR3b3JrOiBOZXR3b3JrKTogTmV0d29yayB8IHVuZGVmaW5lZCB7XHJcbiAgaWYgKGlzVGVzdG5ldChuZXR3b3JrKSkge1xyXG4gICAgcmV0dXJuIG5ldHdvcms7XHJcbiAgfVxyXG4gIGNvbnN0IHRlc3RuZXRzID0gbWFpbm5ldFRlc3RuZXRQYWlycy5nZXQobmV0d29yayk7XHJcbiAgaWYgKHRlc3RuZXRzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBhcmd1bWVudGApO1xyXG4gIH1cclxuICBpZiAodGVzdG5ldHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGlmICh0ZXN0bmV0cy5sZW5ndGggPT09IDEpIHtcclxuICAgIHJldHVybiB0ZXN0bmV0c1swXTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKGBtb3JlIHRoYW4gb25lIHRlc3RuZXQgZm9yICR7Z2V0TmV0d29ya05hbWUobmV0d29yayl9YCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgYml0Y29pbiBvciB0ZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBiaXRjb2luY2FzaCBvciBiaXRjb2luY2FzaFRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGNvaW5DYXNoKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbmNhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZWNhc2ggb3IgZWNhc2hUZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNFQ2FzaChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmVjYXNoO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGJpdGNvaW5nb2xkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luR29sZChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW5nb2xkO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGJpdGNvaW5zdiBvciBiaXRjb2luc3ZUZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luU1YobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRjb2luc3Y7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZGFzaCBvciBkYXNoVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRGFzaChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmRhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZG9nZWNvaW4gb3IgZG9nZWNvaW5UZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNEb2dlY29pbihuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmRvZ2Vjb2luO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGxpdGVjb2luIG9yIGxpdGVjb2luVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTGl0ZWNvaW4obmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5saXRlY29pbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyB6Y2FzaCBvciB6Y2FzaFRlc3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1pjYXNoKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuemNhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3Vua25vd259IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSBpZmYgbmV0d29yayBpcyBhbnkgb2YgdGhlIG5ldHdvcmsgc3RhdGVkIGluIHRoZSBhcmd1bWVudFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWROZXR3b3JrKG5ldHdvcms6IHVua25vd24pOiBuZXR3b3JrIGlzIE5ldHdvcmsge1xyXG4gIHJldHVybiBnZXROZXR3b3JrTGlzdCgpLmluY2x1ZGVzKG5ldHdvcmsgYXMgTmV0d29yayk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1NlZ3dpdChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChbbmV0d29ya3MuYml0Y29pbiwgbmV0d29ya3MubGl0ZWNvaW4sIG5ldHdvcmtzLmJpdGNvaW5nb2xkXSBhcyBOZXR3b3JrW10pLmluY2x1ZGVzKGdldE1haW5uZXQobmV0d29yaykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNUYXByb290KG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbjtcclxufVxyXG4iXX0=