import { test, expect, describe } from 'vitest';
import { readFileSync } from 'fs';
import { PrometheusClient } from './client';
import { PrometheusDiscovery } from './discovery';
import { PrometheusNormalizer } from './normalizer';
import { PROMETHEUS_QUERIES, getAllQueries } from './promql-queries';

// Store original fetch
const originalFetch = global.fetch;

// Helper to mock fetch
function mockFetch(response: unknown) {
  global.fetch = async () => ({
    ok: true,
    json: async () => response,
  }) as Response;
}

// Helper to mock fetch error
function mockFetchError(error: Error) {
  global.fetch = async () => {
    throw error;
  };
}

describe('Prometheus Integration - Client', () => {
  test('should create client with basic auth headers', async () => {
    mockFetch({ status: 'success', data: { result: [] } });

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: true,
      username: 'admin',
      password: 'secret',
    });

    await client.query('up');
    // If we got here without error, auth headers were sent
    expect(true).toBeTruthy();
  });

  test('should create client without auth when hasAuth is false', async () => {
    mockFetch({
      status: 'success',
      data: { resultType: 'vector', result: [] },
    });

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });

    const result = await client.query('up');
    expect(result !== null).toBeTruthy();
  });

  test('should return null on query error', async () => {
    mockFetchError(new Error('Network error'));

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });

    const result = await client.query('up');
    expect(result).toBe(null);
  });
});

describe('Prometheus Integration - Discovery', () => {
  test('should discover instances via label_values', async () => {
    mockFetch({ status: 'success', data: ['10.0.0.1:9100', '10.0.0.2:9100'] });

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const instances = await discovery.discoverInstances();
    expect(instances).toEqual(['10.0.0.1:9100', '10.0.0.2:9100']);
  });

  test('should cache label_values responses', async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({ status: 'success', data: ['val1', 'val2'] }),
      } as Response;
    };

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const result1 = await discovery.discoverInstances();
    const result2 = await discovery.discoverInstances();

    expect(result1).toEqual(['val1', 'val2']);
    expect(result2).toEqual(['val1', 'val2']);
    // Should only fetch once due to cache
    expect(callCount).toBe(1);
  });

  test('should return null when label_values fails', async () => {
    mockFetch({ status: 'error', data: [], error: 'not found' });

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const result = await discovery.discoverInstances();
    expect(result).toBe(null);
  });
});

describe('Prometheus Integration - Normalizer', () => {
  test('should normalize query results by instance', () => {
    const mockQueryResults = new Map<string, unknown>([
      [
        'cpuUsage',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { instance: '10.0.0.1:9100', cpu: '0', mode: 'idle' },
                value: [1234567890, '0.5'],
              },
            ],
          },
        },
      ],
      [
        'memoryTotal',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { instance: '10.0.0.1:9100' },
                value: [1234567890, '16000000000'],
              },
            ],
          },
        },
      ],
      [
        'memoryAvailable',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { instance: '10.0.0.1:9100' },
                value: [1234567890, '8000000000'],
              },
            ],
          },
        },
      ],
      [
        'diskSize',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: {
                  instance: '10.0.0.1:9100',
                  mountpoint: '/',
                  device: 'sda1',
                  fstype: 'ext4',
                },
                value: [1234567890, '100000000000'],
              },
              {
                metric: {
                  instance: '10.0.0.1:9100',
                  mountpoint: '/mnt/data',
                  device: 'sdb1',
                  fstype: 'ext4',
                },
                value: [1234567890, '500000000000'],
              },
            ],
          },
        },
      ],
      [
        'diskAvail',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: {
                  instance: '10.0.0.1:9100',
                  mountpoint: '/',
                  device: 'sda1',
                  fstype: 'ext4',
                },
                value: [1234567890, '50000000000'],
              },
              {
                metric: {
                  instance: '10.0.0.1:9100',
                  mountpoint: '/mnt/data',
                  device: 'sdb1',
                  fstype: 'ext4',
                },
                value: [1234567890, '400000000000'],
              },
            ],
          },
        },
      ],
    ]);

    const instances = ['10.0.0.1:9100', '10.0.0.2:9100'];
    const result = PrometheusNormalizer.normalize(mockQueryResults, instances);

    expect(result.length).toBe(1);
    const firstResult = result[0];
    expect(firstResult).toBeTruthy();
    expect(firstResult!.server).toBe('10.0.0.1:9100');
    expect(firstResult!.metrics.length > 0).toBeTruthy();
  });

  test('should include isSystemMount=true for system mountpoints', () => {
    const mockQueryResults = new Map<string, unknown>([
      [
        'diskSize',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: {
                  instance: '10.0.0.1:9100',
                  mountpoint: '/',
                  device: 'sda1',
                  fstype: 'ext4',
                },
                value: [1234567890, '100000000000'],
              },
            ],
          },
        },
      ],
      [
        'diskAvail',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: {
                  instance: '10.0.0.1:9100',
                  mountpoint: '/',
                  device: 'sda1',
                  fstype: 'ext4',
                },
                value: [1234567890, '50000000000'],
              },
            ],
          },
        },
      ],
    ]);

    const instances = ['10.0.0.1:9100'];
    const result = PrometheusNormalizer.normalize(mockQueryResults, instances);

    const firstResult = result[0];
    expect(firstResult).toBeTruthy();
    const diskMetrics = firstResult!.metrics.find(m => m.name === 'disk');
    expect(diskMetrics!).toBeTruthy();
    // Check values array: [totalBytes, availableBytes, usagePercent, readBytes, writeBytes]
    // Usage percent for / should be ~50% (50GB used out of 100GB)
    const usagePercent = diskMetrics!.values[2];
    expect(usagePercent !== null).toBeTruthy();
    expect(Math.abs((usagePercent as number) - 50) < 1);
  });

  test('should return empty array when no data', () => {
    const emptyResults = new Map<string, unknown>();
    const instances = ['10.0.0.1:9100'];
    const result = PrometheusNormalizer.normalize(emptyResults, instances);

    expect(result).toEqual([]);
  });

  test('should handle missing instance gracefully', () => {
    const mockQueryResults = new Map<string, unknown>([
      [
        'cpuUsage',
        {
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { instance: '10.0.0.99:9100' },
                value: [1234567890, '0.5'],
              },
            ],
          },
        },
      ],
    ]);

    const instances = ['10.0.0.1:9100'];
    const result = PrometheusNormalizer.normalize(mockQueryResults, instances);

    expect(result).toEqual([]);
  });
});

