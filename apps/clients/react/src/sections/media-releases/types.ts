import type {
  IntegrationKind,
  MediaReleaseEvent,
  ResultStatus,
} from '@dashboard/contracts';

/**
 * One entry of `mediaReleases.getLatest`
 * (`apps/server/src/routers/media-releases.ts:12-44`): the public integration
 * that produced the releases, the snapshot `status`, and its payload.
 * `integration.kind` is what feeds `integrationDefs` for the source avatar.
 */
export interface MediaReleasesGroupProps {
  integration: {
    id: string;
    kind: IntegrationKind;
    name: string;
    url: string;
  };
  releases: MediaReleaseEvent[];
  status: ResultStatus;
}

/** Source avatar, resolved from `integrationDefs` by the Base. */
export interface MediaReleaseSourceProps {
  iconUrl: string;
  name: string;
}
