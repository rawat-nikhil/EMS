"use client";

import { cn } from "cn";
import type { TimesheetRecord, TimesheetStatus } from "@/lib/timesheet";

const TABS: { id: TimesheetStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

type TimesheetStatusListProps = {
  timesheets: TimesheetRecord[];
  tab: TimesheetStatus;
  selectedId: string | null;
  showEmployee?: boolean;
  onTabChange: (tab: TimesheetStatus) => void;
  onSelect: (timesheet: TimesheetRecord) => void;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function TimesheetStatusList({
  timesheets,
  tab,
  selectedId,
  showEmployee = false,
  onTabChange,
  onSelect,
}: TimesheetStatusListProps) {
  const visible = timesheets.filter((row) => row.status !== "not_filled");
  const counts = {
    pending: visible.filter((row) => row.status === "pending").length,
    approved: visible.filter((row) => row.status === "approved").length,
    rejected: visible.filter((row) => row.status === "rejected").length,
  };
  const filtered = visible.filter((row) => row.status === tab);

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
        <p className="px-1 py-8 text-center text-sm text-muted-foreground">No {tab} timesheets found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row)}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 text-left hover:bg-muted/50",
                  selectedId === row.id && "border-primary bg-muted/40",
                )}
              >
                <span className="text-sm font-medium">
                  {showEmployee ? `${row.employee?.name ?? "Employee"} · ` : ""}
                  {formatDate(row.date)} · {row.hours}h
                </span>
                {row.description ? <span className="text-xs text-muted-foreground">{row.description}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
