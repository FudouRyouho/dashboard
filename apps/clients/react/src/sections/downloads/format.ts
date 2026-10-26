/**
 * Remaining milliseconds -> compact duration (e.g. "3h", "45s").
 * `0` means "no ETA" and renders as "∞" (never completed, nothing left to count).
 */
export function formatTimeRemaining(ms: number): string {
  if (ms === 0) return '∞';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
