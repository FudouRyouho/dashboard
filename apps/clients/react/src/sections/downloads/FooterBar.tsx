import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { IconChevronUp, IconDownload, IconFilter, IconUpload } from '@tabler/icons-react';

import { formatByteRate } from '@dashboard/core';

interface FooterBarProps {
  /** Sum of download rates across every client (B/s). */
  totalSpeed: number;
  /** Sum of upload rates across every client (B/s); the badge hides when 0. */
  totalUpSpeed: number;
  filterOpen: boolean;
  showStats: boolean;
  onToggleFilter: () => void;
  onToggleStats: () => void;
}

export function FooterBar({
  totalSpeed,
  totalUpSpeed,
  filterOpen,
  showStats,
  onToggleFilter,
  onToggleStats,
}: FooterBarProps) {
  return (
    <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      <Group px={8} py={4} justify="space-between">
        <Group gap={6}>
          <Tooltip label="Filter">
            <ActionIcon size="xs" variant={filterOpen ? 'filled' : 'subtle'} onClick={onToggleFilter}>
              <IconFilter size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={showStats ? 'Hide stats' : 'Show stats'}>
            <ActionIcon size="xs" variant={showStats ? 'filled' : 'subtle'} onClick={onToggleStats}>
              <IconChevronUp size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Group gap={8}>
          <Group gap={4}>
            <Text size="xs" fw={600} c="blue">
              <IconDownload size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              {formatByteRate(totalSpeed)}
            </Text>
            {totalUpSpeed > 0 && (
              <Text size="xs" fw={600} c="green">
                <IconUpload size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                {formatByteRate(totalUpSpeed)}
              </Text>
            )}
          </Group>
        </Group>
      </Group>
    </Box>
  );
}
