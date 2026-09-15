import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import type { Actor } from "../auth/permissions.js";
import { getDashboardSummary } from "../services/dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/summary", async (req, res, next) => {
  try {
    const actor = req.user ?? null;
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.json(await getDashboardSummary(actor as Actor));
  } catch (err) {
    next(err);
  }
});
