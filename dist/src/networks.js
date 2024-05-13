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
exports.supportsTaproot = exports.supportsSegwit = exports.isValidNetwork = exports.isZcash = exports.isLitecoin = exports.isDogecoin = exports.isDash = exports.isBitcoinSV = exports.isBithereum = exports.isBitcoinGold = exports.isECash = exports.isBitcoinCash = exports.isBitcoin = exports.getTestnet = exports.isSameCoin = exports.isTestnet = exports.isMainnet = exports.getMainnet = exports.getNetworkName = exports.getNetworkList = exports.networks = void 0;
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
    BTH: 'bth',
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
    komodo: {
        messagePrefix: '\x18Komodo Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x3c,
        scriptHash: 0x55,
        wif: 0xbc,
        coin: coins.ZEC
    },
    safecoin: {
        messagePrefix: '\x18Safecoin Signed Message:\n',
        bip32: {
            public: 0x0488b21f,
            private: 0x0488ade5
        },
        pubKeyHash: 0x3d,
        scriptHash: 0x56,
        wif: 0xbd,
        coin: coins.ZEC
    },
    bithereum: {
        messagePrefix: '\x18Bithereum Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x19,
        scriptHash: 0x28,
        wif: 0x80,
        coin: coins.BTH,
        forkId: 0x55, /* 85 */
    },
    zelcash: {
        messagePrefix: '\x18ZelCash Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC
    },
    flux: {
        messagePrefix: '\x18ZelCash Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC
    },
    zero: {
        messagePrefix: '\x18Zero Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC
    },
    snowgem: {
        messagePrefix: '\x18Snowgem Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1c28,
        scriptHash: 0x1c2d,
        wif: 0x80,
        coin: coins.ZEC
    },
    gemlink: {
        messagePrefix: '\x18Snowgem Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1c28,
        scriptHash: 0x1c2d,
        wif: 0x80,
        coin: coins.ZEC
    },
    commercium: {
        messagePrefix: '\x18Commercium Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1c,
        scriptHash: 0x33,
        wif: 0x8c,
        coin: coins.ZEC
    },
    zclassic: {
        messagePrefix: '\x18Zclassic Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC
    },
    bzedge: {
        messagePrefix: '\x18Bzedge Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC
    },
    genesis: {
        messagePrefix: "\x18Genesis Signed Message: \n",
        bip32: {
            public: 0x53414645,
            private: 0x53616665,
        },
        pubKeyHash: 0x1c,
        scriptHash: 0x3f,
        wif: 0x30,
        coin: coins.BTC
    },
    bitcoinzero: {
        messagePrefix: "\x18BitcoinZero Signed Message: \n",
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4,
        },
        pubKeyHash: 0x4b,
        scriptHash: 0x22,
        wif: 0xd2,
        coin: coins.BTC
    },
    bitcoinz: {
        messagePrefix: '\x18BitcoinZ Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.ZEC
    },
    hush: {
        messagePrefix: '\x18Hush Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        coin: coins.BTC
    },
    ravencoin: {
        messagePrefix: "\x18Ravencoin Signed Message: \n",
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4,
        },
        pubKeyHash: 0x3c,
        scriptHash: 0x7a,
        wif: 0x80,
        coin: coins.BTC
    },
    bitcore: {
        messagePrefix: "\x18Bitcore Signed Message: \n",
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4,
        },
        pubKeyHash: 0x03,
        scriptHash: 0x7d,
        wif: 0x80,
        coin: coins.BTC
    },
    zcoin: {
        messagePrefix: "\x18Zcoin Signed Message: \n",
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4,
        },
        pubKeyHash: 0x52,
        scriptHash: 0x07,
        wif: 0xd2,
        coin: coins.BTC
    },
    axe: {
        messagePrefix: '\x19Axe Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x37,
        scriptHash: 0x10,
        wif: 0xcc,
        coin: coins.DASH
    },
    digibyte: {
        messagePrefix: '\x19Digibyte Signed Message:\n',
        bech32: 'dgb',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x3f,
        wif: 0x80,
        coin: coins.BTC
    },
    sinovate: {
        messagePrefix: '\x18Sinovate Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x3f,
        scriptHash: 0x05,
        wif: 0xbf,
        coin: coins.BTC
    },
    ilcoin: {
        messagePrefix: '\x18ILCoin Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.BTC
    },
    raptoreum: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x3c,
        scriptHash: 0x10,
        wif: 0x80,
        coin: coins.DASH
    },
    vertcoin: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'vtc',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x47,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.BTC
    },
    fluxtestnet: {
        messagePrefix: '\x18ZelCash Signed Message:\n',
        bip32: {
            public: 0x043587cf,
            private: 0x04358394
        },
        pubKeyHash: 0x1d25,
        scriptHash: 0x1cba,
        wif: 0xef,
        coin: coins.ZEC
    },
    clore: {
        messagePrefix: "\x18Clore Signed Message: \n",
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4,
        },
        pubKeyHash: 0x17,
        scriptHash: 0x7a,
        wif: 0x70,
        coin: coins.BTC
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
 * @returns {boolean} true iff network is bithereum
 */
