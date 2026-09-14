import { Integration } from './integration';
import type { DownloadClientItem, DownloadClientJobsAndStatus, GetClientJobsAndStatusInput } from '@dashboard/contracts';

export interface IDownloadClientIntegration {
  getClientJobsAndStatusAsync(
    input: GetClientJobsAndStatusInput,
    options?: { signal?: AbortSignal }
  ): Promise<DownloadClientJobsAndStatus>;

  pauseQueueAsync(options?: { signal?: AbortSignal }): Promise<void>;
  pauseItemAsync(item: DownloadClientItem, options?: { signal?: AbortSignal }): Promise<void>;
  resumeQueueAsync(options?: { signal?: AbortSignal }): Promise<void>;
  resumeItemAsync(item: DownloadClientItem, options?: { signal?: AbortSignal }): Promise<void>;
  deleteItemAsync(
    item: DownloadClientItem,
    fromDisk: boolean,
    options?: { signal?: AbortSignal }
  ): Promise<void>;
}

const downloadClientCapability: keyof IDownloadClientIntegration = 'getClientJobsAndStatusAsync';

export const supportsDownloadClient = (
  integration: Integration
): integration is IDownloadClientIntegration & Integration =>
  typeof (integration as Partial<IDownloadClientIntegration>)[downloadClientCapability] === 'function';