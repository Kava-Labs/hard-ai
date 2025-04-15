import { ERC2O_ABI } from '../../abi';
import { ethers } from 'ethers';
import { SWAP_ROUTER_CONTRACT_ADDRESS } from '../contracts';
import { SWAP_ROUTER_ABI } from '../../abi';
import { getQuoteExactInputSingle, getQuoteExactOutputSingle } from '../quotes';

export async function swapExactInputSingle({
  tokenInContractAddress,
  tokenOutContractAddress,
  amountIn, // e.g., "10.0"
  slippage = 0.005, // 0.5%
  isNative,
}: {
  tokenInContractAddress: string;
  tokenOutContractAddress: string;
  amountIn: string;
  slippage?: number;
  isNative: boolean;
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
    ERC2O_ABI,
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
  const tx = await (isNative
    ? router.exactInputSingle(swapParams, { value: amountInParsed })
    : router.exactInputSingle(swapParams));

  console.log(
    `⏳ Swapping ${amountIn} ${tokenInContract} for ${tokenOutContractAddress}... TX: ${tx.hash}`,
  );
  const receipt = await tx.wait();
  console.log(`✅ Swap confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

// swapExactInputSingle({
//   tokenInContractAddress:
//     '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b',
//   tokenOutContractAddress:
//     '0x919C1c267BC06a7039e03fcc2eF738525769109c',
//   amountIn: '1',
// });

export async function swapExactOutputSingle({
  tokenInContractAddress,
  tokenOutContractAddress,
  amountOut, // desired output, e.g., "100.0"
  slippage = 0.005, // 0.5%
  isNative,
}: {
  tokenInContractAddress: string;
  tokenOutContractAddress: string;
  amountOut: string;
  slippage?: number;
  isNative: boolean;
}) {
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const signer = await browserProvider.getSigner();
  const userAddress = await signer.getAddress();

  const [tokenInContract, tokenOutContract] = [
    new ethers.Contract(tokenInContractAddress, ERC2O_ABI, signer),
    new ethers.Contract(tokenOutContractAddress, ERC2O_ABI, signer),
  ];

  const [decIn, decOut] = await Promise.all([
    tokenInContract.decimals(),
    tokenOutContract.decimals(),
  ]);

  const amountOutParsed = ethers.parseUnits(amountOut, decOut);

  // Quote required amountIn

  const { amountIn: quotedAmountIn } = await getQuoteExactOutputSingle(
    tokenInContractAddress,
    tokenOutContractAddress,
    amountOut,
  );

  const SLIPPAGE_DENOM = 10_000n;
  const slippageMultiplier = BigInt(Math.ceil((1 + slippage) * 10_000));
  const amountInMaximum =
    (quotedAmountIn * slippageMultiplier) / SLIPPAGE_DENOM;

  // Approve if needed
  const allowance = await tokenInContract.allowance(
    userAddress,
    SWAP_ROUTER_CONTRACT_ADDRESS,
  );

  if (allowance < amountInMaximum) {
    const approveTx = await tokenInContract.approve(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      amountInMaximum,
    );
    console.log(`⏳ Approving ${tokenInContractAddress}...`);
    await approveTx.wait();
  }

  // Build and execute the swap
  const router = new ethers.Contract(
    SWAP_ROUTER_CONTRACT_ADDRESS,
    SWAP_ROUTER_ABI,
    signer,
  );

  const swapParams = {
    tokenIn: tokenInContractAddress,
    tokenOut: tokenOutContractAddress,
    fee: 0n,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 15,
    amountOut: amountOutParsed,
    amountInMaximum,
    sqrtPriceLimitX96: 0n,
  };

  // const tx = await router.exactInputSingle(swapParams, {value: amountInMaximum});
  const tx = await router.exactOutputSingle(swapParams);
  console.log(
    `⏳ Swapping up to ${ethers.formatUnits(
      amountInMaximum,
      decIn,
    )} ${tokenInContractAddress} for exactly ${amountOut} ${tokenOutContractAddress}... TX: ${tx.hash}`,
  );
  const receipt = await tx.wait();
  console.log(`✅ Swap confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

// swapExactOutputSingle({
//   tokenInContractAddress: '0x919C1c267BC06a7039e03fcc2eF738525769109c', // usdt
//   tokenOutContractAddress: '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b', // wkava
//   amountOut: '1.00', // want 1 wkava
// });
