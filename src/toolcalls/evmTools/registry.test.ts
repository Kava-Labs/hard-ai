import type { ChatCompletionTool } from 'openai/resources/index';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolCallRegistry } from '../chain/ToolCallRegistry';
import { registerEvmToolsWithRegistry } from './registry';

/**
 * Verifies that a tool definition matches the expected OpenAI ChatCompletionTool format
 */
function verifyToolDefinition(toolDefinition: ChatCompletionTool): void {
  // Check top-level structure
  expect(toolDefinition).toBeDefined();
  expect(typeof toolDefinition).toBe('object');
  expect(toolDefinition.type).toBe('function');

  // Check function property
  expect(toolDefinition.function).toBeDefined();
  expect(typeof toolDefinition.function).toBe('object');

  const func = toolDefinition.function as any;

  // Check required function properties
  expect(func.name).toBeDefined();
  expect(typeof func.name).toBe('string');
  expect(func.name.length).toBeGreaterThan(0);

  expect(func.description).toBeDefined();
  expect(typeof func.description).toBe('string');
  expect(func.description.length).toBeGreaterThan(0);

  // Check parameters structure
  expect(func.parameters).toBeDefined();
  expect(typeof func.parameters).toBe('object');

  const params = func.parameters as any;
  expect(params).toBeDefined();

  // Check parameters type
  expect(params.type).toBe('object');

  // Check properties
  expect(params.properties).toBeDefined();
  expect(typeof params.properties).toBe('object');

  // Check required array
  expect(params.required).toBeDefined();
  expect(Array.isArray(params.required)).toBe(true);

  // Check additional properties
  expect(params.strict).toBeDefined();
  expect(typeof params.strict).toBe('boolean');

  expect(params.additionalProperties).toBeDefined();
  expect(typeof params.additionalProperties).toBe('boolean');
}

describe('EVM Tools Registry', () => {
  let registry: ToolCallRegistry<unknown>;

  beforeEach(() => {
    registry = new ToolCallRegistry();
  });

  it('should register EVM tools and generate valid tool definitions', () => {
    // Register all EVM tools
    registerEvmToolsWithRegistry(registry);

    // Verify tools are registered
    const allOperations = registry.getAllOperations();
    expect(allOperations.length).toBeGreaterThan(0);

    // Get tool definitions
    const toolDefinitions = registry.getToolDefinitions();
    expect(toolDefinitions.length).toBeGreaterThan(0);

    // Verify each tool definition has the correct structure
    toolDefinitions.forEach((toolDefinition, index) => {
      try {
        verifyToolDefinition(toolDefinition);
      } catch (error) {
        throw new Error(
          `Tool definition at index ${index} failed validation: ${error}`,
        );
      }
    });

    // Additional verification: check that all tools have unique names
    const toolNames = toolDefinitions.map((tool) => tool.function.name);
    const uniqueNames = new Set(toolNames);
    expect(toolNames.length).toBe(uniqueNames.size);

    // Verify that all tools have the 'evm-' prefix
    toolNames.forEach((name) => {
      expect(name).toMatch(/^evm-/);
    });

    // Verify that all tools have non-empty descriptions
    toolDefinitions.forEach((tool) => {
      const func = tool.function as any;
      expect(func.description.trim()).toBeTruthy();
    });

    // Verify that all tools have valid parameter structures
    toolDefinitions.forEach((tool) => {
      const func = tool.function as any;
      const params = func.parameters;
      expect(params).toBeDefined();

      // Check that required fields are actually present in properties
      if (params.required) {
        params.required.forEach((requiredField: string) => {
          expect(params.properties[requiredField]).toBeDefined();
        });
      }

      // Check that all properties have valid structure
      if (params.properties) {
        Object.entries(params.properties).forEach(
          ([_propName, propDef]: [string, unknown]) => {
            const prop = propDef as { type: string; description: string };
            expect(prop.type).toBeDefined();
            expect(typeof prop.type).toBe('string');
            expect(
              ['string', 'number', 'boolean', 'array'].includes(prop.type),
            ).toBe(true);

            // Description should be present (even if empty)
            expect(prop.description).toBeDefined();
            expect(typeof prop.description).toBe('string');
          },
        );
      }
    });
  });
});
