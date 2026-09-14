export type ChatSessionMessage = { role: "user" | "assistant"; content: string };

const PREFIX = "ems_chat_";
const MAX_TURNS = 40;

export function chatStorageKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function loadChatSession(userId: string): ChatSessionMessage[] {
  try {
    const raw = localStorage.getItem(chatStorageKey(userId));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const turns: ChatSessionMessage[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const role = "role" in item ? item.role : null;
      const content = "content" in item ? item.content : null;
      if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
        turns.push({ role, content });
      }
    }
    return turns.slice(-MAX_TURNS);
  } catch {
    return [];
  }
}

export function saveChatSession(userId: string, messages: ChatSessionMessage[]): void {
  localStorage.setItem(chatStorageKey(userId), JSON.stringify(messages.slice(-MAX_TURNS)));
}

export function clearAllChatSessions(): void {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(PREFIX)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
