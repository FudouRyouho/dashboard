/** Container creation time as a coarse age ("42s ago", "3d ago"), relative to now. */
export function formatTimeAgo(created: number): string {
  const seconds = Math.floor(Date.now() / 1000 - created);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Avatar initials for an image reference: first letter of its name without the tag. */
export function getContainerIcon(image: string): string {
  return image.split('/').pop()?.split(':')[0]?.[0]?.toUpperCase() ?? '?';
}
