import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  calendarResultSchema,
  supportsCalendar,
} from "@dashboard/integrations";

const calendarRangeInput = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    includeUnmonitored: z.boolean().default(false),
  })
  .refine(
    ({ start, end }) => start < end,
    {
      path: ["end"],
      message: "The calendar end date must be after the start date.",
    },
  );

export const calendarRouter = createTRPCRouter({
  getEvents: publicProcedure
    .input(calendarRangeInput)
    .output(calendarResultSchema)
    .query(async ({ ctx, input }) => {
      const integrations = ctx.integrations.filter(supportsCalendar);

      const settled = await Promise.allSettled(
        integrations.map(async (integration) => ({
          integration,
          events: await integration.getCalendarEventsAsync(
            input.start,
            input.end,
            input.includeUnmonitored,
          ),
        })),
      );

      settled.forEach((result, index) => {
        if (result.status === "fulfilled") {
          return;
        }

        const integration = integrations[index];

        ctx.logger.warn(
          {
            err: result.reason,
            operation: "calendar.getEvents",
            integrationId: integration.publicIntegration.id,
            integrationKind: integration.publicIntegration.kind,
          },
          "Calendar integration request failed",
        );
      });

      const groups = settled.flatMap((result) => {
        if (result.status === "rejected") {
          return [];
        }

        return [
          {
            integration: result.value.integration.publicIntegration,
            events: result.value.events,
          },
        ];
      });

      if (integrations.length > 0 && groups.length === 0) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "No calendar integrations are currently available.",
        });
      }

      return groups;
    }),
});