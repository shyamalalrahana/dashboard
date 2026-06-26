import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  phone:       text("phone").notNull(),
  email:       text("email"),
  address:     text("address"),
  outstanding: integer("outstanding").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const customerOrders = pgTable("customer_orders", {
  id:          uuid("id").primaryKey().defaultRandom(),
  customerId:  uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  date:        text("date").notNull(),
  amount:      integer("amount").notNull(),
  paidAmount:  integer("paid_amount").notNull().default(0),
  status:      text("status").notNull().default("Pending"), // Paid | Pending | Partial
  items:       text("items"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const customerPayments = pgTable("customer_payments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  date:       text("date").notNull(),
  amount:     integer("amount").notNull(),
  note:       text("note"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});
