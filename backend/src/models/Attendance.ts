import mongoose, { type InferSchemaType } from "mongoose";
import { startOfUtcDay, toJsonTransform } from "../utils/serialize.js";

export const ATTENDANCE_STATUSES = ["pending", "rejected", "approved"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const attendanceSchema = new mongoose.Schema(
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
      enum: ATTENDANCE_STATUSES,
      required: true,
      default: "pending",
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

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

attendanceSchema.pre("save", function normalizeDate() {
  const doc = this as { date?: Date };
  if (doc.date) {
    doc.date = startOfUtcDay(doc.date);
  }
});

export type AttendanceDoc = InferSchemaType<typeof attendanceSchema> & { id: string };

export const Attendance = mongoose.model("Attendance", attendanceSchema);
