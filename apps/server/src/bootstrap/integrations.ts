import { Integration, IntegrationInput } from '@dashboard/integrations';
import type { DB } from '@dashboard/db';
import { getAllIntegrations } from '@dashboard/db';
import type { IntegrationInstanceRow } from '@dashboard/db';
import { getAllIntegrationFactories } from '@dashboard/integrations';

export interface RegistryEntry {
  integration: Integration;
  row: IntegrationInstanceRow;
}

export interface TaskPolicy {
  everyMs?: number;
  runOnStart?: boolean;
  expectedDurationMs?: number;
  failurePolicy?: {
    maxAttempts?: number;
    cooldownMs?: number;
  };
}

const toInput = (row: IntegrationInstanceRow): IntegrationInput => {
  const secrets: { kind: string; value: string }[] =
    'apiKey' in row
      ? [{ kind: 'apiKey', value: (row as { apiKey?: string }).apiKey ?? '' }]
      : [];
  return {
    kind: row.kind as 'sonarr' | 'radarr' | 'jellyfin' | 'docker',
    id: row.id,
    name: row.name,
    url: row.url,
    port: row.port ?? undefined,
    externalUrl: row.externalUrl ?? undefined,
    timeoutMs: 10_000,
    secrets,
  };
};

export const createIntegrationRegistry = async (
  db: DB,
): Promise<RegistryEntry[]> => {
  const integrations = await getAllIntegrations(db);
  const entries: RegistryEntry[] = [];
  const factories = getAllIntegrationFactories();
  const factoryByKind = new Map(factories.map((f) => [f.metadata.kind, f]));

  for (const integration of integrations) {
    const factory = factoryByKind.get(
      integration.kind as 'sonarr' | 'radarr' | 'jellyfin' | 'docker',
    );

    if (!factory) {
      continue;
    }

    const input = toInput(integration);
    const instance = factory.create(input);

    entries.push({
      integration: instance,
      row: integration,
    });
  }

  return entries;
};
