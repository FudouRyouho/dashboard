import { z } from 'zod';

export const portainerDashboardStatsSchema = z.object({
  Containers: z.object({
    Running: z.number(),
    Stopped: z.number(),
    Total: z.number(),
    Healthy: z.number().optional(),
    Unhealthy: z.number().optional(),
  }).optional(),
  Images: z.object({
    total: z.number().optional(),
    size: z.number().optional(),
  }).optional(),
  Volumes: z.number().optional(),
  Networks: z.number().optional(),
  Services: z.number().optional(),
  Stacks: z.number().optional(),
});

export type PortainerDashboardStats = z.infer<typeof portainerDashboardStatsSchema>;
