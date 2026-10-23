import type { MediaReleaseEvent } from '@dashboard/contracts';

/**
 * Media type -> label color, as a hex string.
 *
 * Stored as hex (not Mantine palette names) so this package stays
 * framework-agnostic: it is the single source of truth for "how a media
 * type looks" shared by all clients, regardless of framework or env.
 * Values match the Mantine default palette (blue.6, green.6, violet.6).
 */
export type MediaReleaseType = MediaReleaseEvent['type'];

interface MediaTypeDef {
  /** Hex label color for badges/indicators of this media type. */
  color: string;
}

export const mediaTypeDefs = {
  movie: {
    color: '#1c64f2',
  },
  episode: {
    color: '#0ca678',
  },
  series: {
    color: '#7048e8',
  },
} as const satisfies Record<MediaReleaseType, MediaTypeDef>;

/**
 * Color for a media type badge. Unknown types fall back to gray.
 * @returns hex color string, e.g. `mediaTypeColor('movie')` -> `#1c64f2`
 */
export const mediaTypeColor = (type: string): string =>
  (mediaTypeDefs as Record<string, MediaTypeDef>)[type]?.color ?? '#94a3b8';
