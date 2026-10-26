import type { DockerDashboardStats } from '@dashboard/integrations';

export interface DockerContainerItem {
  id: string;
  names: string[];
  image: string;
  command: string;
  created: number;
  state: 'exited' | 'paused' | 'restarting' | 'running';
  status: string;
  health?: 'healthy' | 'none' | 'starting' | 'unhealthy';
  ports: {
    ip?: string;
    privatePort: number;
    publicPort?: number;
    type: string;
  }[];
}

export interface DockerIntegrationMockData {
  integration: {
    id: string;
    name: string;
    kind: 'docker';
  };
  stats: DockerDashboardStats;
  containersList: DockerContainerItem[];
}

export interface DockerContainerEntry extends DockerContainerItem {
  serverIndex: number;
  serverName: string;
  serverId: string;
}
