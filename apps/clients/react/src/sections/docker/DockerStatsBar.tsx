import { Box, Group, Text, Tooltip } from '@mantine/core';
import { IconBrandDocker } from '@tabler/icons-react';

interface DockerStatsBarProps {
  totals: {
    containers: number;
    running: number;
    stopped: number;
    images: number;
    networks: number;
    volumes: number;
  };
}

export function DockerStatsBar({ totals }: DockerStatsBarProps) {
  return (
    <Box px={8} py={6} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group justify="space-between" gap="xs" wrap="wrap">
        <Group gap="md">
          <Tooltip label="Containers" withArrow>
            <Group gap={4}>
              <IconBrandDocker size={20} style={{ flexShrink: 0 }} />
              <Text size="sm">
                {totals.running}/{totals.containers} running
              </Text>
            </Group>
          </Tooltip>
          <Tooltip label="Images" withArrow>
            <Group gap={4}>
              <Text size="xs">{totals.images} images</Text>
            </Group>
          </Tooltip>
          <Tooltip label="Networks" withArrow>
            <Group gap={4}>
              <Text size="xs">{totals.networks} networks</Text>
            </Group>
          </Tooltip>
          <Tooltip label="Volumes" withArrow>
            <Group gap={4}>
              <Text size="xs">{totals.volumes} volumes</Text>
            </Group>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
}
