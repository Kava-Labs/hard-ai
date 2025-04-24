import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EIP1193Provider, walletStore, WalletProvider } from './walletStore';
import { EIP6963ProviderDetail } from './walletStore';

interface MockProviderOptions {
  name?: string;
  uuid?: string;
  rdns?: string;
  icon?: string;
  accounts?: string[];
  chainId?: string;
}

function mockEIP6963Provider(
  options: MockProviderOptions = {},
): EIP6963ProviderDetail {
  const {
    name = 'Mock Wallet',
    uuid = 'mock-uuid',
    rdns = 'com.mock.wallet',
    icon = 'data:image/svg+xml,mock-icon',
    accounts = ['0x123456789abcdef0123456789abcdef01234567'],
    chainId = '0x8ae',
  } = options;

  const provider = {
    request: vi.fn().mockImplementation(async ({ method }) => {
      switch (method) {
        case 'eth_requestAccounts':
          return accounts;
        case 'eth_accounts':
          return accounts;
        case 'eth_chainId':
          return chainId;
        default:
          console.warn(`Unhandled method: ${method}`);
          return null;
      }
    }),
    on: vi.fn(),
    removeListener: vi.fn(),
  };

  return {
    info: { uuid, name, icon, rdns },
    provider,
  };
}

function announceProvider(providerObj: EIP6963ProviderDetail): void {
  const event = new CustomEvent('eip6963:announceProvider', {
    detail: providerObj,
  });
  window.dispatchEvent(event);
}

async function simulateAccountsChanged(
  provider: EIP1193Provider,
  newAccounts: string[],
): Promise<void> {
  const originalImpl = provider.request;
  provider.request = vi
    .fn()
    .mockImplementation(async (params: { method: string }) => {
      if (
        params.method === 'eth_accounts' ||
        params.method === 'eth_requestAccounts'
      ) {
        return newAccounts;
      }
      return originalImpl(params);
    });

  //  @ts-expect-error: provider is defined
  const mockedCalls = provider.on.mock.calls;
  const listeners = mockedCalls
    .filter((call: string) => call[0] === 'accountsChanged')
    .map((call: string) => call[1]);

  listeners.forEach((listener: (accounts: string[]) => void) =>
    listener(newAccounts),
  );
}

