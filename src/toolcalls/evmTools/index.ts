/**
 * EVM Tools Module
 *
 * This module provides a comprehensive set of EVM-compatible blockchain tools
 * that can be used by the AI assistant to interact with Ethereum and EVM-compatible chains.
 *
 * Key Features:
 * - Unified interface for all EVM operations
 * - Automatic wallet detection and connection
 * - Support for multiple EVM chains (Ethereum, Polygon, BSC, Kava EVM, etc.)
 * - Token balance and information queries
 * - Contract interaction capabilities
 * - Transaction signing and broadcasting
 *
 * Architecture:
 * - Uses viem for low-level EVM operations
 * - Implements ChainToolCallOperation interface for integration
 * - Supports dynamic tool registration/deregistration based on wallet state
 * - Provides proper error handling and validation
 */

// Export core types and utilities
export * from './types';
export * from './helpers';

// Export all tool classes
export * from './tokenTools';
export * from './networkTools';
export * from './balanceAndBlockTools';
export * from './contractTools';
export * from './transactionTools';

// Export registry management functions
export * from './registry';

// Re-export the main integration functions for backward compatibility
export {
  registerEvmToolsWithRegistry,
  deregisterEvmToolsFromRegistry,
  changeChainToolCallRegistration,
} from './registry';
