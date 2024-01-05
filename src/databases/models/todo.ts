import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

export const todoSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100 // <- the primary key must have set maxLength
    },
    name: {
      type: 'string'
    },
    done: {
      type: 'boolean'
    },
    timestamp: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'name', 'done', 'timestamp']
} as const;

const schemaTyped = toTypedRxJsonSchema(todoSchemaLiteral);

export type TodoDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const todoSchema: RxJsonSchema<TodoDocType> = todoSchemaLiteral;
export type TodoCollection = RxCollection<TodoDocType>;




