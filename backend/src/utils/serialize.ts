export function toJsonTransform(hide: string[] = []) {
  return (_doc: unknown, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    for (const key of hide) {
      delete ret[key];
    }
    return ret;
  };
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function eachUtcDay(from: Date, to: Date): Date[] {
  const start = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  const days: Date[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 24 * 60 * 60 * 1000) {
    days.push(new Date(time));
  }
  return days;
}

export function isUtcMondayToSundayWeek(from: Date, to: Date): boolean {
  const start = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  return start.getUTCDay() === 1 && end.getUTCDay() === 0 && end.getTime() - start.getTime() === 6 * 24 * 60 * 60 * 1000;
}

export function toPlain<T>(doc: { toJSON: () => unknown } | null | undefined): T | null {
  if (!doc) {
    return null;
  }
  return doc.toJSON() as unknown as T;
}
