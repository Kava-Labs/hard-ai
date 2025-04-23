import { describe, it, expect } from 'vitest';
import { formatWalletBalancesForPrompt } from './wallet';

describe('formatWalletBalancesForPrompt', () => {
  it('should return empty string for empty balances', () => {
    const result = formatWalletBalancesForPrompt([]);
    expect(result).toBe('');
  });

  it('should format wallet balances correctly!', () => {
    const mockBalances = [
      {
        chain: 'Ethereum',
        chainId: '0x1',
        accounts: [
          {
            address: '0xabc123',
            nativeToken: {
              symbol: 'ETH',
              displayBalance: '1.5',
            },
            tokens: {
              USDC: { displayBalance: '500.0' },
              DAI: { displayBalance: '0' },
            },
          },
        ],
      },
      {
        chain: 'Polygon',
        chainId: '0x89',
        accounts: [
          {
            address: '0xabc123',
            nativeToken: {
              symbol: 'MATIC',
              displayBalance: '100.0',
            },
            tokens: {
              USDT: { displayBalance: '300.0' },
            },
          },
        ],
      },
    ];

    const result = formatWalletBalancesForPrompt(mockBalances);

    expect(result).toContain('Here are your balances across all wallets:');
    expect(result).toContain('<strong>Active Account:</strong> 0xabc123');
    expect(result).toContain('Ethereum (0x1):');
    expect(result).toContain('USDC');
    expect(result).not.toContain('DAI'); // Zero balance tokens should not be displayed
    expect(result).toContain('Polygon (0x89):');
    expect(result).toContain('USDT');
  });

  it('should indicate current connected chain', () => {
    const mockBalances = [
      {
        chain: 'Ethereum',
        chainId: '0x1',
        accounts: [
          {
            address: '0xabc123',
            nativeToken: { symbol: 'ETH', displayBalance: '1.5' },
            tokens: {},
          },
        ],
      },
    ];

    const result = formatWalletBalancesForPrompt(mockBalances, '0x1');

    expect(result).toContain(
      '<strong>Currently Connected to:</strong> Ethereum (Chain ID: 1)',
    );
  });

  it('should handle error in wallet', () => {
    const mockBalances = [
      {
        chain: 'Ethereum',
        chainId: '0x1',
        accounts: [],
        error: 'RPC connection failed',
      },
    ];

    const result = formatWalletBalancesForPrompt(mockBalances);

    expect(result).toContain('Error: RPC connection failed');
  });

  it('should handle empty accounts', () => {
    const mockBalances = [
      {
        chain: 'Ethereum',
        chainId: '0x1',
        accounts: [],
      },
    ];

    const result = formatWalletBalancesForPrompt(mockBalances);

    expect(result).toContain('Ethereum (0x1):');
    expect(result).toContain('No accounts found');
  });
});
