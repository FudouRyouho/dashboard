import { useState } from 'react';
import {
  ActionIcon,
  ActionIconGroup,
  Avatar,
  Button,
  Card,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCheck,
  IconExternalLink,
  IconLink,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { integrationDefs } from '@dashboard/definitions';
import { secretRequirements } from '@dashboard/contracts';

import type { IntegrationOutput } from '../../mock/integrations.mock';

import { IntegrationEditModal } from './IntegrationEditModal';

interface IntegrationCardProps {
  integration: IntegrationOutput;
  onSave: (next: IntegrationOutput) => void;
  onDelete: (id: string) => void;
}

export function IntegrationCard({ integration, onSave, onDelete }: IntegrationCardProps) {
  const def = integrationDefs[integration.kind];
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const url = integration.port ? `${integration.url}:${integration.port}` : integration.url;

  return (
    <>
      <Card withBorder padding="md" radius="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src={def.iconUrl}
              color={def.isDark ? 'white' : 'dark'}
              styles={{ root: { backgroundColor: def.color, flexShrink: 0 } }}
              size={40}
              radius="sm"
            />
            <Stack gap={2}>
              <Text fw={600} size="sm" lineClamp={1}>
                {integration.name}
              </Text>
            </Stack>
          </Group>
          <ActionIconGroup>
            <Tooltip label="Open" withArrow>
              <ActionIcon component="a" href={url} target="_blank" rel="noreferrer" variant="subtle" color="gray">
                <IconExternalLink size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Configure" withArrow>
              <ActionIcon variant="subtle" color="gray" onClick={() => setEditOpen(true)}>
                <IconPencil size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </ActionIconGroup>
        </Group>

        <CopyButton value={url} timeout={2000}>
          {({ copied, copy }) => (
            <UnstyledButton onClick={copy} style={{ display: 'block', marginTop: 8 }}>
              <Tooltip label={copied ? 'Copied' : 'Copy URL'} withArrow position="right">
                <Group gap={6} wrap="nowrap">
                  {copied ? (
                    <IconCheck size={14} color="var(--mantine-color-green-6)" />
                  ) : (
                    <IconLink size={14} color="var(--mantine-color-dimmed)" />
                  )}
                  <Text size="xs" c={copied ? 'green' : 'dimmed'} truncate>
                    {url}
                  </Text>
                </Group>
              </Tooltip>
            </UnstyledButton>
          )}
        </CopyButton>

        {integration.externalUrl && (
          <Tooltip label="Open external URL" withArrow position="right">
            <UnstyledButton
              component="a"
              href={integration.externalUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', marginTop: 8 }}
            >
              <Group gap={6} wrap="nowrap">
                <IconExternalLink size={13} color="var(--mantine-color-blue-6)" />
                <Text size="xs" c="blue" truncate>
                  {integration.externalUrl}
                </Text>
              </Group>
            </UnstyledButton>
          </Tooltip>
        )}
      </Card>

      <IntegrationEditModal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        integration={integration}
        requiredSecrets={secretRequirements[integration.kind]}
        onSave={onSave}
        onRequestDelete={() => setDeleteConfirm(true)}
      />

      <Modal opened={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete integration" centered>
        <Stack gap="md">
          <Text size="sm">
            Delete <Text fw={600} span>{integration.name}</Text>? The removal is local only — the
            server mutation is not wired yet.
          </Text>
          <Group justify="space-between" mt="xs">
            <Button size="xs" variant="default" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => {
                onDelete(integration.id);
                setDeleteConfirm(false);
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}