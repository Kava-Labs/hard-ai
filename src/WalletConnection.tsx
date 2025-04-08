import React, { useState, useEffect } from 'react';
import { useChat } from './useChat';
import { EIP6963ProviderDetail } from './stores/walletStore';
import ConnectWalletButton from './ConnectWalletButton';
import styles from './WalletConnection.module.css';
import { ButtonIcon } from 'lib-kava-ai';
import { X } from 'lucide-react';

const WalletConnection: React.FC = () => {
  //  todo - call these in App and pass as props
  const {
    walletConnection,
    walletAddress,
    connectWallet,
    connectEIP6963Provider,
    disconnectWallet,
    availableProviders,
    refreshProviders,
  } = useChat();

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<{
    icon?: string;
    name?: string;
  }>({});

  // Find the connected provider when wallet is connected
  useEffect(() => {
    if (walletConnection.isWalletConnected && walletConnection.rdns) {
      // Find the provider that matches the connected wallet's RDNS
      const provider = availableProviders.find(
        (p) => p.info.rdns === walletConnection.rdns,
      );

      if (provider) {
        setConnectedProvider({
          icon: provider.info.icon,
          name: provider.info.name,
        });
      }
    } else if (!walletConnection.isWalletConnected) {
      // Clear the connected provider when wallet is disconnected
      setConnectedProvider({});
    }
  }, [
    walletConnection.isWalletConnected,
    walletConnection.rdns,
    availableProviders,
  ]);

  const handleConnectClick = async () => {
    try {
      // Refresh providers before attempting connection
      refreshProviders();

      const result = await connectWallet(); // Default to kava chain

      // If multiple providers are available, show the provider selection modal
      if (result && 'multipleProviders' in result) {
        setShowProviderModal(true);
      }
    } catch (err) {
      console.error((err as Error).message || 'Failed to connect wallet');
    }
  };

  const handleProviderSelect = async (provider: EIP6963ProviderDetail) => {
    setShowProviderModal(false);
    try {
      await connectEIP6963Provider(provider.info.uuid, '2222');
      // Update the connected provider information
      setConnectedProvider({
        icon: provider.info.icon,
        name: provider.info.name,
      });
    } catch (err) {
      console.error(
        `Failed to connect to ${provider.info.name}: ${(err as Error).message}`,
      );
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setConnectedProvider({});
  };

  return (
    <>
      {/*todo - refactor out to app*/}
      <ConnectWalletButton
        walletAddress={walletAddress}
        connectWallet={handleConnectClick}
        disconnectWallet={handleDisconnect}
        providerIcon={connectedProvider.icon}
        providerName={connectedProvider.name}
      />

      {showProviderModal && (
        <div className={styles.providerModalBackdrop}>
          <div className={styles.providerModal}>
            <div className={styles.modalHeader}>
              <h3>Select a Wallet</h3>
              <ButtonIcon
                icon={X}
                aria-label={'Close wallet connect'}
                onClick={() => setShowProviderModal(false)}
              />
            </div>

            <div className={styles.providersList}>
              {availableProviders.map((provider) => (
                <div
                  key={provider.info.uuid}
                  className={styles.providerItem}
                  onClick={() => handleProviderSelect(provider)}
                >
                  {provider.info.icon && (
                    <img
                      src={provider.info.icon}
                      alt={`${provider.info.name} icon`}
                      className={styles.providerIcon}
                    />
                  )}
                  <span className={styles.providerName}>
                    {provider.info.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnection;
