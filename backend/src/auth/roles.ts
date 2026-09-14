export const ROLES = {
  ADMIN: "admin",
  REPORTING_MANAGER: "reporting_manager",
  EMPLOYEE: "employee",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES = [ROLES.ADMIN, ROLES.REPORTING_MANAGER, ROLES.EMPLOYEE] as const;
