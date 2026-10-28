import type { DockerContainer } from '@dashboard/contracts';

/**
 * Estados del enum del contract (`DockerContainer['State']`). El universo de filtro es
 * **ste** conjunto, no el de los contenedores presentes: filtrar nunca cambia qué se puede
 * elegir (R-vista · 3). Estaba incompleto — faltaban `created`, `dead`, `removing`.
 */
export const CONTAINER_STATES = [
  'running',
  'restarting',
  'paused',
  'created',
  'exited',
  'dead',
  'removing',
] as const satisfies readonly DockerContainer['State'][];

export const HEALTH_STATUSES = ['healthy', 'starting', 'unhealthy', 'none'] as const;

/** Mantine color name per container state. */
export const containerStateColorMap: Record<DockerContainer['State'], string> = {
  running: 'green',
  restarting: 'orange',
  paused: 'yellow',
  created: 'gray',
  exited: 'red',
  dead: 'red',
  removing: 'red',
};

/** Mantine color name per health status; the caller falls back to 'gray'. */
export const containerHealthColorMap: Record<(typeof HEALTH_STATUSES)[number], string> = {
  healthy: 'green',
  starting: 'yellow',
  unhealthy: 'red',
  none: 'gray',
};

/** Display label per container state. */
export const containerStateLabel: Record<DockerContainer['State'], string> = {
  running: 'Running',
  restarting: 'Restarting',
  paused: 'Paused',
  created: 'Created',
  exited: 'Exited',
  dead: 'Dead',
  removing: 'Removing',
};

/** Row wash for states that deserve a tint; undefined for the plain ones. */
export const rowBgAlpha: Partial<Record<DockerContainer['State'], string>> = {
  exited: 'rgba(255, 0, 0, 0.04)',
  dead: 'rgba(255, 0, 0, 0.04)',
  paused: 'rgba(255, 200, 0, 0.03)',
};
