import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Download, FileText, X } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customers,
  expenseBreakdown,
  financials,
  fmtINR,
  inventory,
  monthlyTrend,
  recentExpenses,
  recentSales,
  topProducts,
} from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · ShopOS" },
      { name: "description", content: "P&L, expense, sales and GST reports." },
    ],
  }),
  component: ReportsPage,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

type ReportKey = "pl" | "expense" | "sales" | "gst" | "inventory" | "batch";

const REPORTS: { key: ReportKey; name: string; desc: string }[] = [
  { key: "pl", name: "Profit & Loss", desc: "Revenue, COGS and operating profit." },
  { key: "expense", name: "Expense Report", desc: "Category-wise expense breakdown." },
  { key: "sales", name: "Sales Report", desc: "Invoice-level sales with customer split." },
  { key: "gst", name: "GST / Tax Report", desc: "GSTR-1 / GSTR-3B summary." },
  { key: "inventory", name: "Inventory Valuation", desc: "Stock on hand at current cost." },
  { key: "batch", name: "Batch Movement", desc: "Manufactured, sold and remaining by batch." },
];

function PLReport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Revenue", value: financials.revenue, color: "text-success" },
          { label: "Expenses", value: financials.expenses, color: "text-destructive" },
          { label: "Net Profit", value: financials.profit, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{fmtINR(s.value)}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Monthly trend</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => "₹" + v / 1000 + "k"} />
              <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border p-4 text-sm space-y-2">
        <Row label="Gross margin" value={financials.margin.toFixed(1) + "%"} />
        <Row label="Operating profit" value={fmtINR(financials.profit)} />
        <Row label="Cost ratio" value={((financials.expenses / financials.revenue) * 100).toFixed(1) + "%"} />
      </div>
    </div>
  );
}

function ExpenseReport() {
  return (
    <div className="space-y-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenseBreakdown.map((e, i) => {
            const total = expenseBreakdown.reduce((a, b) => a + b.value, 0);
            return (
              <TableRow key={e.name}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    {e.name}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fmtINR(e.value)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {((e.value / total) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="text-sm text-muted-foreground pt-2 border-t">
        <p className="font-medium text-foreground">Recent entries</p>
        {recentExpenses.slice(0, 3).map((e) => (
          <div key={e.id} className="flex justify-between py-1">
            <span>{e.note}</span>
            <span className="font-medium">{fmtINR(e.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total invoices", value: String(recentSales.length) },
          { label: "Paid", value: String(recentSales.filter((s) => s.status === "Paid").length) },
          { label: "Pending", value: String(recentSales.filter((s) => s.status === "Pending").length) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
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
          {recentSales.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{s.id}</span>
              </TableCell>
              <TableCell>{s.customer}</TableCell>
              <TableCell className="text-muted-foreground">{s.date}</TableCell>
              <TableCell className="text-right tabular-nums">{fmtINR(s.amount)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={s.status === "Paid" ? "bg-success/15 text-success border-transparent" : "border-warning/40 text-warning"}>
                  {s.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GSTReport() {
  const taxableRevenue = financials.revenue * 0.85;
  const gstCollected = taxableRevenue * 0.12;
  const inputCredit = financials.expenses * 0.18 * 0.6;
  const netPayable = gstCollected - inputCredit;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3 text-sm">
        <p className="font-medium text-base">GSTR-3B Summary — September 2025</p>
        <Row label="Taxable turnover" value={fmtINR(taxableRevenue)} />
        <Row label="GST collected (12%)" value={fmtINR(gstCollected)} />
        <Row label="Input tax credit" value={fmtINR(inputCredit)} />
        <div className="border-t pt-3">
          <Row label="Net GST payable" value={fmtINR(netPayable)} highlight />
        </div>
      </div>
      <div className="rounded-lg bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Filing status</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success" />
          GSTR-1 filed · Due date: 11 Oct 2025
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="h-2 w-2 rounded-full bg-warning" />
          GSTR-3B pending · Due date: 20 Oct 2025
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-muted-foreground">{c.city}</TableCell>
              <TableCell className="text-right tabular-nums">
                {c.outstanding > 0 ? <span className="text-warning font-medium">{fmtINR(c.outstanding)}</span> : <Badge variant="outline" className="bg-success/15 text-success border-transparent">Settled</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InventoryReport() {
  const unitCost: Record<string, number> = { "kg": 320, "L": 180, "jar": 120, "btl": 85, "pkt": 65, "box": 110 };
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit cost</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const cost = unitCost[item.unit] ?? 100;
            const value = item.qty * cost;
            return (
              <TableRow key={item.sku}>
                <TableCell>
                  <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{item.sku}</span>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right tabular-nums">{item.qty} {item.unit}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{fmtINR(cost)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fmtINR(value)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="rounded-lg border p-4 text-sm flex justify-between font-semibold">
        <span>Total inventory value</span>
        <span className="text-primary">
          {fmtINR(inventory.reduce((a, item) => a + item.qty * (unitCost[item.unit] ?? 100), 0))}
        </span>
      </div>
    </div>
  );
}

function BatchReport() {
  const batchData = [
    { batch: "OIL-25-09-A", product: "Sunflower Oil 1L", mfg: "2025-09-05", expiry: "2027-09-04", manufactured: 220, sold: 180, remaining: 40 },
    { batch: "RIC-25-09-B", product: "Basmati Rice 5kg", mfg: "2025-09-12", expiry: "2027-03-11", manufactured: 180, sold: 162, remaining: 18 },
    { batch: "FLR-25-08-C", product: "Wheat Flour 10kg", mfg: "2025-08-22", expiry: "2026-08-21", manufactured: 340, sold: 280, remaining: 60 },
  ];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Batch</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Manufactured</TableHead>
          <TableHead className="text-right">Sold</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead>Expiry</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batchData.map((b) => (
          <TableRow key={b.batch}>
            <TableCell>
              <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{b.batch}</span>
            </TableCell>
            <TableCell className="font-medium">{b.product}</TableCell>
            <TableCell className="text-right tabular-nums">{b.manufactured}</TableCell>
            <TableCell className="text-right tabular-nums text-success font-medium">{b.sold}</TableCell>
            <TableCell className="text-right tabular-nums">{b.remaining}</TableCell>
            <TableCell className="text-muted-foreground">{b.expiry}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${highlight ? "font-semibold text-foreground" : ""}`}>
      <span className={highlight ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const REPORT_CONTENT: Record<ReportKey, React.FC> = {
  pl: PLReport,
  expense: ExpenseReport,
  sales: SalesReport,
  gst: GSTReport,
  inventory: InventoryReport,
  batch: BatchReport,
};

function ReportsPage() {
  const [active, setActive] = useState<ReportKey | null>(null);
  const activeReport = REPORTS.find((r) => r.key === active);
  const ReportComponent = active ? REPORT_CONTENT[active] : null;

  function handleDownload() {
    toast.success("Report downloaded", { description: `${activeReport?.name} · September 2025.pdf` });
  }

  return (
    <PageShell
      title="Reports"
      description="Generate financial and operational reports for the current period."
    >
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Snap label="Revenue" value={fmtINR(financials.revenue)} />
          <Snap label="Expenses" value={fmtINR(financials.expenses)} />
          <Snap label="Net profit" value={fmtINR(financials.profit)} accent />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{r.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View report <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{activeReport?.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setActive(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{activeReport?.desc} · September 2025</p>
          </DialogHeader>
          {ReportComponent && <ReportComponent />}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Snap({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
