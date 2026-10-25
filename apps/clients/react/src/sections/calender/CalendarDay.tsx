import { Box, Container, Flex, Popover, Text } from '@mantine/core';
import { CalendarEventList } from './CalendarEventList';
import { useDisclosure } from '@mantine/hooks';
import { type CalendarEvent } from '@dashboard/contracts';
import { mediaTypeDefs } from '@dashboard/definitions';

interface CalendarDayProps {
  date: string;
  events: CalendarEvent[];
  /** Brand color of the source integration (resolved in CalendarBase). */
  kindColor?: string;
  disabled: boolean;
}

export function CalenderDay({ date, events, kindColor, disabled }: CalendarDayProps) {
  const [opened, { toggle }] = useDisclosure(false);

  const dateObj = new Date(date + 'T00:00:00');
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  let textColor = 'gray'; // Weekday without events

  if (!isWeekend && !disabled)
    textColor = 'white'; // Weekday with events
  else if (isWeekend && !disabled)
    textColor = 'lime'; // Weekend with events
  else if (isWeekend && disabled) textColor = 'green'; // Weekend without events

  return (
    <Popover
      opened={opened}
      onChange={toggle}
      disabled={disabled}
      withArrow
      withinPortal
      transitionProps={{ transition: 'pop' }}
    >
      <Popover.Target>
        <Container
          onClick={toggle}
          style={{
            cursor: disabled ? 'default' : 'pointer',
            alignContent: 'center',
          }}
          h="100%"
          w="100%"
          p={0}
          pos="relative"
        >
          <Text ta={'center'} style={{ color: textColor }}>
            {date.split('-')[2]}
          </Text>
          <NotificationIndicator events={events} kindColor={kindColor} />
        </Container>
      </Popover.Target>
      <Popover.Dropdown
        maw="calc(100vw - 24px)"
        w={512}
        pe={4}
        pb={0}
        style={{ overflow: 'hidden' }}
      >
        <CalendarEventList events={events} />
      </Popover.Dropdown>
    </Popover>
  );
}

function NotificationIndicator({
  events,
  kindColor,
}: {
  events: CalendarEvent[];
  kindColor?: string;
}) {
  // One dot per data type (episode/movie/other) + one for the source app.
  // Final layout pending polish (decision: show both colors).
  const typeColors = [
    ...new Set(
      events
        .map((event) => mediaTypeDefs[event.metadata.type as keyof typeof mediaTypeDefs]?.color)
        .filter(Boolean),
    ),
  ];
  const colors = [...(kindColor ? [kindColor] : []), ...typeColors];
  return (
    <Flex
      w="80%"
      align={'center'}
      pos={'absolute'}
      gap={3}
      bottom={10}
      left={'12.5%'}
      p={0}
      direction={'row'}
      justify={'center'}
    >
      {colors.map((color: string) => {
        return (
          <Box
            key={color}
            bg={color}
            h={8}
            w={8}
            p={0}
            style={{ borderRadius: 999 }}
          />
        );
      })}
    </Flex>
  );
}
