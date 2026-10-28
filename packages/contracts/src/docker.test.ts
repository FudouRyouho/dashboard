import { describe, test, expect } from 'vitest';
import {
  dockerContainerSchema,
  dockerContainerStatsSchema,
  dockerSystemStatsSchema,
} from './docker';

/**
 * Required fields only, shaped like the real Docker Engine v1.47 reply.
 * `GenericResources` is included per case: the daemon sends it explicitly as null.
 */
const infoPayload = (
  genericResources: unknown,
): Record<string, unknown> => {
  const base: Record<string, unknown> = {
    Containers: 17,
    ContainersRunning: 14,
    ContainersPaused: 0,
    ContainersStopped: 3,
    Images: 40,
    NCPU: 16,
    MemTotal: 67_108_864_000,
  };
  if (genericResources !== Symbol.for('absent')) {
    base.GenericResources = genericResources;
  }
  return base;
};

describe('dockerSystemStatsSchema', () => {
  test('accepts GenericResources: null, which is what the daemon actually sends', () => {
    const parsed = dockerSystemStatsSchema.safeParse(infoPayload(null));
    expect(parsed.success).toBe(true);
  });

  test('accepts a daemon that omits GenericResources entirely', () => {
    const parsed = dockerSystemStatsSchema.safeParse(
      infoPayload(Symbol.for('absent')),
    );
    expect(parsed.success).toBe(true);
  });

  test('accepts a populated GenericResources array', () => {
    const parsed = dockerSystemStatsSchema.safeParse(
      infoPayload([{ NamedResourceSpec: { Kind: 'gpu', Value: '1' } }]),
    );
    expect(parsed.success).toBe(true);
  });

  test('keeps the required counters required', () => {
    const { NCPU: _removed, ...noNcpu } = infoPayload(null);
    expect(dockerSystemStatsSchema.safeParse(noNcpu).success).toBe(false);
  });
});

describe('dockerContainerSchema', () => {
  const container = {
    Id: 'a'.repeat(64),
    Names: ['/sonarr'],
    Image: 'lscr.io/linuxserver/sonarr:latest',
    ImageID: 'sha256:abc',
    Command: '/init',
    Created: 1_726_329_200,
    State: 'running',
    Status: 'Up 4 days (healthy)',
    Ports: [{ IP: '0.0.0.0', PrivatePort: 8989, PublicPort: 8989, Type: 'tcp' }],
    Labels: { 'compose-service': 'sonarr' },
    Health: { Status: 'healthy', FailingStreak: 0 },
    Mounts: [],
    NetworkSettings: { Networks: {} },
  };

  test('accepts a container as returned by /containers/json?all=true', () => {
    expect(dockerContainerSchema.safeParse(container).success).toBe(true);
  });

  test('rejects a state outside the contract enum', () => {
    expect(
      dockerContainerSchema.safeParse({ ...container, State: 'zombie' }).success,
    ).toBe(false);
  });
});

describe('dockerContainerStatsSchema', () => {
  test('accepts a non-streaming /stats reply', () => {
    const parsed = dockerContainerStatsSchema.safeParse({
      id: 'abc123',
      name: '/sonarr',
      read: '2026-01-01T00:00:00.123456789Z',
      cpu_stats: { cpu_usage: { total_usage: 1_000_000 } },
      memory_stats: { usage: 104_857_600, limit: 8_589_934_592 },
      networks: { eth0: { rx_bytes: 1, rx_packets: 1, rx_errors: 0, rx_dropped: 0, tx_bytes: 1, tx_packets: 1, tx_errors: 0, tx_dropped: 0 } },
      pids_stats: { current: 12 },
    });
    expect(parsed.success).toBe(true);
  });
});
