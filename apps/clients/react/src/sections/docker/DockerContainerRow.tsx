import type { MouseEvent } from 'react';
import { Avatar, Badge, Group, Table, Text, Tooltip } from '@mantine/core';

import { containerStateColorMap, containerStateLabel, rowBgAlpha } from './docker-colors';
import { formatTimeAgo, getContainerIcon } from './docker-format';
import type { DockerContainerEntry } from './types';

interface DockerContainerRowProps {
  container: DockerContainerEntry;
  /** Opens the context menu at the pointer; the Base owns that state. */
  onContextMenu: (event: MouseEvent, container: DockerContainerEntry) => void;
}

/**
 * Una columna, un dato: State muestra el estado, Status el status legible de Docker
 * ("Up 3 days"). Antes ambas mostraban el estado. El tooltip muestra sólo lo que las
 * columnas no pueden (image y nombre completos), no repite lo visible.
 */
export function DockerContainerRow({ container, onContextMenu }: DockerContainerRowProps) {
  const name = container.Names[0]?.replace(/^\//, '') || container.Id.slice(0, 12);
  const stateLabel = containerStateLabel[container.State] ?? container.State;
  const stateColor = containerStateColorMap[container.State] ?? 'gray';
  const image = container.Image.split('/')[2] ?? container.Image;

  return (
    <Table.Tr
      style={{
        backgroundColor: rowBgAlpha[container.State],
        cursor: 'context-menu',
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event, container);
      }}
    >
      <Table.Td>
        <Group gap={6} wrap="nowrap" style={{ overflow: 'hidden' }}>
          <Avatar
            variant="outline"
            radius="sm"
            size={20}
            styles={{ image: { objectFit: 'contain' } }}
          >
            {getContainerIcon(container.Image)}
          </Avatar>
          <Tooltip label={container.Names.join(', ')} withArrow>
            <Text size="sm" truncate fw={500}>
              {name}
            </Text>
          </Tooltip>
        </Group>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" variant="light" color={stateColor}>
          {stateLabel}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text size="xs" truncate maw={140}>
          {container.serverName}
        </Text>
      </Table.Td>

      <Table.Td>
        <Tooltip label={container.Image} multiline w={260} withArrow>
          <Text size="xs" truncate maw={180}>
            {image}
          </Text>
        </Tooltip>
      </Table.Td>

      <Table.Td>
        <Text size="xs">{formatTimeAgo(container.Created)}</Text>
      </Table.Td>

      <Table.Td>
        <Text size="xs" c="dimmed" truncate maw={130}>
          {container.Status}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
}
