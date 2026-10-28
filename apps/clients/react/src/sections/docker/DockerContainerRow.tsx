import type { MouseEvent } from 'react';
import { Avatar, Badge, Divider, Group, Stack, Table, Text, Tooltip } from '@mantine/core';

import { containerStateColorMap, containerStateLabel, rowBgAlpha } from './docker-colors';
import { formatTimeAgo, getContainerIcon } from './docker-format';
import type { DockerContainerEntry } from './types';

interface DockerContainerRowProps {
  container: DockerContainerEntry;
  /** Opens the context menu at the pointer; the Base owns that state. */
  onContextMenu: (event: MouseEvent, container: DockerContainerEntry) => void;
}

export function DockerContainerRow({ container, onContextMenu }: DockerContainerRowProps) {
  const name = container.Names[0] || container.Id;
  const stateLabel = containerStateLabel[container.State] || container.State;
  const stateColor = containerStateColorMap[container.State] || 'gray';

  return (
    <Table.Tr
      style={{
        backgroundColor: rowBgAlpha[container.State],
        cursor: 'context-menu',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, container);
      }}
    >
      <Table.Td>
        <Tooltip
          label={
            <Stack gap={2}>
              <Text size="xs" fw={600}>
                {name}
              </Text>
              <Divider my={2} />
              <Group gap={4} justify="space-between">
                <Text size="xs" c="dimmed">
                  Image
                </Text>
                <Text size="xs" fw={500}>
                  {container.Image}
                </Text>
              </Group>
              <Group gap={4} justify="space-between">
                <Text size="xs" c="dimmed">
                  State
                </Text>
                <Text size="xs" fw={500}>
                  {stateLabel}
                </Text>
              </Group>
              <Group gap={4} justify="space-between">
                <Text size="xs" c="dimmed">
                  Status
                </Text>
                <Text size="xs" fw={500}>
                  {container.Status}
                </Text>
              </Group>
            </Stack>
          }
          multiline
          w={300}
          withArrow
          position="bottom-start"
          openDelay={400}
          color="dark"
        >
          <Group gap={6} wrap="nowrap" style={{ overflow: 'hidden' }}>
            <Avatar variant="outline" radius="sm" size={20} styles={{ image: { objectFit: 'contain' } }}>
              {getContainerIcon(container.Image)}
            </Avatar>
            <Text size="sm" truncate fw={500}>
              {name}
            </Text>
          </Group>
        </Tooltip>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" variant="light" color={stateColor}>
          {stateLabel}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Tooltip label={container.serverName} withArrow>
          <Text size="xs" truncate maw={150}>
            {container.serverName}
          </Text>
        </Tooltip>
      </Table.Td>

      <Table.Td>
        <Tooltip label={container.Image} multiline maw={200} withArrow>
          <Text size="xs" truncate maw={150}>
            {container.Image}
          </Text>
        </Tooltip>
      </Table.Td>

      <Table.Td>
        <Text size="xs">{formatTimeAgo(container.Created)}</Text>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" variant="light" color={stateColor}>
          {stateLabel}
        </Badge>
      </Table.Td>
    </Table.Tr>
  );
}
