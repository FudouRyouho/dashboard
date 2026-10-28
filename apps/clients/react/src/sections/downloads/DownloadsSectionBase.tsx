import { useMemo, useState } from 'react';
import { ActionIcon, Card, Stack, Text, Tooltip } from '@mantine/core';
import { IconDownload, IconFilter, IconUpload } from '@tabler/icons-react';

import type { DownloadClientJobsAndStatus } from '@dashboard/contracts';
import { formatByteRate } from '@dashboard/core';
import { EmptyState } from '../../components/EmptyState';
import { isFilterActive } from '../../components/filter-selection';
import { FilterSurface } from '../../components/FilterSurface';
import { SectionBar } from '../../components/SectionBar';

import { DownloadContextMenu, type DownloadContextMenuTarget } from './DownloadContextMenu';
import { DownloadTable, type DownloadsSort, type DownloadsSortKey } from './DownloadTable';
import type { DownloadsTableRow } from './TorrentRow';
import { type DownloadState, stateColorMap } from './downloads-colors';

interface DownloadsSectionBaseProps {
  /** One per download-client integration (router groups by `integration`) */
  clients: DownloadClientJobsAndStatus[];
}

/** Estados canónicos del contract: el universo de filtro nunca sale de la data visible. */
const ALL_STATES: DownloadState[] = ['leeching', 'seeding', 'paused', 'stalled', 'unknown'];

/**
 * D4.9 (provisional). Se implementó **actividad ↓**, no el "progreso ↓" que se había anotado:
 * progreso descendente ordena por *cercano a completo*, así que los seeders (progreso 1, sin
 * actividad) quedan primero — lo contrario del lente de la section. Actividad descendente sube
 * lo que se está bajando ahora y hunde lo inactivo. Cambiar una línea si se prefiere el anterior.
 */
const DEFAULT_SORT: DownloadsSort = { key: 'downSpeed', dir: 'desc' };

function compare(a: DownloadsTableRow, b: DownloadsTableRow, key: DownloadsSortKey): number {
  switch (key) {
    case 'name':
    case 'state':
      return String(a[key]).localeCompare(String(b[key]));
    default:
      return a[key] - b[key];
  }
}


export function DownloadsSectionBase({ clients }: DownloadsSectionBaseProps) {
  const allItems = useMemo<DownloadsTableRow[]>(
    () =>
      clients.flatMap((client, clientIndex) =>
        client.items.map((item) => ({ ...item, clientIndex })),
      ),
    [clients],
  );

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<DownloadsSort>(DEFAULT_SORT);
  const [filterOpen, setFilterOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<DownloadContextMenuTarget | null>(null);

  const filtered = stateFilter !== undefined;

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = allItems.filter(
      (item) =>
        (!stateFilter || item.state === stateFilter) &&
        (!needle || item.name.toLowerCase().includes(needle)),
    );
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compare(a, b, sort.key) * factor);
  }, [allItems, stateFilter, search, sort]);

  /** Señal del sujeto: actividad agregada de la cola, no inventario. */
  const totalSpeed = useMemo(
    () => clients.reduce((sum, c) => sum + (c.status?.rates?.down ?? 0), 0),
    [clients],
  );
  const totalUpSpeed = useMemo(
    () => clients.reduce((sum, c) => sum + (c.status?.rates?.up ?? 0), 0),
    [clients],
  );

  const closeContextMenu = () => setContextMenu(null);

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        {visibleItems.length === 0 ? (
          <EmptyState icon={<IconDownload size={36} />} filtered={filtered || search !== ''} />
        ) : (
          <DownloadTable
            items={visibleItems}
            sort={sort}
            onSortChange={setSort}
            onContextMenu={setContextMenu}
          />
        )}

        <SectionBar
          tools={
            <Tooltip label="Filter">
              <ActionIcon
                size="xs"
                variant={isFilterActive({ State: stateFilter }) ? 'filled' : 'subtle'}
                onClick={() => setFilterOpen(true)}
                aria-label="Filter"
              >
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          }
          status={
            <>
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
              <Text size="xs" c="dimmed">
                {visibleItems.length}/{allItems.length}
              </Text>
            </>
          }
        />

        <FilterSurface
          opened={filterOpen}
          onClose={() => setFilterOpen(false)}
          search={{ value: search, onChange: setSearch, placeholder: 'Search torrents' }}
          dimensions={[
            {
              label: 'State',
              options: ALL_STATES.map((state) => ({
                value: state,
                label: state,
                color: stateColorMap[state],
              })),
            },
          ]}
          selection={{ State: stateFilter }}
          onChange={(next) => setStateFilter(next.State)}
        />

        {contextMenu && <DownloadContextMenu contextMenu={contextMenu} onClose={closeContextMenu} />}
      </Stack>
    </Card>
  );
}
