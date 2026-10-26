import { Badge, Box, Divider, Group, Progress, Stack, Text } from '@mantine/core';
import { IconServer } from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';
import { formatBytes } from '@dashboard/core';

import { formatBytesPerSec } from './format';
import { progressColor } from './health-colors';

/** Renders nothing when the list is empty. */
export function DiskUsageList({ disks }: { disks: ServerMetrics['disks'] }) {
  if (disks.length === 0) return null;

  return (
    <Box mt="sm">
      <Divider my="xs" />
      <Text size="xs" fw={600} c="dimmed">
        Disks
      </Text>
      <Stack gap="xs" mt="xs">
        {disks.map((disk) => (
          <Box
            key={disk.mountpoint}
            p="xs"
            style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconServer size={14} color="dimmed" />
                <Text size="xs" fw={500}>
                  {disk.mountpoint}
                </Text>
                <Badge size="xs" variant="light" color={disk.isSystemMount ? 'blue' : 'gray'}>
                  {disk.fstype}
                </Badge>
              </Group>
              <Group gap="xs">
                <Badge size="xs" variant="dot" color={progressColor(disk.usagePercent ?? 0)}>
                  {disk.usagePercent?.toFixed(1) ?? '—'}%
                </Badge>
              </Group>
            </Group>
            <Progress.Root size="sm" radius="sm">
              <Progress.Section value={disk.usagePercent ?? 0} color={progressColor(disk.usagePercent ?? 0)} />
              <Progress.Section value={100 - (disk.usagePercent ?? 0)} color="default" />
            </Progress.Root>
            <Group justify="space-between" mt="xs">
              <Text size="xs" c="dimmed">
                Used: {formatBytes(disk.totalBytes && disk.availableBytes ? (disk.totalBytes ?? 0) - (disk.availableBytes ?? 0) : 0)}
              </Text>
              <Text size="xs" c="dimmed">
                Free: {formatBytes(disk.availableBytes ?? 0)}
              </Text>
              <Text size="xs" c="dimmed">
                R: {formatBytesPerSec(disk.readBytesPerSec)} W: {formatBytesPerSec(disk.writeBytesPerSec)}
              </Text>
            </Group>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
