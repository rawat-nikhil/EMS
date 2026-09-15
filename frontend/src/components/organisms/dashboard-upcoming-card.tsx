import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@/lib/attendance";
import { formatUtcDayLabel } from "@/lib/dates";
import type { UpcomingLeave } from "@/lib/dashboard";

function leaveLabel(leaveType: string): string {
  return leaveType in LEAVE_TYPE_LABELS ? LEAVE_TYPE_LABELS[leaveType as LeaveType] : leaveType;
}

export function DashboardUpcomingCard({ leaves }: { leaves: UpcomingLeave[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming leave</CardTitle>
        <CardDescription>Approved days from today onward</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {leaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming approved leave.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {leaves.map((leave) => (
              <li
                key={`${leave.date}-${leave.leaveType}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span className="text-sm font-medium">{formatUtcDayLabel(leave.date)}</span>
                <span className="text-xs text-muted-foreground">{leaveLabel(leave.leaveType)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/attendance" className="text-sm font-medium text-primary hover:underline">
          Open attendance
        </Link>
      </CardContent>
    </Card>
  );
}
