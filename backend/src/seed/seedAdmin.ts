import bcrypt from "bcryptjs";
import { ROLES, type Role } from "../auth/roles.js";
import { userRepository } from "../repository/user.repository.js";

type SeedUser = {
  email: string;
  name: string;
  password: string;
  role: Role;
  reportsToEmail?: string;
};

const ADMIN_EMAIL = "nikhil.rawat@tothenew.com";
const RM_PRIYA = "priya.mehta@tothenew.com";
const RM_ARJUN = "arjun.singh@tothenew.com";
const RM_NEHA = "neha.kapoor@tothenew.com";

const SEED_USERS: SeedUser[] = [
  {
    email: ADMIN_EMAIL,
    name: "Nikhil Rawat",
    password: "nikhil0211@",
    role: ROLES.ADMIN,
  },
  {
    email: RM_PRIYA,
    name: "Priya Mehta",
    password: "Password123!",
    role: ROLES.REPORTING_MANAGER,
    reportsToEmail: ADMIN_EMAIL,
  },
  {
    email: RM_ARJUN,
    name: "Arjun Singh",
    password: "Password123!",
    role: ROLES.REPORTING_MANAGER,
    reportsToEmail: ADMIN_EMAIL,
  },
  {
    email: RM_NEHA,
    name: "Neha Kapoor",
    password: "Password123!",
    role: ROLES.REPORTING_MANAGER,
    reportsToEmail: ADMIN_EMAIL,
  },
  {
    email: "rohan.gupta@tothenew.com",
    name: "Rohan Gupta",
    password: "Password123!",
    role: ROLES.EMPLOYEE,
    reportsToEmail: RM_PRIYA,
  },
  {
    email: "isha.verma@tothenew.com",
    name: "Isha Verma",
    password: "Password123!",
    role: ROLES.EMPLOYEE,
    reportsToEmail: RM_PRIYA,
  },
  {
    email: "kabir.nair@tothenew.com",
    name: "Kabir Nair",
    password: "Password123!",
    role: ROLES.EMPLOYEE,
    reportsToEmail: RM_ARJUN,
  },
  {
    email: "ananya.joshi@tothenew.com",
    name: "Ananya Joshi",
    password: "Password123!",
    role: ROLES.EMPLOYEE,
    reportsToEmail: RM_ARJUN,
  },
  {
    email: "vivek.rao@tothenew.com",
    name: "Vivek Rao",
    password: "Password123!",
    role: ROLES.EMPLOYEE,
    reportsToEmail: RM_NEHA,
  },
  {
    email: "meera.iyer@tothenew.com",
    name: "Meera Iyer",
    password: "Password123!",
    role: ROLES.EMPLOYEE,
    reportsToEmail: RM_NEHA,
  },
];

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) {
    throw new Error(`Seed email must include a local-part before @: ${email}`);
  }
  return local;
}

function userId(user: { id?: string; _id?: unknown }): string {
  if (user.id) {
    return String(user.id);
  }
  if (user._id) {
    return String(user._id);
  }
  throw new Error("Seeded user is missing an id");
}

export async function seedUsers(): Promise<void> {
  const idsByEmail = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  for (const row of SEED_USERS) {
    const email = row.email.toLowerCase();
    const existing = await userRepository.findByEmail(email);

    if (existing) {
      idsByEmail.set(email, userId(existing));
      skipped += 1;
      continue;
    }

    let managerId: string | undefined;
    if (row.reportsToEmail) {
      const managerKey = row.reportsToEmail.toLowerCase();
      managerId = idsByEmail.get(managerKey);
      if (!managerId) {
        throw new Error(`Seed manager not found for ${email}: ${row.reportsToEmail}`);
      }
    }

    const passwordHash = await bcrypt.hash(row.password, 12);
    const createdUser = await userRepository.create({
      email,
      username: usernameFromEmail(email),
      name: row.name,
      passwordHash,
      role: row.role,
      isActive: true,
      managerId,
    });

    idsByEmail.set(email, userId(createdUser));
    created += 1;
  }

  console.log(`User seed complete: created ${created}, skipped ${skipped}`);
}
