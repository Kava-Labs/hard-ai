import { ethers } from 'ethers';
import { HARD_SWAP_POOL_ABI } from './hardSwapPool';
import { HARD_SWAP_FACTORY_CONTRACT_ADDRESS } from '../contracts';
import { getPoolTokenUSDPrice } from '../../../../api/tokenPrice';
import { ERC2O_ABI, HARD_SWAP_FACTORY_ABI } from '../../abi';
const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');

export const getPool = async (
  tokenAContractAddress: string,
  tokenBContractAddress: string,
  fee: number,
) => {
  const factory = new ethers.Contract(
    HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
    HARD_SWAP_FACTORY_ABI,
    provider,
  );

  return factory.getPool(tokenAContractAddress, tokenBContractAddress, fee);
};

export async function getPoolTVL(poolAddress: string): Promise<number> {
  const pool = new ethers.Contract(poolAddress, HARD_SWAP_POOL_ABI, provider);

  const [token0Addr, token1Addr] = await Promise.all([
    pool.token0(),
    pool.token1(),
  ]);

  const token0 = new ethers.Contract(token0Addr, ERC2O_ABI, provider);
  const token1 = new ethers.Contract(token1Addr, ERC2O_ABI, provider);

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
    getPoolTokenUSDPrice(token0Addr),
    getPoolTokenUSDPrice(token1Addr),
  ]);

  const tvl = token0Amount * token0PriceUSD + token1Amount * token1PriceUSD;
  console.log(`\n✅ TVL for pool ${poolAddress}`);
  console.log(`Token0: ${token0Amount} @ $${token0PriceUSD}`);
  console.log(`Token1: ${token1Amount} @ $${token1PriceUSD}`);
  console.log(`💰 TVL: $${tvl.toFixed(2)}\n`);

  return tvl;
}
