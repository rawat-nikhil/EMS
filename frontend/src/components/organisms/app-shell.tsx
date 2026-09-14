import type { ReactNode } from "react";
import { SideNav } from "@/components/organisms/side-nav";
import { TopNav } from "@/components/organisms/top-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <div className="flex min-w-0 flex-1 flex-col bg-background">{children}</div>
      </div>
    </div>
  );
}
