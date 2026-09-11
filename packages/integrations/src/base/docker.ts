import { Integration } from './integration';

export interface DockerDashboardStats {
  containers: {
    running: number;
    stopped: number;
    healthy: number;
    unhealthy: number;
    total: number;
  };
  images: {
    total: number;
    size: number;
  };
  networks: {
    total: number;
  };
  services?: {
    total: number;
  };
  stacks?: {
    total: number;
  };
  volumes: {
    total: number;
  };
}

export interface IDockerIntegration {
  getDashboardStatsAsync(options?: {
    signal?: AbortSignal;
  }): Promise<DockerDashboardStats>;
}

const dockerCapability: keyof IDockerIntegration = 'getDashboardStatsAsync';

export const supportsDocker = (
  integration: Integration,
): integration is IDockerIntegration & Integration =>
  typeof (integration as Partial<IDockerIntegration>)[dockerCapability] ===
  'function';
