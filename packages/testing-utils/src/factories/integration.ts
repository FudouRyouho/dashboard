import { vi } from 'vitest';
import type { IntegrationKind } from '@dashboard/contracts';
import type { DockerDashboardStats } from '@dashboard/integrations';
import type { CalendarEvent } from '@dashboard/contracts';
import type { TestIntegration, IntegrationOverrides } from '../core/integration';

function defaultPort(kind: IntegrationKind): number {
  switch (kind) {
    case 'sonarr': return 8989; case 'radarr': return 7878; case 'jellyfin': return 8096;
    case 'qbittorrent': return 8080; case 'docker': return 2375; case 'prometheus': return 9090;
  }
}

function emptyDockerStats(): DockerDashboardStats {
  return { containers: { running: 0, stopped: 0, healthy: 0, unhealthy: 0, total: 0 }, images: { total: 0, size: 0 }, networks: { total: 0 }, volumes: { total: 0 } };
}

function emptyJobsAndStatus() {
  return { status: { paused: false, rates: { down: 0, up: 0 }, types: ['torrent'] as const }, items: [] };
}

function emptyCalendar(): CalendarEvent[] { return []; }

export interface IntegrationFactoryOverrides extends IntegrationOverrides {
  id?: string; name?: string; url?: string; port?: number | null;
  getDashboardStatsAsync?: (opts?: { signal?: AbortSignal }) => Promise<DockerDashboardStats>;
  startContainerAsync?: (id: string) => Promise<void>; stopContainerAsync?: (id: string) => Promise<void>;
  restartContainerAsync?: (id: string) => Promise<void>; removeContainerAsync?: (id: string) => Promise<void>;
  getClientJobsAndStatusAsync?: () => Promise<any>; pauseQueueAsync?: () => Promise<void>;
  pauseItemAsync?: (item: any) => Promise<void>; resumeQueueAsync?: () => Promise<void>;
  resumeItemAsync?: (item: any) => Promise<void>; deleteItemAsync?: (item: any, fromDisk: boolean) => Promise<void>;
  getCalendarEventsAsync?: (start: Date, end: Date, includeUnmonitored: boolean, opts?: { signal?: AbortSignal }) => Promise<CalendarEvent[]>;
  getSystemMetricsAsync?: () => Promise<unknown[]>;
  getServerMetricsAsync?: (server: string, options?: any) => Promise<unknown | null>;
  getDiscoveredDataAsync?: (options?: { signal?: AbortSignal }) => Promise<{ instances: string[]; queryResults: Map<string, unknown> }>;
}

export function createTestIntegration<K extends IntegrationKind>(kind: K, overrides: IntegrationFactoryOverrides = {}): TestIntegration<K> {
  const id = overrides.id ?? `test-${kind}-${Math.random().toString(36).slice(2, 8)}`;
  const name = overrides.name ?? `Test ${kind}`;
  const url = overrides.url ?? `http://test:${defaultPort(kind)}`;
  const port = overrides.port ?? defaultPort(kind);

  const result: TestIntegration<K> = { publicIntegration: { id, name, kind, url, port } };

  if (kind === 'docker') {
    result.getDashboardStatsAsync = vi.fn().mockResolvedValue(emptyDockerStats());
    result.startContainerAsync = vi.fn(); result.stopContainerAsync = vi.fn();
    result.restartContainerAsync = vi.fn(); result.removeContainerAsync = vi.fn();
  }
  if (kind === 'qbittorrent') {
    result.getClientJobsAndStatusAsync = vi.fn().mockResolvedValue(emptyJobsAndStatus());
    result.pauseQueueAsync = vi.fn(); result.pauseItemAsync = vi.fn();
    result.resumeQueueAsync = vi.fn(); result.resumeItemAsync = vi.fn();
    result.deleteItemAsync = vi.fn();
  }
  if (kind === 'sonarr' || kind === 'radarr') {
    result.getCalendarEventsAsync = vi.fn().mockResolvedValue(emptyCalendar());
  }
  if (kind === 'prometheus') {
    result.getSystemMetricsAsync = vi.fn().mockResolvedValue([]);
    result.getServerMetricsAsync = vi.fn().mockResolvedValue(null);
    result.getDiscoveredDataAsync = vi.fn().mockResolvedValue({ instances: [], queryResults: new Map() });
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (['id', 'name', 'url', 'port'].includes(key) || value === undefined) continue;
    if (value instanceof Error) throw value;
    (result as any)[key] = typeof value === 'function' ? value : value;
  }

  return result;
}
