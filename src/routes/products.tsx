import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpCircle, Eye, Package, Pencil, Percent, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { loadTaxSettings } from "@/lib/settings-store";
import { loadProducts, saveProducts } from "@/lib/product-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · ShopOS" },
      { name: "description", content: "Product catalogue with pricing and expiry tracking." },
    ],
  }),
  component: ProductsPage,
});

// ── Default constants (users can add to these) ────────────────────────────────

const DEFAULT_CATEGORIES = [
  "Grocery", "Personal Care", "Household", "Beverages", "Snacks",
  "Dairy", "Electronics", "Ayurvedic", "Clothing", "Hardware", "Other",
];

const DEFAULT_PRODUCT_TYPES = [
  "Goods", "Service", "Raw Material", "Finished Product",
  "Consumable", "Packaging Material",
];

export const UNITS = [
  "mg", "g", "kg", "ton",
  "mL", "L",
  "Piece", "Box", "Bottle", "Packet", "Carton", "Dozen", "Bundle", "Pair",
  "Tablet", "Capsule", "Strip", "Vial",
  "Meter", "Roll",
  "Sack", "Bag",
  "Custom…",
];

export const GST_RATES = ["0", "3", "5", "12", "18", "28"];
const OFFER_PRESETS = [5, 10, 15, 20, 25, 30, 50];

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductOffer = {
  enabled: boolean;
  type: "percent" | "flat";
  value: number;
  label: string;
};

export type Product = {
  id: string;
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
  offer: ProductOffer;
  status: "Active" | "Inactive" | "Discontinued";
  createdAt: string;
};

