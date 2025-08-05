import type { ActiveChat } from '../types';
import type { OperationResult, ExecuteToolCall } from '../toolcalls/chain';
import type { ChatCompletionChunk } from 'openai/resources/index';
import { formatConversationTitle } from 'lib-kava-ai';
import { ToolCallRegistry } from '../toolcalls/chain/ToolCallRegistry';
import { ToolCallStreamStore } from '../stores/toolCallStreamStore';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ToolResultStore } from '../stores/toolResultStore';

export const doChat = async (
  activeChat: ActiveChat,
  toolCallRegistry: ToolCallRegistry<unknown>,
  executeOperation: ExecuteToolCall,
  toolResultStore?: ToolResultStore,
) => {
  try {
    const stream = await activeChat.client.chat.completions.create(
      {
        model: activeChat.model,
        messages: activeChat.messageHistoryStore.getSnapshot(),
        stream: true,
        tools: toolCallRegistry.getToolDefinitions(),
        stream_options: {
          include_usage: true,
        },
      },
      {
        signal: activeChat.abortController.signal,
      },
    );

    for await (const chunk of stream) {
      if (isContentChunk(chunk)) {
        //  Add content from chunks that have it and not the final usage chunk if it exists
        if (
          chunk.choices.length &&
          typeof chunk['choices'][0]['delta']['content'] === 'string'
        ) {
          activeChat.messageStore.appendText(
            chunk['choices'][0]['delta']['content'],
          );
        }

        // Capture usage data from the final chunk
        if (chunk.usage) {
          activeChat.usageStore.setUsage(chunk.usage);
        }
      } else if (isToolCallChunk(chunk)) {
        assembleToolCallsFromStream(chunk, activeChat.toolCallStreamStore);
      }
    }

    // Push a message
    if (activeChat.messageStore.getSnapshot() !== '') {
      const msg = {
        role: 'assistant' as const,
        content: activeChat.messageStore.getSnapshot(),
      };

      activeChat.messageHistoryStore.addMessage(msg);
      activeChat.messageStore.setText('');
    }

    if (activeChat.toolCallStreamStore.getSnapShot().length > 0) {
      // do the tool calls
      await callTools(
        activeChat.toolCallStreamStore,
        activeChat.messageHistoryStore,
        executeOperation,
        toolResultStore,
      );

      // inform the model of the tool call responses
      await doChat(
        activeChat,
        toolCallRegistry,
        executeOperation,
        toolResultStore,
      );
    }
  } catch (e) {
    console.error(`An error occurred: ${e} `);
    activeChat.errorStore.setText(
      e instanceof Error
        ? e.message
        : `An error occurred: ${JSON.stringify(e)} `,
    );
  } finally {
    // Ensure content is published on abort
    if (activeChat.messageStore.getSnapshot() !== '') {
      activeChat.messageHistoryStore.addMessage({
        role: 'assistant' as const,
        content: activeChat.messageStore.getSnapshot(),
      });
      activeChat.messageStore.setText('');
    }
  }
};

export const isContentChunk = (result: ChatCompletionChunk): boolean => {
  // Treat chunks with usage data as content chunks, could be empty content
  // or still have content in the delta.
  if (result.usage) {
    return true;
  }

  const delta = result.choices[0].delta;
  //  Sometimes content is an empty string, so we check if content is a string property.
  return delta && 'content' in delta && typeof delta.content === 'string';
};

/**
 * Checks if the given ChatCompletionChunk is a tool call chunk.
 * @param result - The ChatCompletionChunk to check.
 * @returns True if the chunk contains tool calls, false otherwise.
 */
export const isToolCallChunk = (result: ChatCompletionChunk): boolean => {
  if (result.choices[0]?.delta && result.choices[0].delta.tool_calls) {
    return true;
  }
  return false;
};

/**
 * Assembles tool calls from the streamed ChatCompletionChunk.
 * @param result - The ChatCompletionChunk containing tool call data.
 * @param toolCallsStreamStore - The tool call stream store to send the chunks for processing
 */
export const assembleToolCallsFromStream = (
  result: ChatCompletionChunk,
  toolCallsStreamStore: ToolCallStreamStore,
): void => {
  if (!result.choices[0].delta?.tool_calls) {
    return;
  }

  for (const tcChunk of result.choices[0].delta.tool_calls) {
    toolCallsStreamStore.setToolCall(tcChunk);
  }
};

export const generateConversationTitle = async (
  activeChat: ActiveChat,
): Promise<string> => {
  let title = 'New Chat';
  try {
    const data = await activeChat.client.chat.completions.create({
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'your task is to generate a title for a conversation using 3 to 4 words',
        },
        {
          role: 'user',
          content: `Please generate a title for this conversation (max 4 words):
                    ${activeChat.messageHistoryStore
                      .getSnapshot()
                      .map((msg) => {
                        // only keep user/assistant messages
                        if (msg.role !== 'user' && msg.role !== 'assistant')
                          return;
                        return `Role: ${msg.role} 
                                    ${msg.content}
                      `;
                      })}
                    `,
        },
      ],
      model: 'gpt-4o-mini',
    });

    title = data.choices[0].message.content ?? 'New Chat';
  } catch (err) {
    console.error(err);
  }

  // Apply truncation only when we get the AI-generated title
  return formatConversationTitle(title, 34);
};

/**
 * Processes pending tool calls from the tool call stream, executes the corresponding operations,
 * and updates the message history with both the tool calls and their results.
 *
 * @param toolCallStreamStore - Store containing pending tool calls to be processed
 * @param messageHistoryStore - Store for maintaining the conversation message history
 * @param executeOperation - Function that executes the named operation with the provided arguments
 */

export async function callTools(
  toolCallStreamStore: ToolCallStreamStore,
  messageHistoryStore: MessageHistoryStore,
  executeOperation: ExecuteToolCall,
  toolResultStore?: ToolResultStore,
): Promise<void> {
  for (const toolCall of toolCallStreamStore.getSnapShot()) {
    const name = toolCall.function?.name;

    if (name) {
      let content = '';
      let rawResult = '';
      try {
        const result = await executeOperation(
          name,
          toolCall.function.arguments,
        );
        rawResult = result;
        content = JSON.stringify({
          status: 'ok',
          info: result,
        } as OperationResult);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        const stackTrace = err instanceof Error ? err.stack : undefined;

        // Store the tool error if we have a store
        if (toolResultStore) {
          toolResultStore.setError(toolCall.id, name, errorMessage, stackTrace);
        }

        content = JSON.stringify({
          status: 'failed',
          info: errorMessage,
        } as OperationResult);
      }

      // Store the tool result if we have a store and a successful result
      if (toolResultStore && rawResult) {
        toolResultStore.setResult(toolCall.id, name, rawResult);
      }

      messageHistoryStore.addMessage({
        role: 'assistant' as const,
        function_call: null,
        content: null,
        tool_calls: [
          toolCallStreamStore.toChatCompletionMessageToolCall(toolCall),
        ],
      });
      toolCallStreamStore.deleteToolCallById(toolCall.id);
      messageHistoryStore.addMessage({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content,
      });
    }
  }
}
