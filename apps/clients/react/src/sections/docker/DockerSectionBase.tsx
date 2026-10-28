import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { ActionIcon, Box, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

import { DockerContainerContextMenu } from './DockerContainerContextMenu';
import { DockerContainerTable } from './DockerContainerTable';
import { DockerStatsBar } from './DockerStatsBar';
import type { DockerContainerEntry, DockerIntegrationMockData } from './types';

interface DockerSectionBaseProps {
  /** One per Docker integration (stats + container list) */
  servers: DockerIntegrationMockData[];
}

export function DockerSectionBase({ servers }: DockerSectionBaseProps) {
  const allContainers = useMemo<DockerContainerEntry[]>(() => {
    return servers.flatMap((server, serverIndex) =>
      server.containersList.map((container) => ({
        ...container,
        serverIndex,
        serverName: server.integration.name,
        serverId: server.integration.id,
      })),
    );
  }, [servers]);

  const [stateFilter] = useState<string[]>([]);
  const [showStatsBar] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    container: DockerContainerEntry;
  } | null>(null);

  const filteredContainers = useMemo(() => {
    if (stateFilter.length === 0) return allContainers;
    return allContainers.filter(({ State }) => stateFilter.includes(State));
  }, [allContainers, stateFilter]);

  const totals = useMemo(() => {
    return servers.reduce(
      (acc, server) => {
        acc.containers += server.stats.containers.total ?? 0;
        acc.running += server.stats.containers.running ?? 0;
        acc.stopped += server.stats.containers.stopped ?? 0;
        acc.images += server.stats.images.total ?? 0;
        acc.networks += server.stats.networks.total ?? 0;
        acc.volumes += server.stats.volumes.total ?? 0;
        return acc;
      },
      { containers: 0, running: 0, stopped: 0, images: 0, networks: 0, volumes: 0 },
    );
  }, [servers]);

  const openContextMenu = (event: MouseEvent, container: DockerContainerEntry) =>
    setContextMenu({ x: event.clientX, y: event.clientY, container });

  const closeContextMenu = () => setContextMenu(null);

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Docker</Text>
          <Text size="xs" c="dimmed">
            {allContainers.length} containers across {servers.length} host(s)
          </Text>
        </Group>

        {showStatsBar && <DockerStatsBar totals={totals} />}

        <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <DockerContainerTable containers={filteredContainers} onContextMenu={openContextMenu} />
        </Box>

        <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Group px={8} py={4} justify="space-between">
            <Group gap={6}>
              <Tooltip label="Refresh">
                <ActionIcon
                  size="sm"
                  variant="transparent"
                  c="var(--mantine-color-text)"
                  onClick={() => {
                    /* TODO: refetch */
                  }}
                  aria-label="Refresh"
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Box>

        <DockerContainerContextMenu contextMenu={contextMenu} onClose={closeContextMenu} />
      </Stack>
    </Card>
  );
}
