import type { ActiveChat } from '../types';
import type { ChatCompletionChunk } from 'openai/resources/index';
import { formatConversationTitle } from '../utils/helpers';

export const doChat = async (activeChat: ActiveChat) => {
  activeChat.progressStore.setText('Thinking');

  try {
    const stream = await activeChat.client.chat.completions.create(
      {
        model: activeChat.model,
        messages: activeChat.messageHistoryStore.getSnapshot(),
        stream: true,
      },
      {
        signal: activeChat.abortController.signal,
      },
    );

    for await (const chunk of stream) {
      if (activeChat.progressStore.getSnapshot() !== '') {
        activeChat.progressStore.setText('');
      }

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
  } catch (e) {
    console.error(`An error occurred: ${e} `);
    activeChat.errorStore.setText(
      e instanceof Error
        ? e.message
        : `An error occurred: ${JSON.stringify(e)} `,
    );
  } finally {
    // Clear progress text if not cleared already
    if (activeChat.progressStore.getSnapshot() !== '') {
      activeChat.progressStore.setText('');
    }

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
  //  Treat usage-only chunks as content chunks
  if (result.usage && (!result.choices || result.choices.length === 0)) {
    return true;
  }
  const delta = result.choices[0].delta;
  //  Sometimes content is an empty string, so we check if content is a string property.
  return delta && 'content' in delta && typeof delta.content === 'string';
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
