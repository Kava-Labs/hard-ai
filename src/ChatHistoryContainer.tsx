import { ChatHistory } from './ChatHistory';
import { ConversationHistory } from './types';

interface ChatHistoryContainerProps {
  conversations: ConversationHistory[];
  onSelectConversation: (id: string) => void;
}

export const ChatHistoryContainer = ({
  conversations,
  onSelectConversation,
}: ChatHistoryContainerProps) => {
  return (
    <ChatHistory
      conversations={conversations}
      onSelectConversation={onSelectConversation}
    />
  );
};
