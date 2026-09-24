import { describe, test, expect, vi } from 'vitest';
import { downloadsRouter } from './downloads';
import {
  createTestIntegration,
  createTestTRPCContext,
  errorFixtures,
} from '@dashboard/testing-utils';

describe('downloadsRouter', () => {
  describe('getAllJobs', () => {
    test('returns jobs from all download client integrations', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.getAllJobs({ limit: 50 });
      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('qbittorrent-1');
    });

    test('returns empty array when no download clients', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = downloadsRouter.createCaller(ctx);
      const result = await caller.getAllJobs({});
      expect(result).toEqual([]);
    });
  });

  describe('getJobs', () => {
    test('returns jobs for specific integration', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.getJobs({ integrationId: 'qbittorrent-1' });
      expect(result).toBeDefined();
    });

    test('throws when integration not found', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = downloadsRouter.createCaller(ctx);
      await expect(caller.getJobs({ integrationId: 'nonexistent' })).rejects.toThrow();
    });
  });

  describe('pauseQueue', () => {
    test('pauses queue successfully', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.pauseQueue({ integrationId: 'qbittorrent-1' });
      expect(result).toEqual({ success: true });
      expect(integration.pauseQueueAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('pauseItem', () => {
    test('pauses item successfully', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.pauseItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123' });
      expect(result).toEqual({ success: true });
      expect(integration.pauseItemAsync).toHaveBeenCalledTimes(1);
      expect(integration.pauseItemAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'abc123', type: 'torrent' })
      );
    });
  });

  describe('resumeQueue', () => {
    test('resumes queue successfully', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.resumeQueue({ integrationId: 'qbittorrent-1' });
      expect(result).toEqual({ success: true });
      expect(integration.resumeQueueAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('resumeItem', () => {
    test('resumes item successfully', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.resumeItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123' });
      expect(result).toEqual({ success: true });
      expect(integration.resumeItemAsync).toHaveBeenCalledTimes(1);
      expect(integration.resumeItemAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'abc123', type: 'torrent' })
      );
    });
  });

  describe('deleteItem', () => {
    test('deletes item without disk successfully', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.deleteItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123' });
      expect(result).toEqual({ success: true });
      expect(integration.deleteItemAsync).toHaveBeenCalledTimes(1);
      expect(integration.deleteItemAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'abc123', type: 'torrent' }),
        false
      );
    });

    test('deletes item with fromDisk option', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-1',
        name: 'qBittorrent 1',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);

      await caller.deleteItem({ integrationId: 'qbittorrent-1', torrentHash: 'abc123', fromDisk: true });
      expect(integration.deleteItemAsync).toHaveBeenCalledTimes(1);
      expect(integration.deleteItemAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'abc123', type: 'torrent' }),
        true
      );
    });
  });

  describe('getAllJobs with partial failure', () => {
    test('returns jobs from working integrations when one fails', async () => {
      const failingIntegration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-fail',
        name: 'Failing QBittorrent',
        getClientJobsAndStatusAsync: vi.fn().mockRejectedValue(new Error('Connection refused')),
      });
      const successIntegration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-ok',
        name: 'Working QBittorrent',
      });

      const ctx = createTestTRPCContext({ integrations: [failingIntegration, successIntegration] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.getAllJobs({ limit: 50 });
      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('qbittorrent-ok');
    });

    test('returns empty array when all integrations fail', async () => {
      const failingIntegration1 = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-fail-1',
        name: 'Failing 1',
        getClientJobsAndStatusAsync: vi.fn().mockRejectedValue(new Error('Error 1')),
      });
      const failingIntegration2 = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-fail-2',
        name: 'Failing 2',
        getClientJobsAndStatusAsync: vi.fn().mockRejectedValue(new Error('Error 2')),
      });

      const ctx = createTestTRPCContext({ integrations: [failingIntegration1, failingIntegration2] });
      const caller = downloadsRouter.createCaller(ctx);

      const result = await caller.getAllJobs({ limit: 50 });
      expect(result).toEqual([]);
    });
  });

  describe('Edge cases (QA validation)', () => {
    test('getJobs with a non-existent integrationId throws', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = downloadsRouter.createCaller(ctx);
      await expect(caller.getJobs({ integrationId: 'does-not-exist' })).rejects.toThrow();
    });

    test('pauseQueue on a missing integration throws', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = downloadsRouter.createCaller(ctx);
      await expect(caller.pauseQueue({ integrationId: 'ghost' })).rejects.toThrow();
    });

    test('getJobs when getClientJobsAndStatusAsync rejects with IntegrationError', async () => {
      const integration = createTestIntegration('qbittorrent', {
        id: 'qbittorrent-unauth',
        name: 'Unauthorized QB',
        getClientJobsAndStatusAsync: vi.fn().mockRejectedValue(
          errorFixtures.integration.unauthorized('Bad API key'),
        ),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = downloadsRouter.createCaller(ctx);
      await expect(caller.getJobs({ integrationId: 'qbittorrent-unauth' })).rejects.toThrow();
    });

    test('deleteItem on a missing integration throws', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = downloadsRouter.createCaller(ctx);
      await expect(
        caller.deleteItem({ integrationId: 'ghost', torrentHash: 'abc123' }),
      ).rejects.toThrow();
    });
  });
});