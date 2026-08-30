import type { SnapshotKey } from '@dashboard/tasks';
import type { CalendarEvent } from '@dashboard/contracts';

export const calendarSnapshot = (
  integrationId: string,
): SnapshotKey<CalendarEvent[]> => ({ taskId: `${integrationId}:calendar` });
