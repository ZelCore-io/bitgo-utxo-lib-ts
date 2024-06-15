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
} as const;

export type NetworkName =
  | 'bitcoin'
  | 'testnet'
  | 'bitcoincash'
  | 'bitcoincashTestnet'
  | 'ecash'
  | 'ecashTest'
  | 'bitcoingold'
  | 'bitcoingoldTestnet'
  | 'bitcoinsv'
  | 'bitcoinsvTestnet'
  | 'dash'
  | 'dashTest'
  | 'dogecoin'
  | 'dogecoinTest'
  | 'litecoin'
  | 'litecoinTest'
  | 'zcash'
  | 'zcashTest'
  | 'bithereum'
  | 'safecoin'
  | 'komodo'
  | 'zelcash'
  | 'flux'
  | 'zero'
  | 'snowgem'
  | 'gemlink'
  | 'commercium'
  | 'zclassic'
  | 'bzedge'
  | 'genesis'
  | 'bitcoinzero'
  | 'bitcoinz'
  | 'hush'
  | 'ravencoin'
  | 'bitcore'
  | 'zcoin'
  | 'axe'
  | 'digibyte'
  | 'sinovate'
  | 'ilcoin'
  | 'raptoreum'
  | 'vertcoin'
  | 'fluxtestnet'
  | 'clore'
  | 'groestlcoin';

