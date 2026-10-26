import { createTheme, type MantineColorsTuple } from '@mantine/core';
import type { DefaultMantineColor, MantineColorShade } from "@mantine/core";
import { DEFAULT_THEME } from "@mantine/core";

const brandColor: MantineColorsTuple = [
  '#ffe9ff',
  '#fed1fd',
  '#faa1f6',
  '#f66ef1',
  '#f243eb',
  '#f028e9',
  '#f018e8',
  '#d609ce',
  '#bf00b9',
  '#a700a1',
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: brandColor,
  },
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
});

export const getMantineColor = (color: DefaultMantineColor, shade: MantineColorShade) =>
  DEFAULT_THEME.colors[color]?.[shade] ?? "#fff";
