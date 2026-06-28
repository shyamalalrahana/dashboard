import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpCircle, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

// ── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Grocery", "Personal Care", "Household", "Beverages", "Snacks",
  "Dairy", "Electronics", "Ayurvedic", "Clothing", "Hardware", "Other",
];

export const PRODUCT_TYPES = [
  "Goods", "Service", "Raw Material", "Finished Product",
  "Consumable", "Packaging Material",
];

export const UNITS = [
  // Weight
  "mg", "g", "kg", "ton",
  // Liquid
  "mL", "L",
  // Quantity
  "Piece", "Box", "Bottle", "Packet", "Carton", "Dozen", "Bundle", "Pair",
  // Medical
  "Tablet", "Capsule", "Strip", "Vial",
  // Textile
  "Meter", "Roll",
  // Grocery / Bulk
  "Sack", "Bag",
  // Custom
  "Custom…",
];

export const GST_RATES = ["0", "3", "5", "12", "18", "28"];

// ── Types ─────────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  productType: string;
  sku: string;
  barcode: string;
  // Pricing
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  minSellingPrice: number;
  // Unit / Packaging
  unit: string;
  packSize: string;
  packUnit: string;
  packDisplayName: string;
  // Tax
  gstEnabled: boolean;
  taxMode: string;
  gstRate: string;
  hsn: string;
  // Inventory
  qty: number;
  minStock: number;
  reorderLevel: number;
  location: string;
  // Expiry
  expiryTracking: boolean;
  shelfLife: string;
  expiryDate: string;
  // Notes
  description: string;
  notes: string;
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
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let idCounter = 7;
function nextId() { return `PRD-${String(idCounter++).padStart(3, "0")}`; }

