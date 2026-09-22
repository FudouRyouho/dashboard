import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { DockerDashboardStats } from '@dashboard/integrations';

// --- Mock trpc module ---
vi.mock('../trpc', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>('../trpc');
  const publicProcedureMock = {
    input: vi.fn().mockReturnThis(),
    output: vi.fn().mockReturnThis(),
    query: vi.fn((fn: (args: unknown) => unknown) => ({ _query: fn })),
    mutation: vi.fn((fn: (args: unknown) => unknown) => ({ _mutation: fn })),
  };
  return {
    ...actual,
    createTRPCRouter: vi.fn((defs: Record<string, unknown>) => defs),
    publicProcedure: publicProcedureMock,
  };
});

// --- Re-import after mock setup ---
import { dockerRouter } from './docker';

// --- Helpers ---

interface MockDockerIntegration {
  publicIntegration: { id: string; name: string; kind: string };
  getDashboardStatsAsync?: () => Promise<DockerDashboardStats>;
  startContainerAsync: ReturnType<typeof vi.fn>;
  stopContainerAsync: ReturnType<typeof vi.fn>;
  restartContainerAsync: ReturnType<typeof vi.fn>;
  removeContainerAsync: ReturnType<typeof vi.fn>;
}

function makeMockIntegration(
  id = 'docker-1',
  name = 'Docker Host 1',
  hasDockerSupport = true,
): MockDockerIntegration {
  return {
    publicIntegration: { id, name, kind: 'docker' },
    getDashboardStatsAsync: hasDockerSupport
      ? vi.fn().mockResolvedValue({
          containers: { running: 0, stopped: 0, healthy: 0, unhealthy: 0, total: 0 },
          images: { total: 0, size: 0 },
          networks: { total: 0 },
          volumes: { total: 0 },
        })
      : undefined,
    startContainerAsync: vi.fn().mockResolvedValue(undefined),
    stopContainerAsync: vi.fn().mockResolvedValue(undefined),
    restartContainerAsync: vi.fn().mockResolvedValue(undefined),
    removeContainerAsync: vi.fn().mockResolvedValue(undefined),
  };
}

function makeCtx(
  overrides?: {
    integrations?: unknown[];
    storeGet?: ReturnType<typeof vi.fn>;
  },
): { ctx: Record<string, unknown>; integrations: MockDockerIntegration[] } {
  const integrations: MockDockerIntegration[] = [
    makeMockIntegration('docker-1', 'Docker Host 1'),
    makeMockIntegration('docker-2', 'Docker Host 2'),
  ];

  const storeGet =
    overrides?.storeGet ??
    vi.fn().mockImplementation((key: { taskId: string }) => {
      if (key.taskId === 'docker-1:docker') {
        return {
          data: { containers: { running: 2, stopped: 1, healthy: 1, unhealthy: 0, total: 3 } },
          obtainedAt: new Date(),
        } as unknown as DockerDashboardStats;
      }
      return undefined;
    });

  const ctx = {
    integrations: overrides?.integrations ?? (integrations.map((i) => i as unknown) as unknown[]),
    store: { get: storeGet },
  };

  return { ctx: ctx as never, integrations };
}

// --- Tests ---

