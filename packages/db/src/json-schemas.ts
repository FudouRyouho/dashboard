import { z } from 'zod';

// Task run detail schema
export const taskRunDetailSchema = z.object({
  error: z.string().optional(),
  code: z.number().optional(),
  message: z.string().optional(),
  stack: z.string().optional(),
  // Allow additional properties for flexibility
}).passthrough().nullable();

// Task snapshot data schemas per task type
export const calendarSnapshotDataSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string().nullable(),
    description: z.string().nullable(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }).nullable(),
    image: z.object({
      src: z.string(),
      badge: z.object({ content: z.string(), color: z.string() }).optional(),
      aspectRatio: z.object({ width: z.number(), height: z.number() }).optional(),
    }).nullable(),
    location: z.string().nullable(),
    metadata: z.discriminatedUnion('type', [
      z.object({ type: z.literal('episode'), seriesId: z.number(), seasonNumber: z.number(), episodeNumber: z.number() }),
      z.object({ type: z.literal('movie'), movieId: z.number(), releaseType: z.string() }),
      z.object({ type: z.literal('other') }),
    ]),
    indicatorColor: z.string(),
    links: z.array(z.object({
      name: z.string(),
      href: z.string(),
      logo: z.string().optional(),
      color: z.string().optional(),
      isDark: z.boolean().optional(),
    })),
  })),
}).passthrough();

export const mediaReleasesSnapshotDataSchema = z.object({
  releases: z.array(z.discriminatedUnion('type', [
    z.object({
      type: z.literal('movie'),
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      releaseDate: z.string().datetime({ offset: true }).nullable(),
      runtimeMs: z.number().nullable(),
      studio: z.string().nullable(),
      rating: z.number().nullable(),
      genres: z.array(z.string()),
      imageUrls: z.object({ poster: z.string().url().nullable(), backdrop: z.string().url().nullable() }),
      href: z.string().url(),
    }),
    z.object({
      type: z.literal('episode'),
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      releaseDate: z.string().datetime({ offset: true }).nullable(),
      seriesTitle: z.string().optional(),
      seriesId: z.string().optional(),
      seasonNumber: z.number().optional(),
      episodeNumber: z.number().optional(),
      imageUrls: z.object({ poster: z.string().url().nullable(), backdrop: z.string().url().nullable() }),
      href: z.string().url(),
    }),
    z.object({
      type: z.literal('series'),
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      releaseDate: z.string().datetime({ offset: true }).nullable(),
      firstAired: z.string().datetime({ offset: true }).nullable(),
      childCount: z.number().nullable(),
      status: z.string().nullable(),
      imageUrls: z.object({ poster: z.string().url().nullable(), backdrop: z.string().url().nullable() }),
      href: z.string().url(),
    }),
  ])),
}).passthrough();

export const purgeSnapshotDataSchema = z.object({
  deleted: z.number(),
}).passthrough();

// Union of all snapshot data types
export const snapshotDataSchema = z.union([
  calendarSnapshotDataSchema,
  mediaReleasesSnapshotDataSchema,
  purgeSnapshotDataSchema,
  z.record(z.unknown()), // fallback for unknown types
]);

export type TaskRunDetail = z.infer<typeof taskRunDetailSchema>;
export type CalendarSnapshotData = z.infer<typeof calendarSnapshotDataSchema>;
export type MediaReleasesSnapshotData = z.infer<typeof mediaReleasesSnapshotDataSchema>;
export type PurgeSnapshotData = z.infer<typeof purgeSnapshotDataSchema>;
export type SnapshotData = z.infer<typeof snapshotDataSchema>;

// Validation functions
export const validateTaskRunDetail = (data: unknown): TaskRunDetail => {
  return taskRunDetailSchema.parse(data);
};

export const safeValidateTaskRunDetail = (data: unknown) => {
  return taskRunDetailSchema.safeParse(data);
};

export const validateCalendarSnapshotData = (data: unknown): CalendarSnapshotData => {
  return calendarSnapshotDataSchema.parse(data);
};

export const safeValidateCalendarSnapshotData = (data: unknown) => {
  return calendarSnapshotDataSchema.safeParse(data);
};

export const validateMediaReleasesSnapshotData = (data: unknown): MediaReleasesSnapshotData => {
  return mediaReleasesSnapshotDataSchema.parse(data);
};

export const safeValidateMediaReleasesSnapshotData = (data: unknown) => {
  return mediaReleasesSnapshotDataSchema.safeParse(data);
};

export const validatePurgeSnapshotData = (data: unknown): PurgeSnapshotData => {
  return purgeSnapshotDataSchema.parse(data);
};

export const safeValidatePurgeSnapshotData = (data: unknown) => {
  return purgeSnapshotDataSchema.safeParse(data);
};

export const validateSnapshotData = (data: unknown): SnapshotData => {
  return snapshotDataSchema.parse(data);
};

export const safeValidateSnapshotData = (data: unknown) => {
  return snapshotDataSchema.safeParse(data);
};