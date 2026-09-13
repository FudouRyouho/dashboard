import { z } from 'zod';

/**
 * Zod schemas for Prometheus API responses.
 *
 * Validates response structure only — labels and values are dynamic
 * and cannot be validated statically.
 */

/**
 * Response from Prometheus instant query API (/api/v1/query).
 */
export const prometheusInstantQueryResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    resultType: z.enum(['vector', 'scalar', 'matrix', 'string']),
    result: z.array(
      z.object({
        metric: z.record(z.string()),
        value: z.tuple([z.number(), z.string()]),
      }),
    ),
  }),
  error: z.string().optional(),
  errorType: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

/**
 * Response from Prometheus label_values API (/api/v1/label/<name>/values).
 */
export const prometheusLabelValuesResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.string()),
  error: z.string().optional(),
  errorType: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

/**
 * Inferred TypeScript types from schemas.
 */
export type PrometheusInstantQueryResponse = z.infer<
  typeof prometheusInstantQueryResponseSchema
>;
export type PrometheusLabelValuesResponse = z.infer<
  typeof prometheusLabelValuesResponseSchema
>;