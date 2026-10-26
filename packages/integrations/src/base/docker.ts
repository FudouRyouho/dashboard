import { Integration } from './integration';
import type { DockerContainer, DockerSystemStats, DockerContainerStats, DockerContainerLogOptions } from '@dashboard/contracts';

export type { DockerContainer, DockerSystemStats, DockerContainerStats, DockerContainerLogOptions };

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
  getContainersAsync(): Promise<DockerContainer[]>;
  getContainerLogsAsync(id: string, options?: DockerContainerLogOptions): Promise<string[]>;
  getContainerStatsAsync(id: string): Promise<DockerContainerStats>;
  getSystemStatsAsync(): Promise<DockerSystemStats>;
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
