import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { bool, createdAt, primaryId } from "./_shared";

export const roles = sqliteTable("roles", {
  id:          primaryId(),
  name:        text("name").notNull().unique(),          // admin | staff
  description: text("description"),
  permissions: text("permissions", { mode: "json" }).$type<string[]>().notNull().default([]),
  createdAt:   createdAt(),
});

export const staff = sqliteTable("staff", {
  id:        primaryId(),
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(),
  phone:     text("phone"),
  roleId:    text("role_id").references(() => roles.id, { onDelete: "set null" }),
  status:    text("status").notNull().default("Active"), // Active | Inactive
  joinDate:  text("join_date").notNull(),

  // Auth — stored locally so login works with no internet.
  // Admins sign in with a password; counter staff use a short PIN.
  passwordHash: text("password_hash"),
  pinHash:      text("pin_hash"),
  mustReset:    bool("must_reset").notNull().default(false),
  lastLoginAt:  integer("last_login_at", { mode: "timestamp" }),

  createdAt: createdAt(),
});

// Server-side sessions. Kept in the database rather than only in a signed
// cookie so an admin can revoke a device immediately (e.g. a lost phone).
export const sessions = sqliteTable("sessions", {
  id:        primaryId(),                                  // opaque token stored in the cookie
  staffId:   text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
});

// Who changed what. Matters once employees handle cash and stock.
export const activityLog = sqliteTable("activity_log", {
  id:        primaryId(),
  staffId:   text("staff_id"),
  staffName: text("staff_name"),
  action:    text("action").notNull(),        // e.g. sale.delete, product.update, stock.in
  entity:    text("entity"),                  // table or module affected
  entityId:  text("entity_id"),
  detail:    text("detail", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: createdAt(),
});
