import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import {
  supportsSystemHealth,
  PrometheusNormalizer,
} from '@dashboard/integrations';
import type { ServerMetrics } from '@dashboard/integrations';
import { integrationPublicSchema } from '@dashboard/contracts';

const serverMetricsInput = z.object({
  server: z.string().min(1),
});

export const systemHealthRouter = createTRPCRouter({
  getAllMetrics: publicProcedure
    // La API devuelve lo ya masticado: una entrada por instancia (servidor), con su agregado.
    // El servidor digiere (descubre, normaliza, agrega); el cliente consume sin transformar.
    .output(
      z.array(
        z.object({
          integration: integrationPublicSchema,
          server: z.string(),
          metrics: z.custom<ServerMetrics[]>(),
        }),
      ),
    )
    .query(
      async ({ ctx }) => {
        const systemHealthIntegrations =
          ctx.integrations.filter(supportsSystemHealth);

        const results = await Promise.allSettled(
          systemHealthIntegrations.map(async (integration) => {
            const typedIntegration = integration as typeof integration & {
              getDiscoveredDataAsync: (options?: {
                signal?: AbortSignal;
              }) => Promise<{
                instances: string[];
                queryResults: Map<string, unknown>;
              }>;
            };

            try {
              const { instances, queryResults } =
                await typedIntegration.getDiscoveredDataAsync();
              const normalized = PrometheusNormalizer.normalize(
                queryResults,
                instances,
              );
              // Aplanar por instancia: cada servidor es una entrada con su agregado.
              return normalized.map((entry) => ({
                integration: integration.publicIntegration,
                server: entry.server,
                metrics: [PrometheusNormalizer.toServerMetrics(entry)],
              }));
            } catch (err) {
              ctx.logger.error(
                { integrationId: integration.publicIntegration.id },
                `System health integration failed: ${err instanceof Error ? err.message : String(err)}`,
              );
              return [];
            }
          }),
        );

        return results
          .filter(
            (
              r,
            ): r is PromiseFulfilledResult<
              {
                integration: z.infer<typeof integrationPublicSchema>;
                server: string;
                metrics: ServerMetrics[];
              }[]
            > => r.status === 'fulfilled',
          )
          .map((r) => r.value)
          .flat();
      },
    ),

  getMetrics: publicProcedure
    .input(serverMetricsInput)
    .output(
      z
        .object({
          integration: integrationPublicSchema,
          metrics: z.custom<ServerMetrics[]>(),
        })
        .nullable(),
    )
    .query(
      async ({ ctx, input }) => {
        const integration = ctx.integrations.find(
          (i) => i.publicIntegration.id === input.server,
        );

        if (!integration || !supportsSystemHealth(integration)) {
          return null;
        }

        const typedIntegration = integration as typeof integration & {
          getDiscoveredDataAsync: (options?: {
            signal?: AbortSignal;
          }) => Promise<{
            instances: string[];
            queryResults: Map<string, unknown>;
          }>;
          getServerMetricsAsync: (
            server: string,
            options?: {
              signal?: AbortSignal;
              instances?: string[];
              queryResults?: Map<string, unknown>;
            },
          ) => Promise<ServerMetrics | null>;
        };

        let serverMetrics: ServerMetrics | null = null;
        try {
          // Get discovered data first, then get metrics for specific server
          const { instances, queryResults } =
            await typedIntegration.getDiscoveredDataAsync();
          serverMetrics = await typedIntegration.getServerMetricsAsync(
            input.server,
            {
              instances,
              queryResults,
            },
          );
        } catch (err) {
          ctx.logger.error(
            {
              integrationId: integration.publicIntegration.id,
              server: input.server,
            },
            `System health getMetrics failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        return {
          integration: integration.publicIntegration,
          metrics: serverMetrics ? [serverMetrics] : [],
        };
      },
    ),
});
