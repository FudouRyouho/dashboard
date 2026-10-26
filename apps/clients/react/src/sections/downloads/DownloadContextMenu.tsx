import { Box, Menu, Portal } from '@mantine/core';
import {
  IconCopy,
  IconInfoCircle,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconTrashX,
} from '@tabler/icons-react';

import type { DownloadClientItem } from '@dashboard/contracts';

/** Row the context menu belongs to, plus the screen position it was opened at. */
export interface DownloadContextMenuTarget {
  x: number;
  y: number;
  item: DownloadClientItem;
  clientIndex: number;
}

interface DownloadContextMenuProps {
  contextMenu: DownloadContextMenuTarget;
  /** Closes the menu (state lives in the Base, next to the rows that open it). */
  onClose: () => void;
}

export function DownloadContextMenu({ contextMenu, onClose }: DownloadContextMenuProps) {
  return (
    <Portal>
      <Box
        pos="fixed"
        top={0}
        left={0}
        w="100vw"
        h="100vh"
        style={{ zIndex: 1000 }}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <Menu
          opened
          shadow="md"
          position="bottom-start"
          withinPortal={false}
          onClose={onClose}
        >
          <Menu.Target>
            <Box
              pos="fixed"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                width: 1,
                height: 1,
              }}
            />
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>
              {contextMenu.item.name.length > 40
                ? `${contextMenu.item.name.slice(0, 40)}…`
                : contextMenu.item.name}
            </Menu.Label>

            <Menu.Item
              leftSection={<IconInfoCircle size={14} />}
              onClick={() => {
                void navigator.clipboard.writeText(contextMenu.item.name).catch(() => {});
                onClose();
              }}
            >
              Copy name
            </Menu.Item>

            <Menu.Item
              leftSection={<IconCopy size={14} />}
              onClick={() => {
                void navigator.clipboard.writeText(contextMenu.item.id).catch(() => {});
                onClose();
              }}
            >
              Copy ID
            </Menu.Item>

            <Menu.Divider />

            {/* TODO: wire pause/resume/delete to downloads router mutations */}
            <Menu.Item
              leftSection={<IconPlayerPlay size={14} />}
              color="green"
              onClick={onClose}
            >
              Resume
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPlayerPause size={14} />}
              color="red"
              onClick={onClose}
            >
              Pause
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={onClose}>
              Delete torrent
            </Menu.Item>
            <Menu.Item color="red" leftSection={<IconTrashX size={14} />} onClick={onClose}>
              Delete torrent and files
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Portal>
  );
}
