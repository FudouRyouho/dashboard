import { z } from 'zod';

export const dockerContainerSchema = z.object({
  Id: z.string(),
  Names: z.array(z.string()),
  Image: z.string(),
  ImageID: z.string(),
  Command: z.string(),
  Created: z.number(),
  Ports: z.array(z.object({
    IP: z.string().optional(),
    PrivatePort: z.number(),
    PublicPort: z.number().optional(),
    Type: z.string(),
  })),
  Labels: z.record(z.string()),
  State: z.string(),
  Status: z.string(),
  HostConfig: z.object({
    NetworkMode: z.string(),
  }),
  Health: z.object({
    Status: z.enum(['healthy', 'unhealthy', 'starting', 'none']).optional(),
    FailingStreak: z.number().optional(),
  }).nullable().optional(),
  Mounts: z.array(z.object({
    Type: z.string(),
    Name: z.string().optional(),
    Source: z.string().optional(),
    Destination: z.string(),
    Driver: z.string().optional(),
    Mode: z.string().optional(),
    RW: z.boolean().optional(),
    Propagation: z.string().optional(),
  })).optional(),
  NetworkSettings: z.object({
    Networks: z.record(z.object({
      IPAMConfig: z.unknown().nullable().optional(),
      Links: z.unknown().nullable().optional(),
      Aliases: z.array(z.string()).nullable().optional(),
      DriverOpts: z.unknown().nullable().optional(),
      GwPriority: z.number().optional(),
      NetworkID: z.string(),
      EndpointID: z.string(),
      Gateway: z.string(),
      IPAddress: z.string(),
      MacAddress: z.string(),
      IPPrefixLen: z.number(),
      IPv6Gateway: z.string().optional(),
      GlobalIPv6Address: z.string().optional(),
      GlobalIPv6PrefixLen: z.number().optional(),
      DNSNames: z.array(z.string()).nullable().optional(),
    })).optional(),
  }).optional(),
});

export const dockerVolumeSchema = z.object({
  Name: z.string(),
  Driver: z.string(),
  Mountpoint: z.string(),
  CreatedAt: z.string().optional(),
  Labels: z.record(z.string()).optional(),
  Scope: z.string().optional(),
  Options: z.record(z.string()).nullable().optional(),
});

export const dockerVolumesResponseSchema = z.object({
  Volumes: z.array(dockerVolumeSchema),
  Warnings: z.array(z.string()).nullable().optional(),
});

export const dockerNetworkSchema = z.object({
  Name: z.string(),
  Id: z.string(),
  Created: z.string().optional(),
  Scope: z.string(),
  Driver: z.string(),
  EnableIPv4: z.boolean().optional(),
  EnableIPv6: z.boolean().optional(),
  IPAM: z.object({
    Driver: z.string().nullable().optional(),
    Options: z.record(z.string()).nullable().optional(),
    Config: z.array(z.object({
      Subnet: z.string(),
      Gateway: z.string(),
    })).nullable().optional(),
  }).nullable().optional(),
  Internal: z.boolean().optional(),
  Attachable: z.boolean().optional(),
  Ingress: z.boolean().optional(),
  ConfigFrom: z.object({
    Network: z.string(),
  }).optional(),
  ConfigOnly: z.boolean().optional(),
  Options: z.record(z.string()).optional(),
  Labels: z.record(z.string()).optional(),
});

export type DockerContainer = z.infer<typeof dockerContainerSchema>;
export type DockerVolume = z.infer<typeof dockerVolumeSchema>;
export type DockerNetwork = z.infer<typeof dockerNetworkSchema>;