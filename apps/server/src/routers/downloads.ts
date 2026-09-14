import { createTRPCRouter, publicProcedure } from '../trpc';
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

export const downloadsRouter = createTRPCRouter({
  getJobs: publicProcedure
    .input(downloadJobsInput)
    .output(downloadClientJobsAndStatusSchema)
    .query(async ({ ctx, input }) => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.integrationId
      );

      if (!integration || !supportsDownloadClient(integration)) {
        throw new Error('Integration not found or does not support download client');
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
        throw new Error('Integration not found or does not support download client');
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
        throw new Error('Integration not found or does not support download client');
      }

      const item: DownloadClientItem = {
        type: 'torrent',
        id: input.torrentHash,
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
        throw new Error('Integration not found or does not support download client');
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
        throw new Error('Integration not found or does not support download client');
      }

      const item: DownloadClientItem = {
        type: 'torrent',
        id: input.torrentHash,
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
        throw new Error('Integration not found or does not support download client');
      }

      const item: DownloadClientItem = {
        type: 'torrent',
        id: input.torrentHash,
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

      await integration.deleteItemAsync(item, input.fromDisk);
      return { success: true };
    }),
});