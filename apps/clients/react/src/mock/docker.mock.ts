export interface DockerContainerItem {
  id: string;
  names: string[];
  image: string;
  command: string;
  created: number;
  state: 'running' | 'exited' | 'paused' | 'restarting';
  status: string;
  health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
  ports: Array<{
    ip?: string;
    privatePort: number;
    publicPort?: number;
    type: string;
  }>;
}

export interface DockerIntegrationMockData {
  integration: {
    id: string;
    name: string;
    kind: 'docker';
  };
  stats: {
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
    volumes: {
      total: number;
    };
  };
  containersList: DockerContainerItem[];
}

export const dockerMock: DockerIntegrationMockData[] = [
  {
    integration: {
      id: 'docker:server:197',
      name: 'Docker Servidor (192.168.10.197)',
      kind: 'docker',
    },
    stats: {
      containers: {
        running: 6,
        stopped: 1,
        healthy: 5,
        unhealthy: 0,
        total: 7,
      },
      images: {
        total: 14,
        size: 18_400_000_000, // 18.4 GB
      },
      networks: {
        total: 4,
      },
      volumes: {
        total: 8,
      },
    },
    containersList: [
      {
        id: 'c3df8c1a733a',
        names: ['/radarr'],
        image: 'lscr.io/linuxserver/radarr:latest',
        command: '/init',
        created: 1726329278,
        state: 'running',
        status: 'Up 3 days (healthy)',
        health: 'healthy',
        ports: [{ ip: '0.0.0.0', privatePort: 7878, publicPort: 7878, type: 'tcp' }],
      },
      {
        id: 'e2ef8c1a733b',
        names: ['/sonarr'],
        image: 'lscr.io/linuxserver/sonarr:latest',
        command: '/init',
        created: 1726329200,
        state: 'running',
        status: 'Up 4 days (healthy)',
        health: 'healthy',
        ports: [{ ip: '0.0.0.0', privatePort: 8989, publicPort: 8989, type: 'tcp' }],
      },
      {
        id: 'd1df8c1a733c',
        names: ['/prowlarr'],
        image: 'lscr.io/linuxserver/prowlarr:latest',
        command: '/init',
        created: 1726329100,
        state: 'running',
        status: 'Up 1 day',
        health: 'none',
        ports: [{ ip: '0.0.0.0', privatePort: 9696, publicPort: 9696, type: 'tcp' }],
      },
      {
        id: 'a9bf8c1a733d',
        names: ['/qbittorrent'],
        image: 'lscr.io/linuxserver/qbittorrent:latest',
        command: '/init',
        created: 1726329000,
        state: 'running',
        status: 'Up 4 days (healthy)',
        health: 'healthy',
        ports: [
          { ip: '0.0.0.0', privatePort: 8080, publicPort: 8080, type: 'tcp' },
          { ip: '0.0.0.0', privatePort: 6881, publicPort: 6881, type: 'tcp' },
        ],
      },
      {
        id: 'f8ef8c1a733e',
        names: ['/prometheus'],
        image: 'prom/prometheus:latest',
        command: '--config.file=/etc/prometheus/prometheus.yml',
        created: 1726328000,
        state: 'running',
        status: 'Up 4 days',
        health: 'none',
        ports: [{ ip: '0.0.0.0', privatePort: 9090, publicPort: 9090, type: 'tcp' }],
      },
      {
        id: 'b7ef8c1a733f',
        names: ['/portainer'],
        image: 'portainer/portainer-ce:latest',
        command: '--admin-password=...',
        created: 1726300000,
        state: 'running',
        status: 'Up 5 days (healthy)',
        health: 'healthy',
        ports: [{ ip: '0.0.0.0', privatePort: 9000, publicPort: 9000, type: 'tcp' }],
      },
    ],
  },
  {
    integration: {
      id: 'docker:local:125',
      name: 'Docker Local (192.168.10.125)',
      kind: 'docker',
    },
    stats: {
      containers: {
        running: 4,
        stopped: 1,
        healthy: 3,
        unhealthy: 0,
        total: 5,
      },
      images: {
        total: 8,
        size: 9_200_000_000,
      },
      networks: {
        total: 3,
      },
      volumes: {
        total: 4,
      },
    },
    containersList: [
      {
        id: '1749295984c2',
        names: ['/freellmapi-1'],
        image: 'ghcr.io/tashfeenahmed/freellmapi:latest',
        command: 'node server/dist/index.js',
        created: 1729306900,
        state: 'running',
        status: 'Up 5 hours',
        ports: [{ ip: '127.0.0.1', privatePort: 3001, publicPort: 3001, type: 'tcp' }],
      },
      {
        id: '2411295984c3',
        names: ['/jellyfin'],
        image: 'jellyfin/jellyfin:latest',
        command: '/jellyfin/jellyfin',
        created: 1726320000,
        state: 'running',
        status: 'Up 5 hours (healthy)',
        health: 'healthy',
        ports: [{ ip: '0.0.0.0', privatePort: 8096, publicPort: 8096, type: 'tcp' }],
      },
      {
        id: '2140295984c4',
        names: ['/prometheus-local'],
        image: 'prom/prometheus:latest',
        command: '--config.file=/etc/prometheus/prometheus.yml',
        created: 1726320000,
        state: 'running',
        status: 'Up 5 hours',
        ports: [{ ip: '0.0.0.0', privatePort: 9090, publicPort: 9090, type: 'tcp' }],
      },
    ],
  },
];
