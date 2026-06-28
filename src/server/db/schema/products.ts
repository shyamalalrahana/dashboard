import { pgTable, text, integer, boolean, timestamp, uuid, numeric } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  // Identity
  id:               uuid("id").primaryKey().defaultRandom(),
  sku:              text("sku").notNull().unique(),
  barcode:          text("barcode").default(""),
  name:             text("name").notNull(),
  category:         text("category").notNull().default(""),
  brand:            text("brand").default(""),
  productType:      text("product_type").notNull().default("Goods"),
  status:           text("status").notNull().default("Active"),   // Active | Inactive | Discontinued

  // Unit & Packaging
  unit:             text("unit").notNull().default("pcs"),
  packSize:         text("pack_size").default(""),
  packUnit:         text("pack_unit").default(""),
  packDisplayName:  text("pack_display_name").default(""),

  // Pricing (stored in paise for integers; use numeric for exact decimals)
  mrp:              integer("mrp").notNull().default(0),          // paise
  sellingPrice:     integer("selling_price").notNull().default(0), // paise
  costPrice:        integer("cost_price").notNull().default(0),    // paise
  minSellingPrice:  integer("min_selling_price").notNull().default(0), // paise

  // Tax
  gstEnabled:       boolean("gst_enabled").notNull().default(true),
  taxMode:          text("tax_mode").notNull().default("Exclusive"), // Inclusive | Exclusive
  gstRate:          text("gst_rate").notNull().default("0"),          // "0" | "5" | "12" | "18" | "28"
  hsn:              text("hsn").default(""),

  // Inventory
  stock:            integer("stock").notNull().default(0),
  minStock:         integer("min_stock").notNull().default(0),
  reorderLevel:     integer("reorder_level").notNull().default(0),
  location:         text("location").default(""),

  // Expiry
  expiryTracking:   boolean("expiry_tracking").notNull().default(false),
  shelfLife:        text("shelf_life").default(""),
  expiryDate:       text("expiry_date").default(""),

  // Offer
  offerEnabled:     boolean("offer_enabled").notNull().default(false),
  offerType:        text("offer_type").default("percent"),   // "percent" | "flat"
  offerValue:       numeric("offer_value", { precision: 10, scale: 2 }).default("0"),
  offerLabel:       text("offer_label").default(""),

  // Meta
  description:      text("description").default(""),
  notes:            text("notes").default(""),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
});
