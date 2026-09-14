import { ROLES, type Role } from "./roles.js";
import { userRepository } from "../repository/user.repository.js";

export const PERMISSIONS = {
  ALL: "all",
  ADD: "add",
  UPDATE: "update",
  GET: "get",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const RESOURCES = {
  PROFILE: "profile",
  TIMESHEET: "timesheet",
  ATTENDANCE: "attendance",
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: [PERMISSIONS.ALL],
  [ROLES.REPORTING_MANAGER]: [PERMISSIONS.ALL],
  [ROLES.EMPLOYEE]: [PERMISSIONS.ALL],
};

export type Actor = {
  id: string;
  role: Role;
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role];
  if (granted.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return granted.includes(permission);
}

export async function canAccessEmployee(actor: Actor, targetEmployeeId: string): Promise<boolean> {
  if (actor.role === ROLES.ADMIN) {
    return true;
  }

  if (actor.id === targetEmployeeId) {
    return true;
  }

  if (actor.role !== ROLES.REPORTING_MANAGER) {
    return false;
  }

  const report = await userRepository.existsManagedEmployee(actor.id, targetEmployeeId);
  return report;
}

export async function authorize(
  actor: Actor,
  permission: Permission,
  resource: Resource,
  targetEmployeeId: string,
): Promise<boolean> {
  const knownResource = (Object.values(RESOURCES) as string[]).includes(resource);
  if (!knownResource) {
    return false;
  }

  if (!hasPermission(actor.role, permission)) {
    return false;
  }

  return canAccessEmployee(actor, targetEmployeeId);
}
