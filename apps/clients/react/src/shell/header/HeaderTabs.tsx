import { Tabs, type MantineColor } from "@mantine/core";
import classes from './header.module.css';
import { IconHome, IconSettings } from "@tabler/icons-react";
import type { ReactNode } from 'react'

interface TabProps {
    label: string,
    icon: ReactNode
    color: MantineColor
}

const tabs: TabProps[] = [
    { label: 'Dashboard', icon: <IconHome />, color: 'blue' },
    { label: 'Settings', icon: <IconSettings />, color: 'teal' },
];

export function HeaderTabs() {

    const items = tabs.map(({ label, icon, color }) => (
        <Tabs.Tab value={label} key={label} color={color} leftSection={icon} rightSection={label}>
        </Tabs.Tab>
    ));

    return (

        <Tabs
            defaultValue="Dashboard"
            variant="default"
            visibleFrom="sm"
            classNames={{
                root: classes.tabs,
                list: classes.tabsList,
                tab: classes.tab,
            }}
        >
            <Tabs.List>{items}</Tabs.List>
            {items.map((item) => (
                <Tabs.Panel value={item.key!} key={item.key}>
                    {' '}
                </Tabs.Panel>
            ))}
        </Tabs>

    )
}