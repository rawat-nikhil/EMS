"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { cn } from "cn";
import { formatUtcDayLabel, formatUtcWeekLabel } from "@/lib/dates";
import type { TimesheetRecord, WeekDayDraft } from "@/lib/timesheet";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type TimesheetWeekGridProps = {
  monday: Date;
  drafts: WeekDayDraft[];
  recordsByDate: Map<string, TimesheetRecord>;
  todayKey: string;
  onWeekChange: (monday: Date) => void;
  onHoursChange: (date: string, hours: string) => void;
  onDescriptionChange: (date: string, description: string) => void;
};

function statusClass(status: TimesheetRecord["status"]): string {
  if (status === "approved") {
    return "bg-emerald-500/15 text-emerald-700";
  }
  if (status === "rejected") {
    return "bg-destructive/15 text-destructive";
  }
  return "bg-amber-500/15 text-amber-800";
}

export function TimesheetWeekGrid({
  monday,
  drafts,
  recordsByDate,
  todayKey,
  onWeekChange,
  onHoursChange,
  onDescriptionChange,
}: TimesheetWeekGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Week of {formatUtcWeekLabel(monday)}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onWeekChange(new Date(monday.getTime() - 7 * 24 * 60 * 60 * 1000))}
            aria-label="Previous week"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onWeekChange(new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000))}
            aria-label="Next week"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {drafts.map((draft, index) => {
          const record = recordsByDate.get(draft.date);
          const locked = record?.status === "approved";
          const isToday = draft.date === todayKey;
          return (
            <div
              key={draft.date}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-2",
                isToday && "border-primary ring-1 ring-primary/30",
              )}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">{WEEKDAYS[index]}</span>
                <span className="text-sm font-medium">{formatUtcDayLabel(draft.date)}</span>
              </div>
              <Input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                placeholder="Hours"
                value={draft.hours}
                disabled={locked}
                onChange={(event) => onHoursChange(draft.date, event.target.value)}
              />
              <Input
                placeholder="Notes"
                value={draft.description}
                disabled={locked}
                onChange={(event) => onDescriptionChange(draft.date, event.target.value)}
              />
              {record && record.status !== "not_filled" ? (
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium capitalize", statusClass(record.status))}>
                  {record.status.replace("_", " ")}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
