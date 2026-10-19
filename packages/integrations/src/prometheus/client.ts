import { DEFAULT_DISCOVERY_TTL_MS } from './constants';
import { PROMETHEUS_API_PATHS } from './api-types';
import {
  prometheusInstantQueryResponseSchema,
  prometheusLabelValuesResponseSchema,
  type PrometheusInstantQueryResponse,
} from './schemas/prometheus-response';
import { IntegrationError } from '../base/integration-error';

/**
 * Fetch function signature compatible with Integration.fetchJson.
 */
export type FetchFn = <T = unknown>(
  url: URL | string,
  init?: RequestInit,
) => Promise<T>;

/**
Prometheus HTTP client with Basic Auth and label_values discovery.
 *
 * Uses an injected fetch function (typically Integration.fetchJson) for HTTP.
 * Manages:
 * - Basic auth via username/password secrets
 * - Label values caching (5 min TTL)
 * - Query/label_values endpoint construction
 */
export class PrometheusClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;
  private readonly hasAuth: boolean;
  private readonly username?: string;
  private readonly password?: string;

  // Cache for label_values responses
  private readonly cache = new Map<
    string,
    { values: string[]; fetchedAt: number }
  >();

  constructor(options: {
    baseUrl: string;
    fetchFn: FetchFn;
    hasAuth: boolean;
    username?: string;
    password?: string;
  }) {
    this.baseUrl = options.baseUrl;
    this.fetchFn = options.fetchFn;
    this.hasAuth = options.hasAuth;
    this.username = options.username;
    this.password = options.password;
  }

  /**
   * Execute an instant query against Prometheus.
   * Returns parsed response or null if query fails.
   */
  async query(
    promql: string,
    signal?: AbortSignal,
  ): Promise<PrometheusInstantQueryResponse | null> {
    const url = `${this.baseUrl}${PROMETHEUS_API_PATHS.query}?query=${encodeURIComponent(promql)}`;

    try {
      const response = await this.fetchWithAuth(url, signal);
      const data = prometheusInstantQueryResponseSchema.parse(response);
      return data;
    } catch (error) {
      // Log error but don't throw - caller should handle null
      console.warn(`Prometheus query failed: ${promql}`, error);
      return null;
    }
  }

  /**
   * Get label values from Prometheus.
   * Uses cache with TTL to avoid excessive API calls.
   */
  async labelValues(
    labelName: string,
    signal?: AbortSignal,
  ): Promise<string[] | null> {
    const cacheKey = labelName;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    // Return cached value if still valid
    if (cached && now - cached.fetchedAt < DEFAULT_DISCOVERY_TTL_MS) {
      return cached.values;
    }

    const url = `${this.baseUrl}${PROMETHEUS_API_PATHS.labelValues}${encodeURIComponent(labelName)}/values`;

    try {
      const response = await this.fetchWithAuth(url, signal);
      const data = prometheusLabelValuesResponseSchema.parse(response);

      if (data.status !== 'success') {
        console.warn(
          `Prometheus label_values failed for ${labelName}:`,
          data.error,
        );
        return null;
      }

      // Update cache
      this.cache.set(cacheKey, {
        values: data.data,
        fetchedAt: now,
      });

      return data.data;
    } catch (error) {
      console.warn(
        `Prometheus label_values request failed for ${labelName}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Clear the label values cache.
   * Call this when configuration changes.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Internal: fetch with auth headers via injected fetch function.
   */
  private async fetchWithAuth(
    url: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Basic Auth if configured
    if (this.hasAuth && this.username && this.password) {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString(
        'base64',
      );
      headers['Authorization'] = `Basic ${auth}`;
    }

    try {
      return await this.fetchFn(url, { headers, signal });
    } catch (error) {
      // Normalize error to match previous behavior
      if (error instanceof IntegrationError) {
        // IntegrationError already has reason/httpStatus
        throw new Error(`HTTP ${error.httpStatus ?? 'unknown'}: ${error.message}`);
      }
      throw error;
    }
  }
}
