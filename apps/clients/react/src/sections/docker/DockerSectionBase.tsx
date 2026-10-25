/**
 * Section: Docker (monitoreo y control de contenedores)
 *
 * REFERENCE:
 * - Guide: .working/homarr-research/ui-components-guide.md §3
 * - Homarr: references/homarr/packages/widgets/src/docker/component.tsx
 *   (widget) y apps/nextjs/src/app/[locale]/manage/tools/docker/docker-table.tsx
 *   (vista de administración con acciones)
 *
 * API (futura): docker.getContainers -> Array<{ integration, stats: DockerDashboardStats }>
 * Mock: src/mock/docker.mock.ts
 */
import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Menu,
  Portal,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconBrandDocker,
  IconCategoryPlus,
  IconFileText,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconRotateClockwise,
  IconTrash,
} from '@tabler/icons-react';

import type { DockerDashboardStats } from '@dashboard/integrations';

interface DockerContainerItem {
  id: string;
  names: string[];
  image: string;
  command: string;
  created: number;
  state: 'exited' | 'paused' | 'restarting' | 'running';
  status: string;
  health?: 'healthy' | 'none' | 'starting' | 'unhealthy';
  ports: {
    ip?: string;
    privatePort: number;
    publicPort?: number;
    type: string;
  }[];
}

interface DockerIntegrationMockData {
  integration: {
    id: string;
    name: string;
    kind: 'docker';
  };
  stats: DockerDashboardStats;
  containersList: DockerContainerItem[];
}

interface DockerSectionBaseProps {
  /** One per Docker integration (stats + container list) */
  servers: DockerIntegrationMockData[];
}

const containerStateColorMap: Record<string, string> = {
  running: 'green',
  exited: 'red',
  paused: 'yellow',
  restarting: 'orange',
};

const containerStateLabel: Record<string, string> = {
  running: 'Running',
  exited: 'Exited',
  paused: 'Paused',
  restarting: 'Restarting',
};

const rowBgAlpha: Record<string, string> = {
  exited: 'rgba(255, 0, 0, 0.04)',
  paused: 'rgba(255, 200, 0, 0.03)',
};

function formatTimeAgo(created: number): string {
  const seconds = Math.floor(Date.now() / 1000 - created);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getContainerIcon(image: string): string {
  return image.split('/').pop()?.split(':')[0]?.[0]?.toUpperCase() ?? '?';
}

export function DockerSectionBase({ servers }: DockerSectionBaseProps) {
  const allContainers = useMemo(() => {
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
    container: DockerContainerItem & { serverIndex: number; serverName: string };
  } | null>(null);

  const filteredContainers = useMemo(() => {
    if (stateFilter.length === 0) return allContainers;
    return allContainers.filter(({ state }) => stateFilter.includes(state));
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

        {/* Stats Bar (Homarr: footer with totals) */}
        {showStatsBar && (
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
        )}

        {/* Table */}
        <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Table highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th w={100}>State</Table.Th>
                <Table.Th w={120}>Host</Table.Th>
                <Table.Th w={100}>Image</Table.Th>
                <Table.Th w={100}>Created</Table.Th>
                <Table.Th w={80}>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredContainers.map((container) => (
                <Table.Tr
                  key={container.id}
                  style={{
                    backgroundColor: rowBgAlpha[container.state],
                    cursor: 'context-menu',
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      container,
                    });
                  }}
                >
                  <Table.Td>
                    <Tooltip
                      label={
                        <Stack gap={2}>
                          <Text size="xs" fw={600}>
                            {container.names[0] || container.id}
                          </Text>
                          <Divider my={2} />
                          <Group gap={4} justify="space-between">
                            <Text size="xs" c="dimmed">
                              Image
                            </Text>
                            <Text size="xs" fw={500}>
                              {container.image}
                            </Text>
                          </Group>
                          <Group gap={4} justify="space-between">
                            <Text size="xs" c="dimmed">
                              State
                            </Text>
                            <Text size="xs" fw={500}>
                              {containerStateLabel[container.state] || container.state}
                            </Text>
                          </Group>
                          <Group gap={4} justify="space-between">
                            <Text size="xs" c="dimmed">
                              Status
                            </Text>
                            <Text size="xs" fw={500}>
                              {container.status}
                            </Text>
                          </Group>
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
                        <Avatar
                          variant="outline"
                          radius="sm"
                          size={20}
                          styles={{ image: { objectFit: 'contain' } }}
                        >
                          {getContainerIcon(container.image)}
                        </Avatar>
                        <Text size="sm" truncate fw={500}>
                          {container.names[0] || container.id}
                        </Text>
                      </Group>
                    </Tooltip>
                  </Table.Td>

                  <Table.Td>
                    <Badge
                      size="xs"
                      variant="light"
                      color={containerStateColorMap[container.state] || 'gray'}
                    >
                      {containerStateLabel[container.state] || container.state}
                    </Badge>
                  </Table.Td>

                  <Table.Td>
                    <Tooltip label={container.serverName} withArrow>
                      <Text size="xs" truncate maw={150}>
                        {container.serverName}
                      </Text>
                    </Tooltip>
                  </Table.Td>

                  <Table.Td>
                    <Tooltip label={container.image} multiline maw={200} withArrow>
                      <Text size="xs" truncate maw={150}>
                        {container.image}
                      </Text>
                    </Tooltip>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs">{formatTimeAgo(container.created)}</Text>
                  </Table.Td>

                  <Table.Td>
                    <Badge
                      size="xs"
                      variant="light"
                      color={containerStateColorMap[container.state] || 'gray'}
                    >
                      {containerStateLabel[container.state] || container.state}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Footer with refresh */}
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

        {/* Context Menu */}
        {contextMenu && (
          <Portal>
            <Box
              pos="fixed"
              top={0}
              left={0}
              w="100vw"
              h="100vh"
              style={{ zIndex: 1000 }}
              onClick={closeContextMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeContextMenu();
              }}
            >
              <Menu opened shadow="md" position="bottom-start" withinPortal={false} onClose={closeContextMenu}>
                <Menu.Target>
                  <Box pos="fixed" style={{ left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>
                    {contextMenu.container.names[0] || contextMenu.container.id}
                  </Menu.Label>

                  <Menu.Item leftSection={<IconFileText size={14} />} onClick={closeContextMenu}>
                    Logs
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item leftSection={<IconPlayerPlay size={14} />} color="green" onClick={closeContextMenu}>
                    Start
                  </Menu.Item>
                  <Menu.Item leftSection={<IconPlayerStop size={14} />} color="red" onClick={closeContextMenu}>
                    Stop
                  </Menu.Item>
                  <Menu.Item leftSection={<IconRotateClockwise size={14} />} color="orange" onClick={closeContextMenu}>
                    Restart
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={closeContextMenu}>
                    Remove
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item leftSection={<IconCategoryPlus size={14} />} onClick={closeContextMenu}>
                    Add to Dashboard
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Box>
          </Portal>
        )}
      </Stack>
    </Card>
  );
}
