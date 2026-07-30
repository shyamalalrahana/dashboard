// Seeds roles, master data (dropdown values) and a starter product catalogue.
// Safe to re-run: every insert skips rows that already exist.
//   npm run db:seed
//
// Uses raw SQL rather than Drizzle so it runs under plain Node with no build
// step — handy for recovering a machine where the app isn't built yet.

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const DB_PATH = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = () => Math.floor(Date.now() / 1000);   // Drizzle timestamp mode = unix seconds
const uuid = () => crypto.randomUUID();

// ── Roles ─────────────────────────────────────────────────────────────────────
const roleRows = [
  { name: "admin", description: "Owner — full access", permissions: ["*"] },
  {
    name: "staff",
    description: "Counter staff — sell and receive stock",
    permissions: ["sale.create", "sale.view", "product.view", "stock.in"],
  },
];

const insertRole = db.prepare(
  `INSERT OR IGNORE INTO roles (id, name, description, permissions, created_at)
   VALUES (?, ?, ?, ?, ?)`,
);
let rolesAdded = 0;
for (const r of roleRows) {
  const res = insertRole.run(uuid(), r.name, r.description, JSON.stringify(r.permissions), now());
  rolesAdded += res.changes;
}
console.log(`Roles: ${rolesAdded} added`);

// ── Master data ───────────────────────────────────────────────────────────────
const options = [];
const add = (kind, values, metaFn) =>
  values.forEach((v, i) => options.push({ kind, value: v, sort: i, meta: metaFn?.(v) ?? {} }));

add("category", [
  "Medicine", "Ayurvedic Medicine", "Grocery", "Personal Care", "Household",
  "Raw Material", "Finished Goods", "Packaging", "Stationery", "Electronics",
  "Hardware", "Fabric", "Chemical", "Services",
]);
add("product_type", [
  "Goods", "Service", "Raw Material", "Finished Product", "Consumable",
  "Packaging", "Rental", "Digital Product", "Subscription", "Ayurvedic Medicine",
]);
add("brand", ["Himalaya"]);
add("unit", [
  "Piece", "Kg", "g", "mg", "Litre", "mL", "Box", "Bottle", "Packet", "Strip",
  "Capsule", "Tablet", "Roll", "Meter", "Feet", "Dozen", "Bundle", "Pair",
  "Carton", "Bag", "Sack", "Vial", "Drum", "Jar", "Can", "Pouch", "Bale",
]);
add(
  "tax_profile",
  ["GST 0%", "GST 3%", "GST 5%", "GST 12%", "GST 18%", "GST 28%", "VAT 5%", "VAT 15%", "Tax Exempt"],
  (v) => ({ rate: v === "Tax Exempt" ? 0 : Number(v.match(/(\d+)%/)?.[1] ?? 0) }),
);
add("warehouse", ["Main Warehouse"]);

const insertOption = db.prepare(
  `INSERT OR IGNORE INTO option_values (id, kind, value, meta, sort, active, created_at)
   VALUES (?, ?, ?, ?, ?, 1, ?)`,
);
let optionsAdded = 0;
for (const o of options) {
  const res = insertOption.run(uuid(), o.kind, o.value, JSON.stringify(o.meta), o.sort, now());
  optionsAdded += res.changes;
}
console.log(`Master data: ${optionsAdded} added, ${options.length - optionsAdded} already present`);

