import { Conversation } from './Conversation';
import { useMessageHistoryStore } from './stores/messageHistoryStore';
import { useTextStreamStore } from './stores/textStreamStore';
import { ActiveChat } from './types';
import { OperationRegistry } from './types/chain';

interface ConversationWrapperProps {
  activeChat: ActiveChat;
  onRendered: () => void;
  operationRegistry: OperationRegistry<unknown>;
}

export const ConversationWrapper = ({
  activeChat,
  onRendered,
  operationRegistry,
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
      isOperationValidated={activeChat.isOperationValidated}
      onRendered={onRendered}
      progressStore={activeChat.progressStore}
      toolCallStreamStore={activeChat.toolCallStreamStore}
      operationRegistry={operationRegistry}
    />
  );
};
