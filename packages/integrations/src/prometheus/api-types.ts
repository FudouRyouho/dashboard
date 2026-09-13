/**
 * Prometheus API types.
 *
 * Type definitions for Prometheus HTTP API responses.
 */

/**
 * D4: Input configuration for Prometheus integration.
 * Uses IntegrationInput base + secrets for auth.
 */
export interface PrometheusIntegrationConfig {
  /** Prometheus server URL (from IntegrationInput.url) */
  url: string;
  /** Optional port (from IntegrationInput.port) */
  port?: number;
  /** Optional external URL for display (from IntegrationInput.externalUrl) */
  externalUrl?: string;
  /** Timeout in milliseconds (from IntegrationInput.timeoutMs) */
  timeoutMs?: number;
  /** Whether basic auth is configured */
  hasAuth: boolean;
  /** Whether TLS verification should be skipped */
  tlsSkipVerify?: boolean;
}

/**
 * Response from Prometheus label_values API.
 */
export interface PrometheusLabelValuesResponse {
  status: 'success' | 'error';
  data: string[];
  error?: string;
  errorType?: string;
}

/**
 * Response from Prometheus instant query API.
 */
export interface PrometheusQueryResponse {
  status: 'success' | 'error';
  data: {
    resultType: 'vector' | 'scalar' | 'matrix' | 'string';
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
  error?: string;
  errorType?: string;
}

/**
 * Cached label values with timestamp.
 */
export interface LabelValueCacheEntry {
  values: string[];
  fetchedAt: number;
}

/**
 * Prometheus API paths.
 */
export const PROMETHEUS_API_PATHS = {
  query: '/api/v1/query',
  queryRange: '/api/v1/query_range',
  labels: '/api/v1/labels',
  labelValues: '/api/v1/label/',
  targets: '/api/v1/targets',
  metadata: '/api/v1/metadata',
} as const;