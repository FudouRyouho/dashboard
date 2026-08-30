import { CalendarEvent } from '@dashboard/contracts';
import { Integration } from './integration';

export interface ICalendarIntegration {
  getCalendarEventsAsync(
    start: Date,
    end: Date,
    includeUnmonitored: boolean,
    options?: { signal?: AbortSignal },
  ): Promise<CalendarEvent[]>;
}

const calendarCapability: keyof ICalendarIntegration = 'getCalendarEventsAsync';

export const supportsCalendar = (
  integration: Integration,
): integration is ICalendarIntegration & Integration =>
  typeof (integration as Partial<ICalendarIntegration>)[calendarCapability] ===
  'function';
