"use client";

import type { ReactNode } from "react";
import { ChatWidget } from "@/components/organisms/chat-widget";
import { SideNav } from "@/components/organisms/side-nav";
import { TopNav } from "@/components/organisms/top-nav";
import { useAuth } from "@/context/auth-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <div className="flex min-w-0 flex-1 flex-col bg-background">{children}</div>
      </div>
      <ChatWidget key={user?.id ?? "guest"} />
    </div>
  );
}
