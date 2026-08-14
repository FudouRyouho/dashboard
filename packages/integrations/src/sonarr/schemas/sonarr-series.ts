import { z } from 'zod';

export const sonarrSeriesListItemSchema = z
  .object({
    id: z.number(),
    title: z.string(),
  })
  .passthrough();

export const sonarrSeriesListResponseSchema = z.array(
  sonarrSeriesListItemSchema,
);
