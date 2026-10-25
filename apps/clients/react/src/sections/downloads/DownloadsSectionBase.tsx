/**
 * Section: Downloads (qBittorrent torrents)
 *
 * REFERENCE:
 * - Guide: .working/homarr-research/ui-components-guide.md §2
 * - Homarr: references/homarr/packages/widgets/src/downloads/component.tsx
 *
 * API (future): downloads.getAllJobs -> DownloadClientJobsAndStatus[]
 * Mock: src/mock/downloads.mock.ts
 */
import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Menu,
  Portal,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconChevronUp,
  IconCopy,
  IconDownload,
  IconFilter,
  IconInfoCircle,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconTrashX,
  IconUpload,
} from '@tabler/icons-react';

import type { DownloadClientJobsAndStatus, DownloadClientItem } from '@dashboard/contracts';
import { formatByteRate, formatBytes } from '@dashboard/core';

type DownloadState = DownloadClientItem['state'];

const stateColorMap: Record<DownloadState, string> = {
  leeching: 'blue',
  seeding: 'green',
  paused: 'yellow',
  stalled: 'orange',
  unknown: 'gray',
};

const rowBgAlpha: Partial<Record<DownloadState, string>> = {
  stalled: 'rgba(255, 165, 0, 0.04)',
  paused: 'rgba(255, 200, 0, 0.03)',
};

