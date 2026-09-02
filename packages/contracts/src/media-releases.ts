import { z } from 'zod';

const mediaReleaseMovieSchema = z.object({
  type: z.literal('movie'),
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  releaseDate: z.string().datetime({ offset: true }).nullable(),
  runtimeMs: z.number().nullable(),
  studio: z.string().nullable(),
  rating: z.number().nullable(),
  genres: z.array(z.string()),
  imageUrls: z.object({
    poster: z.string().url().nullable(),
    backdrop: z.string().url().nullable(),
  }),
  href: z.string().url(),
});

const mediaReleaseEpisodeSchema = z.object({
  type: z.literal('episode'),
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  releaseDate: z.string().datetime({ offset: true }).nullable(),
  seriesTitle: z.string().optional(),
  seriesId: z.string().optional(),
  seasonNumber: z.number().optional(),
  episodeNumber: z.number().optional(),
  imageUrls: z.object({
    poster: z.string().url().nullable(),
    backdrop: z.string().url().nullable(),
  }),
  href: z.string().url(),
});

const mediaReleaseSeriesSchema = z.object({
  type: z.literal('series'),
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  releaseDate: z.string().datetime({ offset: true }).nullable(),
  firstAired: z.string().datetime({ offset: true }).nullable(),
  childCount: z.number().nullable(),
  status: z.string().nullable(),
  imageUrls: z.object({
    poster: z.string().url().nullable(),
    backdrop: z.string().url().nullable(),
  }),
  href: z.string().url(),
});

// Unión discriminada principal
export const mediaReleaseSchema = z.discriminatedUnion('type', [
  mediaReleaseMovieSchema,
  mediaReleaseEpisodeSchema,
  mediaReleaseSeriesSchema,
]);

export const mediaReleasesResponseSchema = z.array(mediaReleaseSchema);

export type MediaReleaseEvent = z.infer<typeof mediaReleaseSchema>;
export type MediaReleasesResponse = z.infer<typeof mediaReleasesResponseSchema>;
