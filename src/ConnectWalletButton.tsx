import { useState } from 'react';
import styles from './ConnectWalletButton.module.css';
import { formatWalletAddress } from './utils/wallet';

interface ConnectWalletButtonProps {
  walletAddress: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const ConnectWalletButton = ({
  walletAddress,
  connectWallet,
  disconnectWallet,
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

  return (
    <div
      className={styles.walletButtonContainer}
      onMouseEnter={() => walletAddress && setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <button
        onClick={walletAddress ? () => ({}) : connectWallet}
        className={styles.walletButton}
      >
        {displayedButtonText}
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
