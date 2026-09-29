import { TaskDefinition, type TaskPolicy } from '@dashboard/tasks';
import { RegistryEntry } from '../bootstrap/integrations';
import {
  supportsCalendar,
  supportsDocker,
  supportsMediaReleases,
} from '@dashboard/integrations';
import { calendarTask } from './calendar-task';
import { dockerTask } from './docker-task';
import { mediaReleasesTask } from './media-releases-task';
import { TASK_ID_SUFFIX } from './task-ids';

export function createTaskDefinitions(
  entries: RegistryEntry[],
  policies: Map<
    string,
    { calendar?: TaskPolicy; 'media-releases'?: TaskPolicy; docker?: TaskPolicy }
  >,
): TaskDefinition[] {
  const definitions: TaskDefinition[] = [];

  for (const { integration, row } of entries) {
    const built: (keyof typeof TASK_ID_SUFFIX)[] = [];
    const configPolicies = policies.get(row.id) ?? {};

    if (supportsCalendar(integration)) {
      definitions.push(calendarTask(integration, configPolicies.calendar));
      built.push('calendar');
    }

    if (supportsMediaReleases(integration)) {
      definitions.push(
        mediaReleasesTask(integration, configPolicies['media-releases']),
      );
      built.push('media-releases');
    }

    if (supportsDocker(integration)) {
      definitions.push(dockerTask(integration, configPolicies.docker));
      built.push('docker');
    }

    assertNoUnknownTasks(row, built, configPolicies);
  }

  return definitions;
}

function assertNoUnknownTasks(
  row: RegistryEntry['row'],
  built: (keyof typeof TASK_ID_SUFFIX)[],
  configPolicies: {
    calendar?: TaskPolicy;
    'media-releases'?: TaskPolicy;
    docker?: TaskPolicy;
  },
): void {
  const supported = new Set(built);
  for (const key of Object.keys(configPolicies) as Array<
    keyof typeof configPolicies
  >) {
    if (configPolicies[key] != null && !supported.has(key)) {
      throw new Error(
        `Integration ${row.id} (${row.kind}) has a policy for "${key}" ` +
          `but does not support this capability. Supported: ${[...supported].join(', ')}`,
      );
    }
  }
}
