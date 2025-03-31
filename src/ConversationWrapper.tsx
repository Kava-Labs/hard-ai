import { Conversation } from './Conversation';
import { useMessageHistoryStore } from './stores/messageHistoryStore';
import { useTextStreamStore } from './stores/textStreamStore';
import { ActiveChat } from './types';
import { ToolCallRegistry } from './toolcalls/chain';

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
  const assistantStream = useTextStreamStore(activeChat.messageStore);
  const errorText = useTextStreamStore(activeChat.errorStore);
  const isRequesting = activeChat.isRequesting;
  const isProcessing = activeChat.isProcessing;

  return (
    <Conversation
      messages={messages}
      assistantStream={assistantStream}
      errorText={errorText}
      isRequesting={isRequesting}
      isProcessing={isProcessing}
      isOperationValidated={activeChat.isOperationValidated}
      onRendered={onRendered}
      toolCallStreamStore={activeChat.toolCallStreamStore}
      toolCallRegistry={toolCallRegistry}
    />
  );
};
