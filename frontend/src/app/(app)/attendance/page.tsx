"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApplyLeavePanel } from "@/components/organisms/apply-leave-panel";
import { AttendanceCalendar } from "@/components/organisms/attendance-calendar";
import { LeaveReviewList } from "@/components/organisms/leave-review-list";
import { LeaveStatusList } from "@/components/organisms/leave-status-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { api, ApiError } from "@/lib/api";
import {
  monthRangeIso,
  toDateKey,
  type AttendanceStatus,
  type LeaveRecord,
  type LeaveType,
} from "@/lib/attendance";
import { useAuth } from "@/context/auth-context";

export default function AttendancePage() {
  const { token, user } = useAuth();
  const today = useMemo(() => toDateKey(new Date()), []);
  const initial = useMemo(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() };
  }, []);

  const [year, setYear] = useState(initial.year);
  const [monthIndex, setMonthIndex] = useState(initial.monthIndex);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<LeaveRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<AttendanceStatus>("pending");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [leaveType, setLeaveType] = useState<LeaveType>("sick");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canReview = user?.role === "admin" || user?.role === "reporting_manager";

  const loadLeaves = useCallback(async () => {
    if (!token) {
      return;
    }
    const range = monthRangeIso(year, monthIndex);
    const data = await api<{ leaves: LeaveRecord[] }>(
      `/api/attendance?from=${range.from}&to=${range.to}`,
      { token },
    );
    setLeaves(data.leaves);
  }, [token, year, monthIndex]);

  const loadPending = useCallback(async () => {
    if (!token || !canReview) {
      return;
    }
    const data = await api<{ leaves: LeaveRecord[] }>("/api/attendance/pending", { token });
    setPendingReviews(data.leaves);
  }, [token, canReview]);

  useEffect(() => {
    void (async () => {
      try {
        setLoadError(null);
        await Promise.all([loadLeaves(), loadPending()]);
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : "Unable to load attendance");
      }
    })();
  }, [loadLeaves, loadPending]);

  async function applyLeave() {
    setError(null);
    setSubmitting(true);
    try {
      await api("/api/attendance", {
        method: "POST",
        token,
        body: { from, to, leaveType, description },
      });
      setDescription("");
      await loadLeaves();
      setStatusTab("pending");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to apply leave");
    } finally {
      setSubmitting(false);
    }
  }

  async function reviewLeave(id: string, status: "approved" | "rejected") {
    setReviewingId(id);
    try {
      await api(`/api/attendance/${id}/review`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await Promise.all([loadLeaves(), loadPending()]);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-medium">Attendance</h1>
        <p className="text-muted-foreground">Mark leave on the calendar and track approval status.</p>
      </div>
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardContent>
            <AttendanceCalendar
              year={year}
              monthIndex={monthIndex}
              leaves={leaves}
              selectedDate={selectedDate}
              onMonthChange={(nextYear, nextMonth) => {
                setYear(nextYear);
                setMonthIndex(nextMonth);
              }}
              onSelectFreeDay={(dateKey) => {
                setSelectedDate(dateKey);
                setSelectedId(null);
                setFrom(dateKey);
                setTo(dateKey);
                setError(null);
              }}
              onSelectLeave={(leave) => {
                setSelectedDate(leave.date.slice(0, 10));
                setSelectedId(leave.id);
                setStatusTab(leave.status);
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <ApplyLeavePanel
              from={from}
              to={to}
              leaveType={leaveType}
              description={description}
              submitting={submitting}
              error={error}
              onFromChange={setFrom}
              onToChange={setTo}
              onLeaveTypeChange={setLeaveType}
              onDescriptionChange={setDescription}
              onSubmit={applyLeave}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Leave status</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveStatusList
            leaves={leaves}
            tab={statusTab}
            selectedId={selectedId}
            onTabChange={setStatusTab}
            onSelect={(leave) => {
              setSelectedId(leave.id);
              setSelectedDate(leave.date.slice(0, 10));
            }}
          />
        </CardContent>
      </Card>
      {canReview ? (
        <Card>
          <CardHeader>
            <CardTitle>To review</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveReviewList leaves={pendingReviews} reviewingId={reviewingId} onReview={reviewLeave} />
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
