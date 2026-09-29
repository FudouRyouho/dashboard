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
    airDateUtc: z.coerce.date().nullable(),
    seasonNumber: z.number(),
    episodeNumber: z.number(),
    images: z.array(ImageSchema).default([]),
    series: sonarrSeriesSchema,
  })
  .passthrough()
  .transform((event) => {
    if (event.airDateUtc === null) {
      // Sonarr may return null for airDateUtc; transform to undefined
      // so downstream code treats it as missing rather than 1970 epoch.
      return { ...event, airDateUtc: undefined };
    }
    return event;
  });

export const sonarrCalendarResponseSchema = z.array(sonarrCalendarEventSchema);
