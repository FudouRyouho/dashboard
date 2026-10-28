import type { ReactNode } from 'react';
import { Box, Group } from '@mantine/core';

interface SectionBarProps {
  /** Herramientas: sólo glyphos con tooltip. Sin texto, cero etiquetas. */
  tools?: ReactNode;
  /** Resumen de estado y/o actividad del sujeto. Único lugar donde va un número. */
  status?: ReactNode;
}

/**
 * Las dos zonas de una section. Sin título: el contenido ya se identifica solo.
 * `tools` arriba (glyphos), `status` abajo (texto). Es la única franja de chrome de la card.
 */
export function SectionBar({ tools, status }: SectionBarProps) {
  if (!tools && !status) return null;

  return (
    <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      {tools && (
        <Group gap={4} px={8} py={4}>
          {tools}
        </Group>
      )}
      {status && (
        <Group gap={8} px={8} py={4}>
          {status}
        </Group>
      )}
    </Box>
  );
}
