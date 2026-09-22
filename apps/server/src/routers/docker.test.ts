import { describe, test, expect, vi } from 'vitest';
import type { DockerDashboardStats } from '@dashboard/integrations';
import { dockerRouter } from './docker';
import type { TRPCContext } from '../trpc';

function createMockDockerIntegration(id: string, name: string, stats?: DockerDashboardStats): any {
  return {
    publicIntegration: { id, name, kind: 'docker' as const, url: `http://${id}:2375` },
    getDashboardStatsAsync: vi.fn().mockResolvedValue(stats ?? {
      containers: { running: 0, stopped: 0, healthy: 0, unhealthy: 0, total: 0 },
      images: { total: 0, size: 0 },
      networks: { total: 0 },
      volumes: { total: 0 },
    }),
    startContainerAsync: vi.fn().mockResolvedValue(undefined),
    stopContainerAsync: vi.fn().mockResolvedValue(undefined),
    restartContainerAsync: vi.fn().mockResolvedValue(undefined),
    removeContainerAsync: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockCtx(integrations: any[], snapshot?: any): TRPCContext {
  const storeGet = vi.fn(() => snapshot);
  return {
    integrations,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    store: { get: storeGet, set: vi.fn() },
    runLog: { record: vi.fn(), last: vi.fn(), forTask: vi.fn(), list: vi.fn() },
    db: {} as any,
  };
}

describe('dockerRouter', () => {
  describe('getContainers', () => {
    test('returns containers from snapshot when available', async () => {
      const stats: DockerDashboardStats = {
        containers: { running: 2, stopped: 1, healthy: 1, unhealthy: 0, total: 3 },
        images: { total: 5, size: 1024 },
        networks: { total: 2 },
        volumes: { total: 3 },
      };
      const integration = createMockDockerIntegration('docker-1', 'Docker Host 1', stats);
      const ctx = createMockCtx([integration], { data: stats, obtainedAt: new Date() });
      const caller = dockerRouter.createCaller(ctx);
      const result = await caller.getContainers();

      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('docker-1');
      expect(result[0]!.stats).toEqual(stats);
    });

    test('returns empty array when no integrations support Docker', async () => {
      const ctx = createMockCtx([]);
      const caller = dockerRouter.createCaller(ctx);
      const result = await caller.getContainers();
      expect(result).toEqual([]);
    });

    test('returns empty stats when no snapshot exists', async () => {
      const integration = createMockDockerIntegration('docker-1', 'Docker Host 1');
      const ctx = createMockCtx([integration], undefined);
      const caller = dockerRouter.createCaller(ctx);
      const result = await caller.getContainers();
      // Router returns empty stats object when no snapshot, not empty array
      expect(result).toHaveLength(1);
      expect(result[0]!.stats.containers.total).toBe(0);
    });
  });

  describe('startAll', () => {
    test('starts all containers successfully', async () => {
      const integration = createMockDockerIntegration('docker-1', 'Docker Host 1');
      const ctx = createMockCtx([integration]);
      const caller = dockerRouter.createCaller(ctx);

      await caller.startAll({ ids: ['container-1', 'container-2'] });
      expect(integration.startContainerAsync).toHaveBeenCalledWith('container-1');
      expect(integration.startContainerAsync).toHaveBeenCalledWith('container-2');
    });
  });

  describe('stopAll', () => {
    test('stops all containers successfully', async () => {
      const integration = createMockDockerIntegration('docker-1', 'Docker Host 1');
      const ctx = createMockCtx([integration]);
      const caller = dockerRouter.createCaller(ctx);

      await caller.stopAll({ ids: ['container-1'] });
      expect(integration.stopContainerAsync).toHaveBeenCalledWith('container-1');
    });
  });

  describe('restartAll', () => {
    test('restarts all containers successfully', async () => {
      const integration = createMockDockerIntegration('docker-1', 'Docker Host 1');
      const ctx = createMockCtx([integration]);
      const caller = dockerRouter.createCaller(ctx);

      await caller.restartAll({ ids: ['container-1'] });
      expect(integration.restartContainerAsync).toHaveBeenCalledWith('container-1');
    });
  });

  describe('removeAll', () => {
    test('removes all containers successfully', async () => {
      const integration = createMockDockerIntegration('docker-1', 'Docker Host 1');
      const ctx = createMockCtx([integration]);
      const caller = dockerRouter.createCaller(ctx);

      await caller.removeAll({ ids: ['container-1'] });
      expect(integration.removeContainerAsync).toHaveBeenCalledWith('container-1');
    });
  });
});
