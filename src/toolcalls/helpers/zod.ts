import {
  ZodSchema,
  ZodObject,
  ZodTypeAny,
  ZodArray,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodEnum,
  ZodOptional,
  ZodDefault,
} from 'zod';
import { MessageParam } from '../chain';

export function zodSchemaToMessageParams(schema: ZodSchema): MessageParam[] {
  const parseSchema = (
    schema: ZodTypeAny,
    parentKey: string = '',
    required = true,
  ): MessageParam[] => {
    const description = schema.description || '';

    if (schema instanceof ZodObject) {
      const shape = schema.shape;
      const params: MessageParam[] = [];

      for (const key in shape) {
        const fieldSchema = shape[key];
        params.push(
          ...parseSchema(
            fieldSchema,
            key,
            !(
              fieldSchema instanceof ZodOptional ||
              fieldSchema instanceof ZodDefault
            ),
          ),
        );
      }

      return params;
    }

    if (schema instanceof ZodArray) {
      console.log(schema);
      return [
        {
          name: parentKey,
          type: 'array',
          description,
          required,
          enum: [],
        },
      ];
    }

    if (schema instanceof ZodString) {
      return [
        {
          name: parentKey,
          type: 'string',
          description,
          required,
        },
      ];
    }

    if (schema instanceof ZodNumber) {
      return [
        {
          name: parentKey,
          type: 'number',
          description,
          required,
        },
      ];
    }

    if (schema instanceof ZodBoolean) {
      return [
        {
          name: parentKey,
          type: 'boolean',
          description,
          required,
        },
      ];
    }

    if (schema instanceof ZodEnum) {
      return [
        {
          name: parentKey,
          type: 'string',
          description,
          required,
          enum: schema.options,
        },
      ];
    }

    if (schema instanceof ZodOptional) {
      return parseSchema(schema._def.innerType, parentKey, false);
    }

    if (schema instanceof ZodDefault) {
      return parseSchema(schema._def.innerType, parentKey, false);
    }

    throw new Error(`Unsupported Zod schema type: ${schema.constructor.name}`);
  };

  return parseSchema(schema);
}
