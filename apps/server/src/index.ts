import { createTRPCRouter, publicProcedure } from './trpc';
import { calendarRouter } from './routers/calendar';
import { mediaReleasesRouter } from './routers/media-releases';
import { integrationsRouter } from './routers/integrations';

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  calendar: calendarRouter,
  mediaReleases: mediaReleasesRouter,
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter;
