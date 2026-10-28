import type { MouseEvent } from 'react';
import { Group, Table } from '@mantine/core';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

import { DockerContainerRow } from './DockerContainerRow';
import type { DockerContainerEntry } from './types';

/** Mismo criterio que Downloads: el orden vive en el header, nunca en la superficie de filtro. */
export type DockerSortKey = 'created' | 'image' | 'name' | 'state' | 'status';

export interface DockerSort {
  key: DockerSortKey;
  dir: 'asc' | 'desc';
}

interface Column {
  key: DockerSortKey | null;
  label: string;
  w?: number;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'state', label: 'State', w: 100 },
  { key: null, label: 'Host', w: 120 },
  { key: 'image', label: 'Image' },
  { key: 'created', label: 'Created', w: 100 },
  { key: 'status', label: 'Status', w: 140 },
];

interface DockerContainerTableProps {
  containers: DockerContainerEntry[];
  sort: DockerSort;
  onSortChange: (sort: DockerSort) => void;
  /** Row-level interaction: the Base keeps the menu state. */
  onContextMenu: (event: MouseEvent, container: DockerContainerEntry) => void;
}

export function DockerContainerTable({
  containers,
  sort,
  onSortChange,
  onContextMenu,
}: DockerContainerTableProps) {
  const toggle = (key: DockerSortKey) =>
    onSortChange(
      sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );

  return (
    <Table highlightOnHover verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          {COLUMNS.map((column) => {
            // Hoisted so the closure keeps the narrowed type instead of widening to null.
            const key = column.key;
            const active = key !== null && sort.key === key;
            return (
              <Table.Th
                key={column.label}
                w={column.w}
                onClick={key ? () => toggle(key) : undefined}
                style={{ cursor: key ? 'pointer' : undefined, userSelect: 'none' }}
              >
                <Group gap={3} wrap="nowrap">
                  {column.label}
                  {active &&
                    (sort.dir === 'asc' ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />)}
                </Group>
              </Table.Th>
            );
          })}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {containers.map((container) => (
          <DockerContainerRow
            key={container.Id}
            container={container}
            onContextMenu={onContextMenu}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
}
