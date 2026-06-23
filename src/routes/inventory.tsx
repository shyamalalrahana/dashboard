import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Plus } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
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
import { inventory as initialInventory } from "@/lib/mock-data";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory · Vaidya Ayur ERP" },
      { name: "description", content: "Raw materials, finished goods and stock alerts." },
    ],
  }),
  component: InventoryPage,
});

type Item = typeof initialInventory[number];

function InventoryPage() {
  const [inventory, setInventory] = useState<Item[]>(initialInventory);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", type: "Finished", qty: "", unit: "pkt", reorder: "" });

  const raw = inventory.filter((i) => i.type === "Raw Material");
  const fg = inventory.filter((i) => i.type === "Finished");
  const lowStock = inventory.filter((i) => i.qty < i.reorder);

  function handleSubmit() {
    if (!form.sku || !form.name || !form.qty) return;
    const next: Item = {
      sku: form.sku,
      name: form.name,
      type: form.type,
      qty: Number(form.qty),
      unit: form.unit,
      reorder: Number(form.reorder) || 50,
    };
    setInventory([...inventory, next]);
    setForm({ sku: "", name: "", type: "Finished", qty: "", unit: "pkt", reorder: "" });
    setOpen(false);
    toast.success("Stock added", { description: `${next.name} · ${next.qty} ${next.unit}` });
  }

  return (
    <PageShell
      title="Inventory"
      description="Raw material and finished goods stock — with low-stock alerts."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add stock
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Raw materials" value={raw.length + " SKUs"} />
        <Stat label="Finished goods" value={fg.length + " SKUs"} />
        <Stat label="Low stock" value={lowStock.length + " alerts"} tone="warning" />
      </div>

      {lowStock.length > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div className="text-sm">
              <p className="font-semibold">Reorder needed for {lowStock.length} items</p>
              <p className="text-muted-foreground">{lowStock.map((i) => i.name).join(", ")}.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All stock</h2>
            <span className="text-sm text-muted-foreground">{inventory.length} items</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Reorder at</TableHead>
                <TableHead className="w-48">Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const pct = Math.min(100, (item.qty / (item.reorder * 2)) * 100);
                const low = item.qty < item.reorder;
                return (
                  <TableRow key={item.sku}>
                    <TableCell>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {item.sku}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.qty} <span className="text-muted-foreground">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {item.reorder} {item.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          className={low ? "[&>div]:bg-warning" : "[&>div]:bg-success"}
                        />
                        {low && (
                          <Badge variant="outline" className="border-warning/40 text-warning text-xs">Low</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input placeholder="e.g. FG-105" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raw Material">Raw Material</SelectItem>
                    <SelectItem value="Finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Item name</Label>
              <Input placeholder="e.g. Brahmi Churna 100g" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" placeholder="200" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input placeholder="pkt" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Reorder at</Label>
                <Input type="number" placeholder="50" value={form.reorder} onChange={(e) => setForm({ ...form, reorder: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.sku || !form.name || !form.qty}>
              Add stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 font-display text-2xl font-semibold ${tone === "warning" ? "text-warning" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
