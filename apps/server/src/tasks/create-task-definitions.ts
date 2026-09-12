import { TaskDefinition, type TaskPolicy } from '@dashboard/tasks';
import { RegistryEntry } from '../bootstrap/integrations';
import {
  supportsCalendar,
  supportsMediaReleases,
} from '@dashboard/integrations';
import { calendarTask } from './calendar-task';
import { mediaReleasesTask } from './media-releases-task';

export function createTaskDefinitions(
  entries: RegistryEntry[],
  policies: Map<string, { calendar?: TaskPolicy; mediaReleases?: TaskPolicy }>,
): TaskDefinition[] {
  const definitions: TaskDefinition[] = [];

  for (const { integration, row } of entries) {
    const built: string[] = [];
    const configPolicies = policies.get(row.id) ?? {};

    if (supportsCalendar(integration)) {
      definitions.push(calendarTask(integration, configPolicies.calendar));
      built.push('calendar');
    }

    if (supportsMediaReleases(integration)) {
      definitions.push(
        mediaReleasesTask(integration, configPolicies.mediaReleases),
      );
      built.push('media-releases');
    }

    assertNoUnknownTasks(row, built, configPolicies);
  }

  return definitions;
}

function assertNoUnknownTasks(
  row: RegistryEntry['row'],
  built: string[],
  configPolicies: { calendar?: TaskPolicy; mediaReleases?: TaskPolicy },
): void {
  const supported = new Set(built);
  for (const key of Object.keys(configPolicies) as Array<keyof typeof configPolicies>) {
    if (configPolicies[key] != null && !supported.has(key)) {
      throw new Error(
        `Integration ${row.id} (${row.kind}) has a policy for "${key}" ` +
        `but does not support this capability. Supported: ${[...supported].join(', ')}`,
      );
    }
  }
}
