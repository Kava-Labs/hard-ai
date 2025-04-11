import { fetchHardSwapPools } from './fetchHardSwapPools';

export async function getPoolTokenUSDPrice(
  tokenContractAddress: string,
): Promise<number> {
  const pools = await fetchHardSwapPools();
  let coinGeckoSymbol: string = '';
  for (const pool of pools) {
    if (pool.token0 === tokenContractAddress) {
      coinGeckoSymbol = pool.coinGeckoId0;
    }
    if (pool.token1 === tokenContractAddress) {
      coinGeckoSymbol = pool.coinGeckoId1;
    }
  }

  if (!coinGeckoSymbol) {
    throw new Error(
      `failed to find pool for contract address: ${tokenContractAddress}`,
    );
  }

  const res = await fetch(
    `https:api.coingecko.com/api/v3/simple/price?ids=${coinGeckoSymbol}&vs_currencies=usd`,
  );

  const priceData = await res.json();
  console.log(priceData, coinGeckoSymbol);
  if (priceData[coinGeckoSymbol]) {
    return Number(priceData[coinGeckoSymbol]['usd']);
  } else {
    throw new Error(`${coinGeckoSymbol} no longer exists`);
  }
}