function generateSku(name: string, category: string): string {
  const part = ((category.slice(0, 2) + name.replace(/\s+/g, "").slice(0, 4))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""));
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `${part}-${num}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function expiryStatus(dateStr: string) {
  if (!dateStr) return "ok";
  const exp = new Date(dateStr);
  const now = new Date();
  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "ok";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const initialProducts: Product[] = [
  {
    id: "PRD-001", name: "Sunflower Oil 1L", category: "Grocery", brand: "", productType: "Goods",
    sku: "SOL-001", barcode: "", mrp: 180, sellingPrice: 170, costPrice: 140, minSellingPrice: 145,
    unit: "btl", packSize: "1", packUnit: "L", packDisplayName: "1 L Bottle",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "5", hsn: "15121100",
    qty: 240, minStock: 20, reorderLevel: 50, location: "",
    expiryTracking: true, shelfLife: "18 Months", expiryDate: "2026-12-31",
    description: "", notes: "", status: "Active", createdAt: "2026-06-01T09:15:00",
  },
  {
    id: "PRD-002", name: "Basmati Rice 5kg", category: "Grocery", brand: "", productType: "Goods",
    sku: "BRS-005", barcode: "", mrp: 480, sellingPrice: 460, costPrice: 360, minSellingPrice: 380,
    unit: "bag", packSize: "5", packUnit: "kg", packDisplayName: "5 kg Bag",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "5", hsn: "10063020",
    qty: 180, minStock: 10, reorderLevel: 30, location: "",
    expiryTracking: true, shelfLife: "12 Months", expiryDate: "2027-03-31",
    description: "", notes: "", status: "Active", createdAt: "2026-06-01T09:20:00",
  },
  {
    id: "PRD-003", name: "Wheat Flour 10kg", category: "Grocery", brand: "", productType: "Goods",
    sku: "WFL-010", barcode: "", mrp: 380, sellingPrice: 360, costPrice: 290, minSellingPrice: 310,
    unit: "bag", packSize: "10", packUnit: "kg", packDisplayName: "10 kg Bag",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "0", hsn: "11010000",
    qty: 320, minStock: 20, reorderLevel: 50, location: "",
    expiryTracking: true, shelfLife: "6 Months", expiryDate: "2026-09-30",
    description: "", notes: "", status: "Active", createdAt: "2026-06-02T10:00:00",
  },
  {
    id: "PRD-004", name: "Shampoo 200ml", category: "Personal Care", brand: "", productType: "Goods",
    sku: "SHP-200", barcode: "", mrp: 130, sellingPrice: 125, costPrice: 75, minSellingPrice: 80,
    unit: "btl", packSize: "200", packUnit: "mL", packDisplayName: "200 mL Bottle",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "18", hsn: "33051000",
    qty: 90, minStock: 10, reorderLevel: 25, location: "",
    expiryTracking: true, shelfLife: "24 Months", expiryDate: "2026-06-30",
    description: "", notes: "", status: "Active", createdAt: "2026-06-03T11:30:00",
  },
  {
    id: "PRD-005", name: "Detergent Powder 1kg", category: "Household", brand: "", productType: "Goods",
    sku: "DTP-001", barcode: "", mrp: 110, sellingPrice: 105, costPrice: 65, minSellingPrice: 70,
    unit: "pkt", packSize: "1", packUnit: "kg", packDisplayName: "1 kg Packet",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "18", hsn: "34022090",
    qty: 60, minStock: 10, reorderLevel: 20, location: "",
    expiryTracking: false, shelfLife: "", expiryDate: "2027-06-30",
    description: "", notes: "", status: "Active", createdAt: "2026-06-05T14:00:00",
  },
  {
    id: "PRD-006", name: "Toor Dal 1kg", category: "Grocery", brand: "", productType: "Goods",
    sku: "TDL-001", barcode: "", mrp: 160, sellingPrice: 155, costPrice: 120, minSellingPrice: 125,
    unit: "pkt", packSize: "1", packUnit: "kg", packDisplayName: "1 kg Packet",
    gstEnabled: true, taxMode: "Exclusive", gstRate: "5", hsn: "07135000",
    qty: 0, minStock: 5, reorderLevel: 15, location: "",
    expiryTracking: true, shelfLife: "12 Months", expiryDate: "2025-12-31",
    description: "", notes: "", status: "Discontinued", createdAt: "2026-05-10T08:45:00",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState("");
  const [stockInQty, setStockInQty] = useState("");
  const [stockInRef, setStockInRef] = useState("");
  const [editForm, setEditForm] = useState({
    name: "", category: "Grocery", sku: "", mrp: "", costPrice: "", qty: "", unit: "pkt",
    expiryDate: "", status: "Active" as Product["status"],
  });

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
    toast.success("Product added", { description: product.name });
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
        <Stat label="Inventory value" value={`₹${totalValue.toLocaleString("en-IN")}`} />
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
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <TableHead className="text-right">Cost (₹)</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => {
                const exp = expiryStatus(p.expiryDate);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {p.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{p.mrp.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{p.costPrice.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.qty} <span className="text-muted-foreground text-xs">{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      <span className={
                        exp === "expired" ? "text-destructive font-medium text-sm" :
                        exp === "expiring" ? "text-warning font-medium text-sm" : "text-sm"
                      }>
                        {formatDate(p.expiryDate)}
                        {exp === "expired" && <span className="ml-1.5 text-xs">(Expired)</span>}
                        {exp === "expiring" && <span className="ml-1.5 text-xs">(Soon)</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(p.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Active" ? "default" : p.status === "Inactive" ? "secondary" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-success hover:text-success hover:bg-success/10" onClick={() => openStockIn(p.id)}>
                          <ArrowUpCircle className="h-3.5 w-3.5" /> Stock In
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
      <AddProductDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddProduct} />

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
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                      {p.name}
                      <span className="text-muted-foreground ml-1.5 text-xs">({p.qty} {p.unit})</span>
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

// ── Add Product Dialog (multi-section) ───────────────────────────────────────

const NAV_SECTIONS = [
  { key: "basic",     label: "Basic Info" },
  { key: "unit",      label: "Unit & Packaging" },
  { key: "pricing",   label: "Pricing" },
  { key: "tax",       label: "Tax" },
  { key: "inventory", label: "Inventory" },
  { key: "expiry",    label: "Expiry" },
  { key: "notes",     label: "Notes" },
] as const;

type SectionKey = typeof NAV_SECTIONS[number]["key"];

function defaultForm(): AddProductForm {
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

function AddProductDialog({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Product) => void;
}) {
  const [form, setForm] = useState<AddProductForm>(defaultForm);
  const [activeSection, setActiveSection] = useState<SectionKey>("basic");
  const scrollRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<SectionKey, React.RefObject<HTMLDivElement>> = {
    basic:     useRef<HTMLDivElement>(null),
    unit:      useRef<HTMLDivElement>(null),
    pricing:   useRef<HTMLDivElement>(null),
    tax:       useRef<HTMLDivElement>(null),
    inventory: useRef<HTMLDivElement>(null),
    expiry:    useRef<HTMLDivElement>(null),
    notes:     useRef<HTMLDivElement>(null),
  };

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setForm(defaultForm());
      setActiveSection("basic");
    }
  }, [open]);

  // Auto-generate SKU when name/category changes
  useEffect(() => {
    if (form.skuMode === "auto" && form.name) {
      setForm((f) => ({ ...f, sku: generateSku(f.name, f.category) }));
    }
  }, [form.name, form.category, form.skuMode]);

  function scrollTo(key: SectionKey) {
    setActiveSection(key);
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function set<K extends keyof AddProductForm>(key: K, value: AddProductForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const effectiveUnit = form.unit === "Custom…" ? form.customUnit : form.unit;

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
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice) || Number(form.mrp),
      costPrice: Number(form.costPrice) || 0,
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
      status: form.status,
      createdAt: new Date().toISOString(),
    };
    onAdd(product);
  }

  const canSubmit = !!form.name && !!form.mrp;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg">Add Product</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below. Only Name and MRP are required.</p>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left nav */}
          <nav className="w-44 border-r border-border py-4 px-2 shrink-0 overflow-y-auto">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => scrollTo(s.key)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-0.5",
                  activeSection === s.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Scrollable sections */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

            {/* 1. Basic Information */}
            <div ref={sectionRefs.basic} className="scroll-mt-2">
              <SectionHeader>1. Basic Information</SectionHeader>
              <FieldRow cols={1}>
                <Field label="Product Name" required>
                  <Input
                    placeholder="e.g. Sunflower Oil 1L"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    autoFocus
                  />
                </Field>
              </FieldRow>
              <FieldRow>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    SKU
                    <button
                      type="button"
                      className="ml-2 text-xs text-primary underline-offset-2 hover:underline"
                      onClick={() => set("skuMode", form.skuMode === "auto" ? "manual" : "auto")}
                    >
                      {form.skuMode === "auto" ? "Switch to manual" : "Auto-generate"}
                    </button>
                  </Label>
                  <Input
                    placeholder="e.g. SOL-001"
                    value={form.sku}
                    readOnly={form.skuMode === "auto"}
                    onChange={(e) => set("sku", e.target.value)}
                    className={form.skuMode === "auto" ? "bg-muted text-muted-foreground" : ""}
                  />
                </div>
                <Field label="Barcode" hint="optional">
                  <Input placeholder="Scan or type…" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="Category" required>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Brand" hint="optional">
                  <Input placeholder="e.g. Fortune, Aashirvaad…" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="Product Type" required>
                  <Select value={form.productType} onValueChange={(v) => set("productType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
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

            {/* 2. Unit & Packaging */}
            <div ref={sectionRefs.unit} className="scroll-mt-2">
              <SectionHeader>2. Unit &amp; Packaging</SectionHeader>
              <FieldRow>
                <Field label="Primary Unit" required>
                  <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                {form.unit === "Custom…" && (
                  <Field label="Custom Unit Name" required>
                    <Input placeholder="e.g. Drum, Jar, Pouch…" value={form.customUnit} onChange={(e) => set("customUnit", e.target.value)} />
                  </Field>
                )}
              </FieldRow>
              <p className="text-xs text-muted-foreground mb-3">
                Optional: describe the packaging for display on invoices (e.g. "500 mL Bottle", "1 kg Bag").
              </p>
              <FieldRow cols={3}>
                <Field label="Pack Size" hint="optional">
                  <Input placeholder="500" value={form.packSize} onChange={(e) => set("packSize", e.target.value)} />
                </Field>
                <Field label="Pack Unit" hint="optional">
                  <Input placeholder="mL" value={form.packUnit} onChange={(e) => set("packUnit", e.target.value)} />
                </Field>
                <Field label="Display Name" hint="optional">
                  <Input
                    placeholder={`${form.packSize || "500"} ${form.packUnit || "mL"} ${effectiveUnit || "Bottle"}`}
                    value={form.packDisplayName}
                    onChange={(e) => set("packDisplayName", e.target.value)}
                  />
                </Field>
              </FieldRow>
              {(form.packSize || form.packUnit) && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  Preview: <span className="text-foreground font-medium">{form.packDisplayName || `${form.packSize} ${form.packUnit} ${effectiveUnit}`.trim()}</span>
                </div>
              )}
            </div>

            {/* 3. Pricing */}
            <div ref={sectionRefs.pricing} className="scroll-mt-2">
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
              {form.costPrice && form.mrp && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm flex gap-4">
                  <span className="text-muted-foreground">Margin</span>
                  <span className="font-medium text-success">
                    ₹{(Number(form.mrp) - Number(form.costPrice)).toFixed(2)}
                    {" "}({((Number(form.mrp) - Number(form.costPrice)) / Number(form.mrp) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>

            {/* 4. Tax */}
            <div ref={sectionRefs.tax} className="scroll-mt-2">
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
                        <SelectContent>
                          {GST_RATES.map((r) => <SelectItem key={r} value={r}>GST {r}%</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <FieldRow cols={1}>
                    <Field label="HSN / SAC Code" hint="optional">
                      <Input placeholder="e.g. 30049099" value={form.hsn} onChange={(e) => set("hsn", e.target.value)} />
                    </Field>
                  </FieldRow>
                  {form.mrp && form.gstRate !== "0" && (
                    <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm flex gap-4 flex-wrap">
                      {form.taxMode === "Exclusive" ? (
                        <>
                          <span className="text-muted-foreground">MRP + GST {form.gstRate}%</span>
                          <span className="font-medium">= ₹{(Number(form.mrp) * (1 + Number(form.gstRate) / 100)).toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground">GST {form.gstRate}% incl. in ₹{form.mrp}</span>
                          <span className="font-medium">Taxable: ₹{(Number(form.mrp) / (1 + Number(form.gstRate) / 100)).toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 5. Inventory */}
            <div ref={sectionRefs.inventory} className="scroll-mt-2">
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
            <div ref={sectionRefs.expiry} className="scroll-mt-2">
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

            {/* 7. Notes */}
            <div ref={sectionRefs.notes} className="scroll-mt-2 pb-4">
              <SectionHeader>7. Notes</SectionHeader>
              <FieldRow cols={1}>
                <Field label="Product Description" hint="optional">
                  <Textarea
                    placeholder="Customer-facing description…"
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </FieldRow>
              <FieldRow cols={1}>
                <Field label="Internal Notes" hint="optional">
                  <Textarea
                    placeholder="Internal notes, handling instructions…"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
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
