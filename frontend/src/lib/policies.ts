export type CompanyPolicies = {
  attendance: {
    quarterDefinition: string;
    maxLeaveDaysPerQuarter: number;
    perTypePerQuarter: {
      paid: number;
      sick: number;
      casual: number;
      optional: number;
    };
    notes: readonly string[] | string[];
  };
  timesheet: {
    minHoursPerDay: number;
    maxHoursPerDay: number;
    maxHoursPerWeek: number;
    week: string;
    notes: readonly string[] | string[];
  };
};

export const LEAVE_TYPE_POLICY_LABELS = [
  { key: "paid", short: "PL", label: "Paid leave" },
  { key: "sick", short: "SL", label: "Sick leave" },
  { key: "casual", short: "CL", label: "Casual leave" },
  { key: "optional", short: "OL", label: "Optional leave" },
] as const;
