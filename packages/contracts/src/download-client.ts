import { z } from 'zod';

/** Normalized canonical states (5 states) */
export type DownloadClientItemState =
  'leeching' | 'seeding' | 'paused' | 'stalled' | 'unknown';

/** Item individual de torrent */
export const downloadClientItemSchema = z.object({
  type: z.literal('torrent'),
  id: z.string(),
  name: z.string(),
  size: z.number(),
  sent: z.number(),
  downSpeed: z.number(),
  upSpeed: z.number(),
  time: z.number(),
  added: z.number(),
  state: z.enum(['leeching', 'seeding', 'paused', 'stalled', 'unknown']),
  progress: z.number().min(0).max(1),
  category: z.string().optional(),
});

/** Estado global del cliente */
export const downloadClientStatusSchema = z.object({
  /** True if ALL torrents are in a paused state (aggregated from items) */
  paused: z.boolean(),
  /** Actual global queue state when available from the client API */
  queueState: z.enum(['running', 'paused', 'unknown']).optional(),
  rates: z.object({
    down: z.number(),
    up: z.number(),
  }),
  types: z.tuple([z.literal('torrent')]),
});

/** Respuesta combinada */
export const downloadClientJobsAndStatusSchema = z.object({
  status: downloadClientStatusSchema,
  items: z.array(downloadClientItemSchema),
});

export type DownloadClientItem = z.infer<typeof downloadClientItemSchema>;
export type DownloadClientStatus = z.infer<typeof downloadClientStatusSchema>;
export type DownloadClientJobsAndStatus = z.infer<
  typeof downloadClientJobsAndStatusSchema
>;

export interface GetClientJobsAndStatusInput {
  limit?: number;
}
