import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { calendarResultSchema, inRange, type CalendarEvent } from '@dashboard/contracts';
import { supportsCalendar } from '@dashboard/integrations';
import { toStatus } from '../tasks/to-status';
import { calendarSnapshot } from '../tasks/task-ids';

const calendarRangeInput = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine(({ start, end }) => start < end, {
    path: ['end'],
    message: 'The calendar end date must be after the start date.',
  });

export const calendarRouter = createTRPCRouter({
  getEvents: publicProcedure
    .input(calendarRangeInput)
    .output(calendarResultSchema)
    .query(({ ctx, input }) => {
      return ctx.integrations.filter(supportsCalendar).map((integration) => {
        const key = calendarSnapshot(integration.publicIntegration.id);
        const snapshot = ctx.store.get(key);
        const lastRun = ctx.runLog.last(key.taskId);

        // Extract events from snapshot (wrapper object with coverage)
        const snapshotData = snapshot?.data as { data: CalendarEvent[]; from?: string; to?: string } | undefined;
        const events = snapshotData?.data ?? [];

        return {
          integration: integration.publicIntegration,
          status: toStatus(snapshot, lastRun),
          events: events.filter(
            inRange(input.start, input.end),
          ),
        };
      });
    }),
});
