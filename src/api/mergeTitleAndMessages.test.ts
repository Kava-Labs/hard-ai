import { describe, it, expect } from 'vitest';
import { ChatMessage, ConversationHistory, MessageHistory } from '../types';
import { mergeTitleAndMessages } from './mergeTitleAndMessages';

describe('mergeTitleAndMessages', () => {
  const messagesData: { id: string; messages: ChatMessage[] }[] = [
    {
      id: '123',
      messages: [
        { role: 'user', content: 'Hello AI' },
        { role: 'assistant', content: 'Hello World!' },
      ],
    },
    {
      id: '456',
      messages: [
        { role: 'user', content: 'foobar' },
        { role: 'assistant', content: 'fizzbuzz' },
      ],
    },
  ];

  const conversationsData: ConversationHistory[] = [
    {
      id: '123',
      title: 'Chat 1',
      tokensRemaining: 10000,
      lastSaved: 987654321,
      model: 'gpt-4o',
    },
    {
      id: '456',
      title: 'Chat 2',
      tokensRemaining: 10000,
      lastSaved: 987654321,
      model: 'gpt-4o',
    },
  ];

  it('should correctly merge titles with their messages', () => {
    const result = mergeTitleAndMessages(messagesData, conversationsData);
    expect(result).toEqual({
      '123': {
        title: 'Chat 1',
        messages: [
          { role: 'user', content: 'Hello AI' },
          { role: 'assistant', content: 'Hello World!' },
        ],
      },
      '456': {
        title: 'Chat 2',
        messages: [
          { role: 'user', content: 'foobar' },
          { role: 'assistant', content: 'fizzbuzz' },
        ],
      },
    });
  });

  it('should handle cases where there are no messages for a conversation', () => {
    //  Missing the '456' entry
    const singularConversationData: ConversationHistory[] = [
      {
        id: '123',
        title: 'Chat 1',
        tokensRemaining: 10000,
        lastSaved: 987654321,
        model: 'gpt-4o',
      },
    ];

    const result = mergeTitleAndMessages(
      messagesData,
      singularConversationData,
    );
    expect(result).toEqual({
      '123': {
        title: 'Chat 1',
        messages: [
          { role: 'user', content: 'Hello AI' },
          { role: 'assistant', content: 'Hello World!' },
        ],
      },
    });
  });

  it('should handle an empty input gracefully', () => {
    const emptyMessages: MessageHistory[] = [];
    const emptyConversations: ConversationHistory[] = [];

    const result = mergeTitleAndMessages(emptyMessages, emptyConversations);
    expect(result).toEqual({});
  });
});
