import styles from './Conversation.module.css';
import { Content } from './Content';
import hardAILogo from './assets/hardAILogo.svg';

const AssistantMessage = ({ content }: { content: string }) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <img
        className={styles.conversationChatIcon}
        src={hardAILogo}
        alt="Hard AI logo"
      />
      <div className={styles.assistantContainer}>
        <Content role="assistant" content={content} />
      </div>
    </div>
  );
};

export default AssistantMessage;
