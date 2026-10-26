import { Badge, Box, Divider, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconDownload, IconNetwork, IconUpload } from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';

import { formatBytesPerSec } from './format';

/** Renders nothing when the list is empty. */
export function NetworkInterfacesList({ network }: { network: ServerMetrics['network'] }) {
  if (network.length === 0) return null;

  return (
    <Box mt="sm">
      <Divider my="xs" />
      <Text size="xs" fw={600} c="dimmed">
        Network
      </Text>
      <Stack gap="xs" mt="xs">
        {network.map((net) => (
          <Box
            key={net.device}
            p="xs"
            style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}
          >
            <Group justify="space-between">
              <Group gap="xs">
                <IconNetwork size={14} color="dimmed" />
                <Text size="xs" fw={500}>
                  {net.device}
                </Text>
              </Group>
              <Group gap="md">
                <Tooltip label="Download" withArrow>
                  <Badge variant="light" color="blue">
                    <Group gap={4}>
                      <IconDownload size={12} />
                      <Text size="xs">{formatBytesPerSec(net.rxBytesPerSec)}</Text>
                    </Group>
                  </Badge>
                </Tooltip>
                <Tooltip label="Upload" withArrow>
                  <Badge variant="light" color="green">
                    <Group gap={4}>
                      <IconUpload size={12} />
                      <Text size="xs">{formatBytesPerSec(net.txBytesPerSec)}</Text>
                    </Group>
                  </Badge>
                </Tooltip>
              </Group>
            </Group>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
