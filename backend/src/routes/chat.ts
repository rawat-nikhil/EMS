import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import { runChatAgent, type ChatTurn } from "../chat/agent.js";

export const chatRouter = Router();

chatRouter.use(authenticate);

function parseHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim()
    ) {
      turns.push({ role: item.role, content: item.content.trim() });
    }
  }
  return turns.slice(-12);
}

chatRouter.post("/", async (req, res, next) => {
  try {
    const actor = req.user;
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const history = parseHistory(req.body?.messages);
    if (history.length === 0 || history[history.length - 1]?.role !== "user") {
      res.status(400).json({ error: "A user message is required" });
      return;
    }
    const reply = await runChatAgent(actor.id, history);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});
