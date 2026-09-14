import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { attendanceRouter } from "./routes/attendance.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { policiesRouter } from "./routes/policies.js";
import { timesheetRouter } from "./routes/timesheet.js";

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/timesheets", timesheetRouter);
app.use("/api/policies", policiesRouter);

app.use(notFound);
app.use(errorHandler);
