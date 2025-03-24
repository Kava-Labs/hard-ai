import styles from './Conversation.module.css';
import { Content } from './Content';

interface AssistantMessageProps {
  content: string;
}

const AssistantMessage = ({ content }: AssistantMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        <Content role="assistant" content={content} />
      </div>
    </div>
  );
};

export default AssistantMessage;
