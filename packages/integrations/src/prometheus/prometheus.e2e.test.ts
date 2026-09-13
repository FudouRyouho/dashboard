import test from 'node:test';
import assert from 'node:assert/strict';
import { PrometheusClient } from './client';
import { PrometheusDiscovery } from './discovery';
import { PrometheusNormalizer } from './normalizer';
import { getAllQueries } from './promql-queries';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';

test('Prometheus Integration - E2E', async (t) => {
  await t.test('should connect to Prometheus and discover instances', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const instances = await discovery.discoverInstances();
    assert.ok(instances !== null, 'Should discover instances');
    assert.ok(instances.length > 0, 'Should have at least one instance');
    console.log(`Discovered ${instances.length} instances:`, instances.slice(0, 3));
  });

  await t.test('should query CPU metrics', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });

    const queries = getAllQueries();
    const cpuQuery = queries.find(q => q.key === 'cpuUsage');
    assert.ok(cpuQuery, 'Should have cpuUsage query');

    const result = await client.query(cpuQuery.promql);
    assert.ok(result !== null, 'CPU query should return results');
    assert.ok(result.data.result.length > 0, 'Should have CPU results');
    console.log(`CPU query returned ${result.data.result.length} series`);
  });

  await t.test('should query memory metrics', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });

    const queries = getAllQueries();
    const memQuery = queries.find(q => q.key === 'memoryTotal');
    assert.ok(memQuery, 'Should have memoryTotal query');

    const result = await client.query(memQuery.promql);
    assert.ok(result !== null, 'Memory query should return results');
    assert.ok(result.data.result.length > 0, 'Should have memory results');
    console.log(`Memory query returned ${result.data.result.length} series`);
  });

  await t.test('should normalize full response', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const instances = await discovery.discoverInstances();
    if (!instances || instances.length === 0) {
      console.log('Skipping normalization test - no instances discovered');
      return;
    }

    const queries = getAllQueries();
    const queryResults = new Map<string, unknown>();

    await Promise.all(
      queries.map(async ({ key, promql }) => {
        const result = await client.query(promql);
        queryResults.set(key, result ?? null);
      })
    );

    const normalized = PrometheusNormalizer.normalize(queryResults, instances);
    assert.ok(normalized.length > 0, 'Should normalize at least one server');
    console.log(`Normalized ${normalized.length} servers`);

    // Check first server has metrics
    const firstServer = normalized[0];
    assert.ok(firstServer !== null && firstServer !== undefined, 'Should find first server');
    assert.ok(firstServer!.metrics.length > 0, 'Server should have metrics');
    console.log(`First server (${firstServer!.server}) has ${firstServer!.metrics.length} metric series`);
  });
});