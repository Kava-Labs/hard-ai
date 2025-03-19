import { ChatMessage, Conversation } from './Conversation';

interface ConversationContainerProps {
  messages: ChatMessage[];
}

export const ConversationContainer = ({
  messages,
}: ConversationContainerProps) => {
  return <Conversation messages={messages} />;
};
