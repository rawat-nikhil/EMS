export type TimesheetEmployee = {
  id: string;
  name: string;
  email: string;
};

export const TIMESHEET_STATUSES = ["pending", "approved", "rejected"] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export type TimesheetRecord = {
  id: string;
  employeeId: string;
  description: string;
  hours: number;
  date: string;
  status: TimesheetStatus | "not_filled";
  approvedBy?: string;
  employee?: TimesheetEmployee | null;
};

export type WeekDayDraft = {
  date: string;
  hours: string;
  description: string;
};
