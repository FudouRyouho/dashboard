import { describe, test, expect, vi, beforeEach } from 'vitest';
import { integrationsRouter } from './integrations';
import type { TRPCContext } from '../trpc';

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

function createMockCtx(integrations: any[]): TRPCContext {
  return {
    integrations,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    store: { get: vi.fn(), set: vi.fn() },
    runLog: { record: vi.fn(), last: vi.fn(), forTask: vi.fn(), list: vi.fn() },
    db: createMockDb() as any,
  };
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
      });
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    test('deletes integration by id', async () => {
      const ctx = createMockCtx([]);
      const caller = integrationsRouter.createCaller(ctx);
      await expect(caller.delete({ id: 'test-id' })).resolves.toBeUndefined();
    });
  });
});
