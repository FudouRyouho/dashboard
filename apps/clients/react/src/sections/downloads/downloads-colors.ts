import type { DownloadClientItem } from '@dashboard/contracts';

export type DownloadState = DownloadClientItem['state'];

/** Mantine color name per canonical download state. */
export const stateColorMap: Record<DownloadState, string> = {
  leeching: 'blue',
  seeding: 'green',
  paused: 'yellow',
  stalled: 'orange',
  unknown: 'gray',
};

/** Row background tint for the states that need one; undefined means transparent. */
export const rowBgAlpha: Partial<Record<DownloadState, string>> = {
  stalled: 'rgba(255, 165, 0, 0.04)',
  paused: 'rgba(255, 200, 0, 0.03)',
};

/** Progress bar color: a paused job stays yellow even when fully downloaded. */
export function progressColor(state: DownloadState, progress: number): string {
  if (state === 'paused') return 'yellow';
  if (progress >= 1) return 'green';
  return 'blue';
}
