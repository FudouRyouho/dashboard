import { createTRPCRouter, publicProcedure } from '../trpc';
import { supportsMediaReleases } from '@dashboard/integrations';
import {
  integrationKinds,
  mediaReleasesResponseSchema,
  withResultStatus,
  type MediaReleaseEvent,
} from '@dashboard/contracts';
import { z } from 'zod';
import { toStatus } from '../tasks/to-status';
import { mediaReleasesSnapshot } from '../tasks/task-ids';

const mediaReleasesIntegrationSchema = z.object({
  kind: z.enum(integrationKinds),
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

export const mediaReleasesResultSchema = withResultStatus(
  z.object({
    integration: mediaReleasesIntegrationSchema,
    releases: mediaReleasesResponseSchema,
  }),
);

export const mediaReleasesRouter = createTRPCRouter({
  getLatest: publicProcedure
    .output(z.array(mediaReleasesResultSchema))
    .query(({ ctx }) => {
      return ctx.integrations
        .filter(supportsMediaReleases)
        .map((integration) => {
          const key = mediaReleasesSnapshot(integration.publicIntegration.id);
          const snapshot = ctx.store.get<MediaReleaseEvent[]>(key);
          const lastRun = ctx.runLog.last(key.taskId);

          return {
            integration: integration.publicIntegration,
            status: toStatus(snapshot, lastRun),
            releases: snapshot?.data ?? [],
          };
        });
    }),
});
