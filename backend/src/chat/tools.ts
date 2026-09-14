import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { companyPolicies } from "../config/policies.js";
import { attendanceRepository } from "../repository/attendance.repository.js";
import { applyLeaveForEmployee } from "../services/leave.service.js";
import { timesheetRepository } from "../repository/timesheet.repository.js";
import { userRepository } from "../repository/user.repository.js";
import { companyCalendarDate, toDateKey, utcQuarterRange, utcWeekRange } from "./dates.js";

const LEAVE_LABELS = {
  paid: "PL",
  sick: "SL",
  casual: "CL",
  optional: "OL",
} as const;

type LeaveKey = keyof typeof LEAVE_LABELS;

export const chatTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_my_profile",
      description:
        "Get the signed-in employee's profile: name, username, role, active status, manager name, and created date. Does not include email or password.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leave_policy",
      description: "Get company quarterly leave entitlements (PL, SL, CL, OL) and total cap.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_leave_balance",
      description:
        "Get the signed-in employee's leave used and remaining for the current calendar quarter. Used counts approved and pending leave only.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_timesheet_due",
      description:
        "Get the signed-in employee's current Monday–Sunday timesheet week: days still due (no row) and filled days with status and hours.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_date",
      description:
        "Get the real calendar date in Asia/Kolkata: today, tomorrow, weekday, and timezone. Call this before applying leave when the user says today, tomorrow, next week, or N days, instead of guessing YYYY-MM-DD.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_my_leave",
      description:
        "Apply pending leave for the signed-in employee only. Creates one pending row per inclusive UTC day. Manager still approves. Do not pass an employee id.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Start date YYYY-MM-DD (inclusive).",
          },
          to: {
            type: "string",
            description: "End date YYYY-MM-DD (inclusive). Same as from for a single day.",
          },
          leaveType: {
            type: "string",
            enum: ["sick", "paid", "casual", "optional"],
            description: "Leave type: sick/SL, paid/PL, casual/CL, optional/OL.",
          },
          description: {
            type: "string",
            description: "Optional note for the leave request.",
          },
        },
        required: ["from", "to", "leaveType"],
        additionalProperties: false,
      },
    },
  },
];

function parseToolArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export async function runChatTool(name: string, employeeId: string, rawArgs?: string): Promise<string> {
  if (name === "get_my_profile") {
    const user = await userRepository.findById(employeeId);
    if (!user) {
      return JSON.stringify({ error: "User not found" });
    }
    let managerName: string | null = null;
    if (user.managerId) {
      const manager = await userRepository.findById(String(user.managerId));
      managerName = manager?.name ?? null;
    }
    return JSON.stringify({
      name: user.name,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      managerName,
      createdAt: user.createdAt,
    });
  }

  if (name === "get_current_date") {
    return JSON.stringify(companyCalendarDate());
  }

  if (name === "get_leave_policy") {
    return JSON.stringify({
      quarterDefinition: companyPolicies.attendance.quarterDefinition,
      maxLeaveDaysPerQuarter: companyPolicies.attendance.maxLeaveDaysPerQuarter,
      perTypePerQuarter: {
        PL: companyPolicies.attendance.perTypePerQuarter.paid,
        SL: companyPolicies.attendance.perTypePerQuarter.sick,
        CL: companyPolicies.attendance.perTypePerQuarter.casual,
        OL: companyPolicies.attendance.perTypePerQuarter.optional,
      },
    });
  }

  if (name === "get_my_leave_balance") {
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
    const remainingByType = (Object.keys(usedByType) as LeaveKey[]).reduce(
      (acc, key) => {
        acc[LEAVE_LABELS[key]] = Math.max(0, companyPolicies.attendance.perTypePerQuarter[key] - usedByType[key]);
        return acc;
      },
      {} as Record<string, number>,
    );
    return JSON.stringify({
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
    });
  }

  if (name === "get_my_timesheet_due") {
    const { from, to, days } = utcWeekRange();
    const rows = await timesheetRepository.findByEmployeeInRange(employeeId, from, to);
    const byDate = new Map(rows.map((row) => [toDateKey(new Date(row.date)), row]));
    const due: string[] = [];
    const filled: { date: string; hours: number; status: string }[] = [];
    for (const day of days) {
      const key = toDateKey(day);
      const row = byDate.get(key);
      if (!row) {
        due.push(key);
      } else {
        filled.push({ date: key, hours: row.hours, status: row.status });
      }
    }
    return JSON.stringify({
      weekFrom: toDateKey(from),
      weekTo: toDateKey(to),
      due,
      filled,
      maxHoursPerWeek: companyPolicies.timesheet.maxHoursPerWeek,
    });
  }

  if (name === "apply_my_leave") {
    const args = parseToolArgs(rawArgs);
    const result = await applyLeaveForEmployee({
      employeeId,
      from: args.from,
      to: args.to,
      leaveType: args.leaveType,
      description: args.description,
    });
    if (!result.ok) {
      return JSON.stringify({ error: result.error, status: result.status });
    }
    return JSON.stringify({
      status: "pending",
      message: "Leave applied and is pending manager approval.",
      leaves: result.leaves.map((leave) => ({
        date: toDateKey(new Date(leave.date)),
        leaveType: leave.leaveType,
        status: leave.status,
      })),
    });
  }

  return JSON.stringify({ error: `Unknown tool ${name}` });
}