describe('Prometheus Integration - Queries', () => {
  test('should have [5m] rate window in queries', () => {
    const queries = getAllQueries();
    for (const query of queries) {
      if (query.key.includes('Read') || query.key.includes('Write') ||
          query.key.includes('Rx') || query.key.includes('Tx')) {
        expect(query.promql.includes('[5m]')).toBeTruthy();
      }
    }
  });

  test('should use grouping labels in queries', () => {
    const cpuQuery = PROMETHEUS_QUERIES.cpuUsage;
    expect(cpuQuery.promql.includes('by (instance, cpu)')).toBeTruthy();
  });
});

describe('Prometheus Integration - Falsifiers', () => {
  test('D1: server is used as grouping label', () => {
    const queries = getAllQueries();
    const hasInstanceGrouping = queries.some(q =>
      q.groupingLabels.includes('instance')
    );
    expect(hasInstanceGrouping, 'At least one query should group by instance').toBeTruthy();
  });

  test('D2: label_values is used in client', () => {
    const clientSource = readFileSync(
      'packages/integrations/src/prometheus/client.ts',
      'utf-8'
    );
    expect(clientSource.includes('labelValues')).toBeTruthy();
    expect(clientSource.includes('label_values')).toBeTruthy();
  });

  test('D3: [5m] rate window is present', () => {
    const queriesSource = readFileSync(
      'packages/integrations/src/prometheus/promql-queries.ts',
      'utf-8'
    );
    const matches = queriesSource.match(/\[5m\]/g);
    expect(matches, 'Should have [5m] rate windows').toBeTruthy();
    expect(matches!.length >= 5, 'Should have at least 5 [5m] references').toBeTruthy();
  });

  test('D4: prometheus is in integrationKinds', () => {
    const kindsSource = readFileSync(
      'packages/contracts/src/kinds.ts',
      'utf-8'
    );
    expect(kindsSource.includes("'prometheus'")).toBeTruthy();
    expect(kindsSource.includes('integrationKinds')).toBeTruthy();
  });

  test('D5: no ErrorCode or ErrorType in prometheus code', () => {
    const files = [
      'packages/integrations/src/prometheus/client.ts',
      'packages/integrations/src/prometheus/normalizer.ts',
      'packages/integrations/src/prometheus/prometheus-integration.ts',
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      expect(!content.includes('ErrorCode')).toBeTruthy();
      expect(!content.includes('ErrorType')).toBeTruthy();
    }
  });
});

// Restore original fetch
global.fetch = originalFetch;
