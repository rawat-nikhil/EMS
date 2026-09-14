"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { cn } from "cn";
import {
  LEAVE_TYPE_LABELS,
  monthCells,
  type LeaveRecord,
} from "@/lib/attendance";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type AttendanceCalendarProps = {
  year: number;
  monthIndex: number;
  leaves: LeaveRecord[];
  selectedDate: string | null;
  onMonthChange: (year: number, monthIndex: number) => void;
  onSelectFreeDay: (dateKey: string) => void;
  onSelectLeave: (leave: LeaveRecord) => void;
};

function statusClass(status: LeaveRecord["status"]): string {
  if (status === "approved") {
    return "bg-emerald-500/15 text-emerald-700";
  }
  if (status === "rejected") {
    return "bg-destructive/15 text-destructive";
  }
  return "bg-amber-500/15 text-amber-800";
}

export function AttendanceCalendar({
  year,
  monthIndex,
  leaves,
  selectedDate,
  onMonthChange,
  onSelectFreeDay,
  onSelectLeave,
}: AttendanceCalendarProps) {
  const leavesByDay = new Map(leaves.map((leave) => [leave.date.slice(0, 10), leave]));
  const title = new Date(Date.UTC(year, monthIndex, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, monthIndex + delta, 1));
    onMonthChange(next.getUTCFullYear(), next.getUTCMonth());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">{title}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
        {monthCells(year, monthIndex).map((cell) => {
          const leave = leavesByDay.get(cell.dateKey);
          const selected = selectedDate === cell.dateKey;
          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => {
                if (leave) {
                  onSelectLeave(leave);
                  return;
                }
                onSelectFreeDay(cell.dateKey);
              }}
              className={cn(
                "flex min-h-20 flex-col items-start gap-1 bg-card p-2 text-left transition-colors hover:bg-muted/60",
                !cell.inMonth && "bg-muted/40 text-muted-foreground",
                selected && "ring-2 ring-inset ring-primary",
              )}
            >
              <span className="text-sm">{cell.day}</span>
              {leave ? (
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium capitalize", statusClass(leave.status))}>
                  {LEAVE_TYPE_LABELS[leave.leaveType]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
