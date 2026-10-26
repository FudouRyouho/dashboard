import { Badge, Box, Group, Progress, Text, Tooltip } from '@mantine/core';
import { formatBytes } from '@dashboard/core';

import { type DownloadState, stateColorMap } from './downloads-colors';

interface StatsBarProps {
  /** Completed/total bytes of the *filtered* items, counted in the Base. */
  totalSize: number;
  completedSize: number;
  /** Items per state, counted in the Base over the filtered items. */
  stateCounts: Record<string, number>;
}

export function StatsBar({ totalSize, completedSize, stateCounts }: StatsBarProps) {
  const overallProgressPct = totalSize > 0 ? Math.floor((completedSize / totalSize) * 100) : 0;

  return (
    <Box px={8} py={6} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group justify="space-between" gap="xs" wrap="wrap">
        <Group gap="md">
          <Tooltip label="Overall progress" withArrow>
            <Group gap={4}>
              <Progress value={overallProgressPct} color="blue" size="xs" w={40} />
              <Text size="xs" fw={600}>
                {overallProgressPct}%
              </Text>
            </Group>
          </Tooltip>
          <Tooltip label="Total size" withArrow>
            <Text size="xs">
              {formatBytes(completedSize)} / {formatBytes(totalSize)}
            </Text>
          </Tooltip>
        </Group>

        <Group gap={6}>
          {Object.entries(stateCounts).map(([state, count]) => (
            <Tooltip key={state} label={state} withArrow>
              <Badge size="xs" variant="dot" color={stateColorMap[state as DownloadState] ?? 'gray'}>
                {count}
              </Badge>
            </Tooltip>
          ))}
        </Group>
      </Group>
    </Box>
  );
}
