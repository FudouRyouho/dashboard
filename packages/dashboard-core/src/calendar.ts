import type { CalendarEvent } from '@dashboard/contracts';

/**
 * Splits events that span multiple days into one event per day.
 * Invalid ranges (start > end) are skipped.
 * Single-day events are returned as-is.
 */
export function splitMultiDayEvents(events: CalendarEvent[]): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    // Single-day or no-end event — keep as-is
    if (!event.endDate) {
      result.push(event);
      continue;
    }

    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    // Skip invalid ranges
    if (start > end) continue;

    // Same day — keep as-is
    if (
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCDate() === end.getUTCDate()
    ) {
      result.push(event);
      continue;
    }

    // Multi-day: split into daily events
    const currentStart = new Date(start);

    while (currentStart < end) {
      const currentEnd = new Date(currentStart);
      currentEnd.setUTCHours(23, 59, 59, 999);

      result.push({
        ...event,
        startDate: currentStart.toISOString(),
        endDate:
          currentEnd > end ? event.endDate : currentEnd.toISOString(),
      });

      currentStart.setUTCDate(currentStart.getUTCDate() + 1);
      currentStart.setUTCHours(0, 0, 0, 0);
    }
  }

  return result;
}

/**
 * Groups events by their date key (YYYY-MM-DD).
 * Uses startDate as the grouping key.
 */
export function groupByDay(
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dayKey = toLocalDay(event.startDate);
    const existing = groups.get(dayKey) ?? [];
    existing.push(event);
    groups.set(dayKey, existing);
  }

  return groups;
}

/** Returns true if the event spans only one day (same UTC date) */
export function isAllDay(event: CalendarEvent): boolean {
  if (!event.endDate) return true;

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCDate() === end.getUTCDate()
  );
}

/**
 * Returns the local day string (YYYY-MM-DD) for an ISO date string.
 * Uses UTC components to ensure consistency with API-provided dates.
 */
export function toLocalDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
