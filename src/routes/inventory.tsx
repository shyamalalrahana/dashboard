import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, ChevronRight, History, Package, Plus, Search, Trash2 } from "lucide-react";
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
import {
  inventoryItems as initialItems,
  stockTransactions as initialTxns,
  type InventoryItem,
  type StockTransaction,
} from "@/lib/mock-data";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory · ShopOS" },
      { name: "description", content: "Stock levels, stock-in and usage tracking." },
    ],
  }),
  component: InventoryPage,
});

const CATEGORIES = ["Raw Material", "Finished", "Packaging"];
const UNITS = ["kg", "L", "pcs", "btl", "bag", "pkt", "roll", "m"];

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [txns, setTxns] = useState<StockTransaction[]>(initialTxns);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // dialogs
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // pre-select item when opening Stock In / Usage from a row
  const [preselect, setPreselect] = useState("");

  // forms
  const [addForm, setAddForm] = useState({ name: "", category: "Raw Material", unit: "kg", openingStock: "", minimumStock: "" });
  const [stockInForm, setStockInForm] = useState({ itemId: "", qty: "", reference: "", date: "" });
  const [usageForm, setUsageForm] = useState({ itemId: "", qty: "", reason: "", date: "" });

  // derived
  const totalItems = items.length;
  const totalAvailable = items.reduce((s, i) => s + i.currentStock, 0);
  const lowStock = items.filter((i) => i.currentStock <= i.minimumStock && i.currentStock > 0);
  const outOfStock = items.filter((i) => i.currentStock === 0);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || i.category === categoryFilter;
    return matchSearch && matchCat;
  });

  function itemStatus(item: InventoryItem) {
    if (item.currentStock === 0) return "Out of Stock";
    if (item.currentStock <= item.minimumStock) return "Low Stock";
    return "In Stock";
  }

  function openStockIn(itemId?: string) {
    setStockInForm({ itemId: itemId ?? "", qty: "", reference: "", date: "" });
    setPreselect(itemId ?? "");
    setStockInOpen(true);
  }

  function openUsage(itemId?: string) {
    setUsageForm({ itemId: itemId ?? "", qty: "", reason: "", date: "" });
    setPreselect(itemId ?? "");
    setUsageOpen(true);
  }

  function handleAddItem() {
    if (!addForm.name || !addForm.openingStock) return;
    const qty = Number(addForm.openingStock);
    const newItem: InventoryItem = {
      id: "ITM-" + String(items.length + 1).padStart(3, "0"),
      name: addForm.name,
      category: addForm.category,
      unit: addForm.unit,
      openingStock: qty,
      minimumStock: Number(addForm.minimumStock) || 0,
      currentStock: qty,
    };
    setItems([...items, newItem]);
    setAddForm({ name: "", category: "Raw Material", unit: "kg", openingStock: "", minimumStock: "" });
    setAddItemOpen(false);
    toast.success("Item added", { description: `${newItem.name} · ${qty} ${newItem.unit} opening stock` });
  }

  function handleStockIn() {
    const item = items.find((i) => i.id === stockInForm.itemId);
    if (!item || !stockInForm.qty || Number(stockInForm.qty) <= 0) return;
    const qty = Number(stockInForm.qty);
    const newBalance = item.currentStock + qty;
    const txn: StockTransaction = {
      id: "TXN-" + String(txns.length + 1).padStart(3, "0"),
      itemId: item.id,
      type: "Stock In",
      quantity: qty,
      date: stockInForm.date || new Date().toISOString().slice(0, 10),
      notes: stockInForm.reference || "—",
      balance: newBalance,
    };
    setTxns([...txns, txn]);
    setItems(items.map((i) => i.id === item.id ? { ...i, currentStock: newBalance } : i));
    if (detailItem?.id === item.id) setDetailItem((p) => p ? { ...p, currentStock: newBalance } : p);
    setStockInOpen(false);
    setStockInForm({ itemId: "", qty: "", reference: "", date: "" });
    toast.success("Stock in recorded", { description: `+${qty} ${item.unit} · ${item.name} · Balance: ${newBalance}` });
  }

  function handleUsage() {
    const item = items.find((i) => i.id === usageForm.itemId);
    if (!item || !usageForm.qty || Number(usageForm.qty) <= 0) return;
    const qty = Math.min(Number(usageForm.qty), item.currentStock);
    const newBalance = item.currentStock - qty;
    const txn: StockTransaction = {
      id: "TXN-" + String(txns.length + 1).padStart(3, "0"),
      itemId: item.id,
      type: "Usage",
      quantity: qty,
      date: usageForm.date || new Date().toISOString().slice(0, 10),
      notes: usageForm.reason || "—",
      balance: newBalance,
    };
    setTxns([...txns, txn]);
    setItems(items.map((i) => i.id === item.id ? { ...i, currentStock: newBalance } : i));
    if (detailItem?.id === item.id) setDetailItem((p) => p ? { ...p, currentStock: newBalance } : p);
    setUsageOpen(false);
    setUsageForm({ itemId: "", qty: "", reason: "", date: "" });
    toast.success("Usage recorded", { description: `-${qty} ${item.unit} · ${item.name} · Balance: ${newBalance}` });
  }

  function handleDelete() {
    if (!deleteId) return;
    setItems(items.filter((i) => i.id !== deleteId));
    setTxns(txns.filter((t) => t.itemId !== deleteId));
    setDeleteId(null);
    toast.success("Item deleted");
  }

  const detailTxns = detailItem
    ? txns.filter((t) => t.itemId === detailItem.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <PageShell
      title="Inventory"
      description="Track stock levels, record incoming stock and consumption."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openStockIn()}>
            <ArrowUpCircle className="h-4 w-4 text-success" /> Stock In
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openUsage()}>
            <ArrowDownCircle className="h-4 w-4 text-warning" /> Usage
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddItemOpen(true)}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Items" value={String(totalItems)} icon={<Package className="h-4 w-4" />} />
        <Stat label="Available Stock" value={String(totalAvailable)} />
        <Stat label="Low Stock" value={String(lowStock.length)} tone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
        <Stat label="Out of Stock" value={String(outOfStock.length)} tone="danger" />
      </div>

      {lowStock.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">Reorder needed: </span>
              <span className="text-muted-foreground">{lowStock.map((i) => i.name).join(", ")}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">All Items</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input className="pl-7 h-8 w-36 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-36 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const status = itemStatus(item);
                return (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetailItem(item)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {item.name}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {item.currentStock} <span className="font-normal text-muted-foreground">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {item.minimumStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          status === "In Stock"    ? "bg-success/15 text-success border-transparent" :
                          status === "Low Stock"   ? "border-warning/40 text-warning" :
                          "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-success hover:text-success hover:bg-success/10" onClick={() => openStockIn(item.id)}>
                          <ArrowUpCircle className="h-3.5 w-3.5" /> In
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-warning hover:text-warning hover:bg-warning/10" onClick={() => openUsage(item.id)}>
                          <ArrowDownCircle className="h-3.5 w-3.5" /> Use
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">No items found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Item Detail Dialog ── */}
      <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="w-[98vw] max-w-none sm:max-w-4xl max-h-[90vh] overflow-y-auto !p-5">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> {detailItem.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-1 w-full min-w-0">
                {/* Summary strip */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <div className="flex-1 min-w-0 bg-muted/30 px-3 py-2.5 border-r border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Available</p>
                    <p className={`mt-0.5 text-lg font-bold tabular-nums ${detailItem.currentStock <= detailItem.minimumStock ? "text-warning" : "text-success"}`}>
                      {detailItem.currentStock} <span className="text-sm font-normal">{detailItem.unit}</span>
                    </p>
                  </div>
                  <div className="flex-1 min-w-0 bg-muted/30 px-3 py-2.5 border-r border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Min Stock</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums">{detailItem.minimumStock} <span className="text-sm font-normal">{detailItem.unit}</span></p>
                  </div>
                  <div className="flex-1 min-w-0 bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Category</p>
                    <p className="mt-0.5 text-sm font-semibold">{detailItem.category}</p>
                  </div>
                </div>

                {/* History */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Stock History</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs text-success hover:text-success hover:bg-success/10 border-success/30" onClick={() => { setDetailItem(null); openStockIn(detailItem.id); }}>
                        <ArrowUpCircle className="h-3.5 w-3.5" /> Stock In
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs text-warning hover:text-warning hover:bg-warning/10 border-warning/30" onClick={() => { setDetailItem(null); openUsage(detailItem.id); }}>
                        <ArrowDownCircle className="h-3.5 w-3.5" /> Record Usage
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Quantity</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailTxns.map((t) => (
                          <TableRow key={t.id} title={t.notes !== "—" ? t.notes : undefined}>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{t.date}</TableCell>
                            <TableCell>
                              <div>
                                <Badge
                                  variant="outline"
                                  className={t.type === "Stock In" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}
                                >
                                  {t.type === "Stock In" ? <ArrowUpCircle className="mr-1 h-3 w-3" /> : <ArrowDownCircle className="mr-1 h-3 w-3" />}
                                  {t.type}
                                </Badge>
                                {t.notes !== "—" && <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[140px] truncate">{t.notes}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold whitespace-nowrap">
                              <span className={t.type === "Stock In" ? "text-success" : "text-warning"}>
                                {t.type === "Stock In" ? "+" : "−"}{t.quantity} {detailItem.unit}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground whitespace-nowrap">{t.balance}</TableCell>
                          </TableRow>
                        ))}
                        {detailTxns.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailItem(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Item Dialog ── */}
      <Dialog open={addItemOpen} onOpenChange={(o) => !o && setAddItemOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Item Name</Label>
              <Input placeholder="e.g. Turmeric Powder" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={addForm.unit} onValueChange={(v) => setAddForm({ ...addForm, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Opening Stock</Label>
                <Input type="number" placeholder="0" value={addForm.openingStock} onChange={(e) => setAddForm({ ...addForm, openingStock: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum Stock</Label>
                <Input type="number" placeholder="0" value={addForm.minimumStock} onChange={(e) => setAddForm({ ...addForm, minimumStock: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!addForm.name || !addForm.openingStock}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock In Dialog ── */}
      <Dialog open={stockInOpen} onOpenChange={(o) => !o && setStockInOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-success" /> Stock In
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">Use this whenever new stock is received.</p>
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Select value={stockInForm.itemId} onValueChange={(v) => setStockInForm({ ...stockInForm, itemId: v })}>
                <SelectTrigger><SelectValue placeholder="Select item…" /></SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} <span className="text-muted-foreground ml-1">({i.currentStock} {i.unit})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" placeholder="e.g. 100" value={stockInForm.qty} onChange={(e) => setStockInForm({ ...stockInForm, qty: e.target.value })} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={stockInForm.date} onChange={(e) => setStockInForm({ ...stockInForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. Supplier invoice, PO-1234" value={stockInForm.reference} onChange={(e) => setStockInForm({ ...stockInForm, reference: e.target.value })} />
            </div>
            {stockInForm.itemId && stockInForm.qty && Number(stockInForm.qty) > 0 && (() => {
              const item = items.find((i) => i.id === stockInForm.itemId);
              if (!item) return null;
              return (
                <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-sm flex justify-between">
                  <span className="text-muted-foreground">New balance</span>
                  <span className="font-semibold text-success">{item.currentStock + Number(stockInForm.qty)} {item.unit}</span>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockInOpen(false)}>Cancel</Button>
            <Button onClick={handleStockIn} disabled={!stockInForm.itemId || !stockInForm.qty || Number(stockInForm.qty) <= 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Usage Dialog ── */}
      <Dialog open={usageOpen} onOpenChange={(o) => !o && setUsageOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-warning" /> Record Usage
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">Record stock consumed or dispatched.</p>
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Select value={usageForm.itemId} onValueChange={(v) => setUsageForm({ ...usageForm, itemId: v })}>
                <SelectTrigger><SelectValue placeholder="Select item…" /></SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} <span className="text-muted-foreground ml-1">({i.currentStock} {i.unit})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity Used</Label>
                <Input type="number" placeholder="e.g. 20" value={usageForm.qty} onChange={(e) => setUsageForm({ ...usageForm, qty: e.target.value })} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={usageForm.date} onChange={(e) => setUsageForm({ ...usageForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. Production batch, Sales dispatch" value={usageForm.reason} onChange={(e) => setUsageForm({ ...usageForm, reason: e.target.value })} />
            </div>
            {usageForm.itemId && usageForm.qty && Number(usageForm.qty) > 0 && (() => {
              const item = items.find((i) => i.id === usageForm.itemId);
              if (!item) return null;
              const remaining = item.currentStock - Number(usageForm.qty);
              return (
                <div className={`rounded-lg border px-3 py-2 text-sm flex justify-between ${remaining < item.minimumStock ? "bg-warning/10 border-warning/20" : "bg-muted/40 border-border"}`}>
                  <span className="text-muted-foreground">Remaining after</span>
                  <span className={`font-semibold ${remaining < item.minimumStock ? "text-warning" : ""}`}>
                    {Math.max(0, remaining)} {item.unit}
                    {remaining < item.minimumStock && " · Low stock"}
                  </span>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageOpen(false)}>Cancel</Button>
            <Button onClick={handleUsage} disabled={!usageForm.itemId || !usageForm.qty || Number(usageForm.qty) <= 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>This will also remove all stock history for this item. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "warning" | "danger"; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon && <span className={tone === "warning" ? "text-warning" : tone === "danger" ? "text-destructive" : "text-muted-foreground"}>{icon}</span>}
        </div>
        <p className={`mt-2 font-display text-2xl font-semibold ${tone === "warning" ? "text-warning" : tone === "danger" ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
