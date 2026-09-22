import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { toIntegrationTRPCError } from '../integration-errors';
import { supportsDocker, type DockerDashboardStats } from '@dashboard/integrations';
import { dockerSnapshot } from '../tasks/task-ids';

const containerIdsInput = z.object({
  ids: z.array(z.string().min(1)),
});

interface DockerContainerManager {
  startContainerAsync(id: string): Promise<void>;
  stopContainerAsync(id: string): Promise<void>;
  restartContainerAsync(id: string): Promise<void>;
  removeContainerAsync(id: string): Promise<void>;
}

function getContainerManager(
  integration: unknown,
): DockerContainerManager | null {
  const i = integration as Partial<DockerContainerManager>;
  if (
    typeof i.startContainerAsync !== 'function' ||
    typeof i.stopContainerAsync !== 'function' ||
    typeof i.restartContainerAsync !== 'function' ||
    typeof i.removeContainerAsync !== 'function'
  ) {
    return null;
  }
  return i as DockerContainerManager;
}

function emptyStats(): DockerDashboardStats {
  return {
    containers: { running: 0, stopped: 0, healthy: 0, unhealthy: 0, total: 0 },
    images: { total: 0, size: 0 },
    networks: { total: 0 },
    volumes: { total: 0 },
  };
}

/**
 * Helper to execute a Docker operation across all integrations.
 * Uses Promise.allSettled to handle partial failures gracefully.
 * Only throws if ALL integrations fail.
 */
async function executeDockerOperation(
  integrations: any[],
  operationName: string,
  operationFn: (manager: DockerContainerManager, id: string) => Promise<void>,
  ctx: any,
  input: { ids: string[] },
) {
  const results = await Promise.allSettled(
    integrations.map(async (integration) => {
      const manager = getContainerManager(integration);
      if (!manager) {
        throw toIntegrationTRPCError(
          new Error('Docker integration does not support container management'),
          'Docker operation failed',
        );
      }
      const errors: Error[] = [];
      for (const id of input.ids) {
        try {
          await operationFn(manager, id);
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
          ctx.logger.error(
            { integrationId: integration.publicIntegration.id, containerId: id },
            `Failed to ${operationName} container: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      if (errors.length > 0) {
        throw new Error(`Failed to ${operationName} ${errors.length} container(s)`);
      }
    }),
  );

  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length === integrations.length) {
    throw toIntegrationTRPCError(new Error('All Docker integrations failed'), 'Docker operation failed');
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
      return ctx.integrations
        .filter(supportsDocker)
        .map((integration) => {
          const key = dockerSnapshot(integration.publicIntegration.id);
          const snapshot = ctx.store.get<DockerDashboardStats>(key);

          return {
            integration: integration.publicIntegration,
            stats: snapshot?.data ?? emptyStats(),
          };
        });
    }),

  startAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await executeDockerOperation(
        dockerIntegrations,
        'start',
        (manager, id) => manager.startContainerAsync(id),
        ctx,
        input,
      );
    }),

  stopAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await executeDockerOperation(
        dockerIntegrations,
        'stop',
        (manager, id) => manager.stopContainerAsync(id),
        ctx,
        input,
      );
    }),

  restartAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await executeDockerOperation(
        dockerIntegrations,
        'restart',
        (manager, id) => manager.restartContainerAsync(id),
        ctx,
        input,
      );
    }),

  removeAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await executeDockerOperation(
        dockerIntegrations,
        'remove',
        (manager, id) => manager.removeContainerAsync(id),
        ctx,
        input,
      );
    }),
});
