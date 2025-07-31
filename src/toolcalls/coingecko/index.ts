/**
 * CoinGecko Tools Module
 *
 * This module provides a comprehensive set of CoinGecko API tools
 * that can be used by the AI assistant to access cryptocurrency price data
 * and market information.
 *
 * Key Features:
 * - Search for cryptocurrencies by name or symbol
 * - Get current prices for native cryptocurrencies (Bitcoin, Ethereum, etc.)
 * - Get current prices for tokens by contract address (ERC20s, BEP20s, etc.)
 * - Comprehensive error handling and validation
 * - No wallet connection required (read-only operations)
 *
 * Architecture:
 * - Uses CoinGecko API for price data
 * - Implements ChainToolCallOperation interface for integration
 * - Provides proper error handling and validation
 * - Supports dynamic tool registration/deregistration
 */

// Export core types and utilities
export * from './client';

// Export all tool classes
export * from './tools';
