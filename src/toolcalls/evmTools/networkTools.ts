import { z } from 'zod';
import { EvmToolOperation, createToolName } from './types';
import {
  getCurrentAccount,
  getCurrentChainId,
  getEthereumProvider,
  getEvmChainConfigByName,
} from './helpers';

// Switch Network Tool (Enhanced)
export class SwitchNetworkTool extends EvmToolOperation {
  name = createToolName('switch-network');
  description =
    'Switch the connected wallet to a different EVM-compatible chain';
  zodSchema = z.object({
    chainName: z.string().describe('Name of the chain to switch to'),
  });

  async execute(params: unknown): Promise<string> {
    const { chainName } = this.zodSchema.parse(params) as { chainName: string };

    // Validate chain exists in registry
    const chainConfig = getEvmChainConfigByName(chainName);
    if (!chainConfig) {
      throw new Error(`Chain ${chainName} not found in registry`);
    }

    // Use wallet_switchEthereumChain RPC method
    const provider = getEthereumProvider();

    try {
      await provider.request({
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
          await provider.request({
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

  async execute(): Promise<string> {
    const account = await getCurrentAccount();
    return account;
  }
}

// Get Chain ID Tool
export class GetChainIdTool extends EvmToolOperation {
  name = createToolName('get-chain-id');
  description =
    'Get the current connected chain ID. Use this to determine which network the wallet is connected to.';
  zodSchema = z.object({});

  async execute(): Promise<string> {
    const chainId = await getCurrentChainId();
    return chainId.toString();
  }
}
