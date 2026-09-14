import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import { authorize, PERMISSIONS, RESOURCES, type Actor } from "../auth/permissions.js";
import { ROLES } from "../auth/roles.js";
import { timesheetRepository } from "../repository/timesheet.repository.js";
import { userRepository } from "../repository/user.repository.js";
import { isUtcMondayToSundayWeek, startOfUtcDay } from "../utils/serialize.js";

export const timesheetRouter = Router();

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

function requireActor(req: { user?: Actor }) {
  return req.user ?? null;
}

function parseHours(value: unknown): number | null {
  const hours = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(hours) || hours <= 0) {
    return null;
  }
  if (hours < 0.5 || hours > 24) {
    return null;
  }
  return hours;
}

timesheetRouter.use(authenticate);

timesheetRouter.get("/pending", async (req, res, next) => {
  try {
    const actor = requireActor(req);
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
        ? await timesheetRepository.findAllPending()
        : await timesheetRepository.findPendingByEmployeeIds(
            (await userRepository.findReports(actor.id)).map((user) => user.id),
          );

    res.json({ timesheets: await withEmployees(pending) });
  } catch (err) {
    next(err);
  }
});

timesheetRouter.get("/team", async (req, res, next) => {
  try {
    const actor = requireActor(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (actor.role === ROLES.EMPLOYEE) {
      res.status(403).json({ error: "Forbidden" });
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

    const timesheets =
      actor.role === ROLES.ADMIN
        ? await timesheetRepository.findInRange(from, to)
        : await timesheetRepository.findByEmployeeIdsInRange(
            (await userRepository.findReports(actor.id)).map((user) => user.id),
            from,
            to,
          );

    res.json({ timesheets: await withEmployees(timesheets) });
  } catch (err) {
    next(err);
  }
});

timesheetRouter.put("/week", async (req, res, next) => {
  try {
    const actor = requireActor(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const allowed = await authorize(actor, PERMISSIONS.ADD, RESOURCES.TIMESHEET, actor.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const from = parseDate(req.body?.from);
    const to = parseDate(req.body?.to);
    if (!from || !to || !isUtcMondayToSundayWeek(from, to)) {
      res.status(400).json({ error: "from and to must be a Monday to Sunday week" });
      return;
    }

    const rawDays = Array.isArray(req.body?.days) ? req.body.days : [];
    const days: { date: Date; hours: number; description: string }[] = [];
    for (const item of rawDays) {
      const date = parseDate(item?.date);
      const hours = parseHours(item?.hours);
      if (!date || hours === null) {
        continue;
      }
      if (date.getTime() < from.getTime() || date.getTime() > to.getTime()) {
        res.status(400).json({ error: "All days must fall within the submitted week" });
        return;
      }
      days.push({
        date,
        hours,
        description: typeof item?.description === "string" ? item.description.trim() : "",
      });
    }

    if (days.length === 0) {
      res.status(400).json({ error: "Enter hours for at least one day" });
      return;
    }

    const approved = await timesheetRepository.findApprovedInDates(
      actor.id,
      days.map((day) => day.date),
    );
    if (approved.length > 0) {
      res.status(409).json({ error: "One or more days are already approved" });
      return;
    }

    const timesheets = await timesheetRepository.upsertManyPending(
      days.map((day) => ({
        employeeId: actor.id,
        date: day.date,
        hours: day.hours,
        description: day.description,
        status: "pending",
      })),
    );
    res.json({ timesheets: await withEmployees(timesheets) });
  } catch (err) {
    next(err);
  }
});

timesheetRouter.get("/", async (req, res, next) => {
  try {
    const actor = requireActor(req);
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

    const allowed = await authorize(actor, PERMISSIONS.GET, RESOURCES.TIMESHEET, requestedId);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const timesheets = await timesheetRepository.findByEmployeeInRange(requestedId, from, to);
    res.json({ timesheets: await withEmployees(timesheets) });
  } catch (err) {
    next(err);
  }
});

timesheetRouter.patch("/:id/review", async (req, res, next) => {
  try {
    const actor = requireActor(req);
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

    const existing = await timesheetRepository.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const employeeId = String(existing.employeeId);
    if (employeeId === actor.id) {
      res.status(403).json({ error: "You cannot review your own timesheet" });
      return;
    }

    const allowed = await authorize(actor, PERMISSIONS.UPDATE, RESOURCES.TIMESHEET, employeeId);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (existing.status !== "pending") {
      res.status(409).json({ error: "Timesheet has already been reviewed" });
      return;
    }

    const timesheet = await timesheetRepository.updateById(existing.id, {
      status,
      approvedBy: actor.id,
    });
    res.json({ timesheet: (await withEmployees(timesheet ? [timesheet] : []))[0] });
  } catch (err) {
    next(err);
  }
});
