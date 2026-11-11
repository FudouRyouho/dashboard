import { ScrollArea, Stack } from '@mantine/core';
import { useState } from 'react';
import { IconPhoto } from '@tabler/icons-react';

import type { MediaReleaseEvent, MediaReleasesResult } from '@dashboard/contracts';
import { integrationDefs } from '@dashboard/definitions';

import { EmptyState } from '../../components/EmptyState';
import { MediaReleaseItem } from './MediaReleaseItem';
import type { MediaReleaseSourceProps } from './types';

interface MediaReleasesBaseProps {
  groups: MediaReleasesResult[];
  error?: { message: string; reason?: string } | null;
}

export function MediaReleasesBase({ groups }: MediaReleasesBaseProps) {
  const [imgDisplay] = useState<keyof MediaReleaseEvent['imageUrls']>('backdrop');
  const [showDescriptionTooltip] = useState(true);
  const [showType] = useState(true);
  const [showSource] = useState(true);

  const releases = groups.flatMap((group) => group.releases);

  const failedAttempt = groups.find(
    (g): g is typeof g & { status: { attempt: { outcome: 'failure'; reason: string } } } =>
      g.status?.attempt?.outcome === 'failure',
  );

  return (
    <ScrollArea h="100%" type="auto" style={{ minHeight: 0 }}>
      <Stack gap="sm" style={{ minHeight: 0 }}>
        {releases.length === 0 ? (
          <EmptyState
            icon={<IconPhoto size={36} />}
            filtered={false}
            error={failedAttempt
              ? { message: failedAttempt.status.attempt.reason, reason: failedAttempt.status.attempt.reason }
              : null
            }
          />
        ) : (
          groups.map((group) => {
            const def = integrationDefs[group.integration.kind];
            const source: MediaReleaseSourceProps = {
              iconUrl: def.iconUrl,
              name: def.name,
            };
            return (
              <Stack key={group.integration.id} gap={4}>
                {group.releases.map((release: MediaReleaseEvent) => (
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
    </ScrollArea>
  );
}