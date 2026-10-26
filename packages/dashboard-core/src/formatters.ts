/**
 * Common formatting utilities shared across clients and server.
 * Moved from @dashboard/common to keep client-facing utilities in @dashboard/core.
 */

/**
 * Format bytes as human-readable string (e.g., "1.50 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, unitIndex);
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format bytes per second as human-readable rate (e.g., "12.5 MB/s").
 */
export function formatByteRate(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}