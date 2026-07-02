// Shared product domain types + helpers.
// Used by the Products route, the Add Product dialog, and the server functions.

export type ProductOffer = {
  enabled: boolean;
  type: "percent" | "flat";
  value: number;
  label: string;
};

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

export type ProductStatus = "Active" | "Inactive" | "Discontinued";

export type Product = {
  id: string;
  // Basic
  name: string;
  sku: string;
  barcode: string;
  description: string;
  status: ProductStatus;
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
  // Attributes & variants
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
  // Modules
  modules: ProductModules;
  mfgDate: string;
  warranty: string;
  // Expiry
  expiryTracking: boolean;
  shelfLife: string;
  expiryDate: string;
  // Offer
  offer: ProductOffer;
  // Notes
  notes: string;
  createdAt: string;
};

export const NO_OFFER: ProductOffer = { enabled: false, type: "percent", value: 0, label: "" };
export const EMPTY_MODULES: ProductModules = { batch: false, serial: false, warranty: false, manufacturing: false, service: false };
export const EMPTY_VARIANTS: ProductVariants = { groups: [], items: [] };
export const EMPTY_IMAGES: ProductImages = { primary: "", gallery: [] };
export const OFFER_PRESETS = [5, 10, 15, 20, 25, 30, 50];

export function generateSku(name: string, category: string): string {
  const part = ((category.slice(0, 2) + name.replace(/\s+/g, "").slice(0, 4))
    .toUpperCase().replace(/[^A-Z0-9]/g, ""));
  return `${part}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

export function expiryStatus(dateStr: string) {
  if (!dateStr) return "ok";
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "ok";
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export function effectivePrice(product: Product): number {
  const base = product.sellingPrice || product.mrp;
  if (!product.offer.enabled || product.offer.value <= 0) return base;
  if (product.offer.type === "percent") return Math.round(base * (1 - product.offer.value / 100));
  return Math.max(0, base - product.offer.value);
}
