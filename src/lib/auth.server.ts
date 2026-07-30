import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/server/db";
import { roles, staff } from "@/server/db/schema/staff";
import { hashSecret, verifySecret } from "@/server/lib/password";
import {
  endSession, getCurrentUser, lockoutMessage, logActivity, registerFailure, startSession,
} from "@/server/lib/session";
import type { CurrentUser, PinAccount, Role } from "@/lib/auth-types";

export type { CurrentUser, PinAccount, Role } from "@/lib/auth-types";

/** Whether an admin account exists yet — drives the first-run setup screen. */
export const needsSetup = createServerFn({ method: "GET" }).handler(async () => {
  const admins = await db
    .select({ id: staff.id })
    .from(staff)
    .innerJoin(roles, eq(staff.roleId, roles.id))
    .where(and(eq(roles.name, "admin"), isNotNull(staff.passwordHash)))
    .limit(1);
  return { needsSetup: admins.length === 0 };
});

/** Current user for the UI. Returns null rather than throwing when signed out. */
export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => await getCurrentUser(),
);

/** Admin sign-in with email + password. */
export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async (ctx) => {
    const email = ctx.data.email.trim().toLowerCase();
    const rows = await db
      .select({
        id: staff.id, name: staff.name, status: staff.status,
        passwordHash: staff.passwordHash, failedAttempts: staff.failedAttempts,
        lockedUntil: staff.lockedUntil, roleName: roles.name,
      })
      .from(staff)
      .leftJoin(roles, eq(staff.roleId, roles.id))
      .where(eq(staff.email, email))
      .limit(1);

    const account = rows[0];
    // Same message whether the account is missing or the password is wrong, so
    // this cannot be used to discover which emails exist.
    const generic = "Email or password is incorrect.";
    if (!account || account.status !== "Active") throw new Error(generic);
    if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
      throw new Error(lockoutMessage(account.lockedUntil));
    }

    const ok = await verifySecret(ctx.data.password, account.passwordHash);
    if (!ok) {
      const locked = await registerFailure(account.id, account.failedAttempts);
      await logActivity({ staffId: account.id, staffName: account.name, action: "auth.login_failed", entity: "staff", entityId: account.id, detail: { method: "password" } });
      throw new Error(locked ? "Too many failed attempts. Try again in 15 minutes." : generic);
    }

    await db.update(staff).set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(staff.id, account.id));
    await startSession(account.id);
    await logActivity({ staffId: account.id, staffName: account.name, action: "auth.login", entity: "staff", entityId: account.id, detail: { method: "password" } });

    return { id: account.id, name: account.name, role: (account.roleName === "admin" ? "admin" : "staff") as Role };
  });

/** Counter sign-in with a short PIN. */
export const loginWithPin = createServerFn({ method: "POST" })
  .inputValidator((data: { staffId: string; pin: string }) => data)
  .handler(async (ctx) => {
    const rows = await db
      .select({
        id: staff.id, name: staff.name, status: staff.status,
        pinHash: staff.pinHash, failedAttempts: staff.failedAttempts,
        lockedUntil: staff.lockedUntil, roleName: roles.name,
      })
      .from(staff)
      .leftJoin(roles, eq(staff.roleId, roles.id))
      .where(eq(staff.id, ctx.data.staffId))
      .limit(1);

    const account = rows[0];
    if (!account || account.status !== "Active") throw new Error("That account is not available.");
    if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
      throw new Error(lockoutMessage(account.lockedUntil));
    }

    const ok = await verifySecret(ctx.data.pin, account.pinHash);
    if (!ok) {
      const locked = await registerFailure(account.id, account.failedAttempts);
      await logActivity({ staffId: account.id, staffName: account.name, action: "auth.login_failed", entity: "staff", entityId: account.id, detail: { method: "pin" } });
      throw new Error(locked ? "Too many failed attempts. Try again in 15 minutes." : "Incorrect PIN.");
    }

    await db.update(staff).set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(staff.id, account.id));
    await startSession(account.id);
    await logActivity({ staffId: account.id, staffName: account.name, action: "auth.login", entity: "staff", entityId: account.id, detail: { method: "pin" } });

    return { id: account.id, name: account.name, role: (account.roleName === "admin" ? "admin" : "staff") as Role };
  });

/** Accounts that can sign in with a PIN — shown as pickable tiles at the counter. */
export const fetchPinAccounts = createServerFn({ method: "GET" }).handler(async (): Promise<PinAccount[]> => {
  const rows = await db
    .select({ id: staff.id, name: staff.name, roleName: roles.name })
    .from(staff)
    .leftJoin(roles, eq(staff.roleId, roles.id))
    .where(and(eq(staff.status, "Active"), isNotNull(staff.pinHash)));
  return rows.map((r) => ({ id: r.id, name: r.name, role: (r.roleName === "admin" ? "admin" : "staff") as Role }));
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const user = await endSession();
  if (user) await logActivity({ staffId: user.id, staffName: user.name, action: "auth.logout", entity: "staff", entityId: user.id });
  return { ok: true };
});

/** First-run: creates the owner account. Refuses once an admin exists. */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; password: string }) => data)
  .handler(async (ctx) => {
    const existing = await db
      .select({ id: staff.id })
      .from(staff)
      .innerJoin(roles, eq(staff.roleId, roles.id))
      .where(and(eq(roles.name, "admin"), isNotNull(staff.passwordHash)))
      .limit(1);
    if (existing.length > 0) throw new Error("An admin account already exists.");
    if (ctx.data.password.length < 8) throw new Error("Use a password of at least 8 characters.");

    let [adminRole] = await db.select().from(roles).where(eq(roles.name, "admin")).limit(1);
    if (!adminRole) {
      [adminRole] = await db.insert(roles).values({ name: "admin", description: "Owner — full access", permissions: ["*"] }).returning();
    }

    const [account] = await db
      .insert(staff)
      .values({
        name: ctx.data.name.trim(),
        email: ctx.data.email.trim().toLowerCase(),
        roleId: adminRole.id,
        status: "Active",
        joinDate: new Date().toISOString().slice(0, 10),
        passwordHash: await hashSecret(ctx.data.password),
      })
      .returning();

    await startSession(account.id);
    await logActivity({ staffId: account.id, staffName: account.name, action: "auth.admin_created", entity: "staff", entityId: account.id });
    return { id: account.id, name: account.name };
  });
