/**
 * Section: Media Releases (estrenos / lanzamientos recientes)
 *
 * DONDE MIRAR:
 * - Guía de referencia: .working/homarr-research/ui-components-guide.md §1
 * - Homarr: references/homarr/packages/widgets/src/media-releases/component.tsx
 *
 * API (futura): mediaReleases.getLatest -> MediaReleaseEvent[] (ya tipada en contracts)
 * Mock: src/mock/media-releases.mock.ts
 */
import { Avatar, Badge, Box, Card, Group, Image, Stack, Text, TooltipFloating, UnstyledButton } from '@mantine/core';
import type { MediaReleaseEvent } from '@dashboard/contracts';
import { mediaTypeColor } from '@dashboard/definitions';
import { useState } from 'react';
import { IconCalendar, IconClock, IconStarFilled } from '@tabler/icons-react';
import { getMantineColor } from '../../theme';
import { OverflowBadge } from './overflow-badge';

interface MediaReleasesBaseProps {
  releases: MediaReleaseEvent[];
}

interface IconAndLabelProps {
  icon?: (props: { size: number; color?: string }) => React.ReactNode;
  label: string;
}

const Info = ({ icon: Icon, label }: IconAndLabelProps) => {
  return (
    <Group gap={4}>
      {Icon && <Icon size={12} color={getMantineColor("gray", 5)} />}
      <Text size="xs" c="gray.5">
        {label}
      </Text>
    </Group>
  );
};

/**
 * Formats a release date. es-AR hardcoded for now.
 * DEUDA: sin i18n en el cliente; si se agrega, tomar el locale de ahi.
 */
const formatReleaseDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const InfoDivider = () => (
  <Text size="xs" c="dimmed">
    •
  </Text>
);


export function MediaReleasesBase({ releases }: MediaReleasesBaseProps) {
  const [imgDisplay] =
    useState<keyof MediaReleaseEvent['imageUrls']>('backdrop');
  const [showDescriptionTooltip] = useState(true);
  const [showType] = useState(true);
  const [showSource] = useState(true);

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Text fw={600}>Media Releases</Text>
        {releases.map((release) => (
          <TooltipFloating
            key={release.id}
            label={release.description}
            w={300}
            multiline
            disabled={release.description === undefined || !showDescriptionTooltip}
          >
            <UnstyledButton
              component="a"
              href={release.href}
              target="_blank"
              rel="noopener noreferrer"
              pos="relative"
              p={imgDisplay === "poster" ? 0 : 4}
            >
              {imgDisplay === "backdrop" && (
                <Box
                  w="100%"
                  h="100%"
                  pos="absolute"
                  top={0}
                  left={0}
                  style={{
                    backgroundImage: `url(${release.imageUrls.backdrop})`,
                    borderRadius: 8,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.2,
                  }}
                />
              )}
              <Group justify="space-between" h="100%" wrap="nowrap">
                <Group align="start" wrap="nowrap" style={{ zIndex: 0 }}>
                  {imgDisplay === "poster" && <Image w={60} src={release.imageUrls.poster} alt={release.title} />}
                  <Stack gap={4}>
                    <Stack gap={0}>
                      <Text size="sm" fw="bold" lineClamp={2}>
                        {release.title}
                      </Text>
                    </Stack>
                    <Group gap={6} style={{ rowGap: 0 }}>
                      <Info icon={IconCalendar} label={formatReleaseDate(release.releaseDate)} />
                      {release.type === "movie" && release.runtimeMs !== null && (
                        <>
                          <InfoDivider />
                          <Info
                            icon={IconClock}
                            label={`~${Math.round(release.runtimeMs / 60_000)} min`}
                          />
                        </>
                      )}
                      {(release.type === "movie" || release.type === "series") && release.studio != null && (
                        <>
                          <InfoDivider />
                          <Info label={release.studio} />
                        </>
                      )}
                      {(release.type === "movie" || release.type === "series") && release.rating != null && (
                        <>
                          <InfoDivider />
                          <Info icon={IconStarFilled} label={String(release.rating)} />
                        </>
                      )}
                    </Group>
                    {release.genres.length > 0 && (
                      <OverflowBadge
                        size="xs"
                        groupGap={4}
                        data={release.genres}
                        overflowCount={3}
                        disablePopover
                        style={{ cursor: "pointer" }}
                      />
                    )}
                  </Stack>
                </Group>
                {(true) && (
                  <Stack justify="space-between" align="end" h="100%" style={{ zIndex: 0 }}>
                    {showType && (
                    <Badge
                      w="max-content"
                      size="xs"
                      color={mediaTypeColor(release.type)}
                      style={{ cursor: 'pointer' }}
                    >
                      {release.type}
                    </Badge>
                  )}
                  {showSource && (
                    <Avatar
                      size="sm"
                      radius="xl"
                      src="/icons/jellyfin.svg"
                      alt="Jellyfin"
                    />
                  )}
                  </Stack>
                )}
              </Group>
            </UnstyledButton>
          </TooltipFloating>
        ))}
      </Stack>
    </Card>
  );
}