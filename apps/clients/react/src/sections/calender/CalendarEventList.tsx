import { type CalendarEvent } from "@dashboard/integrations"
import { Badge, Box, Button, darken, Group, Image, lighten, ScrollArea, Stack, Text, useMantineColorScheme } from "@mantine/core"
import { IconPin } from "@tabler/icons-react"
import { iconDataUris, type IconSlug } from '@dashboard/definitions';

export function CalendarEventList({ events }: { events: CalendarEvent[] }) {
    const { colorScheme } = useMantineColorScheme();


    return (
        <ScrollArea
            offsetScrollbars
            w="100%"
            styles={{
                viewport: {
                    maxHeight: 450,
                },
            }}>
            <Stack>
                {events.map((event) => (

                    <Group key={`event-${event.id}`} align="start" wrap="nowrap">
                        {event.image !== null && (
                            <Box pos="relative">
                                <Image
                                    src={event.image.src}
                                    w={70}
                                    mah={150}
                                    style={{
                                        aspectRatio: event.image.aspectRatio
                                            ? `${event.image.aspectRatio.width} / ${event.image.aspectRatio.height}`
                                            : "1/1",
                                    }}
                                    radius="sm"
                                    fallbackSrc="https://placehold.co/400x400?text=No%20image" />
                                {event.image.badge !== undefined && (
                                    <Badge
                                        pos="absolute"
                                        bottom={-6}
                                        left="50%"
                                        w="90%"
                                        color={event.image.badge.color || "default"}
                                        styles={{ root: { transform: "translateX(-50%)" } }}
                                    >
                                        {event.image.badge.content}

                                    </Badge>
                                )}
                            </Box>
                        )}
                        <Stack style={{ flexGrow: 1 }} gap={0}>
                            <Group justify="space-between" align="start" mb="xs" wrap="nowrap">
                                <Stack gap={0}>
                                    {event.subtitle !== null && (
                                        <Text lineClamp={1} size="sm">
                                            {event.subtitle}
                                        </Text>
                                    )}
                                    <Text fw={"bold"} lineClamp={1} size="sm">
                                        {event.title}
                                    </Text>
                                </Stack>
                                {/* {event.metadata.type} */}
                            </Group>
                            {event.location !== null && (
                                <Group gap={4} mb={event.description ? 0 : "sm"}>
                                    <IconPin opacity={0.7} size={"1rem"} />
                                    <Text size={"xs"} c={"dimmed"} lineClamp={1}>
                                        {event.location}
                                    </Text>
                                </Group>
                            )}
                            {event.description !== null && (
                                <Group pos={"relative"} pb={10}>
                                    <Text size={"xs"} c={"dimmed"} lineClamp={3}>
                                        {event.description}
                                    </Text>
                                </Group>
                            )}
                            {event.links.length > 0 && (
                                <Group pt={5} gap={5} mt={"auto"} wrap="wrap">
                                    {event.links.filter((link) => link.href).map((link) => (
                                        <Button
                                            key={link.href}
                                            component={"a"}
                                            href={link.href.toString()}
                                            target={"_blank"}
                                            variant={link.color ? undefined : "default"}
                                            styles={{
                                                root: {
                                                    backgroundColor: link.color,
                                                    color: link.isDark && colorScheme === "dark" ? "white" : "black",
                                                    "&:hover": link.color
                                                        ? {
                                                            backgroundColor: link.isDark ? lighten(link.color, 0.1) : darken(link.color, 0.1),
                                                        }
                                                        : undefined,
                                                },
                                            }}
                                            leftSection={link.logo ? <Image src={iconDataUris[link.logo as IconSlug]} w={20} h={20} /> : undefined}>
                                            <Text>{link.name}</Text>
                                        </Button>
                                    ))}
                                </Group>
                            )}
                        </Stack>

                    </Group>
                ))}
            </Stack>
        </ScrollArea>
    )
}