import type { DockerContainer, DockerContainersResult } from '@dashboard/contracts';

/** The per-integration group returned by `docker.getContainers` (SSoT in contracts). */
export type DockerContainersResultEntry = DockerContainersResult;

/** Container row extended with its originating integration for cross-server display/filtering. */
export interface DockerContainerEntry extends DockerContainer {
  serverIndex: number;
  serverName: string;
  serverId: string;
}
