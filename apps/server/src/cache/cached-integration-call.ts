import type { CacheStore } from '@dashboard/common';
import {
  classifyIntegrationError,
  type CalendarEvent,
  type ICalendarIntegration,
  type Integration,
  type ResultStatus,
} from '@dashboard/integrations';

const TTL_MS = 60_000;

export interface CachedCalendarResult {
  status: Omit<ResultStatus, 'updatedAt'> & { updatedAt: Date | null };
  events: CalendarEvent[];
}

export async function getCalendarCached(
  store: CacheStore,
  integration: ICalendarIntegration & Integration,
  start: Date,
  end: Date,
  includeUnmonitored: boolean,
  logger: { warn: (obj: Record<string, unknown>, msg: string) => void },
): Promise<CachedCalendarResult> {
  const { id, kind } = integration.publicIntegration;
  const key = `calendar:${id}`;
  const saved = store.get<CalendarEvent[]>(key);

  if (saved && Date.now() - saved.updatedAt.getTime() < TTL_MS) {
    return {
      status: { code: 'ok', updatedAt: saved.updatedAt },
      events: saved.data,
    };
  }

  try {
    const events = await integration.getCalendarEventsAsync(
      start,
      end,
      includeUnmonitored,
    );
    store.set(key, events);
    return { status: { code: 'ok', updatedAt: new Date() }, events };
  } catch (err) {
    const { reason, httpStatus } = classifyIntegrationError(err);

    logger.warn(
      {
        err,
        operation: 'calendar.getEvents',
        integrationId: id,
        integrationKind: kind,
        reason,
        httpStatus,
      },
      'Calendar integration request failed',
    );

    if (saved) {
      return {
        status: {
          code: 'stale',
          updatedAt: saved.updatedAt,
          reason,
          httpStatus,
        },
        events: saved.data,
      };
    }

    return {
      status: { code: 'failed', updatedAt: null, reason, httpStatus },
      events: [],
    };
  }
}
