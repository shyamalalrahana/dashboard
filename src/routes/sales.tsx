import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Download,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
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
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  customers,
  fmtINR,
  salesOverview,
  salesTrend,
  topProducts,
} from "@/lib/mock-data";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales · ShopOS" },
      { name: "description", content: "Manage sales entries, invoices and customers." },
    ],
  }),
  component: SalesPage,
});

type PaymentMethod = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Credit";

type Sale = {
  id: string;
  customer: string;
  date: string;
  amount: number;
  profit: number;
  status: "Paid" | "Pending" | "Overdue";
  paymentMethod: PaymentMethod;
  dueDate: string;
};

const initialSales: Sale[] = [
  { id: "INV-2041", customer: "City Mart",           date: "2026-06-26", amount: 18400, profit: 5520,  status: "Paid",    paymentMethod: "UPI",           dueDate: "2026-06-26" },
  { id: "INV-2040", customer: "Metro General Store",  date: "2026-06-25", amount: 22000, profit: 7040,  status: "Pending", paymentMethod: "Credit",        dueDate: "2026-07-05" },
  { id: "INV-2039", customer: "Fresh Daily Stores",   date: "2026-06-24", amount: 14000, profit: 4200,  status: "Pending", paymentMethod: "Bank Transfer",  dueDate: "2026-07-01" },
  { id: "INV-2038", customer: "Raja Wholesale",       date: "2026-06-23", amount: 31500, profit: 9450,  status: "Paid",    paymentMethod: "Cheque",        dueDate: "2026-06-23" },
  { id: "INV-2037", customer: "Star Supermarket",     date: "2026-06-22", amount: 9800,  profit: 2940,  status: "Paid",    paymentMethod: "Cash",          dueDate: "2026-06-22" },
  { id: "INV-2036", customer: "Sunrise Stores",       date: "2026-06-20", amount: 27000, profit: 8100,  status: "Overdue", paymentMethod: "Credit",        dueDate: "2026-06-15" },
  { id: "INV-2035", customer: "City Mart",            date: "2026-06-18", amount: 16500, profit: 4950,  status: "Paid",    paymentMethod: "UPI",           dueDate: "2026-06-18" },
  { id: "INV-2034", customer: "Green Valley Foods",   date: "2026-06-17", amount: 42000, profit: 12600, status: "Overdue", paymentMethod: "Cheque",        dueDate: "2026-06-10" },
  { id: "INV-2033", customer: "Metro General Store",  date: "2026-06-15", amount: 19800, profit: 5940,  status: "Paid",    paymentMethod: "Bank Transfer",  dueDate: "2026-06-15" },
  { id: "INV-2032", customer: "Raja Wholesale",       date: "2026-06-12", amount: 35000, profit: 10500, status: "Paid",    paymentMethod: "Cheque",        dueDate: "2026-06-12" },
];

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "UPI", "Bank Transfer", "Cheque", "Credit"];

const STATUS_STYLES: Record<Sale["status"], string> = {
  Paid:    "bg-success/15 text-success border-transparent",
  Pending: "border-warning/40 text-warning",
  Overdue: "bg-destructive/10 text-destructive border-destructive/30",
};

const TOP_CUSTOMERS = [
  { name: "Raja Wholesale",      totalSpend: 148000, orders: 24 },
  { name: "City Mart",           totalSpend: 112000, orders: 18 },
  { name: "Metro General Store", totalSpend:  98000, orders: 15 },
  { name: "Green Valley Foods",  totalSpend:  74000, orders: 11 },
];

