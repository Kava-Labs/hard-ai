import { Conversation } from './Conversation';
import { useMessageHistoryStore } from './stores/messageHistoryStore';
import { useTextStreamStore } from './stores/textStreamStore';
import { ActiveChat } from './types';

interface ConversationWrapperProps {
  activeChat: ActiveChat;
  onRendered: () => void;
}

export const ConversationWrapper = ({
  activeChat,
  onRendered,
}: ConversationWrapperProps) => {
  const messages = useMessageHistoryStore(activeChat.messageHistoryStore);
  const assistantStream = useTextStreamStore(activeChat.messageStore);
  const progressText = useTextStreamStore(activeChat.progressStore);
  const errorText = useTextStreamStore(activeChat.errorStore);
  const isRequesting = activeChat.isRequesting;

  return (
    <Conversation
      messages={messages}
      assistantStream={assistantStream}
      progressText={progressText}
      errorText={errorText}
      isRequesting={isRequesting}
      onRendered={onRendered}
    />
  );
};
