import { Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** El glyph de la section. Sin isotipo no hay identidad que sostenga el vacío. */
  icon: ReactNode;
  /**
   * Un filtro activo cambia el mensaje: sin filtro el sujeto no tiene datos;
   * con filtro los datos existen pero la vista los excluye. Son frases distintas.
   */
  filtered: boolean;
}

export function EmptyState({ icon, filtered }: EmptyStateProps) {
  return (
    <Stack align="center" gap="xs" py="xl">
      <Group gap={6} c="dimmed">
        {icon}
      </Group>
      <Text c="dimmed" size="sm">
        {filtered ? 'No results with the active filters' : 'No data'}
      </Text>
    </Stack>
  );
}
