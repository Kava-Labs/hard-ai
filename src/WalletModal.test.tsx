import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WalletModal from './WalletModal';
import { EIP1193Provider, EIP6963ProviderDetail } from './stores/walletStore';
import { PromotedWallet } from './types';

vi.mock('lib-kava-ai', () => ({
  ButtonIcon: ({
    onClick,
    'aria-label': ariaLabel,
  }: {
    onClick: () => void;
    'aria-label': string;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel} data-testid="button-icon">
      X
    </button>
  ),
}));

const mockProvider = {} as EIP1193Provider;

const metamaskProvider: EIP6963ProviderDetail = {
  info: {
    uuid: 'metamask-1',
    name: 'MetaMask',
    icon: 'metamask-icon-url',
    rdns: 'io.metamask',
  },
  provider: mockProvider,
};

const hotWalletProvider: EIP6963ProviderDetail = {
  info: {
    uuid: 'hot-wallet-1',
    name: 'HOT Wallet',
    icon: 'hot-wallet-icon-url',
    rdns: 'org.hot-labs',
  },
  provider: mockProvider,
};

const otherWalletProvider: EIP6963ProviderDetail = {
  info: {
    uuid: 'other-wallet-1',
    name: 'Other Wallet',
    icon: 'other-wallet-icon-url',
    rdns: 'com.other-wallet',
  },
  provider: mockProvider,
};

const promotedWallets: PromotedWallet[] = [
  {
    name: 'MetaMask',
    logo: 'metamask-logo-url',
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    name: 'HOT Wallet',
    logo: 'hot-wallet-logo-url',
    downloadUrl: 'https://hot-labs.org/extension/',
  },
];

describe('WalletModal Component', () => {
  const onCloseMock = vi.fn();
  const onSelectProviderMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should display "Get a Wallet" title and promoted wallet links when no providers are available', () => {
    render(
      <WalletModal
        onClose={onCloseMock}
        availableProviders={[]}
        onSelectProvider={onSelectProviderMock}
        promotedWallets={promotedWallets}
      />,
    );

    expect(screen.getByText('Get a Wallet')).toBeInTheDocument();

    const walletLinks = screen.getAllByRole('link');
    expect(walletLinks).toHaveLength(2);

    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('HOT Wallet')).toBeInTheDocument();
    expect(screen.getAllByText('Get')).toHaveLength(2);
  });

  it('should display one selectable option and one download option', () => {
    render(
      <WalletModal
        onClose={onCloseMock}
        availableProviders={[hotWalletProvider]}
        onSelectProvider={onSelectProviderMock}
        promotedWallets={promotedWallets}
      />,
    );

    expect(screen.getByText('Select a Wallet')).toBeInTheDocument();

    expect(screen.getByText('HOT Wallet')).toBeInTheDocument();
    expect(screen.getByAltText('HOT Wallet icon')).toBeInTheDocument();

    const metamaskLink = screen.getByRole('link');
    expect(metamaskLink).toHaveAttribute(
      'href',
      'https://metamask.io/download/',
    );
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('Get')).toBeInTheDocument();

    fireEvent.click(screen.getByText('HOT Wallet'));
    expect(onSelectProviderMock).toHaveBeenCalledWith(hotWalletProvider);
  });

  it('should display other wallet as selectable provider and both promoted wallets as download options', () => {
    render(
      <WalletModal
        onClose={onCloseMock}
        availableProviders={[otherWalletProvider]}
        onSelectProvider={onSelectProviderMock}
        promotedWallets={promotedWallets}
      />,
    );

    expect(screen.getByText('Select a Wallet')).toBeInTheDocument();

    expect(screen.getByText('Other Wallet')).toBeInTheDocument();
    expect(screen.getByAltText('Other Wallet icon')).toBeInTheDocument();

    const walletLinks = screen.getAllByRole('link');
    expect(walletLinks).toHaveLength(2);

    fireEvent.click(screen.getByText('Other Wallet'));
    expect(onSelectProviderMock).toHaveBeenCalledWith(otherWalletProvider);
  });

  it('should display all available wallet providers and no download options when all promoted wallets are installed', () => {
    render(
      <WalletModal
        onClose={onCloseMock}
        availableProviders={[
          metamaskProvider,
          hotWalletProvider,
          otherWalletProvider,
        ]}
        onSelectProvider={onSelectProviderMock}
        promotedWallets={promotedWallets}
      />,
    );

    expect(screen.getByText('Select a Wallet')).toBeInTheDocument();

    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('HOT Wallet')).toBeInTheDocument();
    expect(screen.getByText('Other Wallet')).toBeInTheDocument();

    //  No outside links
    expect(screen.queryByText('Get')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('MetaMask'));
    expect(onSelectProviderMock).toHaveBeenCalledWith(metamaskProvider);

    fireEvent.click(screen.getByText('HOT Wallet'));
    expect(onSelectProviderMock).toHaveBeenCalledWith(hotWalletProvider);

    fireEvent.click(screen.getByText('Other Wallet'));
    expect(onSelectProviderMock).toHaveBeenCalledWith(otherWalletProvider);
  });

  it('should call onClose when the close button is clicked', () => {
    render(
      <WalletModal
        onClose={onCloseMock}
        availableProviders={[metamaskProvider]}
        onSelectProvider={onSelectProviderMock}
        promotedWallets={promotedWallets}
      />,
    );

    fireEvent.click(screen.getByTestId('button-icon'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking outside the modal', () => {
    render(
      <div data-testid="outside-modal">
        <WalletModal
          onClose={onCloseMock}
          availableProviders={[metamaskProvider]}
          onSelectProvider={onSelectProviderMock}
          promotedWallets={promotedWallets}
        />
      </div>,
    );

    const nonModalElement = screen.getByTestId('outside-modal');
    fireEvent.mouseDown(nonModalElement);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside the modal', () => {
    render(
      <WalletModal
        onClose={onCloseMock}
        availableProviders={[metamaskProvider]}
        onSelectProvider={onSelectProviderMock}
        promotedWallets={promotedWallets}
      />,
    );

    const modalContent = screen.getByText('Select a Wallet');
    fireEvent.mouseDown(modalContent);

    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
