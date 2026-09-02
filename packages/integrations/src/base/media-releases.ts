import { MediaRelease } from '@dashboard/contracts';
import { Integration } from './integration';

export interface IMediaReleasesIntegration {
  getMediaReleasesAsync(options?: {
    signal?: AbortSignal;
  }): Promise<MediaRelease[]>;
}

const mediaReleasesCapability: keyof IMediaReleasesIntegration =
  'getMediaReleasesAsync';

export const supportsMediaReleases = (
  integration: Integration,
): integration is IMediaReleasesIntegration & Integration =>
  typeof (integration as Partial<IMediaReleasesIntegration>)[
    mediaReleasesCapability
  ] === 'function';
