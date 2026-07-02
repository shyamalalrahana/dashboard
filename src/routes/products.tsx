import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpCircle, Eye, Package, Pencil, Percent, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AddProductDialog, type MasterOption, type MasterOptions } from "@/components/add-product-dialog";
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
import { addOption, deleteOption, fetchAllOptions, renameOption, type OptionKind } from "@/lib/options.server";
import {
  OFFER_PRESETS, type Product, type ProductOffer,
  effectivePrice, expiryStatus, fmtINR, formatDate,
} from "@/lib/product-types";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "@/lib/products.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · ShopOS" },
      { name: "description", content: "Dynamic product master — pricing, stock, variants, and expiry tracking." },
    ],
  }),
  loader: async () => {
    const [products, options] = await Promise.all([fetchProducts(), fetchAllOptions()]);
    return { products, options };
  },
  component: ProductsPage,
});

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ProductsPage() {
  const loaderData = Route.useLoaderData();
  const [products, setProducts] = useState<Product[]>((loaderData.products as unknown as Product[]) ?? []);
  const [options, setOptions] = useState<MasterOptions>(loaderData.options ?? {});
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

  const newRowRef = useRef<HTMLTableRowElement>(null);

  const categories = (options.category ?? []).map((o) => o.value);

  // Re-sync master data whenever the Add/Edit dialog opens, so a category (etc.)
  // created in another tab/session — or missed by an optimistic update — is always current.
  useEffect(() => {
    if (!addOpen && !editItem) return;
    fetchAllOptions().then(setOptions).catch(() => { /* keep existing options on failure */ });
  }, [addOpen, editItem]);

  // ── Master-data handlers (shared by every editable dropdown) ────────────────
  const optionHandlers = {
    onAddOption: async (kind: string, value: string): Promise<MasterOption | null> => {
      try {
        const created = await addOption({ data: { kind: kind as OptionKind, value } });
        if (created) {
          setOptions((prev) => ({ ...prev, [kind]: [...(prev[kind] ?? []), created] }));
          toast.success(`Added "${value}"`);
        }
        return created;
      } catch {
        toast.error("Could not add option");
        return null;
      }
    },
    onRenameOption: async (kind: string, id: string, value: string) => {
      setOptions((prev) => ({
        ...prev,
        [kind]: (prev[kind] ?? []).map((o) => (o.id === id ? { ...o, value } : o)),
      }));
      try { await renameOption({ data: { id, value } }); } catch { toast.error("Rename failed to save"); }
    },
    onDeleteOption: async (kind: string, id: string): Promise<{ ok: boolean }> => {
      try {
        const result = await deleteOption({ data: { id } });
        if (!result.ok) {
          const label = "value" in result ? result.value : "This value";
          const n = "inUseCount" in result ? result.inUseCount : 0;
          toast.error(`Can't delete "${label}"`, {
            description: `It's used by ${n} product${n === 1 ? "" : "s"}. Remove it from ${n === 1 ? "that product" : "those products"} first.`,
          });
          return { ok: false };
        }
        setOptions((prev) => ({ ...prev, [kind]: (prev[kind] ?? []).filter((o) => o.id !== id) }));
        return { ok: true };
      } catch {
        toast.error("Could not delete option");
        return { ok: false };
      }
    },
  };

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
  }

  function openStockIn(productId = "") {
    setStockInProductId(productId);
    setStockInQty("");
    setStockInRef("");
    setStockInOpen(true);
  }
  async function handleStockIn() {
    const product = products.find((p) => p.id === stockInProductId);
    if (!product || !stockInQty || Number(stockInQty) <= 0) return;
    const added = Number(stockInQty);
    const newQty = product.qty + added;
    const updated = { ...product, qty: newQty };
    setProducts(products.map((p) => p.id === product.id ? updated : p));
    toast.success("Stock added", { description: `+${added} ${product.unit} · ${product.name} · New total: ${newQty}` });
    setStockInOpen(false);
    try { await updateProduct({ data: updated }); } catch { toast.error("Stock update failed to save"); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setProducts(products.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Product deleted");
    try { await deleteProduct({ data: { id: deleteId } }); } catch { toast.error("Delete failed to save"); }
  }

  async function handleSaveProduct(product: Product) {
    const isEdit = !!product.id;
    if (isEdit) {
      setEditItem(null);
      setProducts((prev) => prev.map((p) => p.id === product.id ? product : p));
      toast.success("Product updated", { description: product.name });
      try { await updateProduct({ data: product as Product & { id: string } }); } catch (err) {
        toast.error("Update failed to save", { description: err instanceof Error ? err.message : "Please try again." });
      }
      return;
    }
    setAddOpen(false);
    try {
      const saved = (await createProduct({ data: product })) as unknown as Product;
      setProducts((prev) => [saved, ...prev]);
      setNewlyAddedId(saved.id);
      toast.success("Product added", { description: saved.name });
      setTimeout(() => { newRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
      setTimeout(() => setNewlyAddedId(null), 3000);
    } catch (err) {
      toast.error("Could not save product", { description: err instanceof Error ? err.message : "Please try again." });
    }
  }

  async function handleSetOffer(productId: string, offer: ProductOffer) {
    const product = products.find((p) => p.id === productId);
    setProducts(products.map((p) => p.id === productId ? { ...p, offer } : p));
    setOfferTargetId(null);
    toast.success(offer.enabled ? `Offer set: ${offer.value}${offer.type === "percent" ? "%" : "₹"} off` : "Offer removed");
    if (product) {
      try { await updateProduct({ data: { ...product, offer } }); } catch { toast.error("Offer failed to save"); }
    }
  }

  return (
    <PageShell
      title="Products"
      description="Dynamic product master — pricing, stock, variants, and expiry tracking."
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
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">MRP (₹)</TableHead>
                <TableHead className="text-right">Price (₹)</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground text-sm">
                    No products yet. Click “Add Product” to create your first one.
                  </TableCell>
                </TableRow>
              )}
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
                        {p.sku}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                        onClick={() => setViewItem(p)}
                      >
                        {p.name}
                      </button>
                      {p.hasVariants && p.variants.items.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">({p.variants.items.length} variants)</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{p.category || "—"}</Badge></TableCell>
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

      {/* Add Product — dynamic product master */}
      <AddProductDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveProduct}
        options={options}
        handlers={optionHandlers}
      />

      {/* Edit Product — same dynamic form, pre-filled */}
      <AddProductDialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSaveProduct}
        editProduct={editItem}
        options={options}
        handlers={optionHandlers}
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

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <Separator className="mb-3" />
      {children}
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
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono border border-border rounded px-2 py-0.5">{p.sku}</span>
                <Badge variant="secondary">{p.category || "—"}</Badge>
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

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {p.images.primary && (
            <div className="h-36 w-36 rounded-lg border border-border overflow-hidden bg-muted">
              <img src={p.images.primary} alt={p.name} className="h-full w-full object-cover" />
            </div>
          )}

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

          <ViewSection title="Basic">
            <ViewRow label="SKU" value={p.sku} />
            <ViewRow label="Barcode" value={p.barcode} />
            <ViewRow label="Brand" value={p.brand} />
            <ViewRow label="Product Type" value={p.productType} />
            <ViewRow label="Description" value={p.description} />
            <ViewRow label="Added On" value={fmtDateTime(p.createdAt)} />
          </ViewSection>

          <ViewSection title="Unit & Packaging">
            <ViewRow label="Primary Unit" value={p.unit} />
            <ViewRow label="Pack Display Name" value={p.packDisplayName} />
            <ViewRow label="Pack Size" value={p.packSize ? `${p.packSize} ${p.packUnit}` : undefined} />
          </ViewSection>

          <ViewSection title="Pricing">
            <ViewRow label="Purchase Price" value={p.costPrice ? fmtINR(p.costPrice) : undefined} />
            <ViewRow label="Min. Selling Price" value={p.minSellingPrice ? fmtINR(p.minSellingPrice) : undefined} />
            <ViewRow label="Wholesale Price" value={p.wholesalePrice ? fmtINR(p.wholesalePrice) : undefined} />
            <ViewRow label="Distributor Price" value={p.distributorPrice ? fmtINR(p.distributorPrice) : undefined} />
            <ViewRow label="Margin" value={p.costPrice && p.mrp ? `${fmtINR(p.mrp - p.costPrice)} (${((p.mrp - p.costPrice) / p.mrp * 100).toFixed(1)}%)` : undefined} />
          </ViewSection>

          <ViewSection title="Tax">
            <ViewRow label="Tax" value={p.gstEnabled ? (p.taxProfile || `${p.gstRate}%`) + ` (${p.taxMode})` : "Not applicable"} />
            <ViewRow label="HSN / SAC Code" value={p.hsn} />
          </ViewSection>

          <ViewSection title="Inventory">
            <ViewRow label="Current Stock" value={`${p.qty} ${p.unit}`} />
            <ViewRow label="Min. Stock" value={p.minStock ? `${p.minStock} ${p.unit}` : undefined} />
            <ViewRow label="Max. Stock" value={p.maxStock ? `${p.maxStock} ${p.unit}` : undefined} />
            <ViewRow label="Reorder Level" value={p.reorderLevel ? `${p.reorderLevel} ${p.unit}` : undefined} />
            <ViewRow label="Warehouse" value={p.warehouse} />
            <ViewRow label="Location" value={p.location} />
            <ViewRow label="Rack / Bin" value={p.rack || p.bin ? [p.rack, p.bin].filter(Boolean).join(" / ") : undefined} />
          </ViewSection>

          {p.attributes.length > 0 && (
            <ViewSection title="Custom Attributes">
              {p.attributes.map((a, i) => <ViewRow key={i} label={a.name} value={a.value} />)}
            </ViewSection>
          )}

          {p.hasVariants && p.variants.items.length > 0 && (
            <ViewSection title={`Variants (${p.variants.items.length})`}>
              <div className="rounded-lg border border-border divide-y divide-border">
                <div className="grid grid-cols-[1fr_110px_80px_70px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>Variant</span><span>SKU</span><span>Price</span><span>Stock</span>
                </div>
                {p.variants.items.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_110px_80px_70px] gap-2 px-3 py-1.5 text-sm">
                    <span className="truncate">{v.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{v.sku}</span>
                    <span className="tabular-nums">{fmtINR(v.price)}</span>
                    <span className="tabular-nums">{v.stock}</span>
                  </div>
                ))}
              </div>
            </ViewSection>
          )}

          {(p.supplierName || p.supplierCode || p.leadTime || p.minOrder) && (
            <ViewSection title="Supplier">
              <ViewRow label="Default Supplier" value={p.supplierName} />
              <ViewRow label="Supplier Code" value={p.supplierCode} />
              <ViewRow label="Lead Time" value={p.leadTime} />
              <ViewRow label="Minimum Order" value={p.minOrder} />
            </ViewSection>
          )}

          {(Object.values(p.modules).some(Boolean) || p.expiryTracking) && (
            <ViewSection title="Enabled Modules">
              <div className="flex flex-wrap gap-1.5">
                {p.modules.batch && <Badge variant="outline">Batch Tracking</Badge>}
                {p.expiryTracking && <Badge variant="outline">Expiry Tracking</Badge>}
                {p.modules.serial && <Badge variant="outline">Serial Number</Badge>}
                {p.modules.warranty && <Badge variant="outline">Warranty{p.warranty ? `: ${p.warranty}` : ""}</Badge>}
                {p.modules.manufacturing && <Badge variant="outline">Manufacturing</Badge>}
                {p.modules.service && <Badge variant="outline">Service Item</Badge>}
              </div>
            </ViewSection>
          )}

          {p.expiryTracking && (
            <ViewSection title="Expiry">
              <ViewRow label="Shelf Life" value={p.shelfLife} />
              <ViewRow label="Manufacturing Date" value={p.mfgDate ? formatDate(p.mfgDate) : undefined} />
              <div className="flex gap-3 text-sm py-1.5">
                <span className="w-40 shrink-0 text-muted-foreground">Expiry Date</span>
                <span className={cn("font-medium", exp === "expired" ? "text-destructive" : exp === "expiring" ? "text-warning" : "")}>
                  {formatDate(p.expiryDate)}
                  {exp === "expired" && " (Expired)"}
                  {exp === "expiring" && " (Expiring Soon)"}
                </span>
              </div>
            </ViewSection>
          )}

          {p.offer.enabled && (
            <ViewSection title="Active Offer">
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
            </ViewSection>
          )}

          {p.notes && (
            <ViewSection title="Notes">
              <ViewRow label="Internal Notes" value={p.notes} />
            </ViewSection>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  <Label className="text-sm">Value</Label>
                  <Input type="number" min="0" placeholder={type === "percent" ? "e.g. 10" : "e.g. 50"} value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Offer Label <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input placeholder="e.g. Weekend Sale" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              {numVal > 0 && base > 0 && (
                <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 px-3 py-2.5 flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground line-through">{fmtINR(base)}</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{fmtINR(ep)}</span>
                  <span className="text-xs text-muted-foreground">after offer</span>
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

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "warning"; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={cn("mt-2 font-display text-2xl font-bold", tone === "warning" && "text-warning")}>{value}</p>
      </CardContent>
    </Card>
  );
}
