import { Box, Group, Text, Tooltip } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';

import { formatBytesPerSec } from './format';

export function NetworkSummaryBar({ network }: { network: ServerMetrics['network'] }) {
  return (
    <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', marginTop: 'sm', paddingTop: 'sm' }}>
      <Group justify="space-between">
        <Group gap="md">
          <Tooltip label="Total Download" withArrow>
            <Group gap={4}>
              <IconDownload size={14} color="blue" />
              <Text size="xs" fw={600} color="blue">
                {formatBytesPerSec(network.reduce((sum, n) => sum + (n.rxBytesPerSec ?? 0), 0))}
              </Text>
            </Group>
          </Tooltip>
          <Tooltip label="Total Upload" withArrow>
            <Group gap={4}>
              <IconUpload size={14} color="green" />
              <Text size="xs" fw={600} color="green">
                {formatBytesPerSec(network.reduce((sum, n) => sum + (n.txBytesPerSec ?? 0), 0))}
              </Text>
            </Group>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
}
