import { useEffect, useState } from 'react';
import { SimpleGrid } from '@mantine/core';
import type {
  CalendarResult,
  DockerContainersResult,
  IntegrationOutput,
  MediaReleasesResult,
  SystemHealthEntry,
} from '@dashboard/contracts';
import type { ServerMetrics } from '@dashboard/contracts';

import { CalendarBase } from '../sections/calendar/CalendarBase';
import { MediaReleasesBase } from '../sections/media-releases/MediaReleasesBase';
import { CalendarEventList } from '../sections/calendar/CalendarEventList';
import { DownloadsSectionBase } from '../sections/downloads/DownloadsSectionBase';
import { DockerSectionBase } from '../sections/docker/DockerSectionBase';
import { SystemHealthBase } from '../sections/system-health/SystemHealthBase';
import { IntegrationsBase } from '../sections/integrations/IntegrationsBase';
import { downloadsMock } from '../mock/downloads.mock';

import * as api from '../api/client';

const downloadsClients = [downloadsMock];

export function MainBody() {
  const [calGroups, setCalGroups] = useState<CalendarResult[]>([]);
  const [mediaGroups, setMediaGroups] = useState<MediaReleasesResult[]>([]);
  const [dockerServers, setDockerServers] = useState<DockerContainersResult[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<ServerMetrics[]>([]);
  const [ints, setInts] = useState<IntegrationOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.allSettled([
      api.fetchCalendarEvents().then((r) => {
        if (r) setCalGroups(r);
      }),
      api.fetchMediaReleases().then((r) => {
        if (r) setMediaGroups(r);
      }),
      api.fetchDockerContainers().then((r) => {
        if (r) setDockerServers(r);
      }),
      api.fetchSystemHealth().then((r) => {
        if (r) setHealthMetrics((r as SystemHealthEntry[]).flatMap((e) => e.metrics));
      }),
      api.fetchIntegrations().then((r) => {
        if (r) setInts(r);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
    );
  }

  return (
    <>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <CalendarBase groups={calGroups} />
        </div>
        <div>
          <CalendarEventList events={calGroups[0]?.events ?? []} />
        </div>
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <MediaReleasesBase groups={mediaGroups} />
        </div>
        <div />
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <DownloadsSectionBase clients={downloadsClients} />
        </div>
        <div />
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <DockerSectionBase servers={dockerServers} />
        </div>
        <div />
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <SystemHealthBase metrics={healthMetrics} />
        </div>
        <div />
      </SimpleGrid>
      <IntegrationsBase integrations={ints} />
    </>
  );
}
