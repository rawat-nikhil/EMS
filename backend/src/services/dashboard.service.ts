import type { Actor } from "../auth/permissions.js";
import { ROLES } from "../auth/roles.js";
import { toDateKey, utcQuarterRange, utcWeekRange } from "../chat/dates.js";
import { companyPolicies } from "../config/policies.js";
import { attendanceRepository } from "../repository/attendance.repository.js";
import { timesheetRepository } from "../repository/timesheet.repository.js";
import { userRepository } from "../repository/user.repository.js";
import { startOfUtcDay } from "../utils/serialize.js";

type LeaveKey = "paid" | "sick" | "casual" | "optional";

export type LeaveBalance = {
  quarter: string;
  from: string;
  to: string;
  used: { total: number; PL: number; SL: number; CL: number; OL: number };
  remaining: { total: number; PL: number; SL: number; CL: number; OL: number };
  entitlements: { total: number; PL: number; SL: number; CL: number; OL: number };
};

export type TimesheetWeekSummary = {
  weekFrom: string;
  weekTo: string;
  hours: number;
  maxHoursPerWeek: number;
  dueDays: string[];
  filledDays: { date: string; hours: number; status: string }[];
  statusCounts: { pending: number; approved: number; rejected: number };
};

export type UpcomingLeave = {
  date: string;
  leaveType: string;
};

export type TeamOnLeaveToday = {
  count: number;
  people: { id: string; name: string }[];
};

export type DashboardSummary = {
  leaveBalance: LeaveBalance;
  timesheetWeek: TimesheetWeekSummary;
  upcomingLeaves: UpcomingLeave[];
  myPendingLeaves: number;
  myPendingTimesheets: number;
  pendingLeaveReviews?: number;
  pendingTimesheetReviews?: number;
  teamOnLeaveToday?: TeamOnLeaveToday;
  teamHoursThisWeek?: number;
};

export async function getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
  const { from, to, label } = utcQuarterRange();
  const rows = await attendanceRepository.findByEmployeeInRange(employeeId, from, to);
  const usedRows = rows.filter((row) => row.status === "approved" || row.status === "pending");
  const usedByType: Record<LeaveKey, number> = { paid: 0, sick: 0, casual: 0, optional: 0 };
  for (const row of usedRows) {
    const key = row.leaveType as LeaveKey;
    if (key in usedByType) {
      usedByType[key] += 1;
    }
  }
  const totalUsed = usedRows.length;
  const remainingByType = {
    PL: Math.max(0, companyPolicies.attendance.perTypePerQuarter.paid - usedByType.paid),
    SL: Math.max(0, companyPolicies.attendance.perTypePerQuarter.sick - usedByType.sick),
    CL: Math.max(0, companyPolicies.attendance.perTypePerQuarter.casual - usedByType.casual),
    OL: Math.max(0, companyPolicies.attendance.perTypePerQuarter.optional - usedByType.optional),
  };
  return {
    quarter: label,
    from: toDateKey(from),
    to: toDateKey(to),
    used: {
      total: totalUsed,
      PL: usedByType.paid,
      SL: usedByType.sick,
      CL: usedByType.casual,
      OL: usedByType.optional,
    },
    remaining: {
      total: Math.max(0, companyPolicies.attendance.maxLeaveDaysPerQuarter - totalUsed),
      ...remainingByType,
    },
    entitlements: {
      total: companyPolicies.attendance.maxLeaveDaysPerQuarter,
      PL: companyPolicies.attendance.perTypePerQuarter.paid,
      SL: companyPolicies.attendance.perTypePerQuarter.sick,
      CL: companyPolicies.attendance.perTypePerQuarter.casual,
      OL: companyPolicies.attendance.perTypePerQuarter.optional,
    },
  };
}

