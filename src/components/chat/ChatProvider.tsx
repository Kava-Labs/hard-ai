import React from 'react';
import { defaultSystemPrompt } from '../../toolcalls/chain/prompts';
import { ChatContext } from './useGlobalChatState';

export const ChatProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [customSystemPrompt, setCustomSystemPrompt] =
    React.useState(defaultSystemPrompt);
  const [enableCustomSystemPrompt, setEnableCustomSystemPrompt] =
    React.useState(false);

  return (
    <ChatContext.Provider
      value={{
        customSystemPrompt: customSystemPrompt,
        setCustomSystemPrompt: setCustomSystemPrompt,
        enableCustomSystemPrompt: enableCustomSystemPrompt,
        setEnableCustomSystemPrompt: setEnableCustomSystemPrompt,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
