"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { FillTimesheetPanel } from "@/components/organisms/fill-timesheet-panel";
import { TimesheetReviewList } from "@/components/organisms/timesheet-review-list";
import { TimesheetStatusList } from "@/components/organisms/timesheet-status-list";
import { TimesheetWeekGrid } from "@/components/organisms/timesheet-week-grid";
import { api, ApiError } from "@/lib/api";
import { startOfUtcWeek, toDateKey, weekDayKeys } from "@/lib/dates";
import type { TimesheetRecord, TimesheetStatus, WeekDayDraft } from "@/lib/timesheet";
import { useAuth } from "@/context/auth-context";

function preferredStatusTab(rows: TimesheetRecord[], current: TimesheetStatus): TimesheetStatus {
  const pending = rows.filter((row) => row.status === "pending").length;
  const approved = rows.filter((row) => row.status === "approved").length;
  const rejected = rows.filter((row) => row.status === "rejected").length;
  if (current === "pending" && pending === 0 && approved > 0) {
    return "approved";
  }
  if (current === "pending" && pending === 0 && rejected > 0) {
    return "rejected";
  }
  return current;
}

function draftsFromWeek(monday: Date, records: TimesheetRecord[]): WeekDayDraft[] {
  const byDate = new Map(records.map((row) => [row.date.slice(0, 10), row]));
  return weekDayKeys(monday).map((date) => {
    const row = byDate.get(date);
    return {
      date,
      hours: row ? String(row.hours) : "",
      description: row?.description ?? "",
    };
  });
}

export default function TimesheetPage() {
  const { token, user } = useAuth();
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [monday, setMonday] = useState(() => startOfUtcWeek(new Date()));
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [drafts, setDrafts] = useState<WeekDayDraft[]>(() => draftsFromWeek(startOfUtcWeek(new Date()), []));
  const [pendingReviews, setPendingReviews] = useState<TimesheetRecord[]>([]);
  const [teamRecords, setTeamRecords] = useState<TimesheetRecord[]>([]);
  const [statusTab, setStatusTab] = useState<TimesheetStatus>("pending");
  const [teamTab, setTeamTab] = useState<TimesheetStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teamSelectedId, setTeamSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const canReview = user?.role === "admin" || user?.role === "reporting_manager";
  const from = toDateKey(monday);
  const to = weekDayKeys(monday)[6];
  const recordsByDate = useMemo(
    () => new Map(records.map((row) => [row.date.slice(0, 10), row])),
    [records],
  );
  const totalHours = drafts.reduce((sum, day) => sum + (Number(day.hours) || 0), 0);

  const loadWeek = useCallback(async () => {
    if (!token) {
      return;
    }
    const data = await api<{ timesheets: TimesheetRecord[] }>(
      `/api/timesheets?from=${from}&to=${to}`,
      { token },
    );
    setRecords(data.timesheets);
    setDrafts(draftsFromWeek(monday, data.timesheets));
    setStatusTab((current) => preferredStatusTab(data.timesheets, current));
  }, [token, from, to, monday]);

  const loadTeam = useCallback(async () => {
    if (!token || !canReview) {
      return;
    }
    const data = await api<{ timesheets: TimesheetRecord[] }>(
      `/api/timesheets/team?from=${from}&to=${to}`,
      { token },
    );
    setTeamRecords(data.timesheets);
    setTeamTab((current) => preferredStatusTab(data.timesheets, current));
  }, [token, canReview, from, to]);

  const loadPending = useCallback(async () => {
    if (!token || !canReview) {
      return;
    }
    const data = await api<{ timesheets: TimesheetRecord[] }>("/api/timesheets/pending", { token });
    setPendingReviews(data.timesheets);
  }, [token, canReview]);

  useEffect(() => {
    void (async () => {
      try {
        setLoadError(null);
        await Promise.all([loadWeek(), loadPending(), loadTeam()]);
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : "Unable to load timesheets");
      }
    })();
  }, [loadWeek, loadPending, loadTeam]);

  function updateDraft(date: string, patch: Partial<WeekDayDraft>) {
    setDrafts((current) => current.map((day) => (day.date === date ? { ...day, ...patch } : day)));
  }

  async function submitWeek() {
    setError(null);
    setSubmitting(true);
    try {
      const days = drafts
        .filter((day) => Number(day.hours) > 0)
        .map((day) => ({
          date: day.date,
          hours: Number(day.hours),
          description: day.description,
        }));
      await api("/api/timesheets/week", {
        method: "PUT",
        token,
        body: { from, to, days },
      });
      setStatusTab("pending");
      await loadWeek();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to submit timesheet");
    } finally {
      setSubmitting(false);
    }
  }

  async function reviewTimesheet(id: string, status: "approved" | "rejected") {
    setReviewingId(id);
    try {
      await api(`/api/timesheets/${id}/review`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await Promise.all([loadWeek(), loadPending(), loadTeam()]);
      setTeamTab(status);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-medium">Timesheet</h1>
        <p className="text-muted-foreground">Fill hours for the week and track approval status.</p>
      </div>
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardContent>
            <TimesheetWeekGrid
              monday={monday}
              drafts={drafts}
              recordsByDate={recordsByDate}
              todayKey={todayKey}
              onWeekChange={(nextMonday) => {
                setMonday(nextMonday);
                setError(null);
              }}
              onHoursChange={(date, hours) => updateDraft(date, { hours })}
              onDescriptionChange={(date, description) => updateDraft(date, { description })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <FillTimesheetPanel
              totalHours={totalHours}
              submitting={submitting}
              error={error}
              onSubmit={submitWeek}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>This week</CardTitle>
        </CardHeader>
        <CardContent>
          <TimesheetStatusList
            timesheets={records}
            tab={statusTab}
            selectedId={selectedId}
            onTabChange={setStatusTab}
            onSelect={(row) => setSelectedId(row.id)}
          />
        </CardContent>
      </Card>
      {canReview ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>To review</CardTitle>
            </CardHeader>
            <CardContent>
              <TimesheetReviewList
                timesheets={pendingReviews}
                reviewingId={reviewingId}
                onReview={reviewTimesheet}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team this week</CardTitle>
            </CardHeader>
            <CardContent>
              <TimesheetStatusList
                timesheets={teamRecords}
                tab={teamTab}
                selectedId={teamSelectedId}
                showEmployee
                onTabChange={setTeamTab}
                onSelect={(row) => setTeamSelectedId(row.id)}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  );
}
