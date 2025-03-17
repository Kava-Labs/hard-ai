import styles from './ChatInput.module.css';
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { SendChatIcon } from './SendChatIcon';

const DEFAULT_HEIGHT = '30px';

export const ChatInput = () => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.inputContainer}>
          <textarea
            className={styles.input}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={() => ({})}
            ref={inputRef}
            placeholder="Ask anything..."
          />
          <button
            data-testid="chat-view-button"
            ref={buttonRef}
            className={styles.sendChatButton}
            type="submit"
            onClick={() => ({})}
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
