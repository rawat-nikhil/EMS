import mongoose, { type InferSchemaType } from "mongoose";
import { ROLE_VALUES, type Role } from "../auth/roles.js";
import { toJsonTransform } from "../utils/serialize.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      default: "employee",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: toJsonTransform(["passwordHash"]),
    },
  },
);

userSchema.index({ managerId: 1, role: 1 });

export type UserRole = Role;
export type UserDoc = InferSchemaType<typeof userSchema> & { id: string };

export const User = mongoose.model("User", userSchema);
