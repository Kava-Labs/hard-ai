import React, { useEffect, useRef } from 'react';
import { EIP6963ProviderDetail } from './stores/walletStore';
import styles from './WalletModal.module.css';
import { ButtonIcon } from 'lib-kava-ai';
import { X } from 'lucide-react';
import metamaskLogo from './assets/MetaMask-icon-fox.svg';
import hotWalletLogo from './assets/HOT Wallet Short.svg';

interface WalletModalProps {
  onClose: () => void;
  availableProviders: EIP6963ProviderDetail[];
  onSelectProvider: (provider: EIP6963ProviderDetail) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({
  onClose,
  availableProviders,
  onSelectProvider,
}) => {
  const hasProviders = availableProviders.length > 0;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className={styles.providerModalBackdrop}>
      <div className={styles.providerModal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3>{hasProviders ? 'Select a Wallet' : 'Get a Wallet'}</h3>
          <ButtonIcon
            icon={X}
            aria-label={'Close wallet connect'}
            onClick={onClose}
          />
        </div>

        <div className={styles.providersList}>
          {hasProviders ? (
            availableProviders.map((provider) => (
              <div
                key={provider.info.uuid}
                className={styles.walletOption}
                onClick={() => onSelectProvider(provider)}
              >
                {provider.info.icon && (
                  <div className={styles.walletOptionIcon}>
                    <img
                      src={provider.info.icon}
                      alt={`${provider.info.name} icon`}
                    />
                  </div>
                )}
                <div className={styles.walletName}>{provider.info.name}</div>
              </div>
            ))
          ) : (
            <div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.walletLink}
              >
                <div className={styles.walletOption}>
                  <div className={styles.walletOptionIcon}>
                    <img src={metamaskLogo} alt="MetaMask logo" />
                  </div>
                  <div className={styles.walletName}>MetaMask</div>
                  <div className={styles.getButton}>Get</div>
                </div>
              </a>
              <a
                href="https://hot-labs.org/extension/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.walletLink}
              >
                <div className={styles.walletOption}>
                  <div className={styles.walletOptionIcon}>
                    <img src={hotWalletLogo} alt="HotWallet logo" />
                  </div>
                  <div className={styles.walletName}>HOT Wallet</div>
                  <div className={styles.getButton}>Get</div>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
