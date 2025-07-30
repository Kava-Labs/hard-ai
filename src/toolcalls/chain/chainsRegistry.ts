import { ChainNames, ChainType } from './constants';

// Re-export ChainType for backward compatibility
export { ChainType };
import { ExtraToolKey } from './extraTools';

export type ERC20Record = {
  contractAddress: string;
  displayName: string;
  decimals?: number;
};

export type CoinRecord = { denom: string; displayName: string };

export type EVMChainConfig = {
  chainType: ChainType.EVM;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  chainID: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  erc20Contracts: Record<string, ERC20Record>;
  // Chain-specific tools that should only be available when connected to this chain
  // This is a list of string keys from the extraTools object to prevent circular dependencies
  extraTools?: ExtraToolKey[];
};

export type CosmosChainConfig = {
  chainType: ChainType.COSMOS;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  chainID: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  bech32Prefix: string;
  defaultGasWanted: string;
  denoms: Record<string, CoinRecord>;
  evmChainName?: string;
  // Chain-specific tools that should only be available when connected to this chain
  extraTools?: ExtraToolKey[];
};

export type ChainConfig = EVMChainConfig | CosmosChainConfig;

export type ChainRegistry = Record<ChainType, Record<string, ChainConfig>>;

export const chainRegistry: ChainRegistry = {
  [ChainType.EVM]: {
    [ChainNames.KAVA_EVM]: {
      chainType: ChainType.EVM,
      name: ChainNames.KAVA_EVM,
      rpcUrls: ['https://evm.kava-rpc.com'],
      chainID: '2222',
      nativeToken: 'KAVA',
      nativeTokenDecimals: 18,
      blockExplorerUrls: ['https://kavascan.com/'],
      extraTools: ['erc20-conversion'],
      erc20Contracts: {
        WHARD: {
          contractAddress: '0x25e9171C98Fc1924Fa9415CF50750274F0664764',
          displayName: 'wHARD',
          decimals: 18,
        },
        USDT: {
          contractAddress: '0x919C1c267BC06a7039e03fcc2eF738525769109c',
          displayName: 'USD₮',
          decimals: 6,
        },
        WKAVA: {
          contractAddress: '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b',
          displayName: 'wKAVA',
          decimals: 18,
        },
        AXLETH: {
          contractAddress: '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D',
          displayName: 'axlETH',
          decimals: 18,
        },
        AXLWBTC: {
          contractAddress: '0x1a35EE4640b0A3B87705B0A4B45D227Ba60Ca2ad',
          displayName: 'axlwBTC',
          decimals: 8,
        },
        AXLUSDC: {
          contractAddress: '0xEB466342C4d449BC9f53A865D5Cb90586f405215',
          displayName: 'axlUSDC',
          decimals: 6,
        },
        AXLDAI: {
          contractAddress: '0x5C7e299CF531eb66f2A1dF637d37AbB78e6200C7',
          displayName: 'axlDAI',
          decimals: 18,
        },
        AXLUSDT: {
          contractAddress: '0x7f5373AE26c3E8FfC4c77b7255DF7eC1A9aF52a6',
          displayName: 'axlUSDT',
          decimals: 6,
        },
        WATOM: {
          contractAddress: '0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3',
          displayName: 'wATOM',
          decimals: 6,
        },
        AXLBNB: {
          contractAddress: '0x23A6486099f740B7688A0bb7AED7C912015cA2F0',
          displayName: 'axlBNB',
          decimals: 18,
        },
        AXLBUSD: {
          contractAddress: '0x4D84E25cEa9447581867fE9f2329B972f532Da2c',
          displayName: 'axlBUSD',
          decimals: 18,
        },
        AXLXRPB: {
          contractAddress: '0x8e20A0a1B4664D1ae5d18cc48bA6FAD4d9569406',
          displayName: 'axlXRPB',
          decimals: 6,
        },
        AXLBTCB: {
          contractAddress: '0x94FC70EF7791EE857A1f420B9A471a55F32382be',
          displayName: 'axlBTCB',
          decimals: 8,
        },
        WBTC: {
          contractAddress: '0xb5c4423a65B953905949548276654C96fcaE6992',
          displayName: 'wBTC',
          decimals: 8,
        },
        MBTC: {
          contractAddress: '0x59889b7021243dB5B1e065385F918316cD90D46c',
          displayName: 'mBTC',
          decimals: 8,
        },
      },
    },
    [ChainNames.KAVA_EVM_INTERNAL_TESTNET]: {
      chainType: ChainType.EVM,
      name: ChainNames.KAVA_EVM_INTERNAL_TESTNET,
      rpcUrls: ['https://evm.data.internal.testnet.us-east.production.kava.io'],
      chainID: '2221',
      nativeToken: 'TKAVA',
      nativeTokenDecimals: 18,
      blockExplorerUrls: ['https://kavascan.com/'],
      extraTools: ['erc20-conversion'],
      erc20Contracts: {
        USDT: {
          contractAddress: '0xaCF81e57CBd9aF95FaBbe53678FcB70B1dD1b7A1',
          displayName: 'USD₮',
          decimals: 6,
        },
        WKAVA: {
          contractAddress: '0x70C79B608aBBC502c2F61f38E04190fB407BefCF',
          displayName: 'wKAVA',
          decimals: 18,
        },
        AXLETH: {
          contractAddress: '0x5d6D67a665C9F169B0f9436E05B11108C1606043',
          displayName: 'axlETH',
          decimals: 18,
        },
        AXLWBTC: {
          contractAddress: '0x7d2Ee2914324d5D4dC33A5c295E720659D5F3fA7',
          displayName: 'axlwBTC',
          decimals: 8,
        },
        AXLUSDC: {
          contractAddress: '0x7a5DBf8e6ac1F6aCCF14f5B4E88b21EAA04c983d',
          displayName: 'axlUSDC',
          decimals: 6,
        },
        AXLUSDT: {
          contractAddress: '0xA637F4CECbA91Ad19075bA3d330cd95f694B1707',
          displayName: 'axlUSDT',
          decimals: 6,
        },
        WATOM: {
          contractAddress: '0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3',
          displayName: 'wATOM',
          decimals: 6,
        },
        AXLBNB: {
          contractAddress: '0x102dF7764fe9F0eFa850A07e25D5171d19bC7862',
          displayName: 'axlBNB',
          decimals: 18,
        },
        AXLBUSD: {
          contractAddress: '0xB1f5FC6633BC2d67EC9B072FB1570Ea8adE02A22',
          displayName: 'axlBUSD',
          decimals: 18,
        },
        AXLXRPB: {
          contractAddress: '0xd8DaCA0CA6F88a3a3B7dF15A26483254d80E8726',
          displayName: 'axlXRPB',
          decimals: 6,
        },
        AXLBTCB: {
          contractAddress: '0x9920E05F1f5B0280fe2Fe32B758F3Dbd534A5480',
          displayName: 'axlBTCB',
          decimals: 8,
        },
        WBTC: {
          contractAddress: '0x4ef4e7b4281e813Bf0FED39728E025D01c3e76AC',
          displayName: 'wBTC',
          decimals: 8,
        },
      },
    },
    [ChainNames.ETH]: {
      chainType: ChainType.EVM,
      name: ChainNames.ETH,
      chainID: '1',
      nativeToken: 'ETH',
      nativeTokenDecimals: 18,
      rpcUrls: ['https://eth.drpc.org'],
      blockExplorerUrls: ['https://etherscan.io/'],
      erc20Contracts: {
        USDT: {
          contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          displayName: 'USDT',
          decimals: 6,
        },
        USDC: {
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          displayName: 'USDC',
          decimals: 6,
        },
        DAI: {
          contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          displayName: 'DAI',
          decimals: 18,
        },
        WETH: {
          contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          displayName: 'WETH',
          decimals: 18,
        },
        WBTC: {
          contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          displayName: 'WBTC',
          decimals: 8,
        },
      },
    },
    [ChainNames.BSC]: {
      chainType: ChainType.EVM,
      name: ChainNames.BSC,
      chainID: '56',
      nativeToken: 'BNB',
      nativeTokenDecimals: 18,
      rpcUrls: ['https://bsc-dataseed.binance.org'],
      blockExplorerUrls: ['https://bscscan.com/'],
      erc20Contracts: {
        WETH: {
          contractAddress: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
          displayName: 'WETH',
          decimals: 18,
        },
        WBTC: {
          contractAddress: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
          displayName: 'WBTC',
          decimals: 8,
        },
        USDT: {
          contractAddress: '0x55d398326f99059fF775485246999027B3197955',
          displayName: 'USDT',
          decimals: 18,
        },
        USDC: {
          contractAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          displayName: 'USDC',
          decimals: 18,
        },
        BUSD: {
          contractAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          displayName: 'BUSD',
          decimals: 18,
        },
        WBNB: {
          contractAddress: '0xbb4CdB9CBd36B01bD1cBaEF60aF814a3f6F8E2F9',
          displayName: 'WBNB',
          decimals: 18,
        },
      },
    },
    [ChainNames.POLYGON]: {
      chainType: ChainType.EVM,
      name: ChainNames.POLYGON,
      chainID: '137',
      nativeToken: 'MATIC',
      nativeTokenDecimals: 18,
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com/'],
      erc20Contracts: {
        USDT: {
          contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          displayName: 'USDT',
          decimals: 6,
        },
        USDC: {
          contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          displayName: 'USDC',
          decimals: 6,
        },
        DAI: {
          contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
          displayName: 'DAI',
          decimals: 18,
        },
        WMATIC: {
          contractAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
          displayName: 'WMATIC',
          decimals: 18,
        },
      },
    },
    [ChainNames.ARBITRUM]: {
      chainType: ChainType.EVM,
      name: ChainNames.ARBITRUM,
      chainID: '42161',
      nativeToken: 'ETH',
      nativeTokenDecimals: 18,
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      blockExplorerUrls: ['https://arbiscan.io/'],
      erc20Contracts: {
        USDT: {
          contractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          displayName: 'USDT',
          decimals: 6,
        },
        USDC: {
          contractAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
          displayName: 'USDC',
          decimals: 6,
        },
        DAI: {
          contractAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          displayName: 'DAI',
          decimals: 18,
        },
        WETH: {
          contractAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          displayName: 'WETH',
          decimals: 18,
        },
      },
    },
    [ChainNames.OPTIMISM]: {
      chainType: ChainType.EVM,
      name: ChainNames.OPTIMISM,
      chainID: '0xa',
      nativeToken: 'ETH',
      nativeTokenDecimals: 18,
      rpcUrls: ['https://mainnet.optimism.io'],
      blockExplorerUrls: ['https://optimistic.etherscan.io/'],
      erc20Contracts: {
        USDT: {
          contractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
          displayName: 'USDT',
          decimals: 6,
        },
        USDC: {
          contractAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
          displayName: 'USDC',
          decimals: 6,
        },
        DAI: {
          contractAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          displayName: 'DAI',
          decimals: 18,
        },
        WETH: {
          contractAddress: '0x4200000000000000000000000000000000000006',
          displayName: 'WETH',
          decimals: 18,
        },
      },
    },
  },
  [ChainType.COSMOS]: {
    [ChainNames.KAVA_COSMOS]: {
      chainType: ChainType.COSMOS,
      name: 'Kava Cosmos',
      rpcUrls: ['https://api2.kava.io'],
      blockExplorerUrls: ['https://www.mintscan.io/kava/'],
      chainID: 'kava_2222-10',
      evmChainName: ChainNames.KAVA_EVM, // reference to the evm chain config, needed for eip712 signing
      nativeToken: 'ukava',
      nativeTokenDecimals: 6,
      bech32Prefix: 'kava',
      defaultGasWanted: '1000000',
      denoms: {
        WHARD: {
          denom: 'whard',
          displayName: 'wHARD',
        },
        USDT: {
          denom: 'erc20/tether/usdt',
          displayName: 'USD₮',
        },
        AXLETH: {
          denom: 'erc20/axelar/eth',
          displayName: 'axlETH',
        },
        AXLWBTC: {
          denom: 'erc20/axelar/wbtc',
          displayName: 'axlwBTC',
        },
        AXLUSDC: {
          denom: 'erc20/axelar/usdc',
          displayName: 'axlUSDC',
        },
        AXLDAI: {
          denom: 'erc20/axelar/dai',
          displayName: 'axlDAI',
        },
        AXLUSDT: {
          denom: 'erc20/axelar/usdt',
          displayName: 'axlUSDT',
        },
        WATOM: {
          denom: '0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3',
          displayName: 'wATOM',
        },
        MBTC: {
          denom: 'erc20/meson/mbtc',
          displayName: 'mBTC',
        },
      },
    },
  },
};

export const getChainConfigByName = (
  chainName: string,
  chainType: ChainType,
): unknown => {
  const chains = chainRegistry[chainType];
  const chainConfig = chains[chainName];

  if (chainConfig && chainConfig.chainType === chainType) {
    return chainConfig;
  }

  return null;
};
