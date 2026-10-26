import { useMemo, useState } from 'react';
import { Card, Group, Stack, Text } from '@mantine/core';

import type { DownloadClientJobsAndStatus } from '@dashboard/contracts';

import { DownloadContextMenu, type DownloadContextMenuTarget } from './DownloadContextMenu';
import { DownloadTable } from './DownloadTable';
import { FooterBar } from './FooterBar';
import { StateFilter } from './StateFilter';
import { StatsBar } from './StatsBar';

interface DownloadsSectionBaseProps {
  /** One per download-client integration (router groups by `integration`) */
  clients: DownloadClientJobsAndStatus[];
}

export function DownloadsSectionBase({ clients }: DownloadsSectionBaseProps) {
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
  const [contextMenu, setContextMenu] = useState<DownloadContextMenuTarget | null>(null);

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

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Downloads</Text>
          <Text size="xs" c="dimmed">
            {filteredItems.length} torrents
          </Text>
        </Group>

        {showStats && (
          <StatsBar
            totalSize={queueStats.totalSize}
            completedSize={queueStats.completedSize}
            stateCounts={queueStats.stateCounts}
          />
        )}

        {filterOpen && (
          <StateFilter
            statuses={availableStatuses}
            selected={statusFilter}
            onToggle={(status) => setStatusFilter(toggleArrayItem(statusFilter, status))}
          />
        )}

        <DownloadTable items={filteredItems} onContextMenu={setContextMenu} />

        <FooterBar
          totalSpeed={totalSpeed}
          totalUpSpeed={totalUpSpeed}
          filterOpen={filterOpen}
          showStats={showStats}
          onToggleFilter={() => setFilterOpen((v) => !v)}
          onToggleStats={() => setShowStats((v) => !v)}
        />

        {contextMenu && <DownloadContextMenu contextMenu={contextMenu} onClose={closeContextMenu} />}
      </Stack>
    </Card>
  );
}
