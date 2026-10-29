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
