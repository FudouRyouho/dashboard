import { Box, Menu, Portal } from '@mantine/core';
import {
  IconCategoryPlus,
  IconFileText,
  IconPlayerPlay,
  IconPlayerStop,
  IconRotateClockwise,
  IconTrash,
} from '@tabler/icons-react';

import type { DockerContainerEntry } from './types';

interface DockerContainerContextMenuProps {
  /** Where the right-click happened, plus what was clicked; null keeps the menu closed. */
  contextMenu: { x: number; y: number; container: DockerContainerEntry } | null;
  /** Called on every close path: backdrop click, second right-click, or menu item. */
  onClose: () => void;
}

export function DockerContainerContextMenu({
  contextMenu,
  onClose,
}: DockerContainerContextMenuProps) {
  if (contextMenu === null) return null;

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
        <Menu opened shadow="md" position="bottom-start" withinPortal={false} onClose={onClose}>
          <Menu.Target>
            <Box pos="fixed" style={{ left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>
              {contextMenu.container.names[0] || contextMenu.container.id}
            </Menu.Label>

            <Menu.Item leftSection={<IconFileText size={14} />} onClick={onClose}>
              Logs
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item leftSection={<IconPlayerPlay size={14} />} color="green" onClick={onClose}>
              Start
            </Menu.Item>
            <Menu.Item leftSection={<IconPlayerStop size={14} />} color="red" onClick={onClose}>
              Stop
            </Menu.Item>
            <Menu.Item
              leftSection={<IconRotateClockwise size={14} />}
              color="orange"
              onClick={onClose}
            >
              Restart
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={onClose}>
              Remove
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item leftSection={<IconCategoryPlus size={14} />} onClick={onClose}>
              Add to Dashboard
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Portal>
  );
}
