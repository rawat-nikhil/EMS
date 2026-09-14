import { Timesheet, type TimesheetDoc, type TimesheetStatus } from "../models/Timesheet.js";
import { startOfUtcDay, toPlain } from "../utils/serialize.js";

export type TimesheetRecord = TimesheetDoc;

export type CreateTimesheetInput = {
  employeeId: string;
  description?: string;
  date: Date;
  status?: TimesheetStatus;
  approvedBy?: string;
};

export type UpdateTimesheetInput = Partial<
  Pick<CreateTimesheetInput, "description" | "date" | "status" | "approvedBy">
>;

function withNormalizedDate<T extends { date?: Date }>(data: T): T {
  if (!data.date) {
    return data;
  }
  return { ...data, date: startOfUtcDay(data.date) };
}

export const timesheetRepository = {
  async create(data: CreateTimesheetInput): Promise<TimesheetRecord> {
    const doc = await Timesheet.create(withNormalizedDate(data));
    return toPlain<TimesheetRecord>(doc) as TimesheetRecord;
  },

  async findById(id: string): Promise<TimesheetRecord | null> {
    const doc = await Timesheet.findById(id);
    return toPlain<TimesheetRecord>(doc);
  },

  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<TimesheetRecord | null> {
    const doc = await Timesheet.findOne({
      employeeId,
      date: startOfUtcDay(date),
    });
    return toPlain<TimesheetRecord>(doc);
  },

  async findByEmployeeId(employeeId: string): Promise<TimesheetRecord[]> {
    const docs = await Timesheet.find({ employeeId }).sort({ date: -1 });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async updateById(id: string, data: UpdateTimesheetInput): Promise<TimesheetRecord | null> {
    const doc = await Timesheet.findByIdAndUpdate(id, withNormalizedDate(data), {
      new: true,
      runValidators: true,
    });
    return toPlain<TimesheetRecord>(doc);
  },
};
