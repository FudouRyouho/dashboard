import { z } from 'zod';
import { ImageSchema } from '../../image';

export const radarrReleaseTypes = [
  'inCinemas',
  'physicalRelease',
  'digitalRelease',
] as const;

export const radarrCalendarEventSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    titleSlug: z.string(),
    inCinemas: z.coerce.date().nullable().optional(),
    physicalRelease: z.coerce.date().nullable().optional(),
    digitalRelease: z.coerce.date().nullable().optional(),
    originalTitle: z.string(),
    overview: z.string().nullable().optional(),
    images: z.array(ImageSchema).default([]),
  })
  .passthrough()
  .transform((event) => {
    // Radarr may return null for date fields; transform to undefined
    // so downstream code treats them as missing rather than 1970 epoch.
    const result = { ...event };
    for (const key of ['inCinemas', 'physicalRelease', 'digitalRelease'] as const) {
      if (result[key] === null) {
        result[key] = undefined;
      }
    }
    return result;
  });

export const radarrCalendarResponseSchema = z.array(radarrCalendarEventSchema);