export async function getTimesheetWeek(employeeId: string): Promise<TimesheetWeekSummary> {
  const { from, to, days } = utcWeekRange();
  const rows = await timesheetRepository.findByEmployeeInRange(employeeId, from, to);
  const byDate = new Map(rows.map((row) => [toDateKey(new Date(row.date)), row]));
  const dueDays: string[] = [];
  const filledDays: { date: string; hours: number; status: string }[] = [];
  const statusCounts = { pending: 0, approved: 0, rejected: 0 };
  let hours = 0;

  for (const day of days) {
    const key = toDateKey(day);
    const row = byDate.get(key);
    if (!row) {
      dueDays.push(key);
      continue;
    }
    filledDays.push({ date: key, hours: row.hours, status: row.status });
    hours += row.hours;
    if (row.status === "pending" || row.status === "approved" || row.status === "rejected") {
      statusCounts[row.status] += 1;
    }
  }

  return {
    weekFrom: toDateKey(from),
    weekTo: toDateKey(to),
    hours,
    maxHoursPerWeek: companyPolicies.timesheet.maxHoursPerWeek,
    dueDays,
    filledDays,
    statusCounts,
  };
}

export async function getDashboardSummary(actor: Actor): Promise<DashboardSummary> {
  const canReview = actor.role === ROLES.ADMIN || actor.role === ROLES.REPORTING_MANAGER;
  const week = utcWeekRange();
  const today = startOfUtcDay(new Date());

  const [leaveBalance, timesheetWeek, myLeaves, myTimesheets] = await Promise.all([
    getLeaveBalance(actor.id),
    getTimesheetWeek(actor.id),
    attendanceRepository.findByEmployeeId(actor.id),
    timesheetRepository.findByEmployeeId(actor.id),
  ]);

  const upcomingLeaves = myLeaves
    .filter((row) => row.status === "approved" && startOfUtcDay(new Date(row.date)).getTime() >= today.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((row) => ({
      date: toDateKey(new Date(row.date)),
      leaveType: row.leaveType,
    }));

  const summary: DashboardSummary = {
    leaveBalance,
    timesheetWeek,
    upcomingLeaves,
    myPendingLeaves: myLeaves.filter((row) => row.status === "pending").length,
    myPendingTimesheets: myTimesheets.filter((row) => row.status === "pending").length,
  };

  if (!canReview) {
    return summary;
  }

  const reportIds =
    actor.role === ROLES.ADMIN ? null : (await userRepository.findReports(actor.id)).map((user) => user.id);

  const [pendingLeaves, pendingTimesheets, teamLeavesToday, teamTimesheets] = await Promise.all([
    actor.role === ROLES.ADMIN
      ? attendanceRepository.findAllPending()
      : attendanceRepository.findPendingByEmployeeIds(reportIds ?? []),
    actor.role === ROLES.ADMIN
      ? timesheetRepository.findAllPending()
      : timesheetRepository.findPendingByEmployeeIds(reportIds ?? []),
    actor.role === ROLES.ADMIN
      ? attendanceRepository.findInRange(today, today)
      : attendanceRepository.findByEmployeeIdsInRange(reportIds ?? [], today, today),
    actor.role === ROLES.ADMIN
      ? timesheetRepository.findInRange(week.from, week.to)
      : timesheetRepository.findByEmployeeIdsInRange(reportIds ?? [], week.from, week.to),
  ]);

  const onLeave = teamLeavesToday.filter((row) => row.status === "approved");
  const peopleById = new Map(
    (await userRepository.findByIds(onLeave.map((row) => String(row.employeeId)))).map((user) => [
      user.id,
      user.name,
    ]),
  );

  summary.pendingLeaveReviews = pendingLeaves.length;
  summary.pendingTimesheetReviews = pendingTimesheets.length;
  summary.teamOnLeaveToday = {
    count: onLeave.length,
    people: onLeave.map((row) => ({
      id: String(row.employeeId),
      name: peopleById.get(String(row.employeeId)) ?? "Unknown",
    })),
  };
  summary.teamHoursThisWeek = teamTimesheets.reduce((sum, row) => sum + row.hours, 0);

  return summary;
}
