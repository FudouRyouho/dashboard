import { Integration, IntegrationInput } from '@dashboard/integrations';
import type { DB } from '@dashboard/db';
import { getAllIntegrations } from '@dashboard/db';
import type { IntegrationInstanceRow } from '@dashboard/db';
import { getAllIntegrationFactories } from '@dashboard/integrations';
import { type IntegrationKind } from '@dashboard/contracts';

export interface RegistryEntry {
  integration: Integration;
  row: IntegrationInstanceRow;
}

const toInput = (row: IntegrationInstanceRow): IntegrationInput => {
  const secrets: { kind: string; value: string }[] = [];
  if (row.apiKey) {
    secrets.push({ kind: 'apiKey', value: row.apiKey });
  }
  if (row.username) {
    secrets.push({ kind: 'username', value: row.username });
  }
  if (row.password) {
    secrets.push({ kind: 'password', value: row.password });
  }
  return {
    kind: row.kind as IntegrationKind,
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
      integration.kind as IntegrationKind,
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
