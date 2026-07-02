import { pgTable, text, integer, boolean, timestamp, uuid, jsonb, unique } from "drizzle-orm/pg-core";

// Master data for every configurable dropdown in the app.
// kind: category | product_type | brand | unit | tax_profile | warehouse | ...
// meta: extra structured data per value (e.g. { rate: 18 } for tax profiles)
export const optionValues = pgTable("option_values", {
  id:        uuid("id").primaryKey().defaultRandom(),
  kind:      text("kind").notNull(),
  value:     text("value").notNull(),
  meta:      jsonb("meta").default({}),
  sort:      integer("sort").notNull().default(0),
  active:    boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.kind, t.value)]);
