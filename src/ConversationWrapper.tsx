import { Conversation } from './Conversation';
import { useMessageHistoryStore } from './stores/messageHistoryStore';
import { useTextStreamStore } from 'lib-kava-ai';
import { ActiveChat } from './types';
import { ToolCallRegistry } from './toolcalls/chain';
import { useToolCallStreamStore } from './stores/toolCallStreamStore';

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
  const {
    messageHistoryStore,
    messageStore,
    toolCallStreamStore,
    errorStore,
    isRequesting,
    isOperationValidated,
  } = activeChat;

  const messages = useMessageHistoryStore(messageHistoryStore);
  const assistantStream = useTextStreamStore(messageStore);
  const toolCallStreams = useToolCallStreamStore(toolCallStreamStore);
  const errorText = useTextStreamStore(errorStore);

  return (
    <Conversation
      messages={messages}
      assistantStream={assistantStream}
      errorText={errorText}
      isRequesting={isRequesting}
      isOperationValidated={isOperationValidated}
      onRendered={onRendered}
      toolCallStreams={toolCallStreams}
      toolCallRegistry={toolCallRegistry}
    />
  );
};
