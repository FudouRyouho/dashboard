import { SimpleGrid } from '@mantine/core';
import { CalenderBase } from '../sections/calender/CalendarBase';
import { calendarEvents } from '../mock/calendar.mock';
import { CalendarEventList } from '../sections/calender/CalendarEventList';

import { mediaReleasesMock } from '../mock/media-releases.mock'
import { MediaReleasesBase } from '../sections/media-releases/MediaReleasesBase'

/** Agrupa eventos mock por kind (simula response real calendar.getEvents). */
const calendarGroups = [
  { kind: 'sonarr', events: calendarEvents },
];

export function MainBody() {
  return (<>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>      <div>
        <CalenderBase groups={calendarGroups} />{' '}
      </div>
      <div>
        <CalendarEventList events={calendarEvents} />
      </div>
    </SimpleGrid>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>      <div>
        <MediaReleasesBase releases={mediaReleasesMock} />{' '}
      </div>
    </SimpleGrid></>
  );
}