/**
 * Prometheus normalized data structure.
 *
Normalization by server (instance label).
 * Each server = one Prometheus target (machine being monitored).
 */
export interface PrometheusNormalized {
  /** Unique identifier for this Prometheus integration instance */
  server: string;
  /** Human-readable name (from integration config or target) */
  name?: string;
  /** Timestamp of last successful scrape (Unix seconds) */
  lastScrapeTime?: number;
  /** Health status of the target */
  status?: 'up' | 'down' | 'unknown';
  /** Metrics grouped by category */
  metrics: MetricSeries[];
}

/**
 * A single time series with its labels and values.
 */
export interface MetricSeries {
  /** Name of the metric */
  name: string;
  /** Label dimensions (key=value pairs that differentiate this series) */
  labels: Record<string, string>;
  /** Raw values from Prometheus (null if unavailable) */
  values: (number | null)[];
  /** Timestamps corresponding to values (Unix seconds, null if unavailable) */
  timestamps: (number | null)[];
  /** True if this is a system mount (/, /boot, etc.) */
  isSystemMount?: boolean;
}

import type { ServerMetrics } from '@dashboard/contracts';

export type { ServerMetrics };
