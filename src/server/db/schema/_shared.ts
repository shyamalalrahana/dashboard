import { integer, text } from "drizzle-orm/sqlite-core";

// Shared column helpers for the local SQLite database.
// SQLite has no uuid, boolean, jsonb or timestamp types, so those map onto
// text/integer with Drizzle handling the conversion in both directions.

export const primaryId = () =>
  text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

export const bool = (name: string) => integer(name, { mode: "boolean" });

export const createdAt = () =>
  integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date());

export const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date());
