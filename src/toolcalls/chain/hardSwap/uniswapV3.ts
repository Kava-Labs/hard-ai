import { erc20ABI } from '../../erc20ABI';
import {
  HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
  HARD_SWAP_FACTORY_ABI,
} from './hardSwapFactory';
import { HARD_SWAP_POOL_ABI } from './hardSwapPool';
import { QUOTER_V2_ABI, QUOTER_V2_CONTACT_ADDRESS } from './quoterV2';
import { ethers } from 'ethers';
import { SWAP_ROUTER_ABI, SWAP_ROUTER_CONTRACT_ADDRESS } from './swapRouter';
import {
  HARD_SWAP_POSITION_NFT_V1_ABI,
  HARD_SWAP_POSITIONS_NFT_V1_CONTRACT_ADDRESS,
} from './hardSwapPositionsNftV1';

import { Token } from '@uniswap/sdk-core';
import { Pool, Position } from '@uniswap/v3-sdk';

const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');
const FEE_TIERS = [0, 100, 200, 300, 400, 500, 3000, 10000];

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
  tokenContractAddress: string,
  decimals: number,
): Promise<number> {
  const USDT_STABLE_COIN_CONTRACT =
    '0x919C1c267BC06a7039e03fcc2eF738525769109c';
  if (tokenContractAddress === USDT_STABLE_COIN_CONTRACT) return 1;
  const iface = new ethers.Interface(QUOTER_V2_ABI);

  const data = iface.encodeFunctionData('quoteExactInputSingle', [
    {
      tokenIn: tokenContractAddress,
      tokenOut: USDT_STABLE_COIN_CONTRACT,
      amountIn: ethers.parseUnits('1.00', decimals),
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

type QuoteExactInputSingleResults = {
  amountOut: bigint;
  formattedAmountOut: string;
  formattedGasEstimate: string;
  gasEstimate: bigint;
  initializedTicksCrossed: bigint;
  sqrtPriceX96After: bigint;
};

export async function getQuoteExactInputSingle(
  tokenInContractAddress: string,
  tokenOutContractAddress: string,
  tokenInAmount: string, // human-readable string like "1.0"
): Promise<QuoteExactInputSingleResults> {
  if (
    tokenInContractAddress.toLowerCase() ===
    tokenOutContractAddress.toLowerCase()
  ) {
    throw new Error('tokenIn must be different than tokenOut');
  }

  const iface = new ethers.Interface(QUOTER_V2_ABI);

  const token0 = new ethers.Contract(
    tokenInContractAddress,
    erc20ABI,
    provider,
  );
  const token1 = new ethers.Contract(
    tokenOutContractAddress,
    erc20ABI,
    provider,
  );

  const dec0 = await token0.decimals();
  const dec1 = await token1.decimals();

  const data = iface.encodeFunctionData('quoteExactInputSingle', [
    {
      tokenIn: tokenInContractAddress,
      tokenOut: tokenOutContractAddress,
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
  const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
    decoded;

  const feeData = await provider.getFeeData();
  return {
    amountOut,
    gasEstimate,
    sqrtPriceX96After,
    initializedTicksCrossed,
    formattedAmountOut: ethers.formatUnits(amountOut, dec1),
    formattedGasEstimate: ethers.formatUnits(
      gasEstimate * (feeData.gasPrice ?? 1_000_000_000n),
      18,
    ),
  };
}

export async function swapExactInputSingle({
  tokenInContractAddress,
  tokenOutContractAddress,
  amountIn, // e.g., "10.0"
  slippage = 0.005, // 0.5%
}: {
  tokenInContractAddress: string;
  tokenOutContractAddress: string;
  amountIn: string;
  slippage?: number;
}) {
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const signer = await browserProvider.getSigner();
  const userAddress = await signer.getAddress();

  //  Quote output
  const { amountOut } = await getQuoteExactInputSingle(
    tokenInContractAddress,
    tokenOutContractAddress,
    amountIn,
  );

  const tokenInContract = new ethers.Contract(
    tokenInContractAddress,
    erc20ABI,
    signer,
  );

  const tokenInDecimals = await tokenInContract.decimals();
  const amountInParsed = ethers.parseUnits(amountIn, tokenInDecimals);

  const SLIPPAGE_DENOM = 10_000n;
  const slippageMultiplier = BigInt(Math.floor((1 - slippage) * 10_000)); // e.g. 9950 for 0.5%

  const amountOutMinimum = (amountOut * slippageMultiplier) / SLIPPAGE_DENOM;

  // Approve if needed
  const allowance = await tokenInContract.allowance(
    userAddress,
    SWAP_ROUTER_CONTRACT_ADDRESS,
  );

  if (allowance < amountInParsed) {
    const approveTx = await tokenInContract.approve(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      amountInParsed,
    );
    console.log(`⏳ Approving ${tokenInContractAddress}...`);
    await approveTx.wait();
  }

  // Swap
  const router = new ethers.Contract(
    SWAP_ROUTER_CONTRACT_ADDRESS,
    SWAP_ROUTER_ABI,
    signer,
  );

  const swapParams = {
    tokenIn: tokenInContractAddress,
    tokenOut: tokenOutContractAddress,
    fee: 0,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 15,
    amountIn: amountInParsed,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  };

  // for kava set the value to amountInParsed and the wrapping will happen automatically
  // const tx = await router.exactInputSingle(swapParams, {value: amountInParsed});
  const tx = await router.exactInputSingle(swapParams);

  console.log(
    `⏳ Swapping ${amountIn} ${tokenInContract} for ${tokenOutContractAddress}... TX: ${tx.hash}`,
  );
  const receipt = await tx.wait();
  console.log(`✅ Swap confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

export async function getLiquidityPositionsForAddress(userAddress: string) {
  let results = [];
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

  const token0Contract = new ethers.Contract(token0, erc20ABI, provider);
  const token1Contract = new ethers.Contract(token1, erc20ABI, provider);
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

  // Create Uniswap SDK token instances
  const tokenA = new Token(2222, token0, Number(dec0));
  const tokenB = new Token(2222, token1, Number(dec1));

  let pos: Position | null = null;

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
      continue;
    }
  }

  if (!pos) {
    throw new Error(`failed to find valid Positions for `);
  }

  const amount0 = parseFloat(pos.amount0.toFixed(Number(dec0)));
  const amount1 = parseFloat(pos.amount1.toFixed(Number(dec1)));

  const [price0, price1] = await Promise.all([
    getTokenUSDPrice(token0, Number(dec0)),
    getTokenUSDPrice(token1, Number(dec1)),
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
