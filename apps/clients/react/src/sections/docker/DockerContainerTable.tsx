import type { CSSProperties, MouseEvent } from 'react';

import { DataTable, type DataTableColumn, type DataTableSort } from '../../components/DataTable';
import { TABLE_MIN_WIDTH } from '../../constants/table';
import { DockerContainerRow } from './DockerContainerRow';
import type { DockerContainerEntry } from './types';

/** Mismo criterio que Downloads: el orden vive en el header, nunca en la superficie de filtro. */
export type DockerSortKey = 'created' | 'image' | 'name' | 'state' | 'status';

export type DockerSort = DataTableSort<DockerSortKey>;

const COLUMNS: DataTableColumn<DockerSortKey>[] = [
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
  /** Pass through to the DataTable scroll container. */
  style?: CSSProperties;
}

export function DockerContainerTable({
  containers,
  sort,
  onSortChange,
  onContextMenu,
  style,
}: DockerContainerTableProps) {
  return (
    <DataTable columns={COLUMNS} sort={sort} onSortChange={onSortChange} minWidth={TABLE_MIN_WIDTH.docker} style={style}>
      {containers.map((container) => (
        <DockerContainerRow
          key={container.Id}
          container={container}
          onContextMenu={onContextMenu}
        />
      ))}
    </DataTable>
  );
}
