import { Box, Card, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { IconPhoto } from '@tabler/icons-react';

import type { MediaReleaseEvent } from '@dashboard/contracts';
import { integrationDefs } from '@dashboard/definitions';

import { EmptyState } from '../../components/EmptyState';
import { MediaReleaseItem } from './MediaReleaseItem';
import { statusDotColor } from './media-releases-colors';
import type { MediaReleasesGroupProps, MediaReleaseSourceProps } from './types';

interface MediaReleasesBaseProps {
  /** One entry per media-releases integration, exactly as `mediaReleases.getLatest` returns it. */
  groups: MediaReleasesGroupProps[];
}

/**
 * Section interactiva (D4.3): sin encabezado, sin filtro, sin gestión. Se entra a mirar,
 * y el único cromo que queda es la fila de Releases. Sin barra: el cuerpo (posters)
 * ya dice todo; no hay estado agregado que el cuerpo no muestre (R-resumen · 1).
 */
export function MediaReleasesBase({ groups }: MediaReleasesBaseProps) {
  const [imgDisplay] = useState<keyof MediaReleaseEvent['imageUrls']>('backdrop');
  const [showDescriptionTooltip] = useState(true);
  const [showType] = useState(true);
  const [showSource] = useState(true);

  const releases = groups.flatMap((group) => group.releases);

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        {releases.length === 0 ? (
          <EmptyState icon={<IconPhoto size={36} />} filtered={false} />
        ) : (
          groups.map((group) => {
            const def = integrationDefs[group.integration.kind];
            const source: MediaReleaseSourceProps = {
              iconUrl: def.iconUrl,
              name: def.name,
            };
            return (
              <Stack key={group.integration.id} gap={4}>
                <Group gap={6}>
                  <Box
                    w={8}
                    h={8}
                    style={{
                      backgroundColor: statusDotColor(group.status),
                      borderRadius: 999,
                    }}
                  />
                  <Text size="xs" c="dimmed">
                    {def.name}
                  </Text>
                </Group>
                {group.releases.map((release) => (
                  <MediaReleaseItem
                    key={`${group.integration.id}-${release.id}`}
                    release={release}
                    source={source}
                    imgDisplay={imgDisplay}
                    showDescriptionTooltip={showDescriptionTooltip}
                    showType={showType}
                    showSource={showSource}
                  />
                ))}
              </Stack>
            );
          })
        )}
      </Stack>
    </Card>
  );
}
