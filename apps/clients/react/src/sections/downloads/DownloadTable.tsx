import { Group, Table } from '@mantine/core';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

import type { DownloadClientItem } from '@dashboard/contracts';

import { TorrentRow, type DownloadsTableRow } from './TorrentRow';

/**
 * Column order lives in the header, never in the filter surface: ordering exists to see the
 * result immediately, and the surface is blocking. The header is the one sanctioned exception
 * to "no text", and it does exactly one job (order) — the filter shows on its glyph.
 */
export type DownloadsSortKey =
  | 'downSpeed'
  | 'name'
  | 'progress'
  | 'size'
  | 'state'
  | 'time'
  | 'upSpeed';

export interface DownloadsSort {
  key: DownloadsSortKey;
  dir: 'asc' | 'desc';
}

interface Column {
  key: DownloadsSortKey | null;
  label: string;
  w?: number;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'progress', label: 'Progress', w: 120 },
  { key: 'size', label: 'Size', w: 80 },
  { key: 'downSpeed', label: 'Down', w: 90 },
  { key: 'upSpeed', label: 'Up', w: 90 },
  { key: 'time', label: 'ETA', w: 80 },
  { key: 'state', label: 'State', w: 90 },
];

interface DownloadTableProps {
  /** Filtered and sorted torrents, each carrying the client it belongs to. */
  items: DownloadsTableRow[];
  sort: DownloadsSort;
  onSortChange: (sort: DownloadsSort) => void;
  /** Opens the row context menu at the pointer position. */
  onContextMenu: (target: {
    x: number;
    y: number;
    item: DownloadClientItem;
    clientIndex: number;
  }) => void;
}

export function DownloadTable({ items, sort, onSortChange, onContextMenu }: DownloadTableProps) {
  const toggle = (key: DownloadsSortKey) =>
    onSortChange(
      sort.key === key
        ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );

  return (
    <Table highlightOnHover verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          {COLUMNS.map((column) => {
            const active = column.key !== null && sort.key === column.key;
            return (
              <Table.Th
                key={column.label}
                w={column.w}
                onClick={column.key ? () => toggle(column.key as DownloadsSortKey) : undefined}
                style={{ cursor: column.key ? 'pointer' : undefined, userSelect: 'none' }}
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
        {items.map((item) => (
          <TorrentRow key={item.id} item={item} onContextMenu={onContextMenu} />
        ))}
      </Table.Tbody>
    </Table>
  );
}
