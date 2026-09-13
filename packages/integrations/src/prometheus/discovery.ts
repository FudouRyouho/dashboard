import { PrometheusClient } from './client';
import {
  GROUPING_LABELS,
  SYSTEM_MOUNTPOINTS,
  NON_SYSTEM_MOUNT_EXCLUDE,
} from './constants';

/**
 * D2: Discovery service for Prometheus metrics.
 *
 * Discovers:
 * - Available instances (servers)
 * - Mountpoints
 * - Network devices
 * - Disk devices
 * - Temperature sensors
 *
 * All discovery uses label_values with 5 min cache.
 */
export class PrometheusDiscovery {
  private readonly client: PrometheusClient;

  constructor(client: PrometheusClient) {
    this.client = client;
  }

  /**
   * Discover all available instances (servers).
   * Uses label_values('instance') to get unique server identifiers.
   */
  async discoverInstances(signal?: AbortSignal): Promise<string[] | null> {
    return this.client.labelValues('instance', signal);
  }

  /**
   * Discover all mountpoints for filesystem metrics.
   */
  async discoverMountpoints(signal?: AbortSignal): Promise<string[] | null> {
    return this.client.labelValues('mountpoint', signal);
  }

  /**
   * Discover all network devices.
   */
  async discoverNetworkDevices(signal?: AbortSignal): Promise<string[] | null> {
    return this.client.labelValues('device', signal);
  }

  /**
   * Discover all disk devices.
   */
  async discoverDiskDevices(signal?: AbortSignal): Promise<string[] | null> {
    return this.client.labelValues('device', signal);
  }

  /**
   * Discover temperature sensors.
   * Returns array of { chip, sensor } pairs.
   */
  async discoverSensors(signal?: AbortSignal): Promise<Array<{ chip: string; sensor: string }> | null> {
    const chips = await this.client.labelValues('chip', signal);
    if (!chips) return null;

    const sensors: Array<{ chip: string; sensor: string }> = [];

    for (const chip of chips) {
      const sensorValues = await this.client.labelValues('sensor', signal);
      if (!sensorValues) continue;

      for (const sensor of sensorValues) {
        sensors.push({ chip, sensor });
      }
    }

    return sensors;
  }

  /**
   * Discover all relevant labels for a metric.
   * Used for dynamic query building.
   */
  async discoverMetricLabels(_metricName: string, _signal?: AbortSignal): Promise<string[]> {
    // This requires a different approach - we'd need to query the metric first
    // and extract unique label names from the response
    // For now, we use the predefined GROUPING_LABELS
    return [...GROUPING_LABELS];
  }

  /**
   * Determine if a mountpoint is a system mount.
   */
  static isSystemMount(mountpoint: string): boolean {
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
}
