import { LEAVE_TYPES, type LeaveType } from "../models/Attendance.js";
import { attendanceRepository, type AttendanceRecord } from "../repository/attendance.repository.js";
import { eachUtcDay, startOfUtcDay } from "../utils/serialize.js";

const LEAVE_ALIASES: Record<string, LeaveType> = {
  paid: "paid",
  sick: "sick",
  casual: "casual",
  optional: "optional",
  pl: "paid",
  sl: "sick",
  cl: "casual",
  ol: "optional",
};

export type ApplyLeaveInput = {
  employeeId: string;
  from: unknown;
  to: unknown;
  leaveType: unknown;
  description?: unknown;
};

export type ApplyLeaveSuccess = { ok: true; leaves: AttendanceRecord[] };
export type ApplyLeaveFailure = { ok: false; status: 400 | 409; error: string };
export type ApplyLeaveResult = ApplyLeaveSuccess | ApplyLeaveFailure;

export function parseLeaveDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return startOfUtcDay(parsed);
}

export function normalizeLeaveType(value: unknown): LeaveType | null {
  if (typeof value !== "string") {
    return null;
  }
  const mapped = LEAVE_ALIASES[value.toLowerCase().trim()];
  if (!mapped || !(LEAVE_TYPES as readonly string[]).includes(mapped)) {
    return null;
  }
  return mapped;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000;
}

export async function applyLeaveForEmployee(input: ApplyLeaveInput): Promise<ApplyLeaveResult> {
  const from = parseLeaveDate(input.from);
  const to = parseLeaveDate(input.to);
  const leaveType = normalizeLeaveType(input.leaveType);
  const description = typeof input.description === "string" ? input.description.trim() : "";

  if (!from || !to) {
    return { ok: false, status: 400, error: "from and to dates are required" };
  }
  if (from.getTime() > to.getTime()) {
    return { ok: false, status: 400, error: "from must be on or before to" };
  }
  if (!leaveType) {
    return { ok: false, status: 400, error: "A valid leave type is required" };
  }

  const overlap = await attendanceRepository.findOverlapping(input.employeeId, from, to);
  if (overlap.length > 0) {
    return { ok: false, status: 409, error: "Leave already exists for one or more dates" };
  }

  const days = eachUtcDay(from, to);
  try {
    const leaves = await attendanceRepository.createMany(
      days.map((date) => ({
        employeeId: input.employeeId,
        date,
        leaveType,
        description,
        status: "pending" as const,
      })),
    );
    return { ok: true, leaves };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return { ok: false, status: 409, error: "Leave already exists for one or more dates" };
    }
    throw err;
  }
}
