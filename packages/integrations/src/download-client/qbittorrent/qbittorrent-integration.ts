import { QBittorrent } from '@ctrl/qbittorrent';
import { Integration } from '../../base/integration';
import { IntegrationError } from '../../base/integration-error';
import { IDownloadClientIntegration } from '../../base/download-client';
import type {
  DownloadClientItem,
  DownloadClientJobsAndStatus,
  DownloadClientStatus,
  GetClientJobsAndStatusInput,
} from '@dashboard/contracts';

export class QbittorrentIntegration
  extends Integration
  implements IDownloadClientIntegration
{
  private client: QBittorrent | null = null;

  private async getClientAsync(_options?: { signal?: AbortSignal }): Promise<QBittorrent> {
    if (this.client) return this.client;

    this.client = new QBittorrent({
      username: this.getSecretValue('username'),
      password: this.getSecretValue('password'),
      baseUrl: this.url('/').toString(),
    });

    try {
      // getAppVersion doesn't accept signal in @ctrl/qbittorrent
      await this.client.getAppVersion();
    } catch (error) {
      this.client = null;
      if (error instanceof IntegrationError) throw error;
      throw IntegrationError.fromTransport(error);
    }
    return this.client;
  }

  async getClientJobsAndStatusAsync(
    input: GetClientJobsAndStatusInput = {},
    options?: { signal?: AbortSignal },
  ): Promise<DownloadClientJobsAndStatus> {
    const client = await this.getClientAsync(options);
    const limit = input.limit ?? 50;

    let torrents;
    try {
      torrents = await client.listTorrents({ limit });
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw IntegrationError.fromTransport(error);
    }

    const rates = torrents.reduce(
      ({ down, up }, { dlspeed, upspeed }) => ({
        down: down + dlspeed,
        up: up + upspeed,
      }),
      { down: 0, up: 0 },
    );

    const paused = torrents.every(
      ({ state }) => this.mapTorrentState(state) === 'paused',
    );
    // NOTE: This is TRUE only when ALL torrents are in states mapped to 'paused'
    // It does NOT reflect a global queue paused state, but rather the aggregated state
    // of all individual torrents (all must be pausedDL/pausedUP/stoppedDL/stoppedUP)
    // queueState is 'unknown' because qBittorrent API doesn't expose global queue pause state

    const status: DownloadClientStatus = { paused, rates, types: ['torrent'], queueState: 'unknown' };

    const items: DownloadClientItem[] = torrents.map(
      (torrent): DownloadClientItem => {
        const state = this.mapTorrentState(torrent.state);
        const progress = torrent.progress ?? 0;

        let time: number;
        if (progress === 1) {
          const completionMs = (torrent.completion_on ?? 0) * 1000;
          time = Math.max(completionMs - Date.now(), -1);
        } else if (torrent.eta === 8640000) {
          time = 0; // infinito
        } else {
          time = Math.max((torrent.eta ?? 0) * 1000, 0);
        }

        return {
          type: 'torrent',
          id: torrent.hash,
          name: torrent.name,
          size: torrent.size ?? torrent.total_size ?? 0,
          sent: torrent.uploaded ?? 0,
          downSpeed: progress !== 1 ? (torrent.dlspeed ?? 0) : 0,
          upSpeed: torrent.upspeed ?? 0,
          time,
          added: (torrent.added_on ?? 0) * 1000,
          state,
          progress,
          category: torrent.category || undefined,
        };
      },
    );

    return { status, items };
  }

  async pauseQueueAsync(options?: { signal?: AbortSignal }): Promise<void> {
    const client = await this.getClientAsync(options);
    await client.pauseTorrent('all');
  }

  async pauseItemAsync(
    item: DownloadClientItem,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const client = await this.getClientAsync(options);
    await client.pauseTorrent(item.id);
  }

  async resumeQueueAsync(options?: { signal?: AbortSignal }): Promise<void> {
    const client = await this.getClientAsync(options);
    await client.resumeTorrent('all');
  }

  async resumeItemAsync(
    item: DownloadClientItem,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const client = await this.getClientAsync(options);
    await client.resumeTorrent(item.id);
  }

  async deleteItemAsync(
    item: DownloadClientItem,
    fromDisk: boolean,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const client = await this.getClientAsync(options);
    await client.removeTorrent(item.id, fromDisk);
  }

  private mapTorrentState(state: string): DownloadClientItem['state'] {
    // Mapping based on Homarr, adapted to our 5 canonical states
    switch (state) {
      case 'allocating':
      case 'checkingDL':
      case 'downloading':
      case 'forcedDL':
      case 'forcedMetaDL':
      case 'metaDL':
      case 'queuedDL':
      case 'queuedForChecking':
        return 'leeching';
      case 'checkingUP':
      case 'forcedUP':
      case 'queuedUP':
      case 'uploading':
        return 'seeding';
      case 'pausedDL':
      case 'pausedUP':
      case 'stoppedDL':
      case 'stoppedUP':
        return 'paused';
      case 'stalledDL':
      case 'stalledUP':
        return 'stalled';
      case 'error':
      case 'checkingResumeData':
      case 'missingFiles':
      case 'moving':
      case 'unknown':
      default:
        return 'unknown';
    }
  }
}
