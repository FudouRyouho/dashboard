import type { MouseEvent } from 'react';
import { Table } from '@mantine/core';

import { DockerContainerRow } from './DockerContainerRow';
import type { DockerContainerEntry } from './types';

interface DockerContainerTableProps {
  containers: DockerContainerEntry[];
  /** Row-level interaction: the Base keeps the menu state. */
  onContextMenu: (event: MouseEvent, container: DockerContainerEntry) => void;
}

export function DockerContainerTable({ containers, onContextMenu }: DockerContainerTableProps) {
  return (
    <Table highlightOnHover verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th w={100}>State</Table.Th>
          <Table.Th w={120}>Host</Table.Th>
          <Table.Th w={100}>Image</Table.Th>
          <Table.Th w={100}>Created</Table.Th>
          <Table.Th w={80}>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {containers.map((container) => (
          <DockerContainerRow key={container.Id} container={container} onContextMenu={onContextMenu} />
        ))}
      </Table.Tbody>
    </Table>
  );
}
