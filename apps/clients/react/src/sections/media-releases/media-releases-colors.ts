import type { ResultStatus } from '@dashboard/contracts';

/** No snapshot yet for this source (gray.5). */
const NO_DATA = '#94a3b8';
/** The source has data (green.6). */
const HAS_DATA = '#2f9e44';

/**
 * Color of the per-source status dot. `ResultStatus` is facts, not a verdict
 * (contracts/src/result.ts): `data` is null until a snapshot exists, so the
 * only honest reading is "has data" vs. "no data yet". A failed latest attempt
 * over stale data still has data, so it stays green.
 */
export const statusDotColor = (status: ResultStatus): string =>
  status.data === null ? NO_DATA : HAS_DATA;
