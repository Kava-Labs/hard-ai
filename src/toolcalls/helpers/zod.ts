import {
  ZodArray,
  ZodBoolean,
  ZodDefault,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodSchema,
  ZodString,
} from 'zod';
import { MessageParam } from '../chain';

/**
 * Creates a MessageParam from a Zod schema field
 */
function createMessageParam(
  key: string,
  schema: unknown,
  description: string,
  required: boolean,
): MessageParam[] {
  if (schema instanceof ZodString) {
    return [{ name: key, type: 'string', description, required }];
  }

  if (schema instanceof ZodNumber) {
    return [{ name: key, type: 'number', description, required }];
  }

  if (schema instanceof ZodBoolean) {
    return [{ name: key, type: 'boolean', description, required }];
  }

  if (schema instanceof ZodArray) {
    return [{ name: key, type: 'array', description, required }];
  }

  if (schema instanceof ZodEnum) {
    return [
      {
        name: key,
        type: 'string',
        description,
        required,
        enum: schema.options,
      },
    ];
  }

  if (schema instanceof ZodObject) {
    // For nested objects, flatten them with prefixed names
    const nestedParams = zodSchemaToMessageParams(schema);
    return nestedParams.map((param) => ({
      ...param,
      name: `${key}.${param.name}`,
    }));
  }

  // Fallback for unsupported types
  return [{ name: key, type: 'string', description, required }];
}

export function zodSchemaToMessageParams(schema: ZodSchema): MessageParam[] {
  // Only process ZodObject schemas at the top level
  if (!(schema instanceof ZodObject)) {
    return [];
  }

  const shape = schema.shape;
  const params: MessageParam[] = [];

  for (const key in shape) {
    const fieldSchema = shape[key];
    const isOptional =
      fieldSchema instanceof ZodOptional || fieldSchema instanceof ZodDefault;

    // Get the inner type for optional/default fields
    const innerSchema = isOptional ? fieldSchema._def.innerType : fieldSchema;
    const description =
      fieldSchema.description || innerSchema.description || '';

    const param = createMessageParam(
      key,
      innerSchema,
      description,
      !isOptional,
    );
    params.push(...param);
  }

  return params;
}
