import { ToolCallStream } from './stores/toolCallStreamStore';
import { ToolCallRegistry } from './toolcalls/chain';

export const ToolCallProgressCards = ({
  onRendered,
  toolCallStreams,
  toolCallRegistry,
  isOperationValidated,
}: {
  onRendered: () => void;
  toolCallStreams: Array<ToolCallStream>;
  toolCallRegistry: ToolCallRegistry<unknown>;
  isOperationValidated: boolean;
}) => {
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
