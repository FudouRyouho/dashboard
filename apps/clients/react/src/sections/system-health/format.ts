/** Temperature in Celsius; em-dash when the sensor reports no value. */
export function formatTemp(temp: number | null): string {
  if (temp === null) return '—';
  return temp.toFixed(1) + '°C';
}

/** Rate: 1 decimal, caps at GB/s; differs from @dashboard/core formatByteRate (2 decimals, TB/s). */
export function formatBytesPerSec(bytes: number | null): string {
  if (bytes === null) return '—';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < 3) {
    value /= 1024;
    unitIndex++;
  }
  return value.toFixed(1) + ' ' + units[unitIndex];
}
