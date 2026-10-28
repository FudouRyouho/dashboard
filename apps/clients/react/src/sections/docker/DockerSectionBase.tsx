import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { ActionIcon, Card, Stack, Text, Tooltip } from '@mantine/core';
import { IconBrandDocker, IconFilter } from '@tabler/icons-react';

import { isFilterActive } from '../../components/filter-selection';
import { EmptyState } from '../../components/EmptyState';
import { FilterSurface } from '../../components/FilterSurface';
import { SectionBar } from '../../components/SectionBar';

import { DockerContainerContextMenu } from './DockerContainerContextMenu';
import { DockerContainerTable, type DockerSort, type DockerSortKey } from './DockerContainerTable';
import {
  containerHealthColorMap,
  CONTAINER_STATES,
  containerStateColorMap,
  containerStateLabel,
  HEALTH_STATUSES,
} from './docker-colors';
import type { DockerContainerEntry, DockerIntegrationMockData } from './types';

interface DockerSectionBaseProps {
  /** One per Docker integration (stats + container list) */
  servers: DockerIntegrationMockData[];
}

/**
 * D4.9 (provisional): nombre ascendente. El estado de los contenedores es estable, así que
 * el lente acá es "¿dónde está la cosa que busco?", no "¿qué está pasando ahora".
 */
const DEFAULT_SORT: DockerSort = { key: 'name', dir: 'asc' };

/** Claves = etiquetas de las dimensiones de abajo (State / Health / Host). */
type DockerFilters = Record<'Health' | 'Host' | 'State', string | undefined>;

const EMPTY_FILTERS: DockerFilters = { Host: undefined, Health: undefined, State: undefined };

function healthOf(container: DockerContainerEntry): string {
  return container.Health?.Status ?? 'none';
}

function value(container: DockerContainerEntry, key: DockerSortKey ): number | string {
  switch (key) {
    case 'created':
      return container.Created;
    case 'image':
      return container.Image;
    case 'name':
      return container.Names[0] ?? container.Id;
    case 'state':
      return container.State;
    case 'status':
      return container.Status;
  }
}

export function DockerSectionBase({ servers }: DockerSectionBaseProps) {
  const allContainers = useMemo<DockerContainerEntry[]>(
    () =>
      servers.flatMap((server, serverIndex) =>
        server.containersList.map((container) => ({
          ...container,
          serverIndex,
          serverName: server.integration.name,
          serverId: server.integration.id,
        })),
      ),
    [servers],
  );

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DockerFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<DockerSort>(DEFAULT_SORT);
  const [filterOpen, setFilterOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    container: DockerContainerEntry;
  } | null>(null);

  const filtered = isFilterActive(filters) || search.trim() !== '';

  const visibleContainers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = allContainers.filter(
      (container) =>
        (!filters.State || container.State === filters.State) &&
        (!filters.Health || healthOf(container) === filters.Health) &&
        (!filters.Host || container.serverId === filters.Host) &&
        (!needle ||
          container.Names.some((n) => n.toLowerCase().includes(needle)) ||
          container.Image.toLowerCase().includes(needle)),
    );
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = value(a, sort.key);
      const right = value(b, sort.key);
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
      return String(left).localeCompare(String(right)) * factor;
    });
  }, [allContainers, filters, search, sort]);

  /**
   * Señal del sujeto: corriendo/total agregado de todos los hosts. El inventario
   * (images/volumes/networks) no es señal del sujeto y ya no se muestra acá.
   */
  const { running, total } = useMemo(
    () =>
      servers.reduce(
        (acc, server) => ({
          running: acc.running + (server.stats.containers.running ?? 0),
          total: acc.total + (server.stats.containers.total ?? 0),
        }),
        { running: 0, total: 0 },
      ),
    [servers],
  );

  const openContextMenu = (event: MouseEvent, container: DockerContainerEntry) =>
    setContextMenu({ x: event.clientX, y: event.clientY, container });

  const closeContextMenu = () => setContextMenu(null);

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        {visibleContainers.length === 0 ? (
          <EmptyState icon={<IconBrandDocker size={36} />} filtered={filtered} />
        ) : (
          <DockerContainerTable
            containers={visibleContainers}
            sort={sort}
            onSortChange={setSort}
            onContextMenu={openContextMenu}
          />
        )}

        <SectionBar
          tools={
            <Tooltip label="Filter">
              <ActionIcon
                size="xs"
                variant={isFilterActive(filters) ? 'filled' : 'subtle'}
                onClick={() => setFilterOpen(true)}
                aria-label="Filter"
              >
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          }
          status={
            <Text size="xs" fw={600}>
              {running}/{total} corriendo
            </Text>
          }
        />

        <FilterSurface
          opened={filterOpen}
          onClose={() => setFilterOpen(false)}
          search={{ value: search, onChange: setSearch, placeholder: 'Search containers' }}
          dimensions={[
            {
              label: 'State',
              options: CONTAINER_STATES.map((state) => ({
                value: state,
                label: containerStateLabel[state],
                color: containerStateColorMap[state],
              })),
            },
            {
              label: 'Health',
              options: HEALTH_STATUSES.map((health) => ({
                value: health,
                label: health,
                color: containerHealthColorMap[health],
              })),
            },
            {
              label: 'Host',
              options: servers.map((server) => ({
                value: server.integration.id,
                label: server.integration.name,
              })),
            },
          ]}
          selection={filters}
          onChange={(next) => setFilters({ ...EMPTY_FILTERS, ...next })}
        />

        <DockerContainerContextMenu contextMenu={contextMenu} onClose={closeContextMenu} />
      </Stack>
    </Card>
  );
}
