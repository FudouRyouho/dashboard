import { CalendarEvent } from './calendar';
import type { ResultStatus } from './result';

export type DataView = 'never-queried' | 'fresh' | 'outdated' | 'missing';

export function dataViewOf(status: ResultStatus): DataView {
  if (status.attempt === null) return 'never-queried';
  if (status.attempt.outcome === 'success') return 'fresh';
  return status.data === null ? 'missing' : 'outdated';
}

export function inRange(start: Date, end: Date) {
  const desde = start.getTime();
  const hasta = end.getTime();

  return (event: CalendarEvent): boolean => {
    const inicio = Date.parse(event.startDate);
    const fin = event.endDate ? Date.parse(event.endDate) : inicio;

    return inicio <= hasta && fin >= desde;
  };
}
