import { ChatHistory } from './ChatHistory';
import { ConversationHistory } from '.././types';

export const ChatHistoryContainer = () => {
  const conversations: ConversationHistory[] = [
    {
      id: 'conv-2025-03-15-001',
      model: 'gpt-4-turbo',
      title: 'Project Planning Discussion',
      conversation: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        },
        {
          role: 'user',
          content:
            'Can you help me plan a new web application project? I want to build a task management system.',
        },
      ],
      lastSaved: Date.now(),
      tokensRemaining: 6453,
    },
    {
      id: 'conv-2025-03-16-002',
      model: 'claude-3-opus',
      title: 'Recipe Ideas for Dinner Party',
      conversation: [
        {
          role: 'system',
          content:
            'You are Claude, a helpful AI assistant created by Anthropic.',
        },
        {
          role: 'user',
          content:
            "I'm hosting a dinner party this weekend and need some vegetarian main course ideas that will impress my guests.",
        },
      ],
      lastSaved: Date.now(),
      tokensRemaining: 4821,
    },
    {
      id: 'conv-2025-03-17-003',
      model: 'gpt-3.5-turbo',
      title: 'Help with Data Analysis',
      conversation: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        },
        {
          role: 'user',
          content:
            "I have a CSV file with sales data for the past year. I need to analyze it to find trends. What's the best way to do this with Python?",
        },
      ],
      lastSaved: Date.now() - 100000000,
      tokensRemaining: 7632,
    },
    {
      id: 'conv-2025-03-17-003',
      model: 'gpt-3.5-turbo',
      title: 'Help with party planning',
      conversation: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        },
        {
          role: 'user',
          content:
            "I have a CSV file with sales data for the past year. I need to analyze it to find trends. What's the best way to do this with Python?",
        },
      ],
      lastSaved: Date.now() - 1000000000,
      tokensRemaining: 7632,
    },
  ];
  return <ChatHistory conversations={conversations} />;
};
