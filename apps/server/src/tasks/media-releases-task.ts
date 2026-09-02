import {
  BASE_FAILURE_POLICY,
  type TaskDefinition,
  type TaskPolicy,
} from '@dashboard/tasks';
import type { MediaReleaseEvent } from '@dashboard/contracts';
import type {
  IMediaReleasesIntegration,
  Integration,
} from '@dashboard/integrations';
import { mediaReleasesSnapshot } from './task-ids';

const MEDIA_RELEASES_DEFAULTS = {
  everyMs: 60 * 60 * 1000,
  runOnStart: true,
  expectedDurationMs: 3_000,
};

export function mediaReleasesTask(
  integration: IMediaReleasesIntegration & Integration,
  policy: TaskPolicy = {},
): TaskDefinition<MediaReleaseEvent[]> {
  const { everyMs, runOnStart, expectedDurationMs } = {
    ...MEDIA_RELEASES_DEFAULTS,
    ...policy,
  };

  return {
    key: mediaReleasesSnapshot(integration.publicIntegration.id),
    everyMs,
    runOnStart,
    expectedDurationMs,
    failurePolicy: { ...BASE_FAILURE_POLICY, ...policy.failurePolicy },
    run: (signal) => {
      return integration.getMediaReleasesAsync({
        signal,
      });
    },
  };
}
