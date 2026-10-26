/** Mantine color name for a container state; the caller falls back to 'gray'. */
export const containerStateColorMap: Record<string, string> = {
  running: 'green',
  exited: 'red',
  paused: 'yellow',
  restarting: 'orange',
};

/** Display label per container state; the caller falls back to the raw state. */
export const containerStateLabel: Record<string, string> = {
  running: 'Running',
  exited: 'Exited',
  paused: 'Paused',
  restarting: 'Restarting',
};

/** Row wash for states that deserve a tint; undefined for the plain ones. */
export const rowBgAlpha: Record<string, string> = {
  exited: 'rgba(255, 0, 0, 0.04)',
  paused: 'rgba(255, 200, 0, 0.03)',
};
