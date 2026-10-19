import { z } from 'zod';

/**
 * Schema for a single indexer entry from Prowlarr's /api/v1/indexer endpoint.
 * We extract only the fields we need for display.
 */
export const indexerSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    enable: z.boolean(),
    indexerUrls: z.array(z.string()).default([]),
  })
  .passthrough();

/**
 * Schema for a single indexer status entry from Prowlarr's /api/v1/indexerstatus endpoint.
 */
export const indexerStatusSchema = z
  .object({
    indexerId: z.number(),
    disabledTill: z.string().datetime().nullable(),
    mostRecentFailure: z.string().datetime().nullable(),
    initialFailure: z.string().datetime().nullable(),
  })
  .passthrough();

export const indexerResponseSchema = z.array(indexerSchema);
export const indexerStatusResponseSchema = z.array(indexerStatusSchema);