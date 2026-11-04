import { Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** El glyph de la section. Sin isotipo no hay identidad que sostenga el vacío. */
  icon: ReactNode;
  /**
   * Un filtro activo cambia el mensaje: sin filtro el sujeto no tiene datos;
   * con filtro los datos existen pero la vista los excluye. Son frases distintas.
   */
  filtered?: boolean;
  /**
   * Optional error state — shows a distinct "failed to load" message with the
   * reason from the contract (ResultStatus.attempt.reason).
   */
  error?: { message: string; reason?: string } | null;
}

export function EmptyState({ icon, filtered = false, error }: EmptyStateProps) {
  const isError = error != null;
  const message = error
    ? `Failed to load: ${error.reason ?? error.message}`
    : filtered
      ? 'No results with the active filters'
      : 'No data';

  return (
    <Stack align="center" gap="xs" py="xl">
      <Group gap={6} c={isError ? 'red' : 'dimmed'}>
        {icon}
      </Group>
      <Text c={isError ? 'red' : 'dimmed'} size="sm">
        {message}
      </Text>
    </Stack>
  );
}
