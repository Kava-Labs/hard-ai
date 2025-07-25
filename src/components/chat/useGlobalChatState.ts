import React from 'react';

export const ChatContext = React.createContext<{
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  enableCustomSystemPrompt: boolean;
  setEnableCustomSystemPrompt: (enable: boolean) => void;
}>({
  customSystemPrompt: '',
  setCustomSystemPrompt: () => {},
  enableCustomSystemPrompt: false,
  setEnableCustomSystemPrompt: () => {},
});

export const useGlobalChatState = () => {
  return React.useContext(ChatContext);
};
