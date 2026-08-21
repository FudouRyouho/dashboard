import { Calendar } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { CalenderDay } from './CalendarDay';
import type { CalendarEvent } from '@dashboard/integrations';

export interface CalendarBaseProps {
    events: CalendarEvent[];
}

export function CalenderBase({ events }: CalendarBaseProps) {

    const normalizedEvents = useMemo(() => splitEvents(events), [events]);


    const [month, setMonth] = useState(new Date());
    return (
        <Calendar
            defaultDate={new Date}
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
                    borderRadius: "xs",
                },
                weekday: {
                    padding: 0,
                },
            }}
            renderDay={(tileDate) => {
                const eventsForDate = normalizedEvents.filter((event) => toLocalDay(event.startDate) === tileDate)
                return (
                    <CalenderDay date={tileDate} events={eventsForDate} disabled={eventsForDate.length === 0} />
                )
            }}
        />

    )
}

export const splitEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    const splitEvents: CalendarEvent[] = [];

    for (const event of events) {
        if (!event.endDate) {
            splitEvents.push(event);
            continue;
        }
        //Pasar el string a un objeto Date
        const start = new Date(event.startDate)
        const end = new Date(event.endDate)

        // Verificar si son lo mismo

        if (
            start.getFullYear() === end.getFullYear() &&
            start.getMonth() === end.getMonth() &&
            start.getDate() === end.getDate()
        ) {
            splitEvents.push(event);
            continue
        }
        //invalidar
        if (start.getTime() > end.getTime()) { continue; }
        //eventos multiples dias
        let currentStart = new Date(start);

        while (currentStart.getTime() < end.getTime()) {
            //Final del dia
            const currentEnd = new Date(currentStart);
            currentEnd.setHours(23, 59, 59, 999)

            splitEvents.push({
                ...event,
                startDate: currentStart.toISOString(), endDate: currentEnd.getTime() > end.getTime() ? event.endDate : currentEnd.toISOString()
            }) //devuelve todo como string

            //Sumar un dia y resetear a 00
            currentStart.setDate(currentStart.getDate() + 1)
            currentStart.setHours(0, 0, 0, 0);
        }
    }

    return splitEvents;
};

const toLocalDay = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}