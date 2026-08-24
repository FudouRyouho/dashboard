import { z } from 'zod';
import { ImageSchema } from '../../image';

const sonarrSeriesSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    titleSlug: z.string(),
    overview: z.string().nullable().optional(),
    images: z.array(ImageSchema).default([]),
  })
  .passthrough();

export const sonarrCalendarEventSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    airDateUtc: z.coerce.date(),
    seasonNumber: z.number(),
    episodeNumber: z.number(),
    images: z.array(ImageSchema).default([]),
    series: sonarrSeriesSchema,
  })
  .passthrough();

export const sonarrCalendarResponseSchema = z.array(sonarrCalendarEventSchema);
