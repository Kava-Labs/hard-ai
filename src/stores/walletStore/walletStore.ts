import {
  ChainType,
  EIP712SignerParams,
  ChainNames,
  chainRegistry,
} from '../../toolcalls/chain';

type Listener = () => void;

export enum WalletProvider {
  EIP6963 = 'EIP6963',
  NONE = 'NONE',
}

export enum SignatureTypes {
  EIP712 = 'EIP712',
  EVM = 'EVM',
}

export type SignOpts = {
  chainId: string;
  signatureType: SignatureTypes;
  payload: EVMRequestPayload | EIP712SignerParams;
};

interface EVMTransactionRequest {
  from: string;
  to: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  data?: string;
}

interface EVMRequestPayload {
  method: string;
  params?: Array<EVMTransactionRequest>;
}

export interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void,
  ) => void;
  send?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void,
  ) => void;
  request: (request: {
    method: string;
    params?: Array<unknown>;
  }) => Promise<unknown>;
  on?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  off?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  //  Some providers use removeListener instead of off
  removeListener?: (
    eventName: string,
    listener: (...args: unknown[]) => void,
  ) => void;
}

export type WalletConnection = {
  walletAddress: string;
  walletChainId: string;
  walletProvider: WalletProvider;
  walletType: string;
  isWalletConnected: boolean;
  provider?: EIP1193Provider;
  rdns?: string;
};

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

export class WalletStore {
  private currentValue: WalletConnection = {
    walletAddress: '',
    walletChainId: '',
    walletProvider: WalletProvider.NONE,
    walletType: '',
    isWalletConnected: false,
  };
  private listeners: Set<Listener> = new Set();
  private providers: Map<string, EIP6963ProviderDetail> = new Map();

  constructor() {
    this.setupEIP6963Listeners();
    this.setupChangeListeners();
  }

