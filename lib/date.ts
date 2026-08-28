const DAY_MS = 86_400_000;

export function startOfDay(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function dayKey(value: Date | string): string {
  const date = startOfDay(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateAtOffset(daysAgo: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
}

export function formatMomentDate(value: string): string {
  const date = new Date(value);
  const difference = Math.round((startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / DAY_MS);
  if (difference === 0) return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (difference === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function formatMonth(value: Date): string { return value.toLocaleDateString([], { month: "long", year: "numeric" }); }
export function isSameMonth(value: Date | string, month: Date): boolean {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}
export function getMonthCells(month: Date): Array<Date | null> {
  const cells: Array<Date | null> = [];
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let index = 0; index < firstDay; index += 1) cells.push(null);
  for (let day = 1; day <= days; day += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
export function uniqueDayCount(values: string[]): number { return new Set(values.map(dayKey)).size; }
export function isWithinLastDays(value: string, days: number): boolean {
  const difference = startOfDay(new Date()).getTime() - startOfDay(value).getTime();
  return difference >= 0 && difference < days * DAY_MS;
}
