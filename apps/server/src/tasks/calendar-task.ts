import {
  BASE_FAILURE_POLICY,
  type TaskDefinition,
  type TaskPolicy,
} from '@dashboard/tasks';
import type { CalendarEvent } from '@dashboard/contracts';
import type {
  ICalendarIntegration,
  Integration,
} from '@dashboard/integrations';
import { serverCalendarWindow } from './calendar-window';
import { calendarSnapshot } from './task-ids';

const CALENDAR_DEFAULTS = {
  everyMs: 4 * 60 * 60 * 1000,
  runOnStart: true,
  expectedDurationMs: 2_500,
} as const;

const INCLUDE_UNMONITORED = false;

export function calendarTask(
  integration: ICalendarIntegration & Integration,
  policy: TaskPolicy = {},
): TaskDefinition<CalendarEvent[]> {
  const { everyMs, runOnStart, expectedDurationMs } = {
    ...CALENDAR_DEFAULTS,
    ...policy,
  };

  return {
    key: calendarSnapshot(integration.publicIntegration.id),
    everyMs,
    runOnStart,
    expectedDurationMs,
    failurePolicy: { ...BASE_FAILURE_POLICY, ...policy.failurePolicy },
    run: (signal) => {
      const { start, end } = serverCalendarWindow();
      return integration.getCalendarEventsAsync(
        start,
        end,
        INCLUDE_UNMONITORED,
        {
          signal,
        },
      );
    },
  };
}
