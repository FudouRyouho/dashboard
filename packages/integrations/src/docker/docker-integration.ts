import { Integration } from '../base/integration';
import { IDockerIntegration, DockerDashboardStats, DockerContainer, DockerSystemStats, DockerContainerStats, DockerContainerLogOptions } from '../base/docker';
import { z } from 'zod';
import {
  dockerContainerSchema,
  dockerVolumesResponseSchema,
  dockerNetworkSchema,
} from './schemas/docker-dashboard';

export class DockerIntegration
  extends Integration
  implements IDockerIntegration
{
  constructor(integration: import('../base/integration').IntegrationInput) {
    super(integration);
  }

  private async fetchDocker<T>(path: string, init?: RequestInit): Promise<T> {
    return this.fetchJson(`${this.baseUrl}${path}`, init);
  }

  async getDashboardStatsAsync(options?: {
    signal?: AbortSignal;
  }): Promise<DockerDashboardStats> {
    const [containersResult, imagesResult, networksResult, volumesResult] = await Promise.allSettled([
      this.fetchDocker<z.infer<typeof dockerContainerSchema>[]>(
        '/containers/json?all=true',
        { signal: options?.signal },
      ),
      this.fetchDocker<unknown[]>('/images/json', { signal: options?.signal }),
      this.fetchDocker<z.infer<typeof dockerNetworkSchema>[]>('/networks', {
        signal: options?.signal,
      }),
      this.fetchDocker<z.infer<typeof dockerVolumesResponseSchema>>('/volumes', {
        signal: options?.signal,
      }),
    ]);

    // Collect all rejection reasons for the caller to classify
    const rejections = [
      containersResult.status === 'rejected' ? containersResult.reason : null,
      imagesResult.status === 'rejected' ? imagesResult.reason : null,
      networksResult.status === 'rejected' ? networksResult.reason : null,
      volumesResult.status === 'rejected' ? volumesResult.reason : null,
    ].filter((r): r is Error => r !== null);

    if (rejections.length > 0) {
      for (const reason of rejections) {
        this.log('Docker fetch failed', { err: reason });
      }
      // Throw the first rejection so the scheduler sees the failure and can classify it
      throw rejections[0];
    }

    // All fulfilled - safe to access .value
    const containers = containersResult.status === 'fulfilled' ? containersResult.value : [];
    const images = imagesResult.status === 'fulfilled' ? imagesResult.value : [];
    const networks = networksResult.status === 'fulfilled' ? networksResult.value : [];
    const volumes = volumesResult.status === 'fulfilled' ? volumesResult.value.Volumes : [];

    let running = 0;
    let stopped = 0;
    let healthy = 0;
    let unhealthy = 0;
    for (const c of containers) {
      const state = (c as any).State as
        | { Status?: string; Running?: boolean }
        | undefined;
      const status = state?.Status ?? c.State;
      const isRunning =
        status === 'running' ||
        (status !== 'exited' &&
          status !== 'dead' &&
          status !== 'created' &&
          status !== 'paused' &&
          status !== 'removing' &&
          status !== 'restarting');

      if (isRunning) {
        running++;
        if (c.Health?.Status === 'healthy') healthy++;
        else if (c.Health?.Status === 'unhealthy') unhealthy++;
      } else {
        stopped++;
      }
    }

    let totalImageSize = 0;
    for (const img of images as any[]) {
      if (img.Size) totalImageSize += img.Size;
      if (img.SharedSize && img.SharedSize > 0)
        totalImageSize += img.SharedSize;
    }

    const networkCount = Array.isArray(networks)
      ? networks.filter(
          (n) => n.Name !== 'host' && n.Name !== 'none' && n.Name !== 'bridge',
        ).length
      : 0;

    const volumeCount = Array.isArray(volumes) ? volumes.length : 0;

    return {
      containers: {
        running,
        stopped,
        healthy,
        unhealthy,
        total: containers.length,
      },
      images: {
        total: images.length,
        size: totalImageSize,
      },
      networks: {
        total: networkCount,
      },
      services: {
        total: 0,
      },
      stacks: {
        total: 0,
      },
      volumes: {
        total: volumeCount,
      },
    };
  }

  async startContainerAsync(id: string): Promise<void> {
    await this.fetchDocker(`/containers/${id}/start`, { method: 'POST' });
  }

  async stopContainerAsync(id: string): Promise<void> {
    await this.fetchDocker(`/containers/${id}/stop`, { method: 'POST' });
  }

  async restartContainerAsync(id: string): Promise<void> {
    await this.fetchDocker(`/containers/${id}/restart`, { method: 'POST' });
  }

  async removeContainerAsync(id: string): Promise<void> {
    await this.fetchDocker(`/containers/${id}`, { method: 'DELETE' });
  }


  async getContainersAsync(): Promise<DockerContainer[]> {
    return this.fetchDocker<DockerContainer[]>('/containers/json?all=true');
  }

  async getContainerLogsAsync(
    id: string,
    options?: DockerContainerLogOptions,
  ): Promise<string[]> {
    const params = new URLSearchParams();
    params.set('stdout', String(options?.stdout ?? true));
    params.set('stderr', String(options?.stderr ?? true));
    params.set('tail', options?.tail === 'all' ? 'all' : String(options?.tail ?? 100));
    if (options?.since) params.set('since', String(options.since));
    if (options?.until) params.set('until', String(options.until));
    params.set('timestamps', String(options?.timestamps ?? false));
    params.set('follow', String(options?.follow ?? false));

    const raw = await this.fetchRaw(
      `/containers/${id}/logs?${params.toString()}`,
      { headers: { Accept: 'application/vnd.docker.raw-stream' } },
    );

    // Parse Docker's raw stream format (header + payload per frame)
    return this.parseDockerLogStream(raw);
  }

  private parseDockerLogStream(buffer: Uint8Array): string[] {
    const lines: string[] = [];
    let offset = 0;
    const decoder = new TextDecoder();
    while (offset < buffer.length) {
      // Docker log frame: [stream_type][3 bytes reserved][4 bytes size][payload]
      // streamType = buffer[offset]  // stdout=1, stderr=2
      const size = new DataView(
        buffer.buffer,
        buffer.byteOffset + offset + 4,
        4,
      ).getUint32(0, false);
      offset += 8;
      if (offset + size > buffer.length) break;
      const payload = decoder.decode(
        buffer.subarray(offset, offset + size),
      );
      if (payload.trim()) lines.push(payload.trim());
      offset += size;
    }
    return lines;
  }

  async getContainerStatsAsync(id: string): Promise<DockerContainerStats> {
    return this.fetchDocker<DockerContainerStats>(
      `/containers/${id}/stats?stream=false`,
    );
  }

  async getSystemStatsAsync(): Promise<DockerSystemStats> {
    return this.fetchDocker<DockerSystemStats>('/info');
  }
}
