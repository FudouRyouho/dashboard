import type { MediaReleasesResult } from '@dashboard/contracts';

/**
 * Un elemento de `mediaReleases.getLatest` - tipa contra el schema de contracts.
 * `integration.kind` alimenta `integrationDefs` para el avatar de la fuente.
 */
export type MediaReleasesGroupProps = MediaReleasesResult;

/** Source avatar, resuelto desde `integrationDefs` por la Base. */
export interface MediaReleaseSourceProps {
  iconUrl: string;
  name: string;
}