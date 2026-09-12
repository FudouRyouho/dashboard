import { CalendarEvent } from './calendar';
import type { ResultStatus } from './result';

/**
 * Data view status type
 * - 'never-queried': Never queried, no data and no attempt record
 * - 'fresh': Last attempt succeeded, data is fresh and available
 * - 'outdated': Data was obtained previously but last attempt failed, data may be stale
 * - 'missing': Attempted to query but no data was obtained
 */
export type DataView = 'never-queried' | 'fresh' | 'outdated' | 'missing';

/**
 * Calculate data view status from result status
 * @param status Result status (contains data and attempt info)
 * @returns Data view status
 */
export function dataViewOf(status: ResultStatus): DataView {
  if (status.attempt === null) return 'never-queried';
  if (status.attempt.outcome === 'success') return 'fresh';
  return status.data === null ? 'missing' : 'outdated';
}

export function inRange(start: Date, end: Date) {
  const from = start.getTime();
  const until = end.getTime();

  return (event: CalendarEvent): boolean => {
    const start = Date.parse(event.startDate);
    const end = event.endDate ? Date.parse(event.endDate) : start;

    return start <= until && end >= from;
  };
}
