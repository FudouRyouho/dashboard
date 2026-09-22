import { createTRPCRouter, publicProcedure } from './trpc';
import { calendarRouter } from './routers/calendar';
import { mediaReleasesRouter } from './routers/media-releases';
import { integrationsRouter } from './routers/integrations';
import { policiesRouter } from './routers/policies';
import { downloadsRouter } from './routers/downloads';
import { systemHealthRouter } from './routers/systemHealth';
import { dockerRouter } from './routers/docker';

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  calendar: calendarRouter,
  mediaReleases: mediaReleasesRouter,
  integrations: integrationsRouter,
  policies: policiesRouter,
  downloads: downloadsRouter,
  systemHealth: systemHealthRouter,
  docker: dockerRouter,
});

export type AppRouter = typeof appRouter;
