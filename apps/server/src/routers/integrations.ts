import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';

const integrationOutputSchema = z.object({
  id: z.string(),
  kind: z.enum(['sonarr', 'radarr', 'jellyfin']),
  name: z.string(),
  url: z.string().url(),
  externalUrl: z.string().url().nullable(),
  port: z.number().int().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const getIntegrationsOutput = z.array(integrationOutputSchema);

const upsertIntegrationInputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('sonarr'),
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    externalUrl: z.string().url().optional(),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(8989),
  }),
  z.object({
    kind: z.literal('radarr'),
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    externalUrl: z.string().url().optional(),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(7878),
  }),
  z.object({
    kind: z.literal('jellyfin'),
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    externalUrl: z.string().url().optional(),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(8096),
  }),
]);

export const integrationsRouter = createTRPCRouter({
  list: publicProcedure.output(getIntegrationsOutput).query(async ({ ctx }) => {
    const { getAllIntegrations } = await import('@dashboard/db');
    const integrations = await getAllIntegrations(ctx.db);
    return integrations.map((i) => ({
      ...i,
      kind: i.kind as 'sonarr' | 'radarr' | 'jellyfin',
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
        kind: result.kind as 'sonarr' | 'radarr' | 'jellyfin',
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
        kind: result.kind as 'sonarr' | 'radarr' | 'jellyfin',
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
