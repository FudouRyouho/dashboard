import { describe, test, expect } from 'vitest';
import {
  dockerContainerSchema,
  dockerNetworkSchema,
  dockerVolumesResponseSchema,
} from './docker-dashboard';

describe('Docker Dashboard Schemas', () => {
  describe('dockerContainerSchema', () => {
    test('parses valid containers', () => {
      const validContainer = {
        Id: 'abc123',
        Names: ['/test'],
        Image: 'test:latest',
        ImageID: 'sha256:abc123',
        Command: 'echo hello',
        Created: 1234567890,
        Ports: [],
        Labels: {},
        State: 'running',
        Status: 'Up 2 hours',
        HostConfig: { NetworkMode: 'bridge' },
        Health: { Status: 'healthy' as const },
      };
      const parsed = dockerContainerSchema.parse(validContainer);
      expect(parsed.Id).toBe('abc123');
      expect(parsed.State).toBe('running');
    });

    test('handles Health.null', () => {
      const container = {
        Id: 'abc123',
        Names: ['/test'],
        Image: 'test:latest',
        ImageID: 'sha256:abc123',
        Command: 'echo hello',
        Created: 1234567890,
        Ports: [],
        Labels: {},
        State: 'running',
        Status: 'Up 2 hours',
        HostConfig: { NetworkMode: 'bridge' },
        Health: null,
      };
      const parsed = dockerContainerSchema.parse(container);
      expect(!parsed.Health).toBeTruthy();
    });
  });

  describe('dockerNetworkSchema', () => {
    test('parses networks with IPAM.Config.null', () => {
      const network = {
        Name: 'test_network',
        Id: 'abc123',
        Scope: 'local',
        Driver: 'bridge',
        EnableIPv4: true,
        EnableIPv6: false,
        IPAM: { Driver: 'default', Options: null, Config: null },
        Internal: false,
        Attachable: false,
        Ingress: false,
        ConfigFrom: { Network: '' },
        ConfigOnly: false,
        Options: {},
        Labels: {},
      };
      const parsed = dockerNetworkSchema.parse(network);
      expect(parsed.Name).toBe('test_network');
    });
  });

  describe('dockerVolumesResponseSchema', () => {
    test('parses valid volume', () => {
      const validVolume = {
        Volumes: [
          {
            Name: 'test_volume',
            Driver: 'local',
            Mountpoint: '/var/lib/docker/volumes/test_volume/_data',
            CreatedAt: '2026-09-10T00:00:00Z',
            Labels: {},
            Scope: 'local',
            Options: null,
          },
        ],
        Warnings: null,
      };
      const parsed = dockerVolumesResponseSchema.parse(validVolume);
      expect(parsed.Volumes[0]?.Name).toBe('test_volume');
    });

    test('handles Warnings.null', () => {
      const validVolume = {
        Volumes: [
          {
            Name: 'test_volume',
            Driver: 'local',
            Mountpoint: '/var/lib/docker/volumes/test_volume/_data',
            Scope: 'local',
            Options: null,
          },
        ],
        Warnings: null,
      };
      const parsed = dockerVolumesResponseSchema.parse(validVolume);
      expect(parsed.Warnings === null).toBeTruthy();
    });
  });
});