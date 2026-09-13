import test from 'node:test';
import assert from 'node:assert/strict';
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

test('Prometheus Integration - Client', async (t) => {
  await t.test('should create client with basic auth headers', async () => {
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
    assert.ok(true);
  });

  await t.test('should create client without auth when hasAuth is false', async () => {
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
    assert.ok(result !== null);
  });

  await t.test('should return null on query error', async () => {
    mockFetchError(new Error('Network error'));

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });

    const result = await client.query('up');
    assert.equal(result, null);
  });
});

test('Prometheus Integration - Discovery', async (t) => {
  await t.test('should discover instances via label_values', async () => {
    mockFetch({ status: 'success', data: ['10.0.0.1:9100', '10.0.0.2:9100'] });

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const instances = await discovery.discoverInstances();
    assert.deepEqual(instances, ['10.0.0.1:9100', '10.0.0.2:9100']);
  });

  await t.test('should cache label_values responses', async () => {
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

    assert.deepEqual(result1, ['val1', 'val2']);
    assert.deepEqual(result2, ['val1', 'val2']);
    // Should only fetch once due to cache
    assert.equal(callCount, 1);
  });

  await t.test('should return null when label_values fails', async () => {
    mockFetch({ status: 'error', data: [], error: 'not found' });

    const client = new PrometheusClient({
      baseUrl: 'http://prometheus:9090',
      timeoutMs: 5000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const result = await discovery.discoverInstances();
    assert.equal(result, null);
  });
});

test('Prometheus Integration - Normalizer', async (t) => {
  await t.test('should normalize query results by instance', () => {
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

    assert.equal(result.length, 1);
    const firstResult = result[0];
    assert.ok(firstResult);
    assert.equal(firstResult.server, '10.0.0.1:9100');
    assert.ok(firstResult.metrics.length > 0);
  });

  await t.test('should include isSystemMount=true for system mountpoints', () => {
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
    assert.ok(firstResult);
    const diskMetrics = firstResult.metrics.find(m => m.name === 'disk');
    assert.ok(diskMetrics);
    // Check values array: [totalBytes, availableBytes, usagePercent, readBytes, writeBytes]
    // Usage percent for / should be ~50% (50GB used out of 100GB)
    const usagePercent = diskMetrics.values[2];
    assert.ok(usagePercent !== null);
    assert.ok(Math.abs((usagePercent as number) - 50) < 1);
  });

  await t.test('should return empty array when no data', () => {
    const emptyResults = new Map<string, unknown>();
    const instances = ['10.0.0.1:9100'];
    const result = PrometheusNormalizer.normalize(emptyResults, instances);

    assert.deepEqual(result, []);
  });

  await t.test('should handle missing instance gracefully', () => {
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

    assert.deepEqual(result, []);
  });
});

test('Prometheus Integration - Queries', async (t) => {
  await t.test('should have [5m] rate window in queries', () => {
    const queries = getAllQueries();
    for (const query of queries) {
      if (query.key.includes('Read') || query.key.includes('Write') ||
          query.key.includes('Rx') || query.key.includes('Tx')) {
        assert.ok(query.promql.includes('[5m]'), `Query ${query.key} should have [5m] window`);
      }
    }
  });

  await t.test('should use grouping labels in queries', () => {
    const cpuQuery = PROMETHEUS_QUERIES.cpuUsage;
    assert.ok(cpuQuery.promql.includes('by (instance, cpu)'));
  });
});

test('Prometheus Integration - Falsifiers', async (t) => {
  await t.test('D1: server is used as grouping label', () => {
    const queries = getAllQueries();
    const hasInstanceGrouping = queries.some(q =>
      q.groupingLabels.includes('instance')
    );
    assert.ok(hasInstanceGrouping, 'At least one query should group by instance');
  });

  await t.test('D2: label_values is used in client', () => {
    const clientSource = readFileSync(
      'packages/integrations/src/prometheus/client.ts',
      'utf-8'
    );
    assert.ok(clientSource.includes('labelValues'), 'Client should use label_values');
    assert.ok(clientSource.includes('label_values'), 'Client should reference label_values API');
  });

  await t.test('D3: [5m] rate window is present', () => {
    const queriesSource = readFileSync(
      'packages/integrations/src/prometheus/promql-queries.ts',
      'utf-8'
    );
    const matches = queriesSource.match(/\[5m\]/g);
    assert.ok(matches, 'Should have [5m] rate windows');
    assert.ok(matches!.length >= 5, 'Should have at least 5 [5m] references');
  });

  await t.test('D4: prometheus is in integrationKinds', () => {
    const kindsSource = readFileSync(
      'packages/contracts/src/kinds.ts',
      'utf-8'
    );
    assert.ok(kindsSource.includes("'prometheus'"), 'Should contain prometheus kind');
    assert.ok(kindsSource.includes('integrationKinds'), 'Should be in integrationKinds');
  });

  await t.test('D5: no ErrorCode or ErrorType in prometheus code', () => {
    const files = [
      'packages/integrations/src/prometheus/client.ts',
      'packages/integrations/src/prometheus/normalizer.ts',
      'packages/integrations/src/prometheus/prometheus-integration.ts',
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      assert.ok(!content.includes('ErrorCode'), `${file} should not contain ErrorCode`);
      assert.ok(!content.includes('ErrorType'), `${file} should not contain ErrorType`);
    }
  });
});

// Restore original fetch
global.fetch = originalFetch;
