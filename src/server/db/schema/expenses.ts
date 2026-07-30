import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { bool, createdAt, primaryId } from "./_shared";

export const expenses = sqliteTable("expenses", {
  id:            primaryId(),
  expenseNumber: text("expense_number").notNull().unique(),
  category:      text("category").notNull(), // Purchases | Electricity | Salaries | Rent | Transportation | Misc
  note:          text("note"),
  vendor:        text("vendor"),
  date:          text("date").notNull(),
  amount:        integer("amount").notNull(),
  status:        text("status").notNull().default("Pending"), // Paid | Pending | Approved | Rejected
  paymentMethod: text("payment_method").notNull().default("Cash"), // Cash | Bank Transfer | UPI | Credit Card | Cheque
  hasAttachment: bool("has_attachment").notNull().default(false),
  createdAt:     createdAt(),
});
