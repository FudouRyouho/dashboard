import { Calendar } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { CalenderDay } from './CalendarDay';
import { type CalendarEvent } from '@dashboard/contracts';
import { splitMultiDayEvents, toLocalDay } from '@dashboard/core';
import { integrationDefs } from '@dashboard/definitions';

interface CalendarBaseProps {
  /**
   * Form del response real (calendar.getEvents): eventos agrupados por
   * integracion. `kind` alimenta el dot de "app de origen" vía definitions.
   */
  groups: Array<{ kind: string; events: CalendarEvent[] }>;
}

export const integrationIndicatorColor = (
  kind: string,
): string | undefined =>
  (integrationDefs as Record<string, { color: string }>)[kind]?.color;

export function CalenderBase({ groups }: CalendarBaseProps) {
  const normalizedEvents = useMemo(
    () => splitMultiDayEvents(groups.flatMap((g) => g.events)),
    [groups],
  );

  const [month, setMonth] = useState(new Date());
  return (
    <Calendar
      defaultDate={new Date()}
      onPreviousMonth={(month) => setMonth(new Date(month))}
      onNextMonth={(month) => setMonth(new Date(month))}
      highlightToday
      hideWeekdays={false}
      date={month}
      maxLevel="month"
      firstDayOfWeek={1}
      fullWidth
      styles={{
        calendarHeaderControl: {
          borderRadius: 'xs',
        },
        weekday: {
          padding: 0,
        },
      }}
      renderDay={(tileDate) => {
        const eventsForDate = normalizedEvents.filter(
          (event) => toLocalDay(event.startDate) === tileDate,
        );
        const kind =
          groups.find((g) =>
            g.events.some((e) => e.id === eventsForDate[0]?.id),
          )?.kind ?? '';
        return (
          <CalenderDay
            date={tileDate}
            events={eventsForDate}
            kindColor={integrationIndicatorColor(kind)}
            disabled={eventsForDate.length === 0}
          />
        );
      }}
    />
  );
}
