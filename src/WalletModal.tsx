import React, { useEffect, useRef } from 'react';
import styles from './WalletModal.module.css';
import { ButtonIcon } from 'lib-kava-ai';
import { X } from 'lucide-react';
import { PromotedWallet, WalletProviderDetail } from './types';

interface WalletModalProps {
  onClose: () => void;
  availableProviders: WalletProviderDetail[];
  onSelectProvider: (provider: WalletProviderDetail) => void;
  promotedWallets: PromotedWallet[];
}

const WalletModal: React.FC<WalletModalProps> = ({
  onClose,
  availableProviders,
  onSelectProvider,
  promotedWallets,
}) => {
  const hasProviders = availableProviders.length > 0;
  const modalRef = useRef<HTMLDivElement>(null);

  //  If a user doesn't have one of the promoted wallets install, display it as a link
  //  so they can download if they want
  const missingPromotedWallets = promotedWallets.filter(
    (promotedWallet) =>
      !availableProviders.some((provider) =>
        provider.info.name.includes(promotedWallet.name),
      ),
  );

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
            aria-label={'Close wallet modal'}
            onClick={onClose}
          />
        </div>

        <div className={styles.providersList}>
          {hasProviders &&
            availableProviders.map((provider) => (
              <div
                key={provider.info.uuid}
                className={styles.walletOption}
                onClick={() => onSelectProvider(provider)}
              >
                <div className={styles.walletOptionIcon}>
                  <img
                    src={provider.info.icon}
                    alt={`${provider.info.name} icon`}
                  />
                </div>
                <div className={styles.walletName}>{provider.info.name}</div>
              </div>
            ))}
          {missingPromotedWallets.map((wallet) => (
            <a
              key={wallet.name}
              href={wallet.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.walletLink}
            >
              <div className={styles.walletOption}>
                <div className={styles.walletOptionIcon}>
                  <img src={wallet.logo} alt={`${wallet.name} logo`} />
                </div>
                <div className={styles.walletName}>{wallet.name}</div>
                <div className={styles.getButton}>Get</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
