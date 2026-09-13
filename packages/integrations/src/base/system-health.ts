import { Integration } from './integration';
import { PrometheusNormalized, ServerMetrics } from '../prometheus/types';

/**
 * D4: Capability interface for system health metrics.
 */
export interface ISystemHealthIntegration {
  getSystemMetricsAsync(options?: { signal?: AbortSignal }): Promise<PrometheusNormalized[]>;
  getServerMetricsAsync(server: string, options?: { signal?: AbortSignal }): Promise<ServerMetrics | null>;
}

/**
 * Type guard for system health capability.
 */
export const supportsSystemHealth = (
  integration: Integration
): integration is ISystemHealthIntegration & Integration =>
  typeof (integration as Partial<ISystemHealthIntegration>)['getSystemMetricsAsync'] === 'function';