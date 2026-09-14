import mongoose, { type InferSchemaType } from "mongoose";
import { startOfUtcDay, toJsonTransform } from "../utils/serialize.js";

export const TIMESHEET_STATUSES = ["pending", "not_filled", "approved"] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

const timesheetSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: TIMESHEET_STATUSES,
      required: true,
      default: "not_filled",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform(),
    },
  },
);

timesheetSchema.index({ employeeId: 1, date: 1 }, { unique: true });

timesheetSchema.pre("save", function normalizeDate() {
  const doc = this as { date?: Date };
  if (doc.date) {
    doc.date = startOfUtcDay(doc.date);
  }
});

export type TimesheetDoc = InferSchemaType<typeof timesheetSchema> & { id: string };

export const Timesheet = mongoose.model("Timesheet", timesheetSchema);
