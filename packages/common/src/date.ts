/**
 * Safely convert a Date to ISO string, returns null if undefined
 * @param date Date to convert or undefined
 * @returns ISO string or null
 */
export const toISOStringSafe = (date: Date | undefined): string | null =>
  date?.toISOString() ?? null;

/**
 * Parse an ISO date string to Date, returns null if invalid
 * @param str ISO date string
 * @returns Date or null
 */
export const parseISODate = (str: string): Date | null => {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Get start of day (midnight) for given date
 * @param date Date to truncate
 * @returns Date at 00:00:00.000
 */
export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Get end of day (23:59:59.999) for given date
 * @param date Date to extend
 * @returns Date at 23:59:59.999
 */
export const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

/**
 * Add months to a date
 * @param date Base date
 * @param months Number of months to add
 * @returns New date with months added
 */
export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * Subtract months from a date
 * @param date Base date
 * @param months Number of months to subtract
 * @returns New date with months subtracted
 */
export const subtractMonths = (date: Date, months: number): Date =>
  addMonths(date, -months);
