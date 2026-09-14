export const companyPolicies = {
  attendance: {
    quarterDefinition: "Calendar quarters (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)",
    maxLeaveDaysPerQuarter: 15,
    perTypePerQuarter: {
      paid: 6,
      sick: 4,
      casual: 4,
      optional: 1,
    },
    notes: [
      "Leave requests stay pending until a reporting manager or admin approves them.",
      "Only one leave can be applied for a given day.",
      "Paid (PL), sick (SL), casual (CL), and optional (OL) counts are per calendar quarter.",
    ],
  },
  timesheet: {
    minHoursPerDay: 0.5,
    maxHoursPerDay: 24,
    maxHoursPerWeek: 40,
    week: "Monday to Sunday",
    notes: [
      "Weeks run Monday through Sunday.",
      "Days with no hours stay not filled.",
      "Submitted days require manager or admin approval.",
      "Approved days cannot be overwritten.",
    ],
  },
} as const;