function fmtINRCompact(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer: "",
    amount: "",
    status: "Paid" as Sale["status"],
    paymentMethod: "Cash" as PaymentMethod,
    dueDate: new Date().toISOString().slice(0, 10),
  });
  const [editForm, setEditForm] = useState({
    customer: "",
    amount: "",
    status: "Paid" as Sale["status"],
    paymentMethod: "Cash" as PaymentMethod,
    dueDate: "",
  });

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.customer.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paidCount    = sales.filter((s) => s.status === "Paid").length;
  const pendingCount = sales.filter((s) => s.status === "Pending").length;
  const overdueCount = sales.filter((s) => s.status === "Overdue").length;
  const totalRevenue = sales.reduce((a, s) => a + s.amount, 0);
  const totalProfit  = sales.reduce((a, s) => a + s.profit, 0);
  const margin       = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  function openEdit(s: Sale) {
    setEditItem(s);
    setEditForm({ customer: s.customer, amount: String(s.amount), status: s.status, paymentMethod: s.paymentMethod, dueDate: s.dueDate });
  }
  function handleSaveEdit() {
    if (!editItem || !editForm.customer || !editForm.amount) return;
    setSales(sales.map((s) =>
      s.id === editItem.id
        ? { ...s, customer: editForm.customer, amount: Number(editForm.amount), status: editForm.status, paymentMethod: editForm.paymentMethod, dueDate: editForm.dueDate }
        : s
    ));
    setEditItem(null);
    toast.success("Invoice updated");
  }
  function handleDelete() {
    if (!deleteId) return;
    setSales(sales.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Invoice deleted");
  }
  function handleSubmit() {
    if (!form.customer || !form.amount) return;
    const profit = Math.round(Number(form.amount) * 0.3);
    const newSale: Sale = {
      id: "INV-" + (2042 + sales.length - initialSales.length),
      customer: form.customer,
      date: new Date().toISOString().slice(0, 10),
      amount: Number(form.amount),
      profit,
      status: form.status,
      paymentMethod: form.paymentMethod,
      dueDate: form.dueDate,
    };
    setSales([newSale, ...sales]);
    setForm({ customer: "", amount: "", status: "Paid", paymentMethod: "Cash", dueDate: new Date().toISOString().slice(0, 10) });
    setOpen(false);
    toast.success("Invoice created", { description: `${newSale.id} added for ${newSale.customer}` });
  }
  function handleExport() {
    const csv = [
      ["Invoice", "Customer", "Date", "Amount", "Profit", "Method", "Due Date", "Status"].join(","),
      ...sales.map((s) => [s.id, s.customer, s.date, s.amount, s.profit, s.paymentMethod, s.dueDate, s.status].join(",")),
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
      description="Invoices, revenue trends and top performing products."
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Today's Sales"
          value={fmtINR(salesOverview.today)}
          sub="+12% vs yesterday"
          subUp
          icon={TrendingUp}
        />
        <KpiCard
          label="This Month"
          value={fmtINR(salesOverview.month)}
          sub={`${salesOverview.totalOrders} orders`}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Pending Payments"
          value={fmtINR(salesOverview.pendingPayments)}
          sub={`${pendingCount + overdueCount} invoices`}
          warn
          icon={Wallet}
        />
        <KpiCard
          label="Total Orders"
          value={String(salesOverview.totalOrders)}
          sub={`${sales.length} invoices shown`}
          icon={Users}
        />
      </div>

      {/* Sales Trend + Quick Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-semibold">Sales Trend</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Revenue vs Profit · Jan–Jun 2026</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary inline-block" />Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success inline-block" />Profit
                </span>
              </div>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesTrend} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="salesRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="salesProfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#16a34a" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tickFormatter={(v) => fmtINRCompact(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<SalesTrendTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#salesRevGrad)" dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="profit"  stroke="#16a34a" strokeWidth={2.5} fill="url(#salesProfGrad)" dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Invoice Status</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">Paid</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{paidCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-sm text-muted-foreground">Overdue</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-destructive">{overdueCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Sales vs Profit</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtINR(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profit</span>
                  <span className="text-sm font-semibold tabular-nums text-success">{fmtINR(totalProfit)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Margin</span>
                  <span className="text-sm font-bold tabular-nums text-primary">{margin}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">Recent Invoices</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input className="pl-7 h-8 w-40 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              <span className="font-medium text-foreground">{filtered.length}</span> / {sales.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground text-sm">
                      No invoices match your filters.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {s.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{s.customer}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{s.date}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{s.paymentMethod}</TableCell>
                    <TableCell className={`whitespace-nowrap text-sm ${s.status === "Overdue" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {s.dueDate}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold whitespace-nowrap">
                      {fmtINR(s.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[s.status]}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Top Customers + Top Products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-sm font-semibold">Top Customers</h2>
            </div>
            <div className="p-4 space-y-3">
              {TOP_CUSTOMERS.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.orders} orders</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">{fmtINR(c.totalSpend)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display text-sm font-semibold">Top Products</h2>
              </div>
              <button className="flex items-center gap-0.5 text-xs text-primary hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {topProducts.slice(0, 3).map((p, i) => {
                const pct = Math.round((p.profit / p.sales) * 100);
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sold} units · {pct}% margin</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0 text-success">{fmtINR(p.profit)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={editForm.customer} onValueChange={(v) => setEditForm({ ...editForm, customer: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer…" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as Sale["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={editForm.paymentMethod} onValueChange={(v) => setEditForm({ ...editForm, paymentMethod: v as PaymentMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.customer || !editForm.amount}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Invoice Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={form.customer} onValueChange={(v) => setForm({ ...form, customer: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer…" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="e.g. 25000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Sale["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.customer || !form.amount}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function SalesTrendTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover shadow-lg px-4 py-3 text-sm min-w-[150px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name === "revenue" ? "Revenue" : "Profit"}</span>
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

function KpiCard({
  label, value, sub, subUp, warn, icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  subUp?: boolean;
  warn?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
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
        <p className={`text-2xl font-bold tabular-nums ${warn ? "text-warning" : ""}`}>
          {value}
        </p>
        {sub && (
          <p className={`mt-1.5 text-xs ${subUp ? "text-success font-medium" : "text-muted-foreground"}`}>
            {subUp && "↑ "}{sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
