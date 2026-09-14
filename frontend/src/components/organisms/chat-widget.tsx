"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { loadChatSession, saveChatSession, type ChatSessionMessage } from "@/lib/chat-session";
import { dispatchRefreshAttendance } from "@/lib/refresh-events";
import { cn } from "cn";

type ChatMessage = ChatSessionMessage;

const SUGGESTIONS = [
  "How many PL do I have left?",
  "What timesheet is due?",
  "Apply sick leave tomorrow",
];

export function ChatWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    user?.id ? loadChatSession(user.id) : [],
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function persist(next: ChatMessage[]) {
    setMessages(next);
    if (user?.id) {
      saveChatSession(user.id, next);
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || !token || sending) {
      return;
    }
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    persist(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const data = await api<{ reply: string }>("/api/chat", {
        method: "POST",
        token,
        body: { messages: nextMessages },
      });
      persist([...nextMessages, { role: "assistant", content: data.reply }]);
      dispatchRefreshAttendance();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 503
          ? "OpenAI is not configured yet. Add OPENAI_API_KEY to the backend .env and restart."
          : err instanceof ApiError
            ? err.message
            : "Unable to send message";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="pointer-events-auto flex h-112 w-88 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-medium">EMS assistant</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close chat">
              <X />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask about your leave balance or timesheet due this week.
              </p>
            ) : null}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.content}
              </div>
            ))}
            {sending ? <p className="text-xs text-muted-foreground">Thinking…</p> : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {messages.length === 0 ? (
              <div className="mt-auto flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => void send(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <form className="flex gap-2 border-t p-2" onSubmit={onSubmit}>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question"
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Send">
              <Send />
            </Button>
          </form>
        </div>
      ) : null}
      <Button
        type="button"
        size="icon-lg"
        className="pointer-events-auto rounded-full shadow-lg"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <MessageCircle />
      </Button>
    </div>
  );
}
