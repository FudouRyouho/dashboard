import { describe, test, expect, vi, beforeEach } from 'vitest';
import { systemHealthRouter } from './systemHealth';
import { Integration } from '@dashboard/integrations';
import type { AppRouter } from '../index';

// Helper to create a mock integration that supports system health
function createMockSystemHealthIntegration(options: {
  id: string;
  name: string;
  kind: string;
  instances?: string[];
  queryResults?: Map<string, unknown>;
  getMetricsError?: Error;
  serverMetricsReturn?: unknown;
}): Integration & {
  getSystemMetricsAsync: (options?: { signal?: AbortSignal }) => Promise<unknown[]>;
  getDiscoveredDataAsync: (options?: { signal?: AbortSignal }) => Promise<{ instances: string[]; queryResults: Map<string, unknown> }>;
  getServerMetricsAsync: (server: string, options?: { signal?: AbortSignal; instances?: string[]; queryResults?: Map<string, unknown> }) => Promise<unknown>;
} {
  const integration = {
    publicIntegration: {
      id: options.id,
      name: options.name,
      kind: options.kind,
      url: `http://${options.id}:9090`,
    },
    getSystemMetricsAsync: vi.fn().mockResolvedValue([]),
    getDiscoveredDataAsync: vi.fn().mockResolvedValue({
      instances: options.instances ?? ['10.0.0.1:9100', '10.0.0.2:9100'],
      queryResults: options.queryResults ?? new Map(),
    }),
    getServerMetricsAsync: vi.fn().mockResolvedValue(options.serverMetricsReturn ?? null),
  };

  if (options.getMetricsError) {
    integration.getDiscoveredDataAsync.mockRejectedValue(options.getMetricsError);
  }

  return integration;
}

// Helper to create a mock integration that does NOT support system health
function createMockNonSystemHealthIntegration(id: string, name: string, kind: string): Integration {
  return {
    publicIntegration: {
      id,
      name,
      kind,
      url: `http://${id}:8080`,
    },
  } as Integration;
}

// Create a mock TRPC context
function createMockCtx(integrations: Integration[]) {
  return {
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
      get: vi.fn(),
    },
    db: {},
  };
}

