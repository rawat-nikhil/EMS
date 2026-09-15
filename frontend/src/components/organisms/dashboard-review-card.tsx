import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import type { DashboardSummary } from "@/lib/dashboard";

type DashboardReviewCardProps = {
  pendingLeaveReviews: number;
  pendingTimesheetReviews: number;
  teamOnLeaveToday: NonNullable<DashboardSummary["teamOnLeaveToday"]>;
  teamHoursThisWeek: number;
};

export function DashboardReviewCard({
  pendingLeaveReviews,
  pendingTimesheetReviews,
  teamOnLeaveToday,
  teamHoursThisWeek,
}: DashboardReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>To review</CardTitle>
        <CardDescription>Team queue and this week’s hours</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">Leave requests</p>
            <p className="text-xl font-medium">{pendingLeaveReviews}</p>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">Timesheets</p>
            <p className="text-xl font-medium">{pendingTimesheetReviews}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">On leave today</p>
          {teamOnLeaveToday.count === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nobody on approved leave today.</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-1">
              {teamOnLeaveToday.people.map((person) => (
                <li key={person.id} className="text-sm text-muted-foreground">
                  {person.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Team hours this week: {teamHoursThisWeek}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/attendance" className="text-sm font-medium text-primary hover:underline">
            Review leave
          </Link>
          <Link href="/timesheet" className="text-sm font-medium text-primary hover:underline">
            Review timesheets
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
