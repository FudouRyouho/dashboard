/**
 * Prometheus integration constants.
 *
 * These are configuration values, not types.
 */

/**
 * Discovery TTL configuration.
 */
export const DEFAULT_DISCOVERY_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Metric names used by Node Exporter.
 * These are standard metrics, not discovered dynamically.
 */
export const NODE_EXPORTER_METRICS = {
  CPU_TOTAL: 'node_cpu_seconds_total',
  CPU_IDLE: 'node_cpu_seconds_total',
  CPU_TEMPERATURE: 'node_hwmon_temp_celsius',
  MEMORY_TOTAL: 'node_memory_MemTotal_bytes',
  MEMORY_AVAILABLE: 'node_memory_MemAvailable_bytes',
  NETWORK_RX: 'node_network_receive_bytes_total',
  NETWORK_TX: 'node_network_transmit_bytes_total',
  DISK_SIZE: 'node_filesystem_size_bytes',
  DISK_AVAIL: 'node_filesystem_avail_bytes',
  DISK_READ: 'node_disk_read_bytes_total',
  DISK_WRITE: 'node_disk_written_bytes_total',
} as const;

/**
 * Labels used for grouping/aggregation.
 */
export const GROUPING_LABELS = ['instance', 'device', 'mountpoint', 'fstype', 'chip', 'sensor'] as const;

/**
 * System mountpoints that should be marked with isSystemMount=true.
 */
export const SYSTEM_MOUNTPOINTS = ['/', '/boot', '/boot/efi', '/efi'] as const;

/**
 * Non-system mountpoints to exclude from isSystemMount.
 */
export const NON_SYSTEM_MOUNT_EXCLUDE = ['/run', '/tmp', '/var/run', '/var/tmp'] as const;

/**
 * Filesystem types considered virtual/system.
 */
export const VIRTUAL_FSTYPES = ['tmpfs', 'devtmpfs', 'proc', 'sysfs', 'cgroup', 'cgroup2'] as const;