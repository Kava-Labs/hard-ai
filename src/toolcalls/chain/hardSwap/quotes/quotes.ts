import { QUOTER_V2_ABI } from './quoterV2';
import { ethers } from 'ethers';

import { QUOTER_V2_CONTACT_ADDRESS } from '../contracts';
import { ERC2O_ABI } from '../../abi';

const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');

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
  tokenInAmount: string, // human-readable string like "1.0",
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
    ERC2O_ABI,
    provider,
  );
  const token1 = new ethers.Contract(
    tokenOutContractAddress,
    ERC2O_ABI,
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

export type QuoteExactOutputSingleResults = {
  amountIn: bigint;
  formattedAmountIn: string;
  formattedGasEstimate: string;
  gasEstimate: bigint;
  initializedTicksCrossed: bigint;
  sqrtPriceX96After: bigint;
};

export async function getQuoteExactOutputSingle(
  tokenInContractAddress: string,
  tokenOutContractAddress: string,
  tokenOutAmount: string, // human-readable string like "1.0"
): Promise<QuoteExactOutputSingleResults> {
  if (
    tokenInContractAddress.toLowerCase() ===
    tokenOutContractAddress.toLowerCase()
  ) {
    throw new Error('tokenIn must be different from tokenOut');
  }

  const iface = new ethers.Interface(QUOTER_V2_ABI);

  const tokenIn = new ethers.Contract(
    tokenInContractAddress,
    ERC2O_ABI,
    provider,
  );
  const tokenOut = new ethers.Contract(
    tokenOutContractAddress,
    ERC2O_ABI,
    provider,
  );

  const [dec0, dec1] = await Promise.all([
    tokenIn.decimals(),
    tokenOut.decimals(),
  ]);

  const amountOutParsed = ethers.parseUnits(tokenOutAmount, dec1);

  const data = iface.encodeFunctionData('quoteExactOutputSingle', [
    {
      tokenIn: tokenInContractAddress,
      tokenOut: tokenOutContractAddress,
      amount: amountOutParsed,
      fee: 0n,
      sqrtPriceLimitX96: 0n,
    },
  ]);

  const result = await provider.call({
    to: QUOTER_V2_CONTACT_ADDRESS,
    data,
  });

  const [amountIn, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
    iface.decodeFunctionResult('quoteExactOutputSingle', result);

  const feeData = await provider.getFeeData();

  return {
    amountIn,
    gasEstimate,
    sqrtPriceX96After,
    initializedTicksCrossed,
    formattedAmountIn: ethers.formatUnits(amountIn, dec0),
    formattedGasEstimate: ethers.formatUnits(
      gasEstimate * (feeData.gasPrice ?? 1_000_000_000n),
      18,
    ),
  };
}
