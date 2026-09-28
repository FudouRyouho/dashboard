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
  startContainerAsync(id: string): Promise<void>;
  stopContainerAsync(id: string): Promise<void>;
  restartContainerAsync(id: string): Promise<void>;
  removeContainerAsync(id: string): Promise<void>;
}

const dockerCapabilities: (keyof IDockerIntegration)[] = [
  'getDashboardStatsAsync',
  'startContainerAsync',
  'stopContainerAsync',
  'restartContainerAsync',
  'removeContainerAsync',
];

export const supportsDocker = (
  integration: Integration,
): integration is IDockerIntegration & Integration =>
  dockerCapabilities.every(
    (method) =>
      typeof (integration as Partial<IDockerIntegration>)[method] ===
      'function',
  );
