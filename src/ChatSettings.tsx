import React from 'react';
import { ModalButton } from './components/Modal';
import { defaultSystemPrompt } from './toolcalls/chain/prompts';
import { Cog } from 'lucide-react';
import styles from './ChatSettings.module.css';

const ChatSettingsModal: React.FC = () => {
  return (
    <div className={styles.modalContent}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>System Prompt</h4>
        <p className={styles.sectionDescription}>
          This is the current system prompt that defines how KavaAI behaves and
          responds to your queries.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.promptContainer}>
          <pre className={styles.promptText}>{defaultSystemPrompt}</pre>
        </div>
      </div>
    </div>
  );
};

export const ChatSettingsButton = () => (
  <ModalButton
    className={styles.chatSettingsButton}
    modalTitle="Settings"
    modalContent={<ChatSettingsModal />}
  >
    <Cog />
  </ModalButton>
);
