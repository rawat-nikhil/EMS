"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { useAuth } from "@/context/auth-context";

export function TopNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-background px-6">
      <p className="text-sm font-medium tracking-wide uppercase">EMS</p>
      <div className="flex items-center gap-3">
        {user ? <p className="text-sm text-muted-foreground">{user.name}</p> : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            router.replace("/");
          }}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
