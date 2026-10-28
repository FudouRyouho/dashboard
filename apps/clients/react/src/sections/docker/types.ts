import type { DockerContainer } from '@dashboard/contracts';
import type { DockerDashboardStats } from '@dashboard/integrations';

/** Real API shape from router.getContainers */
export interface DockerIntegrationServer {
  integration: {
    id: string;
    name: string;
    kind: 'docker';
  };
  stats: DockerDashboardStats;
}

/** Real API shape from router.getContainerList - matches DockerContainer from contracts */
export type DockerContainerItem = DockerContainer;

/** Extended with server reference for cross-server operations */
export interface DockerContainerEntry extends DockerContainer {
  serverIndex: number;
  serverName: string;
  serverId: string;
}

/** Combined mock data structure for backward compatibility */
export interface DockerIntegrationMockData {
  integration: {
    id: string;
    name: string;
    kind: 'docker';
  };
  stats: DockerDashboardStats;
  containersList: DockerContainerItem[];
}