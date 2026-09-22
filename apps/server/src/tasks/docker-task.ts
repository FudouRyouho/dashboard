import {
  BASE_FAILURE_POLICY,
  type TaskDefinition,
  type TaskPolicy,
} from '@dashboard/tasks';
import type { DockerDashboardStats } from '@dashboard/integrations';
import type {
  IDockerIntegration,
  Integration,
} from '@dashboard/integrations';
import { dockerSnapshot } from './task-ids';

const DOCKER_DEFAULTS = {
  everyMs: 30 * 1000,
  runOnStart: true,
  expectedDurationMs: 5_000,
} as const;

export function dockerTask(
  integration: IDockerIntegration & Integration,
  policy: TaskPolicy = {},
): TaskDefinition<DockerDashboardStats> {
  const { everyMs, runOnStart, expectedDurationMs } = {
    ...DOCKER_DEFAULTS,
    ...policy,
  };

  return {
    key: dockerSnapshot(integration.publicIntegration.id),
    everyMs,
    runOnStart,
    expectedDurationMs,
    failurePolicy: { ...BASE_FAILURE_POLICY, ...policy.failurePolicy },
    run: (signal) => {
      return integration.getDashboardStatsAsync({ signal });
    },
  };
}