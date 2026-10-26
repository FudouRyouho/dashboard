import { Table } from '@mantine/core';

import type { DownloadClientItem } from '@dashboard/contracts';

import { TorrentRow, type DownloadsTableRow } from './TorrentRow';

interface DownloadTableProps {
  /** Filtered torrents, each carrying the client it belongs to. */
  items: DownloadsTableRow[];
  /** Opens the row context menu at the pointer position. */
  onContextMenu: (target: {
    x: number;
    y: number;
    item: DownloadClientItem;
    clientIndex: number;
  }) => void;
}

export function DownloadTable({ items, onContextMenu }: DownloadTableProps) {
  return (
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
        {items.map((item) => (
          <TorrentRow key={item.id} item={item} onContextMenu={onContextMenu} />
        ))}
      </Table.Tbody>
    </Table>
  );
}
