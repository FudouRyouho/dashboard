import { z } from 'zod';

/**
 * Docker container as returned by `/containers/json?all=true`.
 * Based on real Docker Engine API v1.47 responses.
 */
export const dockerContainerSchema = z.object({
  /** Container ID (full 64-char hash) */
  Id: z.string(),
  /** Array of names, each starting with "/" (e.g., ["/lidarr"]) */
  Names: z.array(z.string()),
  /** Image name with tag (e.g., "lscr.io/linuxserver/lidarr:latest") */
  Image: z.string(),
  /** Image ID (sha256 hash) */
  ImageID: z.string().optional(),
  /** Command run in container */
  Command: z.string().optional(),
  /** Creation timestamp (unix seconds) */
  Created: z.number(),
  /** Current state */
  State: z.enum(['running', 'exited', 'paused', 'restarting', 'dead', 'created', 'removing']),
  /** Human-readable status (e.g., "Up 12 hours") */
  Status: z.string(),
  /** Port mappings */
  Ports: z.array(z.object({
    IP: z.string().optional(),
    PrivatePort: z.number(),
    PublicPort: z.number().optional(),
    Type: z.string(),
  })).optional(),
  /** Docker labels */
  Labels: z.record(z.string()).optional(),
  /** Health check status */
  Health: z.object({
    Status: z.enum(['healthy', 'unhealthy', 'starting', 'none']).optional(),
    FailingStreak: z.number().optional(),
    Log: z.array(z.object({
      Start: z.string(),
      End: z.string(),
      ExitCode: z.number(),
      Output: z.string(),
    })).optional(),
  }).optional(),
  /** Mount points */
  Mounts: z.array(z.object({
    Type: z.string(),
    Source: z.string(),
    Destination: z.string(),
    Mode: z.string().optional(),
    RW: z.boolean().optional(),
    Propagation: z.string().optional(),
  })).optional(),
  /** Network settings */
  NetworkSettings: z.object({
    Networks: z.record(z.object({
      IPAddress: z.string().optional(),
      Gateway: z.string().optional(),
      IPPrefixLen: z.number().optional(),
      MacAddress: z.string().optional(),
    })).optional(),
  }).optional(),
});

export type DockerContainer = z.infer<typeof dockerContainerSchema>;

/**
 * Docker system info as returned by `/info`.
 */
export const dockerSystemStatsSchema = z.object({
  ID: z.string().optional(),
  Containers: z.number(),
  ContainersRunning: z.number(),
  ContainersPaused: z.number(),
  ContainersStopped: z.number(),
  Images: z.number(),
  Driver: z.string().optional(),
  DriverStatus: z.array(z.array(z.string())).optional(),
  MemoryLimit: z.boolean().optional(),
  SwapLimit: z.boolean().optional(),
  CpuCfsPeriod: z.boolean().optional(),
  CpuCfsQuota: z.boolean().optional(),
  CPUShares: z.boolean().optional(),
  CPUSet: z.boolean().optional(),
  PidsLimit: z.boolean().optional(),
  IPv4Forwarding: z.boolean().optional(),
  NCPU: z.number(),
  MemTotal: z.number(),
  Name: z.string().optional(),
  ServerVersion: z.string().optional(),
  KernelVersion: z.string().optional(),
  OperatingSystem: z.string().optional(),
  OSVersion: z.string().optional(),
  OSType: z.string().optional(),
  Architecture: z.string().optional(),
  NEventsListener: z.number().optional(),
  NGoroutines: z.number().optional(),
  SystemTime: z.string().optional(),
  LoggingDriver: z.string().optional(),
  CgroupDriver: z.string().optional(),
  CgroupVersion: z.string().optional(),
  IndexServerAddress: z.string().optional(),
  RegistryConfig: z.object({}).optional(),
  GenericResources: z.array(z.unknown()).optional(),
  DockerRootDir: z.string().optional(),
  HttpProxy: z.string().optional(),
  HttpsProxy: z.string().optional(),
  NoProxy: z.string().optional(),
  Labels: z.array(z.string()).optional(),
  ExperimentalBuild: z.boolean().optional(),
  Runtimes: z.record(z.unknown()).optional(),
  runc: z.unknown().optional(),
  // Using passthrough to allow extra fields from Docker
}).passthrough();

export type DockerSystemStats = z.infer<typeof dockerSystemStatsSchema>;

/**
 * Container stats from `/containers/{id}/stats?stream=false`
 */
export const dockerContainerStatsSchema = z.object({
  id: z.string(),
  name: z.string(),
  os_type: z.string().optional(),
  read: z.string(),
  cpu_stats: z.object({
    cpu_usage: z.object({
      total_usage: z.number(),
      usage_in_kernelmode: z.number().optional(),
      usage_in_usermode: z.number().optional(),
    }),
    system_cpu_usage: z.number().optional(),
    online_cpus: z.number().optional(),
    throttling_data: z.object({
      periods: z.number().optional(),
      throttled_periods: z.number().optional(),
      throttled_time: z.number().optional(),
    }).optional(),
  }).optional(),
  memory_stats: z.object({
    usage: z.number(),
    stats: z.record(z.number()).optional(),
    limit: z.number().optional(),
  }).optional(),
  networks: z.record(z.object({
    rx_bytes: z.number(),
    rx_packets: z.number(),
    rx_errors: z.number(),
    rx_dropped: z.number(),
    tx_bytes: z.number(),
    tx_packets: z.number(),
    tx_errors: z.number(),
    tx_dropped: z.number(),
  })).optional(),
  pids_stats: z.object({
    current: z.number(),
    limit: z.number(),
  }).optional(),
  blkio_stats: z.object({
    io_service_bytes_recursive: z.array(z.object({
      major: z.number(),
      minor: z.number(),
      op: z.string(),
      value: z.number(),
    })).optional(),
  }).optional(),
}).passthrough();

export type DockerContainerStats = z.infer<typeof dockerContainerStatsSchema>;

/**
 * Log line from `/containers/{id}/logs`
 */
export const dockerLogLineSchema = z.object({
  stream: z.enum(['stdout', 'stderr']),
  content: z.string(),
  timestamp: z.string().optional(),
});

export type DockerLogLine = z.infer<typeof dockerLogLineSchema>;

export const dockerContainerLogOptionsSchema = z.object({
  stdout: z.boolean().default(true),
  stderr: z.boolean().default(true),
  tail: z.union([z.number(), z.literal('all')]).default(100),
  since: z.number().optional(),
  until: z.number().optional(),
  timestamps: z.boolean().default(false),
  follow: z.boolean().default(false),
});

export type DockerContainerLogOptions = z.infer<typeof dockerContainerLogOptionsSchema>;

export const dockerContainerActionInputSchema = z.object({
  integrationId: z.string().min(1),
  ids: z.array(z.string().min(1)).min(1),
});

export type DockerContainerActionInput = z.infer<typeof dockerContainerActionInputSchema>;
