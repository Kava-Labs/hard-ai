import styles from './LandingContent.module.css';
import hardAILogo from './assets/hardAILogo.svg';

export const LandingContent = () => {
  return (
    <div className={styles.landingContent}>
      <div className={styles.logoWrapper}>
        <img height={50} width={200} src={hardAILogo} alt="Hard AI logo" />
        <h2 className={styles.introText}>How can I help you with Web3?</h2>
      </div>
    </div>
  );
};
