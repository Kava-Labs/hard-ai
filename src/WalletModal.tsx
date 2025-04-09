import React from 'react';
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
  return (
    <div className={styles.providerModalBackdrop}>
      <div className={styles.providerModal}>
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
              <div className={styles.walletOption}>
                <div className={styles.walletOptionIcon}>
                  <img src={metamaskLogo} alt="MetaMask logo" />
                </div>
                <div className={styles.walletName}>MetaMask</div>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.getButtonLink}
                >
                  <button className={styles.getButton}>GET</button>
                </a>
              </div>
              <div className={styles.walletOption}>
                <div className={styles.walletOptionIcon}>
                  <img src={hotWalletLogo} alt="HotWallet logo" />
                </div>
                <div className={styles.walletName}>HOT Wallet</div>
                <a
                  href="https://hot-labs.org/extension/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.getButtonLink}
                >
                  <button className={styles.getButton}>GET</button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
