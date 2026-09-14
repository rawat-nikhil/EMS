"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Clock, LayoutDashboard, ScrollText } from "lucide-react";
import { cn } from "cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/timesheet", label: "Timesheet", icon: Clock },
  { href: "/policy", label: "Policy", icon: ScrollText },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
