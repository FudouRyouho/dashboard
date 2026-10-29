import { Calendar } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { CalendarDay } from './CalendarDay';
import type { CalendarResult, ResultStatus } from '@dashboard/contracts';
import { splitMultiDayEvents, toLocalDay } from '@dashboard/core';
import { integrationIndicatorColor } from './calendar-colors';
import { EmptyState } from '../../components/EmptyState';
import { IconCalendar } from '@tabler/icons-react';

interface CalendarBaseProps {
  /**
   * Form del response real (calendar.getEvents): eventos agrupados por
   * integracion, cada grupo con su propio `status`.
   */
  groups: CalendarResult[];
  error?: { message: string; reason?: string } | null;
}

export function CalendarBase({ groups, error }: CalendarBaseProps) {
  const normalizedEvents = useMemo(
    () => splitMultiDayEvents(groups.flatMap((g) => g.events)),
    [groups],
  );

  const [month, setMonth] = useState(new Date());

  if (groups.length === 0) {
    return <EmptyState icon={<IconCalendar size={36} />} error={error} />;
  }

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
            g.events.some((e: { id: string }) => e.id === eventsForDate[0]?.id),
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
