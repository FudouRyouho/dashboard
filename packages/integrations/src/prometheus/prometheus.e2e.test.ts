import { test, expect, describe } from 'vitest';
import { PrometheusClient } from './client';
import { PrometheusDiscovery } from './discovery';
import { PrometheusNormalizer } from './normalizer';
import { getAllQueries } from './promql-queries';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';

describe('Prometheus Integration - E2E', () => {
  test('should connect to Prometheus and discover instances', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });
    const discovery = new PrometheusDiscovery(client);

    const instances = await discovery.discoverInstances();
    expect(instances).not.toBeNull();
    expect(instances?.length).toBeGreaterThan(0);
    console.log(`Discovered ${instances?.length ?? 0} instances:`, instances?.slice(0, 3));
  });

  test('should query CPU metrics', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });

    const queries = getAllQueries();
    const cpuQuery = queries.find(q => q.key === 'cpuUsage');
    expect(cpuQuery).toBeTruthy();

    if (!cpuQuery) return;

    const result = await client.query(cpuQuery.promql);
    expect(result).not.toBeNull();
    expect(result?.data.result.length).toBeGreaterThan(0);
    console.log(`CPU query returned ${result?.data.result.length ?? 0} series`);
  });

  test('should query memory metrics', async () => {
    const client = new PrometheusClient({
      baseUrl: PROMETHEUS_URL,
      timeoutMs: 10000,
      hasAuth: false,
    });

    const queries = getAllQueries();
    const memQuery = queries.find(q => q.key === 'memoryTotal');
    expect(memQuery).toBeTruthy();

    if (!memQuery) return;

    const result = await client.query(memQuery.promql);
    expect(result).not.toBeNull();
    expect(result?.data.result.length).toBeGreaterThan(0);
    console.log(`Memory query returned ${result?.data.result.length ?? 0} series`);
  });

  test('should normalize full response', async () => {
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
    expect(normalized.length).toBeGreaterThan(0);
    console.log(`Normalized ${normalized.length} servers`);

    // Check first server has metrics
    const firstServer = normalized[0];
    expect(firstServer).toBeTruthy();
    expect(firstServer?.metrics.length).toBeGreaterThan(0);
    console.log(`First server (${firstServer?.server}) has ${firstServer?.metrics.length ?? 0} metric series`);
  });
});