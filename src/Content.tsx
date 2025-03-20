import { memo, useEffect, useState } from 'react';
import styles from './Content.module.css';
import { sanitizeContent } from './utils/sanitize';

export interface ContentProps {
  content: string;
  role: string;
}

export const ContentComponent = ({
  content,

  role,
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
