import React, { useState } from 'react';
import { useChat } from './useChat';
import { EIP6963ProviderDetail } from './stores/walletStore';
import ConnectWalletButton from './ConnectWalletButton';

const WalletConnection: React.FC = () => {
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectClick = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Refresh providers before attempting connection
      refreshProviders();

      const result = await connectWallet(); // Default to kava chain

      // If multiple providers are available, show the provider selection modal
      if (result && 'multipleProviders' in result) {
        setShowProviderModal(true);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleProviderSelect = async (provider: EIP6963ProviderDetail) => {
    setShowProviderModal(false);
    setIsConnecting(true);
    setError(null);

    try {
      await connectEIP6963Provider(provider.info.uuid, '2222');
    } catch (err) {
      setError(
        `Failed to connect to ${provider.info.name}: ${(err as Error).message}`,
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  // Format wallet address for display (0x1234...5678)
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connection">
      <ConnectWalletButton
        walletAddress={walletAddress}
        connectWallet={handleConnectClick}
        disconnectWallet={handleDisconnect}
      />
      {/*)}*/}

      {/* Provider Selection Modal */}
      {showProviderModal && (
        <div className="provider-modal-backdrop">
          <div className="provider-modal">
            <div className="modal-header">
              <h3>Select a Wallet</h3>
              <button
                className="close-button"
                onClick={() => setShowProviderModal(false)}
              >
                ×
              </button>
            </div>

            <div className="providers-list">
              {availableProviders.length === 0 ? (
                <div className="no-providers">
                  No EIP-6963 compatible wallets found.
                </div>
              ) : (
                availableProviders.map((provider) => (
                  <div
                    key={provider.info.uuid}
                    className="provider-item"
                    onClick={() => handleProviderSelect(provider)}
                  >
                    {provider.info.icon && (
                      <img
                        src={provider.info.icon}
                        alt={`${provider.info.name} icon`}
                        className="provider-icon"
                      />
                    )}
                    <span className="provider-name">{provider.info.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
