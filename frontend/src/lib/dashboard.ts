import type { LeaveType } from "./attendance";

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
  leaveType: LeaveType | string;
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

export const LEAVE_BALANCE_TYPES = [
  { key: "PL" as const, label: "Paid leave" },
  { key: "SL" as const, label: "Sick leave" },
  { key: "CL" as const, label: "Casual leave" },
  { key: "OL" as const, label: "Optional leave" },
];
