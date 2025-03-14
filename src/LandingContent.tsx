import styles from './LandingContent.module.css';
import HardDiamond from './assets/hardDiamond.svg';
import HardAILogo from './assets/hardAILogo.svg';

export const LandingContent = () => {
  return (
    <div className={styles.logoWrapper}>
      <img height={100} width={100} src={HardDiamond} alt="Hard Diamond logo" />
      <img height={75} width={200} src={HardAILogo} alt="Hard AI logo" />
    </div>
  );
};
