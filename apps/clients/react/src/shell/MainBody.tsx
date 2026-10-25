import { SimpleGrid } from '@mantine/core';
import { CalenderBase } from '../sections/calender/CalendarBase';
import { calendarEvents } from '../mock/calendar.mock';
import { CalendarEventList } from '../sections/calender/CalendarEventList';

import { mediaReleasesMock } from '../mock/media-releases.mock'
import { MediaReleasesBase } from '../sections/media-releases/MediaReleasesBase'

import { downloadsMock } from '../mock/downloads.mock'
import { DownloadsSectionBase } from '../sections/downloads/DownloadsSectionBase';

import { dockerMock } from '../mock/docker.mock'
import { DockerSectionBase } from '../sections/docker/DockerSectionBase';

import { systemHealthMock } from '../mock/system-health.mock'
import { SystemHealthSection } from '../sections/system-health/SystemHealthSection';

import { integrationsMock } from '../mock/integrations.mock'
import { IntegrationsSection } from '../sections/integrations/IntegrationsSection';

/** Groups mock events by kind (mirrors the real calendar.getEvents response). */
const calendarGroups = [
  { kind: 'sonarr', events: calendarEvents },
];

/** Wrap single mock in array to match DownloadsSectionBaseProps.clients type. */
const downloadsClients = [downloadsMock];

export function MainBody() {
  return (<>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <CalenderBase groups={calendarGroups} />
      </div>
      <div>
        <CalendarEventList events={calendarEvents} />
      </div>
    </SimpleGrid>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <MediaReleasesBase releases={mediaReleasesMock} />
      </div>
      <div>
      </div>
    </SimpleGrid>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <DownloadsSectionBase clients={downloadsClients} />
      </div>
      <div>
      </div>
    </SimpleGrid>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <DockerSectionBase servers={dockerMock} />
      </div>
      <div>
      </div>
    </SimpleGrid>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <SystemHealthSection metrics={systemHealthMock} />
      </div>
      <div>
      </div>
    </SimpleGrid>
    <IntegrationsSection integrations={integrationsMock} />
  </>
  );
}