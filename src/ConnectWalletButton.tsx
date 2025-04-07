import { useState } from 'react';
import styles from './ConnectWalletButton.module.css';

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

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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
        {walletAddress ? formatWalletAddress(walletAddress) : 'Connect Wallet'}
      </button>

      {isDropdownOpen && walletAddress && (
        <div className={styles.dropdown}>
          <div
            className={styles.dropdownItem}
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              setIsDropdownOpen(false);
            }}
          >
            Copy Address
          </div>
          <div className={styles.dropdownItem} onClick={disconnectWallet}>
            Disconnect
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
