import { integrationDefs } from '@dashboard/definitions';

/** Brand color of the source integration for the day dot; undefined for unknown kinds. */
export const integrationIndicatorColor = (kind: string): string | undefined =>
  (integrationDefs as Record<string, { color: string }>)[kind]?.color;
