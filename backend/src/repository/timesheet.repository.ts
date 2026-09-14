import { Timesheet, type TimesheetDoc, type TimesheetStatus } from "../models/Timesheet.js";
import { startOfUtcDay, toPlain } from "../utils/serialize.js";

export type TimesheetRecord = TimesheetDoc;

export type CreateTimesheetInput = {
  employeeId: string;
  description?: string;
  hours: number;
  date: Date;
  status?: TimesheetStatus;
  approvedBy?: string;
};

export type UpdateTimesheetInput = Partial<
  Pick<CreateTimesheetInput, "description" | "hours" | "date" | "status" | "approvedBy">
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

  async findByEmployeeInRange(employeeId: string, from: Date, to: Date): Promise<TimesheetRecord[]> {
    const docs = await Timesheet.find({
      employeeId,
      date: { $gte: startOfUtcDay(from), $lte: startOfUtcDay(to) },
    }).sort({ date: 1 });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async findByEmployeeIdsInRange(
    employeeIds: string[],
    from: Date,
    to: Date,
  ): Promise<TimesheetRecord[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    const docs = await Timesheet.find({
      employeeId: { $in: employeeIds },
      date: { $gte: startOfUtcDay(from), $lte: startOfUtcDay(to) },
    }).sort({ date: 1 });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async findInRange(from: Date, to: Date): Promise<TimesheetRecord[]> {
    const docs = await Timesheet.find({
      date: { $gte: startOfUtcDay(from), $lte: startOfUtcDay(to) },
    }).sort({ date: 1 });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async findApprovedInDates(employeeId: string, dates: Date[]): Promise<TimesheetRecord[]> {
    if (dates.length === 0) {
      return [];
    }
    const docs = await Timesheet.find({
      employeeId,
      status: "approved",
      date: { $in: dates.map((date) => startOfUtcDay(date)) },
    });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async findPendingByEmployeeIds(employeeIds: string[]): Promise<TimesheetRecord[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    const docs = await Timesheet.find({
      employeeId: { $in: employeeIds },
      status: "pending",
    }).sort({ date: 1 });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async findAllPending(): Promise<TimesheetRecord[]> {
    const docs = await Timesheet.find({ status: "pending" }).sort({ date: 1 });
    return docs.map((doc) => toPlain<TimesheetRecord>(doc) as TimesheetRecord);
  },

  async upsertPending(data: CreateTimesheetInput): Promise<TimesheetRecord> {
    const normalized = withNormalizedDate(data);
    const doc = await Timesheet.findOneAndUpdate(
      { employeeId: normalized.employeeId, date: normalized.date },
      {
        $set: {
          hours: normalized.hours,
          description: normalized.description ?? "",
          status: "pending",
        },
        $unset: { approvedBy: 1 },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return toPlain<TimesheetRecord>(doc) as TimesheetRecord;
  },

  async upsertManyPending(rows: CreateTimesheetInput[]): Promise<TimesheetRecord[]> {
    const results: TimesheetRecord[] = [];
    for (const row of rows) {
      results.push(await this.upsertPending(row));
    }
    return results;
  },

  async updateById(id: string, data: UpdateTimesheetInput): Promise<TimesheetRecord | null> {
    const doc = await Timesheet.findByIdAndUpdate(id, withNormalizedDate(data), {
      new: true,
      runValidators: true,
    });
    return toPlain<TimesheetRecord>(doc);
  },
};
