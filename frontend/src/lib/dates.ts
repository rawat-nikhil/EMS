export function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function startOfUtcMonth(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

export type CalendarCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

export function monthCells(year: number, monthIndex: number): CalendarCell[] {
  const first = startOfUtcMonth(year, monthIndex);
  const startOffset = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return {
      dateKey: toDateKey(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex,
    };
  });
}

export function monthRangeIso(year: number, monthIndex: number): { from: string; to: string } {
  const cells = monthCells(year, monthIndex);
  return { from: cells[0].dateKey, to: cells[cells.length - 1].dateKey };
}

export function startOfUtcWeek(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

export function weekDayKeys(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return toDateKey(date);
  });
}

export function shiftUtcWeek(monday: Date, deltaWeeks: number): Date {
  const next = new Date(monday);
  next.setUTCDate(monday.getUTCDate() + deltaWeeks * 7);
  return next;
}

export function formatUtcDayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatUtcWeekLabel(monday: Date): string {
  return monday.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}
