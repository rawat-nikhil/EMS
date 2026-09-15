import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { LEAVE_BALANCE_TYPES, type LeaveBalance } from "@/lib/dashboard";

export function DashboardLeaveCard({ leaveBalance }: { leaveBalance: LeaveBalance }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave this quarter</CardTitle>
        <CardDescription>
          {leaveBalance.quarter} · {leaveBalance.remaining.total} of {leaveBalance.entitlements.total} days left
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {LEAVE_BALANCE_TYPES.map((item) => {
          const remaining = leaveBalance.remaining[item.key];
          const entitlement = leaveBalance.entitlements[item.key];
          const used = leaveBalance.used[item.key];
          const pct = entitlement > 0 ? Math.min(100, Math.round((remaining / entitlement) * 100)) : 0;
          return (
            <div key={item.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {item.key} · {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {remaining} left · {used}/{entitlement} used
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-chart-1" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <Link href="/attendance" className="pt-1 text-sm font-medium text-primary hover:underline">
          Apply or track leave
        </Link>
      </CardContent>
    </Card>
  );
}
