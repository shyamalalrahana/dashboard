import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id:        uuid("id").primaryKey().defaultRandom(),
  sku:       text("sku").notNull().unique(),
  name:      text("name").notNull(),
  category:  text("category").notNull(),
  unit:      text("unit").notNull(),
  price:     integer("price").notNull().default(0),   // selling price in paise
  cost:      integer("cost").notNull().default(0),    // cost price in paise
  stock:     integer("stock").notNull().default(0),
  minStock:  integer("min_stock").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
