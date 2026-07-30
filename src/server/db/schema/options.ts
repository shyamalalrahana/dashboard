import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { bool, createdAt, primaryId } from "./_shared";

// Master data for every configurable dropdown in the app.
// kind: category | product_type | brand | unit | tax_profile | warehouse | ...
// meta: extra structured data per value (e.g. { rate: 18 } for tax profiles)
export const optionValues = sqliteTable("option_values", {
  id:        primaryId(),
  kind:      text("kind").notNull(),
  value:     text("value").notNull(),
  meta:      text("meta", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  sort:      integer("sort").notNull().default(0),
  active:    bool("active").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [unique().on(t.kind, t.value)]);