async function simulateChainChanged(
  provider: EIP1193Provider,
  newChainId: string,
): Promise<void> {
  const originalImpl = provider.request;
  provider.request = vi
    .fn()
    .mockImplementation(async (params: { method: string }) => {
      if (params.method === 'eth_chainId') {
        return newChainId;
      }
      return originalImpl(params);
    });

  //  @ts-expect-error: provider.on is defined
  const listeners = provider.on.mock.calls
    .filter((call: string[]) => call[0] === 'chainChanged')
    .map((call: string[]) => call[1]);

  listeners.forEach((listener: (chainId: string) => void) =>
    listener(newChainId),
  );
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    getAll: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('walletStore', () => {
  let metamask: EIP6963ProviderDetail;

  beforeEach(() => {
    walletStore.disconnectWallet();
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorageMock.clear();
    metamask = mockEIP6963Provider({
      name: 'MetaMask',
      uuid: 'metamask-uuid',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should register available providers', () => {
    const metamask = mockEIP6963Provider({
      name: 'MetaMask',
      uuid: 'metamask-uuid',
      rdns: 'io.metamask',
    });

    const coinbase = mockEIP6963Provider({
      name: 'Coinbase Wallet',
      uuid: 'coinbase-uuid',
      rdns: 'com.coinbase.wallet',
    });

    announceProvider(metamask);
    announceProvider(coinbase);

    const providers = walletStore.getProviders();

    expect(providers.length).toBe(2);
    expect(providers[0].info.name).toBe('MetaMask');
    expect(providers[1].info.name).toBe('Coinbase Wallet');
  });

  test('should connect to a selected provider', async () => {
    const metamask = mockEIP6963Provider({
      name: 'MetaMask',
      uuid: 'metamask-uuid',
      accounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
    });

    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
      chainId: '0x8ae', // Chain ID 2222
    });

    const state = walletStore.getSnapshot();
    expect(state.isWalletConnected).toBe(true);
    expect(state.walletAddress).toBe(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    );
    expect(state.rdns).toBe('com.mock.wallet');

    expect(metamask.provider.request).toHaveBeenCalledWith({
      method: 'eth_requestAccounts',
    });
  });

  test('should handle account changes from wallet', async () => {
    const metamask = mockEIP6963Provider({
      name: 'MetaMask',
      uuid: 'metamask-uuid',
      accounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
    });

    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    expect(walletStore.getSnapshot().walletAddress).toBe(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    );

    expect(metamask.provider.on).toHaveBeenCalledWith(
      'accountsChanged',
      expect.any(Function),
    );

    const newAccount = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
    await simulateAccountsChanged(metamask.provider, [newAccount]);

    await vi.advanceTimersByTimeAsync(100);

    expect(walletStore.getSnapshot().walletAddress).toBe(newAccount);
  });

  test('should handle chain changes from wallet', async () => {
    const metamask = mockEIP6963Provider({
      name: 'MetaMask',
      uuid: 'metamask-uuid',
      chainId: '0x8ae', // Chain ID 2222
    });

    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    expect(walletStore.getSnapshot().walletChainId).toBe('0x8ae');

    expect(metamask.provider.on).toHaveBeenCalledWith(
      'chainChanged',
      expect.any(Function),
    );

    const newChainId = '0x1'; // Ethereum mainnet
    await simulateChainChanged(metamask.provider, newChainId);

    await vi.advanceTimersByTimeAsync(100);

    expect(walletStore.getSnapshot().walletChainId).toBe(newChainId);
  });

  test('should disconnect wallet', async () => {
    const metamask = mockEIP6963Provider({
      name: 'MetaMask',
      uuid: 'metamask-uuid',
    });

    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    expect(walletStore.getSnapshot().isWalletConnected).toBe(true);

    walletStore.disconnectWallet();

    const state = walletStore.getSnapshot();
    expect(state.isWalletConnected).toBe(false);
    expect(state.walletAddress).toBe('');
  });

  test('should handle connection rejection', async () => {
    const rejectingProvider = mockEIP6963Provider({
      name: 'Rejecting Wallet',
      uuid: 'rejecting-wallet',
    });

    rejectingProvider.provider.request = vi
      .fn()
      .mockImplementation(({ method }) => {
        if (method === 'eth_requestAccounts') {
          return Promise.reject(new Error('User rejected the request'));
        }
        return Promise.resolve(null);
      });

    announceProvider(rejectingProvider);

    await expect(
      walletStore.connectWallet({
        walletProvider: WalletProvider.EIP6963,
        providerId: 'rejecting-wallet',
      }),
    ).rejects.toThrow('User rejected the request');

    const state = walletStore.getSnapshot();
    expect(state.isWalletConnected).toBe(false);
    expect(state.walletAddress).toBe('');
  });

  test('should handle chain switching', async () => {
    const wrongChainProvider = mockEIP6963Provider({
      name: 'Wrong Chain Wallet',
      uuid: 'wrong-chain-wallet',
      chainId: '0x1', // Ethereum mainnet
    });

    announceProvider(wrongChainProvider);

    const requestSpy = vi.spyOn(wrongChainProvider.provider, 'request');

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'wrong-chain-wallet',
      chainId: '0x8ae', // Chain ID 2222
    });

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'eth_chainId',
      }),
    );
  });
  test('should save wallet type to localStorage when connecting', async () => {
    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'walletType',
      'MetaMask',
    );
  });

  test('should clear wallet type in localStorage when disconnecting', async () => {
    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    //  Clear mock call history after connect
    localStorageMock.setItem.mockClear();

    walletStore.disconnectWallet();

    expect(localStorageMock.setItem).toHaveBeenCalledWith('walletType', '');
  });

  test('should update wallet type in localStorage when switching wallets', async () => {
    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'walletType',
      'MetaMask',
    );

    localStorageMock.setItem.mockClear();

    //  Connect to a different wallet
    const keplr = mockEIP6963Provider({
      name: 'Keplr',
      uuid: 'keplr-uuid',
      rdns: 'io.keplr',
    });

    announceProvider(keplr);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'keplr-uuid',
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'walletType',
      'Keplr',
    );
  });

  test('should not update wallet type in localStorage when only accounts change', async () => {
    announceProvider(metamask);

    await walletStore.connectWallet({
      walletProvider: WalletProvider.EIP6963,
      providerId: 'metamask-uuid',
    });

    expect(localStorageMock.setItem.mock.calls.length).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'walletType',
      'MetaMask',
    );

    //  Change accounts but keep the same wallet
    await simulateAccountsChanged(metamask.provider, [
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    ]);

    await vi.advanceTimersByTimeAsync(100);

    //  setItem is not called again since it's the same wallet type
    expect(localStorageMock.setItem.mock.calls.length).toBe(1);
  });
});
