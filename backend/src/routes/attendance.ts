import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import { authorize, PERMISSIONS, RESOURCES, type Actor } from "../auth/permissions.js";
import { ROLES } from "../auth/roles.js";
import { attendanceRepository } from "../repository/attendance.repository.js";
import { userRepository } from "../repository/user.repository.js";
import { applyLeaveForEmployee, parseLeaveDate } from "../services/leave.service.js";

export const attendanceRouter = Router();

function parseDate(value: unknown): Date | null {
  return parseLeaveDate(value);
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

function noStore(res: { setHeader: (name: string, value: string) => void }) {
  res.setHeader("Cache-Control", "no-store");
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

    noStore(res);
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

    const hasFrom = typeof req.query.from === "string" && req.query.from.trim();
    const hasTo = typeof req.query.to === "string" && req.query.to.trim();
    const from = hasFrom ? parseDate(req.query.from) : null;
    const to = hasTo ? parseDate(req.query.to) : null;

    if (hasFrom || hasTo) {
      if (!from || !to) {
        res.status(400).json({ error: "from and to dates are required" });
        return;
      }
      if (from.getTime() > to.getTime()) {
        res.status(400).json({ error: "from must be on or before to" });
        return;
      }
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

    const leaves =
      from && to
        ? await attendanceRepository.findByEmployeeInRange(requestedId, from, to)
        : await attendanceRepository.findByEmployeeId(requestedId);
    noStore(res);
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

    const result = await applyLeaveForEmployee({
      employeeId: actor.id,
      from: req.body?.from,
      to: req.body?.to,
      leaveType: req.body?.leaveType,
      description: req.body?.description,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(201).json({ leaves: await withEmployees(result.leaves) });
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
