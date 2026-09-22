import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { IntegrationKind } from '@dashboard/contracts';

// --- Mock trpc module ---
vi.mock('../trpc', async (importOriginal) => {
  const actual = await importOriginal('../trpc');
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

// --- Mock db module ---
const mockDbModule = vi.hoisted(() => ({
  getAllIntegrations: vi.fn(),
  getIntegrationById: vi.fn(),
  upsertIntegration: vi.fn(),
  deleteIntegration: vi.fn(),
}));

vi.mock('@dashboard/db', () => mockDbModule);

// --- Re-import after mock setup ---
import { integrationsRouter } from './integrations';

// --- Helpers ---

function createIntegration(
  id: string,
  kind: IntegrationKind,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    kind,
    name: `${kind}-test`,
    url: `http://localhost:8000`,
    externalUrl: null,
    apiKey: 'test-key',
    port: 8000,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeMockCtx() {
  return {
    db: {},
    integrations: [],
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

describe('integrationsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list procedure', () => {
    test('returns all integrations from database', async () => {
      const integrations = [
        createIntegration('id-1', 'sonarr'),
        createIntegration('id-2', 'radarr'),
        createIntegration('id-3', 'jellyfin'),
      ];

      mockDbModule.getAllIntegrations.mockResolvedValue(integrations);

      const result = await integrationsRouter.list._query({ ctx: makeMockCtx() });

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'id-1', kind: 'sonarr' }),
          expect.objectContaining({ id: 'id-2', kind: 'radarr' }),
          expect.objectContaining({ id: 'id-3', kind: 'jellyfin' }),
        ]),
      );
      expect(mockDbModule.getAllIntegrations).toHaveBeenCalledTimes(1);
    });

    test('returns empty array when no integrations exist', async () => {
      mockDbModule.getAllIntegrations.mockResolvedValue([]);

      const result = await integrationsRouter.list._query({ ctx: makeMockCtx() });

      expect(result).toEqual([]);
    });
  });

  describe('get procedure', () => {
    test('returns integration by id when found', async () => {
      const integration = createIntegration('integration-1', 'qbittorrent');
      mockDbModule.getIntegrationById.mockResolvedValue(integration);

      const result = await integrationsRouter.get._query({
        ctx: makeMockCtx(),
        input: { id: 'integration-1' },
      });

      expect(result).toBeDefined();
      expect(result!.id).toBe('integration-1');
      expect(result!.kind).toBe('qbittorrent');
      expect(mockDbModule.getIntegrationById).toHaveBeenCalledWith(
        expect.anything(),
        'integration-1',
      );
    });

    test('returns null when integration is not found', async () => {
      mockDbModule.getIntegrationById.mockResolvedValue(null);

      const result = await integrationsRouter.get._query({
        ctx: makeMockCtx(),
        input: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });
  });

  describe('upsert procedure', () => {
    test('creates a sonarr integration', async () => {
      const created = createIntegration('new-id', 'sonarr');
      mockDbModule.upsertIntegration.mockResolvedValue(created);

      const result = await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'new-id',
          kind: 'sonarr',
          name: 'SonarrTest',
          url: 'http://localhost:8989',
          apiKey: 'test-api-key',
          port: 8989,
        },
      });

      expect(result.id).toBe('new-id');
      expect(result.kind).toBe('sonarr');
      expect(mockDbModule.upsertIntegration).toHaveBeenCalledTimes(1);
    });

    test('creates a radarr integration', async () => {
      const created = createIntegration('radarr-id', 'radarr');
      mockDbModule.upsertIntegration.mockResolvedValue(created);

      const result = await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'radarr-id',
          kind: 'radarr',
          name: 'RadarrTest',
          url: 'http://localhost:7878',
          apiKey: 'radarr-key',
          port: 7878,
        },
      });

      expect(result.kind).toBe('radarr');
    });

    test('creates a jellyfin integration', async () => {
      const created = createIntegration('jelly-id', 'jellyfin');
      mockDbModule.upsertIntegration.mockResolvedValue(created);

      const result = await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'jelly-id',
          kind: 'jellyfin',
          name: 'JellyfinTest',
          url: 'http://localhost:8096',
          apiKey: 'jelly-key',
          port: 8096,
        },
      });

      expect(result.kind).toBe('jellyfin');
    });

    test('creates a docker integration without apiKey', async () => {
      const created = createIntegration('docker-id', 'docker');
      mockDbModule.upsertIntegration.mockResolvedValue(created);

      const result = await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'docker-id',
          kind: 'docker',
          name: 'DockerTest',
          url: 'http://localhost:2375',
          port: 2375,
        },
      });

      expect(result.kind).toBe('docker');
    });

    test('creates a qbittorrent integration with username and password', async () => {
      const created = createIntegration('qbittorrent-id', 'qbittorrent', {
        username: 'admin',
        password: 'secret',
      });
      mockDbModule.upsertIntegration.mockResolvedValue(created);

      const result = await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'qbittorrent-id',
          kind: 'qbittorrent',
          name: 'qBittorrentTest',
          url: 'http://localhost:8080',
          username: 'admin',
          password: 'secret',
          port: 8080,
        },
      });

      expect(result.kind).toBe('qbittorrent');
      expect(mockDbModule.upsertIntegration).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'qbittorrent-id',
          kind: 'qbittorrent',
          username: 'admin',
          password: 'secret',
        }),
      );
    });

    test('updates an existing integration', async () => {
      const updated = createIntegration('existing-id', 'sonarr', {
        name: 'SonarrUpdated',
        port: 9090,
      });
      mockDbModule.upsertIntegration.mockResolvedValue(updated);

      const result = await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'existing-id',
          kind: 'sonarr',
          name: 'SonarrUpdated',
          url: 'http://localhost:9090',
          apiKey: 'new-key',
          port: 9090,
        },
      });

      expect(result.name).toBe('SonarrUpdated');
      expect(result.port).toBe(9090);
      expect(mockDbModule.upsertIntegration).toHaveBeenCalledTimes(1);
    });

    test('passes through apiKey for qbittorrent when provided', async () => {
      const created = createIntegration('qbittorrent-2', 'qbittorrent');
      mockDbModule.upsertIntegration.mockResolvedValue(created);

      await integrationsRouter.upsert._mutation({
        ctx: makeMockCtx(),
        input: {
          id: 'qbittorrent-2',
          kind: 'qbittorrent',
          name: 'qBittorrentWithKey',
          url: 'http://localhost:8080',
          apiKey: 'qbittorrent-api-key',
          port: 8080,
        },
      });

      expect(mockDbModule.upsertIntegration).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          apiKey: 'qbittorrent-api-key',
        }),
      );
    });
  });

  describe('delete procedure', () => {
    test('deletes integration by id', async () => {
      mockDbModule.deleteIntegration.mockResolvedValue(undefined);

      await integrationsRouter.delete._mutation({
        ctx: makeMockCtx(),
        input: { id: 'integration-to-delete' },
      });

      expect(mockDbModule.deleteIntegration).toHaveBeenCalledWith(
        expect.anything(),
        'integration-to-delete',
      );
    });

    test('is idempotent (no error if already deleted)', async () => {
      mockDbModule.deleteIntegration.mockResolvedValue(undefined);

      // Should not throw even if the integration doesn't exist
      await integrationsRouter.delete._mutation({
        ctx: makeMockCtx(),
        input: { id: 'non-existent-id' },
      });

      expect(mockDbModule.deleteIntegration).toHaveBeenCalledTimes(1);
    });
  });
});