import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const sales = pgTable("sales", {
  id:            uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customer:      text("customer").notNull(),
  date:          text("date").notNull(),
  amount:        integer("amount").notNull(),
  profit:        integer("profit").notNull().default(0),
  status:        text("status").notNull().default("Pending"), // Paid | Pending | Overdue
  paymentMethod: text("payment_method").notNull().default("Cash"), // Cash | UPI | Bank Transfer | Cheque | Credit
  dueDate:       text("due_date").notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});
