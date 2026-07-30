import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { products } from "@/server/db/schema/products";
import { logActivity, requireAdmin, requireUser } from "@/server/lib/session";

export type ProductAttribute = { name: string; value: string };
export type VariantGroup = { name: string; values: string[] };
export type VariantItem = { name: string; sku: string; price: number; stock: number };
export type ProductVariants = { groups: VariantGroup[]; items: VariantItem[] };
export type ProductImages = { primary: string; gallery: string[] };
export type ProductModules = {
  batch: boolean;
  serial: boolean;
  warranty: boolean;
  manufacturing: boolean;
  service: boolean;
};

export type ProductInput = {
  id?: string;
  // Basic
  name: string;
  sku: string;
  barcode: string;
  description: string;
  status: string;
  // Classification
  category: string;
  brand: string;
  productType: string;
  // Unit & packaging
  unit: string;
  packSize: string;
  packUnit: string;
  packDisplayName: string;
  // Pricing
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  minSellingPrice: number;
  wholesalePrice: number;
  distributorPrice: number;
  // Tax
  gstEnabled: boolean;
  taxMode: string;
  gstRate: string;
  taxProfile: string;
  hsn: string;
  // Inventory
  qty: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  warehouse: string;
  location: string;
  rack: string;
  bin: string;
  // Attributes / variants
  attributes: ProductAttribute[];
  hasVariants: boolean;
  variants: ProductVariants;
  // Supplier
  supplierName: string;
  supplierCode: string;
  leadTime: string;
  minOrder: string;
  // Images
  images: ProductImages;
  // Modules + related fields
  modules: ProductModules;
  mfgDate: string;
  warranty: string;
  // Expiry
  expiryTracking: boolean;
  shelfLife: string;
  expiryDate: string;
  // Offer (per-product)
  offer: { enabled: boolean; type: string; value: number; label: string };
  // Notes
  notes: string;
  createdAt: string;
};

type ProductWithId = ProductInput & { id: string };

const EMPTY_MODULES: ProductModules = { batch: false, serial: false, warranty: false, manufacturing: false, service: false };
const EMPTY_VARIANTS: ProductVariants = { groups: [], items: [] };
const EMPTY_IMAGES: ProductImages = { primary: "", gallery: [] };

