import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const inventoryItems = pgTable("inventory_items", {
  id:           uuid("id").primaryKey().defaultRandom(),
  itemCode:     text("item_code").notNull().unique(),
  name:         text("name").notNull(),
  category:     text("category").notNull(), // Raw Material | Finished | Packaging
  unit:         text("unit").notNull(),
  openingStock: integer("opening_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  currentStock: integer("current_stock").notNull().default(0),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  itemId:    uuid("item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  type:      text("type").notNull(), // Stock In | Usage
  quantity:  integer("quantity").notNull(),
  balance:   integer("balance").notNull(),
  notes:     text("notes"),
  date:      text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
