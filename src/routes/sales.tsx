import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Download,
  Mail,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  TrendingUp,
  Trash2,
  X,
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
import { fmtINR, salesTrend, topProducts } from "@/lib/mock-data";
import { loadActiveProductsForSales } from "@/lib/product-store";
import {
  computeGST,
  loadBusinessSettings,
  loadEmailSettings,
  loadInvoiceSettings,
  loadTaxSettings,
} from "@/lib/settings-store";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales · ShopOS" },
      { name: "description", content: "Retail counter sales — products sold directly to walk-in customers." },
    ],
  }),
  component: SalesPage,
});

type RetailPayment = "Cash" | "UPI" | "Card";
type SaleStatus = "Paid" | "Returned";

type SaleItem = {
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

type Sale = {
  id: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  items: SaleItem[];
  total: number;
  payment: RetailPayment;
  status: SaleStatus;
  createdAt: string;
};

const FALLBACK_PRODUCTS = [
  { name: "Sunflower Oil 1L",     sku: "SOL-001", mrp: 180, sellingPrice: 170 },
  { name: "Basmati Rice 5kg",     sku: "BRS-005", mrp: 480, sellingPrice: 460 },
  { name: "Wheat Flour 10kg",     sku: "WFL-010", mrp: 380, sellingPrice: 360 },
  { name: "Shampoo 200ml",        sku: "SHP-200", mrp: 130, sellingPrice: 125 },
  { name: "Detergent Powder 1kg", sku: "DTP-001", mrp: 110, sellingPrice: 105 },
  { name: "Toor Dal 1kg",         sku: "TDL-001", mrp: 160, sellingPrice: 155 },
];

function getRetailProducts() {
  const stored = loadActiveProductsForSales();
  if (stored && stored.length > 0) {
    return stored.map((p) => ({ name: p.name, sku: p.sku, mrp: p.mrp, sellingPrice: p.sellingPrice }));
  }
  return FALLBACK_PRODUCTS;
}

const STATUS_STYLES: Record<SaleStatus, string> = {
  Paid:     "bg-success/15 text-success border-transparent",
  Returned: "bg-destructive/10 text-destructive border-destructive/30",
};

let saleCounter = 11;
function nextSaleId() { return `SAL-${String(saleCounter++).padStart(3, "0")}`; }

function fmtDT(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}
function fmtINRCompact(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}
function isToday(iso: string) {
  const d = new Date(iso), now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const initialSales: Sale[] = [
  {
    id: "SAL-010", customer: "Walk-in", customerPhone: "", customerEmail: "", payment: "Cash", status: "Paid",
    createdAt: "2026-06-26T10:25:00", total: 520,
    items: [
      { productName: "Sunflower Oil 1L", sku: "SOL-001", qty: 2, unitPrice: 180, lineTotal: 360 },
      { productName: "Toor Dal 1kg",     sku: "TDL-001", qty: 1, unitPrice: 160, lineTotal: 160 },
    ],
  },
  {
    id: "SAL-009", customer: "Ravi Kumar", customerPhone: "9876543210", customerEmail: "ravi.kumar@email.com", payment: "UPI", status: "Paid",
    createdAt: "2026-06-26T09:48:00", total: 960,
    items: [
      { productName: "Basmati Rice 5kg", sku: "BRS-005", qty: 2, unitPrice: 480, lineTotal: 960 },
    ],
  },
  {
    id: "SAL-008", customer: "Walk-in", customerPhone: "", customerEmail: "", payment: "Cash", status: "Paid",
    createdAt: "2026-06-25T17:10:00", total: 490,
    items: [
      { productName: "Wheat Flour 10kg",     sku: "WFL-010", qty: 1, unitPrice: 380, lineTotal: 380 },
      { productName: "Detergent Powder 1kg", sku: "DTP-001", qty: 1, unitPrice: 110, lineTotal: 110 },
    ],
  },
  {
    id: "SAL-007", customer: "Priya S.", customerPhone: "9845001234", customerEmail: "priya.s@gmail.com", payment: "Card", status: "Paid",
    createdAt: "2026-06-25T15:30:00", total: 770,
    items: [
      { productName: "Basmati Rice 5kg", sku: "BRS-005", qty: 1, unitPrice: 480, lineTotal: 480 },
      { productName: "Shampoo 200ml",    sku: "SHP-200", qty: 1, unitPrice: 130, lineTotal: 130 },
      { productName: "Toor Dal 1kg",     sku: "TDL-001", qty: 1, unitPrice: 160, lineTotal: 160 },
    ],
  },
  {
    id: "SAL-006", customer: "Walk-in", customerPhone: "", customerEmail: "", payment: "Cash", status: "Paid",
    createdAt: "2026-06-25T11:55:00", total: 540,
    items: [
      { productName: "Sunflower Oil 1L", sku: "SOL-001", qty: 3, unitPrice: 180, lineTotal: 540 },
    ],
  },
  {
    id: "SAL-005", customer: "Meena Devi", customerPhone: "9900112233", customerEmail: "meena.devi@yahoo.com", payment: "UPI", status: "Paid",
    createdAt: "2026-06-24T16:20:00", total: 370,
    items: [
      { productName: "Shampoo 200ml",        sku: "SHP-200", qty: 2, unitPrice: 130, lineTotal: 260 },
      { productName: "Detergent Powder 1kg", sku: "DTP-001", qty: 1, unitPrice: 110, lineTotal: 110 },
    ],
  },
  {
    id: "SAL-004", customer: "Walk-in", customerPhone: "", customerEmail: "", payment: "Cash", status: "Paid",
    createdAt: "2026-06-24T12:05:00", total: 760,
    items: [
      { productName: "Wheat Flour 10kg", sku: "WFL-010", qty: 2, unitPrice: 380, lineTotal: 760 },
    ],
  },
  {
    id: "SAL-003", customer: "Suresh P.", customerPhone: "9812345678", customerEmail: "suresh.p@gmail.com", payment: "UPI", status: "Paid",
    createdAt: "2026-06-23T14:40:00", total: 980,
    items: [
      { productName: "Basmati Rice 5kg", sku: "BRS-005", qty: 1, unitPrice: 480, lineTotal: 480 },
      { productName: "Sunflower Oil 1L", sku: "SOL-001", qty: 1, unitPrice: 180, lineTotal: 180 },
      { productName: "Toor Dal 1kg",     sku: "TDL-001", qty: 2, unitPrice: 160, lineTotal: 320 },
    ],
  },
  {
    id: "SAL-002", customer: "Walk-in", customerPhone: "", customerEmail: "", payment: "Cash", status: "Returned",
    createdAt: "2026-06-22T10:15:00", total: 350,
    items: [
      { productName: "Shampoo 200ml",        sku: "SHP-200", qty: 1, unitPrice: 130, lineTotal: 130 },
      { productName: "Detergent Powder 1kg", sku: "DTP-001", qty: 2, unitPrice: 110, lineTotal: 220 },
    ],
  },
  {
    id: "SAL-001", customer: "Lakshmi A.", customerPhone: "9733221100", customerEmail: "lakshmi.a@email.com", payment: "Card", status: "Paid",
    createdAt: "2026-06-22T09:30:00", total: 860,
    items: [
      { productName: "Wheat Flour 10kg", sku: "WFL-010", qty: 1, unitPrice: 380, lineTotal: 380 },
      { productName: "Basmati Rice 5kg", sku: "BRS-005", qty: 1, unitPrice: 480, lineTotal: 480 },
    ],
  },
];

type FormItem = { productName: string; sku: string; qty: string; unitPrice: number };
const emptyItem = (): FormItem => ({ productName: "", sku: "", qty: "1", unitPrice: 0 });

function SalesPage() {
  const taxCfg      = loadTaxSettings();
  const bizCfg      = loadBusinessSettings();
  const invoiceCfg  = loadInvoiceSettings();

  const [retailProducts] = useState(() => getRetailProducts());
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [payment, setPayment] = useState<RetailPayment>("Cash");
  const [formItems, setFormItems] = useState<FormItem[]>([emptyItem()]);

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.customer.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) ||
      s.items.some((i) => i.productName.toLowerCase().includes(q));
  });

  const todayTotal   = sales.filter((s) => isToday(s.createdAt) && s.status === "Paid").reduce((sum, s) => sum + s.total, 0);
  const monthTotal   = sales.filter((s) => s.status === "Paid").reduce((sum, s) => sum + s.total, 0);
  const avgSale      = sales.length > 0 ? Math.round(sales.reduce((sum, s) => sum + s.total, 0) / sales.length) : 0;
  const returnCount  = sales.filter((s) => s.status === "Returned").length;

  function pickProduct(idx: number, name: string) {
    const prod = retailProducts.find((p) => p.name === name);
    setFormItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, productName: name, sku: prod?.sku ?? "", unitPrice: prod?.sellingPrice ?? prod?.mrp ?? 0 } : item
      )
    );
  }
  function setQty(idx: number, qty: string) {
    setFormItems((prev) => prev.map((item, i) => (i === idx ? { ...item, qty } : item)));
  }
  function removeFormItem(idx: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal    = formItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * item.unitPrice, 0);
  const gst         = computeGST(subtotal, taxCfg);
  const runningTotal = gst.total;
  const canSubmit = formItems.some((item) => item.productName && Number(item.qty) > 0);

  function resetForm() {
    setCustomer("");
    setCustomerPhone("");
    setCustomerEmail("");
    setPayment("Cash");
    setFormItems([emptyItem()]);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const saleItems: SaleItem[] = formItems
      .filter((item) => item.productName && Number(item.qty) > 0)
      .map((item) => ({
        productName: item.productName,
        sku: item.sku,
        qty: Number(item.qty),
        unitPrice: item.unitPrice,
        lineTotal: Number(item.qty) * item.unitPrice,
      }));
    const itemsSubtotal = saleItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const saleGst = computeGST(itemsSubtotal, taxCfg);
    const newSale: Sale = {
      id: nextSaleId(),
      customer: customer.trim() || "Walk-in",
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      items: saleItems,
      total: saleGst.total,
      payment,
      status: "Paid",
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [newSale, ...prev]);
    resetForm();
    setOpen(false);
    setPrintSale(newSale);
    toast.success("Sale recorded", { description: `${newSale.id} · ${fmtINR(newSale.total)}` });
  }

  function handleDelete() {
    if (!deleteId) return;
    setSales((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Sale deleted");
  }

  function handleExport() {
    const rows = [
      ["Sale ID", "Customer", "Items", "Total", "Payment", "Status", "Date"].join(","),
      ...sales.map((s) => [
        s.id,
        s.customer,
        `"${s.items.map((i) => `${i.productName} x${i.qty}`).join("; ")}"`,
        s.total,
        s.payment,
        s.status,
        s.createdAt,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "retail-sales.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported sales as CSV");
  }

  return (
    <PageShell
      title="Sales"
      description="Retail counter sales — products sold directly to walk-in customers."
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Record Sale
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Today's Sales"
          value={fmtINR(todayTotal)}
          sub={`${sales.filter((s) => isToday(s.createdAt)).length} transactions today`}
          icon={Receipt}
        />
        <KpiCard
          label="This Month"
          value={fmtINR(monthTotal)}
          sub={`${sales.filter((s) => s.status === "Paid").length} paid sales`}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Avg. Sale Value"
          value={fmtINR(avgSale)}
          sub="per transaction"
          icon={TrendingUp}
        />
        <KpiCard
          label="Total Transactions"
          value={String(sales.length)}
          sub={`${returnCount} returned`}
          icon={Receipt}
        />
      </div>

      {/* Sales Trend + Top Products */}
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
              {topProducts.slice(0, 5).map((p, i) => {
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

      {/* Counter Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">Counter Sales</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-7 h-8 w-48 text-sm"
                placeholder="Customer, product, ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              <span className="font-medium text-foreground">{filtered.length}</span> / {sales.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground text-sm">
                      No sales found.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s) => {
                  const { date, time } = fmtDT(s.createdAt);
                  const itemsSummary = s.items.map((i) => `${i.productName} ×${i.qty}`).join(", ");
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {s.id}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        <div className="text-sm">{date}</div>
                        <div className="text-xs text-muted-foreground/60">{time}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{s.customer}</div>
                        {s.customerPhone && <div className="text-xs text-muted-foreground">{s.customerPhone}</div>}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground max-w-[260px] truncate"
                        title={itemsSummary}
                      >
                        {itemsSummary}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold whitespace-nowrap">
                        {fmtINR(s.total)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {s.payment}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_STYLES[s.status]}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setPrintSale(s)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bill / Invoice Dialog */}
      {printSale && (
        <BillDialog
          sale={printSale}
          onClose={() => setPrintSale(null)}
          taxCfg={taxCfg}
          bizName={bizCfg.name}
          invoiceTerms={invoiceCfg.terms}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the sale record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Record Sale Dialog */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) resetForm();
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Customer */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Customer Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input placeholder="Walk-in customer" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input type="tel" placeholder="9876543210" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email Address <span className="text-muted-foreground text-xs font-normal">(optional — to send bill)</span></Label>
                <Input type="email" placeholder="customer@email.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <Label>
                Products <span className="text-destructive">*</span>
              </Label>
              {formItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select value={item.productName} onValueChange={(v) => pickProduct(idx, v)}>
                    <SelectTrigger className="flex-1 min-w-0">
                      <SelectValue placeholder="Select product…" />
                    </SelectTrigger>
                    <SelectContent>
                      {retailProducts.map((p) => (
                        <SelectItem key={p.sku} value={p.name}>
                          {p.name} — ₹{p.sellingPrice ?? p.mrp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="w-16 shrink-0"
                    value={item.qty}
                    onChange={(e) => setQty(idx, e.target.value)}
                  />
                  <span className="text-sm tabular-nums text-muted-foreground w-20 text-right shrink-0">
                    {item.unitPrice > 0 ? fmtINR((Number(item.qty) || 0) * item.unitPrice) : "—"}
                  </span>
                  {formItems.length > 1 && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFormItem(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline" size="sm"
                className="gap-1.5 w-full"
                onClick={() => setFormItems((prev) => [...prev, emptyItem()])}
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            {/* Running Total */}
            {subtotal > 0 && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1.5">
                {gst.gstAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{fmtINR(gst.taxable)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{gst.rateLabel}</span>
                      <span className="tabular-nums">+ {fmtINR(gst.gstAmount)}</span>
                    </div>
                    <div className="border-t border-border/60 pt-1.5" />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold tabular-nums">{fmtINR(runningTotal)}</span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <div className="flex gap-2">
                {(["Cash", "UPI", "Card"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayment(m)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      payment === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function sendBillEmail(sale: Sale, bizName: string, invoiceTerms: string) {
  const taxCfg   = loadTaxSettings();
  const biz      = loadBusinessSettings();
  const emailCfg = loadEmailSettings();
  const { date, time } = fmtDT(sale.createdAt);
  const subtotal = sale.items.reduce((s, i) => s + i.lineTotal, 0);
  const gst = computeGST(subtotal, taxCfg);

  const itemRows = sale.items.map((i) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e8e8e8;font-size:14px;color:#1a1a1a;font-weight:600">${i.productName}</td>
      <td style="padding:14px 0;border-bottom:1px solid #e8e8e8;font-size:13px;color:#666;text-align:right">×${i.qty}</td>
      <td style="padding:14px 0 14px 24px;border-bottom:1px solid #e8e8e8;font-size:14px;color:#1a1a1a;text-align:right;white-space:nowrap">₹${i.lineTotal.toLocaleString("en-IN")}</td>
    </tr>`).join("");

  const subtotalRows = gst.gstAmount > 0 ? `
    <tr>
      <td colspan="2" style="padding:10px 0 4px;text-align:right;font-size:13px;color:#888">Subtotal</td>
      <td style="padding:10px 0 4px 24px;text-align:right;font-size:13px;color:#888">₹${gst.taxable.toLocaleString("en-IN")}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:4px 0;text-align:right;font-size:13px;color:#888">${gst.rateLabel}</td>
      <td style="padding:4px 0 4px 24px;text-align:right;font-size:13px;color:#888">₹${gst.gstAmount.toLocaleString("en-IN")}</td>
    </tr>` : "";

  const customerName = sale.customer !== "Walk-in" ? sale.customer : "Valued Customer";
  const accentColor  = emailCfg.accentColor || "#2a7a5a";
  const greetingText = emailCfg.greeting    || "We appreciate your business.";
  const greetingBody = emailCfg.greetingBody
    ? emailCfg.greetingBody + (biz.email ? ` If you have any questions, please email us at <a href="mailto:${biz.email}" style="color:${accentColor}">${biz.email}</a>.` : "")
    : `Thank you for shopping with us! A detailed summary of your purchase is below.${biz.email ? ` If you have any questions, email us at <a href="mailto:${biz.email}" style="color:${accentColor}">${biz.email}</a>.` : ""}`;
  const closingText  = emailCfg.closing     || "That's all.";
  const closingBody  = emailCfg.closingBody || (invoiceTerms || "Thank you for your purchase. We hope to see you again soon!");
  const signature    = emailCfg.signature   || `— ${bizName}`;
  const subject      = (emailCfg.subjectTemplate || "Your Receipt from {bizName} — {billNo}")
    .replace("{bizName}", bizName)
    .replace("{billNo}", sale.id);

  // Plain-text body for the mailto fallback (mail apps cannot render HTML)
  const plainTextItems = sale.items.map((i) =>
    `  ${i.productName.padEnd(26)} ×${i.qty}   ₹${i.lineTotal.toLocaleString("en-IN")}`
  ).join("\n");
  const plainTextBody = [
    `Dear ${customerName},`,
    "",
    greetingText.replace(/<[^>]+>/g, ""),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `  Bill No  : ${sale.id}`,
    `  Date     : ${date}  ${time}`,
    sale.customerPhone ? `  Phone    : ${sale.customerPhone}` : null,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `  ${"Description".padEnd(26)} Qty   Amount`,
    plainTextItems,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    gst.gstAmount > 0 ? `  Subtotal                          ₹${gst.taxable.toLocaleString("en-IN")}` : null,
    gst.gstAmount > 0 ? `  ${gst.rateLabel.padEnd(32)} ₹${gst.gstAmount.toLocaleString("en-IN")}` : null,
    `  TOTAL                             ₹${sale.total.toLocaleString("en-IN")}`,
    `  Payment  : ${sale.payment}   Status: ${sale.status}`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    emailCfg.includeTerms && invoiceTerms ? invoiceTerms : null,
    "",
    closingText.replace(/<[^>]+>/g, ""),
    signature,
  ].filter((l) => l !== null).join("\n");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt — ${sale.id}</title></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

  <!-- Card -->
  <tr><td style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <table width="100%" cellpadding="0" cellspacing="0">

    <!-- Header -->
    <tr>
      <td style="padding:36px 48px 28px;border-bottom:1px solid #e8e8e8">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle">
            ${biz.logoUrl
              ? `<img src="${biz.logoUrl}" alt="${bizName}" style="height:48px;max-width:160px;object-fit:contain;display:block;margin-bottom:6px">`
              : ""}
            <div style="font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">${bizName}</div>
          </td>
          <td style="text-align:right;font-size:13px;color:#888;font-weight:500;text-transform:uppercase;letter-spacing:1px;vertical-align:middle">Receipt</td>
        </tr></table>
      </td>
    </tr>

    <!-- Meta -->
    <tr>
      <td style="padding:24px 48px 28px;border-bottom:1px solid #e8e8e8">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Prepared for</div>
            <div style="font-size:18px;font-weight:700;color:#1a1a1a">${customerName}</div>
            ${sale.customerPhone ? `<div style="font-size:13px;color:#888;margin-top:3px">${sale.customerPhone}</div>` : ""}
          </td>
          <td style="text-align:right;vertical-align:top">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Date</div>
            <div style="font-size:16px;font-weight:700;color:#1a1a1a">${date}</div>
            <div style="font-size:13px;color:#888;margin-top:3px">${time} &nbsp;·&nbsp; ${sale.id}</div>
          </td>
        </tr></table>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:28px 48px;border-bottom:1px solid #e8e8e8">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;padding-right:24px">
            <div style="font-size:17px;font-weight:700;color:${accentColor};margin-bottom:10px">${greetingText}</div>
            <div style="font-size:13px;color:#666;line-height:1.6">${greetingBody}</div>
          </td>
          <td style="vertical-align:top;text-align:right;width:72px">
            <div style="width:64px;height:64px;border-radius:50%;background:#f0f0f0;display:inline-flex;align-items:center;justify-content:center;font-size:28px">🛍️</div>
          </td>
        </tr></table>
      </td>
    </tr>

    <!-- Invoice summary -->
    <tr>
      <td style="padding:28px 48px 0">
        <div style="font-size:15px;font-weight:700;color:${accentColor};margin-bottom:16px">Invoice Summary</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <th style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;border-bottom:2px solid #e8e8e8;text-align:left;font-weight:500">Description</th>
            <th style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;border-bottom:2px solid #e8e8e8;text-align:right;font-weight:500">Qty</th>
            <th style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;border-bottom:2px solid #e8e8e8;padding-left:24px;text-align:right;font-weight:500">Amount</th>
          </tr>
          ${itemRows}
          ${subtotalRows}
          <tr>
            <td colspan="2" style="padding:16px 0 0;text-align:right;font-size:15px;font-weight:700;color:#1a1a1a;border-top:2px solid #1a1a1a">Total</td>
            <td style="padding:16px 0 0 24px;text-align:right;font-size:15px;font-weight:700;color:#1a1a1a;border-top:2px solid #1a1a1a;white-space:nowrap">₹${sale.total.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:8px 0 28px">
              <span style="font-size:12px;color:#aaa">Payment: ${sale.payment} &nbsp;·&nbsp; Status: ${sale.status}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:24px 48px 36px;border-top:1px solid #e8e8e8;background:#fafafa">
        <div style="font-size:15px;font-weight:700;color:${accentColor};margin-bottom:8px">${closingText}</div>
        <div style="font-size:13px;color:#666;line-height:1.6">${closingBody}</div>
        ${emailCfg.includeTerms && invoiceTerms ? `<div style="font-size:12px;color:#aaa;margin-top:10px;font-style:italic">${invoiceTerms}</div>` : ""}
        <div style="margin-top:14px;font-size:13px;color:#444;font-weight:500">${signature}</div>
        ${emailCfg.includeAddress && biz.address ? `<div style="font-size:12px;color:#aaa;margin-top:10px">${biz.address}</div>` : ""}
        ${emailCfg.includeGstin && biz.gstin ? `<div style="font-size:12px;color:#aaa">GSTIN: ${biz.gstin}</div>` : ""}
      </td>
    </tr>

  </table>
  </td></tr>
  <!-- Bottom label -->
  <tr><td style="padding:16px;text-align:center;font-size:11px;color:#aaa">
    This receipt was generated by ${bizName} · ${date}
  </td></tr>

</table>
</td></tr>
</table>

<!-- Open in mail button -->
<div id="action-bar" style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #ddd;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 -2px 12px rgba(0,0,0,0.08)">
  <span style="font-size:13px;color:#666">Save as PDF via File → Print, or open your mail app to send.</span>
  <div style="display:flex;gap:10px">
    <button onclick="window.print()" style="padding:9px 18px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#333">🖨 Print / Save PDF</button>
    <a href="mailto:${sale.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}" style="padding:9px 18px;border:none;border-radius:6px;background:${accentColor};font-size:13px;font-weight:600;cursor:pointer;color:#fff;text-decoration:none">✉ Open Mail App</a>
  </div>
</div>
<div style="height:70px"></div>
<style>@media print { #action-bar { display:none!important; } body { background:#fff; } }</style>
</body></html>`;

  const win = window.open("", "_blank", "width=680,height=760");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
}

function printBill(sale: Sale, bizName: string, invoiceTerms: string) {
  const taxCfg = loadTaxSettings();
  const biz    = loadBusinessSettings();
  const { date, time } = fmtDT(sale.createdAt);
  const subtotal = sale.items.reduce((s, i) => s + i.lineTotal, 0);
  const gst = computeGST(subtotal, taxCfg);
  const rows = sale.items.map((i) =>
    `<tr>
      <td style="padding:4px 8px 4px 0;border-bottom:1px solid #e5e7eb">${i.productName}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${i.qty}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${i.unitPrice}</td>
      <td style="padding:4px 0 4px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">₹${i.lineTotal}</td>
    </tr>`
  ).join("");

  const taxRows = gst.gstAmount > 0 ? `
    <tr><td style="color:#555">Subtotal</td><td style="text-align:right">₹${gst.taxable}</td></tr>
    <tr><td style="color:#555">${gst.rateLabel}</td><td style="text-align:right">₹${gst.gstAmount}</td></tr>
  ` : "";

  const termsHtml = invoiceTerms
    ? `<hr class="divider"><div style="font-size:10px;color:#888;margin-top:4px">${invoiceTerms}</div>`
    : "";

  const gstin = biz.gstin ? `<div style="font-size:10px;color:#555">GSTIN: ${biz.gstin}</div>` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill ${sale.id}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 13px; color: #111; margin: 0; padding: 24px; max-width: 320px; }
    .center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 4px 8px 4px 0; font-size: 11px; text-transform: uppercase; color: #555; }
    @media print { body { padding: 8px; } }
  </style></head><body>
  <div class="center" style="margin-bottom:12px">
    ${biz.logoUrl ? `<img src="${biz.logoUrl}" alt="${bizName}" style="height:56px;max-width:160px;object-fit:contain;margin-bottom:6px">` : ""}
    <div style="font-size:18px;font-weight:700;letter-spacing:1px">${bizName}</div>
    <div style="font-size:11px;color:#555">Counter Bill / Tax Invoice</div>
    ${gstin}
    ${biz.phone ? `<div style="font-size:10px;color:#555">${biz.phone}</div>` : ""}
    ${biz.address ? `<div style="font-size:10px;color:#555">${biz.address}</div>` : ""}
  </div>
  <hr class="divider">
  <table style="margin-bottom:8px"><tbody>
    <tr><td style="color:#555">Bill No</td><td style="text-align:right;font-weight:700">${sale.id}</td></tr>
    <tr><td style="color:#555">Date</td><td style="text-align:right">${date}</td></tr>
    <tr><td style="color:#555">Time</td><td style="text-align:right">${time}</td></tr>
    ${sale.customer !== "Walk-in" ? `<tr><td style="color:#555">Customer</td><td style="text-align:right">${sale.customer}</td></tr>` : ""}
    ${sale.customerPhone ? `<tr><td style="color:#555">Phone</td><td style="text-align:right">${sale.customerPhone}</td></tr>` : ""}
    ${sale.customerEmail ? `<tr><td style="color:#555">Email</td><td style="text-align:right">${sale.customerEmail}</td></tr>` : ""}
  </tbody></table>
  <hr class="divider">
  <table><thead><tr>
    <th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amt</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <hr class="divider">
  <table><tbody>
    ${taxRows}
    <tr><td style="font-size:15px;font-weight:700">Total</td><td style="text-align:right;font-size:15px;font-weight:700">₹${sale.total}</td></tr>
    <tr><td style="color:#555">Payment</td><td style="text-align:right">${sale.payment}</td></tr>
    <tr><td style="color:#555">Status</td><td style="text-align:right">${sale.status}</td></tr>
  </tbody></table>
  ${termsHtml}
  <hr class="divider">
  <div class="center" style="font-size:12px;color:#555;margin-top:8px">Thank you! Visit again 🙏</div>
  </body></html>`;

  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function BillDialog({
  sale, onClose, taxCfg, bizName, invoiceTerms,
}: {
  sale: Sale;
  onClose: () => void;
  taxCfg: ReturnType<typeof loadTaxSettings>;
  bizName: string;
  invoiceTerms: string;
}) {
  const { date, time } = fmtDT(sale.createdAt);
  const subtotal = sale.items.reduce((s, i) => s + i.lineTotal, 0);
  const gst = computeGST(subtotal, taxCfg);
  const biz = loadBusinessSettings();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Bill Preview — {sale.id}
          </DialogTitle>
        </DialogHeader>
        {/* Bill preview */}
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5 font-mono text-sm space-y-3">
          <div className="text-center space-y-0.5">
            {biz.logoUrl && (
              <img src={biz.logoUrl} alt={bizName} className="h-10 max-w-[120px] object-contain mx-auto mb-1" />
            )}
            <p className="text-base font-bold tracking-widest">{bizName}</p>
            <p className="text-xs text-muted-foreground">Counter Bill / Tax Invoice</p>
          </div>
          <div className="border-t border-dashed border-border" />
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Bill No</span><span className="font-bold">{sale.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{time}</span></div>
            {sale.customer !== "Walk-in" && <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{sale.customer}</span></div>}
            {sale.customerPhone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{sale.customerPhone}</span></div>}
            {sale.customerEmail && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate max-w-[150px]">{sale.customerEmail}</span></div>}
          </div>
          <div className="border-t border-dashed border-border" />
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left pb-1">Item</th>
                <th className="text-center pb-1">Qty</th>
                <th className="text-right pb-1">Rate</th>
                <th className="text-right pb-1">Amt</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((i, idx) => (
                <tr key={idx} className="border-t border-border/40">
                  <td className="py-0.5 pr-2 truncate max-w-[110px]">{i.productName}</td>
                  <td className="py-0.5 text-center">{i.qty}</td>
                  <td className="py-0.5 text-right text-muted-foreground">₹{i.unitPrice}</td>
                  <td className="py-0.5 text-right font-semibold">₹{i.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed border-border" />
          <div className="space-y-1 text-xs">
            {gst.gstAmount > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{gst.taxable}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{gst.rateLabel}</span><span>₹{gst.gstAmount}</span></div>
              </>
            )}
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{fmtINR(sale.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{sale.payment}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{sale.status}</span></div>
          </div>
          {invoiceTerms && (
            <>
              <div className="border-t border-dashed border-border" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">{invoiceTerms}</p>
            </>
          )}
          <div className="border-t border-dashed border-border" />
          <p className="text-center text-xs text-muted-foreground">Thank you! Visit again 🙏</p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {sale.customerEmail && (
            <Button variant="outline" className="gap-1.5" onClick={() => sendBillEmail(sale, bizName, invoiceTerms)}>
              <Mail className="h-4 w-4" /> Send Email
            </Button>
          )}
          <Button className="gap-1.5" onClick={() => printBill(sale, bizName, invoiceTerms)}>
            <Printer className="h-4 w-4" /> Print Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SalesTrendTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
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
          <span className="text-xs font-bold text-primary">
            {((payload[1].value / payload[0].value) * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
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
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
