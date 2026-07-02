import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { products } from "@/server/db/schema/products";

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
    variants:         p.variants,
    supplierName:     p.supplierName,
    supplierCode:     p.supplierCode,
    leadTime:         p.leadTime,
    minOrder:         p.minOrder,
    images:           p.images,
    modules:          p.modules,
    mfgDate:          p.mfgDate,
    warranty:         p.warranty,
    expiryTracking:   p.expiryTracking,
    shelfLife:        p.shelfLife,
    expiryDate:       p.expiryDate,
    offerEnabled:     p.offer.enabled,
    offerType:        p.offer.type,
    offerValue:       String(p.offer.value),
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
    createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export const fetchProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const rows = await db.select().from(products).orderBy(products.createdAt);
    return rows.map(fromDbRow);
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductInput) => data)
  .handler(async (ctx) => {
    const [row] = await db.insert(products).values(toDbRow(ctx.data)).returning();
    return fromDbRow(row);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductWithId) => data)
  .handler(async (ctx) => {
    const [row] = await db
      .update(products)
      .set({ ...toDbRow(ctx.data), updatedAt: new Date() })
      .where(eq(products.id, ctx.data.id))
      .returning();
    return fromDbRow(row);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async (ctx) => {
    await db.delete(products).where(eq(products.id, ctx.data.id));
    return { ok: true };
  });
