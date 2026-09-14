import { startOfUtcDay } from "../utils/serialize.js";

export function utcQuarterRange(now = new Date()): { from: Date; to: Date; label: string } {
  const year = now.getUTCFullYear();
  const quarter = Math.floor(now.getUTCMonth() / 3);
  const from = new Date(Date.UTC(year, quarter * 3, 1));
  const to = new Date(Date.UTC(year, quarter * 3 + 3, 0));
  return { from: startOfUtcDay(from), to: startOfUtcDay(to), label: `Q${quarter + 1} ${year}` };
}

export function utcWeekRange(now = new Date()): { from: Date; to: Date; days: Date[] } {
  const today = startOfUtcDay(now);
  const offset = (today.getUTCDay() + 6) % 7;
  const from = new Date(today);
  from.setUTCDate(today.getUTCDate() - offset);
  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(from);
    day.setUTCDate(from.getUTCDate() + i);
    days.push(day);
  }
  const to = days[6] ?? from;
  return { from, to, days };
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const COMPANY_TIMEZONE = "Asia/Kolkata";

export function companyCalendarDate(now = new Date()): {
  today: string;
  tomorrow: string;
  weekday: string;
  timezone: string;
} {
  const today = now.toLocaleDateString("en-CA", { timeZone: COMPANY_TIMEZONE });
  const weekday = now.toLocaleDateString("en-US", { timeZone: COMPANY_TIMEZONE, weekday: "long" });
  const [year, month, day] = today.split("-").map(Number);
  const tomorrowDate = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    today,
    tomorrow: toDateKey(tomorrowDate),
    weekday,
    timezone: COMPANY_TIMEZONE,
  };
}
