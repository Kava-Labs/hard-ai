import { Conversation } from './Conversation';
import { useMessageHistoryStore } from './stores/messageHistoryStore';
import { useTextStreamStore } from './stores/textStreamStore';
import { ActiveChat } from './types';
import { ToolCallRegistry } from './toolcalls/chain';
import { useLoadingStore } from './stores/loadingStore/useLoadingStore';

interface ConversationWrapperProps {
  activeChat: ActiveChat;
  onRendered: () => void;
  toolCallRegistry: ToolCallRegistry<unknown>;
}

export const ConversationWrapper = ({
  activeChat,
  onRendered,
  toolCallRegistry,
}: ConversationWrapperProps) => {
  const messages = useMessageHistoryStore(activeChat.messageHistoryStore);
  const loadingState = useLoadingStore(activeChat.loadingStore);
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
      loadingState={loadingState}
      isOperationValidated={activeChat.isOperationValidated}
      onRendered={onRendered}
      progressStore={activeChat.progressStore}
      toolCallStreamStore={activeChat.toolCallStreamStore}
      toolCallRegistry={toolCallRegistry}
    />
  );
};
