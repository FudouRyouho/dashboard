export function serverCalendarWindow(now = new Date()) {
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999),
  };
}
