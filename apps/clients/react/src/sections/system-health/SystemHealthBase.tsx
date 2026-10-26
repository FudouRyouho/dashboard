import { Badge, Box, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconCpu, IconDatabase, IconServer, IconTemperature } from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';
import { formatBytes } from '@dashboard/core';

import { CpuMemoryRings } from './CpuMemoryRings';
import { DiskUsageList } from './DiskUsageList';
import { formatTemp } from './format';
import { progressColor } from './health-colors';
import { NetworkInterfacesList } from './NetworkInterfacesList';
import { NetworkSummaryBar } from './NetworkSummaryBar';
import { SensorList } from './SensorList';

interface SystemHealthBaseProps {
  metrics: ServerMetrics[];
}

export function SystemHealthBase({ metrics }: SystemHealthBaseProps) {
  if (metrics.length === 0) {
    return (
      <Card withBorder p="md">
        <Stack gap="sm">
          <Text fw={600}>System Health</Text>
          <Text size="xs" c="dimmed">
            No metrics available (mock)
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Text fw={600}>System Health</Text>

        {metrics.map((metric) => (
          <ServerMetricsCard key={metric.server} metric={metric} />
        ))}
      </Stack>
    </Card>
  );
}

function ServerMetricsCard({ metric }: { metric: ServerMetrics }) {
  return (
    <Box p="sm" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <IconServer size={20} />
          <Text fw={600} size="lg">
            {metric.server}
          </Text>
        </Group>
        <Group gap="xs">
          <Badge size="xs" color="green">
            Online
          </Badge>
        </Group>
      </Group>

      <CpuMemoryRings metric={metric} />
      <MemoryDetailsBar metric={metric} />
      <CpuDetailsBar metric={metric} />
      <DiskUsageList disks={metric.disks} />
      <NetworkInterfacesList network={metric.network} />
      <SensorList sensors={metric.sensors} />
      <NetworkSummaryBar network={metric.network} />
    </Box>
  );
}

function MemoryDetailsBar({ metric }: { metric: ServerMetrics }) {
  const ramPercent = metric.memory.usagePercent ?? 0;
  return (
    <Group gap="md" mt="sm" wrap="wrap">
      <Tooltip label="Total RAM" withArrow>
        <Badge variant="light" color={progressColor(ramPercent)}>
          <Group gap={4}>
            <IconDatabase size={14} />
            <Text size="xs">{formatBytes(metric.memory.totalBytes ?? 0)}</Text>
          </Group>
        </Badge>
      </Tooltip>
      <Tooltip label="Available RAM" withArrow>
        <Badge variant="light" color={progressColor(ramPercent > 0 ? 100 - ramPercent : 0)}>
          <Group gap={4}>
            <IconDatabase size={14} />
            <Text size="xs">{formatBytes(metric.memory.availableBytes ?? 0)}</Text>
          </Group>
        </Badge>
      </Tooltip>
      <Tooltip label="RAM Usage" withArrow>
        <Badge variant="light" color={progressColor(ramPercent)}>
          <Group gap={4}>
            <IconDatabase size={14} />
            <Text size="xs">{metric.memory.usagePercent?.toFixed(1) ?? '—'}%</Text>
          </Group>
        </Badge>
      </Tooltip>
    </Group>
  );
}

/** Temperature badge hides when no sensor reports. */
function CpuDetailsBar({ metric }: { metric: ServerMetrics }) {
  const cpuPercent = metric.cpu.usagePercent ?? 0;
  return (
    <Group gap="md" mt="sm" wrap="wrap">
      <Tooltip label="CPU Usage" withArrow>
        <Badge variant="light" color={progressColor(cpuPercent)}>
          <Group gap={4}>
            <IconCpu size={14} />
            <Text size="xs">{metric.cpu.usagePercent?.toFixed(1) ?? '—'}%</Text>
          </Group>
        </Badge>
      </Tooltip>
      {metric.cpu.temperatureCelsius !== null && (
        <Tooltip label="CPU Temperature" withArrow>
          <Badge variant="light" color={progressColor(metric.cpu.temperatureCelsius ?? 0)}>
            <Group gap={4}>
              <IconTemperature size={14} />
              <Text size="xs">{formatTemp(metric.cpu.temperatureCelsius ?? 0)}</Text>
            </Group>
          </Badge>
        </Tooltip>
      )}
    </Group>
  );
}
