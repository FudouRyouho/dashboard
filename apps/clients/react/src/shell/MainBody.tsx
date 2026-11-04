import { useEffect, useState } from 'react';
import { SimpleGrid } from '@mantine/core';
import type {
  CalendarResult,
  DockerContainersResult,
  IntegrationOutput,
  MediaReleasesResult,
  SystemHealthEntry,
  DownloadClientJobsWithIntegration,
} from '@dashboard/contracts';
import type { ServerMetrics } from '@dashboard/contracts';

import { CalendarBase } from '../sections/calendar/CalendarBase';
import { MediaReleasesBase } from '../sections/media-releases/MediaReleasesBase';
import { CalendarEventList } from '../sections/calendar/CalendarEventList';
import { DownloadsSectionBase } from '../sections/downloads/DownloadsSectionBase';
import { DockerSectionBase } from '../sections/docker/DockerSectionBase';
import { SystemHealthBase } from '../sections/system-health/SystemHealthBase';
import { IntegrationsBase } from '../sections/integrations/IntegrationsBase';

import * as api from '../api/client';

type FetchError = { message: string; reason?: string } | null;

export function MainBody() {
  const [calGroups, setCalGroups] = useState<CalendarResult[]>([]);
  const [calError, setCalError] = useState<FetchError>(null);
  const [mediaGroups, setMediaGroups] = useState<MediaReleasesResult[]>([]);
  const [mediaError, setMediaError] = useState<FetchError>(null);
  const [dockerServers, setDockerServers] = useState<DockerContainersResult[]>([]);
  const [dockerError, setDockerError] = useState<FetchError>(null);
  const [healthMetrics, setHealthMetrics] = useState<ServerMetrics[]>([]);
  const [healthError, setHealthError] = useState<FetchError>(null);
  const [ints, setInts] = useState<IntegrationOutput[]>([]);
  const [intsError, setIntsError] = useState<FetchError>(null);
  const [downloadsClients, setDownloadsClients] = useState<DownloadClientJobsWithIntegration[]>([]);
  const [downloadsError, setDownloadsError] = useState<FetchError>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.allSettled([
      api.fetchCalendarEvents().then(
        (r) => { if (r) setCalGroups(r); },
        (e) => { setCalError({ message: e.message, reason: (e as any).cause?.code }); }
      ),
      api.fetchMediaReleases().then(
        (r) => { if (r) setMediaGroups(r); },
        (e) => { setMediaError({ message: e.message, reason: (e as any).cause?.code }); }
      ),
      api.fetchDockerContainers().then(
        (r) => { if (r) setDockerServers(r); },
        (e) => { setDockerError({ message: e.message, reason: (e as any).cause?.code }); }
      ),
      api.fetchSystemHealth().then(
        (r) => { if (r) setHealthMetrics((r as SystemHealthEntry[]).flatMap((e) => e.metrics)); },
        (e) => { setHealthError({ message: e.message, reason: (e as any).cause?.code }); }
      ),
      api.fetchIntegrations().then(
        (r) => { if (r) setInts(r); },
        (e) => { setIntsError({ message: e.message, reason: (e as any).cause?.code }); }
      ),
      api.fetchDownloads().then(
        (r) => { if (r) setDownloadsClients(r); },
        (e) => { setDownloadsError({ message: e.message, reason: (e as any).cause?.code }); }
      ),
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
          <CalendarBase groups={calGroups} error={calError} />
        </div>
        <div>
          <CalendarEventList events={calGroups[0]?.events ?? []} />
        </div>
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <MediaReleasesBase groups={mediaGroups} error={mediaError} />
        </div>
        <div />
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <DownloadsSectionBase clients={downloadsClients} error={downloadsError} />
        </div>
        <div />
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <DockerSectionBase servers={dockerServers} error={dockerError} />
        </div>
        <div />
      </SimpleGrid>
      <SimpleGrid cols={{ xs: 2, lg: 2 }}>
        <div>
          <SystemHealthBase metrics={healthMetrics} error={healthError} />
        </div>
        <div />
      </SimpleGrid>
      <IntegrationsBase integrations={ints} error={intsError} />
    </>
  );
}
