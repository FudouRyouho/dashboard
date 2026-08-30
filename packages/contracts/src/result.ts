import { z } from 'zod';

export const integrationErrorReasons = [
  'unauthorized',
  'unreachable',
  'timeout',
  'invalid-response',
  'unknown',
] as const;

export type IntegrationErrorReason = (typeof integrationErrorReasons)[number];

const isoDate = z.string().datetime({ offset: true });

const dataFactsSchema = z.object({ obtainedAt: isoDate }).nullable();

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

export function withResultStatus<T extends z.AnyZodObject>(schema: T) {
  return schema.extend({ status: resultStatusSchema });
}
