import React from 'react';
import { EIP6963ProviderDetail } from './stores/walletStore';
import styles from './WalletConnection.module.css';
import { ButtonIcon } from 'lib-kava-ai';
import { X } from 'lucide-react';

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
  return (
    <div className={styles.providerModalBackdrop}>
      <div className={styles.providerModal}>
        <div className={styles.modalHeader}>
          <h3>Select a Wallet</h3>
          <ButtonIcon
            icon={X}
            aria-label={'Close wallet connect'}
            onClick={onClose}
          />
        </div>

        <div className={styles.providersList}>
          {availableProviders.map((provider) => (
            <div
              key={provider.info.uuid}
              className={styles.providerItem}
              onClick={() => onSelectProvider(provider)}
            >
              {provider.info.icon && (
                <img
                  src={provider.info.icon}
                  alt={`${provider.info.name} icon`}
                  className={styles.providerIcon}
                />
              )}
              <span className={styles.providerName}>{provider.info.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
