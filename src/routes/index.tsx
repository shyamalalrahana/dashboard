import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Package,
  PackagePlus,
  Plus,
  Receipt,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  cashFlow,
  financials,
  fmtINR,
  inventoryItems,
  recentActivity,
  recentSales,
  salesOverview,
  salesTrend,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · ShopOS" },
      { name: "description", content: "Daily business overview for your shop." },
    ],
  }),
  component: Dashboard,
});

const TREND_RANGES = ["7 Days", "Month", "Year"] as const;
type TrendRange = typeof TREND_RANGES[number];

function fmtCompact(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

const ALERTS = [
  { icon: Package,       label: "2 products below minimum stock",    tone: "warning", link: "/inventory" },
  { icon: FileText,      label: "3 invoices overdue",                 tone: "error",   link: "/sales" },
  { icon: Wallet,        label: "Supplier payment due tomorrow",      tone: "warning", link: "/expenses" },
  { icon: AlertTriangle, label: "4 pending bills awaiting approval",  tone: "warning", link: "/expenses" },
];

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  payment:  CheckCircle2,
  stock:    Package,
  expense:  Receipt,
  invoice:  FileText,
  customer: UserPlus,
};

function Dashboard() {
  const [trendRange, setTrendRange] = useState<TrendRange>("Month");

  const lowStock  = inventoryItems.filter((i) => i.currentStock <= i.minimumStock).length;
  const stockValue = inventoryItems.reduce((a, i) => a + i.currentStock * 950, 0); // ~₹950 avg unit value
  const outOfStock = inventoryItems.filter((i) => i.currentStock === 0).length;
  const netCash   = cashFlow.received - cashFlow.supplierDue;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 max-w-screen-xl mx-auto">

      {/* ── Greeting ───────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Good morning, Shyam</h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span><span className="font-semibold text-foreground">{fmtINR(salesOverview.today)}</span> sales today</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><span className="font-semibold text-foreground">6</span> orders</span>
          <span className="hidden sm:inline text-border">·</span>
          <span className={lowStock > 0 ? "text-warning font-medium" : ""}><span className="font-semibold">{lowStock}</span> low stock</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><span className="font-semibold text-foreground">{fmtINR(cashFlow.customerDue)}</span> receivable</span>
        </div>
      </div>

      {/* ── Section 1: Business Health ─────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HealthCard label="Revenue"        value={fmtINR(financials.revenue)}  delta="+8%"  up   icon={IndianRupee} />
        <HealthCard label="Profit"         value={fmtINR(financials.profit)}   delta="+12%" up   icon={TrendingUp} />
        <HealthCard label="Expenses"       value={fmtINR(financials.expenses)} delta="−5%"  up={false} icon={Receipt} />
        <HealthCard label="Cash Available" value={fmtINR(netCash)}                          icon={BadgeIndianRupee} />
      </div>

      {/* ── Section 2: Attention Center ────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
          </div>
          <ul className="divide-y divide-border/60">
            {ALERTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <li key={i}>
                  <Link to={a.link as any} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${a.tone === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-foreground flex-1">{a.label}</span>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* ── Section 3: Sales Trend ─────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Sales Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue vs Profit · Jan–Jun 2026</p>
            </div>
            <div className="flex items-center rounded-full border border-border bg-muted/20 p-1 gap-0.5">
              {TREND_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${trendRange === r ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-5 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ background: "#7c3aed" }} />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ background: "#16a34a" }} />Profit</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={salesTrend} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashProfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#16a34a" stopOpacity={0.20} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={6} />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<TrendTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#dashRevGrad)" dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="profit"  stroke="#16a34a" strokeWidth={2.5} fill="url(#dashProfGrad)" dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Inventory Health + Cash Flow ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Inventory Health */}
        <Card>
          <CardContent className="p-0">
            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">Inventory Health</h2>
              <Link to="/inventory" className="text-xs text-primary hover:underline">Manage →</Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              <InvStat label="Total Items"  value={String(inventoryItems.length)} />
              <InvStat label="Stock Value"  value={fmtCompact(stockValue)} />
              <InvStat label="Low Stock"    value={String(lowStock)}   warn={lowStock > 0} />
              <InvStat label="Out of Stock" value={String(outOfStock)} warn={outOfStock > 0} />
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardContent className="p-0">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold">Cash Flow</h2>
            </div>
            <div className="p-5 space-y-3">
              <CashRow label="Money Received"  value={fmtINR(cashFlow.received)}    tone="success" />
              <CashRow label="Money Pending"   value={fmtINR(cashFlow.pending)}     tone="warning" />
              <CashRow label="Supplier Due"    value={fmtINR(cashFlow.supplierDue)} tone="muted" />
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Cash</span>
                <span className="text-sm font-bold tabular-nums text-primary">{fmtINR(netCash)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 5: Recent Activity + Recent Orders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activity Timeline */}
        <Card>
          <CardContent className="p-0">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold">Recent Activity</h2>
            </div>
            <ul className="p-5 space-y-0">
              {recentActivity.map((a, i) => {
                const Icon = ACTIVITY_ICONS[a.type] ?? Clock;
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {i < recentActivity.length - 1 && <span className="w-px flex-1 bg-border/60 my-1" />}
                    </div>
                    <div className="pb-4 pt-0.5 min-w-0">
                      <p className="text-sm font-medium leading-tight">{a.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.time}{a.sub ? ` · ${a.sub}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardContent className="p-0">
            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Orders</h2>
              <Link to="/sales" className="text-xs text-primary hover:underline">View all →</Link>
            </div>
            <ul className="divide-y divide-border/60">
              {recentSales.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.customer}</p>
                    <p className="text-xs text-muted-foreground">{s.id} · {s.date}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold tabular-nums">{fmtINR(s.amount)}</p>
                    <span className={`text-xs font-medium ${s.status === "Paid" ? "text-success" : "text-warning"}`}>
                      {s.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 6: Quick Actions ────────────────── */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/sales">
            <Button variant="outline" className="gap-2 h-9 text-sm">
              <Plus className="h-3.5 w-3.5" /> New Invoice
            </Button>
          </Link>
          <Link to="/expenses">
            <Button variant="outline" className="gap-2 h-9 text-sm">
              <Receipt className="h-3.5 w-3.5" /> Add Expense
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="outline" className="gap-2 h-9 text-sm">
              <PackagePlus className="h-3.5 w-3.5" /> Stock In
            </Button>
          </Link>
          <Link to="/customers">
            <Button variant="outline" className="gap-2 h-9 text-sm">
              <UserPlus className="h-3.5 w-3.5" /> Add Customer
            </Button>
          </Link>
          <Link to="/sales">
            <Button variant="outline" className="gap-2 h-9 text-sm">
              <ShoppingCart className="h-3.5 w-3.5" /> Record Payment
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover shadow-lg px-4 py-3 text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name === "revenue" ? "Revenue" : "Profit"}</span>
          </div>
          <span className="font-semibold tabular-nums">{fmtINR(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Margin</span>
          <span className="text-xs font-bold text-primary">{((payload[1].value / payload[0].value) * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}

function HealthCard({ label, value, delta, up, icon: Icon }: { label: string; value: string; delta?: string; up?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {delta && (
          <p className={`mt-1.5 text-xs font-medium flex items-center gap-0.5 ${up ? "text-success" : "text-destructive"}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta} vs last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function InvStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${warn ? "text-warning" : ""}`}>{value}</p>
    </div>
  );
}

function CashRow({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "muted" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}
