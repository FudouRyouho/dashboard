/** Edit modal for an integration. The server's `integrations.upsert`/`delete`
 * already exist, so nothing here is disabled for a false reason: Save builds
 * an `upsertIntegrationInputSchema`-shaped payload (secrets are REQUIRED by
 * the contract for kinds that use them — same rule the real API enforces),
 * validates it, and commits the resulting row to local state. The row keeps
 * the OUTPUT shape: secrets are validated, never stored, never rendered. */
import { useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { upsertIntegrationInputSchema } from '@dashboard/contracts';
import type { SecretRequirement } from '@dashboard/contracts';

import type { IntegrationOutput } from '../../mock/integrations.mock';

interface IntegrationEditModalProps {
  opened: boolean;
  onClose: () => void;
  integration: IntegrationOutput;
  requiredSecrets: SecretRequirement[];
  onSave: (next: IntegrationOutput) => void;
  onRequestDelete: () => void;
}

export function IntegrationEditModal({
  opened,
  onClose,
  integration,
  requiredSecrets,
  onSave,
  onRequestDelete,
}: IntegrationEditModalProps) {
  const [name, setName] = useState(integration.name);
  const [url, setUrl] = useState(integration.url);
  const [port, setPort] = useState(integration.port !== null ? String(integration.port) : '');
  const [externalUrl, setExternalUrl] = useState(integration.externalUrl ?? '');
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const commit = () => {
    const payload = {
      id: integration.id,
      kind: integration.kind,
      name: name.trim(),
      url: url.trim(),
      ...(externalUrl.trim() === '' ? {} : { externalUrl: externalUrl.trim() }),
      ...(port.trim() === '' ? {} : { port: Number(port) }),
      ...secrets,
    };
    const result = upsertIntegrationInputSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '');
        errors[key] = errors[key] ?? issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSave({
      id: integration.id,
      kind: integration.kind,
      name: result.data.name,
      url: result.data.url,
      externalUrl: result.data.externalUrl ?? null,
      port: result.data.port ?? null,
      createdAt: integration.createdAt,
      updatedAt: new Date(),
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`Edit ${integration.kind}`} centered>
      <Stack gap="md">
        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors.name} />
        <TextInput label="URL" value={url} onChange={(e) => setUrl(e.target.value)} error={fieldErrors.url} />
        <TextInput
          label="Port"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="optional"
          error={fieldErrors.port}
        />
        <TextInput
          label="External URL"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="optional"
          error={fieldErrors.externalUrl}
        />
        {requiredSecrets.length > 0 && (
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={600}>
              Secrets
            </Text>
            {requiredSecrets.map((secret) => (
              <TextInput
                key={secret.kind}
                label={secret.kind}
                value={secrets[secret.kind] ?? ''}
                onChange={(e) => setSecrets((s) => ({ ...s, [secret.kind]: e.target.value }))}
                placeholder="required to save"
                type={secret.kind === 'password' ? 'password' : 'text'}
                error={fieldErrors[secret.kind]}
              />
            ))}
            <Text size="xs" c="dimmed">
              Secret values are validated but never stored or displayed back.
            </Text>
          </Stack>
        )}
        <Group justify="space-between" mt="xs">
          <Button
            size="xs"
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={onRequestDelete}
          >
            Delete
          </Button>
          <Button size="xs" onClick={commit}>
            Save changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}