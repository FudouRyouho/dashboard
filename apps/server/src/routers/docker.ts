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
      await Promise.all(
        dockerIntegrations.map(async (integration) => {
          const manager = getContainerManager(integration);
          if (!manager) {
            throw toIntegrationTRPCError(
              new Error('Docker integration does not support container management'),
              'Docker operation failed',
            );
          }
          for (const id of input.ids) {
            try {
              await manager.startContainerAsync(id);
            } catch (err) {
              throw toIntegrationTRPCError(err, `Failed to start container ${id}`);
            }
          }
        }),
      );
    }),

  stopAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await Promise.all(
        dockerIntegrations.map(async (integration) => {
          const manager = getContainerManager(integration);
          if (!manager) {
            throw toIntegrationTRPCError(
              new Error('Docker integration does not support container management'),
              'Docker operation failed',
            );
          }
          for (const id of input.ids) {
            try {
              await manager.stopContainerAsync(id);
            } catch (err) {
              throw toIntegrationTRPCError(err, `Failed to stop container ${id}`);
            }
          }
        }),
      );
    }),

  restartAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await Promise.all(
        dockerIntegrations.map(async (integration) => {
          const manager = getContainerManager(integration);
          if (!manager) {
            throw toIntegrationTRPCError(
              new Error('Docker integration does not support container management'),
              'Docker operation failed',
            );
          }
          for (const id of input.ids) {
            try {
              await manager.restartContainerAsync(id);
            } catch (err) {
              throw toIntegrationTRPCError(err, `Failed to restart container ${id}`);
            }
          }
        }),
      );
    }),

  removeAll: publicProcedure
    .input(containerIdsInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const dockerIntegrations = ctx.integrations.filter(supportsDocker);
      await Promise.all(
        dockerIntegrations.map(async (integration) => {
          const manager = getContainerManager(integration);
          if (!manager) {
            throw toIntegrationTRPCError(
              new Error('Docker integration does not support container management'),
              'Docker operation failed',
            );
          }
          for (const id of input.ids) {
            try {
              await manager.removeContainerAsync(id);
            } catch (err) {
              throw toIntegrationTRPCError(err, `Failed to remove container ${id}`);
            }
          }
        }),
      );
    }),
});