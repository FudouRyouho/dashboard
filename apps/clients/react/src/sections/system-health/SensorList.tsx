import { Badge, Box, Divider, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconDeviceMobile, IconThermometer } from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';

import { formatTemp } from './format';
import { progressColor } from './health-colors';

/** Renders nothing when the list is empty. */
export function SensorList({ sensors }: { sensors: ServerMetrics['sensors'] }) {
  if (sensors.length === 0) return null;

  return (
    <Box mt="sm">
      <Divider my="xs" />
      <Text size="xs" fw={600} c="dimmed">
        Sensors
      </Text>
      <Stack gap="xs" mt="xs">
        {sensors.map((sensor) => (
          <Box
            key={sensor.sensorId}
            p="xs"
            style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}
          >
            <Group justify="space-between">
              <Group gap="xs">
                <IconDeviceMobile size={14} color="dimmed" />
                <Text size="xs" fw={500}>
                  {sensor.sensorId}
                </Text>
                <Badge size="xs" variant="light" color="gray">
                  {sensor.chip}
                </Badge>
              </Group>
              <Tooltip label="Temperature" withArrow>
                <Badge variant="light" color={progressColor((sensor.tempCelsius ?? 0) / 100 * 100)}>
                  <Group gap={4}>
                    <IconThermometer size={12} />
                    <Text size="xs">{formatTemp(sensor.tempCelsius)}</Text>
                  </Group>
                </Badge>
              </Tooltip>
            </Group>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
