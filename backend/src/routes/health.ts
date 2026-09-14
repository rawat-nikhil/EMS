import { Router } from "express";
import { getDbStatus } from "../config/db.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    db: getDbStatus(),
  });
});
