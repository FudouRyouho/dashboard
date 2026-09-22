import type { SnapshotKey } from '@dashboard/tasks';
import type { CalendarEvent, MediaReleaseEvent } from '@dashboard/contracts';
import type { DockerDashboardStats } from '@dashboard/integrations';

export const calendarSnapshot = (
  integrationId: string,
): SnapshotKey<CalendarEvent[]> => ({ taskId: `${integrationId}:calendar` });

export const mediaReleasesSnapshot = (
  integrationId: string,
): SnapshotKey<MediaReleaseEvent[]> => ({
  taskId: `${integrationId}:media-releases`,
});

export const dockerSnapshot = (
  integrationId: string,
): SnapshotKey<DockerDashboardStats> => ({
  taskId: `${integrationId}:docker`,
});
