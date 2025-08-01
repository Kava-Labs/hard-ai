import { ToolCallRegistry } from '../chain/ToolCallRegistry';
import { getChainConfigByChainId } from './helpers';
import { getExtraToolByKey } from '../chain/extraTools';

// Import all tool classes
import {
  GetTokenBalanceTool,
  GetTokenInfoTool,
  ListSupportedTokensTool,
} from './tokenTools';
import {
  SwitchNetworkTool,
  GetAccountTool,
  GetChainIdTool,
} from './networkTools';
import {
  GetBalanceTool,
  GetBlockTool,
  GetBlockNumberTool,
} from './balanceAndBlockTools';
import {
  CallContractTool,
  EncodeFunctionDataTool,
  EstimateGasTool,
  ReadContractTool,
} from './contractTools';
import {
  SendTransactionTool,
  SignMessageTool,
  FormatEtherTool,
  ParseEtherTool,
  HashTool,
} from './transactionTools';

// Centralized list of EVM tools (maintaining alphabetical order)
// These are tools that are ONLY registered when the wallet is connected, and
// are not available otherwise.
const EVM_TOOLS = [
  new CallContractTool(),
  new EncodeFunctionDataTool(),
  new EstimateGasTool(),
  new FormatEtherTool(),
  new GetAccountTool(),
  new GetBalanceTool(),
  new GetBlockTool(),
  new GetBlockNumberTool(),
  new GetChainIdTool(),
  new GetTokenBalanceTool(),
  new GetTokenInfoTool(),
  new HashTool(),
  new ListSupportedTokensTool(),
  new ParseEtherTool(),
  new ReadContractTool(),
  new SendTransactionTool(),
  new SignMessageTool(),
  new SwitchNetworkTool(),
];

// Integration functions
export const registerEvmToolsWithRegistry = async (
  registry: ToolCallRegistry<unknown>,
  chainId?: string,
): Promise<void> => {
  try {
    EVM_TOOLS.forEach((tool) => registry.register(tool));
    console.log(`Registered ${EVM_TOOLS.length} EVM tools`);

    // Also register chain-specific tools for the current chain if chainId is provided
    if (chainId) {
      await registerChainSpecificTools(registry, chainId);
    }
  } catch (error) {
    console.warn('Failed to register EVM tools with registry:', error);
  }
};

export const deregisterEvmToolsFromRegistry = async (
  registry: ToolCallRegistry<unknown>,
  chainId?: string,
): Promise<void> => {
  // Deregister standard EVM tools
  EVM_TOOLS.forEach((tool) => {
    registry.deregister(tool);
  });

  // Also deregister any chain-specific tools if chainId is provided
  if (chainId) {
    await deregisterChainSpecificTools(registry, chainId);
  }

  console.log(`Deregistered ${EVM_TOOLS.length} EVM tools from registry`);
};

// Function to handle chain changes - can be called when wallet chain changes
export const changeChainToolCallRegistration = async (
  registry: ToolCallRegistry<unknown>,
  newChainId: string,
  oldChainId?: string,
): Promise<void> => {
  try {
    // Deregister any existing chain-specific tools for the old chain
    if (oldChainId) {
      await deregisterChainSpecificTools(registry, oldChainId);
    }

    // Register chain-specific tools for the new chain
    await registerChainSpecificTools(registry, newChainId);
  } catch (error) {
    console.warn('Failed to handle chain change:', error);
  }
};

// Helper function to register chain-specific tools
const registerChainSpecificTools = async (
  registry: ToolCallRegistry<unknown>,
  chainId: string,
): Promise<void> => {
  try {
    const chainInfo = await getChainConfigByChainId(chainId);
    if (chainInfo && chainInfo.chainConfig.extraTools) {
      chainInfo.chainConfig.extraTools.forEach((toolKey) => {
        try {
          const tool = getExtraToolByKey(toolKey);
          registry.register(tool);
        } catch (error) {
          console.warn(
            `Tool ${toolKey} not found in extraTools registry`,
            error,
          );
        }
      });
      console.log(
        `Registered ${chainInfo.chainConfig.extraTools.length} chain-specific tools for ${chainInfo.chainName}`,
      );
    }
  } catch (error) {
    console.warn('Failed to register chain-specific tools:', error);
  }
};

// Helper function to deregister chain-specific tools
const deregisterChainSpecificTools = async (
  registry: ToolCallRegistry<unknown>,
  chainId: string,
): Promise<void> => {
  try {
    const chainInfo = await getChainConfigByChainId(chainId);
    if (chainInfo && chainInfo.chainConfig.extraTools) {
      chainInfo.chainConfig.extraTools.forEach((toolKey) => {
        try {
          const tool = getExtraToolByKey(toolKey);
          registry.deregister(tool);
        } catch (error) {
          console.warn(
            `Tool ${toolKey} not found in extraTools registry`,
            error,
          );
        }
      });
      console.log(
        `Deregistered ${chainInfo.chainConfig.extraTools.length} chain-specific tools for ${chainInfo.chainName}`,
      );
    }
  } catch (error) {
    console.warn('Failed to deregister chain-specific tools:', error);
  }
};
