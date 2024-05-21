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
exports.supportsTaproot = exports.supportsSegwit = exports.isValidNetwork = exports.isGroestlcoin = exports.isZcash = exports.isLitecoin = exports.isDogecoin = exports.isDash = exports.isBitcoinSV = exports.isBithereum = exports.isBitcoinGold = exports.isECash = exports.isBitcoinCash = exports.isBitcoin = exports.getTestnet = exports.isSameCoin = exports.isTestnet = exports.isMainnet = exports.getMainnet = exports.getNetworkName = exports.getNetworkList = exports.networks = void 0;
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
    GRS: 'grs',
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
    groestlcoin: {
        messagePrefix: '\x1cGroestlCoin Signed Message:\n',
        bech32: 'grs',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x24,
        scriptHash: 0x05,
        wif: 0x80,
        coin: coins.GRS,
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
        case exports.networks.groestlcoin:
            return exports.networks.groestlcoin;
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
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
function isGroestlcoin(network) {
    return getMainnet(network) === exports.networks.groestlcoin;
}
exports.isGroestlcoin = isGroestlcoin;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbmV0d29ya3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7RUFlRTs7O0FBRUY7O0dBRUc7QUFDSCxNQUFNLEtBQUssR0FBRztJQUNaOzs7O1NBSUs7SUFDTCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0lBQ1osR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFJLEVBQUUsTUFBTTtJQUNaLEdBQUcsRUFBRSxLQUFLO0NBQ0YsQ0FBQztBQXVFWCxTQUFTLHNCQUFzQjtJQUM3QixPQUFPO1FBQ0wsZ0JBQWdCO1FBQ2hCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLGdCQUFnQjtRQUNoQixPQUFPLEVBQUUsVUFBVTtLQUNwQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsc0JBQXNCO0lBQzdCLE9BQU87UUFDTCxnQkFBZ0I7UUFDaEIsTUFBTSxFQUFFLFVBQVU7UUFDbEIsZ0JBQWdCO1FBQ2hCLE9BQU8sRUFBRSxVQUFVO0tBQ3BCLENBQUM7QUFDSixDQUFDO0FBRVksUUFBQSxRQUFRLEdBQWlDO0lBQ3BELG9FQUFvRTtJQUNwRSxxRUFBcUU7SUFDckUsT0FBTyxFQUFFO1FBQ1AsYUFBYSxFQUFFLCtCQUErQjtRQUM5QyxNQUFNLEVBQUUsSUFBSTtRQUNaLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtRQUMvQixVQUFVLEVBQUUsSUFBSTtRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQixHQUFHLEVBQUUsSUFBSTtRQUNULElBQUksRUFBRSxLQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEs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VSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDckQsQ0FBQztBQWhCRCwwQkFnQkM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixhQUFhLENBQUMsT0FBZ0I7SUFDNUMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssZ0JBQVEsQ0FBQyxXQUFXLENBQUM7QUFDdEQsQ0FBQztBQUZELHNDQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLE9BQWdCO0lBQzdDLE9BQU8sY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQWtCLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRkQsd0NBRUM7QUFFRCxTQUFnQixjQUFjLENBQUMsT0FBZ0I7SUFDN0MsT0FBUSxDQUFDLGdCQUFRLENBQUMsT0FBTyxFQUFFLGdCQUFRLENBQUMsUUFBUSxFQUFFLGdCQUFRLENBQUMsV0FBVyxDQUFlLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ2xILENBQUM7QUFGRCx3Q0FFQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxPQUFnQjtJQUM5QyxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxnQkFBUSxDQUFDLE9BQU8sQ0FBQztBQUNsRCxDQUFDO0FBRkQsMENBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG5cclxuVGhlIHZhbHVlcyBmb3IgdGhlIHZhcmlvdXMgZm9yayBjb2lucyBjYW4gYmUgZm91bmQgaW4gdGhlc2UgZmlsZXM6XHJcblxyXG5wcm9wZXJ0eSAgICAgICBmaWxlbmFtZSAgICAgICAgICAgICAgICAgIHZhcm5hbWUgICAgICAgICAgICAgICAgICAgICAgICAgICBub3Rlc1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxubWVzc2FnZVByZWZpeCAgc3JjL3ZhbGlkYXRpb24uY3BwICAgICAgICBzdHJNZXNzYWdlTWFnaWMgICAgICAgICAgICAgICAgICAgRm9ybWF0IGAke0NvaW5OYW1lfSBTaWduZWQgTWVzc2FnZWBcclxuYmVjaDMyX2hycCAgICAgc3JjL2NoYWlucGFyYW1zLmNwcCAgICAgICBiZWNoMzJfaHJwICAgICAgICAgICAgICAgICAgICAgICAgT25seSBmb3Igc29tZSBuZXR3b3Jrc1xyXG5iaXAzMi5wdWJsaWMgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW0VYVF9QVUJMSUNfS0VZXSAgICBNYWlubmV0cyBoYXZlIHNhbWUgdmFsdWUsIHRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxyXG5iaXAzMi5wcml2YXRlICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW0VYVF9TRUNSRVRfS0VZXSAgICBNYWlubmV0cyBoYXZlIHNhbWUgdmFsdWUsIHRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxyXG5wdWJLZXlIYXNoICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1BVQktFWV9BRERSRVNTXVxyXG5zY3JpcHRIYXNoICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1NDUklQVF9BRERSRVNTXVxyXG53aWYgICAgICAgICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1NFQ1JFVF9LRVldICAgICAgICBUZXN0bmV0cyBoYXZlIHNhbWUgdmFsdWVcclxuZm9ya0lkICAgICAgICAgc3JjL3NjcmlwdC9pbnRlcnByZXRlci5oICBGT1JLSURfKlxyXG5cclxuKi9cclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZFxyXG4gKi9cclxuY29uc3QgY29pbnMgPSB7XHJcbiAgLypcclxuICAgKiBUaGUgb3JpZ2luYWwgQml0Y29pbiBDYXNoIHdhcyByZW5hbWVkIHRvIGJpdGNvaW4tYWJjLCBhbmQgYml0Y29pbi1jYXNoLW5vZGUgZm9ya2VkIGZyb20gaXQuXHJcbiAgICogTGF0ZXIsIGJpdGNvaW4tYWJjIGlzIHJlYnJhbmRlZCB0byBlY2FzaC4gSGVyZSwgJ2JjaCcgY29ycmVzcG9uZHMgdG8gYml0Y29pbi1jYXNoLW5vZGUsIGFuZFxyXG4gICAqICdiY2hhJyBjb3JyZXNwb25kcyB0byBlY2FzaC4gUmVmOiBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1jYXNoLW5vZGUvYml0Y29pbi1jYXNoLW5vZGVcclxuICAgKiAqL1xyXG4gIEJDSDogJ2JjaCcsXHJcbiAgQkNIQTogJ2JjaGEnLFxyXG4gIEJTVjogJ2JzdicsXHJcbiAgQlRDOiAnYnRjJyxcclxuICBCVEc6ICdidGcnLFxyXG4gIEJUSDogJ2J0aCcsXHJcbiAgTFRDOiAnbHRjJyxcclxuICBaRUM6ICd6ZWMnLFxyXG4gIERBU0g6ICdkYXNoJyxcclxuICBET0dFOiAnZG9nZScsXHJcbiAgR1JTOiAnZ3JzJyxcclxufSBhcyBjb25zdDtcclxuXHJcbmV4cG9ydCB0eXBlIE5ldHdvcmtOYW1lID1cclxuICB8ICdiaXRjb2luJ1xyXG4gIHwgJ3Rlc3RuZXQnXHJcbiAgfCAnYml0Y29pbmNhc2gnXHJcbiAgfCAnYml0Y29pbmNhc2hUZXN0bmV0J1xyXG4gIHwgJ2VjYXNoJ1xyXG4gIHwgJ2VjYXNoVGVzdCdcclxuICB8ICdiaXRjb2luZ29sZCdcclxuICB8ICdiaXRjb2luZ29sZFRlc3RuZXQnXHJcbiAgfCAnYml0Y29pbnN2J1xyXG4gIHwgJ2JpdGNvaW5zdlRlc3RuZXQnXHJcbiAgfCAnZGFzaCdcclxuICB8ICdkYXNoVGVzdCdcclxuICB8ICdkb2dlY29pbidcclxuICB8ICdkb2dlY29pblRlc3QnXHJcbiAgfCAnbGl0ZWNvaW4nXHJcbiAgfCAnbGl0ZWNvaW5UZXN0J1xyXG4gIHwgJ3pjYXNoJ1xyXG4gIHwgJ3pjYXNoVGVzdCdcclxuICB8ICdiaXRoZXJldW0nXHJcbiAgfCAnc2FmZWNvaW4nXHJcbiAgfCAna29tb2RvJ1xyXG4gIHwgJ3plbGNhc2gnXHJcbiAgfCAnZmx1eCdcclxuICB8ICd6ZXJvJ1xyXG4gIHwgJ3Nub3dnZW0nXHJcbiAgfCAnZ2VtbGluaydcclxuICB8ICdjb21tZXJjaXVtJ1xyXG4gIHwgJ3pjbGFzc2ljJ1xyXG4gIHwgJ2J6ZWRnZSdcclxuICB8ICdnZW5lc2lzJ1xyXG4gIHwgJ2JpdGNvaW56ZXJvJ1xyXG4gIHwgJ2JpdGNvaW56J1xyXG4gIHwgJ2h1c2gnXHJcbiAgfCAncmF2ZW5jb2luJ1xyXG4gIHwgJ2JpdGNvcmUnXHJcbiAgfCAnemNvaW4nXHJcbiAgfCAnYXhlJ1xyXG4gIHwgJ2RpZ2lieXRlJ1xyXG4gIHwgJ3Npbm92YXRlJ1xyXG4gIHwgJ2lsY29pbidcclxuICB8ICdyYXB0b3JldW0nXHJcbiAgfCAndmVydGNvaW4nXHJcbiAgfCAnZmx1eHRlc3RuZXQnXHJcbiAgfCAnY2xvcmUnXHJcbiAgfCAnZ3JvZXN0bGNvaW4nO1xyXG5cclxuZXhwb3J0IHR5cGUgTmV0d29yayA9IHtcclxuICBtZXNzYWdlUHJlZml4OiBzdHJpbmc7XHJcbiAgcHViS2V5SGFzaDogbnVtYmVyO1xyXG4gIHNjcmlwdEhhc2g6IG51bWJlcjtcclxuICB3aWY6IG51bWJlcjtcclxuICBiaXAzMjoge1xyXG4gICAgcHVibGljOiBudW1iZXI7XHJcbiAgICBwcml2YXRlOiBudW1iZXI7XHJcbiAgfTtcclxuICBjYXNoQWRkcj86IHtcclxuICAgIHByZWZpeDogc3RyaW5nO1xyXG4gICAgcHViS2V5SGFzaDogbnVtYmVyO1xyXG4gICAgc2NyaXB0SGFzaDogbnVtYmVyO1xyXG4gIH07XHJcbiAgYmVjaDMyPzogc3RyaW5nO1xyXG4gIGZvcmtJZD86IG51bWJlcjtcclxuICAvKipcclxuICAgKiBAZGVwcmVjYXRlZFxyXG4gICAqL1xyXG4gIGNvaW46IHN0cmluZztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIGJhc2U1OCAneHB1YidcclxuICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgIC8vIGJhc2U1OCAneHBydidcclxuICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpIHtcclxuICByZXR1cm4ge1xyXG4gICAgLy8gYmFzZTU4ICd0cHViJ1xyXG4gICAgcHVibGljOiAweDA0MzU4N2NmLFxyXG4gICAgLy8gYmFzZTU4ICd0cHJ2J1xyXG4gICAgcHJpdmF0ZTogMHgwNDM1ODM5NCxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgbmV0d29ya3M6IFJlY29yZDxOZXR3b3JrTmFtZSwgTmV0d29yaz4gPSB7XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXRjb2luL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcclxuICBiaXRjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICdiYycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MDUsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5CVEMsXHJcbiAgfSxcclxuICB0ZXN0bmV0OiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICd0YicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CVEMsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4tY2FzaC1ub2RlL2JpdGNvaW4tY2FzaC1ub2RlL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLWNhc2gtbm9kZS9iaXRjb2luLWNhc2gtbm9kZS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL2Nhc2hhZGRyLm1kXHJcbiAgYml0Y29pbmNhc2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJDSCxcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2JpdGNvaW5jYXNoJyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBiaXRjb2luY2FzaFRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxyXG4gICAgc2NyaXB0SGFzaDogMHhjNCxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkJDSCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2JjaHRlc3QnLFxyXG4gICAgICBwdWJLZXlIYXNoOiAweDAwLFxyXG4gICAgICBzY3JpcHRIYXNoOiAweDA4LFxyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi9tYXN0ZXIvc3JjL3NjcmlwdC9pbnRlcnByZXRlci5oXHJcbiAgYml0Y29pbmdvbGQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnYnRnJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDI2LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxNyxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGZvcmtJZDogNzksXHJcbiAgICBjb2luOiBjb2lucy5CVEcsXHJcbiAgfSxcclxuICBiaXRjb2luZ29sZFRlc3RuZXQ6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAndGJ0ZycsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMTExLFxyXG4gICAgc2NyaXB0SGFzaDogMTk2LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgZm9ya0lkOiA3OSxcclxuICAgIGNvaW46IGNvaW5zLkJURyxcclxuICB9LFxyXG5cclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1zdi9iaXRjb2luLXN2L2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLXN2L2JpdGNvaW4tc3YvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGJpdGNvaW5zdjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlNWLFxyXG4gICAgZm9ya0lkOiAweDAwLFxyXG4gIH0sXHJcbiAgYml0Y29pbnN2VGVzdG5ldDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuQlNWLFxyXG4gICAgZm9ya0lkOiAweDAwLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXNocGF5L2Rhc2gvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhc2hwYXkvZGFzaC9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgZGFzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDRjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxMCxcclxuICAgIHdpZjogMHhjYyxcclxuICAgIGNvaW46IGNvaW5zLkRBU0gsXHJcbiAgfSxcclxuICBkYXNoVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDhjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxMyxcclxuICAgIHdpZjogMHhlZixcclxuICAgIGNvaW46IGNvaW5zLkRBU0gsXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2RvZ2Vjb2luL2RvZ2Vjb2luL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb2dlY29pbi9kb2dlY29pbi9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXHJcbiAgLy8gTWFpbm5ldCBiaXAzMiBoZXJlIGRvZXMgbm90IG1hdGNoIGRvZ2Vjb2luIGNvcmUsIHRoaXMgaXMgaW50ZW5kZWQgKHNlZSBCRy01MzI0MSlcclxuICBkb2dlY29pbjoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RG9nZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFlLFxyXG4gICAgc2NyaXB0SGFzaDogMHgxNixcclxuICAgIHdpZjogMHg5ZSxcclxuICAgIGNvaW46IGNvaW5zLkRPR0UsXHJcbiAgfSxcclxuICBkb2dlY29pblRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURvZ2Vjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg3MSxcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZjEsXHJcbiAgICBjb2luOiBjb2lucy5ET0dFLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQml0Y29pbi1BQkMvYml0Y29pbi1hYmMvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdXRpbC9tZXNzYWdlLmNwcFxyXG4gIGVjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTZlQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQkNIQSxcclxuICAgIGZvcmtJZDogMHgwMCxcclxuICAgIGNhc2hBZGRyOiB7XHJcbiAgICAgIHByZWZpeDogJ2VjYXNoJyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuICBlY2FzaFRlc3Q6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxNmVDYXNoIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxyXG4gICAgcHViS2V5SGFzaDogMHg2ZixcclxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5CQ0hBLFxyXG4gICAgY2FzaEFkZHI6IHtcclxuICAgICAgcHJlZml4OiAnZWN0ZXN0JyxcclxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcclxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIGxpdGVjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlMaXRlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnbHRjJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDMwLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzMixcclxuICAgIHdpZjogMHhiMCxcclxuICAgIGNvaW46IGNvaW5zLkxUQyxcclxuICB9LFxyXG4gIGxpdGVjb2luVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5TGl0ZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ3RsdGMnLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4NmYsXHJcbiAgICBzY3JpcHRIYXNoOiAweDNhLFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuTFRDLFxyXG4gIH0sXHJcblxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxyXG4gIHpjYXNoOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQyxcclxuICB9LFxyXG4gIHpjYXNoVGVzdDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WkNhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXHJcbiAgICBwdWJLZXlIYXNoOiAweDFkMjUsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmEsXHJcbiAgICB3aWY6IDB4ZWYsXHJcbiAgICBjb2luOiBjb2lucy5aRUMsXHJcbiAgfSxcclxuICBrb21vZG86IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEtvbW9kbyBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzYyxcclxuICAgIHNjcmlwdEhhc2g6IDB4NTUsXHJcbiAgICB3aWY6IDB4YmMsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIHNhZmVjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThTYWZlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFmLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU1XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzZCxcclxuICAgIHNjcmlwdEhhc2g6IDB4NTYsXHJcbiAgICB3aWY6IDB4YmQsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGJpdGhlcmV1bToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0aGVyZXVtIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDE5LFxyXG4gICAgc2NyaXB0SGFzaDogMHgyOCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUSCxcclxuICAgIGZvcmtJZDogMHg1NSwgLyogODUgKi9cclxuICB9LFxyXG4gIHplbGNhc2g6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFplbENhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgZmx1eDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WmVsQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICB6ZXJvOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaZXJvIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIHNub3dnZW06IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFNub3dnZW0gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWMyOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWMyZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgZ2VtbGluazoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4U25vd2dlbSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxYzI4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxYzJkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBjb21tZXJjaXVtOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThDb21tZXJjaXVtIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzMyxcclxuICAgIHdpZjogMHg4YyxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgemNsYXNzaWM6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFpjbGFzc2ljIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGJ6ZWRnZToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4QnplZGdlIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXHJcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXHJcbiAgICB3aWY6IDB4ODAsXHJcbiAgICBjb2luOiBjb2lucy5aRUNcclxuICB9LFxyXG4gIGdlbmVzaXM6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThHZW5lc2lzIFNpZ25lZCBNZXNzYWdlOiBcXG5cIixcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHg1MzQxNDY0NSxcclxuICAgICAgcHJpdmF0ZTogMHg1MzYxNjY2NSxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDFjLFxyXG4gICAgc2NyaXB0SGFzaDogMHgzZixcclxuICAgIHdpZjogMHgzMCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgYml0Y29pbnplcm86IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThCaXRjb2luWmVybyBTaWduZWQgTWVzc2FnZTogXFxuXCIsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6ICAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4NGIsXHJcbiAgICBzY3JpcHRIYXNoOiAweDIyLFxyXG4gICAgd2lmOiAweGQyLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICBiaXRjb2luejoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pblogU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcclxuICAgIHNjcmlwdEhhc2g6IDB4MWNiZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLlpFQ1xyXG4gIH0sXHJcbiAgaHVzaDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4SHVzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxY2I4LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICByYXZlbmNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThSYXZlbmNvaW4gU2lnbmVkIE1lc3NhZ2U6IFxcblwiLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAgMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDNjLFxyXG4gICAgc2NyaXB0SGFzaDogMHg3YSxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgYml0Y29yZToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogXCJcXHgxOEJpdGNvcmUgU2lnbmVkIE1lc3NhZ2U6IFxcblwiLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAgMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDAzLFxyXG4gICAgc2NyaXB0SGFzaDogMHg3ZCxcclxuICAgIHdpZjogMHg4MCxcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgemNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6IFwiXFx4MThaY29pbiBTaWduZWQgTWVzc2FnZTogXFxuXCIsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6ICAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4NTIsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA3LFxyXG4gICAgd2lmOiAweGQyLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICBheGU6IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOUF4ZSBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFxyXG4gICAgICBwcml2YXRlOiAweDA0ODhhZGU0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgzNywgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1xyXG4gICAgc2NyaXB0SGFzaDogMHgxMCxcclxuICAgIHdpZjogMHhjYyxcclxuICAgIGNvaW46IGNvaW5zLkRBU0hcclxuICB9LFxyXG4gIGRpZ2lieXRlOiB7XHRcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURpZ2lieXRlIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiZWNoMzI6ICdkZ2InLFxyXG4gICAgYmlwMzI6IHtcdFxyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHRcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFx0XHJcbiAgICB9LFx0XHJcbiAgICBwdWJLZXlIYXNoOiAweDFlLCAvLyBodHRwczovL2Rhc2gtZG9jcy5naXRodWIuaW8vZW4vZGV2ZWxvcGVyLXJlZmVyZW5jZSNvcGNvZGVzXHRcclxuICAgIHNjcmlwdEhhc2g6IDB4M2YsXHRcclxuICAgIHdpZjogMHg4MCxcdFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcdFxyXG4gIHNpbm92YXRlOiB7XHRcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFNpbm92YXRlIFNpZ25lZCBNZXNzYWdlOlxcbicsXHRcclxuICAgIGJpcDMyOiB7XHRcclxuICAgICAgcHVibGljOiAweDA0ODhiMjFlLFx0XHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcdFxyXG4gICAgfSxcdFxyXG4gICAgcHViS2V5SGFzaDogMHgzZiwgLy8gaHR0cHM6Ly9kYXNoLWRvY3MuZ2l0aHViLmlvL2VuL2RldmVsb3Blci1yZWZlcmVuY2Ujb3Bjb2Rlc1x0XHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFx0XHJcbiAgICB3aWY6IDB4YmYsXHRcclxuICAgIGNvaW46IGNvaW5zLkJUQ1xyXG4gIH0sXHJcbiAgaWxjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThJTENvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MDAsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICByYXB0b3JldW06IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURhcmtDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDNjLCAvLyBodHRwczovL2Rhc2gtZG9jcy5naXRodWIuaW8vZW4vZGV2ZWxvcGVyLXJlZmVyZW5jZSNvcGNvZGVzXHJcbiAgICBzY3JpcHRIYXNoOiAweDEwLFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuREFTSFxyXG4gIH0sXHJcbiAgdmVydGNvaW46IHtcclxuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcclxuICAgIGJlY2gzMjogJ3Z0YycsXHJcbiAgICBiaXAzMjoge1xyXG4gICAgICBwdWJsaWM6IDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTRcclxuICAgIH0sXHJcbiAgICBwdWJLZXlIYXNoOiAweDQ3LCAvLyBodHRwczovL2Rhc2gtZG9jcy5naXRodWIuaW8vZW4vZGV2ZWxvcGVyLXJlZmVyZW5jZSNvcGNvZGVzXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuQlRDXHJcbiAgfSxcclxuICBmbHV4dGVzdG5ldDoge1xyXG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WmVsQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmlwMzI6IHtcclxuICAgICAgcHVibGljOiAweDA0MzU4N2NmLFxyXG4gICAgICBwcml2YXRlOiAweDA0MzU4Mzk0XHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxZDI1LFxyXG4gICAgc2NyaXB0SGFzaDogMHgxY2JhLFxyXG4gICAgd2lmOiAweGVmLFxyXG4gICAgY29pbjogY29pbnMuWkVDXHJcbiAgfSxcclxuICBjbG9yZToge1xyXG4gICAgbWVzc2FnZVByZWZpeDogXCJcXHgxOENsb3JlIFNpZ25lZCBNZXNzYWdlOiBcXG5cIixcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogIDB4MDQ4OGIyMWUsXHJcbiAgICAgIHByaXZhdGU6IDB4MDQ4OGFkZTQsXHJcbiAgICB9LFxyXG4gICAgcHViS2V5SGFzaDogMHgxNyxcclxuICAgIHNjcmlwdEhhc2g6IDB4N2EsXHJcbiAgICB3aWY6IDB4NzAsXHJcbiAgICBjb2luOiBjb2lucy5CVENcclxuICB9LFxyXG4gIGdyb2VzdGxjb2luOiB7XHJcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MWNHcm9lc3RsQ29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxyXG4gICAgYmVjaDMyOiAnZ3JzJyxcclxuICAgIGJpcDMyOiB7XHJcbiAgICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcclxuICAgICAgcHJpdmF0ZTogMHgwNDg4YWRlNFxyXG4gICAgfSxcclxuICAgIHB1YktleUhhc2g6IDB4MjQsXHJcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxyXG4gICAgd2lmOiAweDgwLFxyXG4gICAgY29pbjogY29pbnMuR1JTLFxyXG4gIH0sXHJcbn07XHJcblxyXG4vKipcclxuICogQHJldHVybnMge05ldHdvcmtbXX0gYWxsIGtub3duIG5ldHdvcmtzIGFzIGFycmF5XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV0d29ya0xpc3QoKTogTmV0d29ya1tdIHtcclxuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhuZXR3b3Jrcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge05ldHdvcmtOYW1lfSB0aGUgbmFtZSBvZiB0aGUgbmV0d29yay4gUmV0dXJucyB1bmRlZmluZWQgaWYgbmV0d29yayBpcyBub3QgYSB2YWx1ZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIG9mIGBuZXR3b3Jrc2BcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROZXR3b3JrTmFtZShuZXR3b3JrOiBOZXR3b3JrKTogTmV0d29ya05hbWUgfCB1bmRlZmluZWQge1xyXG4gIHJldHVybiBPYmplY3Qua2V5cyhuZXR3b3JrcykuZmluZCgobikgPT4gKG5ldHdvcmtzIGFzIFJlY29yZDxzdHJpbmcsIE5ldHdvcms+KVtuXSA9PT0gbmV0d29yaykgYXNcclxuICAgIHwgTmV0d29ya05hbWVcclxuICAgIHwgdW5kZWZpbmVkO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IHRoZSBtYWlubmV0IGNvcnJlc3BvbmRpbmcgdG8gYSB0ZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFpbm5ldChuZXR3b3JrOiBOZXR3b3JrKTogTmV0d29yayB7XHJcbiAgc3dpdGNoIChuZXR3b3JrKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoVGVzdG5ldDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvaW5jYXNoO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkVGVzdG5ldDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvaW5nb2xkO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3ZUZXN0bmV0OlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbnN2O1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaFRlc3Q6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5kYXNoO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoVGVzdDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmVjYXNoO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luVGVzdDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmxpdGVjb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoVGVzdDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnpjYXNoO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luVGVzdDpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmRvZ2Vjb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0aGVyZXVtO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5zYWZlY29pbjtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmtvbW9kbztcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy56ZWxjYXNoO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eHRlc3RuZXQ6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5mbHV4O1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnplcm87XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3Muc25vd2dlbTtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5nZW1saW5rO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmNvbW1lcmNpdW07XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnpjbGFzc2ljO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYnplZGdlO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmdlbmVzaXM7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvaW56ZXJvO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luejtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5odXNoO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MucmF2ZW5jb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmJpdGNvcmU7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnpjb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3MuYXhlO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5kaWdpYnl0ZTtcclxuXHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgICByZXR1cm4gbmV0d29ya3Muc2lub3ZhdGU7XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5pbGNvaW47XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5yYXB0b3JldW07XHJcblxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnZlcnRjb2luO1xyXG5cclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5jbG9yZTtcclxuICAgIFxyXG4gICAgY2FzZSBuZXR3b3Jrcy5ncm9lc3RsY29pbjpcclxuICAgICAgcmV0dXJuIG5ldHdvcmtzLmdyb2VzdGxjb2luO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgVHlwZUVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBhIG1haW5uZXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc01haW5uZXQobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3JrO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGEgdGVzdG5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVGVzdG5ldChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgIT09IG5ldHdvcms7XHJcbn1cclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHBhcmFtIHtOZXR3b3JrfSBvdGhlck5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIGJvdGggbmV0d29ya3MgYXJlIGZvciB0aGUgc2FtZSBjb2luXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNTYW1lQ29pbihuZXR3b3JrOiBOZXR3b3JrLCBvdGhlck5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gZ2V0TWFpbm5ldChvdGhlck5ldHdvcmspO1xyXG59XHJcblxyXG5jb25zdCBtYWlubmV0cyA9IGdldE5ldHdvcmtMaXN0KCkuZmlsdGVyKGlzTWFpbm5ldCk7XHJcbmNvbnN0IHRlc3RuZXRzID0gZ2V0TmV0d29ya0xpc3QoKS5maWx0ZXIoaXNUZXN0bmV0KTtcclxuXHJcbi8qKlxyXG4gKiBNYXAgd2hlcmUga2V5cyBhcmUgbWFpbm5ldCBuZXR3b3JrcyBhbmQgdmFsdWVzIGFyZSB0ZXN0bmV0IG5ldHdvcmtzXHJcbiAqIEB0eXBlIHtNYXA8TmV0d29yaywgTmV0d29ya1tdPn1cclxuICovXHJcbmNvbnN0IG1haW5uZXRUZXN0bmV0UGFpcnMgPSBuZXcgTWFwKG1haW5uZXRzLm1hcCgobSkgPT4gW20sIHRlc3RuZXRzLmZpbHRlcigodCkgPT4gZ2V0TWFpbm5ldCh0KSA9PT0gbSldKSk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtOZXR3b3JrfHVuZGVmaW5lZH0gLSBUaGUgdGVzdG5ldCBjb3JyZXNwb25kaW5nIHRvIGEgbWFpbm5ldC5cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmV0dXJucyB1bmRlZmluZWQgaWYgYSBuZXR3b3JrIGhhcyBubyB0ZXN0bmV0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlc3RuZXQobmV0d29yazogTmV0d29yayk6IE5ldHdvcmsgfCB1bmRlZmluZWQge1xyXG4gIGlmIChpc1Rlc3RuZXQobmV0d29yaykpIHtcclxuICAgIHJldHVybiBuZXR3b3JrO1xyXG4gIH1cclxuICBjb25zdCB0ZXN0bmV0cyA9IG1haW5uZXRUZXN0bmV0UGFpcnMuZ2V0KG5ldHdvcmspO1xyXG4gIGlmICh0ZXN0bmV0cyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgYXJndW1lbnRgKTtcclxuICB9XHJcbiAgaWYgKHRlc3RuZXRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBpZiAodGVzdG5ldHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICByZXR1cm4gdGVzdG5ldHNbMF07XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcihgbW9yZSB0aGFuIG9uZSB0ZXN0bmV0IGZvciAke2dldE5ldHdvcmtOYW1lKG5ldHdvcmspfWApO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGJpdGNvaW4gb3IgdGVzdG5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQml0Y29pbihuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYml0Y29pbmNhc2ggb3IgYml0Y29pbmNhc2hUZXN0bmV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luQ2FzaChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW5jYXNoO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGVjYXNoIG9yIGVjYXNoVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRUNhc2gobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5lY2FzaDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBiaXRjb2luZ29sZFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQml0Y29pbkdvbGQobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRjb2luZ29sZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBiaXRoZXJldW1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGhlcmV1bShuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGhlcmV1bTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBiaXRjb2luc3Ygb3IgYml0Y29pbnN2VGVzdG5ldFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQml0Y29pblNWKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbnN2O1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGRhc2ggb3IgZGFzaFRlc3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0Rhc2gobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5kYXNoO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGRvZ2Vjb2luIG9yIGRvZ2Vjb2luVGVzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRG9nZWNvaW4obmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5kb2dlY29pbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBsaXRlY29pbiBvciBsaXRlY29pblRlc3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0xpdGVjb2luKG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcclxuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MubGl0ZWNvaW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgemNhc2ggb3IgemNhc2hUZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNaY2FzaChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgemNhc2hNYWlubmV0cyA9IFtcclxuICAgIG5ldHdvcmtzLnpjYXNoLFxyXG4gICAgbmV0d29ya3MuemVsY2FzaCxcclxuICAgIG5ldHdvcmtzLmZsdXgsXHJcbiAgICBuZXR3b3Jrcy56ZXJvLFxyXG4gICAgbmV0d29ya3Muc25vd2dlbSxcclxuICAgIG5ldHdvcmtzLmdlbWxpbmssXHJcbiAgICBuZXR3b3Jrcy5jb21tZXJjaXVtLFxyXG4gICAgbmV0d29ya3MuemNsYXNzaWMsXHJcbiAgICBuZXR3b3Jrcy5iemVkZ2UsXHJcbiAgICBuZXR3b3Jrcy5iaXRjb2lueixcclxuICAgIG5ldHdvcmtzLmtvbW9kbyxcclxuICAgIG5ldHdvcmtzLnNhZmVjb2luLFxyXG4gIF07XHJcbiAgcmV0dXJuIHpjYXNoTWFpbm5ldHMuaW5jbHVkZXMoZ2V0TWFpbm5ldChuZXR3b3JrKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcclxuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgbGl0ZWNvaW4gb3IgbGl0ZWNvaW5UZXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNHcm9lc3RsY29pbihuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmdyb2VzdGxjb2luO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHt1bmtub3dufSBuZXR3b3JrXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSByZXR1cm5zIHRydWUgaWZmIG5ldHdvcmsgaXMgYW55IG9mIHRoZSBuZXR3b3JrIHN0YXRlZCBpbiB0aGUgYXJndW1lbnRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkTmV0d29yayhuZXR3b3JrOiB1bmtub3duKTogbmV0d29yayBpcyBOZXR3b3JrIHtcclxuICByZXR1cm4gZ2V0TmV0d29ya0xpc3QoKS5pbmNsdWRlcyhuZXR3b3JrIGFzIE5ldHdvcmspO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNTZWd3aXQobmV0d29yazogTmV0d29yayk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAoW25ldHdvcmtzLmJpdGNvaW4sIG5ldHdvcmtzLmxpdGVjb2luLCBuZXR3b3Jrcy5iaXRjb2luZ29sZF0gYXMgTmV0d29ya1tdKS5pbmNsdWRlcyhnZXRNYWlubmV0KG5ldHdvcmspKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN1cHBvcnRzVGFwcm9vdChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW47XHJcbn1cclxuIl19