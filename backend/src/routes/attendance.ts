import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import { authorize, PERMISSIONS, RESOURCES, type Actor } from "../auth/permissions.js";
import { ROLES } from "../auth/roles.js";
import { LEAVE_TYPES, type LeaveType } from "../models/Attendance.js";
import { attendanceRepository } from "../repository/attendance.repository.js";
import { userRepository } from "../repository/user.repository.js";
import { eachUtcDay, startOfUtcDay } from "../utils/serialize.js";

export const attendanceRouter = Router();

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return startOfUtcDay(parsed);
}

function isLeaveType(value: unknown): value is LeaveType {
  return typeof value === "string" && (LEAVE_TYPES as readonly string[]).includes(value);
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000;
}

function publicEmployee(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

async function withEmployees<T extends { employeeId: unknown }>(rows: T[]) {
  const ids = [...new Set(rows.map((row) => String(row.employeeId)))];
  const users = await userRepository.findByIds(ids);
  const byId = new Map(users.map((user) => [user.id, user]));
  return rows.map((row) => {
    const employee = byId.get(String(row.employeeId));
    return {
      ...row,
      employee: employee ? publicEmployee(employee) : null,
    };
  });
}

async function requireActor(req: { user?: Actor }) {
  return req.user ?? null;
}

attendanceRouter.use(authenticate);

attendanceRouter.get("/pending", async (req, res, next) => {
  try {
    const actor = await requireActor(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (actor.role === ROLES.EMPLOYEE) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const pending =
      actor.role === ROLES.ADMIN
        ? await attendanceRepository.findAllPending()
        : await attendanceRepository.findPendingByEmployeeIds(
            (await userRepository.findReports(actor.id)).map((user) => user.id),
          );

    res.json({ leaves: await withEmployees(pending) });
  } catch (err) {
    next(err);
  }
});

attendanceRouter.get("/", async (req, res, next) => {
  try {
    const actor = await requireActor(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (!from || !to) {
      res.status(400).json({ error: "from and to dates are required" });
      return;
    }
    if (from.getTime() > to.getTime()) {
      res.status(400).json({ error: "from must be on or before to" });
      return;
    }

    const requestedId =
      typeof req.query.employeeId === "string" && req.query.employeeId.trim()
        ? req.query.employeeId.trim()
        : actor.id;

    const allowed = await authorize(actor, PERMISSIONS.GET, RESOURCES.ATTENDANCE, requestedId);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const leaves = await attendanceRepository.findByEmployeeInRange(requestedId, from, to);
    res.json({ leaves: await withEmployees(leaves) });
  } catch (err) {
    next(err);
  }
});

attendanceRouter.post("/", async (req, res, next) => {
  try {
    const actor = await requireActor(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const allowed = await authorize(actor, PERMISSIONS.ADD, RESOURCES.ATTENDANCE, actor.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const from = parseDate(req.body?.from);
    const to = parseDate(req.body?.to);
    const leaveType = req.body?.leaveType;
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";

    if (!from || !to) {
      res.status(400).json({ error: "from and to dates are required" });
      return;
    }
    if (from.getTime() > to.getTime()) {
      res.status(400).json({ error: "from must be on or before to" });
      return;
    }
    if (!isLeaveType(leaveType)) {
      res.status(400).json({ error: "A valid leave type is required" });
      return;
    }

    const overlap = await attendanceRepository.findOverlapping(actor.id, from, to);
    if (overlap.length > 0) {
      res.status(409).json({ error: "Leave already exists for one or more dates" });
      return;
    }

    const days = eachUtcDay(from, to);
    try {
      const leaves = await attendanceRepository.createMany(
        days.map((date) => ({
          employeeId: actor.id,
          date,
          leaveType,
          description,
          status: "pending" as const,
        })),
      );
      res.status(201).json({ leaves: await withEmployees(leaves) });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        res.status(409).json({ error: "Leave already exists for one or more dates" });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

attendanceRouter.patch("/:id/review", async (req, res, next) => {
  try {
    const actor = await requireActor(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (actor.role === ROLES.EMPLOYEE) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const status = req.body?.status;
    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ error: "status must be approved or rejected" });
      return;
    }

    const existing = await attendanceRepository.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const employeeId = String(existing.employeeId);
    if (employeeId === actor.id) {
      res.status(403).json({ error: "You cannot review your own leave" });
      return;
    }

    const allowed = await authorize(actor, PERMISSIONS.UPDATE, RESOURCES.ATTENDANCE, employeeId);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (existing.status !== "pending") {
      res.status(409).json({ error: "Leave has already been reviewed" });
      return;
    }

    const leave = await attendanceRepository.updateById(existing.id, {
      status,
      approvedBy: actor.id,
    });
    res.json({ leave: (await withEmployees(leave ? [leave] : []))[0] });
  } catch (err) {
    next(err);
  }
});
