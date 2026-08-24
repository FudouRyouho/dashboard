import { z } from 'zod';
import { integrationKinds } from './kinds';
import { withResultStatus } from './result';

export const calendarImageBadgeSchema = z.object({
  content: z.string(),
  color: z.string(),
});

export const calendarImageSchema = z.object({
  src: z.string(),
  badge: calendarImageBadgeSchema.optional(),
  aspectRatio: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

export const calendarLinkSchema = z.object({
  name: z.string(),
  href: z.string(),
  logo: z.string().optional(),
  color: z.string().optional(),
  isDark: z.boolean().optional(),
});

export const calendarEventMetadataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('episode'),
    seriesId: z.number(),
    seasonNumber: z.number(),
    episodeNumber: z.number(),
  }),

  z.object({
    type: z.literal('movie'),
    movieId: z.number(),
    releaseType: z.string(),
  }),

  z.object({
    type: z.literal('other'),
  }),
]);

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),

  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }).nullable(),

  image: calendarImageSchema.nullable(),
  location: z.string().nullable(),

  metadata: calendarEventMetadataSchema,
  indicatorColor: z.string(),
  links: z.array(calendarLinkSchema),
});

export const calendarIntegrationSchema = z.object({
  kind: z.enum(integrationKinds),
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

export const calendarResultGroupSchema = withResultStatus(
  z.object({
    integration: calendarIntegrationSchema,
    events: z.array(calendarEventSchema),
  }),
);

export const calendarResultSchema = z.array(calendarResultGroupSchema);

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
