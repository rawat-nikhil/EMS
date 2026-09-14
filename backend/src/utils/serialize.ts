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

export function toPlain<T>(doc: { toJSON: () => unknown } | null | undefined): T | null {
  if (!doc) {
    return null;
  }
  return doc.toJSON() as unknown as T;
}
