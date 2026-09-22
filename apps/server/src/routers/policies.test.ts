import { describe, test, expect, vi, beforeEach } from 'vitest';
import { policiesRouter } from './policies';
import type { DB } from '@dashboard/db';

// Mock the database functions
const mockGetAllPoliciesByIntegrationId = vi.fn();
const mockGetPolicyByIntegrationAndType = vi.fn();
const mockUpsertTaskPolicy = vi.fn();
const mockDeleteTaskPolicy = vi.fn();

vi.mock('@dashboard/db', () => ({
  getAllPoliciesByIntegrationId: (...args: Parameters<typeof mockGetAllPoliciesByIntegrationId>) =>
    mockGetAllPoliciesByIntegrationId(...args),
  getPolicyByIntegrationAndType: (...args: Parameters<typeof mockGetPolicyByIntegrationAndType>) =>
    mockGetPolicyByIntegrationAndType(...args),
  upsertTaskPolicy: (...args: Parameters<typeof mockUpsertTaskPolicy>) =>
    mockUpsertTaskPolicy(...args),
  deleteTaskPolicy: (...args: Parameters<typeof mockDeleteTaskPolicy>) =>
    mockDeleteTaskPolicy(...args),
}));

// Mock context factory
function createMockContext(db: DB = {} as DB) {
  return {
    db,
    integrations: [],
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    store: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    },
    runLog: {
      insert: vi.fn(),
      list: vi.fn(),
      getLatest: vi.fn(),
    },
  } as any;
}

describe('policiesRouter', () => {
  const mockDb = {} as DB;
  const mockCtx = createMockContext(mockDb);
  const integrationId = 'test-integration-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listByIntegration', () => {
    test('returns all policies for an integration', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          integrationId,
          taskType: 'calendar' as const,
          everyMs: 3600000,
          runOnStart: true,
          expectedDurationMs: 30000,
          failureMaxAttempts: 3,
          failureCooldownMs: 60000,
        },
        {
          id: 'policy-2',
          integrationId,
          taskType: 'mediaReleases' as const,
          everyMs: 7200000,
          runOnStart: false,
          expectedDurationMs: 60000,
          failureMaxAttempts: 2,
          failureCooldownMs: 120000,
        },
        {
          id: 'policy-3',
          integrationId,
          taskType: 'docker' as const,
          everyMs: 1800000,
          runOnStart: true,
          expectedDurationMs: 45000,
          failureMaxAttempts: 1,
          failureCooldownMs: 30000,
        },
      ];

      mockGetAllPoliciesByIntegrationId.mockResolvedValue(mockPolicies);

      const caller = policiesRouter.createCaller(mockCtx);
      const result = await caller.listByIntegration({ integrationId });

      expect(mockGetAllPoliciesByIntegrationId).toHaveBeenCalledWith(mockDb, integrationId);
      expect(result).toEqual(mockPolicies);
      expect(result.length).toBe(3);
    });

    test('returns empty array when no policies exist', async () => {
      mockGetAllPoliciesByIntegrationId.mockResolvedValue([]);

      const caller = policiesRouter.createCaller(mockCtx);
      const result = await caller.listByIntegration({ integrationId });

      expect(mockGetAllPoliciesByIntegrationId).toHaveBeenCalledWith(mockDb, integrationId);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('get', () => {
    const taskTypes = ['calendar', 'mediaReleases', 'docker'] as const;

    for (const taskType of taskTypes) {
      test(`returns policy for taskType: ${taskType}`, async () => {
        const mockPolicy = {
          id: `policy-${taskType}`,
          integrationId,
          taskType,
          everyMs: 3600000,
          runOnStart: true,
          expectedDurationMs: 30000,
          failureMaxAttempts: 3,
          failureCooldownMs: 60000,
        };

        mockGetPolicyByIntegrationAndType.mockResolvedValue(mockPolicy);

        const caller = policiesRouter.createCaller(mockCtx);
        const result = await caller.get({ integrationId, taskType });

        expect(mockGetPolicyByIntegrationAndType).toHaveBeenCalledWith(mockDb, integrationId, taskType);
        expect(result).toEqual(mockPolicy);
      });
    }

    test('returns null when policy does not exist', async () => {
      mockGetPolicyByIntegrationAndType.mockResolvedValue(null);

      const caller = policiesRouter.createCaller(mockCtx);
      const result = await caller.get({ integrationId, taskType: 'calendar' });

      expect(mockGetPolicyByIntegrationAndType).toHaveBeenCalledWith(mockDb, integrationId, 'calendar');
      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    const validInput = {
      id: 'new-policy-id',
      integrationId,
      taskType: 'calendar' as const,
      everyMs: 3600000,
      runOnStart: true,
      expectedDurationMs: 30000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    };

    const taskTypes = ['calendar', 'mediaReleases', 'docker'] as const;

    for (const taskType of taskTypes) {
      test(`upserts policy for taskType: ${taskType}`, async () => {
        const input = { ...validInput, taskType, id: `policy-${taskType}-new` };
        mockUpsertTaskPolicy.mockResolvedValue(undefined);

        const caller = policiesRouter.createCaller(mockCtx);
        await caller.upsert(input);

        expect(mockUpsertTaskPolicy).toHaveBeenCalledWith(mockDb, input);
      });
    }

    test('validates required fields', async () => {
      const caller = policiesRouter.createCaller(mockCtx);

      // Test invalid everyMs (must be positive integer)
      await expect(
        caller.upsert({ ...validInput, everyMs: -1 })
      ).rejects.toThrow();

      // Test invalid expectedDurationMs (must be positive integer)
      await expect(
        caller.upsert({ ...validInput, expectedDurationMs: 0 })
      ).rejects.toThrow();

      // Test invalid failureMaxAttempts (must be >= 0)
      await expect(
        caller.upsert({ ...validInput, failureMaxAttempts: -1 })
      ).rejects.toThrow();

      // Test invalid failureCooldownMs (must be >= 0)
      await expect(
        caller.upsert({ ...validInput, failureCooldownMs: -1 })
      ).rejects.toThrow();

      // Test non-integer everyMs
      await expect(
        caller.upsert({ ...validInput, everyMs: 3600000.5 })
      ).rejects.toThrow();

      // Test non-integer expectedDurationMs
      await expect(
        caller.upsert({ ...validInput, expectedDurationMs: 30000.5 })
      ).rejects.toThrow();
    });

    test('rejects invalid taskType', async () => {
      const caller = policiesRouter.createCaller(mockCtx);

      await expect(
        caller.upsert({ ...validInput, taskType: 'invalid' as any })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    const taskTypes = ['calendar', 'mediaReleases', 'docker'] as const;

    for (const taskType of taskTypes) {
      test(`deletes policy for taskType: ${taskType}`, async () => {
        mockDeleteTaskPolicy.mockResolvedValue(undefined);

        const caller = policiesRouter.createCaller(mockCtx);
        await caller.delete({ integrationId, taskType });

        expect(mockDeleteTaskPolicy).toHaveBeenCalledWith(mockDb, integrationId, taskType);
      });
    }

    test('rejects invalid taskType', async () => {
      const caller = policiesRouter.createCaller(mockCtx);

      await expect(
        caller.delete({ integrationId, taskType: 'invalid' as any })
      ).rejects.toThrow();
    });
  });
});