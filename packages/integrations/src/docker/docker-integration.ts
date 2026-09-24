import { Integration } from '../base/integration';
import { IDockerIntegration, DockerDashboardStats } from '../base/docker';
import { z } from 'zod';
import {
  dockerContainerSchema,
  dockerVolumeSchema,
  dockerNetworkSchema,
} from './schemas/docker-dashboard';

export type {
  DockerContainer,
  DockerVolume,
  DockerNetwork,
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
    const results = await Promise.allSettled([
      this.fetchDocker<z.infer<typeof dockerContainerSchema>[]>(
        '/containers/json?all=true',
        { signal: options?.signal },
      ),
      this.fetchDocker<unknown[]>('/images/json', { signal: options?.signal }),
      this.fetchDocker<z.infer<typeof dockerNetworkSchema>[]>('/networks', {
        signal: options?.signal,
      }),
      this.fetchDocker<z.infer<typeof dockerVolumeSchema>[]>('/volumes', {
        signal: options?.signal,
      }),
    ]);

    const containers = results[0].status === 'fulfilled' ? results[0].value : [];
    const images = results[1].status === 'fulfilled' ? results[1].value : [];
    const networks = results[2].status === 'fulfilled' ? results[2].value : [];
    const volumes = results[3].status === 'fulfilled' ? results[3].value : [];

    if (results[0].status === 'rejected') {
      console.warn('Docker containers fetch failed:', results[0].reason);
    }
    if (results[1].status === 'rejected') {
      console.warn('Docker images fetch failed:', results[1].reason);
    }
    if (results[2].status === 'rejected') {
      console.warn('Docker networks fetch failed:', results[2].reason);
    }
    if (results[3].status === 'rejected') {
      console.warn('Docker volumes fetch failed:', results[3].reason);
    }

    let running = 0;
    let stopped = 0;
    let healthy = 0;
    let unhealthy = 0;
    for (const c of containers) {
      if (c.State === 'running' || c.Status.startsWith('Up')) {
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
}
