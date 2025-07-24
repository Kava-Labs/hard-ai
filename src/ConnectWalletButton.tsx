import React from 'react';
import styles from './ConnectWalletButton.module.css';
import { formatWalletAddress } from './utils/helpers';
import WalletModal from './WalletModal';
import { useWalletState } from './stores/walletStore/useWalletState';

const ConnectWalletButton = () => {
  const {
    walletAddress,
    walletProviderInfo,
    availableProviders,
    refreshProviders,
    disconnectWallet,
  } = useWalletState();
  const { icon, name: walletName } = walletProviderInfo || {};
  const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const displayedButtonText = walletAddress
    ? formatWalletAddress(walletAddress)
    : 'Connect Wallet';

  const copyAddressToClipboard = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setIsDropdownOpen(false);
  };

  const onDisconnectClick = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
  };

  const onSwitchWalletClick = () => {
    setIsWalletModalOpen(true);
    setIsDropdownOpen(false);
  };

  const onButtonClick = () => {
    if (!walletAddress) {
      refreshProviders();
      setIsWalletModalOpen(true);
    }
  };

  const showWalletIcon = icon && walletAddress;

  return (
    <div
      className={styles.walletButtonContainer}
      onMouseEnter={() => walletAddress && setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <button onClick={onButtonClick} className={styles.walletButton}>
        {showWalletIcon && (
          <img
            src={icon}
            alt={`${walletName}-icon`}
            className={styles.providerIcon}
          />
        )}
        <span>{displayedButtonText}</span>
      </button>

      {isDropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownItem} onClick={copyAddressToClipboard}>
            Copy Address
          </div>
          {availableProviders.length > 1 && (
            <div className={styles.dropdownItem} onClick={onSwitchWalletClick}>
              Switch Wallet
            </div>
          )}
          <div className={styles.dropdownItem} onClick={onDisconnectClick}>
            Disconnect
          </div>
        </div>
      )}

      {isWalletModalOpen && (
        <WalletModal onClose={() => setIsWalletModalOpen(false)} />
      )}
    </div>
  );
};

export default ConnectWalletButton;
