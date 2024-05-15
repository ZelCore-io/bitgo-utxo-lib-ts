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
        case exports.networks.bithereum:
            return exports.networks.bithereum;
        case exports.networks.safecoin:
            return exports.networks.safecoin;
        case exports.networks.komodo:
            return exports.networks.komodo;
        case exports.networks.zelcash:
            return exports.networks.zelcash;
        case exports.networks.flux:
        case exports.networks.fluxtestnet:
            return exports.networks.flux;
        case exports.networks.zero:
            return exports.networks.zero;
        case exports.networks.snowgem:
            return exports.networks.snowgem;
        case exports.networks.gemlink:
            return exports.networks.gemlink;
        case exports.networks.commercium:
            return exports.networks.commercium;
        case exports.networks.zclassic:
            return exports.networks.zclassic;
        case exports.networks.bzedge:
            return exports.networks.bzedge;
        case exports.networks.genesis:
            return exports.networks.genesis;
        case exports.networks.bitcoinzero:
            return exports.networks.bitcoinzero;
        case exports.networks.bitcoinz:
            return exports.networks.bitcoinz;
        case exports.networks.hush:
            return exports.networks.hush;
        case exports.networks.ravencoin:
            return exports.networks.ravencoin;
        case exports.networks.bitcore:
            return exports.networks.bitcore;
        case exports.networks.zcoin:
            return exports.networks.zcoin;
        case exports.networks.axe:
            return exports.networks.axe;
        case exports.networks.digibyte:
            return exports.networks.digibyte;
        case exports.networks.sinovate:
            return exports.networks.sinovate;
        case exports.networks.ilcoin:
            return exports.networks.ilcoin;
        case exports.networks.raptoreum:
            return exports.networks.raptoreum;
        case exports.networks.vertcoin:
            return exports.networks.vertcoin;
        case exports.networks.clore:
            return exports.networks.clore;
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
    const zcashMainnets = [
        exports.networks.zcash,
        exports.networks.zelcash,
        exports.networks.flux,
        exports.networks.zero,
        exports.networks.snowgem,
        exports.networks.gemlink,
        exports.networks.commercium,
        exports.networks.zclassic,
        exports.networks.bzedge,
        exports.networks.bitcoinz,
        exports.networks.komodo,
        exports.networks.safecoin,
    ];
    return zcashMainnets.includes(getMainnet(network));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbmV0d29ya3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7RUFlRTs7O0FBRUY7O0dBRUc7QUFDSCxNQUFNLEtBQUssR0FBRztJQUNaOzs7O1NBSUs7SUFDTCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0lBQ1osR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFJLEVBQUUsTUFBTTtDQUNKLENBQUM7QUFzRVgsU0FBUyxzQkFBc0I7SUFDN0IsT0FBTztRQUNMLGdCQUFnQjtRQUNoQixNQUFNLEVBQUUsVUFBVTtRQUNsQixnQkFBZ0I7UUFDaEIsT0FBTyxFQUFFLFVBQVU7S0FDcEIsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLHNCQUFzQjtJQUM3QixPQUFPO1FBQ0wsZ0JBQWdCO1FBQ2hCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLGdCQUFnQjtRQUNoQixPQUFPLEVBQUUsVUFBVTtLQUNwQixDQUFDO0FBQ0osQ0FBQztBQUVZLFFBQUEsUUFBUSxHQUFpQztJQUNwRCxvRUFBb0U7SUFDcEUscUVBQXFFO0lBQ3JFLE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUc7S0FDaEI7SUFDRCxPQUFPLEVBQUU7UUFDUCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLE1B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QU8sQ0FBQyxDQUFDLENBQUM7QUFDbEgsQ0FBQztBQUZELHdDQUVDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLE9BQWdCO0lBQzlDLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGdCQUFRLENBQUMsT0FBTyxDQUFDO0FBQ2xELENBQUM7QUFGRCwwQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcblxyXG5UaGUgdmFsdWVzIGZvciB0aGUgdmFyaW91cyBmb3JrIGNvaW5zIGNhbiBiZSBmb3VuZCBpbiB0aGVzZSBmaWxlczpcclxuXHJcbnByb3BlcnR5ICAgICAgIGZpbGVuYW1lICAgICAgICAgICAgICAgICAgdmFybmFtZSAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5tZXNzYWdlUHJlZml4ICBzcmMvdmFsaWRhdGlvbi5jcHAgICAgICAgIHN0ck1lc3NhZ2VNYWdpYyAgICAgICAgICAgICAgICAgICBGb3JtYXQgYCR7Q29pbk5hbWV9IFNpZ25lZCBNZXNzYWdlYFxyXG5iZWNoMzJfaHJwICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJlY2gzMl9ocnAgICAgICAgICAgICAgICAgICAgICAgICBPbmx5IGZvciBzb21lIG5ldHdvcmtzXHJcbmJpcDMyLnB1YmxpYyAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbRVhUX1BVQkxJQ19LRVldICAgIE1haW5uZXRzIGhhdmUgc2FtZSB2YWx1ZSwgdGVzdG5ldHMgaGF2ZSBzYW1lIHZhbHVlXHJcbmJpcDMyLnByaXZhdGUgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbRVhUX1NFQ1JFVF9LRVldICAgIE1haW5uZXRzIGhhdmUgc2FtZSB2YWx1ZSwgdGVzdG5ldHMgaGF2ZSBzYW1lIHZhbHVlXHJcbnB1YktleUhhc2ggICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbUFVCS0VZX0FERFJFU1NdXHJcbnNjcmlwdEhhc2ggICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbU0NSSVBUX0FERFJFU1NdXHJcbndpZiAgICAgICAgICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbU0VDUkVUX0tFWV0gICAgICAgIFRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxyXG5mb3JrSWQgICAgICAgICBzcmMvc2NyaXB0L2ludGVycHJldGVyLmggIEZPUktJRF8qXHJcblxyXG4qL1xyXG5cclxuLyoqXHJcbiAqIEBkZXByZWNhdGVkXHJcbiAqL1xyXG5jb25zdCBjb2lucyA9IHtcclxuICAvKlxyXG4gICAqIFRoZSBvcmlnaW5hbCBCaXRjb2luIENhc2ggd2FzIHJlbmFtZWQgdG8gYml0Y29pbi1hYmMsIGFuZCBiaXRjb2luLWNhc2gtbm9kZSBmb3JrZWQgZnJvbSBpdC5cclxuICAgKiBMYXRlciwgYml0Y29pbi1hYmMgaXMgcmVicmFuZGVkIHRvIGVjYXNoLiBIZXJlLCAnYmNoJyBjb3JyZXNwb25kcyB0byBiaXRjb2luLWNhc2gtbm9kZSwgYW5kXHJcbiAgICogJ2JjaGEnIGNvcnJlc3BvbmRzIHRvIGVjYXNoLiBSZWY6IGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZVxyXG4gICAqICovXHJcbiAgQkNIOiAnYmNoJyxcclxuICBCQ0hBOiAnYmNoYScsXHJcbiAgQlNWOiAnYnN2JyxcclxuICBCVEM6ICdidGMnLFxyXG4gIEJURzogJ2J0ZycsXHJcbiAgQlRIOiAnYnRoJyxcclxuICBMVEM6ICdsdGMnLFxyXG4gIFpFQzogJ3plYycsXHJcbiAgREFTSDogJ2Rhc2gnLFxyXG4gIERPR0U6ICdkb2dlJyxcclxufSBhcyBjb25zdDtcclxuXHJcbmV4cG9ydCB0eXBlIE5ldHdvcmtOYW1lID1cclxuICB8ICdiaXRjb2luJ1xyXG4gIHwgJ3Rlc3RuZXQnXHJcbiAgfCAnYml0Y29pbmNhc2gnXHJcbiAgfCAnYml0Y29pbmNhc2hUZXN0bmV0J1xyXG4gIHwgJ2VjYXNoJ1xyXG4gIHwgJ2VjYXNoVGVzdCdcclxuICB8ICdiaXRjb2luZ29sZCdcclxuICB8ICdiaXRjb2luZ29sZFRlc3RuZXQnXHJcbiAgfCAnYml0Y29pbnN2J1xyXG4gIHwgJ2JpdGNvaW5zdlRlc3RuZXQnXHJcbiAgfCAnZGFzaCdcclxuICB8ICdkYXNoVGVzdCdcclxuICB8ICdkb2dlY29pbidcclxuICB8ICdkb2dlY29pblRlc3QnXHJcbiAgfCAnbGl0ZWNvaW4nXHJcbiAgfCAnbGl0ZWNvaW5UZXN0J1xyXG4gIHwgJ3pjYXNoJ1xyXG4gIHwgJ3pjYXNoVGVzdCdcclxuICB8ICdiaXRoZXJldW0nXHJcbiAgfCAnc2FmZWNvaW4nXHJcbiAgfCAna29tb2RvJ1xyXG4gIHwgJ3plbGNhc2gnXHJcbiAgfCAnZmx1eCdcclxuICB8ICd6ZXJvJ1xyXG4gIHwgJ3Nub3dnZW0nXHJcbiAgfCAnZ2VtbGluaydcclxuICB8ICdjb21tZXJjaXVtJ1xyXG4gIHwgJ3pjbGFzc2ljJ1xyXG4gIHwgJ2J6ZWRnZSdcclxuICB8ICdnZW5lc2lzJ1xyXG4gIHwgJ2JpdGNvaW56ZXJvJ1xyXG4gIHwgJ2JpdGNvaW56J1xyXG4gIHwgJ2h1c2gnXHJcbiAgfCAncmF2ZW5jb2luJ1xyXG4gIHwgJ2JpdGNvcmUnXHJcbiAgfCAnemNvaW4nXHJcbiAgfCAnYXhlJ1xyXG4gIHwgJ2RpZ2lieXRlJ1xyXG4gIHwgJ3Npbm92YXRlJ1xyXG4gIHwgJ2lsY29pbidcclxuICB8ICdyYXB0b3JldW0nXHJcbiAgfCAndmVydGNvaW4nXHJcbiAgfCAnZmx1eHRlc3RuZXQnXHJcbiAgfCAnY2xvcmUnO1xyXG5cclxuZXhwb3J0IHR5cGUgTmV0d29yayA9IHtcclxuICBtZXNzYWdlUHJlZml4OiBzdHJpbmc7XHJcbiAgcHViS2V5SGFzaDogbnVtYmVyO1xyXG4gIHNjcmlwdEhhc2g6IG51bWJlcjtcclxuICB3aWY6IG51bWJlcjtcclxuICBiaXAzMjoge1xyXG4gICAgcHVibGljOiBudW1iZXI7XHJcbiAgICBwcml2YXRlOiBudW1iZXI7XHJcbiAgfTtcclxuICBjYXNoQWRkcj86IHtcclxuICAgIHByZWZpeDogc3RyaW5nO1xyXG4gICAgcHViS2V5SGFzaDogbnVtYmVyO1xyXG4gICAgc2NyaXB0SGFzaDogbnVtYmVyO1xyXG4gIH07XHJcbiAgYmVjaDMyPzogc3RyaW5nO1xyXG4gIGZvcmtJZD86IG51bWJlcjtcclxuICAvKipcclxuICAgKiBAZGVwcmVjYXRlZFxyXG4gICAqL1xyXG4gIGNvaW46IHN0cmluZztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGJhc2U1OCAneHB1YidcclxuICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgIC8vIGJhc2U1OCAneHBydidcclxuICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpIHtcclxuICByZXR1cm4ge1xyXG4gICAgLy8gYmFzZTU4ICd0cHViJ1xyXG4gICAgcHVibGljOiAweDA0MzU4N2NmLFxyXG4gICAgLy8gYmFzZTU4ICd0cHJ2J1xyXG4gICAgcHJpdmF0ZTogMHgwNDM1ODM5NCxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgbmV0d29ya3M6IFJlY29yZDxOZXR3b3JrTmFtZSwgTmV0d29yaz4gPSB7XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXRjb2luL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICBiaXRjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICdiYycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MDUsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CVEMsXHJcbiAgfSxcclxuICB0ZXN0bmV0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICd0YicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CVEMsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4tY2FzaC1ub2RlL2JpdGNvaW4tY2FzaC1ub2RlL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL2Nhc2hhZGRyLm1kXHJcbiAgYml0Y29pbmNhc2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJDSCxcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2JpdGNvaW5jYXNoJyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBiaXRjb2luY2FzaFRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxyXG4gICAgc2NyaXB0SGFzaDogMHhjNCxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkJDSCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2JjaHRlc3QnLFxyXG4gICAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgICBzY3JpcHRIYXNoOiAweDA4LFxyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi9tYXN0ZXIvc3JjL3NjcmlwdC9pbnRlcnByZXRlci5oXHJcbiAgYml0Y29pbmdvbGQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnYnRnJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDI2LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxNyxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGZvcmtJZDogNzksXHJcbiAgICBjb2luOiBjb2lucy5CVEcsXHJcbiAgfSxcclxuICBiaXRjb2luZ29sZFRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAndGJ0ZycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMTExLFxyXG4gICAgc2NyaXB0SGFzaDogMTk2LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgZm9ya0lkOiA3OSxcclxuICAgIGNvaW46IGNvaW5zLkJURyxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1zdi9iaXRjb2luLXN2L2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLXN2L2JpdGNvaW4tc3YvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGJpdGNvaW5zdjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlNWLFxyXG4gICAgZm9ya0lkOiAweDAwLFxyXG4gIH0sXHJcbiAgYml0Y29pbnN2VGVzdG5ldDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuQlNWLFxyXG4gICAgZm9ya0lkOiAweDAwLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXNocGF5L2Rhc2gvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhc2hwYXkvZGFzaC9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgZGFzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDRjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxMCxcclxuICAgIHdpZjogMHhjYyxcclxuICAgIGNvaW46IGNvaW5zLkRBU0gsXHJcbiAgfSxcclxuICBkYXNoVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDhjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxMyxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkRBU0gsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2RvZ2Vjb2luL2RvZ2Vjb2luL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb2dlY29pbi9kb2dlY29pbi9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gTWFpbm5ldCBiaXAzMiBoZXJlIGRvZXMgbm90IG1hdGNoIGRvZ2Vjb2luIGNvcmUsIHRoaXMgaXMgaW50ZW5kZWQgKHNlZSBCRy01MzI0MSlcclxuICBkb2dlY29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RG9nZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFlLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxNixcclxuICAgIHdpZjogMHg5ZSxcclxuICAgIGNvaW46IGNvaW5zLkRPR0UsXHJcbiAgfSxcclxuICBkb2dlY29pblRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURvZ2Vjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg3MSxcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZjEsXHJcbiAgICBjb2luOiBjb2lucy5ET0dFLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQml0Y29pbi1BQkMvYml0Y29pbi1hYmMvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdXRpbC9tZXNzYWdlLmNwcFxyXG4gIGVjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTZlQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQkNIQSxcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2VjYXNoJyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBlY2FzaFRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxNmVDYXNoIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CQ0hBLFxyXG4gICAgY2FzaEFkZHI6IHtcclxuICAgICAgcHJlZml4OiAnZWN0ZXN0JyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGxpdGVjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlMaXRlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnbHRjJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDMwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzMixcclxuICAgIHdpZjogMHhiMCxcclxuICAgIGNvaW46IGNvaW5zLkxUQyxcclxuICB9LFxyXG4gIGxpdGVjb2luVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5TGl0ZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ3RsdGMnLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweDNhLFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuTFRDLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIHpjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQyxcclxuICB9LFxyXG4gIHpjYXNoVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WkNhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFkMjUsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmEsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5aRUMsXHJcbiAgfSxcclxuICBrb21vZG86IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEtvbW9kbyBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzYyxcclxuICAgIHNjcmlwdEhhc2g6IDB4NTUsXHJcbiAgICB3aWY6IDB4YmMsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIHNhZmVjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThTYWZlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFmLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU1XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzZCxcclxuICAgIHNjcmlwdEhhc2g6IDB4NTYsXHJcbiAgICB3aWY6IDB4YmQsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGJpdGhlcmV1bToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0aGVyZXVtIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDE5LFxyXG4gICAgc2NyaXB0SGFzaDogMHgyOCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUSCxcclxuICAgIGZvcmtJZDogMHg1NSwgLyogODUgKi9cclxuICB9LFxyXG4gIHplbGNhc2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFplbENhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgZmx1eDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WmVsQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICB6ZXJvOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaZXJvIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIHNub3dnZW06IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFNub3dnZW0gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWMyOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWMyZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgZ2VtbGluazoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4U25vd2dlbSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxYzI4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxYzJkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBjb21tZXJjaXVtOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThDb21tZXJjaXVtIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzMyxcclxuICAgIHdpZjogMHg4YyxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgemNsYXNzaWM6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFpjbGFzc2ljIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGJ6ZWRnZToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4QnplZGdlIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGdlbmVzaXM6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThHZW5lc2lzIFNpZ25lZCBNZXNzYWdlOiBcXG5cIixcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHg1MzQxNDY0NSxcclxuICAgICAgcHJpdmF0ZTogMHg1MzYxNjY2NSxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzZixcclxuICAgIHdpZjogMHgzMCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgYml0Y29pbnplcm86IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThCaXRjb2luWmVybyBTaWduZWQgTWVzc2FnZTogXFxuXCIsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6ICAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4NGIsXHJcbiAgICBzY3JpcHRIYXNoOiAweDIyLFxyXG4gICAgd2lmOiAweGQyLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICBiaXRjb2luejoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pblogU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgaHVzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4SHVzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICByYXZlbmNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThSYXZlbmNvaW4gU2lnbmVkIE1lc3NhZ2U6IFxcblwiLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAgMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDNjLFxyXG4gICAgc2NyaXB0SGFzaDogMHg3YSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgYml0Y29yZToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogXCJcXHgxOEJpdGNvcmUgU2lnbmVkIE1lc3NhZ2U6IFxcblwiLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAgMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDAzLFxyXG4gICAgc2NyaXB0SGFzaDogMHg3ZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgemNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThaY29pbiBTaWduZWQgTWVzc2FnZTogXFxuXCIsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6ICAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4NTIsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA3LFxyXG4gICAgd2lmOiAweGQyLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICBheGU6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOUF4ZSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzNywgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1xyXG4gICAgc2NyaXB0SGFzaDogMHgxMCxcclxuICAgIHdpZjogMHhjYyxcclxuICAgIGNvaW46IGNvaW5zLkRBU0hcclxuICB9LFxyXG4gIGRpZ2lieXRlOiB7XHRcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURpZ2lieXRlIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICdkZ2InLFxyXG4gICAgYmlwMzI6IHtcdFxyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHRcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFx0XHJcbiAgICB9LFx0XHJcbiAgICBwdWJLZXlIYXNoOiAweDFlLCAvLyBodHRwczovL2Rhc2gtZG9jcy5naXRodWIuaW8vZW4vZGV2ZWxvcGVyLXJlZmVyZW5jZSNvcGNvZGVzXHRcclxuICAgIHNjcmlwdEhhc2g6IDB4M2YsXHRcclxuICAgIHdpZjogMHg4MCxcdFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcdFxyXG4gIHNpbm92YXRlOiB7XHRcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFNpbm92YXRlIFNpZ25lZCBNZXNzYWdlOlxcbicsXHRcclxuICAgIGJpcDMyOiB7XHRcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFx0XHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcdFxyXG4gICAgfSxcdFxyXG4gICAgcHViS2V5SGFzaDogMHgzZiwgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1x0XHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFx0XHJcbiAgICB3aWY6IDB4YmYsXHRcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgaWxjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThJTENvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICByYXB0b3JldW06IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURhcmtDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDNjLCAvLyBodHRwczovL2Rhc2gtZG9jcy5naXRodWIuaW8vZW4vZGV2ZWxvcGVyLXJlZmVyZW5jZSNvcGNvZGVzXHJcbiAgICBzY3JpcHRIYXNoOiAweDEwLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuREFTSFxyXG4gIH0sXHJcbiAgdmVydGNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ3Z0YycsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDQ3LCAvLyBodHRwczovL2Rhc2gtZG9jcy5naXRodWIuaW8vZW4vZGV2ZWxvcGVyLXJlZmVyZW5jZSNvcGNvZGVzXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICBmbHV4dGVzdG5ldDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WmVsQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0MzU4N2NmLFxyXG4gICAgICBwcml2YXRlOiAweDA0MzU4Mzk0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxZDI1LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JhLFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBjbG9yZToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogXCJcXHgxOENsb3JlIFNpZ25lZCBNZXNzYWdlOiBcXG5cIixcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogIDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxNyxcclxuICAgIHNjcmlwdEhhc2g6IDB4N2EsXHJcbiAgICB3aWY6IDB4NzAsXHJcbiAgICBjb2luOiBjb2lucy5CVENcclxuICB9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEByZXR1cm5zIHtOZXR3b3JrW119IGFsbCBrbm93biBuZXR3b3JrcyBhcyBhcnJheVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE5ldHdvcmtMaXN0KCk6IE5ldHdvcmtbXSB7XHJcbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMobmV0d29ya3MpO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtOZXR3b3JrTmFtZX0gdGhlIG5hbWUgb2YgdGhlIG5ldHdvcmsuIFJldHVybnMgdW5kZWZpbmVkIGlmIG5ldHdvcmsgaXMgbm90IGEgdmFsdWVcclxuICogICAgICAgICAgICAgICAgICAgICAgICBvZiBgbmV0d29ya3NgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV0d29ya05hbWUobmV0d29yazogTmV0d29yayk6IE5ldHdvcmtOYW1lIHwgdW5kZWZpbmVkIHtcclxuICByZXR1cm4gT2JqZWN0LmtleXMobmV0d29ya3MpLmZpbmQoKG4pID0+IChuZXR3b3JrcyBhcyBSZWNvcmQ8c3RyaW5nLCBOZXR3b3JrPilbbl0gPT09IG5ldHdvcmspIGFzXHJcbiAgICB8IE5ldHdvcmtOYW1lXHJcbiAgICB8IHVuZGVmaW5lZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgbWFpbm5ldCBjb3JyZXNwb25kaW5nIHRvIGEgdGVzdG5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1haW5uZXQobmV0d29yazogTmV0d29yayk6IE5ldHdvcmsge1xyXG4gIHN3aXRjaCAobmV0d29yaykge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy50ZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaFRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luY2FzaDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZFRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luZ29sZDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2VGVzdG5ldDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvaW5zdjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2hUZXN0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZGFzaDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaFRlc3Q6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5lY2FzaDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pblRlc3Q6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5saXRlY29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaFRlc3Q6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy56Y2FzaDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pblRlc3Q6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5kb2dlY29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGhlcmV1bTtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3Muc2FmZWNvaW47XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5rb21vZG87XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuemVsY2FzaDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXh0ZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZmx1eDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy56ZXJvO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnNub3dnZW07XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZ2VtbGluaztcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5jb21tZXJjaXVtO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy56Y2xhc3NpYztcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJ6ZWRnZTtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbmVzaXM6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5nZW5lc2lzO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luemVybztcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbno7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuaHVzaDtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnJhdmVuY29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb3JlO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy56Y29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmF4ZTtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuZGlnaWJ5dGU7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnNpbm92YXRlO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuaWxjb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MucmFwdG9yZXVtO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy52ZXJ0Y29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuY2xvcmU7XHJcbiAgICBcclxuICB9XHJcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYSBtYWlubmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNNYWlubmV0KG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29yaztcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBhIHRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Rlc3RuZXQobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspICE9PSBuZXR3b3JrO1xyXG59XHJcblxyXG4vKipcclxuICpcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gb3RoZXJOZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBib3RoIG5ldHdvcmtzIGFyZSBmb3IgdGhlIHNhbWUgY29pblxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZUNvaW4obmV0d29yazogTmV0d29yaywgb3RoZXJOZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IGdldE1haW5uZXQob3RoZXJOZXR3b3JrKTtcclxufVxyXG5cclxuY29uc3QgbWFpbm5ldHMgPSBnZXROZXR3b3JrTGlzdCgpLmZpbHRlcihpc01haW5uZXQpO1xyXG5jb25zdCB0ZXN0bmV0cyA9IGdldE5ldHdvcmtMaXN0KCkuZmlsdGVyKGlzVGVzdG5ldCk7XHJcblxyXG4vKipcclxuICogTWFwIHdoZXJlIGtleXMgYXJlIG1haW5uZXQgbmV0d29ya3MgYW5kIHZhbHVlcyBhcmUgdGVzdG5ldCBuZXR3b3Jrc1xyXG4gKiBAdHlwZSB7TWFwPE5ldHdvcmssIE5ldHdvcmtbXT59XHJcbiAqL1xyXG5jb25zdCBtYWlubmV0VGVzdG5ldFBhaXJzID0gbmV3IE1hcChtYWlubmV0cy5tYXAoKG0pID0+IFttLCB0ZXN0bmV0cy5maWx0ZXIoKHQpID0+IGdldE1haW5uZXQodCkgPT09IG0pXSkpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7TmV0d29ya3x1bmRlZmluZWR9IC0gVGhlIHRlc3RuZXQgY29ycmVzcG9uZGluZyB0byBhIG1haW5uZXQuXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJldHVybnMgdW5kZWZpbmVkIGlmIGEgbmV0d29yayBoYXMgbm8gdGVzdG5ldC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXN0bmV0KG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoaXNUZXN0bmV0KG5ldHdvcmspKSB7XHJcbiAgICByZXR1cm4gbmV0d29yaztcclxuICB9XHJcbiAgY29uc3QgdGVzdG5ldHMgPSBtYWlubmV0VGVzdG5ldFBhaXJzLmdldChuZXR3b3JrKTtcclxuICBpZiAodGVzdG5ldHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGFyZ3VtZW50YCk7XHJcbiAgfVxyXG4gIGlmICh0ZXN0bmV0cy5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgaWYgKHRlc3RuZXRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgcmV0dXJuIHRlc3RuZXRzWzBdO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoYG1vcmUgdGhhbiBvbmUgdGVzdG5ldCBmb3IgJHtnZXROZXR3b3JrTmFtZShuZXR3b3JrKX1gKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBiaXRjb2luIG9yIHRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGNvaW4obmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRjb2luO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGJpdGNvaW5jYXNoIG9yIGJpdGNvaW5jYXNoVGVzdG5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQml0Y29pbkNhc2gobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRjb2luY2FzaDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBlY2FzaCBvciBlY2FzaFRlc3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0VDYXNoKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuZWNhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYml0Y29pbmdvbGRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGNvaW5Hb2xkKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbmdvbGQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYml0aGVyZXVtXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRoZXJldW0obmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRoZXJldW07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYml0Y29pbnN2IG9yIGJpdGNvaW5zdlRlc3RuZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGNvaW5TVihuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW5zdjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBkYXNoIG9yIGRhc2hUZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNEYXNoKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuZGFzaDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBkb2dlY29pbiBvciBkb2dlY29pblRlc3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0RvZ2Vjb2luKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuZG9nZWNvaW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgbGl0ZWNvaW4gb3IgbGl0ZWNvaW5UZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNMaXRlY29pbihuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmxpdGVjb2luO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIHpjYXNoIG9yIHpjYXNoVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzWmNhc2gobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IHpjYXNoTWFpbm5ldHMgPSBbXHJcbiAgICBuZXR3b3Jrcy56Y2FzaCxcclxuICAgIG5ldHdvcmtzLnplbGNhc2gsXHJcbiAgICBuZXR3b3Jrcy5mbHV4LFxyXG4gICAgbmV0d29ya3MuemVybyxcclxuICAgIG5ldHdvcmtzLnNub3dnZW0sXHJcbiAgICBuZXR3b3Jrcy5nZW1saW5rLFxyXG4gICAgbmV0d29ya3MuY29tbWVyY2l1bSxcclxuICAgIG5ldHdvcmtzLnpjbGFzc2ljLFxyXG4gICAgbmV0d29ya3MuYnplZGdlLFxyXG4gICAgbmV0d29ya3MuYml0Y29pbnosXHJcbiAgICBuZXR3b3Jrcy5rb21vZG8sXHJcbiAgICBuZXR3b3Jrcy5zYWZlY29pbixcclxuICBdO1xyXG4gIHJldHVybiB6Y2FzaE1haW5uZXRzLmluY2x1ZGVzKGdldE1haW5uZXQobmV0d29yaykpO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHt1bmtub3dufSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSByZXR1cm5zIHRydWUgaWZmIG5ldHdvcmsgaXMgYW55IG9mIHRoZSBuZXR3b3JrIHN0YXRlZCBpbiB0aGUgYXJndW1lbnRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkTmV0d29yayhuZXR3b3JrOiB1bmtub3duKTogbmV0d29yayBpcyBOZXR3b3JrIHtcclxuICByZXR1cm4gZ2V0TmV0d29ya0xpc3QoKS5pbmNsdWRlcyhuZXR3b3JrIGFzIE5ldHdvcmspO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNTZWd3aXQobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAoW25ldHdvcmtzLmJpdGNvaW4sIG5ldHdvcmtzLmxpdGVjb2luLCBuZXR3b3Jrcy5iaXRjb2luZ29sZF0gYXMgTmV0d29ya1tdKS5pbmNsdWRlcyhnZXRNYWlubmV0KG5ldHdvcmspKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN1cHBvcnRzVGFwcm9vdChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW47XHJcbn1cclxuIl19