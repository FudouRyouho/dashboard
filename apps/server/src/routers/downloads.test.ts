import { describe, test, expect, vi } from 'vitest';
import { downloadsRouter } from './downloads';
import type { TRPCContext } from '../trpc';

function createMockDownloadIntegration(id: string, name: string): any {
  return {
    publicIntegration: { id, name, kind: 'qbittorrent' as const, url: `http://${id}:8080` },
    getClientJobsAndStatusAsync: vi.fn().mockResolvedValue({
      status: { paused: false, rates: { down: 0, up: 0 }, types: ['torrent'] as const },
      items: [],
    }),
    pauseQueueAsync: vi.fn().mockResolvedValue(undefined),
    pauseItemAsync: vi.fn().mockResolvedValue(undefined),
    resumeQueueAsync: vi.fn().mockResolvedValue(undefined),
    resumeItemAsync: vi.fn().mockResolvedValue(undefined),
    deleteItemAsync: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockCtx(integrations: any[]): TRPCContext {
  return {
    integrations,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    store: { get: vi.fn(), set: vi.fn() },
    runLog: { record: vi.fn(), last: vi.fn(), forTask: vi.fn(), list: vi.fn() },
    db: {} as any,
  };
}

describe('downloadsRouter', () => {
  describe('getAllJobs', () => {
    test('returns jobs from all download client integrations', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.getAllJobs({ limit: 50 });
      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('qbittorrent-1');
    });

    test('returns empty array when no download clients', async () => {
      const ctx = createMockCtx([]);
      const caller = downloadsRouter.createCaller(ctx);
      const result = await caller.getAllJobs({});
      expect(result).toEqual([]);
    });
  });

  describe('getJobs', () => {
    test('returns jobs for specific integration', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.getJobs({ integrationId: 'qbittorrent-1' });
      expect(result).toBeDefined();
    });

    test('throws when integration not found', async () => {
      const ctx = createMockCtx([]);
      const caller = downloadsRouter.createCaller(ctx);
      await expect(caller.getJobs({ integrationId: 'nonexistent' })).rejects.toThrow();
    });
  });

  describe('pauseQueue', () => {
    test('pauses queue successfully', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.pauseQueue({ integrationId: 'qbittorrent-1' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('pauseItem', () => {
    test('pauses item successfully', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.pauseItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('resumeQueue', () => {
    test('resumes queue successfully', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.resumeQueue({ integrationId: 'qbittorrent-1' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('resumeItem', () => {
    test('resumes item successfully', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.resumeItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteItem', () => {
    test('deletes item without disk successfully', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.deleteItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123' });
      expect(result).toEqual({ success: true });
    });

    test('deletes item with fromDisk option', async () => {
      const integration = createMockDownloadIntegration('qbittorrent-1', 'qBittorrent 1');
      const ctx = createMockCtx([integration]);
      const caller = downloadsRouter.createCaller(ctx);

      await caller.deleteItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123', fromDisk: true });
    });
  });
});
