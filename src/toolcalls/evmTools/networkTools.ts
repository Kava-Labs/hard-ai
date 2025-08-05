import { z } from 'zod';
import { EvmToolOperation, createToolName, EthereumProvider } from './types';
import {
  getCurrentAccount,
  getCurrentChainId,
  getEthereumProvider,
} from './helpers';
import { chainService } from '../chain/ChainService';
import { ChainType, EVMChainConfig } from '../chain/chainsRegistry';

// Switch Network Tool (Enhanced)
export class SwitchNetworkTool extends EvmToolOperation {
  name = createToolName('switch-network');
  description =
    'Switch the connected wallet to a different EVM-compatible chain';
  zodSchema = z.object({
    chainName: z.string().describe('Name of the chain to switch to'),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { chainName } = this.zodSchema.parse(params) as { chainName: string };

    // Search for chain in registry
    const searchResults = await chainService.searchChains(chainName, 5);
    const evmChain = searchResults.find(
      (chain): chain is EVMChainConfig => chain.chainType === ChainType.EVM,
    );

    if (!evmChain) {
      const availableEvmChains =
        searchResults.length > 0
          ? `Available chains matching "${chainName}": ${searchResults.map((c) => c.name).join(', ')}`
          : `No chains found matching "${chainName}". Try searching for: Kava EVM, Ethereum, Polygon, etc.`;
      throw new Error(
        `EVM chain "${chainName}" not found in registry. ${availableEvmChains}`,
      );
    }

    const chainConfig = evmChain;

    // Use wallet_switchEthereumChain RPC method
    const ethereumProvider = getEthereumProvider(provider);

    try {
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          { chainId: `0x${parseInt(chainConfig.chainID).toString(16)}` },
        ],
      });

      return JSON.stringify({
        success: true,
        message: `Switched to ${chainName}`,
        chainId: chainConfig.chainID,
        chainName: chainConfig.name,
      });
    } catch (error) {
      // If chain is not added to wallet, add it
      if (
        error instanceof Error &&
        error.message.includes('Unrecognized chain ID')
      ) {
        try {
          await ethereumProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${parseInt(chainConfig.chainID).toString(16)}`,
                chainName: chainConfig.name,
                nativeCurrency: {
                  name: chainConfig.nativeToken,
                  symbol: chainConfig.nativeToken,
                  decimals: chainConfig.nativeTokenDecimals,
                },
                rpcUrls: chainConfig.rpcUrls,
                blockExplorerUrls: chainConfig.blockExplorerUrls,
              },
            ],
          });

          return JSON.stringify({
            success: true,
            message: `Added and switched to ${chainName}`,
            chainId: chainConfig.chainID,
            chainName: chainConfig.name,
          });
        } catch (addError) {
          throw new Error(
            `Failed to add chain ${chainName}: ${addError instanceof Error ? addError.message : 'Unknown error'}`,
          );
        }
      }

      throw new Error(
        `Failed to switch to chain ${chainName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Get Account Tool
export class GetAccountTool extends EvmToolOperation {
  name = createToolName('get-account');
  description = 'Get the current 0x account address from the connected wallet';
  zodSchema = z.object({});

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const account = await getCurrentAccount(provider);
    return account;
  }
}

// Get Chain ID Tool
export class GetChainIdTool extends EvmToolOperation {
  name = createToolName('get-chain-id');
  description =
    'Get the current chain ID from the connected wallet. Returns the chain ID as a number.';
  zodSchema = z.object({});

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const chainId = await getCurrentChainId(provider);
    return chainId.toString();
  }
}
