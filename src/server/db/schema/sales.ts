import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

// Retail counter sales — walk-in customers buying products at the shop
export const retailSales = pgTable("retail_sales", {
  id:            uuid("id").primaryKey().defaultRandom(),
  saleNumber:    text("sale_number").notNull().unique(),    // SAL-001
  customerName:  text("customer_name"),                     // null = walk-in
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  paymentMethod: text("payment_method").notNull().default("Cash"), // Cash | UPI | Card
  totalAmount:   integer("total_amount").notNull(),
  status:        text("status").notNull().default("Paid"),  // Paid | Returned
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

// Line items for each retail sale
export const retailSaleItems = pgTable("retail_sale_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  saleId:      uuid("sale_id").notNull().references(() => retailSales.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  productSku:  text("product_sku"),
  qty:         integer("qty").notNull(),
  unitPrice:   integer("unit_price").notNull(),  // in rupees
  lineTotal:   integer("line_total").notNull(),
});

// Wholesale invoices — for B2B/wholesale customers (used by Customers module)
export const wholesaleInvoices = pgTable("wholesale_invoices", {
  id:            uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customer:      text("customer").notNull(),
  date:          text("date").notNull(),
  amount:        integer("amount").notNull(),
  profit:        integer("profit").notNull().default(0),
  status:        text("status").notNull().default("Pending"), // Paid | Pending | Overdue
  paymentMethod: text("payment_method").notNull().default("Cash"),
  dueDate:       text("due_date"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});
