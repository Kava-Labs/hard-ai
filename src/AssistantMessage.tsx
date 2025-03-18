import styles from './Conversation.module.css';
import { Content } from './Content';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';

interface AssistantMessageProps {
  content: string;
}

const AssistantMessage = ({ content }: AssistantMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <img
        className={styles.conversationChatIcon}
        src={hardDiamondLogo}
        alt="Hard AI logo"
      />
      <div className={styles.assistantContainer}>
        <Content role="assistant" content={content} />
      </div>
    </div>
  );
};

export default AssistantMessage;
