import {
  PrometheusNormalized,
  MetricSeries,
  ServerMetrics,
} from './types';
import {
  SYSTEM_MOUNTPOINTS,
  NON_SYSTEM_MOUNT_EXCLUDE,
  VIRTUAL_FSTYPES,
} from './constants';

/**
 * D1, D3, D5: Normalizer - transforms raw Prometheus responses into structured data.
 *
 * Key principles:
 * - Group by server (instance label)
 * - isSystemMount boolean flag for disks
 * - null for errors/missing data (no semantic distinction)
 * - Single pass transformation
 */
export class PrometheusNormalizer {
  /**
   * Normalize all query results into PrometheusNormalized structure.
   *
   * @param queryResults - Map of query key to Prometheus response
   * @param instances - List of discovered instances
   * @returns Array of normalized data per server
   */
  static normalize(
    queryResults: Map<string, unknown>,
    instances: string[]
  ): PrometheusNormalized[] {
    const normalized: PrometheusNormalized[] = [];

    for (const instance of instances) {
      const serverData = this.normalizeInstance(instance, queryResults);
      if (serverData) {
        normalized.push(serverData);
      }
    }

    return normalized;
  }

  /**
   * Normalize data for a single instance.
   */
  private static normalizeInstance(
    instance: string,
    queryResults: Map<string, unknown>
  ): PrometheusNormalized | null {
    const metrics: MetricSeries[] = [];

    // CPU Usage
    const cpuUsage = this.extractMetric(queryResults, 'cpuUsage', instance);
    if (cpuUsage) {
      metrics.push({
        name: 'cpu_usage',
        labels: { instance },
        values: cpuUsage.values,
        timestamps: cpuUsage.timestamps,
      });
    }

    // CPU Temperature
    const cpuTemp = this.extractMetric(queryResults, 'cpuTemperature', instance);
    if (cpuTemp) {
      metrics.push({
        name: 'cpu_temperature',
        labels: cpuTemp.labels,
        values: cpuTemp.values,
        timestamps: cpuTemp.timestamps,
      });
    }

    // Memory
    const memTotal = this.extractMetric(queryResults, 'memoryTotal', instance);
    const memAvail = this.extractMetric(queryResults, 'memoryAvailable', instance);
    if (memTotal || memAvail) {
      metrics.push({
        name: 'memory',
        labels: { instance },
        values: [memTotal?.values[0] ?? null, memAvail?.values[0] ?? null],
        timestamps: [memTotal?.timestamps[0] ?? null, memAvail?.timestamps[0] ?? null],
      });
    }

    // Network
    const netRx = this.extractMetric(queryResults, 'networkRx', instance);
    const netTx = this.extractMetric(queryResults, 'networkTx', instance);
    if (netRx || netTx) {
      metrics.push({
        name: 'network',
        labels: { instance },
        values: [netRx?.values[0] ?? null, netTx?.values[0] ?? null],
        timestamps: [netRx?.timestamps[0] ?? null, netTx?.timestamps[0] ?? null],
      });
    }

    // Disks
    const diskMetrics = this.normalizeDisks(queryResults, instance);
    metrics.push(...diskMetrics);

    // Sensors
    const sensorMetrics = this.normalizeSensors(queryResults, instance);
    metrics.push(...sensorMetrics);

    if (metrics.length === 0) {
      return null;
    }

    return {
      server: instance,
      metrics,
    };
  }

  /**
   * Extract metric data for a specific instance from query results.
   */
  private static extractMetric(
    queryResults: Map<string, unknown>,
    queryKey: string,
    instance: string
  ): { values: number[]; timestamps: number[]; labels: Record<string, string> } | null {
    const response = queryResults.get(queryKey);
    if (!response || typeof response !== 'object') return null;

    const data = response as { data?: { result?: Array<{ metric: Record<string, string>; value: [number, string] }> } };
    const results = data.data?.result;
    if (!results || !Array.isArray(results)) return null;

    // Filter results for this instance
    const instanceResults = results.filter(r => r.metric.instance === instance);
    if (instanceResults.length === 0) return null;

    // For simplicity, take the first matching result
    // In reality, we'd aggregate or handle multiple series
    const result = instanceResults[0];
    if (!result) return null;
    const value = parseFloat(result.value[1]);

    if (isNaN(value)) return null;

    return {
      values: [value],
      timestamps: [result.value[0]],
      labels: result.metric,
    };
  }

