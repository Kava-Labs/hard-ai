import { memo, useEffect, useState } from 'react';
import styles from './Content.module.css';
import { sanitizeContent } from './utils/sanitize';
import { useScrollToBottom } from './useScrollToBottom';

export interface ContentProps {
  content: string;
  role: string;
  onRendered?: () => void;
}

export const ContentComponent = ({
  content,
  role,
  onRendered,
}: ContentProps) => {
  const [hasError, setHasError] = useState(false);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  useEffect(() => {
    let cancel = false;

    const handleRender = async () => {
      if (content === '') {
        setSanitizedContent('');
        return;
      }

      try {
        const updatedContent = await sanitizeContent(content);

        if (!cancel) {
          setSanitizedContent(updatedContent);
        }
      } catch (error) {
        // TODO: This is noisy in tests
        console.error(error);
        if (!cancel) {
          setHasError(true);
        }
      }
    };

    handleRender();

    return () => {
      cancel = true;
    };
  }, [content]);

  useScrollToBottom(onRendered, sanitizedContent);

  if (hasError) {
    return <span>Error: Could not render content!</span>;
  }

  return (
    <div data-chat-role={role}>
      {sanitizedContent !== '' && (
        <span
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      )}
    </div>
  );
};

export const Content = memo(ContentComponent);
