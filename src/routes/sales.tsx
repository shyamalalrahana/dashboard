import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
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
import { customers, fmtINR, recentSales as initialSales, salesOverview, topProducts } from "@/lib/mock-data";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales · ShopOS" },
      { name: "description", content: "Manage sales entries, invoices and customers." },
    ],
  }),
  component: SalesPage,
});

type Sale = {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending";
};

function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    amount: "",
    status: "Paid" as "Paid" | "Pending",
  });

  function handleSubmit() {
    if (!form.customer || !form.amount) return;
    const newSale: Sale = {
      id: "INV-" + (2042 + sales.length - initialSales.length),
      customer: form.customer,
      date: new Date().toISOString().slice(0, 10),
      amount: Number(form.amount),
      status: form.status,
    };
    setSales([newSale, ...sales]);
    setForm({ customer: "", amount: "", status: "Paid" });
    setOpen(false);
    toast.success("Invoice created", { description: `${newSale.id} added for ${newSale.customer}` });
  }

  function handleExport() {
    const csv = [
      ["Invoice", "Customer", "Date", "Amount", "Status"].join(","),
      ...sales.map((s) => [s.id, s.customer, s.date, s.amount, s.status].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported sales as CSV");
  }

  return (
    <PageShell
      title="Sales"
      description="Invoices, today's intake and top performing SKUs."
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New invoice
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Today" value={fmtINR(salesOverview.today)} />
        <Stat label="This week" value={fmtINR(salesOverview.week)} />
        <Stat label="This month" value={fmtINR(salesOverview.month)} accent />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-semibold">Recent invoices</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {s.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{s.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{s.date}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmtINR(s.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.status === "Paid"
                          ? "bg-success/15 text-success border-transparent"
                          : "border-warning/40 text-warning"
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-semibold">Top selling products</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units sold</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p) => {
                const margin = ((p.profit / p.sales) * 100).toFixed(0);
                return (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.sold}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtINR(p.sales)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtINR(p.cost)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-success">
                      {fmtINR(p.profit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{margin}%</TableCell>
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
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={form.customer} onValueChange={(v) => setForm({ ...form, customer: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="e.g. 25000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "Paid" | "Pending" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.customer || !form.amount}>
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-2 font-display text-3xl font-semibold tabular-nums ${
            accent ? "text-primary" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