/** Remaining milliseconds -> compact duration (e.g. "3h", "45s"). */
function formatTimeRemaining(ms: number): string {
  if (ms === 0) return '∞';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function progressColor(state: DownloadState, progress: number): string {
  if (state === 'paused') return 'yellow';
  if (progress >= 1) return 'green';
  return 'blue';
}

// function formatRatio(ratio: number): string {
//   if (ratio >= 100) return ratio.toFixed(0);
//   if (ratio >= 10) return ratio.toFixed(1);
//   return ratio.toFixed(2);
// }

function SpeedCell({ speed, direction }: { speed: number | undefined; direction: 'down' | 'up' }) {
  if (!speed) return null;
  const isDown = direction === 'down';
  return (
    <Group gap={4} wrap="nowrap">
      {isDown ? (
        <IconDownload size={12} style={{ opacity: 0.5 }} />
      ) : (
        <IconUpload size={12} style={{ opacity: 0.5 }} />
      )}
      <Text size="sm" c={isDown ? 'blue' : 'green'}>
        {formatByteRate(speed)}
      </Text>
    </Group>
  );
}

interface DownloadsSectionBaseProps {
  /** One per download-client integration (router groups by `integration`) */
  clients: DownloadClientJobsAndStatus[];
}

export function DownloadsSectionBase({ clients }: DownloadsSectionBaseProps) {
  // Flatten items with client context (Homarr: currentItems.flatMap)
  const allItems = useMemo(() => {
    return clients.flatMap((client, clientIndex) =>
      client.items.map((item) => ({
        ...item,
        clientIndex,
      })),
    );
  }, [clients]);

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: DownloadClientItem;
    clientIndex: number;
  } | null>(null);

  const filteredItems = useMemo(() => {
    if (statusFilter.length === 0) return allItems;
    return allItems.filter(({ state }) => statusFilter.includes(state));
  }, [allItems, statusFilter]);

  const availableStatuses = useMemo(
    () => [...new Set(allItems.map(({ state }) => state))],
    [allItems],
  );

  const totalSpeed = useMemo(
    () => clients.reduce((sum, c) => sum + (c.status?.rates?.down ?? 0), 0),
    [clients],
  );
  const totalUpSpeed = useMemo(
    () => clients.reduce((sum, c) => sum + (c.status?.rates?.up ?? 0), 0),
    [clients],
  );

  const queueStats = useMemo(() => {
    const stateCounts: Record<string, number> = {};
    let totalSize = 0;
    let completedSize = 0;
    for (const item of filteredItems) {
      stateCounts[item.state] = (stateCounts[item.state] ?? 0) + 1;
      totalSize += item.size;
      completedSize += item.size * item.progress;
    }
    return { stateCounts, totalSize, completedSize };
  }, [filteredItems]);

  const closeContextMenu = () => setContextMenu(null);

  const toggleArrayItem = <T,>(array: T[], value: T): T[] =>
    array.includes(value) ? array.filter((v) => v !== value) : [...array, value];

  const overallProgressPct =
    queueStats.totalSize > 0
      ? Math.floor((queueStats.completedSize / queueStats.totalSize) * 100)
      : 0;

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Downloads</Text>
          <Text size="xs" c="dimmed">
            {filteredItems.length} torrents
          </Text>
        </Group>

        {/* Stats Bar (Homarr: GlobalStatsBar) */}
        {showStats && (
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
                    {formatBytes(queueStats.completedSize)} / {formatBytes(queueStats.totalSize)}
                  </Text>
                </Tooltip>
              </Group>

              <Group gap={6}>
                {Object.entries(queueStats.stateCounts).map(([state, count]) => (
                  <Tooltip key={state} label={state} withArrow>
                    <Badge size="xs" variant="dot" color={stateColorMap[state as DownloadState] ?? 'gray'}>
                      {count}
                    </Badge>
                  </Tooltip>
                ))}
              </Group>
            </Group>
          </Box>
        )}

        {/* Filter panel (Homarr: WidgetFooter filter section) */}
        {filterOpen && (
          <Box px={8} py={6} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
            <Group gap={4}>
              <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
                State:
              </Text>
              <Group gap={4} wrap="wrap">
                {availableStatuses.map((status) => {
                  const active = statusFilter.includes(status);
                  return (
                    <Badge
                      key={status}
                      size="xs"
                      variant={active ? 'filled' : 'light'}
                      color={stateColorMap[status]}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setStatusFilter(toggleArrayItem(statusFilter, status))}
                    >
                      {status}
                    </Badge>
                  );
                })}
              </Group>
            </Group>
          </Box>
        )}

        {/* Table (Homarr: HomarrDataTable, simplified to native Mantine Table) */}
        <Table highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th w={120}>Progress</Table.Th>
              <Table.Th w={80}>Size</Table.Th>
              <Table.Th w={90}>Down</Table.Th>
              <Table.Th w={90}>Up</Table.Th>
              <Table.Th w={80}>ETA</Table.Th>
              <Table.Th w={90}>State</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredItems.map((item) => (
              <Table.Tr
                key={item.id}
                style={{
                  backgroundColor: rowBgAlpha[item.state],
                  cursor: 'context-menu',
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    item,
                    clientIndex: item.clientIndex,
                  });
                }}
              >
                <Table.Td>
                  <Tooltip
                    label={
                      <Stack gap={2}>
                        <Text size="xs" fw={600}>
                          {item.name}
                        </Text>
                        <Divider my={2} />
                        <Group gap={4} justify="space-between">
                          <Text size="xs" c="dimmed">
                            Size
                          </Text>
                          <Text size="xs" fw={500}>
                            {formatBytes(item.size * item.progress)} / {formatBytes(item.size)}
                          </Text>
                        </Group>
                        <Group gap={4} justify="space-between">
                          <Text size="xs" c="dimmed">
                            State
                          </Text>
                          <Text size="xs" fw={500}>
                            {item.state}
                          </Text>
                        </Group>
                        {item.category && (
                          <Group gap={4} justify="space-between">
                            <Text size="xs" c="dimmed">
                              Category
                            </Text>
                            <Text size="xs" fw={500}>
                              {item.category}
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
                          backgroundColor: `var(--mantine-color-${stateColorMap[item.state]}-filled)`,
                          flexShrink: 0,
                        }}
                      />
                      <Text size="sm" truncate fw={500}>
                        {item.name}
                      </Text>
                    </Group>
                  </Tooltip>
                </Table.Td>

                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs" fw={500} w={36} ta="right" style={{ flexShrink: 0 }}>
                      {Math.floor(item.progress * 100)}%
                    </Text>
                    <Progress
                      value={Math.floor(item.progress * 100)}
                      color={progressColor(item.state, item.progress)}
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </Group>
                </Table.Td>

                <Table.Td>
                  <Text size="sm">{formatBytes(item.size)}</Text>
                </Table.Td>

                <Table.Td>
                  <SpeedCell speed={item.downSpeed} direction="down" />
                </Table.Td>

                <Table.Td>
                  <SpeedCell speed={item.upSpeed} direction="up" />
                </Table.Td>

                <Table.Td>
                  <Text size="sm">{formatTimeRemaining(item.time)}</Text>
                </Table.Td>

                <Table.Td>
                  <Badge size="xs" variant="light" color={stateColorMap[item.state]}>
                    {item.state}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {/* Footer (Homarr: WidgetFooter) */}
        <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Group px={8} py={4} justify="space-between">
            <Group gap={6}>
              <Tooltip label="Filter">
                <ActionIcon
                  size="xs"
                  variant={filterOpen ? 'filled' : 'subtle'}
                  onClick={() => setFilterOpen((v) => !v)}
                >
                  <IconFilter size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={showStats ? 'Hide stats' : 'Show stats'}>
                <ActionIcon
                  size="xs"
                  variant={showStats ? 'filled' : 'subtle'}
                  onClick={() => setShowStats((v) => !v)}
                >
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

        {/* Context menu (Homarr: RowContextMenu) */}
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
              <Menu
                opened
                shadow="md"
                position="bottom-start"
                withinPortal={false}
                onClose={closeContextMenu}
              >
                <Menu.Target>
                  <Box
                    pos="fixed"
                    style={{
                      left: contextMenu.x,
                      top: contextMenu.y,
                      width: 1,
                      height: 1,
                    }}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>
                    {contextMenu.item.name.length > 40
                      ? `${contextMenu.item.name.slice(0, 40)}…`
                      : contextMenu.item.name}
                  </Menu.Label>

                  <Menu.Item
                    leftSection={<IconInfoCircle size={14} />}
                    onClick={() => {
                      void navigator.clipboard.writeText(contextMenu.item.name).catch(() => {});
                      closeContextMenu();
                    }}
                  >
                    Copy name
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconCopy size={14} />}
                    onClick={() => {
                      void navigator.clipboard.writeText(contextMenu.item.id).catch(() => {});
                      closeContextMenu();
                    }}
                  >
                    Copy ID
                  </Menu.Item>

                  <Menu.Divider />

                  {/* TODO: wire pause/resume/delete to downloads router mutations */}
                  <Menu.Item
                    leftSection={<IconPlayerPlay size={14} />}
                    color="green"
                    onClick={closeContextMenu}
                  >
                    Resume
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconPlayerPause size={14} />}
                    color="red"
                    onClick={closeContextMenu}
                  >
                    Pause
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={closeContextMenu}>
                    Delete torrent
                  </Menu.Item>
                  <Menu.Item color="red" leftSection={<IconTrashX size={14} />} onClick={closeContextMenu}>
                    Delete torrent and files
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
