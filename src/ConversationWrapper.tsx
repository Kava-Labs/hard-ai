import { Conversation } from './Conversation';
import { useMessageHistoryStore } from './stores/messageHistoryStore';
import { useTextStreamStore } from './stores/textStreamStore';
import { ActiveChat } from './types';

export const ConversationWrapper = ({
  activeChat,
}: {
  activeChat: ActiveChat;
}) => {
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
    />
  );
};
