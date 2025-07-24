import {
  ChainToolCallQuery,
  MessageParam,
  OperationType,
} from '../chain/chainToolCallOperation';
import { WalletStore } from '../../stores/walletStore';
import { ChainType } from '../chain/chainsRegistry';

export interface WebSearchParams {
  query: string;
}

/**
 * Web search operation that triggers a re-execution of the current request
 * with web search enabled. This is a "fake" tool call that doesn't actually
 * perform the search itself, but instead triggers the AI provider's web search plugin.
 */
export class WebSearchOperation implements ChainToolCallQuery<WebSearchParams> {
  name = 'web_search';
  chainType = ChainType.EVM; // Not actually relevant for web search
  description =
    'Search the web for current information when you need up-to-date data or specific information not in your training data.';
  operationType = OperationType.QUERY;

  parameters: MessageParam[] = [
    {
      name: 'query',
      type: 'string',
      description: 'The search query to execute on the web',
      required: true,
    },
  ];

  async validate(
    _params: WebSearchParams,
    _walletStore: WalletStore,
  ): Promise<boolean> {
    // Web search doesn't need validation since it's handled by the AI provider
    return true;
  }

  async executeQuery(
    params: WebSearchParams,
    _walletStore: WalletStore,
  ): Promise<string> {
    // This method should never actually be called since we handle web_search
    // specially in the callTools function. If it is called, it means something
    // went wrong.
    throw new Error(
      `Web search tool called directly - this should be handled specially. Query: ${params.query}`,
    );
  }
}