function toDbRow(p: ProductInput) {
  return {
    sku:              p.sku,
    barcode:          p.barcode,
    name:             p.name,
    description:      p.description,
    status:           p.status,
    category:         p.category,
    brand:            p.brand,
    productType:      p.productType,
    unit:             p.unit,
    packSize:         p.packSize,
    packUnit:         p.packUnit,
    packDisplayName:  p.packDisplayName,
    costPrice:        p.costPrice,
    sellingPrice:     p.sellingPrice,
    mrp:              p.mrp,
    minSellingPrice:  p.minSellingPrice,
    wholesalePrice:   p.wholesalePrice,
    distributorPrice: p.distributorPrice,
    gstEnabled:       p.gstEnabled,
    taxMode:          p.taxMode,
    gstRate:          p.gstRate,
    taxProfile:       p.taxProfile,
    hsn:              p.hsn,
    stock:            p.qty,
    minStock:         p.minStock,
    maxStock:         p.maxStock,
    reorderLevel:     p.reorderLevel,
    warehouse:        p.warehouse,
    location:         p.location,
    rack:             p.rack,
    bin:              p.bin,
    attributes:       p.attributes,
    hasVariants:      p.hasVariants,
    variants:         p.variants as unknown as Record<string, unknown>,
    supplierName:     p.supplierName,
    supplierCode:     p.supplierCode,
    leadTime:         p.leadTime,
    minOrder:         p.minOrder,
    images:           p.images as unknown as Record<string, unknown>,
    modules:          p.modules as unknown as Record<string, unknown>,
    mfgDate:          p.mfgDate,
    warranty:         p.warranty,
    expiryTracking:   p.expiryTracking,
    shelfLife:        p.shelfLife,
    expiryDate:       p.expiryDate,
    offerEnabled:     p.offer.enabled,
    offerType:        p.offer.type,
    offerValue:       p.offer.value,
    offerLabel:       p.offer.label,
    notes:            p.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbRow(r: any): ProductWithId {
  return {
    id:               r.id,
    name:             r.name,
    sku:              r.sku,
    barcode:          r.barcode ?? "",
    description:      r.description ?? "",
    status:           r.status ?? "Active",
    category:         r.category ?? "",
    brand:            r.brand ?? "",
    productType:      r.productType ?? "Goods",
    unit:             r.unit ?? "Piece",
    packSize:         r.packSize ?? "",
    packUnit:         r.packUnit ?? "",
    packDisplayName:  r.packDisplayName ?? "",
    costPrice:        r.costPrice ?? 0,
    sellingPrice:     r.sellingPrice ?? 0,
    mrp:              r.mrp ?? 0,
    minSellingPrice:  r.minSellingPrice ?? 0,
    wholesalePrice:   r.wholesalePrice ?? 0,
    distributorPrice: r.distributorPrice ?? 0,
    gstEnabled:       r.gstEnabled ?? true,
    taxMode:          r.taxMode ?? "Exclusive",
    gstRate:          r.gstRate ?? "0",
    taxProfile:       r.taxProfile ?? "",
    hsn:              r.hsn ?? "",
    qty:              r.stock ?? 0,
    minStock:         r.minStock ?? 0,
    maxStock:         r.maxStock ?? 0,
    reorderLevel:     r.reorderLevel ?? 0,
    warehouse:        r.warehouse ?? "",
    location:         r.location ?? "",
    rack:             r.rack ?? "",
    bin:              r.bin ?? "",
    attributes:       Array.isArray(r.attributes) ? r.attributes : [],
    hasVariants:      r.hasVariants ?? false,
    variants:         r.variants && r.variants.groups ? r.variants : EMPTY_VARIANTS,
    supplierName:     r.supplierName ?? "",
    supplierCode:     r.supplierCode ?? "",
    leadTime:         r.leadTime ?? "",
    minOrder:         r.minOrder ?? "",
    images:           r.images && typeof r.images.primary === "string" ? r.images : EMPTY_IMAGES,
    modules:          r.modules && typeof r.modules.batch === "boolean" ? r.modules : EMPTY_MODULES,
    mfgDate:          r.mfgDate ?? "",
    warranty:         r.warranty ?? "",
    expiryTracking:   r.expiryTracking ?? false,
    shelfLife:        r.shelfLife ?? "",
    expiryDate:       r.expiryDate ?? "",
    offer: {
      enabled: r.offerEnabled ?? false,
      type:    r.offerType ?? "percent",
      value:   Number(r.offerValue ?? 0),
      label:   r.offerLabel ?? "",
    },
    notes:     r.notes ?? "",
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? new Date().toISOString()),
  };
}

/**
 * What a purchase price reveals is a commercial secret, so buying prices and
 * margins are removed on the server for counter staff rather than hidden in
 * the UI — otherwise the numbers still travel to that browser.
 */
function redactForStaff(p: ProductWithId): ProductWithId {
  return { ...p, costPrice: 0, wholesalePrice: 0, distributorPrice: 0, minSellingPrice: 0 };
}

export const fetchProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const user = await requireUser();
    const rows = await db.select().from(products).orderBy(products.createdAt);
    const mapped = rows.map(fromDbRow);
    return user.role === "admin" ? mapped : mapped.map(redactForStaff);
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductInput) => data)
  .handler(async (ctx) => {
    const user = await requireAdmin();
    const [row] = await db.insert(products).values(toDbRow(ctx.data)).returning();
    await logActivity({
      staffId: user.id, staffName: user.name, action: "product.create",
      entity: "products", entityId: row.id, detail: { name: row.name, sku: row.sku },
    });
    return fromDbRow(row);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductWithId) => data)
  .handler(async (ctx) => {
    const user = await requireAdmin();
    const [before] = await db.select().from(products).where(eq(products.id, ctx.data.id)).limit(1);
    const [row] = await db
      .update(products)
      .set({ ...toDbRow(ctx.data), updatedAt: new Date() })
      .where(eq(products.id, ctx.data.id))
      .returning();

    // Price movements are the edits worth being able to look up later.
    const priceChanged = before && (before.sellingPrice !== row.sellingPrice || before.mrp !== row.mrp);
    await logActivity({
      staffId: user.id, staffName: user.name,
      action: priceChanged ? "product.price_change" : "product.update",
      entity: "products", entityId: row.id,
      detail: priceChanged
        ? { name: row.name, mrp: [before.mrp, row.mrp], sellingPrice: [before.sellingPrice, row.sellingPrice] }
        : { name: row.name },
    });
    return fromDbRow(row);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async (ctx) => {
    const user = await requireAdmin();
    const [before] = await db.select().from(products).where(eq(products.id, ctx.data.id)).limit(1);
    await db.delete(products).where(eq(products.id, ctx.data.id));
    await logActivity({
      staffId: user.id, staffName: user.name, action: "product.delete",
      entity: "products", entityId: ctx.data.id, detail: { name: before?.name, sku: before?.sku },
    });
    return { ok: true };
  });

/** Stock-in is a counter task, so staff may do it — but every receipt is logged. */
export const stockIn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; quantity: number; reference?: string }) => data)
  .handler(async (ctx) => {
    const user = await requireUser();
    if (!Number.isFinite(ctx.data.quantity) || ctx.data.quantity <= 0) {
      throw new Error("Enter a quantity greater than zero.");
    }
    const [before] = await db.select().from(products).where(eq(products.id, ctx.data.id)).limit(1);
    if (!before) throw new Error("That product no longer exists.");

    const [row] = await db
      .update(products)
      .set({ stock: before.stock + ctx.data.quantity, updatedAt: new Date() })
      .where(eq(products.id, ctx.data.id))
      .returning();

    await logActivity({
      staffId: user.id, staffName: user.name, action: "stock.in",
      entity: "products", entityId: row.id,
      detail: { name: row.name, added: ctx.data.quantity, from: before.stock, to: row.stock, reference: ctx.data.reference ?? "" },
    });

    const mapped = fromDbRow(row);
    return user.role === "admin" ? mapped : redactForStaff(mapped);
  });
