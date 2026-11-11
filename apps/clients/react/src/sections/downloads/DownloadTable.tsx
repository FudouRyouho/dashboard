import type { CSSProperties } from 'react';
import type { DownloadClientItem } from '@dashboard/contracts';

import { DataTable, type DataTableColumn, type DataTableSort } from '../../components/DataTable';
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

export type DownloadsSort = DataTableSort<DownloadsSortKey>;

const COLUMNS: DataTableColumn<DownloadsSortKey>[] = [
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
  /** Pass through to the DataTable scroll container. */
  style?: CSSProperties;
  /** Opens the row context menu at the pointer position. */
  onContextMenu: (target: {
    x: number;
    y: number;
    item: DownloadClientItem;
    clientIndex: number;
  }) => void;
}

export function DownloadTable({ items, sort, onSortChange, onContextMenu, style }: DownloadTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      sort={sort}
      onSortChange={onSortChange}
      minWidth={600}
      style={style}
    >
      {items.map((item) => (
        <TorrentRow key={item.id} item={item} onContextMenu={onContextMenu} />
      ))}
    </DataTable>
  );
}