function isBithereum(network) {
    return getMainnet(network) === exports.networks.bithereum;
}
exports.isBithereum = isBithereum;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbmV0d29ya3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7RUFlRTs7O0FBRUY7O0dBRUc7QUFDSCxNQUFNLEtBQUssR0FBRztJQUNaOzs7O1NBSUs7SUFDTCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0lBQ1osR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFJLEVBQUUsTUFBTTtDQUNKLENBQUM7QUFzRVgsU0FBUyxzQkFBc0I7SUFDN0IsT0FBTztRQUNMLGdCQUFnQjtRQUNoQixNQUFNLEVBQUUsVUFBVTtRQUNsQixnQkFBZ0I7UUFDaEIsT0FBTyxFQUFFLFVBQVU7S0FDcEIsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLHNCQUFzQjtJQUM3QixPQUFPO1FBQ0wsZ0JBQWdCO1FBQ2hCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLGdCQUFnQjtRQUNoQixPQUFPLEVBQUUsVUFBVTtLQUNwQixDQUFDO0FBQ0osQ0FBQztBQUVZLFFBQUEsUUFBUSxHQUFpQztJQUNwRCxvRUFBb0U7SUFDcEUscUVBQXFFO0lBQ3JFLE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7SUFDRCxPQUFPLEVBQUU7UUFDUCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBRUQsd0ZBQXdGO0lBQ3hGLHlGQUF5RjtJQUN6RixpRkFBaUY7SUFDakYsV0FBVyxFQUFFO1FBQ1gsYUFBYSxFQUFFLCtCQUErQjtRQUM5QyxLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7UUFDZixNQUFNLEVBQUUsSUFBSTtRQUNaLFFBQVEsRUFBRTtZQUNSLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxJQUFJO1NBQ2pCO0tBQ0Y7SUFDRCxrQkFBa0IsRUFBRTtRQUNsQixhQUFhLEVBQUUsK0JBQStCO1FBQzlDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztRQUNmLFFBQVEsRUFBRTtZQUNSLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxJQUFJO1NBQ2pCO0tBQ0Y7SUFFRCxrRUFBa0U7SUFDbEUsbUVBQW1FO0lBQ25FLHdFQUF3RTtJQUN4RSxXQUFXLEVBQUU7UUFDWCxhQUFhLEVBQUUsb0NBQW9DO1FBQ25ELE1BQU0sRUFBRSxLQUFLO1FBQ2IsS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsTUFBTSxFQUFFLEVBQUU7UUFDVixJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7SUFDRCxrQkFBa0IsRUFBRTtRQUNsQixhQUFhLEVBQUUsb0NBQW9DO1FBQ25ELE1BQU0sRUFBRSxNQUFNO1FBQ2QsS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxHQUFHO1FBQ2YsVUFBVSxFQUFFLEdBQUc7UUFDZixHQUFHLEVBQUUsSUFBSTtRQUNULE1BQU0sRUFBRSxFQUFFO1FBQ1YsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBRUQsMEVBQTBFO0lBQzFFLDJFQUEyRTtJQUMzRSxTQUFTLEVBQUU7UUFDVCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztRQUNmLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFDRCxnQkFBZ0IsRUFBRTtRQUNoQixhQUFhLEVBQUUsK0JBQStCO1FBQzlDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztRQUNmLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFFRCxpRUFBaUU7SUFDakUsa0VBQWtFO0lBQ2xFLElBQUksRUFBRTtRQUNKLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsYUFBYSxFQUFFLGdDQUFnQztRQUMvQyxLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakI7SUFFRCxzRUFBc0U7SUFDdEUsdUVBQXVFO0lBQ3ZFLG1GQUFtRjtJQUNuRixRQUFRLEVBQUU7UUFDUixhQUFhLEVBQUUsZ0NBQWdDO1FBQy9DLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNqQjtJQUNELFlBQVksRUFBRTtRQUNaLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCO0lBRUQsNEVBQTRFO0lBQzVFLDZFQUE2RTtJQUM3RSw4RUFBOEU7SUFDOUUsS0FBSyxFQUFFO1FBQ0wsYUFBYSxFQUFFLDZCQUE2QjtRQUM1QyxLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsTUFBTSxFQUFFLElBQUk7UUFDWixRQUFRLEVBQUU7WUFDUixNQUFNLEVBQUUsT0FBTztZQUNmLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxJQUFJO1NBQ2pCO0tBQ0Y7SUFDRCxTQUFTLEVBQUU7UUFDVCxhQUFhLEVBQUUsNkJBQTZCO1FBQzVDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixRQUFRLEVBQUU7WUFDUixNQUFNLEVBQUUsUUFBUTtZQUNoQixVQUFVLEVBQUUsSUFBSTtZQUNoQixVQUFVLEVBQUUsSUFBSTtTQUNqQjtLQUNGO0lBRUQsOEVBQThFO0lBQzlFLCtFQUErRTtJQUMvRSxRQUFRLEVBQUU7UUFDUixhQUFhLEVBQUUsZ0NBQWdDO1FBQy9DLE1BQU0sRUFBRSxLQUFLO1FBQ2IsS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBQ0QsWUFBWSxFQUFFO1FBQ1osYUFBYSxFQUFFLGdDQUFnQztRQUMvQyxNQUFNLEVBQUUsTUFBTTtRQUNkLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUVELGdFQUFnRTtJQUNoRSxpRUFBaUU7SUFDakUsS0FBSyxFQUFFO1FBQ0wsYUFBYSxFQUFFLDZCQUE2QjtRQUM1QyxLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLE1BQU07UUFDbEIsVUFBVSxFQUFFLE1BQU07UUFDbEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7SUFDRCxTQUFTLEVBQUU7UUFDVCxhQUFhLEVBQUUsNkJBQTZCO1FBQzVDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSw4QkFBOEI7UUFDN0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFFBQVEsRUFBRTtRQUNSLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFNBQVMsRUFBRTtRQUNULGFBQWEsRUFBRSxpQ0FBaUM7UUFDaEQsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztRQUNmLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUTtLQUN2QjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLGFBQWEsRUFBRSw0QkFBNEI7UUFDM0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFVBQVUsRUFBRTtRQUNWLGFBQWEsRUFBRSxrQ0FBa0M7UUFDakQsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFFBQVEsRUFBRTtRQUNSLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSw4QkFBOEI7UUFDN0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFdBQVcsRUFBRTtRQUNYLGFBQWEsRUFBRSxvQ0FBb0M7UUFDbkQsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFHLFVBQVU7WUFDbkIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFFBQVEsRUFBRTtRQUNSLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLGFBQWEsRUFBRSw0QkFBNEI7UUFDM0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsTUFBTTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELFNBQVMsRUFBRTtRQUNULGFBQWEsRUFBRSxrQ0FBa0M7UUFDakQsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFHLFVBQVU7WUFDbkIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFHLFVBQVU7WUFDbkIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLGFBQWEsRUFBRSw4QkFBOEI7UUFDN0MsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFHLFVBQVU7WUFDbkIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELEdBQUcsRUFBRTtRQUNILGFBQWEsRUFBRSwyQkFBMkI7UUFDMUMsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFVBQVU7WUFDbEIsT0FBTyxFQUFFLFVBQVU7U0FDcEI7UUFDRCxVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNqQjtJQUNELFFBQVEsRUFBRTtRQUNSLGFBQWEsRUFBRSxnQ0FBZ0M7UUFDL0MsTUFBTSxFQUFFLEtBQUs7UUFDYixLQUFLLEVBQUU7WUFDTCxNQUFNLEVBQUUsVUFBVTtZQUNsQixPQUFPLEVBQUUsVUFBVTtTQUNwQjtRQUNELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsYUFBYSxFQUFFLGdDQUFnQztRQUMvQyxLQUFLLEVBQUU7WUFDTCxNQUFNLEVBQUUsVUFBVTtZQUNsQixPQUFPLEVBQUUsVUFBVTtTQUNwQjtRQUNELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBQ0QsTUFBTSxFQUFFO1FBQ04sYUFBYSxFQUFFLDhCQUE4QjtRQUM3QyxLQUFLLEVBQUU7WUFDTCxNQUFNLEVBQUUsVUFBVTtZQUNsQixPQUFPLEVBQUUsVUFBVTtTQUNwQjtRQUNELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHO0tBQ2hCO0lBQ0QsU0FBUyxFQUFFO1FBQ1QsYUFBYSxFQUFFLGdDQUFnQztRQUMvQyxLQUFLLEVBQUU7WUFDTCxNQUFNLEVBQUUsVUFBVTtZQUNsQixPQUFPLEVBQUUsVUFBVTtTQUNwQjtRQUNELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsYUFBYSxFQUFFLCtCQUErQjtRQUM5QyxNQUFNLEVBQUUsS0FBSztRQUNiLEtBQUssRUFBRTtZQUNMLE1BQU0sRUFBRSxVQUFVO1lBQ2xCLE9BQU8sRUFBRSxVQUFVO1NBQ3BCO1FBQ0QsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7SUFDRCxXQUFXLEVBQUU7UUFDWCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLEtBQUssRUFBRTtZQUNMLE1BQU0sRUFBRSxVQUFVO1lBQ2xCLE9BQU8sRUFBRSxVQUFVO1NBQ3BCO1FBQ0QsVUFBVSxFQUFFLE1BQU07UUFDbEIsVUFBVSxFQUFFLE1BQU07UUFDbEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7SUFDRCxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsOEJBQThCO1FBQzdDLEtBQUssRUFBRTtZQUNMLE1BQU0sRUFBRyxVQUFVO1lBQ25CLE9BQU8sRUFBRSxVQUFVO1NBQ3BCO1FBQ0QsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7Q0FDRixDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFnQixjQUFjO0lBQzVCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUZELHdDQUVDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxPQUFnQjtJQUM3QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUUsZ0JBQW9DLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUVoRixDQUFDO0FBQ2hCLENBQUM7QUFKRCx3Q0FJQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxPQUFnQjtJQUN6QyxRQUFRLE9BQU8sRUFBRTtRQUNmLEtBQUssZ0JBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxnQkFBUSxDQUFDLE9BQU87WUFDbkIsT0FBTyxnQkFBUSxDQUFDLE9BQU8sQ0FBQztRQUUxQixLQUFLLGdCQUFRLENBQUMsV0FBVyxDQUFDO1FBQzFCLEtBQUssZ0JBQVEsQ0FBQyxrQkFBa0I7WUFDOUIsT0FBTyxnQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUU5QixLQUFLLGdCQUFRLENBQUMsV0FBVyxDQUFDO1FBQzFCLEtBQUssZ0JBQVEsQ0FBQyxrQkFBa0I7WUFDOUIsT0FBTyxnQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUU5QixLQUFLLGdCQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssZ0JBQVEsQ0FBQyxnQkFBZ0I7WUFDNUIsT0FBTyxnQkFBUSxDQUFDLFNBQVMsQ0FBQztRQUU1QixLQUFLLGdCQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssZ0JBQVEsQ0FBQyxRQUFRO1lBQ3BCLE9BQU8sZ0JBQVEsQ0FBQyxJQUFJLENBQUM7UUFFdkIsS0FBSyxnQkFBUSxDQUFDLEtBQUssQ0FBQztRQUNwQixLQUFLLGdCQUFRLENBQUMsU0FBUztZQUNyQixPQUFPLGdCQUFRLENBQUMsS0FBSyxDQUFDO1FBRXhCLEtBQUssZ0JBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdkIsS0FBSyxnQkFBUSxDQUFDLFlBQVk7WUFDeEIsT0FBTyxnQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUUzQixLQUFLLGdCQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3BCLEtBQUssZ0JBQVEsQ0FBQyxTQUFTO1lBQ3JCLE9BQU8sZ0JBQVEsQ0FBQyxLQUFLLENBQUM7UUFFeEIsS0FBSyxnQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLGdCQUFRLENBQUMsWUFBWTtZQUN4QixPQUFPLGdCQUFRLENBQUMsUUFBUSxDQUFDO0tBQzVCO0lBQ0QsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUF2Q0QsZ0NBdUNDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLE9BQWdCO0lBQ3hDLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLE9BQU8sQ0FBQztBQUN6QyxDQUFDO0FBRkQsOEJBRUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixTQUFTLENBQUMsT0FBZ0I7SUFDeEMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssT0FBTyxDQUFDO0FBQ3pDLENBQUM7QUFGRCw4QkFFQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLE9BQWdCLEVBQUUsWUFBcUI7SUFDaEUsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFGRCxnQ0FFQztBQUVELE1BQU0sUUFBUSxHQUFHLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNwRCxNQUFNLFFBQVEsR0FBRyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFcEQ7OztHQUdHO0FBQ0gsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFM0c7Ozs7R0FJRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxPQUFnQjtJQUN6QyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUN0QixPQUFPLE9BQU8sQ0FBQztLQUNoQjtJQUNELE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQ3JDO0lBQ0QsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QixPQUFPO0tBQ1I7SUFDRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3pCLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BCO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMxRSxDQUFDO0FBZkQsZ0NBZUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixTQUFTLENBQUMsT0FBZ0I7SUFDeEMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssZ0JBQVEsQ0FBQyxPQUFPLENBQUM7QUFDbEQsQ0FBQztBQUZELDhCQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLE9BQWdCO0lBQzVDLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGdCQUFRLENBQUMsV0FBVyxDQUFDO0FBQ3RELENBQUM7QUFGRCxzQ0FFQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxPQUFnQjtJQUN0QyxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxnQkFBUSxDQUFDLEtBQUssQ0FBQztBQUNoRCxDQUFDO0FBRkQsMEJBRUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixhQUFhLENBQUMsT0FBZ0I7SUFDNUMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssZ0JBQVEsQ0FBQyxXQUFXLENBQUM7QUFDdEQsQ0FBQztBQUZELHNDQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsV0FBVyxDQUFDLE9BQWdCO0lBQzFDLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGdCQUFRLENBQUMsU0FBUyxDQUFDO0FBQ3BELENBQUM7QUFGRCxrQ0FFQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxPQUFnQjtJQUMxQyxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxnQkFBUSxDQUFDLFNBQVMsQ0FBQztBQUNwRCxDQUFDO0FBRkQsa0NBRUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixNQUFNLENBQUMsT0FBZ0I7SUFDckMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssZ0JBQVEsQ0FBQyxJQUFJLENBQUM7QUFDL0MsQ0FBQztBQUZELHdCQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLE9BQWdCO0lBQ3pDLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGdCQUFRLENBQUMsUUFBUSxDQUFDO0FBQ25ELENBQUM7QUFGRCxnQ0FFQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxPQUFnQjtJQUN6QyxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxnQkFBUSxDQUFDLFFBQVEsQ0FBQztBQUNuRCxDQUFDO0FBRkQsZ0NBRUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixPQUFPLENBQUMsT0FBZ0I7SUFDdEMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssZ0JBQVEsQ0FBQyxLQUFLLENBQUM7QUFDaEQsQ0FBQztBQUZELDBCQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLE9BQWdCO0lBQzdDLE9BQU8sY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQWtCLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRkQsd0NBRUM7QUFFRCxTQUFnQixjQUFjLENBQUMsT0FBZ0I7SUFDN0MsT0FBUSxDQUFDLGdCQUFRLENBQUMsT0FBTyxFQUFFLGdCQUFRLENBQUMsUUFBUSxFQUFFLGdCQUFRLENBQUMsV0FBVyxDQUFlLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ2xILENBQUM7QUFGRCx3Q0FFQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxPQUFnQjtJQUM5QyxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxnQkFBUSxDQUFDLE9BQU8sQ0FBQztBQUNsRCxDQUFDO0FBRkQsMENBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG5cclxuVGhlIHZhbHVlcyBmb3IgdGhlIHZhcmlvdXMgZm9yayBjb2lucyBjYW4gYmUgZm91bmQgaW4gdGhlc2UgZmlsZXM6XHJcblxyXG5wcm9wZXJ0eSAgICAgICBmaWxlbmFtZSAgICAgICAgICAgICAgICAgIHZhcm5hbWUgICAgICAgICAgICAgICAgICAgICAgICAgICBub3Rlc1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxubWVzc2FnZVByZWZpeCAgc3JjL3ZhbGlkYXRpb24uY3BwICAgICAgICBzdHJNZXNzYWdlTWFnaWMgICAgICAgICAgICAgICAgICAgRm9ybWF0IGAke0NvaW5OYW1lfSBTaWduZWQgTWVzc2FnZWBcclxuYmVjaDMyX2hycCAgICAgc3JjL2NoYWlucGFyYW1zLmNwcCAgICAgICBiZWNoMzJfaHJwICAgICAgICAgICAgICAgICAgICAgICAgT25seSBmb3Igc29tZSBuZXR3b3Jrc1xyXG5iaXAzMi5wdWJsaWMgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW0VYVF9QVUJMSUNfS0VZXSAgICBNYWlubmV0cyBoYXZlIHNhbWUgdmFsdWUsIHRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxyXG5iaXAzMi5wcml2YXRlICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW0VYVF9TRUNSRVRfS0VZXSAgICBNYWlubmV0cyBoYXZlIHNhbWUgdmFsdWUsIHRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxyXG5wdWJLZXlIYXNoICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1BVQktFWV9BRERSRVNTXVxyXG5zY3JpcHRIYXNoICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1NDUklQVF9BRERSRVNTXVxyXG53aWYgICAgICAgICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1NFQ1JFVF9LRVldICAgICAgICBUZXN0bmV0cyBoYXZlIHNhbWUgdmFsdWVcclxuZm9ya0lkICAgICAgICAgc3JjL3NjcmlwdC9pbnRlcnByZXRlci5oICBGT1JLSURfKlxyXG5cclxuKi9cclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZFxyXG4gKi9cclxuY29uc3QgY29pbnMgPSB7XHJcbiAgLypcclxuICAgKiBUaGUgb3JpZ2luYWwgQml0Y29pbiBDYXNoIHdhcyByZW5hbWVkIHRvIGJpdGNvaW4tYWJjLCBhbmQgYml0Y29pbi1jYXNoLW5vZGUgZm9ya2VkIGZyb20gaXQuXHJcbiAgICogTGF0ZXIsIGJpdGNvaW4tYWJjIGlzIHJlYnJhbmRlZCB0byBlY2FzaC4gSGVyZSwgJ2JjaCcgY29ycmVzcG9uZHMgdG8gYml0Y29pbi1jYXNoLW5vZGUsIGFuZFxyXG4gICAqICdiY2hhJyBjb3JyZXNwb25kcyB0byBlY2FzaC4gUmVmOiBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1jYXNoLW5vZGUvYml0Y29pbi1jYXNoLW5vZGVcclxuICAgKiAqL1xyXG4gIEJDSDogJ2JjaCcsXHJcbiAgQkNIQTogJ2JjaGEnLFxyXG4gIEJTVjogJ2JzdicsXHJcbiAgQlRDOiAnYnRjJyxcclxuICBCVEc6ICdidGcnLFxyXG4gIEJUSDogJ2J0aCcsXHJcbiAgTFRDOiAnbHRjJyxcclxuICBaRUM6ICd6ZWMnLFxyXG4gIERBU0g6ICdkYXNoJyxcclxuICBET0dFOiAnZG9nZScsXHJcbn0gYXMgY29uc3Q7XHJcblxyXG5leHBvcnQgdHlwZSBOZXR3b3JrTmFtZSA9XHJcbiAgfCAnYml0Y29pbidcclxuICB8ICd0ZXN0bmV0J1xyXG4gIHwgJ2JpdGNvaW5jYXNoJ1xyXG4gIHwgJ2JpdGNvaW5jYXNoVGVzdG5ldCdcclxuICB8ICdlY2FzaCdcclxuICB8ICdlY2FzaFRlc3QnXHJcbiAgfCAnYml0Y29pbmdvbGQnXHJcbiAgfCAnYml0Y29pbmdvbGRUZXN0bmV0J1xyXG4gIHwgJ2JpdGNvaW5zdidcclxuICB8ICdiaXRjb2luc3ZUZXN0bmV0J1xyXG4gIHwgJ2Rhc2gnXHJcbiAgfCAnZGFzaFRlc3QnXHJcbiAgfCAnZG9nZWNvaW4nXHJcbiAgfCAnZG9nZWNvaW5UZXN0J1xyXG4gIHwgJ2xpdGVjb2luJ1xyXG4gIHwgJ2xpdGVjb2luVGVzdCdcclxuICB8ICd6Y2FzaCdcclxuICB8ICd6Y2FzaFRlc3QnXHJcbiAgfCAnYml0aGVyZXVtJ1xyXG4gIHwgJ3NhZmVjb2luJ1xyXG4gIHwgJ2tvbW9kbydcclxuICB8ICd6ZWxjYXNoJ1xyXG4gIHwgJ2ZsdXgnXHJcbiAgfCAnemVybydcclxuICB8ICdzbm93Z2VtJ1xyXG4gIHwgJ2dlbWxpbmsnXHJcbiAgfCAnY29tbWVyY2l1bSdcclxuICB8ICd6Y2xhc3NpYydcclxuICB8ICdiemVkZ2UnXHJcbiAgfCAnZ2VuZXNpcydcclxuICB8ICdiaXRjb2luemVybydcclxuICB8ICdiaXRjb2lueidcclxuICB8ICdodXNoJ1xyXG4gIHwgJ3JhdmVuY29pbidcclxuICB8ICdiaXRjb3JlJ1xyXG4gIHwgJ3pjb2luJ1xyXG4gIHwgJ2F4ZSdcclxuICB8ICdkaWdpYnl0ZSdcclxuICB8ICdzaW5vdmF0ZSdcclxuICB8ICdpbGNvaW4nXHJcbiAgfCAncmFwdG9yZXVtJ1xyXG4gIHwgJ3ZlcnRjb2luJ1xyXG4gIHwgJ2ZsdXh0ZXN0bmV0J1xyXG4gIHwgJ2Nsb3JlJztcclxuXHJcbmV4cG9ydCB0eXBlIE5ldHdvcmsgPSB7XHJcbiAgbWVzc2FnZVByZWZpeDogc3RyaW5nO1xyXG4gIHB1YktleUhhc2g6IG51bWJlcjtcclxuICBzY3JpcHRIYXNoOiBudW1iZXI7XHJcbiAgd2lmOiBudW1iZXI7XHJcbiAgYmlwMzI6IHtcclxuICAgIHB1YmxpYzogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZTogbnVtYmVyO1xyXG4gIH07XHJcbiAgY2FzaEFkZHI/OiB7XHJcbiAgICBwcmVmaXg6IHN0cmluZztcclxuICAgIHB1YktleUhhc2g6IG51bWJlcjtcclxuICAgIHNjcmlwdEhhc2g6IG51bWJlcjtcclxuICB9O1xyXG4gIGJlY2gzMj86IHN0cmluZztcclxuICBmb3JrSWQ/OiBudW1iZXI7XHJcbiAgLyoqXHJcbiAgICogQGRlcHJlY2F0ZWRcclxuICAgKi9cclxuICBjb2luOiBzdHJpbmc7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCkge1xyXG4gIHJldHVybiB7XHJcbiAgICAvLyBiYXNlNTggJ3hwdWInXHJcbiAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAvLyBiYXNlNTggJ3hwcnYnXHJcbiAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGJhc2U1OCAndHB1YidcclxuICAgIHB1YmxpYzogMHgwNDM1ODdjZixcclxuICAgIC8vIGJhc2U1OCAndHBydidcclxuICAgIHByaXZhdGU6IDB4MDQzNTgzOTQsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG5ldHdvcmtzOiBSZWNvcmQ8TmV0d29ya05hbWUsIE5ldHdvcms+ID0ge1xyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpdGNvaW4vYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgYml0Y29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnYmMnLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDLFxyXG4gIH0sXHJcbiAgdGVzdG5ldDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAndGInLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuQlRDLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZS9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1jYXNoLW5vZGUvYml0Y29pbi1jYXNoLW5vZGUvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luY2FzaG9yZy9iaXRjb2luY2FzaC5vcmcvYmxvYi9tYXN0ZXIvc3BlYy9jYXNoYWRkci5tZFxyXG4gIGJpdGNvaW5jYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MDUsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CQ0gsXHJcbiAgICBmb3JrSWQ6IDB4MDAsXHJcbiAgICBjYXNoQWRkcjoge1xyXG4gICAgICBwcmVmaXg6ICdiaXRjb2luY2FzaCcsXHJcbiAgICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICAgIHNjcmlwdEhhc2g6IDB4MDgsXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYml0Y29pbmNhc2hUZXN0bmV0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CQ0gsXHJcbiAgICBjYXNoQWRkcjoge1xyXG4gICAgICBwcmVmaXg6ICdiY2h0ZXN0JyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CVENHUFUvQlRDR1BVL2Jsb2IvbWFzdGVyL3NyYy9zY3JpcHQvaW50ZXJwcmV0ZXIuaFxyXG4gIGJpdGNvaW5nb2xkOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIEdvbGQgU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ2J0ZycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgyNixcclxuICAgIHNjcmlwdEhhc2g6IDB4MTcsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBmb3JrSWQ6IDc5LFxyXG4gICAgY29pbjogY29pbnMuQlRHLFxyXG4gIH0sXHJcbiAgYml0Y29pbmdvbGRUZXN0bmV0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIEdvbGQgU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ3RidGcnLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDExMSxcclxuICAgIHNjcmlwdEhhc2g6IDE5NixcclxuICAgIHdpZjogMHhlZixcclxuICAgIGZvcmtJZDogNzksXHJcbiAgICBjb2luOiBjb2lucy5CVEcsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4tc3YvYml0Y29pbi1zdi9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1zdi9iaXRjb2luLXN2L2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICBiaXRjb2luc3Y6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJTVixcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICB9LFxyXG4gIGJpdGNvaW5zdlRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxyXG4gICAgc2NyaXB0SGFzaDogMHhjNCxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkJTVixcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZGFzaHBheS9kYXNoL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXNocGF5L2Rhc2gvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGRhc2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURhcmtDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg0YyxcclxuICAgIHNjcmlwdEhhc2g6IDB4MTAsXHJcbiAgICB3aWY6IDB4Y2MsXHJcbiAgICBjb2luOiBjb2lucy5EQVNILFxyXG4gIH0sXHJcbiAgZGFzaFRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURhcmtDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg4YyxcclxuICAgIHNjcmlwdEhhc2g6IDB4MTMsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5EQVNILFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb2dlY29pbi9kb2dlY29pbi9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZG9nZWNvaW4vZG9nZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIC8vIE1haW5uZXQgYmlwMzIgaGVyZSBkb2VzIG5vdCBtYXRjaCBkb2dlY29pbiBjb3JlLCB0aGlzIGlzIGludGVuZGVkIChzZWUgQkctNTMyNDEpXHJcbiAgZG9nZWNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURvZ2Vjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgxZSxcclxuICAgIHNjcmlwdEhhc2g6IDB4MTYsXHJcbiAgICB3aWY6IDB4OWUsXHJcbiAgICBjb2luOiBjb2lucy5ET0dFLFxyXG4gIH0sXHJcbiAgZG9nZWNvaW5UZXN0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlEb2dlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NzEsXHJcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxyXG4gICAgd2lmOiAweGYxLFxyXG4gICAgY29pbjogY29pbnMuRE9HRSxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQml0Y29pbi1BQkMvYml0Y29pbi1hYmMvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JpdGNvaW4tQUJDL2JpdGNvaW4tYWJjL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQml0Y29pbi1BQkMvYml0Y29pbi1hYmMvYmxvYi9tYXN0ZXIvc3JjL3V0aWwvbWVzc2FnZS5jcHBcclxuICBlY2FzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE2ZUNhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJDSEEsXHJcbiAgICBmb3JrSWQ6IDB4MDAsXHJcbiAgICBjYXNoQWRkcjoge1xyXG4gICAgICBwcmVmaXg6ICdlY2FzaCcsXHJcbiAgICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICAgIHNjcmlwdEhhc2g6IDB4MDgsXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgZWNhc2hUZXN0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTZlQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuQkNIQSxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2VjdGVzdCcsXHJcbiAgICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICAgIHNjcmlwdEhhc2g6IDB4MDgsXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlY29pbi1wcm9qZWN0L2xpdGVjb2luL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlY29pbi1wcm9qZWN0L2xpdGVjb2luL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICBsaXRlY29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5TGl0ZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ2x0YycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgzMCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MzIsXHJcbiAgICB3aWY6IDB4YjAsXHJcbiAgICBjb2luOiBjb2lucy5MVEMsXHJcbiAgfSxcclxuICBsaXRlY29pblRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOUxpdGVjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICd0bHRjJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzYSxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkxUQyxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICB6Y2FzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WkNhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUMsXHJcbiAgfSxcclxuICB6Y2FzaFRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFpDYXNoIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgxZDI1LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JhLFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuWkVDLFxyXG4gIH0sXHJcbiAga29tb2RvOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThLb21vZG8gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4M2MsXHJcbiAgICBzY3JpcHRIYXNoOiAweDU1LFxyXG4gICAgd2lmOiAweGJjLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBzYWZlY29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4U2FmZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZixcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNVxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4M2QsXHJcbiAgICBzY3JpcHRIYXNoOiAweDU2LFxyXG4gICAgd2lmOiAweGJkLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBiaXRoZXJldW06IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGhlcmV1bSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxOSxcclxuICAgIHNjcmlwdEhhc2g6IDB4MjgsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CVEgsXHJcbiAgICBmb3JrSWQ6IDB4NTUsIC8qIDg1ICovXHJcbiAgfSxcclxuICB6ZWxjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaZWxDYXNoIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGZsdXg6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFplbENhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgemVybzoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WmVybyBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBzbm93Z2VtOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThTbm93Z2VtIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjMjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjMmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGdlbWxpbms6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFNub3dnZW0gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWMyOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWMyZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgY29tbWVyY2l1bToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Q29tbWVyY2l1bSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxYyxcclxuICAgIHNjcmlwdEhhc2g6IDB4MzMsXHJcbiAgICB3aWY6IDB4OGMsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIHpjbGFzc2ljOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaY2xhc3NpYyBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBiemVkZ2U6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJ6ZWRnZSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBnZW5lc2lzOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiBcIlxceDE4R2VuZXNpcyBTaWduZWQgTWVzc2FnZTogXFxuXCIsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4NTM0MTQ2NDUsXHJcbiAgICAgIHByaXZhdGU6IDB4NTM2MTY2NjUsXHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxYyxcclxuICAgIHNjcmlwdEhhc2g6IDB4M2YsXHJcbiAgICB3aWY6IDB4MzAsXHJcbiAgICBjb2luOiBjb2lucy5CVENcclxuICB9LFxyXG4gIGJpdGNvaW56ZXJvOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiBcIlxceDE4Qml0Y29pblplcm8gU2lnbmVkIE1lc3NhZ2U6IFxcblwiLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAgMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDRiLFxyXG4gICAgc2NyaXB0SGFzaDogMHgyMixcclxuICAgIHdpZjogMHhkMixcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgYml0Y29pbno6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW5aIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGh1c2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEh1c2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgcmF2ZW5jb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiBcIlxceDE4UmF2ZW5jb2luIFNpZ25lZCBNZXNzYWdlOiBcXG5cIixcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogIDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzYyxcclxuICAgIHNjcmlwdEhhc2g6IDB4N2EsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CVENcclxuICB9LFxyXG4gIGJpdGNvcmU6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThCaXRjb3JlIFNpZ25lZCBNZXNzYWdlOiBcXG5cIixcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogIDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgwMyxcclxuICAgIHNjcmlwdEhhc2g6IDB4N2QsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CVENcclxuICB9LFxyXG4gIHpjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiBcIlxceDE4WmNvaW4gU2lnbmVkIE1lc3NhZ2U6IFxcblwiLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAgMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDUyLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNyxcclxuICAgIHdpZjogMHhkMixcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgYXhlOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlBeGUgU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MzcsIC8vIGh0dHBzOi8vZGFzaC1kb2NzLmdpdGh1Yi5pby9lbi9kZXZlbG9wZXItcmVmZXJlbmNlI29wY29kZXNcclxuICAgIHNjcmlwdEhhc2g6IDB4MTAsXHJcbiAgICB3aWY6IDB4Y2MsXHJcbiAgICBjb2luOiBjb2lucy5EQVNIXHJcbiAgfSxcclxuICBkaWdpYnl0ZToge1x0XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlEaWdpYnl0ZSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnZGdiJyxcclxuICAgIGJpcDMyOiB7XHRcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFx0XHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcdFxyXG4gICAgfSxcdFxyXG4gICAgcHViS2V5SGFzaDogMHgxZSwgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1x0XHJcbiAgICBzY3JpcHRIYXNoOiAweDNmLFx0XHJcbiAgICB3aWY6IDB4ODAsXHRcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHRcclxuICBzaW5vdmF0ZToge1x0XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThTaW5vdmF0ZSBTaWduZWQgTWVzc2FnZTpcXG4nLFx0XHJcbiAgICBiaXAzMjoge1x0XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcdFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHRcclxuICAgIH0sXHRcclxuICAgIHB1YktleUhhc2g6IDB4M2YsIC8vIGh0dHBzOi8vZGFzaC1kb2NzLmdpdGh1Yi5pby9lbi9kZXZlbG9wZXItcmVmZXJlbmNlI29wY29kZXNcdFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcdFxyXG4gICAgd2lmOiAweGJmLFx0XHJcbiAgICBjb2luOiBjb2lucy5CVENcclxuICB9LFxyXG4gIGlsY29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4SUxDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgcmFwdG9yZXVtOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlEYXJrQ29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzYywgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1xyXG4gICAgc2NyaXB0SGFzaDogMHgxMCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkRBU0hcclxuICB9LFxyXG4gIHZlcnRjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICd2dGMnLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHg0NywgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1xyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgZmx1eHRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFplbENhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDM1ODdjZixcclxuICAgICAgcHJpdmF0ZTogMHgwNDM1ODM5NFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWQyNSxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiYSxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgY2xvcmU6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThDbG9yZSBTaWduZWQgTWVzc2FnZTogXFxuXCIsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6ICAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MTcsXHJcbiAgICBzY3JpcHRIYXNoOiAweDdhLFxyXG4gICAgd2lmOiAweDcwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJucyB7TmV0d29ya1tdfSBhbGwga25vd24gbmV0d29ya3MgYXMgYXJyYXlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROZXR3b3JrTGlzdCgpOiBOZXR3b3JrW10ge1xyXG4gIHJldHVybiBPYmplY3QudmFsdWVzKG5ldHdvcmtzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7TmV0d29ya05hbWV9IHRoZSBuYW1lIG9mIHRoZSBuZXR3b3JrLiBSZXR1cm5zIHVuZGVmaW5lZCBpZiBuZXR3b3JrIGlzIG5vdCBhIHZhbHVlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgb2YgYG5ldHdvcmtzYFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE5ldHdvcmtOYW1lKG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrTmFtZSB8IHVuZGVmaW5lZCB7XHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG5ldHdvcmtzKS5maW5kKChuKSA9PiAobmV0d29ya3MgYXMgUmVjb3JkPHN0cmluZywgTmV0d29yaz4pW25dID09PSBuZXR3b3JrKSBhc1xyXG4gICAgfCBOZXR3b3JrTmFtZVxyXG4gICAgfCB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge09iamVjdH0gdGhlIG1haW5uZXQgY29ycmVzcG9uZGluZyB0byBhIHRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNYWlubmV0KG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrIHtcclxuICBzd2l0Y2ggKG5ldHdvcmspIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MudGVzdG5ldDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvaW47XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2hUZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbmNhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGRUZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbmdvbGQ7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdlRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luc3Y7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoVGVzdDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmRhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2hUZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZWNhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW5UZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MubGl0ZWNvaW47XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2hUZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuemNhc2g7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW5UZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZG9nZWNvaW47XHJcbiAgfVxyXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGEgbWFpbm5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFpbm5ldChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcms7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYSB0ZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNUZXN0bmV0KG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSAhPT0gbmV0d29yaztcclxufVxyXG5cclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG90aGVyTmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgYm90aCBuZXR3b3JrcyBhcmUgZm9yIHRoZSBzYW1lIGNvaW5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVDb2luKG5ldHdvcms6IE5ldHdvcmssIG90aGVyTmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBnZXRNYWlubmV0KG90aGVyTmV0d29yayk7XHJcbn1cclxuXHJcbmNvbnN0IG1haW5uZXRzID0gZ2V0TmV0d29ya0xpc3QoKS5maWx0ZXIoaXNNYWlubmV0KTtcclxuY29uc3QgdGVzdG5ldHMgPSBnZXROZXR3b3JrTGlzdCgpLmZpbHRlcihpc1Rlc3RuZXQpO1xyXG5cclxuLyoqXHJcbiAqIE1hcCB3aGVyZSBrZXlzIGFyZSBtYWlubmV0IG5ldHdvcmtzIGFuZCB2YWx1ZXMgYXJlIHRlc3RuZXQgbmV0d29ya3NcclxuICogQHR5cGUge01hcDxOZXR3b3JrLCBOZXR3b3JrW10+fVxyXG4gKi9cclxuY29uc3QgbWFpbm5ldFRlc3RuZXRQYWlycyA9IG5ldyBNYXAobWFpbm5ldHMubWFwKChtKSA9PiBbbSwgdGVzdG5ldHMuZmlsdGVyKCh0KSA9PiBnZXRNYWlubmV0KHQpID09PSBtKV0pKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge05ldHdvcmt8dW5kZWZpbmVkfSAtIFRoZSB0ZXN0bmV0IGNvcnJlc3BvbmRpbmcgdG8gYSBtYWlubmV0LlxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXR1cm5zIHVuZGVmaW5lZCBpZiBhIG5ldHdvcmsgaGFzIG5vIHRlc3RuZXQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdG5ldChuZXR3b3JrOiBOZXR3b3JrKTogTmV0d29yayB8IHVuZGVmaW5lZCB7XHJcbiAgaWYgKGlzVGVzdG5ldChuZXR3b3JrKSkge1xyXG4gICAgcmV0dXJuIG5ldHdvcms7XHJcbiAgfVxyXG4gIGNvbnN0IHRlc3RuZXRzID0gbWFpbm5ldFRlc3RuZXRQYWlycy5nZXQobmV0d29yayk7XHJcbiAgaWYgKHRlc3RuZXRzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBhcmd1bWVudGApO1xyXG4gIH1cclxuICBpZiAodGVzdG5ldHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGlmICh0ZXN0bmV0cy5sZW5ndGggPT09IDEpIHtcclxuICAgIHJldHVybiB0ZXN0bmV0c1swXTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKGBtb3JlIHRoYW4gb25lIHRlc3RuZXQgZm9yICR7Z2V0TmV0d29ya05hbWUobmV0d29yayl9YCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgYml0Y29pbiBvciB0ZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBiaXRjb2luY2FzaCBvciBiaXRjb2luY2FzaFRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGNvaW5DYXNoKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbmNhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZWNhc2ggb3IgZWNhc2hUZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNFQ2FzaChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmVjYXNoO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGJpdGNvaW5nb2xkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luR29sZChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW5nb2xkO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGJpdGhlcmV1bVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQml0aGVyZXVtKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0aGVyZXVtO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGJpdGNvaW5zdiBvciBiaXRjb2luc3ZUZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luU1YobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRjb2luc3Y7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZGFzaCBvciBkYXNoVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRGFzaChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmRhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZG9nZWNvaW4gb3IgZG9nZWNvaW5UZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNEb2dlY29pbihuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmRvZ2Vjb2luO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGxpdGVjb2luIG9yIGxpdGVjb2luVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTGl0ZWNvaW4obmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5saXRlY29pbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyB6Y2FzaCBvciB6Y2FzaFRlc3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1pjYXNoKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuemNhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3Vua25vd259IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSBpZmYgbmV0d29yayBpcyBhbnkgb2YgdGhlIG5ldHdvcmsgc3RhdGVkIGluIHRoZSBhcmd1bWVudFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWROZXR3b3JrKG5ldHdvcms6IHVua25vd24pOiBuZXR3b3JrIGlzIE5ldHdvcmsge1xyXG4gIHJldHVybiBnZXROZXR3b3JrTGlzdCgpLmluY2x1ZGVzKG5ldHdvcmsgYXMgTmV0d29yayk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1NlZ3dpdChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChbbmV0d29ya3MuYml0Y29pbiwgbmV0d29ya3MubGl0ZWNvaW4sIG5ldHdvcmtzLmJpdGNvaW5nb2xkXSBhcyBOZXR3b3JrW10pLmluY2x1ZGVzKGdldE1haW5uZXQobmV0d29yaykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNUYXByb290KG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbjtcclxufVxyXG4iXX0=