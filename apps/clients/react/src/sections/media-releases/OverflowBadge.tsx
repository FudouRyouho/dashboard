import type { BadgeProps, MantineSpacing } from '@mantine/core';
import { Badge, Group, Popover, Stack } from '@mantine/core';

interface OverflowBadgeOwnProps {
  data: string[];
  overflowCount?: number;
  disablePopover?: boolean;
  groupGap?: MantineSpacing;
}

interface OverflowBadgeProps extends BadgeProps, OverflowBadgeOwnProps {}

export function OverflowBadge({
  data,
  overflowCount = 3,
  disablePopover = false,
  groupGap = 'xs',
  ...props
}: OverflowBadgeProps) {
  const badgeProps = {
    variant: 'default',
    size: 'lg',
    radius: 'sm',
    ...props,
  } satisfies BadgeProps;

  const visible = data.slice(0, overflowCount);
  const hidden = data.slice(overflowCount);

  return (
    <Popover width="content" shadow="md" disabled={disablePopover || hidden.length === 0}>
      <Group gap={groupGap}>
        {visible.map((item) => (
          <Badge key={item} px="xs" {...badgeProps}>
            {item}
          </Badge>
        ))}
        {hidden.length > 0 && (
          <Popover.Target>
            <Badge px="xs" style={{ cursor: 'pointer', ...badgeProps.style }} {...badgeProps}>
              +{hidden.length}
            </Badge>
          </Popover.Target>
        )}
      </Group>
      <Popover.Dropdown>
        <Stack>
          {hidden.map((item) => (
            <Badge key={item} {...badgeProps}>
              {item}
            </Badge>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}