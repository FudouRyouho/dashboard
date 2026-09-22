import { createTRPCRouter, publicProcedure } from '../trpc';
import { toIntegrationTRPCError } from '../integration-errors';
import { z } from 'zod';
import { supportsDownloadClient } from '@dashboard/integrations';
import {
  downloadClientJobsAndStatusSchema,
  type DownloadClientItem,
} from '@dashboard/contracts';

const downloadJobsInput = z.object({
  integrationId: z.string(),
  limit: z.number().int().positive().max(500).optional().default(50),
});

const torrentActionInput = z.object({
  integrationId: z.string(),
  torrentHash: z.string().min(1),
  fromDisk: z.boolean().optional().default(false),
});

function buildDownloadClientItemFromHash(torrentHash: string): DownloadClientItem {
  return {
    type: 'torrent',
    id: torrentHash,
    name: '',
    size: 0,
    sent: 0,
    downSpeed: 0,
    upSpeed: 0,
    time: 0,
    added: 0,
    state: 'paused',
    progress: 0,
  };
}

const downloadClientJobsWithIntegrationSchema = downloadClientJobsAndStatusSchema.extend({
  integration: z.object({
    id: z.string(),
    name: z.string(),
    kind: z.string(),
  }),
});

export const downloadsRouter = createTRPCRouter({
  getAllJobs: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(500).optional().default(50) }))
    .output(z.array(downloadClientJobsWithIntegrationSchema))
    .query(async ({ ctx, input }) => {
      const downloadClients = ctx.integrations.filter(supportsDownloadClient);

      const results = await Promise.allSettled(
        downloadClients.map(async (integration) => {
          const jobsAndStatus = await integration.getClientJobsAndStatusAsync(
            { limit: input.limit }
          );
          return {
            integration: {
              id: integration.publicIntegration.id,
              name: integration.publicIntegration.name,
              kind: integration.publicIntegration.kind as string,
            },
            ...jobsAndStatus,
          };
        })
      );

      return results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value);
    }),

  getJobs: publicProcedure
    .input(downloadJobsInput)
    .output(downloadClientJobsAndStatusSchema)
    .query(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw toIntegrationTRPCError(new Error('Integration not found or does not support download client'), 'Download operation failed');
      }

      return integration.getClientJobsAndStatusAsync(
        { limit: input.limit }
      );
    }),

  pauseQueue: publicProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw toIntegrationTRPCError(new Error('Integration not found or does not support download client'), 'Download operation failed');
      }

      await integration.pauseQueueAsync();
      return { success: true };
    }),

  pauseItem: publicProcedure
    .input(torrentActionInput)
    .mutation(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw toIntegrationTRPCError(new Error('Integration not found or does not support download client'), 'Download operation failed');
      }

      const item = buildDownloadClientItemFromHash(input.torrentHash);

      await integration.pauseItemAsync(item);
      return { success: true };
    }),

  resumeQueue: publicProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw toIntegrationTRPCError(new Error('Integration not found or does not support download client'), 'Download operation failed');
      }

      await integration.resumeQueueAsync();
      return { success: true };
    }),

  resumeItem: publicProcedure
    .input(torrentActionInput)
    .mutation(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw toIntegrationTRPCError(new Error('Integration not found or does not support download client'), 'Download operation failed');
      }

      const item = buildDownloadClientItemFromHash(input.torrentHash);

      await integration.resumeItemAsync(item);
      return { success: true };
    }),

  deleteItem: publicProcedure
    .input(torrentActionInput)
    .mutation(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw toIntegrationTRPCError(new Error('Integration not found or does not support download client'), 'Download operation failed');
      }

      const item = buildDownloadClientItemFromHash(input.torrentHash);

      await integration.deleteItemAsync(item, input.fromDisk);
      return { success: true };
    }),
});