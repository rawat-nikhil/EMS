import { Attendance, type AttendanceDoc, type AttendanceStatus } from "../models/Attendance.js";
import { startOfUtcDay, toPlain } from "../utils/serialize.js";

export type AttendanceRecord = AttendanceDoc;

export type CreateAttendanceInput = {
  employeeId: string;
  description?: string;
  date: Date;
  status?: AttendanceStatus;
  approvedBy?: string;
};

export type UpdateAttendanceInput = Partial<
  Pick<CreateAttendanceInput, "description" | "date" | "status" | "approvedBy">
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

  async updateById(id: string, data: UpdateAttendanceInput): Promise<AttendanceRecord | null> {
    const doc = await Attendance.findByIdAndUpdate(id, withNormalizedDate(data), {
      new: true,
      runValidators: true,
    });
    return toPlain<AttendanceRecord>(doc);
  },
};