type AddProductForm = {
  name: string;
  skuMode: "auto" | "manual";
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  productType: string;
  status: "Active" | "Inactive" | "Discontinued";
  unit: string;
  customUnit: string;
  packSize: string;
  packUnit: string;
  packDisplayName: string;
  costPrice: string;
  sellingPrice: string;
  mrp: string;
  minSellingPrice: string;
  gstEnabled: boolean;
  taxMode: string;
  gstRate: string;
  hsn: string;
  openingStock: string;
  minStock: string;
  reorderLevel: string;
  location: string;
  expiryTracking: boolean;
  shelfLife: string;
  expiryDate: string;
  description: string;
  notes: string;
  offerEnabled: boolean;
  offerType: "percent" | "flat";
  offerValue: string;
  offerLabel: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let idCounter = 7;
function nextId() { return `PRD-${String(idCounter++).padStart(3, "0")}`; }

function generateSku(name: string, category: string): string {
  const part = ((category.slice(0, 2) + name.replace(/\s+/g, "").slice(0, 4))
    .toUpperCase().replace(/[^A-Z0-9]/g, ""));
  return `${part}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function expiryStatus(dateStr: string) {
  if (!dateStr) return "ok";
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "ok";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function effectivePrice(product: Product): number {
  const base = product.sellingPrice || product.mrp;
  if (!product.offer.enabled || product.offer.value <= 0) return base;
  if (product.offer.type === "percent") return Math.round(base * (1 - product.offer.value / 100));
  return Math.max(0, base - product.offer.value);
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const NO_OFFER: ProductOffer = { enabled: false, type: "percent", value: 0, label: "" };

const initialProducts: Product[] = [
  {
    id: "PRD-001", name: "Sunflower Oil 1L", category: "Grocery", brand: "", productType: "Goods",
    sku: "SOL-001", barcode: "", mrp: 180, sellingPrice: 170, costPrice: 140, minSellingPrice: 145,
    unit: "btl", packSize: "1", packUnit: "L", packDisplayName: "1 L Bottle",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "5", hsn: "15121100",
    qty: 240, minStock: 20, reorderLevel: 50, location: "",
    expiryTracking: true, shelfLife: "18 Months", expiryDate: "2026-12-31",
    description: "", notes: "", offer: NO_OFFER, status: "Active", createdAt: "2026-06-01T09:15:00",
  },
  {
    id: "PRD-002", name: "Basmati Rice 5kg", category: "Grocery", brand: "", productType: "Goods",
    sku: "BRS-005", barcode: "", mrp: 480, sellingPrice: 460, costPrice: 360, minSellingPrice: 380,
    unit: "bag", packSize: "5", packUnit: "kg", packDisplayName: "5 kg Bag",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "5", hsn: "10063020",
    qty: 180, minStock: 10, reorderLevel: 30, location: "",
    expiryTracking: true, shelfLife: "12 Months", expiryDate: "2027-03-31",
    description: "", notes: "", offer: { enabled: true, type: "percent", value: 10, label: "Weekend Sale" },
    status: "Active", createdAt: "2026-06-01T09:20:00",
  },
  {
    id: "PRD-003", name: "Wheat Flour 10kg", category: "Grocery", brand: "", productType: "Goods",
    sku: "WFL-010", barcode: "", mrp: 380, sellingPrice: 360, costPrice: 290, minSellingPrice: 310,
    unit: "bag", packSize: "10", packUnit: "kg", packDisplayName: "10 kg Bag",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "0", hsn: "11010000",
    qty: 320, minStock: 20, reorderLevel: 50, location: "",
    expiryTracking: true, shelfLife: "6 Months", expiryDate: "2026-09-30",
    description: "", notes: "", offer: NO_OFFER, status: "Active", createdAt: "2026-06-02T10:00:00",
  },
  {
    id: "PRD-004", name: "Shampoo 200ml", category: "Personal Care", brand: "", productType: "Goods",
    sku: "SHP-200", barcode: "", mrp: 130, sellingPrice: 125, costPrice: 75, minSellingPrice: 80,
    unit: "btl", packSize: "200", packUnit: "mL", packDisplayName: "200 mL Bottle",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "18", hsn: "33051000",
    qty: 90, minStock: 10, reorderLevel: 25, location: "",
    expiryTracking: true, shelfLife: "24 Months", expiryDate: "2026-06-30",
    description: "", notes: "", offer: NO_OFFER, status: "Active", createdAt: "2026-06-03T11:30:00",
  },
  {
    id: "PRD-005", name: "Detergent Powder 1kg", category: "Household", brand: "", productType: "Goods",
    sku: "DTP-001", barcode: "", mrp: 110, sellingPrice: 105, costPrice: 65, minSellingPrice: 70,
    unit: "pkt", packSize: "1", packUnit: "kg", packDisplayName: "1 kg Packet",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "18", hsn: "34022090",
    qty: 60, minStock: 10, reorderLevel: 20, location: "",
    expiryTracking: false, shelfLife: "", expiryDate: "2027-06-30",
    description: "", notes: "", offer: { enabled: true, type: "percent", value: 50, label: "Clearance" },
    status: "Active", createdAt: "2026-06-05T14:00:00",
  },
  {
    id: "PRD-006", name: "Toor Dal 1kg", category: "Grocery", brand: "", productType: "Goods",
    sku: "TDL-001", barcode: "", mrp: 160, sellingPrice: 155, costPrice: 120, minSellingPrice: 125,
    unit: "pkt", packSize: "1", packUnit: "kg", packDisplayName: "1 kg Packet",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "5", hsn: "07135000",
    qty: 0, minStock: 5, reorderLevel: 15, location: "",
    expiryTracking: true, shelfLife: "12 Months", expiryDate: "2025-12-31",
    description: "", notes: "", offer: NO_OFFER, status: "Discontinued", createdAt: "2026-05-10T08:45:00",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts() as Product[] ?? initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Product | null>(null);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState("");
  const [stockInQty, setStockInQty] = useState("");
  const [stockInRef, setStockInRef] = useState("");
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [offerTargetId, setOfferTargetId] = useState<string | null>(null);

  // Customisable option lists
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [productTypes, setProductTypes] = useState(DEFAULT_PRODUCT_TYPES);
  const [brands, setBrands] = useState<string[]>([]);

  const [editForm, setEditForm] = useState({
    name: "", category: "Grocery", sku: "", mrp: "", costPrice: "", qty: "", unit: "pkt",
    expiryDate: "", status: "Active" as Product["status"],
  });

  const newRowRef = useRef<HTMLTableRowElement>(null);

  // Persist full product list to localStorage for reload persistence and Sales page
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const active = products.filter((p) => p.status === "Active");
  const expiring = products.filter((p) => expiryStatus(p.expiryDate) === "expiring" || expiryStatus(p.expiryDate) === "expired");
  const totalValue = products.reduce((sum, p) => sum + p.costPrice * p.qty, 0);

  function openEdit(p: Product) {
    setEditItem(p);
    setEditForm({
      name: p.name, category: p.category, sku: p.sku, mrp: String(p.mrp),
      costPrice: String(p.costPrice), qty: String(p.qty), unit: p.unit,
      expiryDate: p.expiryDate, status: p.status,
    });
  }
  function handleSaveEdit() {
    if (!editItem || !editForm.name || !editForm.mrp) return;
    setProducts(products.map((p) =>
      p.id === editItem.id
        ? { ...p, ...editForm, mrp: Number(editForm.mrp), costPrice: Number(editForm.costPrice) || 0, qty: Number(editForm.qty) || 0 }
        : p
    ));
    setEditItem(null);
    toast.success("Product updated");
  }

  function openStockIn(productId = "") {
    setStockInProductId(productId);
    setStockInQty("");
    setStockInRef("");
    setStockInOpen(true);
  }
  function handleStockIn() {
    const product = products.find((p) => p.id === stockInProductId);
    if (!product || !stockInQty || Number(stockInQty) <= 0) return;
    const added = Number(stockInQty);
    const newQty = product.qty + added;
    setProducts(products.map((p) => p.id === product.id ? { ...p, qty: newQty } : p));
    toast.success("Stock added", { description: `+${added} ${product.unit} · ${product.name} · New total: ${newQty}` });
    setStockInOpen(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    setProducts(products.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Product deleted");
  }

  function handleAddProduct(product: Product) {
    setProducts([product, ...products]);
    setAddOpen(false);
    setNewlyAddedId(product.id);
    toast.success("Product added", { description: product.name });
    // Scroll to the table after a tick
    setTimeout(() => {
      newRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    // Remove highlight after 3 s
    setTimeout(() => setNewlyAddedId(null), 3000);
  }

  function handleSetOffer(productId: string, offer: ProductOffer) {
    setProducts(products.map((p) => p.id === productId ? { ...p, offer } : p));
    setOfferTargetId(null);
    toast.success(offer.enabled ? `Offer set: ${offer.value}${offer.type === "percent" ? "%" : "₹"} off` : "Offer removed");
  }

  return (
    <PageShell
      title="Products"
      description="Manage your product catalogue — pricing, stock, and expiry dates."
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openStockIn()}>
            <ArrowUpCircle className="h-4 w-4 text-success" /> Stock In
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Active products" value={`${active.length} SKUs`} icon={<Package className="h-4 w-4" />} />
        <Stat label="Expiring / Expired" value={`${expiring.length} items`} tone="warning" />
        <Stat label="Inventory value" value={fmtINR(totalValue)} />
      </div>

      {expiring.length > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div className="text-sm">
              <p className="font-semibold">{expiring.length} product{expiring.length > 1 ? "s" : ""} expiring soon or expired</p>
              <p className="text-muted-foreground">{expiring.map((p) => p.name).join(", ")}.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">All Products</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input className="pl-7 h-8 w-36 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-28 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-28 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">MRP (₹)</TableHead>
                <TableHead className="text-right">Price (₹)</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => {
                const exp = expiryStatus(p.expiryDate);
                const isNew = p.id === newlyAddedId;
                const ep = effectivePrice(p);
                return (
                  <TableRow
                    key={p.id}
                    ref={isNew ? newRowRef : undefined}
                    className={cn(isNew && "animate-pulse bg-success/5")}
                  >
                    <TableCell>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {p.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                        onClick={() => setViewItem(p)}
                      >
                        {p.name}
                      </button>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {p.offer.enabled && p.offer.value > 0
                        ? <span className="line-through text-muted-foreground text-xs">{p.mrp.toLocaleString("en-IN")}</span>
                        : p.mrp.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.offer.enabled && p.offer.value > 0
                        ? <span className="font-semibold text-success">{ep.toLocaleString("en-IN")}</span>
                        : <span className="text-muted-foreground">{(p.sellingPrice || p.mrp).toLocaleString("en-IN")}</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.qty} <span className="text-muted-foreground text-xs">{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      {p.offer.enabled && p.offer.value > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 text-xs font-semibold">
                          <Percent className="h-3 w-3" />
                          {p.offer.value}{p.offer.type === "percent" ? "%" : "₹"} OFF
                          {p.offer.label && <span className="text-orange-500 font-normal">· {p.offer.label}</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={
                        exp === "expired" ? "text-destructive font-medium text-sm" :
                        exp === "expiring" ? "text-warning font-medium text-sm" : "text-sm"
                      }>
                        {formatDate(p.expiryDate)}
                        {exp === "expired" && <span className="ml-1 text-xs">(Expired)</span>}
                        {exp === "expiring" && <span className="ml-1 text-xs">(Soon)</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Active" ? "default" : p.status === "Inactive" ? "secondary" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="View details" onClick={() => setViewItem(p)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-success hover:text-success hover:bg-success/10" onClick={() => openStockIn(p.id)}>
                          <ArrowUpCircle className="h-3.5 w-3.5" /> Stock In
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className={cn("h-8 w-8", p.offer.enabled && p.offer.value > 0 ? "text-orange-500 hover:text-orange-600" : "text-muted-foreground hover:text-orange-500")}
                          title="Set offer"
                          onClick={() => setOfferTargetId(p.id)}
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product — multi-section dialog */}
      <AddProductDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddProduct}
        categories={categories}
        productTypes={productTypes}
        brands={brands}
        onAddCategory={(v) => setCategories([...categories, v])}
        onDeleteCategory={(v) => setCategories(categories.filter((c) => c !== v && DEFAULT_CATEGORIES.includes(c) ? true : c !== v))}
        onAddProductType={(v) => setProductTypes([...productTypes, v])}
        onDeleteProductType={(v) => setProductTypes(productTypes.filter((t) => t !== v && DEFAULT_PRODUCT_TYPES.includes(t) ? true : t !== v))}
        onAddBrand={(v) => setBrands([...brands, v])}
        onDeleteBrand={(v) => setBrands(brands.filter((b) => b !== v))}
      />

      {/* View dialog */}
      <ProductViewDialog
        product={viewItem}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        onEdit={(p) => { setViewItem(null); openEdit(p); }}
        onOffer={(p) => { setViewItem(null); setOfferTargetId(p.id); }}
      />

      {/* Quick offer dialog */}
      <SetOfferDialog
        product={products.find((p) => p.id === offerTargetId) ?? null}
        open={!!offerTargetId}
        onClose={() => setOfferTargetId(null)}
        onSave={(offer) => offerTargetId && handleSetOffer(offerTargetId, offer)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>MRP (₹)</Label>
                <Input type="number" value={editForm.mrp} onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (₹)</Label>
                <Input type="number" value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" value={editForm.qty} onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as Product["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={editForm.expiryDate} onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name || !editForm.mrp}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock In Dialog */}
      <Dialog open={stockInOpen} onOpenChange={(o) => !o && setStockInOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-success" /> Add Stock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product <span className="text-destructive">*</span></Label>
              <Select value={stockInProductId} onValueChange={setStockInProductId}>
                <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>
                  {products.filter((p) => p.status === "Active").map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-muted-foreground ml-1.5 text-xs">({p.qty} {p.unit})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity to Add <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" placeholder="e.g. 50" value={stockInQty} onChange={(e) => setStockInQty(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Reference <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input placeholder="Supplier, PO number…" value={stockInRef} onChange={(e) => setStockInRef(e.target.value)} />
              </div>
            </div>
            {stockInProductId && stockInQty && Number(stockInQty) > 0 && (() => {
              const p = products.find((pr) => pr.id === stockInProductId);
              if (!p) return null;
              return (
                <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New stock total</span>
                  <span className="font-semibold text-success">
                    {p.qty} + {Number(stockInQty)} = <strong>{p.qty + Number(stockInQty)}</strong> {p.unit}
                  </span>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockInOpen(false)}>Cancel</Button>
            <Button onClick={handleStockIn} disabled={!stockInProductId || !stockInQty || Number(stockInQty) <= 0}>
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ── Product View Dialog ───────────────────────────────────────────────────────

function ViewRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === "" || value === null || value === undefined || value === false) return null;
  return (
    <div className="flex gap-3 text-sm py-1.5">
      <span className="w-40 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{String(value)}</span>
    </div>
  );
}

function ProductViewDialog({ product: p, open, onClose, onEdit, onOffer }: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onEdit: (p: Product) => void;
  onOffer: (p: Product) => void;
}) {
  const exp = p ? expiryStatus(p.expiryDate) : "ok";
  const ep = p ? effectivePrice(p) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
        {p && <>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono border border-border rounded px-2 py-0.5">{p.id}</span>
                <Badge variant="secondary">{p.category}</Badge>
                <Badge variant={p.status === "Active" ? "default" : p.status === "Inactive" ? "secondary" : "outline"}>
                  {p.status}
                </Badge>
                {p.offer.enabled && p.offer.value > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-semibold">
                    <Percent className="h-3 w-3" />
                    {p.offer.value}{p.offer.type === "percent" ? "%" : "₹"} OFF
                    {p.offer.label && ` · ${p.offer.label}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => onOffer(p)} className="gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Set Offer
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(p)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Pricing highlight */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">MRP</p>
              <p className="text-lg font-semibold">{fmtINR(p.mrp)}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Selling Price</p>
              <p className="text-lg font-semibold">{fmtINR(p.sellingPrice || p.mrp)}</p>
            </div>
            <div className={cn("rounded-lg border p-3 text-center", p.offer.enabled && p.offer.value > 0 ? "border-success/40 bg-success/5" : "border-border")}>
              <p className="text-xs text-muted-foreground mb-1">Effective Price</p>
              <p className={cn("text-lg font-semibold", p.offer.enabled && p.offer.value > 0 && "text-success")}>{fmtINR(ep)}</p>
            </div>
          </div>

          {/* Sections */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Basic</p>
            <Separator className="mb-3" />
            <ViewRow label="SKU" value={p.sku} />
            <ViewRow label="Barcode" value={p.barcode} />
            <ViewRow label="Brand" value={p.brand} />
            <ViewRow label="Product Type" value={p.productType} />
            <ViewRow label="Added On" value={fmtDateTime(p.createdAt)} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unit & Packaging</p>
            <Separator className="mb-3" />
            <ViewRow label="Primary Unit" value={p.unit} />
            <ViewRow label="Pack Display Name" value={p.packDisplayName} />
            <ViewRow label="Pack Size" value={p.packSize ? `${p.packSize} ${p.packUnit}` : undefined} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pricing</p>
            <Separator className="mb-3" />
            <ViewRow label="Cost Price" value={fmtINR(p.costPrice)} />
            <ViewRow label="Min. Selling Price" value={p.minSellingPrice ? fmtINR(p.minSellingPrice) : undefined} />
            <ViewRow label="Margin" value={p.costPrice && p.mrp ? `${fmtINR(p.mrp - p.costPrice)} (${((p.mrp - p.costPrice) / p.mrp * 100).toFixed(1)}%)` : undefined} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tax</p>
            <Separator className="mb-3" />
            <ViewRow label="GST" value={p.gstEnabled ? `${p.gstRate}% (${p.taxMode})` : "Not applicable"} />
            <ViewRow label="HSN / SAC Code" value={p.hsn} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inventory</p>
            <Separator className="mb-3" />
            <ViewRow label="Current Stock" value={`${p.qty} ${p.unit}`} />
            <ViewRow label="Min. Stock" value={p.minStock ? `${p.minStock} ${p.unit}` : undefined} />
            <ViewRow label="Reorder Level" value={p.reorderLevel ? `${p.reorderLevel} ${p.unit}` : undefined} />
            <ViewRow label="Location" value={p.location} />
          </div>

          {p.expiryTracking && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expiry</p>
              <Separator className="mb-3" />
              <ViewRow label="Shelf Life" value={p.shelfLife} />
              <div className="flex gap-3 text-sm py-1.5">
                <span className="w-40 shrink-0 text-muted-foreground">Expiry Date</span>
                <span className={cn("font-medium", exp === "expired" ? "text-destructive" : exp === "expiring" ? "text-warning" : "")}>
                  {formatDate(p.expiryDate)}
                  {exp === "expired" && " (Expired)"}
                  {exp === "expiring" && " (Expiring Soon)"}
                </span>
              </div>
            </div>
          )}

          {p.offer.enabled && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Offer</p>
              <Separator className="mb-3" />
              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-orange-700 dark:text-orange-400 text-sm">
                    {p.offer.value}{p.offer.type === "percent" ? "%" : "₹"} OFF
                    {p.offer.label && ` · ${p.offer.label}`}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                    MRP {fmtINR(p.mrp)} → {fmtINR(ep)}
                    {p.offer.type === "percent" && ` (save ${fmtINR(p.mrp - ep)})`}
                  </p>
                </div>
                <Percent className="h-8 w-8 text-orange-300" />
              </div>
            </div>
          )}

          {(p.description || p.notes) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
              <Separator className="mb-3" />
              {p.description && <ViewRow label="Description" value={p.description} />}
              {p.notes && <ViewRow label="Internal Notes" value={p.notes} />}
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}

