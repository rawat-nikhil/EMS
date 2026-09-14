import { ROLES, type Role } from "../auth/roles.js";
import { User, type UserDoc } from "../models/User.js";
import { toPlain } from "../utils/serialize.js";

export type UserRecord = UserDoc;

export type CreateUserInput = {
  email: string;
  username: string;
  name: string;
  passwordHash: string;
  role: Role;
  isActive?: boolean;
  managerId?: string;
};

export type UpdateUserInput = Partial<
  Pick<CreateUserInput, "email" | "username" | "name" | "passwordHash" | "role" | "isActive" | "managerId">
>;

export const userRepository = {
  async count(): Promise<number> {
    return User.countDocuments();
  },

  async create(data: CreateUserInput): Promise<UserRecord> {
    const doc = await User.create({
      ...data,
      managerId: data.managerId,
    });
    return toPlain<UserRecord>(doc) as UserRecord;
  },

  async findById(id: string): Promise<UserRecord | null> {
    const doc = await User.findById(id);
    return toPlain<UserRecord>(doc);
  },

  async findByIds(ids: string[]): Promise<UserRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const docs = await User.find({ _id: { $in: ids } });
    return docs.map((doc) => toPlain<UserRecord>(doc) as UserRecord);
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const doc = await User.findOne({ email: email.toLowerCase().trim() });
    return toPlain<UserRecord>(doc);
  },

  async findByEmailWithPassword(
    email: string,
  ): Promise<(UserRecord & { passwordHash: string }) | null> {
    const doc = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!doc) {
      return null;
    }
    const plain = toPlain<UserRecord>(doc);
    if (!plain) {
      return null;
    }
    return { ...plain, passwordHash: doc.passwordHash };
  },

  async findReports(managerId: string): Promise<UserRecord[]> {
    const docs = await User.find({ managerId });
    return docs.map((doc) => toPlain<UserRecord>(doc) as UserRecord);
  },

  async existsManagedEmployee(managerId: string, employeeId: string): Promise<boolean> {
    const found = await User.exists({
      _id: employeeId,
      role: ROLES.EMPLOYEE,
      managerId,
    });
    return found !== null;
  },

  async updateById(id: string, data: UpdateUserInput): Promise<UserRecord | null> {
    const doc = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return toPlain<UserRecord>(doc);
  },
};
