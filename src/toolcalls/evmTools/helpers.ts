import { getAddress, isAddress } from 'viem';
import { chainRegistry, EVMChainConfig } from '../chain/chainsRegistry';
import { ChainType } from '../chain/constants';
import { EthereumProvider } from './types';

// Helper to get Ethereum provider from wallet store
export const getEthereumProvider = (
  provider?: EthereumProvider,
): EthereumProvider => {
  if (provider) {
    return provider;
  }

  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error(
      'Ethereum provider not detected. Please install a compatible wallet extension and ensure it is connected.',
    );
  }
  return window.ethereum;
};

// Helper to get current account
export const getCurrentAccount = async (
  provider?: EthereumProvider,
): Promise<string> => {
  const ethereumProvider = getEthereumProvider(provider);
  const accounts = (await ethereumProvider.request({
    method: 'eth_accounts',
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('No account connected. Please connect your wallet.');
  }
  return accounts[0];
};

// Helper to get chain ID
export const getCurrentChainId = async (
  provider?: EthereumProvider,
): Promise<number> => {
  const ethereumProvider = getEthereumProvider(provider);
  const chainId = (await ethereumProvider.request({
    method: 'eth_chainId',
  })) as string;
  return parseInt(chainId, 16);
};

// Helper to get contract address for a token on current chain
export const getContractAddress = async (
  tokenSymbol: string,
  provider?: EthereumProvider,
): Promise<string | null> => {
  const chainId = await getCurrentChainId(provider);
  const chainInfo = getChainConfigByChainId(chainId.toString());

  if (!chainInfo) {
    return null;
  }

  const contract = chainInfo.chainConfig.erc20Contracts[tokenSymbol];
  return contract?.contractAddress || null;
};

// Helper to get chain config for current chain
export const getCurrentChainConfig = async (provider?: EthereumProvider) => {
  const chainId = await getCurrentChainId(provider);
  const chainInfo = getChainConfigByChainId(chainId.toString());

  if (!chainInfo) {
    throw new Error(`Chain with ID ${chainId} not found in registry`);
  }

  return chainInfo;
};

// Helper to get chain config by chain ID for EVM chains
export const getChainConfigByChainId = (
  chainIdInput: string,
): { chainName: string; chainConfig: EVMChainConfig } | null => {
  const evmChains = chainRegistry[ChainType.EVM];
  const chainId = chainIdInput.startsWith('0x')
    ? parseInt(chainIdInput, 16).toString()
    : chainIdInput;
  for (const [chainName, chainConfig] of Object.entries(evmChains)) {
    if (
      chainConfig.chainType === ChainType.EVM &&
      chainConfig.chainID === chainId
    ) {
      return {
        chainName,
        chainConfig: chainConfig as EVMChainConfig,
      };
    }
  }
  return null;
};

// Helper to get chain config by name for EVM chains
export const getEvmChainConfigByName = (
  chainName: string,
): EVMChainConfig | null => {
  const evmChains = chainRegistry[ChainType.EVM];
  const chainConfig = evmChains[chainName];

  if (chainConfig && chainConfig.chainType === ChainType.EVM) {
    return chainConfig as EVMChainConfig;
  }

  return null;
};

// Helper to validate and normalize address
export const validateAddress = (address: string): string => {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return getAddress(address);
};

// Helper to validate and normalize contract address
export const validateContractAddress = (symbolOrAddress: string): string => {
  if (isAddress(symbolOrAddress)) {
    return getAddress(symbolOrAddress);
  }
  throw new Error(`Invalid contract address: ${symbolOrAddress}`);
};
