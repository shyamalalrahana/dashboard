import { createFileRoute } from "@tanstack/react-router";
import { Download, Paperclip, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { expenseBreakdown, expenseEntries as initialExpenses, fmtINR, type ExpenseEntry } from "@/lib/mock-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · ShopOS" },
      { name: "description", content: "Track and categorize unit expenses." },
    ],
  }),
  component: ExpensesPage,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

const CATEGORIES = ["Purchases", "Salaries", "Electricity", "Rent", "Transportation", "Misc"];
const PAYMENT_METHODS: ExpenseEntry["paymentMethod"][] = ["Cash", "Bank Transfer", "UPI", "Credit Card", "Cheque"];
const STATUSES: ExpenseEntry["status"][] = ["Paid", "Pending", "Approved", "Rejected"];

const CAT_COLORS: Record<string, string> = {
  Purchases:     CHART_COLORS[0],
  Salaries:      CHART_COLORS[1],
  Electricity:   CHART_COLORS[2],
  Rent:          CHART_COLORS[3],
  Transportation:CHART_COLORS[4],
  Misc:          CHART_COLORS[5],
};

const STATUS_STYLES: Record<ExpenseEntry["status"], string> = {
  Paid:     "bg-success/15 text-success border-transparent",
  Approved: "bg-primary/10 text-primary border-primary/20",
  Pending:  "border-warning/40 text-warning",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

type DateFilter = "today" | "week" | "month" | "custom" | "all";

const EMPTY_FORM = {
  category: "", vendor: "", amount: "", date: "",
  paymentMethod: "Cash" as ExpenseEntry["paymentMethod"],
  note: "", status: "Pending" as ExpenseEntry["status"], hasAttachment: false,
};

function getRange(filter: DateFilter, from: string, to: string): { from: Date; to: Date } | null {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  if (filter === "today") return { from: start, to: today };
  if (filter === "week") {
    const f = new Date(start); f.setDate(f.getDate() - f.getDay());
    return { from: f, to: today };
  }
  if (filter === "month") {
    const f = new Date(start.getFullYear(), start.getMonth(), 1);
    return { from: f, to: today };
  }
  if (filter === "custom" && from && to) {
    const f = new Date(from); f.setHours(0, 0, 0, 0);
    const t = new Date(to); t.setHours(23, 59, 59, 999);
    return { from: f, to: t };
  }
  return null;
}

function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(initialExpenses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editItem, setEditItem] = useState<ExpenseEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const fileRef = useRef<HTMLInputElement>(null);
  const addFileRef = useRef<HTMLInputElement>(null);

  // ── filtering ──
  const range = getRange(dateFilter, customFrom, customTo);
  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.note.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
      || e.category.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    let matchDate = true;
    if (range) {
      const d = new Date(e.date);
      matchDate = d >= range.from && d <= range.to;
    }
    return matchSearch && matchCat && matchStatus && matchDate;
  });

  // ── KPI ──
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const purchases = expenses.filter((e) => e.category === "Purchases").reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter((e) => e.status === "Pending").reduce((s, e) => s + e.amount, 0);
  const billsUploaded = expenses.filter((e) => e.hasAttachment).length;

  // ── actions ──
  function openEdit(e: ExpenseEntry) {
    setEditItem(e);
    setEditForm({ category: e.category, vendor: e.vendor, amount: String(e.amount), date: e.date, paymentMethod: e.paymentMethod, note: e.note, status: e.status, hasAttachment: e.hasAttachment });
  }
  function handleSaveEdit() {
    if (!editItem || !editForm.category || !editForm.amount) return;
    setExpenses(expenses.map((e) => e.id === editItem.id ? { ...e, ...editForm, amount: Number(editForm.amount) } : e));
    setEditItem(null);
    toast.success("Expense updated");
  }
  function handleDelete() {
    if (!deleteId) return;
    setExpenses(expenses.filter((e) => e.id !== deleteId));
    setDeleteId(null);
    toast.success("Expense deleted");
  }
  function handleSubmit() {
    if (!form.category || !form.amount || !form.date) return;
    const next: ExpenseEntry = {
      id: "EXP-" + (500 + expenses.length),
      category: form.category,
      vendor: form.vendor,
      note: form.note,
      date: form.date,
      amount: Number(form.amount),
      status: form.status,
      paymentMethod: form.paymentMethod,
      hasAttachment: form.hasAttachment,
    };
    setExpenses([next, ...expenses]);
    setForm({ ...EMPTY_FORM });
    setOpen(false);
    toast.success("Expense added", { description: `${next.id} · ${fmtINR(next.amount)}` });
  }
  function handleAttachBill(e: React.ChangeEvent<HTMLInputElement>, target: "add" | "edit") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === "add") setForm((f) => ({ ...f, hasAttachment: true }));
    else setEditForm((f) => ({ ...f, hasAttachment: true }));
    toast.success("Bill attached", { description: file.name });
    e.target.value = "";
  }
  function exportCSV() {
    const headers = ["ID", "Date", "Category", "Vendor", "Note", "Amount", "Payment Method", "Status", "Bill"];
    const rows = filteredExpenses.map((e) => [e.id, e.date, e.category, e.vendor, `"${e.note}"`, e.amount, e.paymentMethod, e.status, e.hasAttachment ? "Yes" : "No"]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported", { description: `${filteredExpenses.length} rows → expenses.csv` });
  }

  const DATE_TABS: { key: DateFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <PageShell
      title="Expenses"
      description="Categorized spend, recent entries and uploaded bills."
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Expense"    value={fmtINR(total)}     />
        <KpiCard label="Purchases"        value={fmtINR(purchases)} sub="of total" />
        <KpiCard label="Pending Payments" value={fmtINR(pending)}   tone="warning" />
        <KpiCard label="Bills Uploaded"   value={String(billsUploaded)} />
      </div>

      {/* Chart + legend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">By category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                      {expenseBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                      formatter={(v: number, name: string) => [`${fmtINR(v)} (${((v / expenseBreakdown.reduce((s, e) => s + e.value, 0)) * 100).toFixed(1)}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 self-center">
                <ul className="space-y-2 text-sm">
                  {expenseBreakdown.map((e, i) => (
                    <li key={e.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {e.name}
                      </span>
                      <span className="font-medium tabular-nums">{fmtINR(e.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Highest category" value="Purchases" />
            <Row label="Bills uploaded"   value={String(billsUploaded)} />
            <Row label="Pending approval" value={String(expenses.filter((e) => e.status === "Pending").length)} />
            <Row label="Avg. daily spend" value={fmtINR(Math.round(total / 30))} />
            <Row label="Total entries"    value={String(expenses.length)} />
          </CardContent>
        </Card>
      </div>

      {/* Expense list */}
      <Card>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">All Expenses</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input className="pl-7 h-8 w-40 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-32 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-28 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              <span className="font-medium text-foreground">{filteredExpenses.length}</span> / {expenses.length}
            </p>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-sm font-medium">No expenses found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters or add a new expense.</p>
              <Button size="sm" className="mt-1 gap-1.5" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center w-10">Bill</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {e.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CAT_COLORS[e.category] ?? "var(--color-muted-foreground)" }} />
                          {e.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{e.vendor || "—"}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[180px] truncate text-sm">{e.note}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-sm">{e.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${STATUS_STYLES[e.status]}`}>{e.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {e.hasAttachment && <Paperclip className="h-3.5 w-3.5 text-muted-foreground mx-auto" />}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold whitespace-nowrap">
                        {fmtINR(e.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(e)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Expense Dialog ── */}
      <input ref={addFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleAttachBill(e, "add")} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ExpenseEntry["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vendor <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. Sri Traders" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="e.g. 12000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as ExpenseEntry["paymentMethod"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. Rice procurement — 200kg" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <button type="button" onClick={() => addFileRef.current?.click()} className={`w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 ${form.hasAttachment ? "border-success/50 bg-success/5 text-success" : "border-border text-muted-foreground"}`}>
              <Paperclip className="h-4 w-4 shrink-0" />
              {form.hasAttachment ? "Bill attached ✓" : "Attach bill (image or PDF)"}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.category || !form.amount || !form.date}>Add expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Expense Dialog ── */}
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleAttachBill(e, "edit")} />
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Expense — {editItem?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as ExpenseEntry["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input value={editForm.vendor} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={editForm.paymentMethod} onValueChange={(v) => setEditForm({ ...editForm, paymentMethod: v as ExpenseEntry["paymentMethod"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className={`w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 ${editForm.hasAttachment ? "border-success/50 bg-success/5 text-success" : "border-border text-muted-foreground"}`}>
              <Paperclip className="h-4 w-4 shrink-0" />
              {editForm.hasAttachment ? "Bill attached ✓" : "Attach bill (image or PDF)"}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.category || !editForm.amount}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 font-display text-2xl font-semibold ${tone === "warning" ? "text-warning" : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
