import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Calendar, Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";
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

function PLReport({ scale }: ReportProps) {
  const rev = Math.round(financials.revenue * scale);
  const exp = Math.round(financials.expenses * scale);
  const profit = rev - exp;
  const trendData = monthlyTrend.map((m) => ({
    ...m,
    revenue: Math.round(m.revenue * scale),
    expenses: Math.round(m.expenses * scale),
  }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Revenue", value: rev, color: "text-success" },
          { label: "Expenses", value: exp, color: "text-destructive" },
          { label: "Net Profit", value: profit, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{fmtINR(s.value)}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Trend</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
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
        <Row label="Operating profit" value={fmtINR(profit)} />
        <Row label="Cost ratio" value={rev > 0 ? ((exp / rev) * 100).toFixed(1) + "%" : "—"} />
      </div>
    </div>
  );
}

function ExpenseReport({ scale }: ReportProps) {
  const scaled = expenseBreakdown.map((e) => ({ ...e, value: Math.round(e.value * scale) }));
  const total = scaled.reduce((a, b) => a + b.value, 0);
  return (
    <div className="space-y-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={scaled} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {scaled.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          {scaled.map((e, i) => (
            <TableRow key={e.name}>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  {e.name}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">{fmtINR(e.value)}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {total > 0 ? ((e.value / total) * 100).toFixed(1) : "0.0"}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SalesReport({ scale }: ReportProps) {
  const scaledSales = recentSales.map((s) => ({ ...s, amount: Math.round(s.amount * scale) }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total invoices", value: String(scaledSales.length) },
          { label: "Paid", value: String(scaledSales.filter((s) => s.status === "Paid").length) },
          { label: "Pending", value: String(scaledSales.filter((s) => s.status === "Pending").length) },
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
          {scaledSales.map((s) => (
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

function GSTReport({ scale, period }: ReportProps) {
  const taxableRevenue = financials.revenue * scale * 0.85;
  const gstCollected = taxableRevenue * 0.12;
  const inputCredit = financials.expenses * scale * 0.18 * 0.6;
  const netPayable = gstCollected - inputCredit;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3 text-sm">
        <p className="font-medium text-base">GSTR-3B Summary — {period}</p>
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

function InventoryReport(_props: ReportProps) {
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

function BatchReport({ scale }: ReportProps) {
  const batchData = [
    { batch: "OIL-25-09-A", product: "Sunflower Oil 1L", mfg: "2025-09-05", expiry: "2027-09-04", manufactured: 220, sold: 180, remaining: 40 },
    { batch: "RIC-25-09-B", product: "Basmati Rice 5kg", mfg: "2025-09-12", expiry: "2027-03-11", manufactured: 180, sold: 162, remaining: 18 },
    { batch: "FLR-25-08-C", product: "Wheat Flour 10kg", mfg: "2025-08-22", expiry: "2026-08-21", manufactured: 340, sold: 280, remaining: 60 },
  ].map((b) => ({
    ...b,
    manufactured: Math.round(b.manufactured * scale),
    sold: Math.round(b.sold * scale),
    remaining: Math.round(b.remaining * scale),
  }));
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

type Period = "week" | "month" | "last_month" | "quarter" | "year" | "custom";

const PERIODS: { key: Period; label: string; short: string; scale: number }[] = [
  { key: "week",       label: "This Week",    short: "Wk 39, Sep 2025", scale: 0.23 },
  { key: "month",      label: "This Month",   short: "September 2025",  scale: 1    },
  { key: "last_month", label: "Last Month",   short: "August 2025",     scale: 0.91 },
  { key: "quarter",    label: "This Quarter", short: "Q2 FY 2025–26",   scale: 2.85 },
  { key: "year",       label: "This Year",    short: "FY 2025–26",      scale: 11.4 },
  { key: "custom",     label: "Custom Range", short: "Custom",          scale: 1    },
];

type ReportProps = { scale: number; period: string };

const REPORT_CONTENT: Record<ReportKey, React.FC<ReportProps>> = {
  pl: PLReport,
  expense: ExpenseReport,
  sales: SalesReport,
  gst: GSTReport,
  inventory: InventoryReport,
  batch: BatchReport,
};

// baseline = 30 days (one month), all preset scales are relative to this
const BASELINE_DAYS = 30;

function formatDateShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ReportsPage() {
  const [active, setActive] = useState<ReportKey | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { scale, periodShort } = useMemo(() => {
    if (period === "custom") {
      if (customFrom && customTo && customTo >= customFrom) {
        const days = Math.max(1, Math.round(
          (new Date(customTo).getTime() - new Date(customFrom).getTime()) / (1000 * 60 * 60 * 24) + 1
        ));
        const s = days / BASELINE_DAYS;
        const label = days === 1
          ? formatDateShort(customFrom)
          : `${formatDateShort(customFrom)} – ${formatDateShort(customTo)}`;
        return { scale: s, periodShort: label };
      }
      return { scale: 1, periodShort: "Custom" };
    }
    const p = PERIODS.find((p) => p.key === period)!;
    return { scale: p.scale, periodShort: p.short };
  }, [period, customFrom, customTo]);

  const activeReport = REPORTS.find((r) => r.key === active);
  const ReportComponent = active ? REPORT_CONTENT[active] : null;

  const scaledRev = Math.round(financials.revenue * scale);
  const scaledExp = Math.round(financials.expenses * scale);
  const scaledProfit = scaledRev - scaledExp;

  function handleDownload() {
    if (!active || !activeReport) return;
    const csvRows: string[][] = [];
    const p = periodShort;

    if (active === "pl") {
      csvRows.push(["Metric", "Value"]);
      csvRows.push(["Period", p]);
      csvRows.push(["Revenue", String(scaledRev)]);
      csvRows.push(["Expenses", String(scaledExp)]);
      csvRows.push(["Net Profit", String(scaledProfit)]);
      csvRows.push(["Gross Margin %", financials.margin.toFixed(1)]);
      csvRows.push([]);
      csvRows.push(["Month", "Revenue", "Expenses"]);
      monthlyTrend.forEach((m) => csvRows.push([m.month, String(Math.round(m.revenue * scale)), String(Math.round(m.expenses * scale))]));
    } else if (active === "expense") {
      const scaled = expenseBreakdown.map((e) => ({ ...e, value: Math.round(e.value * scale) }));
      const total = scaled.reduce((a, b) => a + b.value, 0);
      csvRows.push(["Period", p]);
      csvRows.push(["Category", "Amount", "Share %"]);
      scaled.forEach((e) => csvRows.push([e.name, String(e.value), ((e.value / total) * 100).toFixed(1)]));
    } else if (active === "sales") {
      csvRows.push(["Period", p]);
      csvRows.push(["Invoice", "Customer", "Date", "Amount", "Status"]);
      recentSales.forEach((s) => csvRows.push([s.id, s.customer, s.date, String(Math.round(s.amount * scale)), s.status]));
    } else if (active === "gst") {
      const taxable = scaledRev * 0.85;
      const gstCol = taxable * 0.12;
      const itc = scaledExp * 0.18 * 0.6;
      csvRows.push(["GSTR-3B Summary", p]);
      csvRows.push(["Taxable Turnover", taxable.toFixed(0)]);
      csvRows.push(["GST Collected (12%)", gstCol.toFixed(0)]);
      csvRows.push(["Input Tax Credit", itc.toFixed(0)]);
      csvRows.push(["Net GST Payable", (gstCol - itc).toFixed(0)]);
      csvRows.push([]);
      csvRows.push(["Customer", "City", "Outstanding"]);
      customers.forEach((c) => csvRows.push([c.name, c.city, String(c.outstanding)]));
    } else if (active === "inventory") {
      const unitCost: Record<string, number> = { kg: 320, L: 180, jar: 120, btl: 85, pkt: 65, box: 110 };
      csvRows.push(["SKU", "Name", "Qty", "Unit", "Unit Cost", "Total Value"]);
      inventory.forEach((item) => {
        const cost = unitCost[item.unit] ?? 100;
        csvRows.push([item.sku, item.name, String(item.qty), item.unit, String(cost), String(item.qty * cost)]);
      });
    } else if (active === "batch") {
      csvRows.push(["Batch", "Product", "Mfg Date", "Expiry", "Manufactured", "Sold", "Remaining"]);
      [
        { batch: "OIL-25-09-A", product: "Sunflower Oil 1L", mfg: "2025-09-05", expiry: "2027-09-04", manufactured: 220, sold: 180, remaining: 40 },
        { batch: "RIC-25-09-B", product: "Basmati Rice 5kg", mfg: "2025-09-12", expiry: "2027-03-11", manufactured: 180, sold: 162, remaining: 18 },
        { batch: "FLR-25-08-C", product: "Wheat Flour 10kg", mfg: "2025-08-22", expiry: "2026-08-21", manufactured: 340, sold: 280, remaining: 60 },
      ].forEach((b) => csvRows.push([b.batch, b.product, b.mfg, b.expiry, String(Math.round(b.manufactured * scale)), String(Math.round(b.sold * scale)), String(Math.round(b.remaining * scale))]));
    }

    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport.name.replace(/\s+/g, "_")}_${periodShort.replace(/[\s\/–,]/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded", { description: `${activeReport.name} · ${periodShort}` });
  }

  return (
    <PageShell
      title="Reports"
      description="Generate financial and operational reports for the current period."
    >
      {/* Period filter chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground shrink-0">Period:</span>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-medium transition-colors border ${
                period === p.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {p.key === "custom" && <Calendar className="h-3.5 w-3.5" />}
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range picker */}
        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {customFrom && customTo && customTo >= customFrom && (
              <p className="text-sm text-muted-foreground pb-0.5">
                {Math.round((new Date(customTo).getTime() - new Date(customFrom).getTime()) / (1000 * 60 * 60 * 24) + 1)} days selected
              </p>
            )}
            {customFrom && customTo && customTo < customFrom && (
              <p className="text-sm text-destructive pb-0.5">End date must be after start date</p>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Snap label="Revenue" value={fmtINR(scaledRev)} sub={periodShort} />
          <Snap label="Expenses" value={fmtINR(scaledExp)} />
          <Snap label="Net profit" value={fmtINR(scaledProfit)} accent />
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
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>{activeReport?.name}</DialogTitle>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{activeReport?.desc} · {periodShort}</p>
          </DialogHeader>
          {ReportComponent && <ReportComponent scale={scale} period={periodShort} />}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Snap({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {sub && <span className="text-xs text-muted-foreground/60">{sub}</span>}
      </div>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
