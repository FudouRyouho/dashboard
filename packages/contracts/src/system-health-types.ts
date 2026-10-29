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
  disks: {
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
  }[];
  network: {
    /** Device name (eth0, ens33, etc.) */
    device: string;
    /** Received bytes per second */
    rxBytesPerSec: number | null;
    /** Transmitted bytes per second */
    txBytesPerSec: number | null;
  }[];
  sensors: {
    /** Sensor identifier */
    sensorId: string;
    /** Chip identifier */
    chip: string;
    /** Temperature in Celsius */
    tempCelsius: number | null;
  }[];
}
