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
        running: 9,
        stopped: 2,
        healthy: 3,
        unhealthy: 0,
        total: 11,
      },
      images: {
        total: 22,
        size: 45_000_000_000, // 45 GB
      },
      networks: {
        total: 3,
      },
      volumes: {
        total: 10,
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
      {
        id: 'a6df8c1a7330',
        names: ['/homarr'],
        image: 'ghcr.io/homarr-labs/homarr:latest',
        command: '/bin/sh -c "sleep 30"',
        created: 1726290000,
        state: 'running',
        status: 'Up About an hour',
        health: 'none',
        ports: [{ ip: '0.0.0.0', privatePort: 7575, publicPort: 7575, type: 'tcp' }],
      },
      {
        id: '915ef8c1a734',
        names: ['/bazarr'],
        image: 'lscr.io/linuxserver/bazarr:latest',
        command: '/init',
        created: 1726280000,
        state: 'running',
        status: 'Up 2 days',
        health: 'none',
        ports: [{ ip: '0.0.0.0', privatePort: 6767, publicPort: 6767, type: 'tcp' }],
      },
      {
        id: '805ef8c1a735',
        names: ['/lidarr'],
        image: 'lscr.io/linuxserver/lidarr:latest',
        command: '/init',
        created: 1726270000,
        state: 'running',
        status: 'Up 2 days',
        health: 'none',
        ports: [{ ip: '0.0.0.0', privatePort: 8686, publicPort: 8686, type: 'tcp' }],
      },
      {
        id: '705ef8c1a736',
        names: ['/kapowarr'],
        image: 'mrcas/kapowarr:latest',
        command: '/init',
        created: 1726260000,
        state: 'exited',
        status: 'Exited (0) 4 weeks ago',
        health: 'none',
        ports: [],
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
        running: 2,
        stopped: 0,
        healthy: 0,
        unhealthy: 0,
        total: 2,
      },
      images: {
        total: 3,
        size: 3_000_000_000,
      },
      networks: {
        total: 1,
      },
      volumes: {
        total: 2,
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
        health: 'none',
        ports: [{ ip: '0.0.0.0', privatePort: 9090, publicPort: 9090, type: 'tcp' }],
      },
    ],
  },
];