  private setupEIP6963Listeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('eip6963:announceProvider', (event: Event) => {
      const providerEvent = event as EIP6963AnnounceProviderEvent;
      this.providers.set(providerEvent.detail.info.uuid, providerEvent.detail);
    });

    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }

  private setupChangeListeners() {
    const onChainChange = async () => {
      await this.refreshCurrentConnection();
    };

    const onAccountChange = async () => {
      await this.refreshCurrentConnection();
    };

    this.subscribe(() => {
      const connection: WalletConnection = this.getSnapshot();

      if (connection.provider) {
        try {
          if (connection.provider.off) {
            connection.provider.off('chainChanged', onChainChange);
            connection.provider.off('accountsChanged', onAccountChange);
            connection.provider.off('disconnect', onAccountChange);
          }
        } catch (e) {
          console.warn('Failed to remove listeners', e);
        }
      }

      if (
        connection.isWalletConnected &&
        connection.provider &&
        connection.provider.on
      ) {
        try {
          connection.provider.on('chainChanged', onChainChange);
          connection.provider.on('accountsChanged', onAccountChange);
          connection.provider.on('disconnect', onAccountChange);
        } catch (e) {
          console.warn('Failed to add listeners', e);
        }
      }
    });
  }

  public getProviders(): EIP6963ProviderDetail[] {
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return Array.from(this.providers.values());
  }

  public async connectWallet(opts: {
    chainId?: string;
    walletProvider: WalletProvider;
    providerId?: string;
  }) {
    switch (opts.walletProvider) {
      case WalletProvider.EIP6963: {
        if (opts.providerId) {
          await this.connectEIP6963Provider(opts.providerId);
        }
        break;
      }
      case WalletProvider.NONE: {
        this.disconnectWallet(); // disconnect when passed WalletProvider.NONE
        break;
      }
      default:
        throw new Error(`Unknown wallet provider: ${opts.walletProvider}`);
    }
  }

  public async switchNetwork(chainName: string) {
    const chain = chainRegistry[ChainType.EVM][chainName];
    if (!chain) {
      throw new Error(`Unknown chain ${chainName}`);
    }

    const {
      chainID,
      rpcUrls,
      name,
      nativeToken,
      nativeTokenDecimals,
      blockExplorerUrls,
    } = chain;

    const connection = this.getSnapshot();
    if (!connection.isWalletConnected || !connection.provider) {
      throw new Error('No wallet connection detected');
    }

    const hexChainId = `0x${Number(chainID).toString(16)}`;

    try {
      // First attempt to switch chains
      await connection.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });

      await this.refreshCurrentConnection();
      return;
    } catch (switchError: unknown) {
      // Check if this is the "chain not added" error
      if (
        typeof switchError === 'object' &&
        switchError !== null &&
        'code' in switchError &&
        switchError.code === 4902
      ) {
        try {
          if (chainName === ChainNames.KAVA_EVM) {
            const kavaEVMParams = {
              chainId: hexChainId,
              chainName: 'Kava EVM',
              rpcUrls: Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls],
              blockExplorerUrls: blockExplorerUrls,
              nativeCurrency: {
                name: 'KAVA',
                symbol: 'KAVA',
                decimals: 18,
              },
            };

            await connection.provider.request({
              method: 'wallet_addEthereumChain',
              params: [kavaEVMParams],
            });
          } else {
            // For other chains, use the standard format
            const addChainParams = {
              chainId: hexChainId,
              chainName: name,
              rpcUrls: Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls],
              nativeCurrency: {
                name: nativeToken,
                symbol: nativeToken,
                decimals: nativeTokenDecimals || 18,
              },
            };

            await connection.provider.request({
              method: 'wallet_addEthereumChain',
              params: [addChainParams],
            });
          }

          // MetaMask typically auto-switches, but let's refresh to be sure
          await this.refreshCurrentConnection();
          return;
          //  MetaMask throws an error here, but if we've added the chain, we can ignore it
        } catch {
          await this.refreshCurrentConnection();
          const updatedConnection = this.getSnapshot();

          if (
            updatedConnection.walletChainId.toLowerCase() ===
            hexChainId.toLowerCase()
          ) {
            console.log(`Already on chain ${chainName} despite error`);
            return;
          }

          //  If we get here, it's a genuine failure
          throw new Error(`Failed to add chain: ${chainName}`);
        }
      } else {
        throw new Error(`Failed to switch to chain: ${chainName}`);
      }
    }
  }
  public disconnectWallet() {
    this.currentValue = {
      walletAddress: '',
      walletChainId: '',
      walletProvider: WalletProvider.NONE,
      walletType: '',
      isWalletConnected: false,
      provider: undefined,
      rdns: undefined,
    };
    this.emitChange();
  }

  public async sign(opts: SignOpts) {
    const connection = this.getSnapshot();

    if (!connection.isWalletConnected || !connection.provider) {
      throw new Error('No wallet connection detected');
    }

    switch (opts.signatureType) {
      case SignatureTypes.EVM: {
        console.log(opts.payload);
        return connection.provider.request(opts.payload as EVMRequestPayload);
      }
      case SignatureTypes.EIP712: {
        const { eip712SignAndBroadcast } = await import(
          '../../toolcalls/chain/msgs/eip712'
        );

        return eip712SignAndBroadcast({
          ...(opts.payload as EIP712SignerParams),
        });
      }
      default:
        throw new Error(`Unsupported signature type: ${opts.signatureType}`);
    }
  }

  public getSnapshot = (): WalletConnection => {
    return this.currentValue;
  };

  public subscribe = (callback: Listener): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  private async connectEIP6963Provider(providerId: string) {
    const providerDetail = this.providers.get(providerId);

    if (!providerDetail) {
      console.error(`Provider with UUID ${providerId} not found`);
      throw new Error(`Provider with UUID ${providerId} not found`);
    }

    try {
      const accountsResponse = await providerDetail.provider.request({
        method: 'eth_requestAccounts',
      });

      const accounts = accountsResponse as string[];

      if (Array.isArray(accounts) && accounts.length) {
        const chainIdResponse = await providerDetail.provider.request({
          method: 'eth_chainId',
        });

        const chainId = chainIdResponse as string;

        const {
          provider,
          info: { rdns, name },
        } = providerDetail;

        this.currentValue = {
          walletAddress: accounts[0],
          walletChainId: chainId,
          walletProvider: WalletProvider.EIP6963,
          walletType: name,
          isWalletConnected: true,
          provider,
          rdns,
        };
        this.emitChange();
      } else {
        throw new Error('No accounts returned from provider');
      }
    } catch (error) {
      console.error('Failed to connect EIP-6963 provider:', error);
      throw error;
    }
  }

  private async refreshCurrentConnection() {
    const connection = this.getSnapshot();

    if (!connection.isWalletConnected || !connection.provider) {
      return;
    }

    try {
      const accountsResponse = await connection.provider.request({
        method: 'eth_accounts',
      });

      const accounts = accountsResponse as string[];
      const chainIdResponse = await connection.provider.request({
        method: 'eth_chainId',
      });

      const chainId = chainIdResponse as string;

      if (Array.isArray(accounts) && accounts.length) {
        //  Update only if something changed
        if (
          connection.walletAddress !== accounts[0] ||
          connection.walletChainId !== chainId
        ) {
          this.currentValue = {
            ...connection,
            walletAddress: accounts[0],
            walletChainId: chainId,
          };
          this.emitChange();
        }
      } else {
        //  If no accounts, disconnect
        this.disconnectWallet();
      }
    } catch (error) {
      console.error('Failed to refresh connection:', error);
      this.disconnectWallet();
    }
  }

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const walletStore = new WalletStore();
