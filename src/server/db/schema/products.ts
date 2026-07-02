import { pgTable, text, integer, boolean, timestamp, uuid, numeric, jsonb } from "drizzle-orm/pg-core";

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

  // Pricing (in rupees)
  mrp:              integer("mrp").notNull().default(0),
  sellingPrice:     integer("selling_price").notNull().default(0),
  costPrice:        integer("cost_price").notNull().default(0),
  minSellingPrice:  integer("min_selling_price").notNull().default(0),
  wholesalePrice:   integer("wholesale_price").notNull().default(0),
  distributorPrice: integer("distributor_price").notNull().default(0),

  // Tax
  gstEnabled:       boolean("gst_enabled").notNull().default(true),
  taxMode:          text("tax_mode").notNull().default("Exclusive"), // Inclusive | Exclusive
  gstRate:          text("gst_rate").notNull().default("0"),          // numeric rate as text
  taxProfile:       text("tax_profile").default(""),                  // label from Settings → Tax Profiles
  hsn:              text("hsn").default(""),

  // Inventory
  stock:            integer("stock").notNull().default(0),
  minStock:         integer("min_stock").notNull().default(0),
  maxStock:         integer("max_stock").notNull().default(0),
  reorderLevel:     integer("reorder_level").notNull().default(0),
  warehouse:        text("warehouse").default(""),
  location:         text("location").default(""),
  rack:             text("rack").default(""),
  bin:              text("bin").default(""),

  // Custom attributes: [{ name, value }]
  attributes:       jsonb("attributes").default([]),

  // Variants: { groups: [{ name, values: [] }], items: [{ name, sku, price, stock }] }
  hasVariants:      boolean("has_variants").notNull().default(false),
  variants:         jsonb("variants").default({}),

  // Supplier
  supplierName:     text("supplier_name").default(""),
  supplierCode:     text("supplier_code").default(""),
  leadTime:         text("lead_time").default(""),
  minOrder:         text("min_order").default(""),

  // Images: { primary: url, gallery: [urls] }
  images:           jsonb("images").default({}),

  // Module toggles: { batch, serial, warranty, manufacturing, service }
  modules:          jsonb("modules").default({}),
  mfgDate:          text("mfg_date").default(""),
  warranty:         text("warranty").default(""),

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
