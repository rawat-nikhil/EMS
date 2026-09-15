import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { formatUtcDayLabel } from "@/lib/dates";
import type { TimesheetWeekSummary } from "@/lib/dashboard";

export function DashboardWeekCard({ week }: { week: TimesheetWeekSummary }) {
  const pct =
    week.maxHoursPerWeek > 0 ? Math.min(100, Math.round((week.hours / week.maxHoursPerWeek) * 100)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>This week</CardTitle>
        <CardDescription>
          {formatUtcDayLabel(week.weekFrom)} – {formatUtcDayLabel(week.weekTo)} · {week.hours} /{" "}
          {week.maxHoursPerWeek}h
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-chart-2" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {week.statusCounts.pending} pending · {week.statusCounts.approved} approved ·{" "}
          {week.statusCounts.rejected} rejected
        </p>
        {week.dueDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">All days this week have hours entered.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Days still due</p>
            <ul className="flex flex-wrap gap-1.5">
              {week.dueDays.map((date) => (
                <li
                  key={date}
                  className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {formatUtcDayLabel(date)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link href="/timesheet" className="pt-1 text-sm font-medium text-primary hover:underline">
          Fill timesheet
        </Link>
      </CardContent>
    </Card>
  );
}
