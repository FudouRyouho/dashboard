import { CalendarEvent } from './calendar';
import type { ResultStatus } from './result';

export type DataView = 'never-queried' | 'fresh' | 'outdated' | 'missing';

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
