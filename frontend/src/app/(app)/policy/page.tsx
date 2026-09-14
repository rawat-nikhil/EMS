"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { api, ApiError } from "@/lib/api";
import { LEAVE_TYPE_POLICY_LABELS, type CompanyPolicies } from "@/lib/policies";
import { useAuth } from "@/context/auth-context";

export default function PolicyPage() {
  const { token } = useAuth();
  const [policies, setPolicies] = useState<CompanyPolicies | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    void (async () => {
      try {
        setError(null);
        const data = await api<CompanyPolicies>("/api/policies", { token });
        setPolicies(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load policies");
      }
    })();
  }, [token]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-medium">Policy</h1>
        <p className="text-muted-foreground">Company attendance and timesheet rules. Read only.</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!policies && !error ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {policies ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance policy</CardTitle>
              <CardDescription>{policies.attendance.quarterDefinition}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm">
                Maximum leave days per quarter (all types):{" "}
                <span className="font-medium">{policies.attendance.maxLeaveDaysPerQuarter}</span>
              </p>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 font-medium">Days / quarter</th>
                  </tr>
                </thead>
                <tbody>
                  {LEAVE_TYPE_POLICY_LABELS.map((item) => (
                    <tr key={item.key} className="border-b last:border-0">
                      <td className="py-2 pr-3">{item.label}</td>
                      <td className="py-2 pr-3">{item.short}</td>
                      <td className="py-2">{policies.attendance.perTypePerQuarter[item.key]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {policies.attendance.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Timesheet policy</CardTitle>
              <CardDescription>Week: {policies.timesheet.week}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Min hours / day</dt>
                  <dd className="font-medium">{policies.timesheet.minHoursPerDay}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Max hours / day</dt>
                  <dd className="font-medium">{policies.timesheet.maxHoursPerDay}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Max hours / week</dt>
                  <dd className="font-medium">{policies.timesheet.maxHoursPerWeek}</dd>
                </div>
              </dl>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {policies.timesheet.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
