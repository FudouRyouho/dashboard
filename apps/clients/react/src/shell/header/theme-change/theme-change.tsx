import {
  useMantineColorScheme,
  useComputedColorScheme,
  Button,
} from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import classes from './theme-change.module.css';

export default function ThemeChange() {
  const { setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  return (
    <Button
      onClick={() =>
        setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')
      }
      variant="default"
      className={classes.button}
      size="sm"
      aria-label="Toggle color scheme"
    >
      <IconSun className={`${classes.icon} ${classes.light}`} />
      <IconMoon className={`${classes.icon} ${classes.dark}`} />
    </Button>
  );
}
