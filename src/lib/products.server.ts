import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "@/server/lib/supabase";

// All product persistence goes through Supabase's REST API (PostgREST) over
// HTTPS. Cloudflare Workers can't reliably hold raw TCP Postgres connections,
// so the previous drizzle/postgres.js client crashed in production while
// working fine on localhost.

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

// PostgREST works with the real (snake_case) column names.
function toRow(p: ProductInput) {
  return {
    sku:               p.sku,
    barcode:           p.barcode,
    name:              p.name,
    description:       p.description,
    status:            p.status,
    category:          p.category,
    brand:             p.brand,
    product_type:      p.productType,
    unit:              p.unit,
    pack_size:         p.packSize,
    pack_unit:         p.packUnit,
    pack_display_name: p.packDisplayName,
    cost_price:        p.costPrice,
    selling_price:     p.sellingPrice,
    mrp:               p.mrp,
    min_selling_price: p.minSellingPrice,
    wholesale_price:   p.wholesalePrice,
    distributor_price: p.distributorPrice,
    gst_enabled:       p.gstEnabled,
    tax_mode:          p.taxMode,
    gst_rate:          p.gstRate,
    tax_profile:       p.taxProfile,
    hsn:               p.hsn,
    stock:             p.qty,
    min_stock:         p.minStock,
    max_stock:         p.maxStock,
    reorder_level:     p.reorderLevel,
    warehouse:         p.warehouse,
    location:          p.location,
    rack:              p.rack,
    bin:               p.bin,
    attributes:        p.attributes,
    has_variants:      p.hasVariants,
    variants:          p.variants,
    supplier_name:     p.supplierName,
    supplier_code:     p.supplierCode,
    lead_time:         p.leadTime,
    min_order:         p.minOrder,
    images:            p.images,
    modules:           p.modules,
    mfg_date:          p.mfgDate,
    warranty:          p.warranty,
    expiry_tracking:   p.expiryTracking,
    shelf_life:        p.shelfLife,
    expiry_date:       p.expiryDate,
    offer_enabled:     p.offer.enabled,
    offer_type:        p.offer.type,
    offer_value:       String(p.offer.value),
    offer_label:       p.offer.label,
    notes:             p.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): ProductWithId {
  return {
    id:               r.id,
    name:             r.name,
    sku:              r.sku,
    barcode:          r.barcode ?? "",
    description:      r.description ?? "",
    status:           r.status ?? "Active",
    category:         r.category ?? "",
    brand:            r.brand ?? "",
    productType:      r.product_type ?? "Goods",
    unit:             r.unit ?? "Piece",
    packSize:         r.pack_size ?? "",
    packUnit:         r.pack_unit ?? "",
    packDisplayName:  r.pack_display_name ?? "",
    costPrice:        r.cost_price ?? 0,
    sellingPrice:     r.selling_price ?? 0,
    mrp:              r.mrp ?? 0,
    minSellingPrice:  r.min_selling_price ?? 0,
    wholesalePrice:   r.wholesale_price ?? 0,
    distributorPrice: r.distributor_price ?? 0,
    gstEnabled:       r.gst_enabled ?? true,
    taxMode:          r.tax_mode ?? "Exclusive",
    gstRate:          r.gst_rate ?? "0",
    taxProfile:       r.tax_profile ?? "",
    hsn:              r.hsn ?? "",
    qty:              r.stock ?? 0,
    minStock:         r.min_stock ?? 0,
    maxStock:         r.max_stock ?? 0,
    reorderLevel:     r.reorder_level ?? 0,
    warehouse:        r.warehouse ?? "",
    location:         r.location ?? "",
    rack:             r.rack ?? "",
    bin:              r.bin ?? "",
    attributes:       Array.isArray(r.attributes) ? r.attributes : [],
    hasVariants:      r.has_variants ?? false,
    variants:         r.variants && r.variants.groups ? r.variants : EMPTY_VARIANTS,
    supplierName:     r.supplier_name ?? "",
    supplierCode:     r.supplier_code ?? "",
    leadTime:         r.lead_time ?? "",
    minOrder:         r.min_order ?? "",
    images:           r.images && typeof r.images.primary === "string" ? r.images : EMPTY_IMAGES,
    modules:          r.modules && typeof r.modules.batch === "boolean" ? r.modules : EMPTY_MODULES,
    mfgDate:          r.mfg_date ?? "",
    warranty:         r.warranty ?? "",
    expiryTracking:   r.expiry_tracking ?? false,
    shelfLife:        r.shelf_life ?? "",
    expiryDate:       r.expiry_date ?? "",
    offer: {
      enabled: r.offer_enabled ?? false,
      type:    r.offer_type ?? "percent",
      value:   Number(r.offer_value ?? 0),
      label:   r.offer_label ?? "",
    },
    notes:     r.notes ?? "",
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export const fetchProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Could not load products: ${error.message}`);
    return (data ?? []).map(fromRow);
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductInput) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .insert(toRow(ctx.data))
      .select()
      .single();
    if (error) throw new Error(`Could not save product: ${error.message}`);
    return fromRow(data);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data: ProductWithId) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .update({ ...toRow(ctx.data), updated_at: new Date().toISOString() })
      .eq("id", ctx.data.id)
      .select()
      .single();
    if (error) throw new Error(`Could not update product: ${error.message}`);
    return fromRow(data);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("products").delete().eq("id", ctx.data.id);
    if (error) throw new Error(`Could not delete product: ${error.message}`);
    return { ok: true };
  });
