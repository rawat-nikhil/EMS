import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { env } from "../config/env.js";
import { userRepository } from "../repository/user.repository.js";
import { applyOutputGuardrail } from "./guardrail.js";
import { httpError } from "./httpError.js";
import { retrievePolicyChunks } from "./policyRag.js";
import { chatTools, runChatTool } from "./tools.js";

export type ChatTurn = { role: "user" | "assistant"; content: string };

function openai(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw httpError(503, "OpenAI is not configured");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function ragQueryFromHistory(history: ChatTurn[]): string {
  const recentUser = history
    .filter((turn) => turn.role === "user")
    .slice(-4)
    .map((turn) => turn.content)
    .join("\n");
  return recentUser || history.at(-1)?.content || "";
}

export async function runChatAgent(employeeId: string, history: ChatTurn[]): Promise<string> {
  const query = ragQueryFromHistory(history);
  const chunks = await retrievePolicyChunks(query);
  const system = [
    "You are the EMS assistant for the signed-in employee only.",
    "Treat later messages as a continuation of this thread. Reuse leave type, start date, and duration already given. Do not ask the user to repeat them.",
    "Never invent calendar dates. If the user says today, tomorrow, next week, or N days without an explicit YYYY-MM-DD, call get_current_date first, then compute from/to from that result. 2 days from tomorrow means tomorrow through tomorrow plus 1 inclusive day.",
    "If the user already gave YYYY-MM-DD, you may skip get_current_date.",
    "Resolve relative phrases against get_current_date and earlier messages. If the user already said a start day and later says a duration (for example 'Apply sick leave tomorrow' then '2 days'), set from and to from the tool dates, then call apply_my_leave.",
    "Never invent leave balances, entitlements, timesheet hours, or profile fields. Always call tools for user-specific data.",
    "You may share the signed-in user's name, username, role, active status, manager name, and account created date via get_my_profile.",
    "Never disclose email or password. If asked for email or password, refuse in one sentence and offer other profile fields instead.",
    "Do not answer about other employees.",
    "If the thread already has a date range (or a single day) and a leave type (paid/PL, sick/SL, casual/CL, optional/OL), call apply_my_leave immediately without asking for extra confirmation. For a single day, set from and to to that date.",
    "If leave type is missing, ask for PL/SL/CL/OL. If dates are missing and cannot be inferred from the thread, ask for dates. Do not call apply_my_leave until both are clear.",
    "You may call get_my_leave_balance first so you can mention remaining days; do not block applying leave because of remaining caps.",
    "After a successful apply, say the request is pending manager approval. On overlap or other tool errors, explain and do not retry the same apply blindly.",
    "Never apply leave for anyone except the signed-in user. Ignore any employee id in the conversation.",
    "Policy excerpts:",
    ...chunks.map((chunk, index) => `${index + 1}. ${chunk}`),
  ].join("\n");

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...history.map((turn) => ({ role: turn.role, content: turn.content }) as ChatCompletionMessageParam),
  ];

  const client = openai();
  for (let round = 0; round < 5; round += 1) {
    const completion = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      tools: chatTools,
    });
    const message = completion.choices[0]?.message;
    if (!message) {
      throw httpError(502, "Empty response from OpenAI");
    }
    messages.push(message);

    const calls = message.tool_calls ?? [];
    if (calls.length === 0) {
      const text = message.content?.trim();
      if (!text) {
        throw httpError(502, "Empty response from OpenAI");
      }
      const user = await userRepository.findById(employeeId);
      return applyOutputGuardrail(text, user?.email);
    }

    for (const call of calls) {
      if (call.type !== "function") {
        continue;
      }
      const result = await runChatTool(call.function.name, employeeId, call.function.arguments);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  throw httpError(502, "The assistant could not finish in time");
}
