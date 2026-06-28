// Shared product store backed by localStorage.
// Products page writes here on every change; page reload restores from here.
// Sales and other pages also read the simplified list for dropdowns.

const KEY = "bvd_products";

// Full product shape stored in localStorage (matches products.tsx Product type)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveProducts(products: any[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(products));
  } catch {
    // storage full / unavailable — ignore
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadProducts(): any[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Simplified shape used by the Sales dropdown
export type StoredProduct = {
  id: string;
  name: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  unit: string;
  qty: number;
  status: string;
};

export function loadActiveProductsForSales(): StoredProduct[] | null {
  const all = loadProducts();
  if (!all || all.length === 0) return null;
  return all
    .filter((p: StoredProduct) => p.status === "Active")
    .map((p: StoredProduct) => ({
      id: p.id, name: p.name, sku: p.sku,
      mrp: p.mrp, sellingPrice: p.sellingPrice,
      unit: p.unit, qty: p.qty, status: p.status,
    }));
}
