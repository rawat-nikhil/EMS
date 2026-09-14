"use client";

import { Button } from "@/components/atoms/button";
import { LEAVE_TYPE_LABELS, type LeaveRecord } from "@/lib/attendance";

type LeaveReviewListProps = {
  leaves: LeaveRecord[];
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

export function LeaveReviewList({ leaves, reviewingId, onReview }: LeaveReviewListProps) {
  if (leaves.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No pending requests to review.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {leaves.map((leave) => (
        <li key={leave.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {leave.employee?.name ?? "Employee"} · {formatDate(leave.date)} · {LEAVE_TYPE_LABELS[leave.leaveType]}
            </span>
            {leave.description ? <span className="text-xs text-muted-foreground">{leave.description}</span> : null}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={reviewingId === leave.id}
              onClick={() => void onReview(leave.id, "rejected")}
            >
              Reject
            </Button>
            <Button size="sm" disabled={reviewingId === leave.id} onClick={() => void onReview(leave.id, "approved")}>
              Approve
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
