import { ERC2O_ABI } from '../../abi';
import { ethers } from 'ethers';
import { SWAP_ROUTER_CONTRACT_ADDRESS } from '../contracts';
import { SWAP_ROUTER_ABI } from '../../abi';
import { getQuoteExactInputSingle } from '../quotes';

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
  // const tx = await router.exactInputSingle(swapParams, {value: amountInParsed});
  const tx = await router.exactInputSingle(swapParams);

  console.log(
    `⏳ Swapping ${amountIn} ${tokenInContract} for ${tokenOutContractAddress}... TX: ${tx.hash}`,
  );
  const receipt = await tx.wait();
  console.log(`✅ Swap confirmed in block ${receipt.blockNumber}`);
  return receipt;
}
