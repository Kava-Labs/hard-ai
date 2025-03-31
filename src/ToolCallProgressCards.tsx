import { useSyncExternalStore } from 'react';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { ToolCallRegistry } from './toolcalls/chain';

export const ToolCallProgressCards = ({
  onRendered,
  toolCallStreamStore,
  toolCallRegistry,
  isOperationValidated,
}: {
  onRendered: () => void;
  toolCallStreamStore: ToolCallStreamStore;
  toolCallRegistry: ToolCallRegistry<unknown>;
  isOperationValidated: boolean;
}) => {
  const toolCallStreams = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapShot,
  );

  if (!toolCallStreams.length) return null;

  return toolCallStreams.map((toolCall) => {
    const operation = toolCallRegistry.get(toolCall.function.name ?? '');
    if (operation && operation.inProgressComponent) {
      const Component = operation.inProgressComponent();
      return (
        <Component
          isOperationValidated={isOperationValidated}
          key={toolCall.id}
          toolCall={toolCall}
          onRendered={onRendered}
        />
      );
    }
    return null;
  });
};
