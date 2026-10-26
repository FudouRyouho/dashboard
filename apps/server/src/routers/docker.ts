import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { toIntegrationTRPCError } from '../integration-errors';
import {
  supportsDocker,
  IDockerIntegration,
  Integration,
  type DockerDashboardStats,
} from '@dashboard/integrations';
import { dockerSnapshot } from '../tasks/task-ids';

function emptyStats(): DockerDashboardStats {
  return {
    containers: { running: 0, stopped: 0, healthy: 0, unhealthy: 0, total: 0 },
    images: { total: 0, size: 0 },
    networks: { total: 0 },
    volumes: { total: 0 },
  };
}

/**
 * Find a Docker integration by id and return its container manager.
 */
function getDockerIntegration(
  integrations: Integration[],
  integrationId: string,
): IDockerIntegration | null {
  const integration = integrations.find((i) => i.publicIntegration.id === integrationId);
  if (!integration || !supportsDocker(integration)) {
    return null;
  }
  return integration as IDockerIntegration;
}

/**
 * Execute a Docker operation on a single integration.
 * Throws if ANY container operation fails.
 */
async function executeDockerOperation(
  manager: IDockerIntegration,
  operationName: string,
  operationFn: (manager: IDockerIntegration, id: string) => Promise<void>,
  ctx: any,
  input: { integrationId: string; ids: string[] },
): Promise<void> {
  const errors: Error[] = [];
  for (const id of input.ids) {
    try {
      await operationFn(manager, id);
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
      ctx.logger.error(
        {
          integrationId: input.integrationId,
          containerId: id,
        },
        `Failed to ${operationName} container: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (errors.length > 0) {
    throw toIntegrationTRPCError(
      errors[0]!,
      `Failed to ${operationName} ${errors.length} container(s)`,
    );
  }
}

export const dockerRouter = createTRPCRouter({
  getContainers: publicProcedure
    .output(
      z.array(
        z.object({
          integration: z.object({
            id: z.string(),
            name: z.string(),
            kind: z.string(),
          }),
          stats: z.custom<DockerDashboardStats>(),
        }),
      ),
    )
    .query(({ ctx }) => {
      return ctx.integrations.filter(supportsDocker).map((integration) => {
        const key = dockerSnapshot(integration.publicIntegration.id);
        const snapshot = ctx.store.get<DockerDashboardStats>(key);

        return {
          integration: integration.publicIntegration,
          stats: snapshot?.data ?? emptyStats(),
        };
      });
    }),

  // New: Get detailed container list for an integration
  getContainerList: publicProcedure
    .input(z.object({ integrationId: z.string().min(1) }))
    .output(z.array(z.record(z.unknown())))
    .query(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      return manager.getContainersAsync();
    }),

  // New: Get container logs
  getContainerLogs: publicProcedure
    .input(z.object({
      integrationId: z.string().min(1),
      containerId: z.string().min(1),
      tail: z.union([z.number().positive(), z.literal('all')]).default(100),
      stdout: z.boolean().default(true),
      stderr: z.boolean().default(true),
      since: z.number().optional(),
      until: z.number().optional(),
      timestamps: z.boolean().default(false),
      follow: z.boolean().default(false),
    }))
    .output(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      const { integrationId, containerId, ...logOptions } = input;
      return manager.getContainerLogsAsync(containerId, logOptions);
    }),

  // New: Get container stats
  getContainerStats: publicProcedure
    .input(z.object({
      integrationId: z.string().min(1),
      containerId: z.string().min(1),
    }))
    .output(z.unknown())
    .query(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      return manager.getContainerStatsAsync(input.containerId);
    }),

  // New: Get system stats
  getSystemStats: publicProcedure
    .input(z.object({ integrationId: z.string().min(1) }))
    .output(z.unknown())
    .query(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      return manager.getSystemStatsAsync();
    }),

  startAll: publicProcedure
    .input(z.object({
      integrationId: z.string().min(1),
      ids: z.array(z.string().min(1)),
    }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      await executeDockerOperation(
        manager,
        'start',
        (m, id) => m.startContainerAsync(id),
        ctx,
        input,
      );
    }),

  stopAll: publicProcedure
    .input(z.object({
      integrationId: z.string().min(1),
      ids: z.array(z.string().min(1)),
    }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      await executeDockerOperation(
        manager,
        'stop',
        (m, id) => m.stopContainerAsync(id),
        ctx,
        input,
      );
    }),

  restartAll: publicProcedure
    .input(z.object({
      integrationId: z.string().min(1),
      ids: z.array(z.string().min(1)),
    }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      await executeDockerOperation(
        manager,
        'restart',
        (m, id) => m.restartContainerAsync(id),
        ctx,
        input,
      );
    }),

  removeAll: publicProcedure
    .input(z.object({
      integrationId: z.string().min(1),
      ids: z.array(z.string().min(1)),
    }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const manager = getDockerIntegration(ctx.integrations, input.integrationId);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration not found'),
          'Docker operation failed',
        );
      }
      await executeDockerOperation(
        manager,
        'remove',
        (m, id) => m.removeContainerAsync(id),
        ctx,
        input,
      );
    }),
});

