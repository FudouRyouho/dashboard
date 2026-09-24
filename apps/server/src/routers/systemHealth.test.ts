import { describe, test, expect, vi } from 'vitest';
import { systemHealthRouter } from './systemHealth';
import {
  createTestIntegration,
  createTestTRPCContext,
  errorFixtures,
} from '@dashboard/testing-utils';

describe('systemHealthRouter', () => {
  describe('getAllMetrics', () => {
    test('returns metrics from all system health integrations', async () => {
      const integration = createTestIntegration('prometheus', {
        id: 'prom-1',
        name: 'Prometheus',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();
      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('prom-1');
    });

    test('returns empty array when no integrations support system health', async () => {
      const ctx = createTestTRPCContext({ integrations: [] });
      const caller = systemHealthRouter.createCaller(ctx);
      const result = await caller.getAllMetrics();
      expect(result).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    test('returns metrics for a specific server', async () => {
      const integration = createTestIntegration('prometheus', {
        id: 'prom-1',
        name: 'Prometheus',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: '10.0.0.1:9100' });
      expect(result).toBeDefined();
    });

    test('returns null when integration not found', async () => {
      const integration = createTestIntegration('prometheus', {
        id: 'prom-1',
        name: 'Prometheus',
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('Edge cases (QA validation)', () => {
    test('getAllMetrics when getDiscoveredDataAsync rejects still returns an entry with empty metrics', async () => {
      const integration = createTestIntegration('prometheus', {
        id: 'prom-fail',
        name: 'Failing Prometheus',
        getDiscoveredDataAsync: vi.fn().mockRejectedValue(
          errorFixtures.integration.unreachable(new Error('Connection refused')),
        ),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();
      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('prom-fail');
      expect(result[0]!.metrics).toEqual([]);
    });

    test('getMetrics when getDiscoveredDataAsync rejects returns entry with empty metrics', async () => {
      const integration = createTestIntegration('prometheus', {
        id: 'prom-fail',
        name: 'Failing Prometheus',
        getDiscoveredDataAsync: vi.fn().mockRejectedValue(
          errorFixtures.integration.timeout(),
        ),
        getServerMetricsAsync: vi.fn(),
      });
      const ctx = createTestTRPCContext({ integrations: [integration] });
      const caller = systemHealthRouter.createCaller(ctx);

      // The 'server' input matches the integration's publicIntegration.id
      const result = await caller.getMetrics({ server: 'prom-fail' });
      expect(result).not.toBeNull();
      expect(result!.integration.id).toBe('prom-fail');
      expect(result!.metrics).toEqual([]);
    });
  });
});