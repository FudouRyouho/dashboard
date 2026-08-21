import { SimpleGrid } from '@mantine/core';
import { CalenderBase } from '../sections/calender/CalendarBase';
import { calendarEvents } from '../mock/calendar.mock';
import { CalendarEventList } from '../sections/calender/CalendarEventList';

export function MainBody() {
  return (
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <CalenderBase events={calendarEvents} />{' '}
      </div>
      <div>
        <CalendarEventList events={calendarEvents} />
      </div>{' '}
      {/* For testing example */}
    </SimpleGrid>
  );
}
