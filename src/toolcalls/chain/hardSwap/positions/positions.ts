import { ethers } from 'ethers';
import { HARD_SWAP_POSITION_NFT_V1_ABI } from './hardSwapPositionsNftV1';
import { ERC2O_ABI } from '../../abi';
import { HARD_SWAP_POOL_ABI } from '../pools/hardSwapPool';
import { getPoolTokenUSDPrice } from '../../../../api/tokenPrice';
import {
  HARD_SWAP_POSITIONS_NFT_V1_CONTRACT_ADDRESS,
  HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
} from '../contracts';
import { HARD_SWAP_FACTORY_ABI } from '../../abi';

const FEE_TIERS = [0, 100, 200, 300, 400, 500, 3000, 10000];

const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');

export async function getLiquidityPositionsForAddress(userAddress: string) {
  const results = [];
  const manager = new ethers.Contract(
    HARD_SWAP_POSITIONS_NFT_V1_CONTRACT_ADDRESS,
    HARD_SWAP_POSITION_NFT_V1_ABI,
    provider,
  );

  const balance = await manager.balanceOf(userAddress);

  for (let i = 0n; i < balance; i++) {
    const tokenId = await manager.tokenOfOwnerByIndex(userAddress, i);
    const positionInfo = await getPositionValueInUSD(tokenId);

    results.push({
      ...positionInfo,
      tokenId,
    });
  }

  return results;
}

export async function getPositionValueInUSD(tokenId: bigint) {
  const positionManager = new ethers.Contract(
    HARD_SWAP_POSITIONS_NFT_V1_CONTRACT_ADDRESS,
    HARD_SWAP_POSITION_NFT_V1_ABI,
    provider,
  );
  const position = await positionManager.positions(tokenId);

  const { token0, token1, fee, tickLower, tickUpper, liquidity } = position;

  const token0Contract = new ethers.Contract(token0, ERC2O_ABI, provider);
  const token1Contract = new ethers.Contract(token1, ERC2O_ABI, provider);
  const [dec0, dec1] = await Promise.all([
    token0Contract.decimals(),
    token1Contract.decimals(),
  ]);

  const factory = new ethers.Contract(
    HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
    HARD_SWAP_FACTORY_ABI,
    provider,
  );
  const poolAddress = await factory.getPool(token0, token1, fee);

  const poolContract = new ethers.Contract(
    poolAddress,
    HARD_SWAP_POOL_ABI,
    provider,
  );
  const [slot0, poolLiquidity] = await Promise.all([
    poolContract.slot0(),
    poolContract.liquidity(),
  ]);

  const sqrtPriceX96 = slot0.sqrtPriceX96;
  const tickCurrent = slot0.tick;

  const { Token } = await import('@uniswap/sdk-core');
  const { Pool, Position } = await import('@uniswap/v3-sdk');

  // Create Uniswap SDK token instances
  const tokenA = new Token(2222, token0, Number(dec0));
  const tokenB = new Token(2222, token1, Number(dec1));

  let pos = null;

  for (const feeTier of FEE_TIERS) {
    try {
      const pool = new Pool(
        tokenA.wrapped,
        tokenB.wrapped,
        feeTier,
        sqrtPriceX96.toString(),
        poolLiquidity.toString(),
        Number(tickCurrent),
      );

      pos = new Position({
        pool,
        liquidity: liquidity.toString(),
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
      });
      break;
    } catch (err) {
      console.debug(err);
      continue;
    }
  }

  if (!pos) {
    throw new Error(`failed to find valid Positions for `);
  }

  const amount0 = parseFloat(pos.amount0.toFixed(Number(dec0)));
  const amount1 = parseFloat(pos.amount1.toFixed(Number(dec1)));

  const [price0, price1] = await Promise.all([
    getPoolTokenUSDPrice(token0),
    getPoolTokenUSDPrice(token1),
  ]);

  const tvlUsd = amount0 * price0 + amount1 * price1;

  return {
    token0,
    token1,
    amount0,
    amount1,
    price0,
    price1,
    valueUSD: tvlUsd,
  };
}
