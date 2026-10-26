import type { ReactNode } from 'react';
import { RingProgress, Stack, Text, Tooltip } from '@mantine/core';

interface MetricRingProps {
  /** Ring fill 0-100; the caller resolves nulls and clamps. */
  value: number;
  color: string;
  /** Center text, e.g. "42.3%". */
  display: string;
  tooltip: string;
  icon: ReactNode;
}

export function MetricRing({ value, color, display, tooltip, icon }: MetricRingProps) {
  return (
    <Tooltip label={tooltip} withArrow>
      <RingProgress
        size={80}
        thickness={6}
        roundCaps
        sections={[{ value, color }]}
        label={
          <Stack gap={1} ta="center">
            <Text size="xs" fw={600}>
              {display}
            </Text>
            {icon}
          </Stack>
        }
      />
    </Tooltip>
  );
}