  /**
   * Check if a mountpoint is a system mount.
   */
  private static isSystemMount(mountpoint: string): boolean {
    // Check if it's in the system mountpoints list
    if (SYSTEM_MOUNTPOINTS.includes(mountpoint as typeof SYSTEM_MOUNTPOINTS[number])) {
      return true;
    }

    // Check if it's explicitly excluded
    if (NON_SYSTEM_MOUNT_EXCLUDE.some((exclude: string) => mountpoint.startsWith(exclude))) {
      return false;
    }

    // Default: non-system mount
    return false;
  }

  /**
   * Normalize disk metrics.
   */
  private static normalizeDisks(
    queryResults: Map<string, unknown>,
    instance: string
  ): MetricSeries[] {
    type DiskData = {
      size?: number;
      avail?: number;
      read?: number;
      write?: number;
      labels: Record<string, string>;
      timestamp: number;
    };

    const sizeResponse = queryResults.get('diskSize') as { data?: { result?: Array<{ metric: Record<string, string>; value: [number, string] }> } } | undefined;
    const availResponse = queryResults.get('diskAvail') as { data?: { result?: Array<{ metric: Record<string, string>; value: [number, string] }> } } | undefined;
    const readResponse = queryResults.get('diskRead') as { data?: { result?: Array<{ metric: Record<string, string>; value: [number, string] }> } } | undefined;
    const writeResponse = queryResults.get('diskWrite') as { data?: { result?: Array<{ metric: Record<string, string>; value: [number, string] }> } } | undefined;

    if (!sizeResponse?.data?.result) return [];

    const mountpoints = new Map<string, DiskData>();

    // Collect size
    for (const result of sizeResponse.data.result) {
      if (result.metric.instance !== instance) continue;
      const mountpoint = result.metric.mountpoint;
      if (!mountpoint) continue;

      const value = parseFloat(result.value[1]);
      if (!isNaN(value)) {
        const existing = mountpoints.get(mountpoint) || { labels: result.metric, timestamp: result.value[0] };
        existing.size = value;
        existing.labels = { ...existing.labels, ...result.metric };
        existing.timestamp = result.value[0];
        mountpoints.set(mountpoint, existing);
      }
    }

    // Collect avail
    if (availResponse?.data?.result) {
      for (const result of availResponse.data.result) {
        if (result.metric.instance !== instance) continue;
        const mountpoint = result.metric.mountpoint;
        if (!mountpoint) continue;

        const existing = mountpoints.get(mountpoint);
        if (existing) {
          const value = parseFloat(result.value[1]);
          if (!isNaN(value)) {
            existing.avail = value;
          }
        }
      }
    }

    // Collect I/O - match by device to mountpoint
    if (readResponse?.data?.result) {
      for (const result of readResponse.data.result) {
        if (result.metric.instance !== instance) continue;
        const device = result.metric.device;
        if (!device) continue;

        for (const data of mountpoints.values()) {
          if (data.labels.device === device) {
            const value = parseFloat(result.value[1]);
            if (!isNaN(value)) {
              data.read = value;
            }
            break;
          }
        }
      }
    }

    if (writeResponse?.data?.result) {
      for (const result of writeResponse.data.result) {
        if (result.metric.instance !== instance) continue;
        const device = result.metric.device;
        if (!device) continue;

        for (const data of mountpoints.values()) {
          if (data.labels.device === device) {
            const value = parseFloat(result.value[1]);
            if (!isNaN(value)) {
              data.write = value;
            }
            break;
          }
        }
      }
    }

    // Build metric series for each mountpoint
    const metrics: MetricSeries[] = [];

    for (const [mountpoint, data] of mountpoints) {
      const isSystemMount = this.isSystemMount(mountpoint);

      // Exclude virtual filesystems
      const fstype = data.labels.fstype || '';
      if (VIRTUAL_FSTYPES.includes(fstype as typeof VIRTUAL_FSTYPES[number])) continue;

      const totalBytes: number | null = data.size ?? null;
      const availableBytes: number | null = data.avail ?? null;
      const readBytes: number | null = data.read ?? null;
      const writeBytes: number | null = data.write ?? null;
      const usagePercent: number | null = (totalBytes !== null && availableBytes !== null && totalBytes > 0)
        ? ((totalBytes - availableBytes) / totalBytes) * 100
        : null;

      metrics.push({
        name: 'disk',
        labels: { instance, mountpoint, fstype },
        values: [totalBytes, availableBytes, usagePercent, readBytes, writeBytes],
        timestamps: [data.timestamp, data.timestamp, data.timestamp, data.timestamp, data.timestamp],
        isSystemMount,
      });
    }

    return metrics;
  }

