import { Integration } from './integration';

export interface DockerDashboardStats {
  containers: {
    running: number;
    stopped: number;
    healthy: number;
    unhealthy: number;
    total: number;
  };
  images: number;
  networks: number;
  services: number;
  stacks: number;
  volumes: number;
}

export interface IDockerIntegration {
  getDockerStatsAsync(
    options?: { signal?: AbortSignal },
  ): Promise<DockerDashboardStats>;
  startContainerAsync(
    containerId: string,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
  stopContainerAsync(
    containerId: string,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
}

const dockerCapability: keyof IDockerIntegration = 'getDockerStatsAsync';

export const supportsDocker = (
  integration: Integration,
): integration is IDockerIntegration & Integration =>
  typeof (integration as Partial<IDockerIntegration>)[dockerCapability] ===
  'function';
