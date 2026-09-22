import { Integration } from '../base/integration';
import { PrometheusClient } from './client';
import { PrometheusDiscovery } from './discovery';
import { getAllQueries } from './promql-queries';
import { PrometheusNormalizer } from './normalizer';
import { PrometheusNormalized, ServerMetrics } from './types';
import { ISystemHealthIntegration } from '../base/system-health';

/**
 * D4 + D5: Prometheus Integration implementation.
 *
 * Uses IntegrationInput base + secrets for auth.
 * Implements ISystemHealthIntegration capability.
 */
export class PrometheusIntegration extends Integration implements ISystemHealthIntegration {
  private readonly client: PrometheusClient;
  private readonly discovery: PrometheusDiscovery;

  constructor(integration: import('../base/integration').IntegrationInput) {
    super(integration);

    const hasAuth = this.hasSecretValue('username') && this.hasSecretValue('password');
    let username: string | undefined;
    let password: string | undefined;

    if (hasAuth) {
      username = this.getSecretValue('username');
      password = this.getSecretValue('password');
    }

    this.client = new PrometheusClient({
      baseUrl: this.baseUrl,
      timeoutMs: this.timeoutMs,
      hasAuth,
      username,
      password,
      tlsSkipVerify: false, // Not implemented yet for browser fetch
    });

    this.discovery = new PrometheusDiscovery(this.client);
  }

  /**
   * Get system metrics for all discovered instances.
   *
   * Flow:
   * 1. Discover instances from Prometheus
   * 2. Run all queries
   * 3. Normalize results by instance
   */
  async getSystemMetricsAsync(options?: { signal?: AbortSignal }): Promise<PrometheusNormalized[]> {
    // Discover instances
    const instances = await this.discovery.discoverInstances(options?.signal);
    if (!instances || instances.length === 0) {
      return [];
    }

    // Run all queries in parallel
    const queries = getAllQueries();
    const queryResults = new Map<string, unknown>();

    await Promise.all(
      queries.map(async ({ key, promql }) => {
        const result = await this.client.query(promql, options?.signal);
        queryResults.set(key, result ?? null);
      })
    );

    // Normalize results
    return PrometheusNormalizer.normalize(queryResults, instances);
  }

  /**
   * Get metrics for a specific server.
   * If instances and queryResults are provided, reuse them to avoid re-discovery and re-querying.
   */
  async getServerMetricsAsync(server: string, options?: { signal?: AbortSignal; instances?: string[]; queryResults?: Map<string, unknown> }): Promise<ServerMetrics | null> {
    let instances = options?.instances;
    let queryResults = options?.queryResults;

    if (!instances || !queryResults) {
      // Fallback: run full discovery and query (for backward compatibility)
      const allMetrics = await this.getSystemMetricsAsync(options?.signal ? { signal: options.signal } : undefined);
      const serverData = allMetrics.find(m => m.server === server);
      if (!serverData) return null;

      return PrometheusNormalizer.toServerMetrics(serverData);
    }

    // Use pre-discovered data
    const serverData = PrometheusNormalizer.normalize(queryResults, instances).find(m => m.server === server);
    if (!serverData) return null;

    return PrometheusNormalizer.toServerMetrics(serverData);
  }

  /**
   * Discover instances and run all queries, returning both for reuse.
   * Used by getAllMetrics and can be passed to getServerMetricsAsync to avoid double work.
   */
  async getDiscoveredDataAsync(options?: { signal?: AbortSignal }): Promise<{ instances: string[]; queryResults: Map<string, unknown> }> {
    const instances = await this.discovery.discoverInstances(options?.signal);
    if (!instances || instances.length === 0) {
      return { instances: [], queryResults: new Map() };
    }

    const queries = getAllQueries();
    const queryResults = new Map<string, unknown>();

    await Promise.all(
      queries.map(async ({ key, promql }) => {
        const result = await this.client.query(promql, options?.signal);
        queryResults.set(key, result ?? null);
      })
    );

    return { instances, queryResults };
  }
}