export type Network = {
  messagePrefix: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  bip32: {
    public: number;
    private: number;
  };
  cashAddr?: {
    prefix: string;
    pubKeyHash: number;
    scriptHash: number;
  };
  bech32?: string;
  forkId?: number;
  /**
   * @deprecated
   */
  coin: string;
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

export const networks: Record<NetworkName, Network> = {
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
      public:  0x0488b21e,
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
    coin: coins.ZEC
  },
  ravencoin: {
    messagePrefix: "\x18Ravencoin Signed Message: \n",
    bip32: {
      public:  0x0488b21e,
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
      public:  0x0488b21e,
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
      public:  0x0488b21e,
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
    pubKeyHash: 0x37, // https://dash-docs.github.io/en/developer-reference#opcodes
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
    pubKeyHash: 0x1e, // https://dash-docs.github.io/en/developer-reference#opcodes	
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
    pubKeyHash: 0x3f, // https://dash-docs.github.io/en/developer-reference#opcodes	
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
    pubKeyHash: 0x3c, // https://dash-docs.github.io/en/developer-reference#opcodes
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
    pubKeyHash: 0x47, // https://dash-docs.github.io/en/developer-reference#opcodes
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
      public:  0x0488b21e,
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
export function getNetworkList(): Network[] {
  return Object.values(networks);
}

/**
 * @param {Network} network
 * @returns {NetworkName} the name of the network. Returns undefined if network is not a value
 *                        of `networks`
 */
export function getNetworkName(network: Network): NetworkName | undefined {
  return Object.keys(networks).find((n) => (networks as Record<string, Network>)[n] === network) as
    | NetworkName
    | undefined;
}

/**
 * @param {Network} network
 * @returns {Object} the mainnet corresponding to a testnet
 */
export function getMainnet(network: Network): Network {
  switch (network) {
    case networks.bitcoin:
    case networks.testnet:
      return networks.bitcoin;

    case networks.bitcoincash:
    case networks.bitcoincashTestnet:
      return networks.bitcoincash;

    case networks.bitcoingold:
    case networks.bitcoingoldTestnet:
      return networks.bitcoingold;

    case networks.bitcoinsv:
    case networks.bitcoinsvTestnet:
      return networks.bitcoinsv;

    case networks.dash:
    case networks.dashTest:
      return networks.dash;

    case networks.ecash:
    case networks.ecashTest:
      return networks.ecash;

    case networks.litecoin:
    case networks.litecoinTest:
      return networks.litecoin;

    case networks.zcash:
    case networks.zcashTest:
      return networks.zcash;

    case networks.dogecoin:
    case networks.dogecoinTest:
      return networks.dogecoin;

    case networks.bithereum:
      return networks.bithereum;

    case networks.safecoin:
      return networks.safecoin;

    case networks.komodo:
      return networks.komodo;

    case networks.zelcash:
      return networks.zelcash;

    case networks.flux:
    case networks.fluxtestnet:
      return networks.flux;

    case networks.zero:
      return networks.zero;

    case networks.snowgem:
      return networks.snowgem;

    case networks.gemlink:
      return networks.gemlink;

    case networks.commercium:
      return networks.commercium;

    case networks.zclassic:
      return networks.zclassic;

    case networks.bzedge:
      return networks.bzedge;

    case networks.genesis:
      return networks.genesis;

    case networks.bitcoinzero:
      return networks.bitcoinzero;

    case networks.bitcoinz:
      return networks.bitcoinz;

    case networks.hush:
      return networks.hush;

    case networks.ravencoin:
      return networks.ravencoin;

    case networks.bitcore:
      return networks.bitcore;

    case networks.zcoin:
      return networks.zcoin;

    case networks.axe:
      return networks.axe;

    case networks.digibyte:
      return networks.digibyte;

    case networks.sinovate:
      return networks.sinovate;

    case networks.ilcoin:
      return networks.ilcoin;

    case networks.raptoreum:
      return networks.raptoreum;

    case networks.vertcoin:
      return networks.vertcoin;

    case networks.clore:
      return networks.clore;
    
    case networks.groestlcoin:
      return networks.groestlcoin;
  }
  throw new TypeError(`invalid network`);
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is a mainnet
 */
export function isMainnet(network: Network): boolean {
  return getMainnet(network) === network;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is a testnet
 */
export function isTestnet(network: Network): boolean {
  return getMainnet(network) !== network;
}

/**
 *
 * @param {Network} network
 * @param {Network} otherNetwork
 * @returns {boolean} true iff both networks are for the same coin
 */
export function isSameCoin(network: Network, otherNetwork: Network): boolean {
  return getMainnet(network) === getMainnet(otherNetwork);
}

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
export function getTestnet(network: Network): Network | undefined {
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

/**
 * @param {Network} network
 * @returns {boolean} true iff network bitcoin or testnet
 */
export function isBitcoin(network: Network): boolean {
  return getMainnet(network) === networks.bitcoin;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
export function isBitcoinCash(network: Network): boolean {
  return getMainnet(network) === networks.bitcoincash;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is ecash or ecashTest
 */
export function isECash(network: Network): boolean {
  return getMainnet(network) === networks.ecash;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoingold
 */
export function isBitcoinGold(network: Network): boolean {
  return getMainnet(network) === networks.bitcoingold;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bithereum
 */
export function isBithereum(network: Network): boolean {
  return getMainnet(network) === networks.bithereum;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
export function isBitcoinSV(network: Network): boolean {
  return getMainnet(network) === networks.bitcoinsv;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is dash or dashTest
 */
export function isDash(network: Network): boolean {
  return getMainnet(network) === networks.dash;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is dogecoin or dogecoinTest
 */
export function isDogecoin(network: Network): boolean {
  return getMainnet(network) === networks.dogecoin;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
export function isLitecoin(network: Network): boolean {
  return getMainnet(network) === networks.litecoin;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
export function isZcash(network: Network): boolean {
  const zcashMainnets = [
    networks.zcash,
    networks.zelcash,
    networks.flux,
    networks.zero,
    networks.snowgem,
    networks.gemlink,
    networks.commercium,
    networks.zclassic,
    networks.bzedge,
    networks.bitcoinz,
    networks.komodo,
    networks.safecoin,
    networks.hush,
  ];
  return zcashMainnets.includes(getMainnet(network));
}

/**
 * @param {Network} network
 * @returns {boolean} true if network is zcash 8 bit unit network
 */
export function isZcash8BitUnit(network: Network): boolean {
 const zcash8BitUnitMainnets = [
    networks.komodo,
    networks.safecoin,
    networks.commercium,
 ];
  return zcash8BitUnitMainnets.includes(getMainnet(network));
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
export function isGroestlcoin(network: Network): boolean {
  return getMainnet(network) === networks.groestlcoin;
}

/**
 * @param {unknown} network
 * @returns {boolean} returns true iff network is any of the network stated in the argument
 */
export function isValidNetwork(network: unknown): network is Network {
  return getNetworkList().includes(network as Network);
}

export function supportsSegwit(network: Network): boolean {
  return ([networks.bitcoin, networks.litecoin, networks.bitcoingold] as Network[]).includes(getMainnet(network));
}

export function supportsTaproot(network: Network): boolean {
  return getMainnet(network) === networks.bitcoin;
}
