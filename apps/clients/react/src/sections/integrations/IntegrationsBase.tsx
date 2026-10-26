/**
 * Section: Integrations (panel de integraciones configuradas)
 *
 * Public entry of the folder (convention C1): MainBody imports only this file.
 *
 * The server already exposes integrations.list/get/upsert/delete
 * (`apps/server/src/routers/integrations.ts:12-57`); the data shape is
 * `integrationOutputSchema` (`packages/contracts/src/integrations.ts:82-91`).
 * Today the UI EMULATES the write path with local state so the section stops
 * lying: every field the contract has is editable, every button does
 * something real, and no disabled button claims a reason that is false.
 *
 * Security rule: credentials (apiKey/username/password) are NEVER rendered —
 * only their presence ("API key set" / "Credentials set").
 */
import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Menu,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconFilter,
  IconPlugX,
} from '@tabler/icons-react';
import { integrationDefs } from '@dashboard/definitions';

import type { IntegrationOutput } from '../../mock/integrations.mock';
import { assertIntegrationsMockValid } from '../../mock/integrations.mock';

import { IntegrationCard } from './IntegrationCard';
import { useIntegrationsState } from './useIntegrationsState';

interface IntegrationsBaseProps {
  integrations: IntegrationOutput[];
}

export function IntegrationsBase({ integrations }: IntegrationsBaseProps) {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) assertIntegrationsMockValid();
  const { rows, upsert, remove } = useIntegrationsState(integrations);

  const [kindFilter, setKindFilter] = useState<IntegrationOutput['kind'] | null>(null);
  const kinds = [...new Set(rows.map((i) => i.kind))].sort();
  const visible = kindFilter ? rows.filter((i) => i.kind === kindFilter) : rows;

  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <IconPlugX size={18} color="var(--mantine-color-dimmed)" />
          <Text fw={600}>Integrations</Text>
          <Badge size="xs" variant="light" color="gray">
            {visible.length}
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
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onSave={upsert}
              onDelete={remove}
            />
          ))}
        </SimpleGrid>
      )}
    </Card>
  );
}