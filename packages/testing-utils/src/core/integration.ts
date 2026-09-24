import type { IntegrationKind } from '@dashboard/contracts';
import type {
  DownloadClientItem,
  DownloadClientJobsAndStatus,
  GetClientJobsAndStatusInput,
} from '@dashboard/contracts';
import type { DockerDashboardStats } from '@dashboard/integrations';
import type { CalendarEvent } from '@dashboard/contracts';
import type { PrometheusNormalized, ServerMetrics } from '@dashboard/integrations';

/**
 * Pure TypeScript interfaces — zero runtime dependencies.
 * TestIntegration<K> mirrors the capability interfaces from @dashboard/integrations
 * but with all methods optional so factories can override with vi.fn().
 */
export interface TestIntegration<K extends IntegrationKind> {
  publicIntegration: {
    id: string;
    name: string;
    kind: K;
    url: string;
    port?: number | null;
  };

  // Docker capability
  getDashboardStatsAsync?: (opts?: { signal?: AbortSignal }) => Promise<DockerDashboardStats>;
  startContainerAsync?: (id: string) => Promise<void>;
  stopContainerAsync?: (id: string) => Promise<void>;
  restartContainerAsync?: (id: string) => Promise<void>;
  removeContainerAsync?: (id: string) => Promise<void>;

  // Download client capability
  getClientJobsAndStatusAsync?: (input?: GetClientJobsAndStatusInput) => Promise<DownloadClientJobsAndStatus>;
  pauseQueueAsync?: () => Promise<void>;
  pauseItemAsync?: (item: DownloadClientItem) => Promise<void>;
  resumeQueueAsync?: () => Promise<void>;
  resumeItemAsync?: (item: DownloadClientItem) => Promise<void>;
  deleteItemAsync?: (item: DownloadClientItem, fromDisk: boolean) => Promise<void>;

  // Calendar capability
  getCalendarEventsAsync?: (
    start: Date,
    end: Date,
    includeUnmonitored: boolean,
    opts?: { signal?: AbortSignal },
  ) => Promise<CalendarEvent[]>;

  // System health capability
  getSystemMetricsAsync?: () => Promise<PrometheusNormalized[]>;
  getServerMetricsAsync?: (server: string, options?: { signal?: AbortSignal; instances?: string[]; queryResults?: Map<string, unknown> }) => Promise<ServerMetrics | null>;
  getDiscoveredDataAsync?: (options?: { signal?: AbortSignal }) => Promise<{ instances: string[]; queryResults: Map<string, unknown> }>;
}

/**
 * Override map for factory: each key is a method name, value is either
 * an Error, an unknown value, or a function returning unknown.
 */
export interface IntegrationOverrides {
  [methodName: string]: Error | unknown | ((...args: any[]) => unknown);
}