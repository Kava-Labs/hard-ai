import styles from './ChatInput.module.css';
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { SendChatIcon } from './SendChatIcon';
import { ChatMessage } from './types';
import { CancelChatIcon } from './CancelChatIcon';
import { ChatSettingsButton } from './ChatSettings';
import { useGlobalChatState } from './components/chat/useGlobalChatState';
import { ContextUsageTracker } from './components/ContextUsageTracker';
import { UsageStore } from './stores/usageStore';

const DEFAULT_HEIGHT = '30px';

type ChatInputProps = {
  handleChatCompletion: (newMessages: ChatMessage[]) => void;
  onCancelClick: () => void;
  isRequesting: boolean;
  usageStore: UsageStore;
};

export const ChatInput = ({
  handleChatCompletion,
  onCancelClick,
  isRequesting,
  usageStore,
}: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { enableCustomSystemPrompt } = useGlobalChatState();

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      /**
       * Set the text area height to 'auto' on change so the height is
       * automatically adjusted as the user types. Set it to the
       * scrollHeight so as the user types, the textarea content moves
       * upward keeping the user on the same line
       */
      const textarea = event.target;
      textarea.style.height = DEFAULT_HEIGHT; // Reset to default height first
      textarea.style.height = `min(${textarea.scrollHeight}px, 60vh)`; // Adjust to scrollHeight
      setInputValue(textarea.value);
    },
    [],
  );

  const onSubmitClick = () => {
    const newMessages: ChatMessage[] = [{ role: 'user', content: inputValue }];
    handleChatCompletion(newMessages);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = DEFAULT_HEIGHT;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputValue.trim() !== '') {
        onSubmitClick();
      }
    }
  };

  const onActionButtonClick = isRequesting ? onCancelClick : onSubmitClick;
  const actionButtonLabel = isRequesting ? 'Cancel Chat' : 'Send Chat';

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.inputContainer}>
          <ChatSettingsButton />
          <textarea
            className={styles.input}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder="Ask anything..."
            autoFocus
          />
          <button
            ref={buttonRef}
            className={styles.sendChatButton}
            type="submit"
            onClick={onActionButtonClick}
            aria-label={actionButtonLabel}
            disabled={inputValue.trim() === '' && !isRequesting}
          >
            {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
          </button>
        </div>
      </div>
      <div className={styles.importantInfo}>
        <span>KavaAI can make mistakes. Check important info.</span>
        <ContextUsageTracker usageStore={usageStore} />
      </div>
      {enableCustomSystemPrompt && (
        <div className={styles.importantInfo}>
          <span>You are using a modified system prompt.</span>
        </div>
      )}
    </>
  );
};
