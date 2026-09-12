import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { getAllPoliciesByIntegrationId, getPolicyByIntegrationAndType, upsertTaskPolicy, deleteTaskPolicy } from '@dashboard/db';

export const policiesRouter = createTRPCRouter({
  listByIntegration: publicProcedure
    .input(z.object({ integrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getAllPoliciesByIntegrationId(ctx.db, input.integrationId);
    }),

  get: publicProcedure
    .input(z.object({ integrationId: z.string(), taskType: z.enum(['calendar', 'mediaReleases']) }))
    .query(async ({ ctx, input }) => {
      return await getPolicyByIntegrationAndType(ctx.db, input.integrationId, input.taskType);
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.string(),
      integrationId: z.string(),
      taskType: z.enum(['calendar', 'mediaReleases']),
      everyMs: z.number().int().positive(),
      runOnStart: z.boolean(),
      expectedDurationMs: z.number().int().positive(),
      failureMaxAttempts: z.number().int().min(0),
      failureCooldownMs: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertTaskPolicy(ctx.db, input);
    }),

  delete: publicProcedure
    .input(z.object({ integrationId: z.string(), taskType: z.enum(['calendar', 'mediaReleases']) }))
    .mutation(async ({ ctx, input }) => {
      await deleteTaskPolicy(ctx.db, input.integrationId, input.taskType);
    }),
});
