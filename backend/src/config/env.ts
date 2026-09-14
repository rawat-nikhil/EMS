import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { required, optional } from "../utils/env.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  MONGODB_URI: required("MONGODB_URI"),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  OPENAI_API_KEY: optional("OPENAI_API_KEY"),
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};