// ── Set Offer Dialog ──────────────────────────────────────────────────────────

function SetOfferDialog({ product, open, onClose, onSave }: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSave: (offer: ProductOffer) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (product) {
      setEnabled(product.offer.enabled);
      setType(product.offer.type);
      setValue(product.offer.value > 0 ? String(product.offer.value) : "");
      setLabel(product.offer.label);
    }
  }, [product?.id]);

  const base = product ? (product.sellingPrice || product.mrp) : 0;
  const numVal = Number(value) || 0;
  const ep = enabled && numVal > 0
    ? (type === "percent" ? Math.round(base * (1 - numVal / 100)) : Math.max(0, base - numVal))
    : base;

  function handleSave() {
    onSave({ enabled: enabled && numVal > 0, type, value: numVal, label });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {product && <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-orange-500" /> Set Offer — {product.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="offer-toggle" />
            <Label htmlFor="offer-toggle" className="cursor-pointer">Enable Offer</Label>
          </div>

          {enabled && (
            <>
              {/* Preset quick-select */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick presets (% off)</p>
                <div className="flex flex-wrap gap-1.5">
                  {OFFER_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => { setType("percent"); setValue(String(pct)); }}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full border transition-colors",
                        value === String(pct) && type === "percent"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "border-border text-muted-foreground hover:border-orange-400 hover:text-orange-500"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Discount Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "percent" | "flat")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% Percentage</SelectItem>
                      <SelectItem value="flat">₹ Flat amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Value {type === "percent" ? "(%)" : "(₹)"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max={type === "percent" ? 100 : undefined}
                    placeholder={type === "percent" ? "10" : "20"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Offer Label <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input placeholder="e.g. Weekend Sale, Clearance…" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              {numVal > 0 && (
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-3 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">MRP</span>
                    <span className="line-through text-muted-foreground">{fmtINR(product.mrp)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="font-semibold text-orange-700 dark:text-orange-400">
                      After {numVal}{type === "percent" ? "%" : "₹"} off
                    </span>
                    <span className="font-bold text-orange-700 dark:text-orange-400">{fmtINR(ep)}</span>
                  </div>
                  {type === "percent" && <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Customer saves {fmtINR(product.mrp - ep)}</p>}
                </div>
              )}
            </>
          )}

          {!enabled && product.offer.enabled && (
            <p className="text-sm text-muted-foreground">Disabling will remove the current offer from this product.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className={enabled ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}>
            {enabled ? "Apply Offer" : "Remove Offer"}
          </Button>
        </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  );
}

// ── EditableSelect — dropdown with inline add/delete ──────────────────────────

function EditableSelect({
  value, defaultOptions, extraOptions, onValueChange, onAdd, onDelete, label, required,
}: {
  value: string;
  defaultOptions: string[];
  extraOptions: string[];
  onValueChange: (v: string) => void;
  onAdd: (v: string) => void;
  onDelete: (v: string) => void;
  label: string;
  required?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newOpt, setNewOpt] = useState("");
  const allOptions = [...defaultOptions, ...extraOptions];

  function handleAdd() {
    const t = newOpt.trim();
    if (!t || allOptions.includes(t)) return;
    onAdd(t);
    onValueChange(t);
    setNewOpt("");
    setAdding(false);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {defaultOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          {extraOptions.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1">Custom</div>
              {extraOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </>
          )}
        </SelectContent>
      </Select>
      {/* Custom options chips */}
      {extraOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {extraOptions.map((o) => (
            <span key={o} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-0.5">
              {o}
              <button
                type="button"
                onClick={() => { onDelete(o); if (value === o) onValueChange(defaultOptions[0] || ""); }}
                className="text-muted-foreground hover:text-destructive ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Add new option */}
      {adding ? (
        <div className="flex gap-1.5">
          <Input
            className="h-7 text-xs"
            placeholder={`New ${label.toLowerCase()}…`}
            value={newOpt}
            onChange={(e) => setNewOpt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewOpt(""); } }}
            autoFocus
          />
          <Button type="button" size="sm" className="h-7 px-2.5 text-xs" onClick={handleAdd} disabled={!newOpt.trim()}>Add</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setAdding(false); setNewOpt(""); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="text-xs text-primary hover:underline underline-offset-2">
          + Add custom {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

// ── Add Product Dialog (multi-section) ───────────────────────────────────────

const NAV_SECTIONS = [
  { key: "basic",     label: "Basic Info" },
  { key: "unit",      label: "Unit & Packaging" },
  { key: "pricing",   label: "Pricing" },
  { key: "tax",       label: "Tax" },
  { key: "inventory", label: "Inventory" },
  { key: "expiry",    label: "Expiry" },
  { key: "offers",    label: "Offers" },
  { key: "notes",     label: "Notes" },
] as const;

type SectionKey = typeof NAV_SECTIONS[number]["key"];

function buildDefaultForm(): AddProductForm {
  const tax = loadTaxSettings();
  return {
    name: "", skuMode: "auto", sku: "", barcode: "",
    category: "Grocery", brand: "", productType: "Goods", status: "Active",
    unit: "Piece", customUnit: "",
    packSize: "", packUnit: "", packDisplayName: "",
    costPrice: "", sellingPrice: "", mrp: "", minSellingPrice: "",
    gstEnabled: tax.gstEnabled, taxMode: tax.taxMode, gstRate: tax.defaultRate, hsn: "",
    openingStock: "", minStock: "", reorderLevel: "", location: "",
    expiryTracking: false, shelfLife: "", expiryDate: "",
    description: "", notes: "",
    offerEnabled: false, offerType: "percent", offerValue: "", offerLabel: "",
  };
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{children}</h3>
      <Separator />
    </div>
  );
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={cn("grid gap-4 mb-4", cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-2")}>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
        {hint && <span className="text-muted-foreground font-normal ml-1 text-xs">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}

function AddProductDialog({ open, onClose, onAdd, categories, productTypes, brands, onAddCategory, onDeleteCategory, onAddProductType, onDeleteProductType, onAddBrand, onDeleteBrand }: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Product) => void;
  categories: string[];
  productTypes: string[];
  brands: string[];
  onAddCategory: (v: string) => void;
  onDeleteCategory: (v: string) => void;
  onAddProductType: (v: string) => void;
  onDeleteProductType: (v: string) => void;
  onAddBrand: (v: string) => void;
  onDeleteBrand: (v: string) => void;
}) {
  const [form, setForm] = useState<AddProductForm>(buildDefaultForm);
  const [activeSection, setActiveSection] = useState<SectionKey>("basic");

  const basicRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const taxRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);
  const offersRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<SectionKey, React.RefObject<HTMLDivElement>> = {
    basic: basicRef, unit: unitRef, pricing: pricingRef, tax: taxRef,
    inventory: inventoryRef, expiry: expiryRef, offers: offersRef, notes: notesRef,
  };

  useEffect(() => {
    if (open) { setForm(buildDefaultForm()); setActiveSection("basic"); }
  }, [open]);

  useEffect(() => {
    if (form.skuMode === "auto" && form.name) {
      setForm((f) => ({ ...f, sku: generateSku(f.name, f.category) }));
    }
  }, [form.name, form.category, form.skuMode]);

  function scrollTo(key: SectionKey) {
    setActiveSection(key);
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function set<K extends keyof AddProductForm>(key: K, val: AddProductForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const effectiveUnit = form.unit === "Custom…" ? form.customUnit : form.unit;
  const numOffer = Number(form.offerValue) || 0;
  const numMrp = Number(form.mrp) || 0;
  const numCost = Number(form.costPrice) || 0;
  const offerPreviewPrice = form.offerEnabled && numOffer > 0
    ? (form.offerType === "percent" ? Math.round(numMrp * (1 - numOffer / 100)) : Math.max(0, numMrp - numOffer))
    : numMrp;

  function handleSubmit() {
    if (!form.name || !form.mrp) return;
    const product: Product = {
      id: nextId(),
      name: form.name,
      category: form.category,
      brand: form.brand,
      productType: form.productType,
      sku: form.sku || generateSku(form.name, form.category),
      barcode: form.barcode,
      mrp: numMrp,
      sellingPrice: Number(form.sellingPrice) || numMrp,
      costPrice: numCost,
      minSellingPrice: Number(form.minSellingPrice) || 0,
      unit: effectiveUnit || "Piece",
      packSize: form.packSize,
      packUnit: form.packUnit,
      packDisplayName: form.packDisplayName,
      gstEnabled: form.gstEnabled,
      taxMode: form.taxMode,
      gstRate: form.gstRate,
      hsn: form.hsn,
      qty: Number(form.openingStock) || 0,
      minStock: Number(form.minStock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      location: form.location,
      expiryTracking: form.expiryTracking,
      shelfLife: form.shelfLife,
      expiryDate: form.expiryDate,
      description: form.description,
      notes: form.notes,
      offer: {
        enabled: form.offerEnabled && numOffer > 0,
        type: form.offerType,
        value: numOffer,
        label: form.offerLabel,
      },
      status: form.status,
      createdAt: new Date().toISOString(),
    };
    onAdd(product);
  }

  const canSubmit = !!form.name && !!form.mrp;
  const customCategories = categories.filter((c) => !DEFAULT_CATEGORIES.includes(c));
  const customProductTypes = productTypes.filter((t) => !DEFAULT_PRODUCT_TYPES.includes(t));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg">Add Product</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in the details. Only Name and MRP are required.</p>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left nav */}
          <nav className="w-44 border-r border-border py-4 px-2 shrink-0 overflow-y-auto">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => scrollTo(s.key)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-0.5",
                  s.key === "offers" && "text-orange-600 dark:text-orange-400",
                  activeSection === s.key
                    ? s.key === "offers" ? "bg-orange-100 dark:bg-orange-900/30 font-medium" : "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

            {/* 1. Basic */}
            <div ref={basicRef} className="scroll-mt-2">
              <SectionHeader>1. Basic Information</SectionHeader>
              <FieldRow cols={1}>
                <Field label="Product Name" required>
                  <Input placeholder="e.g. Sunflower Oil 1L" value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
                </Field>
              </FieldRow>
              <FieldRow>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    SKU
                    <button type="button" className="ml-2 text-xs text-primary underline-offset-2 hover:underline"
                      onClick={() => set("skuMode", form.skuMode === "auto" ? "manual" : "auto")}>
                      {form.skuMode === "auto" ? "Switch to manual" : "Auto-generate"}
                    </button>
                  </Label>
                  <Input placeholder="e.g. SOL-001" value={form.sku} readOnly={form.skuMode === "auto"}
                    onChange={(e) => set("sku", e.target.value)}
                    className={form.skuMode === "auto" ? "bg-muted text-muted-foreground" : ""} />
                </div>
                <Field label="Barcode" hint="optional">
                  <Input placeholder="Scan or type…" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <EditableSelect
                  label="Category" required
                  value={form.category}
                  defaultOptions={DEFAULT_CATEGORIES}
                  extraOptions={customCategories}
                  onValueChange={(v) => set("category", v)}
                  onAdd={onAddCategory}
                  onDelete={onDeleteCategory}
                />
                <Field label="Brand" hint="optional">
                  {brands.length > 0 ? (
                    <EditableSelect
                      label="Brand"
                      value={form.brand}
                      defaultOptions={[]}
                      extraOptions={brands}
                      onValueChange={(v) => set("brand", v)}
                      onAdd={onAddBrand}
                      onDelete={onDeleteBrand}
                    />
                  ) : (
                    <div className="space-y-1">
                      <Input placeholder="e.g. Fortune, Aashirvaad…" value={form.brand}
                        onChange={(e) => { set("brand", e.target.value); if (e.target.value.trim()) onAddBrand(e.target.value.trim()); }} />
                    </div>
                  )}
                </Field>
              </FieldRow>
              <FieldRow>
                <EditableSelect
                  label="Product Type" required
                  value={form.productType}
                  defaultOptions={DEFAULT_PRODUCT_TYPES}
                  extraOptions={customProductTypes}
                  onValueChange={(v) => set("productType", v)}
                  onAdd={onAddProductType}
                  onDelete={onDeleteProductType}
                />
                <Field label="Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Product["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldRow>
            </div>

            {/* 2. Unit */}
            <div ref={unitRef} className="scroll-mt-2">
              <SectionHeader>2. Unit &amp; Packaging</SectionHeader>
              <FieldRow>
                <Field label="Primary Unit" required>
                  <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                {form.unit === "Custom…" && (
                  <Field label="Custom Unit Name" required>
                    <Input placeholder="e.g. Drum, Jar, Pouch…" value={form.customUnit} onChange={(e) => set("customUnit", e.target.value)} />
                  </Field>
                )}
              </FieldRow>
              <p className="text-xs text-muted-foreground mb-3">Optional: describe the packaging for display on invoices.</p>
              <FieldRow cols={3}>
                <Field label="Pack Size" hint="optional">
                  <Input placeholder="500" value={form.packSize} onChange={(e) => set("packSize", e.target.value)} />
                </Field>
                <Field label="Pack Unit" hint="optional">
                  <Input placeholder="mL" value={form.packUnit} onChange={(e) => set("packUnit", e.target.value)} />
                </Field>
                <Field label="Display Name" hint="optional">
                  <Input placeholder={`${form.packSize || "500"} ${form.packUnit || "mL"} ${effectiveUnit || "Bottle"}`}
                    value={form.packDisplayName} onChange={(e) => set("packDisplayName", e.target.value)} />
                </Field>
              </FieldRow>
              {(form.packSize || form.packUnit) && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  Preview: <span className="text-foreground font-medium">{form.packDisplayName || `${form.packSize} ${form.packUnit} ${effectiveUnit}`.trim()}</span>
                </div>
              )}
            </div>

            {/* 3. Pricing */}
            <div ref={pricingRef} className="scroll-mt-2">
              <SectionHeader>3. Pricing</SectionHeader>
              <FieldRow>
                <Field label="Purchase Price (₹)" hint="cost">
                  <Input type="number" placeholder="0.00" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
                </Field>
                <Field label="Selling Price (₹)">
                  <Input type="number" placeholder="0.00" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="MRP (₹)" required>
                  <Input type="number" placeholder="0.00" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
                </Field>
                <Field label="Minimum Selling Price (₹)" hint="optional">
                  <Input type="number" placeholder="0.00" value={form.minSellingPrice} onChange={(e) => set("minSellingPrice", e.target.value)} />
                </Field>
              </FieldRow>
              {numCost > 0 && numMrp > 0 && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm flex gap-4">
                  <span className="text-muted-foreground">Margin</span>
                  <span className="font-medium text-success">
                    ₹{(numMrp - numCost).toFixed(2)} ({((numMrp - numCost) / numMrp * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>

            {/* 4. Tax */}
            <div ref={taxRef} className="scroll-mt-2">
              <SectionHeader>4. Tax</SectionHeader>
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={form.gstEnabled} onCheckedChange={(v) => set("gstEnabled", v)} id="gst-toggle" />
                <Label htmlFor="gst-toggle" className="text-sm cursor-pointer">GST Applicable</Label>
              </div>
              {form.gstEnabled && (
                <>
                  <FieldRow>
                    <Field label="Tax Mode">
                      <Select value={form.taxMode} onValueChange={(v) => set("taxMode", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inclusive">Inclusive (GST included in price)</SelectItem>
                          <SelectItem value="Exclusive">Exclusive (GST added on top)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="GST Rate">
                      <Select value={form.gstRate} onValueChange={(v) => set("gstRate", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{GST_RATES.map((r) => <SelectItem key={r} value={r}>GST {r}%</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <Field label="HSN / SAC Code" hint="optional">
                      <Input placeholder="e.g. 30049099" value={form.hsn} onChange={(e) => set("hsn", e.target.value)} />
                    </Field>
                  </FieldRow>
                </>
              )}
            </div>

            {/* 5. Inventory */}
            <div ref={inventoryRef} className="scroll-mt-2">
              <SectionHeader>5. Inventory &amp; Location</SectionHeader>
              <FieldRow cols={3}>
                <Field label="Opening Stock">
                  <Input type="number" placeholder="0" value={form.openingStock} onChange={(e) => set("openingStock", e.target.value)} />
                </Field>
                <Field label="Minimum Stock">
                  <Input type="number" placeholder="0" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} />
                </Field>
                <Field label="Reorder Level">
                  <Input type="number" placeholder="0" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow cols={1}>
                <Field label="Storage Location / Rack" hint="optional">
                  <Input placeholder="e.g. Aisle 3 · Rack B · Shelf 2" value={form.location} onChange={(e) => set("location", e.target.value)} />
                </Field>
              </FieldRow>
            </div>

            {/* 6. Expiry */}
            <div ref={expiryRef} className="scroll-mt-2">
              <SectionHeader>6. Expiry</SectionHeader>
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={form.expiryTracking} onCheckedChange={(v) => set("expiryTracking", v)} id="expiry-toggle" />
                <Label htmlFor="expiry-toggle" className="text-sm cursor-pointer">Track Expiry for this product</Label>
              </div>
              {form.expiryTracking && (
                <FieldRow>
                  <Field label="Shelf Life" hint="optional">
                    <Input placeholder="e.g. 24 Months" value={form.shelfLife} onChange={(e) => set("shelfLife", e.target.value)} />
                  </Field>
                  <Field label="Expiry Date">
                    <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
                  </Field>
                </FieldRow>
              )}
            </div>

            {/* 7. Offers */}
            <div ref={offersRef} className="scroll-mt-2">
              <SectionHeader>7. Offers &amp; Discounts</SectionHeader>
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={form.offerEnabled} onCheckedChange={(v) => set("offerEnabled", v)} id="offer-toggle" />
                <Label htmlFor="offer-toggle" className="text-sm cursor-pointer">Enable offer on this product</Label>
              </div>
              {form.offerEnabled && (
                <>
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Quick presets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {OFFER_PRESETS.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => { set("offerType", "percent"); set("offerValue", String(pct)); }}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full border transition-colors",
                            form.offerValue === String(pct) && form.offerType === "percent"
                              ? "bg-orange-500 text-white border-orange-500"
                              : "border-border text-muted-foreground hover:border-orange-400 hover:text-orange-500"
                          )}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <FieldRow>
                    <Field label="Discount Type">
                      <Select value={form.offerType} onValueChange={(v) => set("offerType", v as "percent" | "flat")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">% Percentage off</SelectItem>
                          <SelectItem value="flat">₹ Flat amount off</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={`Discount Value ${form.offerType === "percent" ? "(%)" : "(₹)"}`}>
                      <Input type="number" placeholder={form.offerType === "percent" ? "10" : "20"}
                        value={form.offerValue} onChange={(e) => set("offerValue", e.target.value)} />
                    </Field>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <Field label="Offer Label" hint="optional">
                      <Input placeholder="e.g. Weekend Sale, Festival Offer, Clearance…"
                        value={form.offerLabel} onChange={(e) => set("offerLabel", e.target.value)} />
                    </Field>
                  </FieldRow>
                  {numMrp > 0 && numOffer > 0 && (
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">MRP</span>
                        <span className="line-through text-muted-foreground">{fmtINR(numMrp)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="font-semibold text-orange-700 dark:text-orange-400">
                          Customer pays ({numOffer}{form.offerType === "percent" ? "%" : "₹"} off)
                        </span>
                        <span className="font-bold text-orange-700 dark:text-orange-400 text-base">{fmtINR(offerPreviewPrice)}</span>
                      </div>
                      {form.offerType === "percent" && <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Customer saves {fmtINR(numMrp - offerPreviewPrice)}</p>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 8. Notes */}
            <div ref={notesRef} className="scroll-mt-2 pb-4">
              <SectionHeader>8. Notes</SectionHeader>
              <FieldRow cols={1}>
                <Field label="Product Description" hint="optional">
                  <Textarea placeholder="Customer-facing description…" rows={3}
                    value={form.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow cols={1}>
                <Field label="Internal Notes" hint="optional">
                  <Textarea placeholder="Internal notes, handling instructions…" rows={2}
                    value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </FieldRow>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">
            {!form.name && "Product name is required."}
            {form.name && !form.mrp && "MRP is required."}
            {canSubmit && <span className="text-success">Ready to save.</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>Save Product</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "warning"; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={`mt-2 font-display text-2xl font-semibold ${tone === "warning" ? "text-warning" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
