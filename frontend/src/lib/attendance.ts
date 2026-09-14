export const LEAVE_TYPES = ["sick", "paid", "casual", "optional"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const ATTENDANCE_STATUSES = ["pending", "approved", "rejected"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type LeaveEmployee = {
  id: string;
  name: string;
  email: string;
};

export type LeaveRecord = {
  id: string;
  employeeId: string;
  description: string;
  leaveType: LeaveType;
  date: string;
  status: AttendanceStatus;
  approvedBy?: string;
  employee?: LeaveEmployee | null;
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: "Sick",
  paid: "Paid",
  casual: "Casual",
  optional: "Optional",
};

export {
  monthCells,
  monthRangeIso,
  toDateKey,
} from "./dates";
