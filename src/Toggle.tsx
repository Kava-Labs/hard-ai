import React from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
  isToggled: boolean;
  onToggle: (toggled: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Toggle: React.FC<ToggleProps> = ({
  isToggled,
  onToggle,
  label,
  disabled = false,
  size = 'medium',
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onToggle(!isToggled);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={styles.toggleWrapper}>
      {label && (
        <label className={styles.label} htmlFor="toggle">
          {label}
        </label>
      )}
      <button
        id="toggle"
        type="button"
        role="switch"
        aria-checked={isToggled}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        className={`${styles.toggle} ${styles[size]} ${
          isToggled ? styles.toggled : ''
        } ${disabled ? styles.disabled : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.slider} />
      </button>
    </div>
  );
};
