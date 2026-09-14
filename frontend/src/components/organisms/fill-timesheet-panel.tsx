"use client";

import { FormEvent } from "react";
import { Button } from "@/components/atoms/button";

type FillTimesheetPanelProps = {
  totalHours: number;
  submitting: boolean;
  error: string | null;
  onSubmit: () => Promise<void>;
};

export function FillTimesheetPanel({ totalHours, submitting, error, onSubmit }: FillTimesheetPanelProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-base font-medium">Fill timesheet</h2>
        <p className="text-sm text-muted-foreground">Enter hours for the week and submit for approval.</p>
      </div>
      <p className="text-sm">
        Total hours: <span className="font-medium">{totalHours.toFixed(1)}</span>
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting || totalHours <= 0}>
        {submitting ? "Submitting…" : "Submit week"}
      </Button>
    </form>
  );
}
