import { Badge, Box, Group, Text } from '@mantine/core';

import { type DownloadState, stateColorMap } from './downloads-colors';

interface StateFilterProps {
  /** States actually present in the queue, computed in the Base. */
  statuses: DownloadState[];
  selected: string[];
  onToggle: (status: DownloadState) => void;
}

export function StateFilter({ statuses, selected, onToggle }: StateFilterProps) {
  return (
    <Box px={8} py={6} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group gap={4}>
        <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
          State:
        </Text>
        <Group gap={4} wrap="wrap">
          {statuses.map((status) => (
            <Badge
              key={status}
              size="xs"
              variant={selected.includes(status) ? 'filled' : 'light'}
              color={stateColorMap[status]}
              style={{ cursor: 'pointer' }}
              onClick={() => onToggle(status)}
            >
              {status}
            </Badge>
          ))}
        </Group>
      </Group>
    </Box>
  );
}
