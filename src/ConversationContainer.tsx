import { ChatMessage, Conversation } from './Conversation';

export const ConversationContainer = () => {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: 'Hello! How are you today?',
    },
    {
      role: 'assistant',
      content:
        "I'm doing well, thank you for asking! How can I help you today?",
    },
    {
      role: 'user',
      content: 'Can you explain what React is?',
    },
    {
      role: 'assistant',
      content:
        'React is a JavaScript library for building user interfaces. It was developed by Facebook and allows developers to create reusable UI components that can efficiently update when your data changes.',
    },
  ];

  return <Conversation messages={messages} />;
};
