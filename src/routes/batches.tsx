import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { batches as initialBatches, productCatalog } from "@/lib/mock-data";

export const Route = createFileRoute("/batches")({
  head: () => ({
    meta: [
      { title: "Batches · ShopOS" },
      { name: "description", content: "Manufacturing batches with expiry tracking." },
    ],
  }),
  component: BatchesPage,
});

type Batch = { batch: string; product: string; mfg: string; expiry: string; qty: number };

function daysTo(date: string) {
  return Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const PRODUCTS = productCatalog;

function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [search, setSearch] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Batch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ product: "", mfg: "", expiry: "", qty: "" });
  const [form, setForm] = useState({ batch: "", product: "", mfg: "", expiry: "", qty: "" });

  const filteredBatches = batches.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.batch.toLowerCase().includes(q) || b.product.toLowerCase().includes(q);
    const d = daysTo(b.expiry);
    const matchExpiry =
      expiryFilter === "all" ||
      (expiryFilter === "expiring" && d >= 0 && d < 180) ||
      (expiryFilter === "expired" && d < 0) ||
      (expiryFilter === "fresh" && d >= 180);
    return matchSearch && matchExpiry;
  });

  const expiringSoon = batches.filter((b) => daysTo(b.expiry) < 180).length;
  const fresh = batches.length - expiringSoon;

  function openEdit(b: Batch) {
    setEditItem(b);
    setEditForm({ product: b.product, mfg: b.mfg, expiry: b.expiry, qty: String(b.qty) });
  }
  function handleSaveEdit() {
    if (!editItem || !editForm.product || !editForm.qty) return;
    setBatches(batches.map((b) => b.batch === editItem.batch ? { ...b, product: editForm.product, mfg: editForm.mfg, expiry: editForm.expiry, qty: Number(editForm.qty) } : b));
    setEditItem(null);
    toast.success("Batch updated");
  }
  function handleDelete() {
    if (!deleteId) return;
    setBatches(batches.filter((b) => b.batch !== deleteId));
    setDeleteId(null);
    toast.success("Batch deleted");
  }

  function handleSubmit() {
    if (!form.batch || !form.product || !form.mfg || !form.expiry || !form.qty) return;
    const next: Batch = {
      batch: form.batch,
      product: form.product,
      mfg: form.mfg,
      expiry: form.expiry,
      qty: Number(form.qty),
    };
    setBatches([...batches, next]);
    setForm({ batch: "", product: "", mfg: "", expiry: "", qty: "" });
    setOpen(false);
    toast.success("Batch recorded", { description: `${next.batch} · ${next.product}` });
  }

  return (
    <PageShell
      title="Batches"
      description="Manufacturing batches with manufacture and expiry tracking."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New batch
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total batches" value={String(batches.length)} icon={<FlaskConical className="h-4 w-4" />} />
        <Stat label="Fresh" value={String(fresh)} tone="success" />
        <Stat label="Expiring soon" value={String(expiringSoon)} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">All batches</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input className="pl-7 h-8 w-40 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="h-8 w-32 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="expiring">Expiring soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Mfg date</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((b) => {
                const d = daysTo(b.expiry);
                const soon = d < 180;
                return (
                  <TableRow key={b.batch}>
                    <TableCell>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {b.batch}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{b.product}</TableCell>
                    <TableCell className="text-muted-foreground">{b.mfg}</TableCell>
                    <TableCell className="text-muted-foreground">{b.expiry}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.qty}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          soon
                            ? "border-warning/40 text-warning"
                            : "bg-success/15 text-success border-transparent"
                        }
                      >
                        {soon ? `Expires in ${d}d` : "Fresh"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(b.batch)}>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Batch</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={editForm.product} onValueChange={(v) => setEditForm({ ...editForm, product: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" value={editForm.qty} onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Manufacture date</Label>
                <Input type="date" value={editForm.mfg} onChange={(e) => setEditForm({ ...editForm, mfg: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry date</Label>
                <Input type="date" value={editForm.expiry} onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.product || !editForm.qty}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete batch?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Batch ID</Label>
                <Input
                  placeholder="e.g. TRI-25-10-A"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
                <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Manufacture date</Label>
                <Input
                  type="date"
                  value={form.mfg}
                  onChange={(e) => setForm({ ...form, mfg: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.batch || !form.product || !form.mfg || !form.expiry || !form.qty}
            >
              Record batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
  icon?: React.ReactNode;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={`mt-2 font-display text-2xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
