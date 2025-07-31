import { describe, expect, it } from 'vitest';
import { z, ZodSchema } from 'zod';
import { zodSchemaToMessageParams } from './zod';

describe('zodSchemaToMessageParams', () => {
  it('should convert a simple object schema with string and number fields', () => {
    const schema = z.object({
      name: z.string().describe('User name'),
      age: z.number().describe('User age'),
    });

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([
      {
        name: 'name',
        type: 'string',
        description: 'User name',
        required: true,
      },
      {
        name: 'age',
        type: 'number',
        description: 'User age',
        required: true,
      },
    ]);
  });

  it('should handle optional fields correctly', () => {
    const schema = z.object({
      required: z.string().describe('Required field'),
      optional: z.string().optional().describe('Optional field'),
      withDefault: z.string().default('default').describe('Field with default'),
    });

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([
      {
        name: 'required',
        type: 'string',
        description: 'Required field',
        required: true,
      },
      {
        name: 'optional',
        type: 'string',
        description: 'Optional field',
        required: false,
      },
      {
        name: 'withDefault',
        type: 'string',
        description: 'Field with default',
        required: false,
      },
    ]);
  });

  it('should handle boolean fields', () => {
    const schema = z.object({
      isActive: z.boolean().describe('Whether the user is active'),
    });

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([
      {
        name: 'isActive',
        type: 'boolean',
        description: 'Whether the user is active',
        required: true,
      },
    ]);
  });

  it('should handle enum fields', () => {
    const schema = z.object({
      status: z.enum(['active', 'inactive', 'pending']).describe('User status'),
    });

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([
      {
        name: 'status',
        type: 'string',
        description: 'User status',
        required: true,
        enum: ['active', 'inactive', 'pending'],
      },
    ]);
  });

  it('should handle array fields', () => {
    const schema = z.object({
      tags: z.array(z.string()).describe('User tags'),
    });

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([
      {
        name: 'tags',
        type: 'array',
        description: 'User tags',
        required: true,
      },
    ]);
  });

  it('should handle complex nested schemas', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().describe('User name'),
        email: z.string().optional().describe('User email'),
      }),
      settings: z.object({
        notifications: z
          .boolean()
          .default(true)
          .describe('Enable notifications'),
        theme: z.enum(['light', 'dark']).describe('Theme preference'),
      }),
    });

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([
      {
        name: 'user.name',
        type: 'string',
        description: 'User name',
        required: true,
      },
      {
        name: 'user.email',
        type: 'string',
        description: 'User email',
        required: false,
      },
      {
        name: 'settings.notifications',
        type: 'boolean',
        description: 'Enable notifications',
        required: false,
      },
      {
        name: 'settings.theme',
        type: 'string',
        description: 'Theme preference',
        required: true,
        enum: ['light', 'dark'],
      },
    ]);
  });

  it('should return empty array for non-object schemas', () => {
    const stringSchema = z.string();
    const numberSchema = z.number();
    const booleanSchema = z.boolean();

    expect(zodSchemaToMessageParams(stringSchema)).toEqual([]);
    expect(zodSchemaToMessageParams(numberSchema)).toEqual([]);
    expect(zodSchemaToMessageParams(booleanSchema)).toEqual([]);
  });

  it('should handle empty object schema', () => {
    const schema = z.object({});

    const result = zodSchemaToMessageParams(schema);

    expect(result).toEqual([]);
  });

  it('should return empty array for unsupported schema types', () => {
    // Create a mock schema that doesn't match any of the supported types
    const unsupportedSchema = {
      description: 'test',
      shape: {},
    } as unknown as ZodSchema;

    expect(zodSchemaToMessageParams(unsupportedSchema)).toEqual([]);
  });
});
