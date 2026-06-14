/** Returns "YYYY-MM-DD" in UTC — safe date bucket key across all timezones */
export const utcDay = (d: string | Date): string =>
  (typeof d === 'string' ? new Date(d) : d).toISOString().slice(0, 10);
