"use client";

import { useAuth } from "@/context/auth-context";

function formatRole(role: string): string {
  return role.replaceAll("_", " ");
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="flex flex-1 flex-col gap-2 p-8">
      <h1 className="text-2xl font-medium">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome{user ? `, ${user.name}` : ""} to EMS.
        {user ? ` Signed in as ${formatRole(user.role)}.` : ""}
      </p>
    </main>
  );
}
