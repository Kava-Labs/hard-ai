import { ConversationHistory } from '../types';

export const mockConversationHistory: Record<string, ConversationHistory> = {
  'conv-2025-03-15-001': {
    id: 'conv-2025-03-15-001',
    model: 'gpt-4-turbo',
    title: 'Project Planning Discussion',
    conversation: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.',
      },
      {
        role: 'user',
        content:
          'Can you help me plan a new web application project? I want to build a task management system.',
      },
    ],
    lastSaved: Date.now(),
    tokensRemaining: 6453,
  },
  'conv-2025-03-16-002': {
    id: 'conv-2025-03-16-002',
    model: 'claude-3-opus',
    title: 'Recipe Ideas for Dinner Party',
    conversation: [
      {
        role: 'system',
        content: 'You are Claude, a helpful AI assistant created by Anthropic.',
      },
      {
        role: 'user',
        content:
          "I'm hosting a dinner party this weekend and need some vegetarian main course ideas that will impress my guests.",
      },
    ],
    lastSaved: Date.now(),
    tokensRemaining: 4821,
  },
  'conv-2025-03-17-003': {
    id: 'conv-2025-03-17-003',
    model: 'gpt-3.5-turbo',
    title: 'Help with Data Analysis',
    conversation: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.',
      },
      {
        role: 'user',
        content:
          "I have a CSV file with sales data for the past year. I need to analyze it to find trends. What's the best way to do this with Python?",
      },
    ],
    lastSaved: Date.now() - 100000000,
    tokensRemaining: 7632,
  },
  'conv-2025-03-18-004': {
    id: 'conv-2025-03-18-004',
    model: 'gpt-3.5-turbo',
    title: 'Help with party planning',
    conversation: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.',
      },
      {
        role: 'user',
        content:
          'I need some ideas for a birthday party for my 10-year-old. What themes and activities would be appropriate?',
      },
    ],
    lastSaved: Date.now() - 1000000000,
    tokensRemaining: 7632,
  },
  'conv-2025-03-19-005': {
    id: 'conv-2025-03-19-005',
    model: 'claude-3-opus',
    title: 'Tokenomics Discussion',
    conversation: [
      {
        role: 'system',
        content: 'You are Claude, a helpful AI assistant created by Anthropic.',
      },
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
    ],
    lastSaved: Date.now() - 50000000,
    tokensRemaining: 5432,
  },
};
