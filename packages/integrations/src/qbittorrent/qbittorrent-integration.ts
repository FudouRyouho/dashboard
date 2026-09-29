import { Integration } from '../base/integration';
import { IntegrationError } from '../base/integration-error';
import { IDownloadClientIntegration } from '../base/download-client';
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
  private authCookie: string | null = null;

  /**
   * Authenticate against qBittorrent WebUI API.
   * Uses username/password form login to obtain a session cookie (SID).
   * qBittorrent does not support API key auth in this integration —
   * only username/password form login (per decision #10 in docs/decisions.md).
   */
  private async authenticateAsync(): Promise<void> {
    if (this.authCookie) return;

    const loginUrl = this.url('/api/v2/auth/login');
    const body = new URLSearchParams({
      username: this.getSecretValue('username'),
      password: this.getSecretValue('password'),
    });

    try {
      const res = await fetch(loginUrl, {
        method: 'POST',
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!res.ok) {
        throw IntegrationError.fromHttpResponse(res.status, res.statusText);
      }

      const text = await res.text();
      if (text !== 'Ok.') {
        throw new IntegrationError(
          'unauthorized',
          `qBittorrent auth failed: ${text}`,
        );
      }

      // Parse the SID cookie from Set-Cookie header
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const sidMatch = setCookie.match(/SID=([^;]+)/);
        if (sidMatch?.[1]) {
          this.authCookie = `SID=${sidMatch[1]}`;
        }
      }
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw IntegrationError.fromTransport(error);
    }
  }

  /**
   * Make an authenticated request to qBittorrent API.
   * Injects Referer, Origin, and Cookie headers automatically.
   */
  private async qbRequest<T>(
    path: `/${string}`,
    params?: Record<string, string | number | boolean>,
    options?: { signal?: AbortSignal; method?: string; body?: string },
  ): Promise<T> {
    await this.authenticateAsync();

    const url = this.url(path, params);
    const headers: Record<string, string> = {};

    if (this.authCookie) {
      headers['Cookie'] = this.authCookie;
    }

    try {
      // Use Integration.fetchJson which now injects Referer/Origin headers
      // We need to pass init with our custom headers for cookie auth
      const res = await fetch(url, {
        method: options?.method ?? 'GET',
        body: options?.body,
        headers,
        signal: options?.signal,
      });

      if (!res.ok && res.status !== 304) {
        throw IntegrationError.fromHttpResponse(res.status, res.statusText);
      }

      const contentLength = res.headers.get('content-length');
      if (!contentLength || contentLength === '0') return undefined as T;

      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await res.json()) as T;
      }
      return (await res.text()) as unknown as T;
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw IntegrationError.fromTransport(error);
    }
  }

  async getClientJobsAndStatusAsync(
    input: GetClientJobsAndStatusInput = {},
    options?: { signal?: AbortSignal },
  ): Promise<DownloadClientJobsAndStatus> {
    const limit = input.limit ?? 50;

    const torrents = await this.qbRequest(
      '/api/v2/torrents/info',
      { limit, category: '' },
      { signal: options?.signal },
    ).catch((error) => {
      // If auth failed during request, clear cookie and retry once
      if (error instanceof IntegrationError && error.reason === 'unauthorized') {
        this.authCookie = null;
        return this.qbRequest('/api/v2/torrents/info', { limit }, { signal: options?.signal });
      }
      throw error;
    }) as Awaited<ReturnType<typeof this.qbRequest<any>>>;

    const rates = torrents.reduce(
      (acc: { down: number; up: number }, { dlspeed, upspeed }: QBittorrentTorrent) => ({
        down: acc.down + (dlspeed ?? 0),
        up: acc.up + (upspeed ?? 0),
      }),
      { down: 0, up: 0 },
    );

    const paused = torrents.every(
      ({ state }: { state: string }) => this.mapTorrentState(state) === 'paused',
    );

    const status: DownloadClientStatus = {
      paused,
      rates,
      types: ['torrent'],
      queueState: 'unknown',
    };

    const items: DownloadClientItem[] = torrents.map(
      (torrent: QBittorrentTorrent): DownloadClientItem => {
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
    await this.qbRequest(
      '/api/v2/torrents/pause',
      { hashes: 'all' },
      { method: 'POST', signal: options?.signal },
    );
  }

  async pauseItemAsync(
    item: DownloadClientItem,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    await this.qbRequest(
      '/api/v2/torrents/pause',
      { hashes: item.id },
      { method: 'POST', signal: options?.signal },
    );
  }

  async resumeQueueAsync(options?: { signal?: AbortSignal }): Promise<void> {
    await this.qbRequest(
      '/api/v2/torrents/resume',
      { hashes: 'all' },
      { method: 'POST', signal: options?.signal },
    );
  }

  async resumeItemAsync(
    item: DownloadClientItem,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    await this.qbRequest(
      '/api/v2/torrents/resume',
      { hashes: item.id },
      { method: 'POST', signal: options?.signal },
    );
  }

  async deleteItemAsync(
    item: DownloadClientItem,
    fromDisk: boolean,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    await this.qbRequest(
      '/api/v2/torrents/delete',
      { hashes: item.id, deleteFiles: fromDisk ? 'true' : 'false' },
      { method: 'POST', signal: options?.signal },
    );
  }

  private mapTorrentState(state: string): DownloadClientItem['state'] {
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

/**
 * Internal type representing qBittorrent torrent fields needed by this integration.
 */
interface QBittorrentTorrent {
  hash: string;
  name: string;
  size: number;
  total_size: number;
  dlspeed: number;
  upspeed: number;
  progress: number;
  eta: number;
  added_on: number;
  completion_on: number | null;
  uploaded: number | null;
  state: string;
  category: string | null;
  priority: number;
  isExpandable: boolean;
  used_ratio: string;
  ratio: number;
  num_leechs: number;
  num_seeds: number;
  isFinished: boolean;
}
