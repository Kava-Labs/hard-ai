import { ChatMessage, Conversation } from './Conversation';

export const ConversationContainer = () => {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: 'Hello! Can you tell me about tokenomics?',
    },
    {
      role: 'assistant',
      content:
        "Tokenomics refers to the economic model and policies that govern a cryptocurrency or token's creation, distribution, and management. It encompasses factors like token supply, allocation, utility, and incentive mechanisms. What specific aspect of tokenomics are you interested in?",
    },
    {
      role: 'user',
      content: 'Can you explain the different token distribution mechanisms?',
    },
    {
      role: 'assistant',
      content:
        'Token distribution mechanisms determine how a cryptocurrency enters circulation. Common approaches include: 1) ICOs (Initial Coin Offerings) where tokens are sold directly to investors; 2) Airdrops that distribute free tokens to existing cryptocurrency holders; 3) Mining rewards that distribute tokens to network validators; 4) Liquidity mining/yield farming that rewards users who provide liquidity to DeFi protocols; 5) Community treasuries managed by DAOs; and 6) Vesting schedules that gradually release tokens to founders/investors to prevent market flooding. The distribution approach significantly impacts token economics and long-term price stability.',
    },
    {
      role: 'user',
      content:
        "What's the difference between inflationary and deflationary tokenomics?",
    },
    {
      role: 'assistant',
      content:
        "Inflationary and deflationary tokenomics represent opposite approaches to supply management. Inflationary models continuously create new tokens over time (like Ethereum prior to EIP-1559), which can fund network security and development but may dilute token value. Deflationary models reduce token supply through mechanisms like burning (removing tokens from circulation permanently) or buybacks. Bitcoin is partially deflationary due to its fixed cap of 21 million coins and diminishing block rewards. Many modern projects implement hybrid models with controlled inflation that decreases over time or conditional burning mechanisms tied to network usage (like Ethereum's gas fee burns). The chosen model should align with the project's objectives and sustainability goals.",
    },
  ];

  return <Conversation messages={messages} />;
};
