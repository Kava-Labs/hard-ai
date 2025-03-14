import styles from './App.module.css';
import { LandingContent } from './LandingContent';

export const App = () => {
  return (
    <div className={styles.landingContent}>
      <LandingContent />
    </div>
  );
};
