import { Calendar } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { CalenderDay } from './CalendarDay';
import { type CalendarEvent } from '@dashboard/contracts';
import { splitMultiDayEvents, toLocalDay } from '@dashboard/core';

export interface CalendarBaseProps {
  events: CalendarEvent[];
}

export function CalenderBase({ events }: CalendarBaseProps) {
  const normalizedEvents = useMemo(() => splitMultiDayEvents(events), [events]);

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
        return (
          <CalenderDay
            date={tileDate}
            events={eventsForDate}
            disabled={eventsForDate.length === 0}
          />
        );
      }}
    />
  );
}
