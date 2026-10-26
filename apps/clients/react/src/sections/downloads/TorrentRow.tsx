import { Badge, Group, Progress, Table, Text } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';

import type { DownloadClientItem } from '@dashboard/contracts';
import { formatByteRate, formatBytes } from '@dashboard/core';

import {
  type DownloadState,
  progressColor,
  rowBgAlpha,
  stateColorMap,
} from './downloads-colors';
import { formatTimeRemaining } from './format';
import { TorrentNameCell } from './TorrentNameCell';

export type DownloadsTableRow = DownloadClientItem & { clientIndex: number };

interface TorrentRowProps {
  item: DownloadsTableRow;
  /** Opens the context menu at the pointer position (state lives in the Base). */
  onContextMenu: (target: {
    x: number;
    y: number;
    item: DownloadClientItem;
    clientIndex: number;
  }) => void;
}

export function TorrentRow({ item, onContextMenu }: TorrentRowProps) {
  return (
    <Table.Tr
      style={{
        backgroundColor: rowBgAlpha[item.state],
        cursor: 'context-menu',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu({
          x: e.clientX,
          y: e.clientY,
          item,
          clientIndex: item.clientIndex,
        });
      }}
    >
      <Table.Td>
        <TorrentNameCell
          name={item.name}
          state={item.state}
          size={item.size}
          progress={item.progress}
          category={item.category}
        />
      </Table.Td>

      <Table.Td>
        <ProgressCell state={item.state} progress={item.progress} />
      </Table.Td>

      <Table.Td>
        <Text size="sm">{formatBytes(item.size)}</Text>
      </Table.Td>

      <Table.Td>
        <SpeedCell speed={item.downSpeed} direction="down" />
      </Table.Td>

      <Table.Td>
        <SpeedCell speed={item.upSpeed} direction="up" />
      </Table.Td>

      <Table.Td>
        <Text size="sm">{formatTimeRemaining(item.time)}</Text>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" variant="light" color={stateColorMap[item.state]}>
          {item.state}
        </Badge>
      </Table.Td>
    </Table.Tr>
  );
}

function ProgressCell({ state, progress }: { state: DownloadState; progress: number }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="xs" fw={500} w={36} ta="right" style={{ flexShrink: 0 }}>
        {Math.floor(progress * 100)}%
      </Text>
      <Progress
        value={Math.floor(progress * 100)}
        color={progressColor(state, progress)}
        size="sm"
        style={{ flex: 1 }}
      />
    </Group>
  );
}

/** Directional rate cell; hides when the item reports no traffic that way. */
function SpeedCell({ speed, direction }: { speed: number | undefined; direction: 'down' | 'up' }) {
  if (!speed) return null;
  const isDown = direction === 'down';
  return (
    <Group gap={4} wrap="nowrap">
      {isDown ? (
        <IconDownload size={12} style={{ opacity: 0.5 }} />
      ) : (
        <IconUpload size={12} style={{ opacity: 0.5 }} />
      )}
      <Text size="sm" c={isDown ? 'blue' : 'green'}>
        {formatByteRate(speed)}
      </Text>
    </Group>
  );
}
