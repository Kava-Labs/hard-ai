import type { ERC20Record, CoinRecord } from '../toolcalls/chain';

export const getERC20Record = (
  denom: string,
  records: Record<string, ERC20Record>,
): ERC20Record | null => {
  if (records[denom]) return records[denom];
  if (records[denom.toUpperCase()]) return records[denom.toUpperCase()];

  for (const record of Object.values(records)) {
    if (record.displayName === denom) return record;
    if (record.displayName === denom.toUpperCase()) return record;
    if (record.displayName.toUpperCase() === denom.toUpperCase()) return record;
  }

  return null;
};

export const getCoinRecord = (
  denom: string,
  records: Record<string, CoinRecord>,
) => {
  if (records[denom]) return records[denom];
  if (records[denom.toUpperCase()]) return records[denom.toUpperCase()];

  for (const record of Object.values(records)) {
    if (record.displayName === denom) return record;
    if (record.displayName === denom.toUpperCase()) return record;
    if (record.displayName.toUpperCase() === denom.toUpperCase()) return record;
  }

  return null;
};

export const formatWalletAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
