"use client";

import { Button } from "@/components/atoms/button";
import type { TimesheetRecord } from "@/lib/timesheet";

type TimesheetReviewListProps = {
  timesheets: TimesheetRecord[];
  reviewingId: string | null;
  onReview: (id: string, status: "approved" | "rejected") => Promise<void>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function TimesheetReviewList({ timesheets, reviewingId, onReview }: TimesheetReviewListProps) {
  if (timesheets.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No pending timesheets to review.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {timesheets.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.employee?.name ?? "Employee"} · {formatDate(row.date)} · {row.hours}h
            </span>
            {row.description ? <span className="text-xs text-muted-foreground">{row.description}</span> : null}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={reviewingId === row.id}
              onClick={() => void onReview(row.id, "rejected")}
            >
              Reject
            </Button>
            <Button size="sm" disabled={reviewingId === row.id} onClick={() => void onReview(row.id, "approved")}>
              Approve
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
