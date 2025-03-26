import styles from './DisplayCards.module.css';
import { useEffect } from 'react';
import { InProgressComponentProps } from '../../types/chain';

export const InProgressTxDisplay = ({
  onRendered,
  isOperationValidated,
}: InProgressComponentProps) => {
  if (!isOperationValidated) {
    return null;
  }

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered, isOperationValidated]);

  return (
    <div
      data-testid="in-progress-tx-display"
      className={styles.inprogressContainer}
    >
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Status</h3>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${styles.inProgress}`}></div>
            <p className={`${styles.statusText} ${styles.inProgress}`}>
              Transaction in Progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
