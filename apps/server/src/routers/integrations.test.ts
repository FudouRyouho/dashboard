import { describe, test, expect, vi, beforeEach } from 'vitest';
import { integrationsRouter } from './integrations';
import {
  createTestTRPCContext,
} from '@dashboard/testing-utils';
let selectCallCount = 0;
function createMockDb() {
  const baseChain = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    // Make it thenable (like drizzle query builder)
    then: vi.fn().mockImplementation((onFulfilled) => {
      if (selectCallCount === 1) {
        return onFulfilled([]);
      }
      return onFulfilled([{
        id: 'test-id', kind: 'sonarr', name: 'Test', url: 'http://localhost',
        apiKey: null, username: null, password: null, port: null, externalUrl: null,
        createdAt: new Date(), updatedAt: new Date(),
      }]);
    }),
    get: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue({ changes: 1 }),
  };
  return {
    select: vi.fn(() => {
      selectCallCount++;
      return baseChain;
    }),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'test-id', kind: 'sonarr', name: 'Test', url: 'http://localhost',
          apiKey: null, username: null, password: null, port: null, externalUrl: null,
          createdAt: new Date(), updatedAt: new Date(),
        }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ changes: 1 }),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ changes: 1 }),
      }),
    })),
  };
}

function createMockCtx(integrations: any[]) {
  return createTestTRPCContext({
    integrations,
    db: createMockDb() as any,
  });
}

describe('integrationsRouter', () => {
  beforeEach(() => {
    selectCallCount = 0;
  });

  describe('list', () => {
    test('returns empty array when no integrations', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      const result = await caller.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('get', () => {
    test('returns null when integration not found', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      const result = await caller.get({ id: 'test-id' });
      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    test('accepts sonarr integration', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      const result = await caller.upsert({
        id: 'sonarr-1',
        kind: 'sonarr' as const,
        name: 'Sonarr',
        url: 'http://localhost:8989',
        apiKey: 'test-key',
      });
      expect(result).toBeDefined();
    });

    test('accepts qbittorrent with username/password', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      const result = await caller.upsert({
        id: 'qbittorrent-1',
        kind: 'qbittorrent' as const,
        name: 'qBittorrent',
        url: 'http://localhost:8080',
        username: 'admin',
        password: 'secret',
      } as any);
      expect(result).toBeDefined();
    });

    test('rejects qbittorrent with apiKey', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'qbittorrent-1',
          kind: 'qbittorrent' as const,
          name: 'qBittorrent',
          url: 'http://localhost:8080',
          apiKey: 'invalid-key',
        } as any),
      ).rejects.toThrow();
    });

    test('rejects sonarr without apiKey', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'sonarr-1',
          kind: 'sonarr' as const,
          name: 'Sonarr',
          url: 'http://localhost:8989',
        } as any),
      ).rejects.toThrow();
    });

    test('rejects radarr without apiKey', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'radarr-1',
          kind: 'radarr' as const,
          name: 'Radarr',
          url: 'http://localhost:7878',
        } as any),
      ).rejects.toThrow();
    });

    test('rejects jellyfin without apiKey', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'jellyfin-1',
          kind: 'jellyfin' as const,
          name: 'Jellyfin',
          url: 'http://localhost:8096',
        } as any),
      ).rejects.toThrow();
    });

    test('accepts docker without secrets', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      const result = await caller.upsert({
        id: 'docker-1',
        kind: 'docker' as const,
        name: 'Docker',
        url: 'http://localhost:2375',
      } as any);
      expect(result).toBeDefined();
    });

    test('accepts prometheus without secrets', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      const result = await caller.upsert({
        id: 'prometheus-1',
        kind: 'prometheus' as const,
        name: 'Prometheus',
        url: 'http://localhost:9090',
      } as any);
      expect(result).toBeDefined();
    });

    test('rejects docker with apiKey', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'docker-1',
          kind: 'docker' as const,
          name: 'Docker',
          url: 'http://localhost:2375',
          apiKey: 'invalid',
        } as any),
      ).rejects.toThrow();
    });

    test('rejects prometheus with apiKey', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'prometheus-1',
          kind: 'prometheus' as const,
          name: 'Prometheus',
          url: 'http://localhost:9090',
          apiKey: 'invalid',
        } as any),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    test('deletes integration by id', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(caller.delete({ id: 'test-id' })).resolves.toBeUndefined();
    });
  });

  describe('Edge cases (QA validation)', () => {
    test('rejects docker upsert with username field (strict schema)', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'docker-1',
          kind: 'docker' as const,
          name: 'Docker',
          url: 'http://localhost:2375',
          username: 'invalid-field',
        } as any),
      ).rejects.toThrow();
    });

    test('rejects prometheus upsert with password field (strict schema)', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(
        caller.upsert({
          id: 'prometheus-1',
          kind: 'prometheus' as const,
          name: 'Prometheus',
          url: 'http://localhost:9090',
          password: 'invalid-field',
        } as any),
      ).rejects.toThrow();
    });
  });
});