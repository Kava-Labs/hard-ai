import React, { useState } from 'react';
import { ModalButton } from './components/Modal';
import { defaultSystemPrompt } from './toolcalls/chain/prompts';
import { Cog, Edit, Save, X, Copy, Check } from 'lucide-react';
import styles from './ChatSettings.module.css';
import { useGlobalChatState } from './components/chat/useGlobalChatState';
import { Toggle } from './Toggle';

const ChatSettingsModal: React.FC = () => {
  const {
    customSystemPrompt,
    setCustomSystemPrompt,
    enableCustomSystemPrompt,
    setEnableCustomSystemPrompt,
  } = useGlobalChatState();

  const [isEditing, setIsEditing] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(customSystemPrompt);
  const [didCopy, setDidCopy] = useState(false);

  const handleEdit = () => {
    setEditingPrompt(customSystemPrompt);
    setIsEditing(true);
  };

  const handleSave = () => {
    setCustomSystemPrompt(editingPrompt);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingPrompt(customSystemPrompt);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        enableCustomSystemPrompt ? customSystemPrompt : defaultSystemPrompt,
      );
      setDidCopy(true);
      setTimeout(() => setDidCopy(false), 2000);
    } catch (err) {
      console.error('Failed to copy default prompt:', err);
    }
  };

  const CopyButton = () => (
    <button className={styles.copyButton} onClick={handleCopy} type="button">
      {didCopy ? <Check size={16} /> : <Copy size={16} />}
      {didCopy ? 'Copied!' : 'Copy'}
    </button>
  );

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
        <div className={styles.toggleSection}>
          <Toggle
            isToggled={enableCustomSystemPrompt}
            onToggle={setEnableCustomSystemPrompt}
            label="Override default system prompt"
            size="medium"
          />
        </div>
      </div>

      {!enableCustomSystemPrompt && (
        <div className={styles.section}>
          <div className={styles.promptHeader}>
            <p>Using the default system prompt:</p>
            <CopyButton />
          </div>
          <div className={styles.promptContainer}>
            <pre className={styles.promptText}>{defaultSystemPrompt}</pre>
          </div>
        </div>
      )}

      {enableCustomSystemPrompt && (
        <div className={styles.section}>
          <div className={styles.customPromptHeader}>
            <p>Custom system prompt:</p>
            <div className={styles.promptActions}>
              {!isEditing && <CopyButton />}
              {!isEditing && (
                <button
                  className={styles.editButton}
                  onClick={handleEdit}
                  type="button"
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className={styles.promptContainer}>
            {!isEditing ? (
              <pre className={styles.promptText}>{customSystemPrompt}</pre>
            ) : (
              <>
                <textarea
                  className={styles.promptTextarea}
                  value={editingPrompt}
                  onChange={(e) => setEditingPrompt(e.target.value)}
                  placeholder="Enter your custom system prompt here..."
                  rows={15}
                />
                <div className={styles.editActions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    type="button"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    type="button"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
