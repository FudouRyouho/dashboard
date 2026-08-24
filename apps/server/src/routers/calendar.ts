import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { calendarResultSchema } from '@dashboard/contracts';
import { getCalendarCached } from '../cache/cached-integration-call';
import { supportsCalendar } from '@dashboard/integrations';

const calendarRangeInput = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    includeUnmonitored: z.boolean().default(false),
  })
  .refine(({ start, end }) => start < end, {
    path: ['end'],
    message: 'The calendar end date must be after the start date.',
  });

export const calendarRouter = createTRPCRouter({
  getEvents: publicProcedure
    .input(calendarRangeInput)
    .output(calendarResultSchema)
    .query(async ({ ctx, input }) => {
      const integrations = ctx.integrations.filter(supportsCalendar);

      return await Promise.all(
        integrations.map(async (integration) => {
          const result = await getCalendarCached(
            ctx.cache,
            integration,
            input.start,
            input.end,
            input.includeUnmonitored,
            ctx.logger,
          );

          return {
            integration: integration.publicIntegration,
            status: {
              ...result.status,
              updatedAt: result.status.updatedAt?.toISOString() ?? null,
            },
            events: result.events,
          };
        }),
      );
    }),
});
