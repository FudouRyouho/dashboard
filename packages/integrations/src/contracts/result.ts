import { z } from 'zod';
import { integrationErrorReasons } from '../base/integration-error';

export const resultCodeSchema = z.enum(['ok', 'stale', 'failed']);

export type ResultCode = z.infer<typeof resultCodeSchema>;

export const resultStatusSchema = z.object({
  code: resultCodeSchema,

  updatedAt: z.string().datetime({ offset: true }).nullable(),

  reason: z.enum(integrationErrorReasons).optional(),

  httpStatus: z.number().int().optional(),
});

export type ResultStatus = z.infer<typeof resultStatusSchema>;

export function withResultStatus<T extends z.AnyZodObject>(schema: T) {
  return schema.extend({ status: resultStatusSchema });
}
