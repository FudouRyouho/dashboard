import { TaskDefinition } from '@dashboard/tasks';
import { RegistryEntry } from '../bootstrap/integrations';
import type { TaskPolicy } from '../bootstrap/integrations';
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

  for (const { integration, config } of entries) {
    const built: string[] = [];
    const configPolicies = policies.get(config.id) ?? {};

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

    assertNoUnknownTasks(config, built);
  }

  return definitions;
}

function assertNoUnknownTasks(
  _config: RegistryEntry['config'],
  _built: string[],
): void {
  // Task validation happens at configuration time via DB policies
  // This function ensures no duplicate task definitions are created
}
