import { NODE_EXPORTER_METRICS } from './constants';

/**
 * D3: PromQL queries for system metrics.
 *
 * Key principles:
 * - Single query per metric base (not per entity)
 * - Rate window fixed at [5m] (not configurable)
 * - Group by all non-value labels for proper dimensionality
 * - Queries are broad (no restrictive filters) for portability
 */

/**
 * Build a rate query with [5m] window and grouping labels.
 * Uses sum(...) by (...) pattern because rate() doesn't support by() directly in Prometheus.
 */
function rateQuery(metric: string, groupingLabels: readonly string[]): string {
  const byClause = groupingLabels.length > 0 ? ` by (${groupingLabels.join(', ')})` : '';
  return `sum(rate(${metric}[5m]))${byClause}`;
}

/**
 * All queries used by the integration.
 * Each returns a vector grouped by relevant labels.
 */
export const PROMETHEUS_QUERIES = {
  // CPU
  cpuUsage: {
    metric: NODE_EXPORTER_METRICS.CPU_TOTAL,
    // CPU usage = 100 - avg(rate(idle)[5m])
    // Group by instance, cpu, mode to get per-core data, then aggregate in TS
    promql: `avg(rate(${NODE_EXPORTER_METRICS.CPU_IDLE}{mode="idle"}[5m])) by (instance, cpu) * 100`,
    groupingLabels: ['instance', 'cpu'],
  },

  cpuTemperature: {
    metric: NODE_EXPORTER_METRICS.CPU_TEMPERATURE,
    promql: NODE_EXPORTER_METRICS.CPU_TEMPERATURE,
    groupingLabels: ['instance', 'chip', 'sensor'],
  },

  // Memory
  memoryTotal: {
    metric: NODE_EXPORTER_METRICS.MEMORY_TOTAL,
    // Gauge: no aggregation needed, instance label is preserved automatically
    promql: NODE_EXPORTER_METRICS.MEMORY_TOTAL,
    groupingLabels: ['instance'],
  },

  memoryAvailable: {
    metric: NODE_EXPORTER_METRICS.MEMORY_AVAILABLE,
    promql: NODE_EXPORTER_METRICS.MEMORY_AVAILABLE,
    groupingLabels: ['instance'],
  },

  // Network
  networkRx: {
    metric: NODE_EXPORTER_METRICS.NETWORK_RX,
    promql: rateQuery(NODE_EXPORTER_METRICS.NETWORK_RX, ['instance', 'device']),
    groupingLabels: ['instance', 'device'],
  },

  networkTx: {
    metric: NODE_EXPORTER_METRICS.NETWORK_TX,
    promql: rateQuery(NODE_EXPORTER_METRICS.NETWORK_TX, ['instance', 'device']),
    groupingLabels: ['instance', 'device'],
  },

  // Disk - Filesystem
  diskSize: {
    metric: NODE_EXPORTER_METRICS.DISK_SIZE,
    promql: NODE_EXPORTER_METRICS.DISK_SIZE,
    groupingLabels: ['instance', 'device', 'mountpoint', 'fstype'],
  },

  diskAvail: {
    metric: NODE_EXPORTER_METRICS.DISK_AVAIL,
    promql: NODE_EXPORTER_METRICS.DISK_AVAIL,
    groupingLabels: ['instance', 'device', 'mountpoint', 'fstype'],
  },

  // Disk - I/O
  diskRead: {
    metric: NODE_EXPORTER_METRICS.DISK_READ,
    promql: rateQuery(NODE_EXPORTER_METRICS.DISK_READ, ['instance', 'device']),
    groupingLabels: ['instance', 'device'],
  },

  diskWrite: {
    metric: NODE_EXPORTER_METRICS.DISK_WRITE,
    promql: rateQuery(NODE_EXPORTER_METRICS.DISK_WRITE, ['instance', 'device']),
    groupingLabels: ['instance', 'device'],
  },

  // Temperature sensors (from hwmon)
  temperature: {
    metric: NODE_EXPORTER_METRICS.CPU_TEMPERATURE,
    promql: NODE_EXPORTER_METRICS.CPU_TEMPERATURE,
    groupingLabels: ['instance', 'chip', 'sensor'],
  },
} as const;

/**
 * Type for query definitions.
 */
export type PrometheusQueryKey = keyof typeof PROMETHEUS_QUERIES;

/**
 * Get all query definitions as an array for batch execution.
 */
export function getAllQueries(): Array<{ key: PrometheusQueryKey; promql: string; groupingLabels: readonly string[] }> {
  return Object.entries(PROMETHEUS_QUERIES).map(([key, def]) => ({
    key: key as PrometheusQueryKey,
    promql: def.promql,
    groupingLabels: def.groupingLabels,
  }));
}

/**
 * Build a query with an optional instance filter.
 * Used when querying for a specific server.
 */
export function buildQueryWithInstanceFilter(
  basePromql: string,
  instance: string
): string {
  // If the query already has label matchers, add instance filter
  if (basePromql.includes('{')) {
    return basePromql.replace('{', `{instance="${instance}",`);
  }
  // Otherwise wrap the metric selector
  return basePromql.replace(/^([a-zA-Z_:][a-zA-Z0-9_:]*)/, `$1{instance="${instance}"}`);
}