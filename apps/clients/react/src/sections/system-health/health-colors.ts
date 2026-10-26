/** Mantine color name by usage percent: green < 40 <= yellow < 60 <= orange < 90 <= red. */
export function progressColor(percentage: number): string {
  if (percentage < 40) return 'green';
  if (percentage < 60) return 'yellow';
  if (percentage < 90) return 'orange';
  return 'red';
}
