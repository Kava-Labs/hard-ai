import {
  chainNameToolCallParam,
  chainRegistry,
  ToolCallRegistry,
  OperationResult,
  OperationType,
} from '../chain';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import { CompleteTxDisplay } from './CompleteTxDisplayCard';

export interface ToolMessageContainerProps {
  message: ChatCompletionToolMessageParam;
  prevMessage: ChatCompletionAssistantMessageParam;
  toolCallRegistry: ToolCallRegistry<unknown>;
}

export const ToolMessageContainer = ({
  message,
  prevMessage,
  toolCallRegistry,
}: ToolMessageContainerProps) => {
  const id = message.tool_call_id;

  // Check if the previous message is valid
  if (
    !(
      prevMessage.role === 'assistant' &&
      prevMessage.content === null &&
      Array.isArray(prevMessage.tool_calls)
    )
  ) {
    return null;
  }

  const tc = prevMessage.tool_calls.find(
    (tc: ChatCompletionMessageToolCall) => tc.id === id,
  );
  if (!tc) return null;

  const params = JSON.parse(tc.function.arguments);
  if (
    typeof params === 'object' &&
    params !== null &&
    chainNameToolCallParam.name in params
  ) {
    const chainName = params[chainNameToolCallParam.name];
    const operation = toolCallRegistry.get(tc.function.name);
    if (!operation) return null;

    const chain = chainRegistry[operation.chainType][chainName];
    const content: OperationResult = JSON.parse(message.content as string);

    if (content.status !== 'ok') {
      return null;
    }

    if (operation.operationType === OperationType.TRANSACTION) {
      return <CompleteTxDisplay hash={content.info} chain={chain} />;
      //  don't display a custom component for queries or wallet actions
    } else {
      return null;
    }
  }

  return null;
};
