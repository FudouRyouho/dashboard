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
    inCinemas: z.coerce.date().optional(),
    physicalRelease: z.coerce.date().optional(),
    digitalRelease: z.coerce.date().optional(),
    originalTitle: z.string(),
    overview: z.string().nullable().optional(),
    images: z.array(ImageSchema).default([]),
  })
  .passthrough();

export const radarrCalendarResponseSchema = z.array(radarrCalendarEventSchema);
