import { SimpleGrid } from '@mantine/core';
import { CalendarBase } from '../sections/calendar/CalendarBase';
import { mediaReleasesMock } from '../mock/media-releases.mock'
import { MediaReleasesBase } from '../sections/media-releases/MediaReleasesBase'

import { calendarGroupsMock } from '../mock/calendar.mock'
import { CalendarEventList } from '../sections/calendar/CalendarEventList';

import { downloadsMock } from '../mock/downloads.mock'
import { DownloadsSectionBase } from '../sections/downloads/DownloadsSectionBase';

import { dockerMock } from '../mock/docker.mock'
import { DockerSectionBase } from '../sections/docker/DockerSectionBase';

import { systemHealthMock } from '../mock/system-health.mock'
import { SystemHealthBase } from '../sections/system-health/SystemHealthBase';

import { integrationsMock } from '../mock/integrations.mock'
import { IntegrationsBase } from '../sections/integrations/IntegrationsBase';

/** Groups mock events by kind (mirrors the real calendar.getEvents response). */
/** Wrap single mock in array to match DownloadsSectionBaseProps.clients type. */
const downloadsClients = [downloadsMock];

export function MainBody() {
  return (<>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <CalendarBase groups={calendarGroupsMock} />
      </div>
      <div>
        <CalendarEventList events={calendarGroupsMock[0]?.events ?? []} />
      </div>
    </SimpleGrid>
    <SimpleGrid cols={{ xs: 2, lg: 2 }}>
      <div>
        <MediaReleasesBase groups={mediaReleasesMock} />
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
        <SystemHealthBase metrics={systemHealthMock} />
      </div>
      <div>
      </div>
    </SimpleGrid>
    <IntegrationsBase integrations={integrationsMock} />
  </>
  );
}