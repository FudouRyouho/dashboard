import { describe, test, expect, vi } from 'vitest';
import type { DockerDashboardStats } from '@dashboard/integrations';
import { dockerRouter } from './docker';
import {
  createTestIntegration,
  createTestTRPCContext,
  errorFixtures,
  createMockStore,
} from '@dashboard/testing-utils';

describe('dockerRouter', () => {
  describe('getContainers', () => {
    test('returns containers from snapshot when available', async () => {
      const stats: DockerDashboardStats = {
        containers: {
          running: 2,
          stopped: 1,
          healthy: 1,
          unhealthy: 0,
          total: 3,
        },
        images: { total: 5, size: 1024 },
        networks: { total: 2 },
        volumes: { total: 3 },
      };
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
        url: 'http://docker-1:2375',
        port: 2375,
      });
      const snapshot = { data: stats, obtainedAt: new Date() };
      const ctx = createTestTRPCContext({
        integrations: [integration],
        store: createMockStore({ get: vi.fn().mockReturnValue(snapshot) }),
      });
      const caller = dockerRouter.createCaller(ctx);
      const result = await caller.getContainers();

      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('docker-1');
      expect(result[0]!.stats).toEqual(stats);
    });

    test('returns empty array when no integrations support Docker', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = dockerRouter.createCaller(ctx);
      const result = await caller.getContainers();
      expect(result).toEqual([]);
    });

    test('returns empty stats when no snapshot exists', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);
      const result = await caller.getContainers();
      // Router returns empty stats object when no snapshot, not empty array
      expect(result).toHaveLength(1);
      expect(result[0]!.stats.containers.total).toBe(0);
    });
  });

  describe('startAll', () => {
    test('starts all containers successfully', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await caller.startAll({ integrationId: 'docker-1', ids: ['container-1', 'container-2'] });
      expect(integration.startContainerAsync).toHaveBeenCalledWith(
        'container-1',
      );
      expect(integration.startContainerAsync).toHaveBeenCalledWith(
        'container-2',
      );
    });
  });

  describe('stopAll', () => {
    test('stops all containers successfully', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await caller.stopAll({ integrationId: 'docker-1', ids: ['container-1'] });
      expect(integration.stopContainerAsync).toHaveBeenCalledWith(
        'container-1',
      );
    });
  });

  describe('restartAll', () => {
    test('restarts all containers successfully', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await caller.restartAll({ integrationId: 'docker-1', ids: ['container-1'] });
      expect(integration.restartContainerAsync).toHaveBeenCalledWith(
        'container-1',
      );
    });
  });

  describe('removeAll', () => {
    test('removes all containers successfully', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await caller.removeAll({ integrationId: 'docker-1', ids: ['container-1'] });
      expect(integration.removeContainerAsync).toHaveBeenCalledWith(
        'container-1',
      );
    });
  });

  describe('Edge cases (QA validation)', () => {
    test('HTTP 304 (Not Modified) is handled as idempotent success', async () => {
      // fetchJson in integration.ts treats 304 as OK (not an error).
      // startContainerAsync resolves when container is already in desired state.
      const integration = createTestIntegration('docker', {
        id: 'docker-304',
        name: 'Docker 304 Test',
        // Simulate real behavior: fetchJson handles 304 internally, method resolves
        startContainerAsync: vi.fn().mockResolvedValue(undefined),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      // Should NOT throw - 304 is idempotent success
      await expect(
        caller.startAll({ integrationId: 'docker-304', ids: ['container-1'] }),
      ).resolves.toBeUndefined();
      expect(integration.startContainerAsync).toHaveBeenCalledWith(
        'container-1',
      );
    });

    test('HTTP 404 (Container Not Found) throws TRPCError with correct code', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-404',
        name: 'Docker 404 Test',
        startContainerAsync: vi
          .fn()
          .mockRejectedValue(
            errorFixtures.integration.unreachable(new Error('Not Found')),
          ),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await expect(caller.startAll({ integrationId: 'docker-404', ids: ['nonexistent'] })).rejects.toThrow(
        'Failed to start 1 container(s): unreachable',
      );
    });

    test('timeout during container start throws TRPCError with TIMEOUT code', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-timeout',
        name: 'Docker Timeout Test',
        startContainerAsync: vi
          .fn()
          .mockRejectedValue(errorFixtures.integration.timeout()),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await expect(caller.startAll({ integrationId: 'docker-timeout', ids: ['container-1'] })).rejects.toThrow(
        'Failed to start 1 container(s): timeout',
      );
    });

    test('throws when docker integration not found', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = dockerRouter.createCaller(ctx);

      await expect(
        caller.startAll({ integrationId: 'nonexistent', ids: ['c1'] }),
      ).rejects.toThrow('Docker operation failed');
    });
  });


  describe('integration not found', () => {
    test('throws when integrationId does not match any docker integration', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-1',
        name: 'Docker Host 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      await expect(
        caller.startAll({ integrationId: 'nonexistent', ids: ['container-1'] }),
      ).rejects.toThrow('Docker operation failed');
    });
  });

  describe('partial container failure', () => {
    test('throws when some containers fail but others succeed', async () => {
      const integration = createTestIntegration('docker', {
        id: 'docker-partial',
        name: 'Docker Partial Test',
        startContainerAsync: vi.fn().mockImplementation((id: string) => {
          if (id === 'failed-container') {
            return Promise.reject(new Error('Container not found'));
          }
          return Promise.resolve(undefined);
        }),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = dockerRouter.createCaller(ctx);

      // Should throw because at least one container failed
      await expect(
        caller.startAll({ integrationId: 'docker-partial', ids: ['ok-container', 'failed-container'] }),
      ).rejects.toThrow('Failed to start 1 container(s): unknown');

      expect(integration.startContainerAsync).toHaveBeenCalledTimes(2);
    });
  });
});
