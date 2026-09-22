import { Integration, IntegrationInput } from '@dashboard/integrations';
import type { DB } from '@dashboard/db';
import { getAllIntegrations } from '@dashboard/db';
import type { IntegrationInstanceRow } from '@dashboard/db';
import { getAllIntegrationFactories } from '@dashboard/integrations';
import { type IntegrationKind, secretRequirements } from '@dashboard/contracts';

export interface RegistryEntry {
  integration: Integration;
  row: IntegrationInstanceRow;
}

/**
 * Validates that an integration instance has all required secrets for its kind.
 * Throws a clear error listing the missing required secret kinds.
 */
function validateRequiredSecrets(
  row: IntegrationInstanceRow,
): void {
  const required = secretRequirements[row.kind as IntegrationKind] ?? [];
  const present = new Set<string>();
  if (row.apiKey) present.add('apiKey');
  if (row.username) present.add('username');
  if (row.password) present.add('password');

  const missing = required
    .filter((r) => r.required)
    .filter((r) => !present.has(r.kind))
    .map((r) => r.kind);

  if (missing.length > 0) {
    throw new Error(
      `Integration "${row.id}" (${row.kind}) is missing required secrets: ${missing.join(', ')}`,
    );
  }
}

const toInput = (row: IntegrationInstanceRow): IntegrationInput => {
  validateRequiredSecrets(row);
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
