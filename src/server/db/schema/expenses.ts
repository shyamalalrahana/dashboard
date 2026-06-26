import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const expenses = pgTable("expenses", {
  id:            uuid("id").primaryKey().defaultRandom(),
  expenseNumber: text("expense_number").notNull().unique(),
  category:      text("category").notNull(), // Purchases | Electricity | Salaries | Rent | Transportation | Misc
  note:          text("note"),
  vendor:        text("vendor"),
  date:          text("date").notNull(),
  amount:        integer("amount").notNull(),
  status:        text("status").notNull().default("Pending"), // Paid | Pending | Approved | Rejected
  paymentMethod: text("payment_method").notNull().default("Cash"), // Cash | Bank Transfer | UPI | Credit Card | Cheque
  hasAttachment: boolean("has_attachment").notNull().default(false),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});
