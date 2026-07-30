// Server-only session and audit helpers.
// Lives under src/server/ so the import-protection plugin keeps it out of the
// client bundle: it touches request cookies, which only exist on the server.

import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { eq, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { activityLog, roles, sessions, staff } from "@/server/db/schema/staff";
import { newToken } from "@/server/lib/password";
import type { CurrentUser, Role } from "@/lib/auth-types";

export const SESSION_COOKIE = "shopos_session";

// Absolute lifetime, plus a shorter idle timeout so an unattended counter
// terminal signs itself out.
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;   // 12 h — covers a full shift
export const IDLE_TIMEOUT_MS    = 60 * 60 * 1000;        // 1 h of inactivity

// A 4–6 digit PIN is easy to brute force without a lockout.
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

/** Records who did what. Never throws — auditing must not break the action. */
export async function logActivity(entry: {
  staffId?: string | null;
  staffName?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}) {
  try {
    await db.insert(activityLog).values({
      staffId: entry.staffId ?? null,
      staffName: entry.staffName ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId ?? null,
      detail: entry.detail ?? {},
    });
  } catch {
    // Intentionally swallowed.
  }
}

/** Reads the session cookie and returns the signed-in user, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      lastSeenAt: sessions.lastSeenAt,
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      status: staff.status,
      mustReset: staff.mustReset,
      roleName: roles.name,
    })
    .from(sessions)
    .innerJoin(staff, eq(sessions.staffId, staff.id))
    .leftJoin(roles, eq(staff.roleId, roles.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const now = Date.now();
  const expired = row.expiresAt.getTime() < now;
  const idle = now - row.lastSeenAt.getTime() > IDLE_TIMEOUT_MS;

  if (expired || idle || row.status !== "Active") {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  // Sliding idle window — only touched once a minute so routine requests
  // don't each cost a write.
  if (now - row.lastSeenAt.getTime() > 60_000) {
    await db.update(sessions).set({ lastSeenAt: new Date(now) }).where(eq(sessions.id, row.sessionId));
  }

  return {
    id: row.staffId,
    name: row.name,
    email: row.email,
    role: (row.roleName === "admin" ? "admin" : "staff") as Role,
    mustReset: row.mustReset,
  };
}

/** Throws if nobody is signed in. Use at the top of any protected server fn. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}

/** Throws unless the signed-in user is an admin. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Only an admin can do this.");
  return user;
}

export async function startSession(staffId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.insert(sessions).values({
    id: token,
    staffId,
    expiresAt,
    lastSeenAt: new Date(),
    userAgent: getRequestHeader("user-agent") ?? null,
  });

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,                                   // not readable by JavaScript
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",    // HTTPS-only once behind the tunnel
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });

  // Opportunistically clear out expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function endSession(): Promise<CurrentUser | null> {
  const token = getCookie(SESSION_COOKIE);
  let user: CurrentUser | null = null;
  if (token) {
    user = await getCurrentUser();
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return user;
}

export function lockoutMessage(lockedUntil: Date): string {
  const mins = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60000));
  return `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`;
}

/** Increments the failure counter, locking the account once the limit is hit. */
export async function registerFailure(staffId: string, attempts: number): Promise<boolean> {
  const next = attempts + 1;
  const locked = next >= MAX_FAILED_ATTEMPTS;
  await db
    .update(staff)
    .set({
      failedAttempts: locked ? 0 : next,
      lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MS) : null,
    })
    .where(eq(staff.id, staffId));
  return locked;
}
