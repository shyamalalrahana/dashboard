import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
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
};

const initialProducts: Product[] = [
  { id: "PRD-001", name: "Sunflower Oil 1L", category: "Grocery", sku: "SOL-001", mrp: 180, costPrice: 140, qty: 240, unit: "btl", expiryDate: "2026-12-31", status: "Active" },
  { id: "PRD-002", name: "Basmati Rice 5kg", category: "Grocery", sku: "BRS-005", mrp: 480, costPrice: 360, qty: 180, unit: "bag", expiryDate: "2027-03-31", status: "Active" },
  { id: "PRD-003", name: "Wheat Flour 10kg", category: "Grocery", sku: "WFL-010", mrp: 380, costPrice: 290, qty: 320, unit: "bag", expiryDate: "2026-09-30", status: "Active" },
  { id: "PRD-004", name: "Shampoo 200ml", category: "Personal Care", sku: "SHP-200", mrp: 130, costPrice: 75, qty: 90, unit: "btl", expiryDate: "2026-06-30", status: "Active" },
  { id: "PRD-005", name: "Detergent Powder 1kg", category: "Household", sku: "DTP-001", mrp: 110, costPrice: 65, qty: 60, unit: "pkt", expiryDate: "2027-06-30", status: "Active" },
  { id: "PRD-006", name: "Toor Dal 1kg", category: "Grocery", sku: "TDL-001", mrp: 160, costPrice: 120, qty: 0, unit: "pkt", expiryDate: "2025-12-31", status: "Discontinued" },
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "Grocery", sku: "", mrp: "", costPrice: "",
    qty: "", unit: "pkt", expiryDate: "", status: "Active" as Product["status"],
  });

  const active = products.filter((p) => p.status === "Active");
  const expiring = products.filter((p) => expiryStatus(p.expiryDate) === "expiring" || expiryStatus(p.expiryDate) === "expired");
  const totalValue = products.reduce((sum, p) => sum + p.costPrice * p.qty, 0);

  function handleSubmit() {
    if (!form.name || !form.sku || !form.mrp || !form.expiryDate) return;
    const next: Product = {
      id: `PRD-${String(products.length + 1).padStart(3, "0")}`,
      name: form.name,
      category: form.category,
      sku: form.sku,
      mrp: Number(form.mrp),
      costPrice: Number(form.costPrice) || 0,
      qty: Number(form.qty) || 0,
      unit: form.unit,
      expiryDate: form.expiryDate,
      status: form.status,
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
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All Products</h2>
            <span className="text-sm text-muted-foreground">{products.length} products</span>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
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
                    <TableCell>
                      <Badge variant={
                        p.status === "Active" ? "default" :
                        p.status === "Inactive" ? "secondary" : "outline"
                      }>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
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
                <Label>SKU</Label>
                <Input placeholder="e.g. BC-100" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>MRP (₹)</Label>
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
              <Label>Expiry Date</Label>
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
