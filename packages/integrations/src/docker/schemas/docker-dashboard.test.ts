import test from 'node:test';
import assert from 'node:assert/strict';
import { dockerContainerSchema, dockerNetworkSchema, dockerVolumesResponseSchema } from './docker-dashboard';

test('dockerContainerSchema parsea contenedores válidos', () => {
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
  assert.equal(parsed.Id, 'abc123');
  assert.equal(parsed.State, 'running');
});

test('dockerContainerSchema maneja Health.null', () => {
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
  assert.ok(!parsed.Health);
});

test('dockerNetworkSchema parsea redes con IPAM.Config.null', () => {
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
  assert.equal(parsed.Name, 'test_network');
});

test('dockerVolumesResponseSchema parsea volumen válido', () => {
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
  assert.equal(parsed.Volumes[0]?.Name, 'test_volume');
});

test('dockerVolumesResponseSchema maneja Warnings.null', () => {
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
  assert.ok(parsed.Warnings === null);
});