// ── Starter product catalogue ─────────────────────────────────────────────────
const demo = [
  { sku: "SOL-001", name: "Sunflower Oil 1L",     category: "Grocery",       unit: "Bottle", packSize: "1",   packUnit: "L",  packDisplay: "1 L Bottle",   mrp: 180, sell: 170, cost: 140, minSell: 145, gst: "5",  tax: "GST 5%",  hsn: "15121100", stock: 240, minStock: 20, reorder: 50, expiry: 1, shelf: "18 Months", expDate: "2026-12-31" },
  { sku: "BRS-005", name: "Basmati Rice 5kg",     category: "Grocery",       unit: "Bag",    packSize: "5",   packUnit: "kg", packDisplay: "5 kg Bag",     mrp: 480, sell: 460, cost: 360, minSell: 380, gst: "5",  tax: "GST 5%",  hsn: "10063020", stock: 180, minStock: 10, reorder: 30, expiry: 1, shelf: "12 Months", expDate: "2027-03-31", offer: { on: 1, type: "percent", value: 10, label: "Weekend Sale" } },
  { sku: "WFL-010", name: "Wheat Flour 10kg",     category: "Grocery",       unit: "Bag",    packSize: "10",  packUnit: "kg", packDisplay: "10 kg Bag",    mrp: 380, sell: 360, cost: 290, minSell: 310, gst: "0",  tax: "GST 0%",  hsn: "11010000", stock: 320, minStock: 20, reorder: 50, expiry: 1, shelf: "6 Months",  expDate: "2026-09-30" },
  { sku: "SHP-200", name: "Shampoo 200ml",        category: "Personal Care", unit: "Bottle", packSize: "200", packUnit: "mL", packDisplay: "200 mL Bottle", mrp: 130, sell: 125, cost: 75,  minSell: 80,  gst: "18", tax: "GST 18%", hsn: "33051000", stock: 90,  minStock: 10, reorder: 25, expiry: 1, shelf: "24 Months", expDate: "2026-06-30" },
  { sku: "DTP-001", name: "Detergent Powder 1kg", category: "Household",     unit: "Packet", packSize: "1",   packUnit: "kg", packDisplay: "1 kg Packet",  mrp: 110, sell: 105, cost: 65,  minSell: 70,  gst: "18", tax: "GST 18%", hsn: "34022090", stock: 60,  minStock: 10, reorder: 20, expiry: 0, shelf: "",          expDate: "",           offer: { on: 1, type: "percent", value: 50, label: "Clearance" } },
  { sku: "TDL-001", name: "Toor Dal 1kg",         category: "Grocery",       unit: "Packet", packSize: "1",   packUnit: "kg", packDisplay: "1 kg Packet",  mrp: 160, sell: 155, cost: 120, minSell: 125, gst: "5",  tax: "GST 5%",  hsn: "07135000", stock: 0,   minStock: 5,  reorder: 15, expiry: 1, shelf: "12 Months", expDate: "2025-12-31", status: "Discontinued" },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (
    id, sku, barcode, name, category, brand, product_type, status,
    unit, pack_size, pack_unit, pack_display_name,
    mrp, selling_price, cost_price, min_selling_price, wholesale_price, distributor_price,
    gst_enabled, tax_mode, gst_rate, tax_profile, hsn,
    stock, min_stock, max_stock, reorder_level, warehouse, location, rack, bin,
    attributes, has_variants, variants,
    supplier_name, supplier_code, lead_time, min_order,
    images, modules, mfg_date, warranty,
    expiry_tracking, shelf_life, expiry_date,
    offer_enabled, offer_type, offer_value, offer_label,
    description, notes, created_at, updated_at
  ) VALUES (
    ?, ?, '', ?, ?, '', 'Goods', ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, 0, 0,
    1, 'Exclusive', ?, ?, ?,
    ?, ?, 0, ?, 'Main Warehouse', '', '', '',
    '[]', 0, '{}',
    '', '', '', '',
    '{}', '{}', '', '',
    ?, ?, ?,
    ?, ?, ?, ?,
    '', '', ?, ?
  )
`);

let productsAdded = 0;
for (const p of demo) {
  const o = p.offer ?? { on: 0, type: "percent", value: 0, label: "" };
  const res = insertProduct.run(
    uuid(), p.sku, p.name, p.category, p.status ?? "Active",
    p.unit, p.packSize, p.packUnit, p.packDisplay,
    p.mrp, p.sell, p.cost, p.minSell,
    p.gst, p.tax, p.hsn,
    p.stock, p.minStock, p.reorder,
    p.expiry, p.shelf, p.expDate,
    o.on, o.type, o.value, o.label,
    now(), now(),
  );
  productsAdded += res.changes;
}
console.log(`Products: ${productsAdded} added, ${demo.length - productsAdded} already present`);

console.log(`\nDatabase ready: ${DB_PATH}`);
db.close();
