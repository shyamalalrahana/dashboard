import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createdAt, primaryId } from "./_shared";

export const inventoryItems = sqliteTable("inventory_items", {
  id:           primaryId(),
  itemCode:     text("item_code").notNull().unique(),
  name:         text("name").notNull(),
  category:     text("category").notNull(), // Raw Material | Finished | Packaging
  unit:         text("unit").notNull(),
  openingStock: integer("opening_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  currentStock: integer("current_stock").notNull().default(0),
  createdAt:    createdAt(),
});

export const stockTransactions = sqliteTable("stock_transactions", {
  id:        primaryId(),
  itemId:    text("item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  type:      text("type").notNull(), // Stock In | Usage
  quantity:  integer("quantity").notNull(),
  balance:   integer("balance").notNull(),
  notes:     text("notes"),
  date:      text("date").notNull(),
  createdAt: createdAt(),
});
