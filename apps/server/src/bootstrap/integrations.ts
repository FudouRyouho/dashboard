import {
  Integration,
  IntegrationInput,
} from '@dashboard/integrations';
import { IntegrationKind } from '@dashboard/contracts';
import type { DB } from '@dashboard/db';
import { getAllIntegrations } from '@dashboard/db';
import type { IntegrationInstanceRow } from '@dashboard/db';
import { getAllIntegrationFactories } from '@dashboard/integrations';

export interface RegistryEntry {
  integration: Integration;
  config: IntegrationRuntimeConfig;
}

export interface IntegrationRuntimeConfig {
  kind: 'sonarr' | 'radarr' | 'jellyfin' | 'portainer';
  id: string;
  name: string;
  url: string;
  port?: number;
  externalUrl?: string;
  timeoutMs?: number;
  apiKey: string;
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

const toInput = (row: IntegrationInstanceRow, apiKey: string): IntegrationInput => ({
  kind: row.kind as IntegrationKind,
  id: row.id,
  name: row.name,
  url: row.url,
  port: row.port ?? undefined,
  externalUrl: row.externalUrl ?? undefined,
  timeoutMs: 10_000,
  secrets: [{ kind: 'apiKey', value: apiKey }],
});

const toConfig = (row: IntegrationInstanceRow): IntegrationRuntimeConfig => {
  return {
    kind: row.kind as IntegrationKind,
    id: row.id,
    name: row.name,
    url: row.url,
    port: row.port ?? undefined,
    externalUrl: row.externalUrl ?? undefined,
    timeoutMs: 10_000,
    apiKey: row.apiKey,
  };
};

export const createIntegrationRegistry = async (db: DB): Promise<RegistryEntry[]> => {
  const integrations = await getAllIntegrations(db);
  const entries: RegistryEntry[] = [];
  const factories = getAllIntegrationFactories();
  const factoryByKind = new Map(factories.map((f) => [f.metadata.kind, f]));

  for (const integration of integrations) {
    const config = toConfig(integration);
    const factory = factoryByKind.get(config.kind);

    if (!factory) {
      continue;
    }

    const input = toInput(integration, config.apiKey);
    const instance = factory.create(input);

    entries.push({
      integration: instance,
      config,
    });
  }

  return entries;
};