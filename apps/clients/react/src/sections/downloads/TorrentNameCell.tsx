import { Box, Divider, Group, Stack, Text, Tooltip } from '@mantine/core';

import { formatBytes } from '@dashboard/core';

import { type DownloadState, stateColorMap } from './downloads-colors';

interface TorrentNameCellProps {
  name: string;
  state: DownloadState;
  size: number;
  progress: number;
  /** Empty string / undefined hides the category row of the hover-card. */
  category?: string;
}

export function TorrentNameCell({ name, state, size, progress, category }: TorrentNameCellProps) {
  return (
    <Tooltip
      label={
        <Stack gap={2}>
          <Text size="xs" fw={600}>
            {name}
          </Text>
          <Divider my={2} />
          <Group gap={4} justify="space-between">
            <Text size="xs" c="dimmed">
              Size
            </Text>
            <Text size="xs" fw={500}>
              {formatBytes(size * progress)} / {formatBytes(size)}
            </Text>
          </Group>
          <Group gap={4} justify="space-between">
            <Text size="xs" c="dimmed">
              State
            </Text>
            <Text size="xs" fw={500}>
              {state}
            </Text>
          </Group>
          {category && (
            <Group gap={4} justify="space-between">
              <Text size="xs" c="dimmed">
                Category
              </Text>
              <Text size="xs" fw={500}>
                {category}
              </Text>
            </Group>
          )}
        </Stack>
      }
      multiline
      w={300}
      withArrow
      position="bottom-start"
      openDelay={400}
      color="dark"
    >
      <Group gap={6} wrap="nowrap" style={{ overflow: 'hidden' }}>
        <Box
          w={8}
          h={8}
          style={{
            borderRadius: '50%',
            backgroundColor: `var(--mantine-color-${stateColorMap[state]}-filled)`,
            flexShrink: 0,
          }}
        />
        <Text size="sm" truncate fw={500}>
          {name}
        </Text>
      </Group>
    </Tooltip>
  );
}
