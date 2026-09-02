import type { SnapshotKey } from '@dashboard/tasks';
import type { CalendarEvent, MediaReleaseEvent } from '@dashboard/contracts';

export const calendarSnapshot = (
  integrationId: string,
): SnapshotKey<CalendarEvent[]> => ({ taskId: `${integrationId}:calendar` });

export const mediaReleasesSnapshot = (
  integrationId: string,
): SnapshotKey<MediaReleaseEvent[]> => ({
  taskId: `${integrationId}:media-releases`,
});
