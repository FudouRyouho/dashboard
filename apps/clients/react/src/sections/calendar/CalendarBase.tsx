import { Calendar } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { CalendarDay } from './CalendarDay';
import type { CalendarEvent, IntegrationKind, ResultStatus } from '@dashboard/contracts';
import { splitMultiDayEvents, toLocalDay } from '@dashboard/core';
import { integrationIndicatorColor } from './calendar-colors';

interface CalendarGroupProps {
  /** `integrationPublicSchema` (`integration.publicIntegration`); `kind` feeds the source dot. */
  integration: {
    id: string;
    kind: IntegrationKind;
    name: string;
    url: string;
  };
  /** Snapshot facts of the calendar task; no slot for it in the month grid yet. */
  status: ResultStatus;
  events: CalendarEvent[];
}

interface CalendarBaseProps {
  /**
   * Form del response real (calendar.getEvents): eventos agrupados por
   * integracion, cada grupo con su propio `status`.
   */
  groups: CalendarGroupProps[];
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
          )?.integration.kind ?? '';
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
