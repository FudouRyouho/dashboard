import { Box, Container, Flex, Popover, Text } from '@mantine/core';
import { CalendarEventList } from './CalendarEventList';
import { useDisclosure } from '@mantine/hooks';
import { type CalendarEvent } from '@dashboard/contracts';

interface CalendarDayProps {
  date: string;
  events: CalendarEvent[];
  disabled: boolean;
}

export function CalenderDay({ date, events, disabled }: CalendarDayProps) {
  const [opened, { toggle }] = useDisclosure(false);

  /**
   * ToDo: Añadir soporte para light/dark theme utilizando el hook de mantine
   *
   * Añadir espacios de colores para concatenar el feelback de la propia implementacion
   */
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
          <NotificationIndicator events={events} />
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

interface NotificationIndicatorProps {
  events: CalendarEvent[];
}

function NotificationIndicator({ events }: NotificationIndicatorProps) {
  const notificationEvents = [
    ...new Set(events.map((event) => event.indicatorColor)),
  ].filter(String);
  return (
    <Flex
      w="80%"
      align={'center'}
      pos={'absolute'}
      bottom={10}
      left={'12.5%'}
      p={0}
      direction={'row'}
      justify={'center'}
    >
      {notificationEvents.map((notificationEvent: string) => {
        return (
          <Box
            key={notificationEvent}
            bg={notificationEvent}
            h={8}
            w={'100%'}
            p={0}
            style={{ borderRadius: 999 }}
          />
        );
      })}
    </Flex>
  );
}
