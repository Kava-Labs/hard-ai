import styles from './LandingContent.module.css';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import hardAILogo from './assets/hardAILogo.svg';

export const LandingContent = () => {
  return (
    <div className={styles.landingContent}>
      <div className={styles.logoWrapper}>
        <img
          height={100}
          width={100}
          src={hardDiamondLogo}
          alt="Hard Diamond logo"
        />
        <img height={75} width={200} src={hardAILogo} alt="Hard AI logo" />
      </div>
    </div>
  );
};
