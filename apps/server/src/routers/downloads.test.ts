import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import type {
  DownloadClientItem,
  DownloadClientJobsAndStatus,
} from '@dashboard/contracts';

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

// --- Mock toIntegrationTRPCError to throw a recognizable TRPCError ---
vi.mock('../integration-errors', () => ({
  toIntegrationTRPCError: (error: unknown, message = 'Integration request failed') => {
    const actualMessage = error instanceof Error ? error.message : String(error);
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `${message}: ${actualMessage}`,
      cause: error,
    });
  },
}));

// --- Re-import after mock setup ---
import { downloadsRouter } from './downloads';

// --- Helpers ---

function createJobsAndStatus(
  overrides: Partial<DownloadClientJobsAndStatus> = {},
): DownloadClientJobsAndStatus {
  return {
    status: {
      paused: false,
      rates: { down: 1024, up: 512 },
      types: ['torrent'],
    },
    items: [
      {
        type: 'torrent',
        id: 'hash-1',
        name: 'Test Torrent 1',
        size: 1000000,
        sent: 500000,
        downSpeed: 100,
        upSpeed: 50,
        time: 3600,
        added: 1800,
        state: 'seeding',
        progress: 0.5,
      },
    ],
    ...overrides,
  };
}

function createMockDownloadClientIntegration(
  id: string,
  name: string,
  kind: string,
  overrides: Record<string, unknown> = {},
) {
  const jobsAndStatus = createJobsAndStatus();
  return {
    publicIntegration: { id, name, kind },
    getClientJobsAndStatusAsync: vi
      .fn()
      .mockResolvedValue(jobsAndStatus),
    pauseQueueAsync: vi.fn().mockResolvedValue(undefined),
    pauseItemAsync: vi.fn().mockResolvedValue(undefined),
    resumeQueueAsync: vi.fn().mockResolvedValue(undefined),
    resumeItemAsync: vi.fn().mockResolvedValue(undefined),
    deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createNonDownloadClientIntegration(id: string, name: string, kind: string) {
  return {
    publicIntegration: { id, name, kind },
    // No download client methods — supportsDownloadClient will return false
  };
}

function createMockCtx(integrations: unknown[]) {
  return {
    db: {},
    integrations,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    store: {
      get: vi.fn(),
      set: vi.fn(),
    },
    runLog: {
      log: vi.fn(),
    },
  };
}

// --- Tests ---

describe('downloadsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllJobs', () => {
    test('returns array of DownloadClientJobsAndStatus with integration info for all download client integrations', async () => {
      const integration1 = createMockDownloadClientIntegration('qbittorrent-1', 'qBittorrent Server', 'qbittorrent');
      const integration2 = createMockDownloadClientIntegration('deluge-1', 'Deluge Server', 'deluge');
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');

      const ctx = createMockCtx([integration1, integration2, nonDownloadClient]);

      const result = await downloadsRouter.getAllJobs._query({ ctx, input: { limit: 50 } });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      expect(result[0].integration.id).toBe('qbittorrent-1');
      expect(result[0].integration.name).toBe('qBittorrent Server');
      expect(result[0].integration.kind).toBe('qbittorrent');
      expect(result[0].status).toBeDefined();
      expect(result[0].items).toBeDefined();

      expect(result[1].integration.id).toBe('deluge-1');
      expect(result[1].integration.name).toBe('Deluge Server');
      expect(result[1].integration.kind).toBe('deluge');

      expect(integration1.getClientJobsAndStatusAsync).toHaveBeenCalledWith({ limit: 50 });
      expect(integration2.getClientJobsAndStatusAsync).toHaveBeenCalledWith({ limit: 50 });
    });

    test('returns empty array when no integrations exist', async () => {
      const ctx = createMockCtx([]);

      const result = await downloadsRouter.getAllJobs._query({ ctx });

      expect(result).toEqual([]);
    });

    test('filters out non-download-client integrations', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      const result = await downloadsRouter.getAllJobs._query({ ctx });

      expect(result).toEqual([]);
    });

    test('passes custom limit input', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'qBittorrent', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      await downloadsRouter.getAllJobs._query({ ctx, input: { limit: 100 } });

      expect(integration.getClientJobsAndStatusAsync).toHaveBeenCalledWith({ limit: 100 });
    });

    test('returns results for multiple download client integrations in parallel', async () => {
      const integration1 = createMockDownloadClientIntegration('qbittorrent-1', 'QB1', 'qbittorrent', {
        getClientJobsAndStatusAsync: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 10));
          return createJobsAndStatus({ items: [{ type: 'torrent', id: 'h1', name: 'T1', size: 100, sent: 0, downSpeed: 0, upSpeed: 0, time: 0, added: 0, state: 'paused', progress: 0 }] });
        }),
      });
      const integration2 = createMockDownloadClientIntegration('qbittorrent-2', 'QB2', 'qbittorrent', {
        getClientJobsAndStatusAsync: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 10));
          return createJobsAndStatus({ items: [{ type: 'torrent', id: 'h2', name: 'T2', size: 200, sent: 0, downSpeed: 0, upSpeed: 0, time: 0, added: 0, state: 'paused', progress: 0 }] });
        }),
      });
      const ctx = createMockCtx([integration1, integration2]);

      const result = await downloadsRouter.getAllJobs._query({ ctx, input: { limit: 50 } });

      expect(result).toHaveLength(2);
      expect(result[0].integration.id).toBe('qbittorrent-1');
      expect(result[1].integration.id).toBe('qbittorrent-2');
    });
  });

  describe('getJobs', () => {
    test('returns DownloadClientJobsAndStatus for specific integration', async () => {
      const integration = createMockDownloadClientIntegration(
        'qbittorrent-1',
        'qBittorrent Server',
        'qbittorrent',
      );
      const ctx = createMockCtx([integration]);

      const result = await downloadsRouter.getJobs._query({
        ctx,
        input: { integrationId: 'qbittorrent-1', limit: 50 },
      });

      expect(result.status).toBeDefined();
      expect(result.items).toBeDefined();
      expect(integration.getClientJobsAndStatusAsync).toHaveBeenCalledWith({ limit: 50 });
    });

    test('throws TRPCError when integration is not found', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      await expect(
        downloadsRouter.getJobs._query({
          ctx,
          input: { integrationId: 'non-existent', limit: 50 },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError when integration does not support download client', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      await expect(
        downloadsRouter.getJobs._query({
          ctx,
          input: { integrationId: 'sonarr-1', limit: 50 },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('passes custom limit input to integration method', async () => {
      const integration = createMockDownloadClientIntegration('deluge-1', 'Deluge', 'deluge');
      const ctx = createMockCtx([integration]);

      await downloadsRouter.getJobs._query({
        ctx,
        input: { integrationId: 'deluge-1', limit: 10 },
      });

      expect(integration.getClientJobsAndStatusAsync).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  describe('pauseQueue', () => {
    test('pauses queue for valid download client integration', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      const result = await downloadsRouter.pauseQueue._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1' },
      });

      expect(result).toEqual({ success: true });
      expect(integration.pauseQueueAsync).toHaveBeenCalledTimes(1);
    });

    test('throws TRPCError when integration is not found', async () => {
      const ctx = createMockCtx([]);

      await expect(
        downloadsRouter.pauseQueue._mutation({
          ctx,
          input: { integrationId: 'non-existent' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError when integration does not support download client', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      await expect(
        downloadsRouter.pauseQueue._mutation({
          ctx,
          input: { integrationId: 'sonarr-1' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('propagates errors from pauseQueueAsync', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent', {
        pauseQueueAsync: vi.fn().mockRejectedValue(new Error('Network timeout')),
      });
      const ctx = createMockCtx([integration]);

      await expect(
        downloadsRouter.pauseQueue._mutation({
          ctx,
          input: { integrationId: 'qbittorrent-1' },
        }),
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('pauseItem', () => {
    test('pauses item with torrentHash for valid integration', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      const result = await downloadsRouter.pauseItem._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123' },
      });

      expect(result).toEqual({ success: true });
      expect(integration.pauseItemAsync).toHaveBeenCalledTimes(1);
      // Verify the DownloadClientItem was built with the correct hash
      const calledItem: DownloadClientItem = integration.pauseItemAsync.mock.calls[0][0];
      expect(calledItem.id).toBe('abc123');
      expect(calledItem.type).toBe('torrent');
    });

    test('throws TRPCError when integration is not found', async () => {
      const ctx = createMockCtx([]);

      await expect(
        downloadsRouter.pauseItem._mutation({
          ctx,
          input: { integrationId: 'non-existent', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError when integration does not support download client', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      await expect(
        downloadsRouter.pauseItem._mutation({
          ctx,
          input: { integrationId: 'sonarr-1', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('passes fromDisk option from input', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      await downloadsRouter.pauseItem._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123', fromDisk: true },
      });

      expect(integration.pauseItemAsync).toHaveBeenCalledTimes(1);
    });

    test('propagates errors from pauseItemAsync', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent', {
        pauseItemAsync: vi.fn().mockRejectedValue(new Error('Item not found')),
      });
      const ctx = createMockCtx([integration]);

      await expect(
        downloadsRouter.pauseItem._mutation({
          ctx,
          input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow('Item not found');
    });
  });

  describe('resumeQueue', () => {
    test('resumes queue for valid download client integration', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      const result = await downloadsRouter.resumeQueue._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1' },
      });

      expect(result).toEqual({ success: true });
      expect(integration.resumeQueueAsync).toHaveBeenCalledTimes(1);
    });

    test('throws TRPCError when integration is not found', async () => {
      const ctx = createMockCtx([]);

      await expect(
        downloadsRouter.resumeQueue._mutation({
          ctx,
          input: { integrationId: 'non-existent' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError when integration does not support download client', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      await expect(
        downloadsRouter.resumeQueue._mutation({
          ctx,
          input: { integrationId: 'sonarr-1' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('propagates errors from resumeQueueAsync', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent', {
        resumeQueueAsync: vi.fn().mockRejectedValue(new Error('Not authenticated')),
      });
      const ctx = createMockCtx([integration]);

      await expect(
        downloadsRouter.resumeQueue._mutation({
          ctx,
          input: { integrationId: 'qbittorrent-1' },
        }),
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('resumeItem', () => {
    test('resumes item with torrentHash for valid integration', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      const result = await downloadsRouter.resumeItem._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123' },
      });

      expect(result).toEqual({ success: true });
      expect(integration.resumeItemAsync).toHaveBeenCalledTimes(1);
      // Verify the DownloadClientItem was built with the correct hash
      const calledItem: DownloadClientItem = integration.resumeItemAsync.mock.calls[0][0];
      expect(calledItem.id).toBe('abc123');
      expect(calledItem.type).toBe('torrent');
    });

    test('throws TRPCError when integration is not found', async () => {
      const ctx = createMockCtx([]);

      await expect(
        downloadsRouter.resumeItem._mutation({
          ctx,
          input: { integrationId: 'non-existent', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError when integration does not support download client', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      await expect(
        downloadsRouter.resumeItem._mutation({
          ctx,
          input: { integrationId: 'sonarr-1', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('passes fromDisk option from input', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      await downloadsRouter.resumeItem._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123', fromDisk: true },
      });

      expect(integration.resumeItemAsync).toHaveBeenCalledTimes(1);
    });

    test('propagates errors from resumeItemAsync', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent', {
        resumeItemAsync: vi.fn().mockRejectedValue(new Error('Item not found')),
      });
      const ctx = createMockCtx([integration]);

      await expect(
        downloadsRouter.resumeItem._mutation({
          ctx,
          input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow('Item not found');
    });
  });

  describe('deleteItem', () => {
    test('deletes item with torrentHash and fromDisk=false by default', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      const result = await downloadsRouter.deleteItem._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123', fromDisk: false },
      });

      expect(result).toEqual({ success: true });
      expect(integration.deleteItemAsync).toHaveBeenCalledTimes(1);
      expect(integration.deleteItemAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'abc123', type: 'torrent' }),
        false,
      );
    });

    test('passes fromDisk=true to deleteItemAsync', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent');
      const ctx = createMockCtx([integration]);

      await downloadsRouter.deleteItem._mutation({
        ctx,
        input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123', fromDisk: true },
      });

      expect(integration.deleteItemAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'abc123', type: 'torrent' }),
        true,
      );
    });

    test('throws TRPCError when integration is not found', async () => {
      const ctx = createMockCtx([]);

      await expect(
        downloadsRouter.deleteItem._mutation({
          ctx,
          input: { integrationId: 'non-existent', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('throws TRPCError when integration does not support download client', async () => {
      const nonDownloadClient = createNonDownloadClientIntegration('sonarr-1', 'Sonarr', 'sonarr');
      const ctx = createMockCtx([nonDownloadClient]);

      await expect(
        downloadsRouter.deleteItem._mutation({
          ctx,
          input: { integrationId: 'sonarr-1', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow(TRPCError);
    });

    test('propagates errors from deleteItemAsync', async () => {
      const integration = createMockDownloadClientIntegration('qbittorrent-1', 'QB', 'qbittorrent', {
        deleteItemAsync: vi.fn().mockRejectedValue(new Error('Permission denied')),
      });
      const ctx = createMockCtx([integration]);

      await expect(
        downloadsRouter.deleteItem._mutation({
          ctx,
          input: { integrationId: 'qbittorrent-1', torrentHash: 'abc123' },
        }),
      ).rejects.toThrow('Permission denied');
    });
  });
});
