import { createTRPCRouter, publicProcedure } from './trpc';
import { calendarRouter } from './routers/calendar';
import { mediaReleasesRouter } from './routers/media-releases';

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  calendar: calendarRouter,
  mediaReleases: mediaReleasesRouter
});

export type AppRouter = typeof appRouter;
