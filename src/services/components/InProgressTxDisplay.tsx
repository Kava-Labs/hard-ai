import styles from './DisplayCards.module.css';
import { InProgressComponentProps } from '../chain';
import { useScrollToBottom } from '../../useScrollToBottom';

export const InProgressTxDisplay = ({
  onRendered,
  isOperationValidated,
}: InProgressComponentProps) => {
  useScrollToBottom(onRendered, isOperationValidated);

  if (!isOperationValidated) {
    return null;
  }
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
