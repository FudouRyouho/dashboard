/**
 * Prometheus normalized data structure.
 *
 * D1: Normalization by server (instance label).
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

/**
 * Aggregated metrics per server.
 * Used when displaying metrics for a specific machine.
 */
export interface ServerMetrics {
  /** Server identifier (instance label value) */
  server: string;
  cpu: {
    /** Usage percentage (0-100) */
    usagePercent: number | null;
    /** Temperature in Celsius (if available) */
    temperatureCelsius: number | null;
  };
  memory: {
    /** Total memory in bytes */
    totalBytes: number | null;
    /** Available memory in bytes */
    availableBytes: number | null;
    /** Used memory percentage (0-100) */
    usagePercent: number | null;
  };
  disks: Array<{
    /** Mountpoint path */
    mountpoint: string;
    /** Total size in bytes */
    totalBytes: number | null;
    /** Available space in bytes */
    availableBytes: number | null;
    /** Usage percentage (0-100) */
    usagePercent: number | null;
    /** Read throughput in bytes/sec */
    readBytesPerSec: number | null;
    /** Write throughput in bytes/sec */
    writeBytesPerSec: number | null;
    /** Filesystem type */
    fstype: string;
    /** True for system mounts (/, /boot) */
    isSystemMount: boolean;
  }>;
  network: Array<{
    /** Device name (eth0, ens33, etc.) */
    device: string;
    /** Received bytes per second */
    rxBytesPerSec: number | null;
    /** Transmitted bytes per second */
    txBytesPerSec: number | null;
  }>;
  sensors: Array<{
    /** Sensor identifier */
    sensorId: string;
    /** Chip identifier */
    chip: string;
    /** Temperature in Celsius */
    tempCelsius: number | null;
  }>;
}
