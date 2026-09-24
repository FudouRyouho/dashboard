import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { supportsSystemHealth, PrometheusNormalizer } from '@dashboard/integrations';
import type { ServerMetrics } from '@dashboard/integrations';

const serverMetricsInput = z.object({
  server: z.string().min(1),
});

export const systemHealthRouter = createTRPCRouter({
  getAllMetrics: publicProcedure
    .output(
      z.array(
        z.object({
          integration: z.object({
            id: z.string(),
            name: z.string(),
            kind: z.string(),
          }),
          metrics: z.array(z.unknown()),
        })
      )
    )
    .query(async ({ ctx }): Promise<Array<{ integration: { id: string; name: string; kind: string }; metrics: unknown[] }>> => {
      const systemHealthIntegrations = ctx.integrations.filter(supportsSystemHealth);

      const results = await Promise.allSettled(
        systemHealthIntegrations.map(async (integration) => {
          const typedIntegration = integration as typeof integration & {
            getDiscoveredDataAsync: (options?: { signal?: AbortSignal }) => Promise<{ instances: string[]; queryResults: Map<string, unknown> }>;
          };

          try {
            const { instances, queryResults } = await typedIntegration.getDiscoveredDataAsync();
            const metrics = PrometheusNormalizer.normalize(queryResults, instances);
            return {
              integration: {
                id: integration.publicIntegration.id,
                name: integration.publicIntegration.name,
                kind: integration.publicIntegration.kind as string,
              },
              metrics: metrics as unknown[],
            };
          } catch (err) {
            ctx.logger.error(
              { integrationId: integration.publicIntegration.id },
              `System health integration failed: ${err instanceof Error ? err.message : String(err)}`
            );
            return {
              integration: {
                id: integration.publicIntegration.id,
                name: integration.publicIntegration.name,
                kind: integration.publicIntegration.kind as string,
              },
              metrics: [] as unknown[],
            };
          }
        })
      );

      return results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((r): r is { integration: { id: string; name: string; kind: string }; metrics: unknown[] } =>
          r !== null && typeof r.integration.id === 'string' && r.integration.id !== ''
        );
    }),

  getMetrics: publicProcedure
    .input(serverMetricsInput)
    .output(
      z.object({
        integration: z.object({
          id: z.string(),
          name: z.string(),
          kind: z.string(),
        }),
        metrics: z.array(z.unknown()),
      }).nullable()
    )
    .query(async ({ ctx, input }): Promise<{ integration: { id: string; name: string; kind: string }; metrics: unknown[] } | null> => {
      const integration = ctx.integrations.find(
        (i) => i.publicIntegration.id === input.server
      );

      if (!integration || !supportsSystemHealth(integration)) {
        return null;
      }

      const typedIntegration = integration as typeof integration & {
        getDiscoveredDataAsync: (options?: { signal?: AbortSignal }) => Promise<{ instances: string[]; queryResults: Map<string, unknown> }>;
        getServerMetricsAsync: (server: string, options?: { signal?: AbortSignal; instances?: string[]; queryResults?: Map<string, unknown> }) => Promise<ServerMetrics | null>;
      };

      let serverMetrics: ServerMetrics | null = null;
      try {
        // Get discovered data first, then get metrics for specific server
        const { instances, queryResults } = await typedIntegration.getDiscoveredDataAsync();
        serverMetrics = await typedIntegration.getServerMetricsAsync(input.server, {
          instances,
          queryResults,
        });
      } catch (err) {
        ctx.logger.error(
          { integrationId: integration.publicIntegration.id, server: input.server },
          `System health getMetrics failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      return {
        integration: {
          id: integration.publicIntegration.id,
          name: integration.publicIntegration.name,
          kind: integration.publicIntegration.kind as string,
        },
        metrics: serverMetrics ? [serverMetrics as unknown] : [],
      };
    }),
});
