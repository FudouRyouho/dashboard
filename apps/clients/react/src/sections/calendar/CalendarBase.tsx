import { Calendar } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { CalendarDay } from './CalendarDay';
import { type CalendarEvent } from '@dashboard/contracts';
import { splitMultiDayEvents, toLocalDay } from '@dashboard/core';
import { integrationIndicatorColor } from './calendar-colors';

interface CalendarBaseProps {
  /**
   * Form del response real (calendar.getEvents): eventos agrupados por
   * integracion. `kind` alimenta el dot de "app de origen" vía definitions.
   */
  groups: { kind: string; events: CalendarEvent[] }[];
}

export function CalendarBase({ groups }: CalendarBaseProps) {
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
          <CalendarDay
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
