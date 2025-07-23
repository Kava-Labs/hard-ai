import { useState } from 'react';
import styles from './ConnectWalletButton.module.css';
import { formatWalletAddress } from './utils/helpers';
import WalletModal from './WalletModal';

interface ConnectWalletButtonProps {
  walletAddress: string;
  handleConnectClick: () => void;
  disconnectWallet: () => void;
  icon?: string;
  walletName?: string;
  showSwitchWallet: boolean;
}

const ConnectWalletButton = ({
  walletAddress,
  handleConnectClick,
  disconnectWallet,
  icon,
  walletName,
  showSwitchWallet,
}: ConnectWalletButtonProps) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    handleConnectClick();
    setIsDropdownOpen(false);
  };

  const onConnectClick = () => {
    if (!walletAddress) {
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
      <button onClick={onConnectClick} className={styles.walletButton}>
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
          {showSwitchWallet && (
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
