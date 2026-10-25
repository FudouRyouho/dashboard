/**
 * Section: Integrations (gestión de integraciones configuradas)
 *
 * DONDE MIRAR:
 * - Homarr: references/homarr/apps/nextjs/src/app/[locale]/manage/integrations/page.tsx
 *   (allí es accordion admin; acá es widget-grid, ver decisión de diseño en el Log)
 * - API (futura): integrations.list / upsert / test (contracts: integrationOutputSchema)
 * - Mock: src/mock/integrations.mock.ts
 *
 * Security rule: credentials (apiKey/username/password) are NEVER rendered —
 * only their presence ("API key set" / "Credentials set").
 * Edit/Delete open a modal and are disabled until the server has a write API.
 */
import { useState } from 'react';
import {
  ActionIcon,
  ActionIconGroup,
  Avatar,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Menu,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCheck,
  IconExternalLink,
  IconFilter,
  IconLink,
  IconPencil,
  IconPlugX,
  IconTrash,
} from '@tabler/icons-react';
import { integrationDefs } from '@dashboard/definitions';

import type { IntegrationConfigMock, IntegrationStatus } from '../../mock/integrations.mock';

interface IntegrationsSectionProps {
  integrations: IntegrationConfigMock[];
}

const statusMeta: Record<IntegrationStatus, { color: string; label: string }> = {
  connected: { color: 'green', label: 'Connected' },
  offline: { color: 'red', label: 'Offline' },
  unknown: { color: 'gray', label: 'Not tested' },
};

function ConnectionBadge({ status }: { status: IntegrationStatus }) {
  const meta = statusMeta[status];
  return (
    <Tooltip label={status === 'unknown' ? 'Connection never tested' : undefined} withArrow>
      <Badge size="xs" variant="dot" color={meta.color} style={{ textTransform: 'none' }}>
        {meta.label}
      </Badge>
    </Tooltip>
  );
}

function IntegrationCard({ integration }: { integration: IntegrationConfigMock }) {
  const def = integrationDefs[integration.kind];
  const [editOpen, setEditOpen] = useState(false);
  const url = integration.port ? `${integration.url}:${integration.port}` : integration.url;
  const hasApiKey = Boolean(integration.apiKey);
  const hasUserPass = Boolean(integration.username || integration.password);

  return (
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
              <ConnectionBadge status={integration.status} />
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

        <Modal opened={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${def.name}`} centered>
          <Stack gap="md">
            <TextInput label="Name" value={integration.name} readOnly disabled description="Editing requires the write API." />
            <TextInput label="URL" value={integration.url} readOnly disabled />
            <TextInput
              label="Port"
              value={integration.port !== undefined ? String(integration.port) : ''}
              readOnly
              disabled
            />
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={600}>
                Secrets
              </Text>
              <Group gap="xs">
                <Badge size="xs" variant="light" color={hasApiKey ? 'blue' : 'gray'} leftSection={<IconCheck size={11} />}>
                  {hasApiKey ? 'API key set' : 'No API key'}
                </Badge>
                {hasUserPass && (
                  <Badge size="xs" variant="light" color="blue">
                    Credentials set
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                Secret values are never shown once saved.
              </Text>
            </Stack>
            <Group justify="space-between" mt="xs">
              <Button size="xs" variant="subtle" color="red" leftSection={<IconTrash size={14} />} disabled>
                Delete
              </Button>
              <Button size="xs" disabled>
                Save changes
              </Button>
            </Group>
          </Stack>
        </Modal>
    </Card>
  );
}

export function IntegrationsSection({ integrations }: IntegrationsSectionProps) {
  const [kindFilter, setKindFilter] = useState<IntegrationConfigMock['kind'] | null>(null);
  const kinds = [...new Set(integrations.map((i) => i.kind))].sort();
  const visible = kindFilter ? integrations.filter((i) => i.kind === kindFilter) : integrations;
  const connectedCount = visible.filter((i) => i.status === 'connected').length;

  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <IconPlugX size={18} color="var(--mantine-color-dimmed)" />
          <Text fw={600}>Integrations</Text>
          <Badge size="xs" variant="light" color="gray">
            {connectedCount}/{visible.length}
          </Badge>
        </Group>
        <Menu shadow="md" width={180} closeOnItemClick>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label="Filter by kind">
              <IconFilter size={16} stroke={1.5} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setKindFilter(null)} variant={kindFilter === null ? 'filled' : 'subtle'}>
              All kinds
            </Menu.Item>
            <Menu.Divider />
            {kinds.map((kind) => (
              <Menu.Item
                key={kind}
                onClick={() => setKindFilter(kind)}
                variant={kindFilter === kind ? 'filled' : 'subtle'}
              >
                {integrationDefs[kind].name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>

      {visible.length === 0 ? (
        <Stack align="center" gap="xs" py="xl">
          <IconPlugX size={36} color="var(--mantine-color-dimmed)" />
          <Text c="dimmed" size="sm">
            No integrations for this filter.
          </Text>
        </Stack>
      ) : (
        <SimpleGrid
          mt="md"
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing="md"
          verticalSpacing="md"
        >
          {visible.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </SimpleGrid>
      )}
    </Card>
  );
}
