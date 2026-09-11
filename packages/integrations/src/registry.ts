import type { IntegrationInput } from './base/integration';
import { Integration } from './base/integration';
import { IntegrationKind } from '@dashboard/contracts';

export type { IntegrationInput };
export interface IntegrationMetadata {
  kind: IntegrationKind;
  defaultPort: number;
  displayName: string;
  description: string;
  capabilities: IntegrationCapability[];
}

export type IntegrationCapability = 'calendar' | 'mediaReleases' | 'docker';

export interface IntegrationFactory {
  create(input: IntegrationInput): Integration;
  metadata: IntegrationMetadata;
}

const registry = new Map<IntegrationKind, IntegrationFactory>();

export function registerIntegration(factory: IntegrationFactory): void {
  if (registry.has(factory.metadata.kind)) {
    throw new Error(
      `Integration kind '${factory.metadata.kind}' already registered`,
    );
  }
  registry.set(factory.metadata.kind, factory);
}

export function getIntegrationFactory(
  kind: IntegrationKind,
): IntegrationFactory | undefined {
  return registry.get(kind);
}

export function getAllIntegrationFactories(): IntegrationFactory[] {
  return Array.from(registry.values());
}

export function getRegisteredKinds(): IntegrationKind[] {
  return Array.from(registry.keys());
}

export function isKindRegistered(kind: string): kind is IntegrationKind {
  return registry.has(kind as IntegrationKind);
}
