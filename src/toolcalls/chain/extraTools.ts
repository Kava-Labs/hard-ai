import { ERC20ConversionMessage } from '../erc20Conversion';
import { ChainToolCallOperation } from './chainToolCallOperation';

/**
 * Extra tools are chain-specific operations that are only available when connected to certain chains.
 * These tools extend the base functionality and are conditionally registered based on the current chain.
 * Using string keys prevents circular dependencies while maintaining type safety.
 */

// Define all available extra tools as a const object
export const extraTools = {
  'erc20-conversion': () => new ERC20ConversionMessage(),
} as const;

// Derive the ExtraToolKey type from the object keys
export type ExtraToolKey = keyof typeof extraTools;

// Simple function to get an extra tool by key
export const getExtraToolByKey = (
  key: ExtraToolKey,
): ChainToolCallOperation<unknown> => {
  return extraTools[key]();
};
