import OpenAI from "openai";
import { env } from "../config/env.js";
import { companyPolicies } from "../config/policies.js";
import { httpError } from "./httpError.js";

type Chunk = { id: string; text: string; embedding: number[] };

const POLICY_CHUNKS: { id: string; text: string }[] = [
  {
    id: "leave-entitlement",
    text: `Attendance leave entitlements per calendar quarter (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec). Maximum leave days of all types combined: ${companyPolicies.attendance.maxLeaveDaysPerQuarter}. Paid leave (PL): ${companyPolicies.attendance.perTypePerQuarter.paid} days. Sick leave (SL): ${companyPolicies.attendance.perTypePerQuarter.sick} days. Casual leave (CL): ${companyPolicies.attendance.perTypePerQuarter.casual} days. Optional leave (OL): ${companyPolicies.attendance.perTypePerQuarter.optional} days.`,
  },
  {
    id: "leave-notes",
    text: `Attendance policy notes: ${companyPolicies.attendance.notes.join(" ")}`,
  },
  {
    id: "timesheet-hours",
    text: `Timesheet policy: week is ${companyPolicies.timesheet.week}. Min hours per day ${companyPolicies.timesheet.minHoursPerDay}, max hours per day ${companyPolicies.timesheet.maxHoursPerDay}, max hours per week ${companyPolicies.timesheet.maxHoursPerWeek}.`,
  },
  {
    id: "timesheet-notes",
    text: `Timesheet policy notes: ${companyPolicies.timesheet.notes.join(" ")}`,
  },
];

let cache: Chunk[] | null = null;

function client(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw httpError(503, "OpenAI is not configured");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embed(texts: string[]): Promise<number[][]> {
  const response = await client().embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function loadChunks(): Promise<Chunk[]> {
  if (cache) {
    return cache;
  }
  const vectors = await embed(POLICY_CHUNKS.map((chunk) => chunk.text));
  cache = POLICY_CHUNKS.map((chunk, index) => ({
    ...chunk,
    embedding: vectors[index] ?? [],
  }));
  return cache;
}

export async function retrievePolicyChunks(query: string, k = 3): Promise<string[]> {
  const chunks = await loadChunks();
  const [queryVector] = await embed([query]);
  if (!queryVector) {
    return chunks.slice(0, k).map((chunk) => chunk.text);
  }
  return chunks
    .map((chunk) => ({ text: chunk.text, score: cosine(queryVector, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((item) => item.text);
}
