import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import {
  integrationOutputSchema,
  type IntegrationKind,
  upsertIntegrationInputSchema,
} from '@dashboard/contracts';

const upsertIntegrationInput = upsertIntegrationInputSchema;

export const integrationsRouter = createTRPCRouter({
  list: publicProcedure.output(z.array(integrationOutputSchema)).query(async ({ ctx }) => {
    const { getAllIntegrations } = await import('@dashboard/db');
    const integrations = await getAllIntegrations(ctx.db);
    return integrations.map((i) => ({
      ...i,
      kind: i.kind as IntegrationKind,
    }));
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(integrationOutputSchema.nullable())
    .query(async ({ ctx, input }) => {
      const { getIntegrationById } = await import('@dashboard/db');
      const result = await getIntegrationById(ctx.db, input.id);
      if (!result) return null;
      return {
        ...result,
        kind: result.kind as IntegrationKind,
      };
    }),

  upsert: publicProcedure
    .input(upsertIntegrationInput)
    .output(integrationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { upsertIntegration } = await import('@dashboard/db');
      const result = await upsertIntegration(
        ctx.db,
        input as import('@dashboard/db').UpsertIntegrationInput,
      );
      return {
        ...result,
        kind: result.kind as IntegrationKind,
      };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const { deleteIntegration } = await import('@dashboard/db');
      await deleteIntegration(ctx.db, input.id);
    }),
});
