"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/organisms/app-shell";
import { useAuth } from "@/context/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}
