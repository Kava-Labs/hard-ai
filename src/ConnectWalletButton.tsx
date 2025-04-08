import { useState } from 'react';
import styles from './ConnectWalletButton.module.css';
import { formatWalletAddress } from './utils/wallet';

interface ConnectWalletButtonProps {
  walletAddress: string;
  connectWallet: () => void;
  disconnectWallet: () => void;
  providerIcon?: string;
  providerName?: string;
}

const ConnectWalletButton = ({
  walletAddress,
  connectWallet,
  disconnectWallet,
  providerIcon,
  providerName,
}: ConnectWalletButtonProps) => {
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

  const onConnectClick = async () => {
    if (!walletAddress) {
      connectWallet();
    }
  };

  return (
    <div
      className={styles.walletButtonContainer}
      onMouseEnter={() => walletAddress && setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <button onClick={onConnectClick} className={styles.walletButton}>
        {providerIcon && walletAddress && (
          <img
            src={providerIcon}
            alt={providerName || 'Wallet provider'}
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
          <div className={styles.dropdownItem} onClick={onDisconnectClick}>
            Disconnect
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
