import type { CSSProperties, ReactNode } from 'react';
import { Group, Table } from '@mantine/core';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

/**
 * Column config for a DataTable. `key: null` marks a non-sortable column (e.g. Host).
 */
export interface DataTableColumn<TSortKey extends string> {
  key: TSortKey | null;
  label: string;
  w?: number;
}

export interface DataTableSort<TSortKey extends string> {
  /** Active sort key. Never null — a non-sortable column is marked by `column.key === null` in the header, not by the sort state. */
  key: TSortKey;
  dir: 'asc' | 'desc';
}

interface DataTableProps<TSortKey extends string> {
  columns: DataTableColumn<TSortKey>[];
  sort: DataTableSort<TSortKey>;
  onSortChange: (sort: DataTableSort<TSortKey>) => void;
  /** Already-keyed row elements (each renders its own Table.Tr). */
  children: ReactNode;
  /** Optional horizontal floor. Downloads needs it (7 columns); Docker does not. */
  minWidth?: number;
  /** Pass through to the scroll container — the section owns the growth. */
  style?: CSSProperties;
}

/**
 * Shared table shell: sortable header + body. Rows are children so each
 * table keeps its own row component and context-menu contract.
 *
 * Downloads and Docker duplicated this header + toggle logic; this is the
 * single source. The scroll lives here, not in the section: one container
 * with both axes, thead sticky to the top of this container (Mantine
 * `stickyHeader`), so the header rides horizontal scroll but stays pinned
 * while the body scrolls vertically. SectionBar and EmptyState live
 * outside this container — they never scroll with the rows.
 */
export function DataTable<TSortKey extends string>({
  columns,
  sort,
  onSortChange,
  children,
  minWidth,
  style,
}: DataTableProps<TSortKey>) {
  const toggle = (key: TSortKey) =>
    onSortChange(
      sort.key === key
        ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        minHeight: 0,
        ...(minWidth ? { minWidth } : {}),
        ...style,
      }}
    >
      <Table stickyHeader highlightOnHover verticalSpacing="xs" layout="fixed">
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => {
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
                      (sort.dir === 'asc' ? (
                        <IconArrowUp size={11} />
                      ) : (
                        <IconArrowDown size={11} />
                      ))}
                  </Group>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{children}</Table.Tbody>
      </Table>
    </div>
  );
}