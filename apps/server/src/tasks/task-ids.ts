import type { SnapshotKey } from '@dashboard/tasks';
import type { CalendarEvent, MediaReleaseEvent } from '@dashboard/contracts';
import type { DockerDashboardStats } from '@dashboard/integrations';

// Task ID suffix constants — use these instead of raw strings to prevent typos
export const TASK_ID_SUFFIX = {
  calendar: 'calendar',
  'media-releases': 'media-releases',
  docker: 'docker',
  downloads: 'downloads',
  'system-health': 'system-health',
} as const;

// Helper type for calendar snapshot data (includes coverage info)
export type CalendarSnapshotData = {
  data: CalendarEvent[];
  from: string;
  to: string;
};

export const calendarSnapshot = (
  integrationId: string,
): SnapshotKey<CalendarSnapshotData> => ({ taskId: `${integrationId}:${TASK_ID_SUFFIX.calendar}` });

export const mediaReleasesSnapshot = (
  integrationId: string,
): SnapshotKey<MediaReleaseEvent[]> => ({
  taskId: `${integrationId}:${TASK_ID_SUFFIX['media-releases']}`,
});

export const dockerSnapshot = (
  integrationId: string,
): SnapshotKey<DockerDashboardStats> => ({ taskId: `${integrationId}:${TASK_ID_SUFFIX.docker}` });

/**
 * Returns all valid task ID suffixes.
 * Used for validation in create-task-definitions.ts
 */
export const VALID_TASK_SUFFIXES = new Set(Object.values(TASK_ID_SUFFIX));
