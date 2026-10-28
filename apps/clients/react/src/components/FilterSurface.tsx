import { Box, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

import type { FilterDimension, FilterSelection } from './filter-selection';

interface FilterSurfaceProps {
  opened: boolean;
  onClose: () => void;
  dimensions: FilterDimension[];
  selection: FilterSelection;
  onChange: (next: FilterSelection) => void;
  /** Búsqueda de texto libre: vive en esta misma superficie, no en un glyph aparte. */
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
}

/**
 * Superficie donde se editan los criterios de vista. Sin título: el glyph que la abre
 * ya dice qué es. Click en el valor activo lo deselecciona (volver a "todos").
 * El orden (asc/desc) NO vive acá: es click en el header de la columna.
 */
export function FilterSurface({
  opened,
  onClose,
  dimensions,
  selection,
  onChange,
  search,
}: FilterSurfaceProps) {
  const pick = (dimension: string, value: string) => {
    const next = { ...selection };
    if (next[dimension] === value) delete next[dimension];
    else next[dimension] = value;
    onChange(next);
  };

  return (
    <Modal opened={opened} onClose={onClose} size="xs" withCloseButton={false}>
      <Stack gap="md">
        {search && (
          <TextInput
            autoFocus
            value={search.value}
            onChange={(event) => search.onChange(event.currentTarget.value)}
            placeholder={search.placeholder}
            size="sm"
          />
        )}

        {dimensions.map((dimension) => (
          <Stack key={dimension.label} gap={4}>
            {dimensions.length > 1 && (
              <Text size="xs" c="dimmed" fw={600}>
                {dimension.label}
              </Text>
            )}
            <Stack gap={0}>
              {dimension.options.map((option) => {
                const active = selection[dimension.label] === option.value;
                return (
                  <Group
                    key={option.value}
                    gap={8}
                    px={8}
                    py={5}
                    onClick={() => pick(dimension.label, option.value)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 'var(--mantine-radius-default)',
                      backgroundColor: active
                        ? 'var(--mantine-color-default-hover)'
                        : undefined,
                    }}
                  >
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: option.color
                          ? `var(--mantine-color-${option.color}-filled)`
                          : 'var(--mantine-color-gray-5)',
                      }}
                    />
                    <Text size="sm">{option.label}</Text>
                  </Group>
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Modal>
  );
}
