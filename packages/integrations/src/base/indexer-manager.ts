import type { Integration } from './integration';

/**
 * Represents an indexer managed by Prowlarr.
 * Mirrors Homarr's Indexer type but adapted to our contracts.
 */
export interface Indexer {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  status: boolean;
}

export interface IIndexerManagerIntegration {
  getIndexersAsync(): Promise<Indexer[]>;
  testAllIndexersAsync(): Promise<void>;
}

const indexerManagerCapability: keyof IIndexerManagerIntegration =
  'getIndexersAsync';

export const supportsIndexerManager = (
  integration: Integration,
): integration is IIndexerManagerIntegration & Integration =>
  typeof (integration as Partial<IIndexerManagerIntegration>)[
    indexerManagerCapability
  ] === 'function';