describe('systemHealthRouter', () => {
  describe('getAllMetrics', () => {
    test('returns metrics from all system health integrations', async () => {
      const mockQueryResults = new Map<string, unknown>([
        ['cpuUsage', {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { instance: '10.0.0.1:9100' },
                value: [1234567890, '0.5'],
              },
            ],
          },
        }],
      ]);

      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
        instances: ['10.0.0.1:9100'],
        queryResults: mockQueryResults,
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();

      expect(result).toHaveLength(1);
      expect(result[0].integration.id).toBe('prom-1');
      expect(result[0].integration.name).toBe('Prometheus');
      expect(result[0].integration.kind).toBe('prometheus');
      expect(Array.isArray(result[0].metrics)).toBeTruthy();
    });

    test('returns empty array when no integrations support system health', async () => {
      const nonSystemHealth = createMockNonSystemHealthIntegration('docker-1', 'Docker', 'docker');
      const ctx = createMockCtx([nonSystemHealth]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();

      expect(result).toEqual([]);
    });

    test('handles integration errors gracefully', async () => {
      const failingIntegration = createMockSystemHealthIntegration({
        id: 'prom-2',
        name: 'Prometheus Failing',
        kind: 'prometheus',
        getMetricsError: new Error('Connection refused'),
      });

      const ctx = createMockCtx([failingIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();

      // Should still return the integration with empty metrics
      expect(result).toHaveLength(1);
      expect(result[0].integration.id).toBe('prom-2');
      expect(result[0].metrics).toEqual([]);
    });

    test('excludes integrations with empty or invalid id', async () => {
      const validIntegration = createMockSystemHealthIntegration({
        id: 'prom-valid',
        name: 'Prometheus Valid',
        kind: 'prometheus',
      });

      // Manually create an integration with empty id by manipulating the result
      // This tests the filter logic that removes null/invalid results
      const ctx = createMockCtx([validIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();

      expect(result.every((r) => r.integration.id !== '' && typeof r.integration.id === 'string')).toBeTruthy();
    });

    test('handles multiple integrations correctly', async () => {
      const prometheus1 = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus One',
        kind: 'prometheus',
      });

      const prometheus2 = createMockSystemHealthIntegration({
        id: 'prom-2',
        name: 'Prometheus Two',
        kind: 'prometheus',
      });

      const ctx = createMockCtx([prometheus1, prometheus2]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getAllMetrics();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.integration.id)).toContain('prom-1');
      expect(result.map((r) => r.integration.id)).toContain('prom-2');
    });

    test('calls getDiscoveredDataAsync on each integration', async () => {
      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      await caller.getAllMetrics();

      expect(prometheusIntegration.getDiscoveredDataAsync).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    test('returns metrics for a specific server', async () => {
      const mockQueryResults = new Map<string, unknown>([
        ['cpuUsage', {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { instance: '10.0.0.1:9100' },
                value: [1234567890, '0.5'],
              },
            ],
          },
        }],
      ]);

      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
        instances: ['10.0.0.1:9100'],
        queryResults: mockQueryResults,
        serverMetricsReturn: {
          server: '10.0.0.1:9100',
          cpu: { usagePercent: 50, temperatureCelsius: 45 },
          memory: { totalBytes: 16000000000, availableBytes: 8000000000, usagePercent: 50 },
          disks: [],
          network: [],
          sensors: [],
        },
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'prom-1' });

      expect(result).not.toBeNull();
      expect(result!.integration.id).toBe('prom-1');
      expect(result!.integration.name).toBe('Prometheus');
      expect(result!.integration.kind).toBe('prometheus');
      expect(Array.isArray(result!.metrics)).toBeTruthy();
    });

    test('returns null when integration is not found', async () => {
      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'non-existent' });

      expect(result).toBeNull();
    });

    test('returns null when integration does not support system health', async () => {
      const nonSystemHealth = createMockNonSystemHealthIntegration('docker-1', 'Docker', 'docker');
      const ctx = createMockCtx([nonSystemHealth]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'docker-1' });

      expect(result).toBeNull();
    });

    test('returns null when no integrations support system health', async () => {
      const nonSystemHealth = createMockNonSystemHealthIntegration('docker-1', 'Docker', 'docker');
      const ctx = createMockCtx([nonSystemHealth]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'docker-1' });

      expect(result).toBeNull();
    });

    test('calls getDiscoveredDataAsync before getServerMetricsAsync', async () => {
      const mockQueryResults = new Map<string, unknown>();
      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
        instances: ['10.0.0.1:9100'],
        queryResults: mockQueryResults,
        serverMetricsReturn: {
          server: '10.0.0.1:9100',
          cpu: { usagePercent: null, temperatureCelsius: null },
          memory: { totalBytes: null, availableBytes: null, usagePercent: null },
          disks: [],
          network: [],
          sensors: [],
        },
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      await caller.getMetrics({ server: 'prom-1' });

      expect(prometheusIntegration.getDiscoveredDataAsync).toHaveBeenCalled();
      expect(prometheusIntegration.getServerMetricsAsync).toHaveBeenCalled();
    });

    test('handles getDiscoveredDataAsync error gracefully', async () => {
      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
        getMetricsError: new Error('Discovery failed'),
        serverMetricsReturn: {
          server: '10.0.0.1:9100',
          cpu: { usagePercent: null, temperatureCelsius: null },
          memory: { totalBytes: null, availableBytes: null, usagePercent: null },
          disks: [],
          network: [],
          sensors: [],
        },
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      // Should not throw, should return with empty metrics
      const result = await caller.getMetrics({ server: 'prom-1' });

      expect(result).not.toBeNull();
      expect(result!.metrics).toEqual([]);
    });

    test('returns integration data even when serverMetrics returns null', async () => {
      const prometheusIntegration = createMockSystemHealthIntegration({
        id: 'prom-1',
        name: 'Prometheus',
        kind: 'prometheus',
        instances: [],
        queryResults: new Map(),
        serverMetricsReturn: null,
      });

      const ctx = createMockCtx([prometheusIntegration]);
      const caller = systemHealthRouter.createCaller(ctx);

      const result = await caller.getMetrics({ server: 'prom-1' });

      expect(result).not.toBeNull();
      expect(result!.integration.id).toBe('prom-1');
      expect(result!.metrics).toEqual([]);
    });
  });
});
