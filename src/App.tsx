import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';

export const App = () => {
  return (
    <div className={styles.chatview}>
      <div className={styles.controlsContainer}>
        <LandingContent />
        <ChatInput />
      </div>
    </div>
  );
};
