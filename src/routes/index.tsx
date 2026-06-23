import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Boxes,
  IndianRupee,
  PackageCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cashFlow,
  expenseBreakdown,
  financials,
  fmtINR,
  monthlyTrend,
  production,
  recentSales,
  salesOverview,
  topProducts,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Vaidya Ayur ERP" },
      {
        name: "description",
        content:
          "Revenue, expenses, profit, inventory and pending payments — at a glance for your Ayurvedic unit.",
      },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

function KpiCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {value}
            </p>
            {(delta || hint) && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {delta && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                      trend === "down"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    {trend === "down" ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    {delta}
                  </span>
                )}
                {hint && <span className="text-muted-foreground">{hint}</span>}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  return (
    <PageShell
      title="Good morning, Vaidya"
      description="Here's how your manufacturing unit is doing today."
      actions={
        <Badge variant="secondary" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          September 2025
        </Badge>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={fmtINR(financials.revenue)}
          delta="+6.4%"
          trend="up"
          hint="vs last month"
          icon={IndianRupee}
        />
        <KpiCard
          label="Total Expenses"
          value={fmtINR(financials.expenses)}
          delta="+9.3%"
          trend="down"
          hint="vs last month"
          icon={Wallet}
        />
        <KpiCard
          label="Net Profit"
          value={fmtINR(financials.profit)}
          delta="+4.1%"
          trend="up"
          hint="₹1.5L this month"
          icon={TrendingUp}
        />
        <KpiCard
          label="Profit Margin"
          value={financials.margin.toFixed(1) + "%"}
          delta="-1.2 pts"
          trend="down"
          hint="rising input costs"
          icon={PackageCheck}
        />
      </div>

      {/* Trend + Expense breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Revenue vs Expenses
              </CardTitle>
              <span className="text-xs text-muted-foreground">Last 6 months</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v) => "₹" + v / 1000 + "k"}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtINR(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    fill="url(#exp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Expense breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtINR(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs">
              {expenseBreakdown.map((e, i) => (
                <li key={e.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {e.name}
                  </span>
                  <span className="font-medium tabular-nums">{fmtINR(e.value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Production + Cash flow + Sales overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Production overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Manufactured" value={production.manufactured.toLocaleString()} />
              <Stat label="Sold" value={production.sold.toLocaleString()} />
              <Stat label="In inventory" value={production.inventory.toLocaleString()} />
              <Stat
                label="Low stock"
                value={String(production.lowStock)}
                tone="warning"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sold of manufactured</span>
                <span className="font-medium">
                  {Math.round((production.sold / production.manufactured) * 100)}%
                </span>
              </div>
              <Progress value={(production.sold / production.manufactured) * 100} />
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-warning/15 p-3 text-xs text-warning-foreground">
              <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="font-medium">4 SKUs below reorder level</p>
                <p className="text-warning-foreground/80">
                  Ashwagandha root, Hair oil 200ml, Triphala 60ct, Brahmi ghee.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sales overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <SalesRow label="Today" value={fmtINR(salesOverview.today)} />
              <SalesRow label="This week" value={fmtINR(salesOverview.week)} />
              <SalesRow label="This month" value={fmtINR(salesOverview.month)} highlight />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Top selling
              </p>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={130}
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => fmtINR(v)}
                    />
                    <Bar dataKey="sales" radius={[0, 6, 6, 0]} fill="var(--color-chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cash flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CashRow label="Money received" value={fmtINR(cashFlow.received)} tone="success" />
            <CashRow label="Money pending" value={fmtINR(cashFlow.pending)} tone="warning" />
            <div className="border-t border-border pt-3">
              <CashRow
                label="Supplier payments due"
                value={fmtINR(cashFlow.supplierDue)}
                tone="muted"
              />
              <CashRow
                label="Customer payments due"
                value={fmtINR(cashFlow.customerDue)}
                tone="muted"
              />
            </div>
            <div className="rounded-lg bg-primary/5 p-3 text-xs">
              <p className="font-medium text-primary">Net position</p>
              <p className="mt-0.5 text-muted-foreground">
                You're owed{" "}
                <span className="font-semibold text-foreground">
                  {fmtINR(cashFlow.customerDue - cashFlow.supplierDue)}
                </span>{" "}
                more than you owe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product profit + Recent sales */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Product-wise profit
              </CardTitle>
              <Badge variant="outline" className="gap-1">
                <Boxes className="h-3 w-3" /> {topProducts.length} products
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => {
                  const margin = (p.profit / p.sales) * 100;
                  return (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(p.sales)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmtINR(p.cost)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-success">
                        {fmtINR(p.profit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {margin.toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent sales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSales.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.id} · {s.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{fmtINR(s.amount)}</p>
                  <Badge
                    variant={s.status === "Paid" ? "secondary" : "outline"}
                    className={
                      s.status === "Paid"
                        ? "bg-success/15 text-success border-transparent"
                        : "border-warning/40 text-warning"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          tone === "warning" ? "text-warning" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SalesRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between rounded-lg px-3 py-2 ${
        highlight ? "bg-primary/10" : ""
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums ${
          highlight ? "text-xl font-semibold text-primary" : "text-sm font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CashRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "muted";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}
