import { useState, useEffect } from 'react';
import styles from './ConnectWalletButton.module.css';

const ConnectWalletButton = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };

    checkWalletConnection();
  }, []);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const connectWallet = async () => {
    //  todo - more elegant handling
    if (!window.ethereum) {
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      setWalletAddress(accounts[0]);
      setIsConnecting(false);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.ethereum) {
        setWalletAddress('');
        setIsDropdownOpen(false);

        // @ts-expect-error: window.ethereum.on exists
        window.ethereum.on('disconnect', () => {
          setWalletAddress('');
        });

        console.log('Disconnected from MetaMask');
        return true;
      } else {
        console.error('MetaMask is not installed');
        return false;
      }
    } catch (error) {
      console.error('Error disconnecting from MetaMask:', error);
      return false;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // @ts-expect-error: window.ethereum.on exists
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress('');
        }
      });
    }

    return () => {
      if (window.ethereum) {
        // @ts-expect-error: window.ethereum.removeListener exists
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div
      className={styles.walletContainer}
      onMouseEnter={() => walletAddress && setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <button
        onClick={walletAddress ? () => ({}) : connectWallet}
        disabled={isConnecting}
        className={styles.walletButton}
      >
        {isConnecting
          ? 'Connecting...'
          : walletAddress
            ? formatAddress(walletAddress)
            : 'Connect Wallet'}
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
