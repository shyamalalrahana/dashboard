import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · ShopOS" },
      { name: "description", content: "Product catalogue with pricing and expiry tracking." },
    ],
  }),
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  costPrice: number;
  qty: number;
  unit: string;
  expiryDate: string;
  status: "Active" | "Inactive" | "Discontinued";
  createdAt: string; // ISO timestamp
};

let idCounter = 7;
function nextId() { return `PRD-${String(idCounter++).padStart(3, "0")}`; }

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const initialProducts: Product[] = [
  { id: "PRD-001", name: "Sunflower Oil 1L",     category: "Grocery",       sku: "SOL-001", mrp: 180, costPrice: 140, qty: 240, unit: "btl", expiryDate: "2026-12-31", status: "Active",       createdAt: "2026-06-01T09:15:00" },
  { id: "PRD-002", name: "Basmati Rice 5kg",     category: "Grocery",       sku: "BRS-005", mrp: 480, costPrice: 360, qty: 180, unit: "bag", expiryDate: "2027-03-31", status: "Active",       createdAt: "2026-06-01T09:20:00" },
  { id: "PRD-003", name: "Wheat Flour 10kg",     category: "Grocery",       sku: "WFL-010", mrp: 380, costPrice: 290, qty: 320, unit: "bag", expiryDate: "2026-09-30", status: "Active",       createdAt: "2026-06-02T10:00:00" },
  { id: "PRD-004", name: "Shampoo 200ml",        category: "Personal Care", sku: "SHP-200", mrp: 130, costPrice: 75,  qty: 90,  unit: "btl", expiryDate: "2026-06-30", status: "Active",       createdAt: "2026-06-03T11:30:00" },
  { id: "PRD-005", name: "Detergent Powder 1kg", category: "Household",     sku: "DTP-001", mrp: 110, costPrice: 65,  qty: 60,  unit: "pkt", expiryDate: "2027-06-30", status: "Active",       createdAt: "2026-06-05T14:00:00" },
  { id: "PRD-006", name: "Toor Dal 1kg",         category: "Grocery",       sku: "TDL-001", mrp: 160, costPrice: 120, qty: 0,   unit: "pkt", expiryDate: "2025-12-31", status: "Discontinued", createdAt: "2026-05-10T08:45:00" },
];

const CATEGORIES = ["Grocery", "Personal Care", "Household", "Beverages", "Snacks", "Dairy", "Electronics", "Other"];

function expiryStatus(dateStr: string) {
  const exp = new Date(dateStr);
  const now = new Date();
  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "ok";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "Grocery", sku: "", mrp: "", costPrice: "", qty: "", unit: "pkt", expiryDate: "", status: "Active" as Product["status"] });
  const [form, setForm] = useState({
    name: "", category: "Grocery", sku: "", mrp: "", costPrice: "",
    qty: "", unit: "pkt", expiryDate: "", status: "Active" as Product["status"],
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
    setEditForm({ name: p.name, category: p.category, sku: p.sku, mrp: String(p.mrp), costPrice: String(p.costPrice), qty: String(p.qty), unit: p.unit, expiryDate: p.expiryDate, status: p.status });
  }
  function handleSaveEdit() {
    if (!editItem || !editForm.name || !editForm.mrp) return;
    setProducts(products.map((p) => p.id === editItem.id ? { ...p, ...editForm, mrp: Number(editForm.mrp), costPrice: Number(editForm.costPrice) || 0, qty: Number(editForm.qty) || 0 } : p));
    setEditItem(null);
    toast.success("Product updated");
  }
  function handleDelete() {
    if (!deleteId) return;
    setProducts(products.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Product deleted");
  }

  function handleSubmit() {
    if (!form.name || !form.sku || !form.mrp || !form.expiryDate) return;
    const next: Product = {
      id: nextId(),
      name: form.name,
      category: form.category,
      sku: form.sku,
      mrp: Number(form.mrp),
      costPrice: Number(form.costPrice) || 0,
      qty: Number(form.qty) || 0,
      unit: form.unit,
      expiryDate: form.expiryDate,
      status: form.status,
      createdAt: new Date().toISOString(),
    };
    setProducts([next, ...products]);
    setForm({ name: "", category: "Grocery", sku: "", mrp: "", costPrice: "", qty: "", unit: "pkt", expiryDate: "", status: "Active" });
    setOpen(false);
    toast.success("Product added", { description: next.name });
  }

  return (
    <PageShell
      title="Products"
      description="Manage your product catalogue — pricing, stock, and expiry dates."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
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
                <TableHead className="w-16" />
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
                    <TableCell>
                      <Badge variant="secondary">{p.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {p.mrp.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.costPrice.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.qty} <span className="text-muted-foreground text-xs">{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      <span className={
                        exp === "expired" ? "text-destructive font-medium text-sm" :
                        exp === "expiring" ? "text-warning font-medium text-sm" :
                        "text-sm"
                      }>
                        {formatDate(p.expiryDate)}
                        {exp === "expired" && <span className="ml-1.5 text-xs">(Expired)</span>}
                        {exp === "expiring" && <span className="ml-1.5 text-xs">(Soon)</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        p.status === "Active" ? "default" :
                        p.status === "Inactive" ? "secondary" : "outline"
                      }>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Sunflower Oil 1L" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>SKU <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. BC-100" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>MRP (₹) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="180" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (₹)</Label>
                <Input type="number" placeholder="85" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" placeholder="100" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input placeholder="pkt" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Product["status"] })}>
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
              <Label>Expiry Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.sku || !form.mrp || !form.expiryDate}>
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

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
