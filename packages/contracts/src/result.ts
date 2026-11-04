import { z } from 'zod';
import { integrationPublicSchema } from './integrations';
import type { ServerMetrics } from './system-health-types';

export const integrationErrorReasons = [
  'unauthorized',
  'forbidden',
  'unreachable',
  'timeout',
  'invalid-response',
  'unknown',
] as const;

export type IntegrationErrorReason = (typeof integrationErrorReasons)[number];

const isoDate = z.string().datetime({ offset: true });

const dataFactsSchema = z.object({
  obtainedAt: isoDate,
  from: isoDate.nullable(),
  to: isoDate.nullable(),
}).nullable();

const attemptFactsSchema = z
  .discriminatedUnion('outcome', [
    z.object({ outcome: z.literal('success'), at: isoDate }),
    z.object({
      outcome: z.literal('failure'),
      at: isoDate,
      reason: z.enum(integrationErrorReasons),
    }),
  ])
  .nullable();

export const resultStatusSchema = z.object({
  data: dataFactsSchema,
  attempt: attemptFactsSchema,
});

export type ResultStatus = z.infer<typeof resultStatusSchema>;

/**
 * Adds `status` to an object schema, keeping the input shape in the return type.
 *
 * Bound to `z.ZodObject<T>` instead of `z.AnyZodObject` on purpose: with an
 * unresolved constraint-only generic, `.extend()` resolves against
 * `AnyZodObject`, whose shape is `any`, so every `z.infer` of the result
 * collapses to `any` for all consumers. Naming `T` through the object keeps
 * each key concrete across the package boundary.
 */
export function withResultStatus<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend({ status: resultStatusSchema });
}

/**
 * Entry from systemHealth.getAllMetrics - one per Prometheus instance with its aggregated metrics.
 * The server digests (discovers, normalizes, aggregates); the client consumes.
 */
export const systemHealthEntrySchema = z.object({
  integration: integrationPublicSchema,
  server: z.string(),
  metrics: z.custom<ServerMetrics[]>(),
});

export const systemHealthEntryArraySchema = z.array(systemHealthEntrySchema);

export type SystemHealthEntry = z.infer<typeof systemHealthEntrySchema>;
export type SystemHealthEntryArray = z.infer<typeof systemHealthEntryArraySchema>;

