import { TaskDefinition } from '@dashboard/tasks';
import { RegistryEntry } from '../bootstrap/integrations';
import {
  supportsCalendar,
  supportsMediaReleases,
} from '@dashboard/integrations';
import { calendarTask } from './calendar-task';
import { mediaReleasesTask } from './media-releases-task';

export function createTaskDefinitions(
  entries: RegistryEntry[],
): TaskDefinition[] {
  const definitions: TaskDefinition[] = [];

  for (const { integration, config } of entries) {
    const built: string[] = [];

    if (supportsCalendar(integration)) {
      definitions.push(calendarTask(integration, config.tasks.calendar));
      built.push('calendar');
    }

    if (supportsMediaReleases(integration)) {
      definitions.push(
        mediaReleasesTask(integration, config.tasks.mediaReleases),
      );
      built.push('media-releases');
    }

    assertNoUnknownTasks(config, built);
  }

  return definitions;
}

function assertNoUnknownTasks(
  config: RegistryEntry['config'],
  built: string[],
): void {
  const unknown = Object.keys(config.tasks).filter((k) => !built.includes(k));
  if (unknown.length === 0) return;

  throw new Error(
    `La integración "${config.id}" configura tareas que no existen: ` +
      `${unknown.join(', ')}. Disponibles para esta integración: ` +
      `${built.join(', ') || 'ninguna'}.`,
  );
}
