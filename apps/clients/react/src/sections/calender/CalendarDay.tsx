import { Box, Container, Flex, Popover, Text } from '@mantine/core';
import { CalendarEventList } from './CalendarEventList';
import { useDisclosure } from '@mantine/hooks';
import { type CalendarEvent } from '@dashboard/contracts';
import { mediaTypeDefs } from '@dashboard/definitions';

interface CalendarDayProps {
  date: string;
  events: CalendarEvent[];
  /** Brand color of the source integration (resuelto en CalendarBase). */
  kindColor?: string;
  disabled: boolean;
}

export function CalenderDay({ date, events, kindColor, disabled }: CalendarDayProps) {
  const [opened, { toggle }] = useDisclosure(false);

  const dateObj = new Date(date + 'T00:00:00');
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  let textColor = 'gray'; // Default, día de semana sin evento

  if (!isWeekend && !disabled)
    textColor = 'white'; // Día semana, con evento
  else if (isWeekend && !disabled)
    textColor = 'lime'; // Finde, con evento
  else if (isWeekend && disabled) textColor = 'green'; // Finde, sin evento

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
  // Dot por tipo de dato (episode/movie/other) + dot de la app de origen.
  // Layout final pendiente de pulir (decidido: mostrar ambos colores).
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
