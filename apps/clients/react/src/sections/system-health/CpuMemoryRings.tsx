import { Group } from '@mantine/core';
import { IconCpu, IconDatabase, IconTemperature } from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';

import { formatTemp } from './format';
import { progressColor } from './health-colors';
import { MetricRing } from './MetricRing';

/** The temp ring hides when no sensor reports. */
export function CpuMemoryRings({ metric }: { metric: ServerMetrics }) {
  const cpuPercent = metric.cpu.usagePercent ?? 0;
  const ramPercent = metric.memory.usagePercent ?? 0;
  const temp = metric.cpu.temperatureCelsius;
  const tempValue = temp !== null ? Math.min((temp / 100) * 100, 100) : 0;

  return (
    <Group gap="md" wrap="wrap" mt="sm">
      <MetricRing
        value={cpuPercent}
        color={progressColor(cpuPercent)}
        display={(metric.cpu.usagePercent?.toFixed(1) ?? '—') + '%'}
        tooltip={'CPU: ' + (metric.cpu.usagePercent?.toFixed(1) ?? '—') + '%'}
        icon={<IconCpu size={14} color="dimmed" />}
      />

      {temp !== null && (
        <MetricRing
          value={tempValue}
          color={progressColor(tempValue)}
          display={formatTemp(temp)}
          tooltip={'CPU Temp: ' + formatTemp(temp)}
          icon={<IconTemperature size={14} color="dimmed" />}
        />
      )}

      <MetricRing
        value={ramPercent}
        color={progressColor(ramPercent)}
        display={(metric.memory.usagePercent?.toFixed(1) ?? '—') + '%'}
        tooltip={'RAM: ' + (metric.memory.usagePercent?.toFixed(1) ?? '—') + '%'}
        icon={<IconDatabase size={14} color="dimmed" />}
      />
    </Group>
  );
}
