import { Flex } from '@mantine/core';
import classes from './header.module.css';
import { HeaderTabs } from './HeaderTabs';
import ThemeChange from './theme-change/theme-change';

export function Header() {
  return (
    <div className={classes.header}>
      <Flex justify="space-between" align="center" mx={24} pt={6}>
        <HeaderTabs />
        <ThemeChange />
      </Flex>
    </div>
  );
}
