import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
}

export function getDbStatus(): string {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };
  return states[mongoose.connection.readyState] ?? "unknown";
}
