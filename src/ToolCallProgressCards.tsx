import { useSyncExternalStore } from 'react';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { OperationRegistry } from './types/chain';
import { TextStreamStore } from './stores/textStreamStore';

export const ToolCallProgressCards = ({
  onRendered,
  toolCallStreamStore,
  operationRegistry,
  progressStore,
}: {
  onRendered: () => void;
  progressStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  operationRegistry: OperationRegistry<unknown>;
}) => {
  const toolCallStreams = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapShot,
  );

  if (!toolCallStreams.length) return null;

  return toolCallStreams.map((toolCall) => {
    const operation = operationRegistry.get(toolCall.function.name ?? '');
    if (operation && operation.inProgressComponent) {
      const Component = operation.inProgressComponent();
      return (
        <Component
          progressStore={progressStore}
          key={toolCall.id}
          toolCall={toolCall}
          onRendered={onRendered}
        />
      );
    }
    return null;
  });
};
