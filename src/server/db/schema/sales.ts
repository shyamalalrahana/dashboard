import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createdAt, primaryId } from "./_shared";

// Retail counter sales — walk-in customers buying products at the shop
export const retailSales = sqliteTable("retail_sales", {
  id:            primaryId(),
  saleNumber:    text("sale_number").notNull().unique(),    // SAL-001
  customerName:  text("customer_name"),                     // null = walk-in
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  paymentMethod: text("payment_method").notNull().default("Cash"), // Cash | UPI | Card
  subtotal:      integer("subtotal").notNull().default(0),   // pre-GST, in rupees
  gstAmount:     integer("gst_amount").notNull().default(0), // GST portion, in rupees
  totalAmount:   integer("total_amount").notNull(),          // grand total, in rupees
  status:        text("status").notNull().default("Paid"),  // Paid | Returned
  soldBy:        text("sold_by"),                            // staff id who recorded the sale
  createdAt:     createdAt(),
});

// Line items for each retail sale
export const retailSaleItems = sqliteTable("retail_sale_items", {
  id:          primaryId(),
  saleId:      text("sale_id").notNull().references(() => retailSales.id, { onDelete: "cascade" }),
  productId:   text("product_id"),                 // links to products.id when sold from catalogue
  productName: text("product_name").notNull(),
  productSku:  text("product_sku"),
  qty:         integer("qty").notNull(),
  unitPrice:   integer("unit_price").notNull(),  // in rupees
  lineTotal:   integer("line_total").notNull(),
});

// Wholesale invoices — for B2B/wholesale customers (used by Customers module)
export const wholesaleInvoices = sqliteTable("wholesale_invoices", {
  id:            primaryId(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customer:      text("customer").notNull(),
  date:          text("date").notNull(),
  amount:        integer("amount").notNull(),
  profit:        integer("profit").notNull().default(0),
  status:        text("status").notNull().default("Pending"), // Paid | Pending | Overdue
  paymentMethod: text("payment_method").notNull().default("Cash"),
  dueDate:       text("due_date"),
  createdAt:     createdAt(),
});
