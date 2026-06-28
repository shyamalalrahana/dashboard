import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { products } from "@/server/db/schema/products";

export type ProductInput = {
  id?: string;
  name: string;
  category: string;
  brand: string;
  productType: string;
  sku: string;
  barcode: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  minSellingPrice: number;
  unit: string;
  packSize: string;
  packUnit: string;
  packDisplayName: string;
  gstEnabled: boolean;
  taxMode: string;
  gstRate: string;
  hsn: string;
  qty: number;
  minStock: number;
  reorderLevel: number;
  location: string;
  expiryTracking: boolean;
  shelfLife: string;
  expiryDate: string;
  description: string;
  notes: string;
  offer: { enabled: boolean; type: string; value: number; label: string };
  status: string;
  createdAt: string;
};

type ProductWithId = ProductInput & { id: string };

function toDbRow(p: ProductInput) {
  return {
    sku:             p.sku,
    barcode:         p.barcode,
    name:            p.name,
    category:        p.category,
    brand:           p.brand,
    productType:     p.productType,
    status:          p.status,
    unit:            p.unit,
    packSize:        p.packSize,
    packUnit:        p.packUnit,
    packDisplayName: p.packDisplayName,
    mrp:             p.mrp,
    sellingPrice:    p.sellingPrice,
    costPrice:       p.costPrice,
    minSellingPrice: p.minSellingPrice,
    gstEnabled:      p.gstEnabled,
    taxMode:         p.taxMode,
    gstRate:         p.gstRate,
    hsn:             p.hsn,
    stock:           p.qty,
    minStock:        p.minStock,
    reorderLevel:    p.reorderLevel,
    location:        p.location,
    expiryTracking:  p.expiryTracking,
    shelfLife:       p.shelfLife,
    expiryDate:      p.expiryDate,
    offerEnabled:    p.offer.enabled,
    offerType:       p.offer.type,
    offerValue:      String(p.offer.value),
    offerLabel:      p.offer.label,
    description:     p.description,
    notes:           p.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbRow(r: any): ProductWithId {
  return {
    id:              r.id,
    name:            r.name,
    category:        r.category ?? "",
    brand:           r.brand ?? "",
    productType:     r.productType ?? "Goods",
    sku:             r.sku,
    barcode:         r.barcode ?? "",
    mrp:             r.mrp ?? 0,
    sellingPrice:    r.sellingPrice ?? 0,
    costPrice:       r.costPrice ?? 0,
    minSellingPrice: r.minSellingPrice ?? 0,
    unit:            r.unit ?? "pcs",
    packSize:        r.packSize ?? "",
    packUnit:        r.packUnit ?? "",
    packDisplayName: r.packDisplayName ?? "",
    gstEnabled:      r.gstEnabled ?? true,
    taxMode:         r.taxMode ?? "Exclusive",
    gstRate:         r.gstRate ?? "0",
    hsn:             r.hsn ?? "",
    qty:             r.stock ?? 0,
    minStock:        r.minStock ?? 0,
    reorderLevel:    r.reorderLevel ?? 0,
    location:        r.location ?? "",
    expiryTracking:  r.expiryTracking ?? false,
    shelfLife:       r.shelfLife ?? "",
    expiryDate:      r.expiryDate ?? "",
    description:     r.description ?? "",
    notes:           r.notes ?? "",
    offer: {
      enabled: r.offerEnabled ?? false,
      type:    r.offerType ?? "percent",
      value:   Number(r.offerValue ?? 0),
      label:   r.offerLabel ?? "",
    },
    status:    r.status ?? "Active",
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
