import {
  Attendance,
  type AttendanceDoc,
  type AttendanceStatus,
  type LeaveType,
} from "../models/Attendance.js";
import { startOfUtcDay, toPlain } from "../utils/serialize.js";

export type AttendanceRecord = AttendanceDoc;

export type CreateAttendanceInput = {
  employeeId: string;
  description?: string;
  leaveType: LeaveType;
  date: Date;
  status?: AttendanceStatus;
  approvedBy?: string;
};

export type UpdateAttendanceInput = Partial<
  Pick<CreateAttendanceInput, "description" | "leaveType" | "date" | "status" | "approvedBy">
>;

function withNormalizedDate<T extends { date?: Date }>(data: T): T {
  if (!data.date) {
    return data;
  }
  return { ...data, date: startOfUtcDay(data.date) };
}

export const attendanceRepository = {
  async create(data: CreateAttendanceInput): Promise<AttendanceRecord> {
    const doc = await Attendance.create(withNormalizedDate(data));
    return toPlain<AttendanceRecord>(doc) as AttendanceRecord;
  },

  async createMany(rows: CreateAttendanceInput[]): Promise<AttendanceRecord[]> {
    const docs = await Attendance.insertMany(rows.map((row) => withNormalizedDate(row)));
    return docs.map((doc) => toPlain<AttendanceRecord>(doc) as AttendanceRecord);
  },

  async findById(id: string): Promise<AttendanceRecord | null> {
    const doc = await Attendance.findById(id);
    return toPlain<AttendanceRecord>(doc);
  },

  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceRecord | null> {
    const doc = await Attendance.findOne({
      employeeId,
      date: startOfUtcDay(date),
    });
    return toPlain<AttendanceRecord>(doc);
  },

  async findByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    const docs = await Attendance.find({ employeeId }).sort({ date: -1 });
    return docs.map((doc) => toPlain<AttendanceRecord>(doc) as AttendanceRecord);
  },

  async findByEmployeeInRange(employeeId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    const docs = await Attendance.find({
      employeeId,
      date: { $gte: startOfUtcDay(from), $lte: startOfUtcDay(to) },
    }).sort({ date: 1 });
    return docs.map((doc) => toPlain<AttendanceRecord>(doc) as AttendanceRecord);
  },

  async findOverlapping(employeeId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    return this.findByEmployeeInRange(employeeId, from, to);
  },

  async findPendingByEmployeeIds(employeeIds: string[]): Promise<AttendanceRecord[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    const docs = await Attendance.find({
      employeeId: { $in: employeeIds },
      status: "pending",
    }).sort({ date: 1 });
    return docs.map((doc) => toPlain<AttendanceRecord>(doc) as AttendanceRecord);
  },

  async findAllPending(): Promise<AttendanceRecord[]> {
    const docs = await Attendance.find({ status: "pending" }).sort({ date: 1 });
    return docs.map((doc) => toPlain<AttendanceRecord>(doc) as AttendanceRecord);
  },

  async updateById(id: string, data: UpdateAttendanceInput): Promise<AttendanceRecord | null> {
    const doc = await Attendance.findByIdAndUpdate(id, withNormalizedDate(data), {
      new: true,
      runValidators: true,
    });
    return toPlain<AttendanceRecord>(doc);
  },
};
