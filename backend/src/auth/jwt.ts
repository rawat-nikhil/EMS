import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Actor } from "./permissions.js";

export function signToken(actor: Actor): string {
  return jwt.sign({ id: actor.id, role: actor.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): Actor {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === "string" || typeof payload.id !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid token");
  }
  return { id: payload.id, role: payload.role as Actor["role"] };
}
