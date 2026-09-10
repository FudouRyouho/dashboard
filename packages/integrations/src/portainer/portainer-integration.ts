import { Integration } from '../base/integration';
import { IDockerIntegration, DockerDashboardStats } from '../base/docker';
import { portainerDashboardStatsSchema } from './schemas/portainer-dashboard';

const endpointIdDefault = 1;

export class PortainerIntegration extends Integration implements IDockerIntegration {
  private getEndpointId(): number {
    return this.hasSecretValue('endpointId')
      ? parseInt(this.getSecretValue('endpointId'), 10)
      : endpointIdDefault;
  }

  async getDockerStatsAsync(
    options?: { signal?: AbortSignal },
  ): Promise<DockerDashboardStats> {
    const endpointId = this.getEndpointId();
    const url = this.url(`/api/docker/${endpointId}/dashboard`, {});

    const rawData = await this.fetchJson<unknown>(url, {
      headers: { 'X-API-Key': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });

    const data = portainerDashboardStatsSchema.parse(rawData);

    const containers = data.Containers ?? { Running: 0, Stopped: 0, Total: 0 };
    const images = data.Images ?? { total: 0 };

    return {
      containers: {
        running: containers.Running,
        stopped: containers.Stopped,
        total: containers.Total > 0 ? containers.Total : containers.Running + containers.Stopped,
        healthy: containers.Healthy ?? 0,
        unhealthy: containers.Unhealthy ?? 0,
      },
      images: images.total ?? 0,
      networks: data.Networks ?? 0,
      services: data.Services ?? 0,
      stacks: data.Stacks ?? 0,
      volumes: data.Volumes ?? 0,
    };
  }

  async startContainerAsync(
    containerId: string,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const endpointId = this.getEndpointId();
    const url = this.url(
      `/api/endpoints/${endpointId}/docker/containers/${containerId}/start`,
      {},
    );

    await this.fetchJson(url, {
      method: 'POST',
      headers: { 'X-API-Key': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });
  }

  async stopContainerAsync(
    containerId: string,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const endpointId = this.getEndpointId();
    const url = this.url(
      `/api/endpoints/${endpointId}/docker/containers/${containerId}/stop`,
      {},
    );

    await this.fetchJson(url, {
      method: 'POST',
      headers: { 'X-API-Key': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });
  }
}
