import { Integration } from '../base/integration';
import { IntegrationError } from '../base/integration-error';
import { IIndexerManagerIntegration, type Indexer } from '../base/indexer-manager';
import {
  indexerResponseSchema,
  indexerStatusResponseSchema,
} from './schemas/prowlarr-types';
import type { IntegrationInput } from '../base/integration';

/**
 * Prowlarr integration implementing the indexerManager capability.
 *
 * Uses Prowlarr's public API to fetch indexer configurations and their status.
 * Authenticates via X-Api-Key header (Prowlarr does not support username/password).
 */
export class ProwlarrIntegration
  extends Integration
  implements IIndexerManagerIntegration
{
  private getHeaders(): Record<string, string> {
    return {
      'X-Api-Key': this.getSecretValue('apiKey'),
    };
  }

  async getIndexersAsync(): Promise<Indexer[]> {
    // Fetch indexers config and status in parallel
    const [indexersResult, statusResult] = await Promise.allSettled([
      this.fetchJson(this.url('/api/v1/indexer'), { headers: this.getHeaders() }),
      this.fetchJson(this.url('/api/v1/indexerstatus'), { headers: this.getHeaders() }),
    ]);

    if (indexersResult.status === 'rejected') {
      throw indexersResult.reason instanceof IntegrationError
        ? indexersResult.reason
        : IntegrationError.fromTransport(indexersResult.reason);
    }

    if (statusResult.status === 'rejected') {
      throw statusResult.reason instanceof IntegrationError
        ? statusResult.reason
        : IntegrationError.fromTransport(statusResult.reason);
    }

    const indexersData = indexerResponseSchema.safeParse(indexersResult.value);
    const statusData =
      indexerStatusResponseSchema.safeParse(statusResult.value);

    if (!indexersData.success) {
      throw new IntegrationError(
        'invalid-response',
        `Failed to parse indexers: ${indexersData.error.message}`,
      );
    }

    // Build a set of inactive indexer IDs (those with a future disabledTill)
    const inactiveIds =
      statusData.success && statusData.data
        ? new Set(
            statusData.data
              .filter((s) => s.disabledTill && new Date(s.disabledTill) > new Date())
              .map((s) => s.indexerId),
          )
        : new Set();

    return indexersData.data.map((indexer) => ({
      id: indexer.id,
      name: indexer.name,
      url: indexer.indexerUrls[0] ?? '',
      enabled: indexer.enable,
      // An indexer is "active" if it's enabled AND not disabled-till
      status: indexer.enable && !inactiveIds.has(indexer.id),
    }));
  }

  async testAllIndexersAsync(): Promise<void> {
    await this.fetchJson(this.url('/api/v1/indexer/testall'), {
      method: 'POST',
      headers: this.getHeaders(),
    }).catch((error) => {
      if (error instanceof IntegrationError) throw error;
      throw IntegrationError.fromTransport(error);
    });
  }
}

export function createProwlarrIntegration(
  input: IntegrationInput,
): ProwlarrIntegration {
  return new ProwlarrIntegration(input);
}
