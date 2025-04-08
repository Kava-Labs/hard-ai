import { erc20ABI } from '../erc20ABI';
import {
  HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
  HARD_SWAP_FACTORY_ABI,
  HARD_SWAP_POOL_ABI,
} from './hardSwapFactory';
import { QUOTER_V2_ABI, QUOTER_V2_CONTACT_ADDRESS } from './quoterV2';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');

export const getPool = async (
  tokenAContract: string,
  tokenBContract: string,
  fee: number,
) => {
  const factory = new ethers.Contract(
    HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
    HARD_SWAP_FACTORY_ABI,
    provider,
  );

  return factory.getPool(tokenAContract, tokenBContract, fee);
};

export async function getPoolTVL(poolAddress: string): Promise<number> {
  const pool = new ethers.Contract(poolAddress, HARD_SWAP_POOL_ABI, provider);

  const [token0Addr, token1Addr] = await Promise.all([
    pool.token0(),
    pool.token1(),
  ]);

  const token0 = new ethers.Contract(token0Addr, erc20ABI, provider);
  const token1 = new ethers.Contract(token1Addr, erc20ABI, provider);

  const [dec0, dec1] = await Promise.all([
    token0.decimals(),
    token1.decimals(),
  ]);

  const [bal0, bal1] = await Promise.all([
    token0.balanceOf(poolAddress),
    token1.balanceOf(poolAddress),
  ]);

  const token0Amount = Number(ethers.formatUnits(bal0, dec0));
  const token1Amount = Number(ethers.formatUnits(bal1, dec1));

  console.log(token0Addr, token1Addr);

  const [token0PriceUSD, token1PriceUSD] = await Promise.all([
    getTokenUSDPrice(token0Addr, dec0),
    getTokenUSDPrice(token1Addr, dec1),
  ]);

  const tvl = token0Amount * token0PriceUSD + token1Amount * token1PriceUSD;
  console.log(`\n✅ TVL for pool ${poolAddress}`);
  console.log(`Token0: ${token0Amount} @ $${token0PriceUSD}`);
  console.log(`Token1: ${token1Amount} @ $${token1PriceUSD}`);
  console.log(`💰 TVL: $${tvl.toFixed(2)}\n`);

  return tvl;
}

export async function getTokenUSDPrice(
  tokenAddress: string,
  decimals: number,
): Promise<number> {
  const USDT_STABLE_COIN_CONTRACT =
    '0x919C1c267BC06a7039e03fcc2eF738525769109c';
  if (tokenAddress === USDT_STABLE_COIN_CONTRACT) return 1;
  const iface = new ethers.Interface(QUOTER_V2_ABI);

  const data = iface.encodeFunctionData('quoteExactInputSingle', [
    {
      tokenIn: tokenAddress,
      tokenOut: USDT_STABLE_COIN_CONTRACT,
      amountIn: ethers.parseUnits('1', decimals),
      fee: 0n,
      sqrtPriceLimitX96: 0n,
    },
  ]);

  const result = await provider.call({
    to: QUOTER_V2_CONTACT_ADDRESS,
    data: data,
  });

  const [amountOut] = iface.decodeFunctionResult(
    'quoteExactInputSingle',
    result,
  );

  return Number(ethers.formatUnits(amountOut, 6));
}

export async function getQuoteExactInputSingle(
  tokenIn: string,
  tokenOut: string,
  tokenInAmount: string, // human-readable string like "1.0"
): Promise<{ amountOut: string; gasEstimate: string }> {
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
    throw new Error('tokenIn must be different than tokenOut');
  }

  const iface = new ethers.Interface(QUOTER_V2_ABI);

  const token0 = new ethers.Contract(tokenIn, erc20ABI, provider);
  const token1 = new ethers.Contract(tokenOut, erc20ABI, provider);

  const dec0 = await token0.decimals();
  const dec1 = await token1.decimals();

  const data = iface.encodeFunctionData('quoteExactInputSingle', [
    {
      tokenIn,
      tokenOut,
      amountIn: ethers.parseUnits(tokenInAmount, dec0),
      fee: 0n,
      sqrtPriceLimitX96: 0n,
    },
  ]);

  const result = await provider.call({
    to: QUOTER_V2_CONTACT_ADDRESS,
    data,
  });

  const decoded = iface.decodeFunctionResult('quoteExactInputSingle', result);
  // console.log(decoded);
  const [amountOut, , , gasEstimate] = decoded;

  return {
    amountOut: ethers.formatUnits(amountOut, dec1),
    gasEstimate: ethers.formatUnits(gasEstimate, 18),
  };
}

// export const discoverPools = async () => {

//   const factory = new ethers.Contract(
//     HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
//     HARD_SWAP_FACTORY_ABI,
//     provider,
//   );

//   const filter = factory.filters.PoolCreated();
//   const latestBlock = 14589418;
//   const BATCH_SIZE = 1000;

//   console.log(`Starting scan from block ${latestBlock}...`);

//   const iface = new ethers.Interface(HARD_SWAP_FACTORY_ABI);

//   for (let endBlock = latestBlock; endBlock > 0; endBlock -= BATCH_SIZE) {
//     const startBlock = Math.max(endBlock - BATCH_SIZE + 1, 0);

//     try {
//       const events = await factory.queryFilter(filter, startBlock, endBlock);
//       console.log(
//         `Fetched ${events.length} events from blocks ${startBlock} to ${endBlock}`,
//       );
//       if (events.length) console.log(events);
//       if (events.length) {
//         for (const log of events) {
//           const parsed = iface.parseLog(log);
//           console.log(parsed);
//         }
//       }
//     } catch (err) {
//       console.error(
//         `Error fetching logs between blocks ${startBlock}-${endBlock}:`,
//         err,
//       );
//     }
//   }
// };
