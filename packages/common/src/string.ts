/**
 * Join path segments into a single path, removing duplicate slashes
 * Preserves URL protocol (http://, https://)
 * @param base Base path
 * @param paths Additional path segments
 * @returns Joined path
 */
export const joinPaths = (base: string, ...paths: string[]): string => {
  // Extract protocol if present
  const protocolMatch = base.match(/^(https?:\/\/)/);
  const protocol = protocolMatch ? protocolMatch[1] : '';
  const baseWithoutProtocol = protocol ? base.slice(protocol.length) : base;
  
  const allParts = [baseWithoutProtocol, ...paths];
  const normalized = allParts
    .map(p => p.replace(/\/+/g, '/').replace(/^\/|\/$/g, ''))
    .filter(Boolean);
  
  return protocol + normalized.join('/');
};

/**
 * Ensure string ends with the specified suffix
 * @param str String to check
 * @param suffix Suffix to ensure
 * @returns String with suffix added if missing
 */
export const ensureSuffix = (str: string, suffix: string): string =>
  str.endsWith(suffix) ? str : `${str}${suffix}`;

/**
 * Ensure string starts with the specified prefix
 * @param str String to check
 * @param prefix Prefix to ensure
 * @returns String with prefix added if missing
 */
export const ensurePrefix = (str: string, prefix: string): string =>
  str.startsWith(prefix) ? str : `${prefix}${str}`;

/**
 * Truncate string to specified length with ellipsis if needed
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export const truncate = (str: string, maxLength: number): string =>
  str.length <= maxLength ? str : `${str.slice(0, maxLength)}...`;

/**
 * Format bytes to human-readable string
 * @param bytes Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, unitIndex);
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};
