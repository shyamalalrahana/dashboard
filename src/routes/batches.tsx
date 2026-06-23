import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Plus } from "lucide-react";
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
import { batches as initialBatches, topProducts } from "@/lib/mock-data";

export const Route = createFileRoute("/batches")({
  head: () => ({
    meta: [
      { title: "Batches · Vaidya Ayur ERP" },
      { name: "description", content: "Manufacturing batches with expiry tracking." },
    ],
  }),
  component: BatchesPage,
});

type Batch = { batch: string; product: string; mfg: string; expiry: string; qty: number };

function daysTo(date: string) {
  return Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const PRODUCTS = topProducts.map((p) => p.name);

function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batch: "", product: "", mfg: "", expiry: "", qty: "" });

  const expiringSoon = batches.filter((b) => daysTo(b.expiry) < 180).length;
  const fresh = batches.length - expiringSoon;

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
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All batches</h2>
            <span className="text-sm text-muted-foreground">{batches.length} records</span>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => {
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
