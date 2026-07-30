import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createdAt, primaryId } from "./_shared";

export const customers = sqliteTable("customers", {
  id:          primaryId(),
  name:        text("name").notNull(),
  phone:       text("phone").notNull(),
  email:       text("email"),
  address:     text("address"),
  outstanding: integer("outstanding").notNull().default(0),
  createdAt:   createdAt(),
});

export const customerOrders = sqliteTable("customer_orders", {
  id:          primaryId(),
  customerId:  text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  date:        text("date").notNull(),
  amount:      integer("amount").notNull(),
  paidAmount:  integer("paid_amount").notNull().default(0),
  status:      text("status").notNull().default("Pending"), // Paid | Pending | Partial
  items:       text("items"),
  createdAt:   createdAt(),
});

export const customerPayments = sqliteTable("customer_payments", {
  id:         primaryId(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  date:       text("date").notNull(),
  amount:     integer("amount").notNull(),
  note:       text("note"),
  createdAt:  createdAt(),
});
