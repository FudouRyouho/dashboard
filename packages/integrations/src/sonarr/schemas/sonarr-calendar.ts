import { z } from 'zod';

export const imageCoverTypes = [
  'poster',
  'banner',
  'fanart',
  'screenshot',
  'clearlogo',
  'headshot',
  'unknown',
] as const;

const sonarrImageSchema = z.object({
  coverType: z.enum(imageCoverTypes).catch('unknown'),
  remoteUrl: z.string().url().optional(),
});

export type SonarrCoverType = (typeof imageCoverTypes)[number];
export type SonarrImage = z.infer<typeof sonarrImageSchema>;

const sonarrSeriesSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    titleSlug: z.string(),
    overview: z.string().nullable().optional(),
    images: z.array(sonarrImageSchema).default([]),
  })
  .passthrough();

export const sonarrCalendarEventSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    airDateUtc: z.coerce.date(),
    seasonNumber: z.number(),
    episodeNumber: z.number(),
    images: z.array(sonarrImageSchema).default([]),
    series: sonarrSeriesSchema,
  })
  .passthrough();

export const sonarrCalendarResponseSchema = z.array(sonarrCalendarEventSchema);
