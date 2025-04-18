import styles from './LandingContent.module.css';
import KavaAILogo from './kavaAILogo';

export const LandingContent = () => {
  return (
    <div className={styles.landingContent}>
      <div className={styles.logoWrapper}>
        <KavaAILogo height={50} width={200} />
        <h2 className={styles.introText}>How can I help you with Web3?</h2>
      </div>
    </div>
  );
};
