"use client";

import { cn } from "cn";
import { LEAVE_TYPE_LABELS, type AttendanceStatus, type LeaveRecord } from "@/lib/attendance";

const TABS: { id: AttendanceStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

type LeaveStatusListProps = {
  leaves: LeaveRecord[];
  tab: AttendanceStatus;
  selectedId: string | null;
  onTabChange: (tab: AttendanceStatus) => void;
  onSelect: (leave: LeaveRecord) => void;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function LeaveStatusList({ leaves, tab, selectedId, onTabChange, onSelect }: LeaveStatusListProps) {
  const counts = {
    pending: leaves.filter((leave) => leave.status === "pending").length,
    approved: leaves.filter((leave) => leave.status === "approved").length,
    rejected: leaves.filter((leave) => leave.status === "rejected").length,
  };
  const filtered = leaves.filter((leave) => leave.status === tab);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "px-3 py-2 text-sm font-medium",
              tab === item.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label} ({counts[item.id]})
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-muted-foreground">No {tab} leaves found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((leave) => (
            <li key={leave.id}>
              <button
                type="button"
                onClick={() => onSelect(leave)}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 text-left hover:bg-muted/50",
                  selectedId === leave.id && "border-primary bg-muted/40",
                )}
              >
                <span className="text-sm font-medium">
                  {formatDate(leave.date)} · {LEAVE_TYPE_LABELS[leave.leaveType]}
                </span>
                {leave.description ? (
                  <span className="text-xs text-muted-foreground">{leave.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