describe('dockerRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContainers', () => {
    test('returns array with integration data and snapshot stats', async () => {
      const { ctx } = makeCtx();

      const result = await dockerRouter.getContainers._query({ ctx });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      expect(result[0].integration.id).toBe('docker-1');
      expect(result[0].integration.name).toBe('Docker Host 1');
      expect((result[0].stats as DockerDashboardStats).containers.running).toBe(2);
    });

    test('returns empty fallback stats when no snapshot exists', async () => {
      const { ctx } = makeCtx({
        storeGet: vi.fn().mockReturnValue(undefined),
      });

      const result = await dockerRouter.getContainers._query({ ctx });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      const stats = result[0].stats as DockerDashboardStats;
      expect(stats.containers.running).toBe(0);
      expect(stats.containers.total).toBe(0);
      expect(stats.images.total).toBe(0);
      expect(stats.volumes.total).toBe(0);
    });

    test('returns empty array when no docker integrations exist', async () => {
      const { ctx } = makeCtx({ integrations: [] });

      const result = await dockerRouter.getContainers._query({ ctx });
      expect(result).toEqual([]);
    });

    test('filters out non-docker integrations', async () => {
      const otherIntegration = {
        publicIntegration: { id: 'other-1', name: 'Other', kind: 'sonarr' },
      };
      const { ctx } = makeCtx({ integrations: [otherIntegration] });

      const result = await dockerRouter.getContainers._query({ ctx });
      expect(result).toEqual([]);
    });
  });

  describe('startAll', () => {
    test('starts all specified containers across integrations', async () => {
      const { ctx, integrations } = makeCtx();

      await dockerRouter.startAll._mutation({
        ctx,
        input: { ids: ['container-a', 'container-b'] },
      });

      expect(integrations[0].startContainerAsync).toHaveBeenCalledTimes(2);
      expect(integrations[0].startContainerAsync).toHaveBeenNthCalledWith(1, 'container-a');
      expect(integrations[0].startContainerAsync).toHaveBeenNthCalledWith(2, 'container-b');

      expect(integrations[1].startContainerAsync).toHaveBeenCalledTimes(2);
      expect(integrations[1].startContainerAsync).toHaveBeenNthCalledWith(1, 'container-a');
      expect(integrations[1].startContainerAsync).toHaveBeenNthCalledWith(2, 'container-b');
    });

    test('throws TRPCError when startContainerAsync fails', async () => {
      const { integrations } = makeCtx();
      integrations[0].startContainerAsync.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        dockerRouter.startAll._mutation({
          ctx: {
            integrations: integrations.map((i) => i as unknown) as unknown[],
            store: { get: vi.fn() },
          } as never,
          input: { ids: ['container-a'] },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError with container ID in message on failure', async () => {
      const { integrations } = makeCtx();
      integrations[0].startContainerAsync.mockRejectedValueOnce(new Error('Container not found'));

      try {
        await dockerRouter.startAll._mutation({
          ctx: {
            integrations: integrations.map((i) => i as unknown) as unknown[],
            store: { get: vi.fn() },
          } as never,
          input: { ids: ['container-x'] },
        });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).message).toContain('container-x');
      }
    });
  });

  describe('stopAll', () => {
    test('stops all specified containers across integrations', async () => {
      const { ctx, integrations } = makeCtx();

      await dockerRouter.stopAll._mutation({
        ctx,
        input: { ids: ['container-c'] },
      });

      expect(integrations[0].stopContainerAsync).toHaveBeenCalledTimes(1);
      expect(integrations[0].stopContainerAsync).toHaveBeenCalledWith('container-c');
      expect(integrations[1].stopContainerAsync).toHaveBeenCalledTimes(1);
      expect(integrations[1].stopContainerAsync).toHaveBeenCalledWith('container-c');
    });

    test('throws TRPCError when stopContainerAsync fails', async () => {
      const { integrations } = makeCtx();
      integrations[1].stopContainerAsync.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(
        dockerRouter.stopAll._mutation({
          ctx: {
            integrations: integrations.map((i) => i as unknown) as unknown[],
            store: { get: vi.fn() },
          } as never,
          input: { ids: ['container-d'] },
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('restartAll', () => {
    test('restarts all specified containers across integrations', async () => {
      const { ctx, integrations } = makeCtx();

      await dockerRouter.restartAll._mutation({
        ctx,
        input: { ids: ['container-e', 'container-f'] },
      });

      expect(integrations[0].restartContainerAsync).toHaveBeenCalledTimes(2);
      expect(integrations[0].restartContainerAsync).toHaveBeenNthCalledWith(1, 'container-e');
      expect(integrations[0].restartContainerAsync).toHaveBeenNthCalledWith(2, 'container-f');
      expect(integrations[1].restartContainerAsync).toHaveBeenCalledTimes(2);
    });

    test('throws TRPCError when restartContainerAsync fails', async () => {
      const { integrations } = makeCtx();
      integrations[0].restartContainerAsync.mockRejectedValueOnce(new Error('Container is stopping'));

      await expect(
        dockerRouter.restartAll._mutation({
          ctx: {
            integrations: integrations.map((i) => i as unknown) as unknown[],
            store: { get: vi.fn() },
          } as never,
          input: { ids: ['container-g'] },
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('removeAll', () => {
    test('removes all specified containers across integrations', async () => {
      const { ctx, integrations } = makeCtx();

      await dockerRouter.removeAll._mutation({
        ctx,
        input: { ids: ['container-h'] },
      });

      expect(integrations[0].removeContainerAsync).toHaveBeenCalledTimes(1);
      expect(integrations[0].removeContainerAsync).toHaveBeenCalledWith('container-h');
      expect(integrations[1].removeContainerAsync).toHaveBeenCalledTimes(1);
      expect(integrations[1].removeContainerAsync).toHaveBeenCalledWith('container-h');
    });

    test('throws TRPCError when removeContainerAsync fails', async () => {
      const { integrations } = makeCtx();
      integrations[1].removeContainerAsync.mockRejectedValueOnce(new Error('Container is running'));

      await expect(
        dockerRouter.removeAll._mutation({
          ctx: {
            integrations: integrations.map((i) => i as unknown) as unknown[],
            store: { get: vi.fn() },
          } as never,
          input: { ids: ['container-i'] },
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
