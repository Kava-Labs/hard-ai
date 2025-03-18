import { memo } from 'react';
import styles from './Content.module.css';

export interface ContentProps {
  content: string;
  role: string;
}

export const ContentComponent = ({ content, role }: ContentProps) => {
  return (
    <div data-chat-role={role}>
      <span
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export const Content = memo(ContentComponent);
