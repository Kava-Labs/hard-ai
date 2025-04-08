import {
  HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
  HARD_SWAP_FACTORY_ABI,
} from './hardSwapFactory';

const poolCache = [];

export const getPool = async (
  tokenAContract: string,
  tokenBContract: string,
  fee: number,
) => {
  const ethers = await import('ethers');
  const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');

  const factory = new ethers.Contract(
    HARD_SWAP_FACTORY_CONTRACT_ADDRESS,
    HARD_SWAP_FACTORY_ABI,
    provider,
  );

  return factory.getPool(tokenAContract, tokenBContract, fee);
};



// export const discoverPools = async () => {
//   const ethers = await import('ethers');
//   const provider = new ethers.JsonRpcProvider('https://evm.kava-rpc.com');

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
