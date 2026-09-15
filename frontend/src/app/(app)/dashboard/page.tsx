"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Clock, Hourglass, TreePalm } from "lucide-react";
import { DashboardLeaveCard } from "@/components/organisms/dashboard-leave-card";
import { DashboardReviewCard } from "@/components/organisms/dashboard-review-card";
import { DashboardUpcomingCard } from "@/components/organisms/dashboard-upcoming-card";
import { DashboardWeekCard } from "@/components/organisms/dashboard-week-card";
import { StatCard } from "@/components/molecules/stat-card";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import type { DashboardSummary } from "@/lib/dashboard";
import {
  REFRESH_ATTENDANCE_EVENT,
  REFRESH_DASHBOARD_EVENT,
  REFRESH_TIMESHEET_EVENT,
} from "@/lib/refresh-events";

function formatRole(role: string): string {
  return role.replaceAll("_", " ");
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canReview = user?.role === "admin" || user?.role === "reporting_manager";

  const loadSummary = useCallback(async () => {
    if (!token) {
      return;
    }
    const data = await api<DashboardSummary>("/api/dashboard/summary", { token });
    setSummary(data);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void (async () => {
      try {
        setLoadError(null);
        await loadSummary();
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : "Unable to load dashboard");
      }
    })();
  }, [token, loadSummary]);

  useEffect(() => {
    function onRefresh() {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadSummary().catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "Unable to load dashboard");
      });
    }
    window.addEventListener(REFRESH_ATTENDANCE_EVENT, onRefresh);
    window.addEventListener(REFRESH_TIMESHEET_EVENT, onRefresh);
    window.addEventListener(REFRESH_DASHBOARD_EVENT, onRefresh);
    document.addEventListener("visibilitychange", onRefresh);
    return () => {
      window.removeEventListener(REFRESH_ATTENDANCE_EVENT, onRefresh);
      window.removeEventListener(REFRESH_TIMESHEET_EVENT, onRefresh);
      window.removeEventListener(REFRESH_DASHBOARD_EVENT, onRefresh);
      document.removeEventListener("visibilitychange", onRefresh);
    };
  }, [loadSummary]);

  const reviewCount =
    (summary?.pendingLeaveReviews ?? 0) + (summary?.pendingTimesheetReviews ?? 0);
  const fourthTitle = canReview ? "Items to review" : "Pending leave";
  const fourthValue = canReview ? reviewCount : (summary?.myPendingLeaves ?? 0);
  const fourthHint = canReview
    ? `${summary?.pendingLeaveReviews ?? 0} leave · ${summary?.pendingTimesheetReviews ?? 0} timesheet`
    : `${summary?.myPendingTimesheets ?? 0} timesheet day(s) pending`;

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome{user ? `, ${user.name}` : ""} to EMS.
          {user ? ` Signed in as ${formatRole(user.role)}.` : ""}
        </p>
      </div>
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      {!summary && !loadError ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Leave remaining"
              value={`${summary.leaveBalance.remaining.total}/${summary.leaveBalance.entitlements.total}`}
              hint={summary.leaveBalance.quarter}
              icon={TreePalm}
              progress={{
                value: summary.leaveBalance.remaining.total,
                max: summary.leaveBalance.entitlements.total,
              }}
            />
            <StatCard
              title="Hours this week"
              value={`${summary.timesheetWeek.hours}h`}
              hint={`Cap ${summary.timesheetWeek.maxHoursPerWeek}h`}
              icon={Clock}
              progress={{
                value: summary.timesheetWeek.hours,
                max: summary.timesheetWeek.maxHoursPerWeek,
              }}
            />
            <StatCard
              title="Days still due"
              value={summary.timesheetWeek.dueDays.length}
              hint="Timesheet days without hours"
              icon={Hourglass}
            />
            <StatCard
              title={fourthTitle}
              value={fourthValue}
              hint={fourthHint}
              icon={CalendarCheck}
            />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardLeaveCard leaveBalance={summary.leaveBalance} />
            <DashboardWeekCard week={summary.timesheetWeek} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardUpcomingCard leaves={summary.upcomingLeaves} />
            {canReview &&
            summary.pendingLeaveReviews !== undefined &&
            summary.pendingTimesheetReviews !== undefined &&
            summary.teamOnLeaveToday &&
            summary.teamHoursThisWeek !== undefined ? (
              <DashboardReviewCard
                pendingLeaveReviews={summary.pendingLeaveReviews}
                pendingTimesheetReviews={summary.pendingTimesheetReviews}
                teamOnLeaveToday={summary.teamOnLeaveToday}
                teamHoursThisWeek={summary.teamHoursThisWeek}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
