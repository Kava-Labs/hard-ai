import styles from './ChatInput.module.css';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { SendChatIcon } from './SendChatIcon';
import { ChatMessage } from './types';

const DEFAULT_HEIGHT = '30px';

type ChatInputProps = {
  onSubmitMessage?: (message: ChatMessage) => void;
};

export const ChatInput = ({ onSubmitMessage }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
    if (inputValue.trim() === '') return;

    // Create message object
    const message: ChatMessage = {
      role: 'user',
      content: inputValue,
    };

    // Send message to parent component
    if (onSubmitMessage) {
      onSubmitMessage(message);
    }

    // Reset input
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = DEFAULT_HEIGHT;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter key (without Shift key)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputValue.trim() !== '') {
        onSubmitClick();
      }
    }
  };

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.inputContainer}>
          <textarea
            className={styles.input}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder="Ask anything..."
          />
          <button
            ref={buttonRef}
            className={styles.sendChatButton}
            type="submit"
            onClick={onSubmitClick}
            aria-label="Send Chat"
            disabled={inputValue.length === 0}
          >
            <SendChatIcon />
          </button>
        </div>
      </div>

      <div className={styles.importantInfo}>
        <span>Hard AI can make mistakes. Check important info.</span>
      </div>
    </>
  );
};
