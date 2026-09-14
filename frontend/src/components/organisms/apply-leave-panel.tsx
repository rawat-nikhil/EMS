"use client";

import { FormEvent } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { LEAVE_TYPE_LABELS, LEAVE_TYPES, type LeaveType } from "@/lib/attendance";

type ApplyLeavePanelProps = {
  from: string;
  to: string;
  leaveType: LeaveType;
  description: string;
  submitting: boolean;
  error: string | null;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onLeaveTypeChange: (value: LeaveType) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function ApplyLeavePanel({
  from,
  to,
  leaveType,
  description,
  submitting,
  error,
  onFromChange,
  onToChange,
  onLeaveTypeChange,
  onDescriptionChange,
  onSubmit,
}: ApplyLeavePanelProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-base font-medium">Apply leave</h2>
        <p className="text-sm text-muted-foreground">Click a free date on the calendar, then submit for approval.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="leave-from">From</Label>
          <Input id="leave-from" type="date" value={from} onChange={(event) => onFromChange(event.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="leave-to">To</Label>
          <Input id="leave-to" type="date" value={to} onChange={(event) => onToChange(event.target.value)} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leave-type">Leave type</Label>
        <select
          id="leave-type"
          value={leaveType}
          onChange={(event) => onLeaveTypeChange(event.target.value as LeaveType)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {LEAVE_TYPES.map((type) => (
            <option key={type} value={type}>
              {LEAVE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leave-comment">Comment</Label>
        <textarea
          id="leave-comment"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Optional"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting || !from || !to}>
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