  /**
   * Normalize temperature sensors.
   */
  private static normalizeSensors(
    queryResults: Map<string, unknown>,
    instance: string
  ): MetricSeries[] {
    const tempResponse = queryResults.get('cpuTemperature') as { data?: { result?: Array<{ metric: Record<string, string>; value: [number, string] }> } } | undefined;

    if (!tempResponse?.data?.result) return [];

    const metrics: MetricSeries[] = [];

    for (const result of tempResponse.data.result) {
      if (result.metric.instance !== instance) continue;

      const value = parseFloat(result.value[1]);
      if (isNaN(value)) continue;

      const chip = result.metric.chip || 'unknown';
      const sensor = result.metric.sensor || 'unknown';
      const sensorId = `${chip}_${sensor}`;

      metrics.push({
        name: 'temperature',
        labels: { instance, chip, sensor, sensorId },
        values: [value],
        timestamps: [result.value[0]],
      });
    }

    return metrics;
  }

  /**
   * Convert to ServerMetrics for UI consumption.
   * Flattens the structure for easier display.
   */
  static toServerMetrics(normalized: PrometheusNormalized): ServerMetrics {
    const server = normalized.server;

    // Find metrics by name
    const cpuUsage = normalized.metrics.find(m => m.name === 'cpu_usage');
    const cpuTemp = normalized.metrics.find(m => m.name === 'cpu_temperature');
    const memory = normalized.metrics.find(m => m.name === 'memory');
    const disks = normalized.metrics.filter(m => m.name === 'disk');
    const sensors = normalized.metrics.filter(m => m.name === 'temperature');

    // CPU
    const usagePercent: number | null = cpuUsage?.values[0] ?? null;
    const temperatureCelsius: number | null = cpuTemp?.values[0] ?? null;

    // Memory
    const totalBytes: number | null = memory?.values[0] ?? null;
    const availableBytes: number | null = memory?.values[1] ?? null;
    const memoryUsagePercent: number | null = (totalBytes !== null && availableBytes !== null && totalBytes > 0)
      ? ((totalBytes - availableBytes) / totalBytes) * 100
      : null;

    // Disks
    const diskData = disks.map(d => ({
      mountpoint: d.labels.mountpoint || '',
      totalBytes: d.values[0] ?? null,
      availableBytes: d.values[1] ?? null,
      usagePercent: d.values[2] ?? null,
      readBytesPerSec: d.values[3] ?? null,
      writeBytesPerSec: d.values[4] ?? null,
      fstype: d.labels.fstype || '',
      isSystemMount: d.isSystemMount ?? false,
    }));

    // Sensors
    const sensorData = sensors.map(s => ({
      sensorId: s.labels.sensorId || '',
      chip: s.labels.chip || '',
      tempCelsius: s.values[0] ?? null,
    }));

    // Network - group by device label
    const netMetrics = normalized.metrics.filter(m => m.name === 'network');
    const networkMap = new Map<string, { rxBytesPerSec: number | null; txBytesPerSec: number | null }>();
    for (const m of netMetrics) {
      const device = m.labels.device || 'unknown';
      const rx = m.values[0] ?? null;
      const tx = m.values[1] ?? null;
      networkMap.set(device, { rxBytesPerSec: rx, txBytesPerSec: tx });
    }
    const network = Array.from(networkMap.entries()).map(([device, v]) => ({ device, ...v }));

    return {
      server,
      cpu: {
        usagePercent,
        temperatureCelsius,
      },
      memory: {
        totalBytes,
        availableBytes,
        usagePercent: memoryUsagePercent,
      },
      disks: diskData,
      network,
      sensors: sensorData,
    };
  }
}