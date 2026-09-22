import { describe, test, expect, vi } from 'vitest';
import { systemHealthRouter } from './systemHealth';
import type { TRPCContext } from '../trpc';

function createMockSystemHealthIntegration(id: string, name: string, kind: string): any {
  return {
    publicIntegration: { id, name, kind, url: `http://${id}:9090` },
    getSystemMetricsAsync: vi.fn().mockResolvedValue([]),
    getServerMetricsAsync: vi.fn().mockResolvedValue(null),
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

describe('systemHealthRouter', () => {
  describe('getAllMetrics', () => {
    test('returns metrics from all system health integrations', async () => {
      const integration = createMockSystemHealthIntegration('prom-1', 'Prometheus', 'prometheus');
      const ctx = createMockCtx([integration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();
      expect(result).toHaveLength(1);
      expect(result[0]!.integration.id).toBe('prom-1');
    });

    test('returns empty array when no integrations support system health', async () => {
      const ctx = createMockCtx([]);
      const caller = systemHealthRouter.createCaller(ctx);
      const result = await caller.getAllMetrics();
      expect(result).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    test('returns metrics for a specific server', async () => {
      const integration = createMockSystemHealthIntegration('prom-1', 'Prometheus', 'prometheus');
      const ctx = createMockCtx([integration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: '10.0.0.1:9100' });
      expect(result).toBeDefined();
    });

    test('returns null when integration not found', async () => {
      const integration = createMockSystemHealthIntegration('prom-1', 'Prometheus', 'prometheus');
      const ctx = createMockCtx([integration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'nonexistent' });
      expect(result).toBeNull();
    });
  });
});
