/**
 * tRPC HTTP client — plain fetch, no framework deps.
 * Calls the server's /trpc endpoint directly.
 * Queries use GET (input in query string), mutations use POST.
 */

import type {
  CalendarResult,
  DockerContainer,
  DockerContainersResult,
  DownloadClientItem,
  IntegrationOutput,
  IntegrationPublic,
  MediaReleasesResult,
  SystemHealthEntry,
} from '@dashboard/contracts';

const TRPC_URL = '/trpc';

/**
 * Default calendar window: previous month through next two months.
 * Mirrors the server's calendar task window (3 months).
 */
export function defaultCalendarRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

interface TRPCResponseSuccess<TData> {
  result: { data: TData };
}

interface TRPCResponseError {
  result: {
    error: { message: string; code: string; stack?: string };
  };
}

function toQueryString(input: unknown): string {
  if (!input) return '';
  const keys = Object.keys(input);
  if (keys.length === 0) return '';
  const params = new URLSearchParams();
  // tRPC expects input as a JSON string in the 'input' query param
  params.append('input', JSON.stringify(input));
  return params.toString();
}

async function callProcedure<TData>(
  path: string,
  input?: unknown,
  method: 'mutation' | 'query' = 'query',
): Promise<TData | null> {
  const isQuery = method === 'query';
  const url = `${TRPC_URL}/${path}${isQuery ? `?${toQueryString(input)}` : ''}`;

  const options: RequestInit = {
    method: isQuery ? 'GET' : 'POST',
    headers: isQuery ? {} : { 'Content-Type': 'application/json' },
    body: isQuery ? undefined : JSON.stringify({ input, json: input, method: 'mutation' }),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`tRPC request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TRPCResponseError | TRPCResponseSuccess<TData>;

  if ('error' in data.result) {
    const { code, message } = data.result.error;
    throw new Error(`tRPC error (${code}): ${message}`);
  }

  return data.result.data;
}

// ─── Health ──────────────────────────────────────────────────
export const fetchHealth = () => callProcedure<{ status: string }>('health');

// ─── Calendar ────────────────────────────────────────────────
export const fetchCalendarEvents = (params?: {
  start?: string;
  end?: string;
}) => callProcedure<CalendarResult[]>('calendar.getEvents', params ?? defaultCalendarRange());

// ─── Media Releases ──────────────────────────────────────────
export const fetchMediaReleases = () =>
  callProcedure<MediaReleasesResult[]>('mediaReleases.getLatest');

// ─── Downloads ───────────────────────────────────────────────
export const fetchDownloads = () =>
  callProcedure<DownloadClientItem[]>('downloads.getAllJobs');

// ─── Docker ──────────────────────────────────────────────────
export const fetchDockerContainers = () =>
  callProcedure<DockerContainersResult[]>('docker.getContainers');

export const fetchDockerContainerList = (integrationId: string) =>
  callProcedure<DockerContainer[]>('docker.getContainerList', { integrationId });

export const fetchDockerContainerLogs = (params: {
  integrationId: string;
  containerId: string;
  tail?: number | 'all';
  stdout?: boolean;
  stderr?: boolean;
}) => callProcedure<string[]>('docker.getContainerLogs', params);

export const fetchDockerContainerStats = (params: {
  integrationId: string;
  containerId: string;
}) => callProcedure<unknown>('docker.getContainerStats', params);

export const fetchDockerSystemStats = (integrationId: string) =>
  callProcedure<unknown>('docker.getSystemStats', { integrationId });

export const dockerStartAll = (params: {
  integrationId: string;
  ids: string[];
}) => callProcedure<void>('docker.startAll', params, 'mutation');

export const dockerStopAll = (params: {
  integrationId: string;
  ids: string[];
}) => callProcedure<void>('docker.stopAll', params, 'mutation');

export const dockerRestartAll = (params: {
  integrationId: string;
  ids: string[];
}) => callProcedure<void>('docker.restartAll', params, 'mutation');

export const dockerRemoveAll = (params: {
  integrationId: string;
  ids: string[];
}) => callProcedure<void>('docker.removeAll', params, 'mutation');

// ─── System Health ───────────────────────────────────────────
export const fetchSystemHealth = () =>
  callProcedure<SystemHealthEntry[]>('systemHealth.getAllMetrics');

// ─── Integrations ────────────────────────────────────────────
export const fetchIntegrations = () =>
  callProcedure<IntegrationOutput[]>('integrations.list');

export const addIntegration = (data: {
  name: string;
  kind: string;
  url: string;
  api_key?: string;
}) => callProcedure<IntegrationPublic>('integrations.add', data, 'mutation');

export const updateIntegration = (data: {
  id: string;
  name?: string;
  url?: string;
  api_key?: string;
}) => callProcedure<IntegrationPublic>('integrations.update', data, 'mutation');

export const deleteIntegration = (id: string) =>
  callProcedure<void>('integrations.remove', { id }, 'mutation');