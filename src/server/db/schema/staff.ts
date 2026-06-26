import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").notNull().default("[]"), // JSON array of permission keys
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(),
  phone:     text("phone"),
  roleId:    uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
  status:    text("status").notNull().default("Active"), // Active | Inactive
  joinDate:  text("join_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
