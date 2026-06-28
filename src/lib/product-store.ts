// Shared product store backed by localStorage.
// Products page writes here; Sales and other pages read from here.

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

const KEY = "bvd_products";

export function saveProducts(products: StoredProduct[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(products));
  } catch {
    // storage full / unavailable — ignore
  }
}

export function loadProducts(): StoredProduct[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredProduct[];
  } catch {
    return null;
  }
}
