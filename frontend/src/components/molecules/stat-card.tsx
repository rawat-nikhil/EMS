import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";

type StatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  progress?: { value: number; max: number };
};

export function StatCard({ title, value, hint, icon: Icon, progress }: StatCardProps) {
  const pct =
    progress && progress.max > 0 ? Math.min(100, Math.round((progress.value / progress.max) * 100)) : 0;

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-medium tracking-tight">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {progress ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
