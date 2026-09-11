import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import {
  integrationInputBaseSchema,
  integrationOutputSchema,
  type IntegrationKind,
} from '@dashboard/contracts';

const upsertIntegrationInputSchema = z.discriminatedUnion('kind', [
  integrationInputBaseSchema.extend({
    kind: z.literal('sonarr'),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(8989),
  }),
  integrationInputBaseSchema.extend({
    kind: z.literal('radarr'),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(7878),
  }),
  integrationInputBaseSchema.extend({
    kind: z.literal('jellyfin'),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(8096),
  }),
  integrationInputBaseSchema.extend({
    kind: z.literal('docker'),
    port: z.number().int().positive().default(2375),
  }),
]);

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
    .input(upsertIntegrationInputSchema)
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
