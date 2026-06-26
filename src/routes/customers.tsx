import { createFileRoute } from "@tanstack/react-router";
import { Mail, Pencil, Phone, Plus, Search, Trash2, TrendingUp, ChevronRight, ShoppingBag } from "lucide-react";
import { useState } from "react";
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
import { customers as initialCustomers, customerOrders as initialOrders, customerPayments as initialPayments, fmtINR, type CustomerOrder, type CustomerPayment } from "@/lib/mock-data";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers · ShopOS" },
      { name: "description", content: "Distributors, dealers and direct customers." },
    ],
  }),
  component: CustomersPage,
});

type Customer = { id: string; name: string; city: string; phone: string; email: string; outstanding: number; lastOrder: string };

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers as Customer[]);
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [payments, setPayments] = useState<CustomerPayment[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [outstandingFilter, setOutstandingFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", phone: "", email: "" });
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", city: "" });
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailTab, setDetailTab] = useState<"purchases" | "payments">("purchases");
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [addOrderForm, setAddOrderForm] = useState({ date: "", amount: "", items: "", status: "Pending" as "Paid" | "Pending" });
  const [editOrder, setEditOrder] = useState<CustomerOrder | null>(null);
  const [editOrderForm, setEditOrderForm] = useState({ date: "", amount: "", items: "", status: "Pending" as "Paid" | "Pending" | "Partial" });
  const [payOrder, setPayOrder] = useState<CustomerOrder | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [addPaymentForm, setAddPaymentForm] = useState({ date: "", amount: "", note: "" });

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    const matchOut = outstandingFilter === "all" || (outstandingFilter === "outstanding" && c.outstanding > 0) || (outstandingFilter === "settled" && c.outstanding === 0);
    return matchSearch && matchOut;
  });

  const totalOutstanding = customers.reduce((a, c) => a + c.outstanding, 0);

  function openEdit(c: Customer) {
    setEditItem(c);
    setEditForm({ name: c.name, city: c.city });
  }
  function handleSaveEdit() {
    if (!editItem || !editForm.name || !editForm.city) return;
    setCustomers(customers.map((c) => c.id === editItem.id ? { ...c, name: editForm.name, city: editForm.city } : c));
    setEditItem(null);
    toast.success("Customer updated");
  }
  function handleDelete() {
    if (!deleteId) return;
    setCustomers(customers.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Customer deleted");
  }
  function handleSubmit() {
    if (!form.name || !form.city) return;
    const next: Customer = {
      id: "C-" + String(customers.length + 1).padStart(3, "0"),
      name: form.name,
      city: form.city,
      phone: form.phone,
      email: form.email,
      outstanding: 0,
      lastOrder: "—",
    };
    setCustomers([...customers, next]);
    setForm({ name: "", city: "", phone: "", email: "" });
    setOpen(false);
    toast.success("Customer added", { description: `${next.id} · ${next.name}, ${next.city}` });
  }

  function handleAddOrder() {
    if (!detailCustomer || !addOrderForm.date || !addOrderForm.amount) return;
    const amt = Number(addOrderForm.amount);
    const newOrder: CustomerOrder = {
      id: "INV-" + (3000 + orders.length),
      customerId: detailCustomer.id,
      date: addOrderForm.date,
      amount: amt,
      paidAmount: addOrderForm.status === "Paid" ? amt : 0,
      items: addOrderForm.items || "—",
      status: addOrderForm.status,
    };
    setOrders([newOrder, ...orders]);
    if (addOrderForm.status === "Pending") {
      setCustomers(customers.map((c) => c.id === detailCustomer.id ? { ...c, outstanding: c.outstanding + amt, lastOrder: addOrderForm.date } : c));
      setDetailCustomer((prev) => prev ? { ...prev, outstanding: prev.outstanding + amt, lastOrder: addOrderForm.date } : prev);
    }
    setAddOrderForm({ date: "", amount: "", items: "", status: "Pending" });
    setAddOrderOpen(false);
    toast.success("Purchase added", { description: `${newOrder.id} · ${fmtINR(newOrder.amount)}` });
  }

  function handleRecordPayment() {
    if (!payOrder || !payAmount || !detailCustomer) return;
    const paying = Math.min(Number(payAmount), payOrder.amount - payOrder.paidAmount);
    if (paying <= 0) return;
    const newPaid = payOrder.paidAmount + paying;
    const remaining = payOrder.amount - newPaid;
    const newStatus: CustomerOrder["status"] = remaining <= 0 ? "Paid" : "Partial";
    const today = new Date().toISOString().slice(0, 10);
    const newPayment: CustomerPayment = {
      id: "PAY-" + String(payments.length + 1).padStart(3, "0"),
      customerId: detailCustomer.id,
      date: today,
      amount: paying,
      note: `Payment for ${payOrder.id}${remaining > 0 ? ` · ${fmtINR(remaining)} remaining` : " · Fully paid"}`,
    };
    setOrders(orders.map((o) => o.id === payOrder.id ? { ...o, paidAmount: newPaid, status: newStatus } : o));
    setPayments([newPayment, ...payments]);
    setCustomers(customers.map((c) => c.id === detailCustomer.id ? { ...c, outstanding: Math.max(0, c.outstanding - paying) } : c));
    setDetailCustomer((prev) => prev ? { ...prev, outstanding: Math.max(0, prev.outstanding - paying) } : prev);
    setPayOrder(null);
    setPayAmount("");
    toast.success("Payment recorded", { description: `${fmtINR(paying)} received · ${remaining > 0 ? fmtINR(remaining) + " remaining" : "Fully paid"}` });
  }

  function handleAddPayment() {
    if (!detailCustomer || !addPaymentForm.date || !addPaymentForm.amount) return;
    const amt = Number(addPaymentForm.amount);
    if (amt <= 0) return;
    const newPayment: CustomerPayment = {
      id: "PAY-" + String(payments.length + 1).padStart(3, "0"),
      customerId: detailCustomer.id,
      date: addPaymentForm.date,
      amount: amt,
      note: addPaymentForm.note || "—",
    };
    setPayments([newPayment, ...payments]);
    setCustomers(customers.map((c) => c.id === detailCustomer.id ? { ...c, outstanding: Math.max(0, c.outstanding - amt) } : c));
    setDetailCustomer((prev) => prev ? { ...prev, outstanding: Math.max(0, prev.outstanding - amt) } : prev);
    setAddPaymentForm({ date: "", amount: "", note: "" });
    setAddPaymentOpen(false);
    toast.success("Payment recorded", { description: `${fmtINR(amt)} received on ${addPaymentForm.date}` });
  }

  function openEditOrder(o: CustomerOrder) {
    setEditOrder(o);
    setEditOrderForm({ date: o.date, amount: String(o.amount), items: o.items, status: o.status === "Partial" ? "Pending" : o.status });
  }

  function handleSaveEditOrder() {
    if (!editOrder || !editOrderForm.date || !editOrderForm.amount) return;
    const newAmount = Number(editOrderForm.amount);
    const newStatus = editOrderForm.status as "Paid" | "Pending";
    const newPaidAmount = newStatus === "Paid" ? newAmount : editOrder.paidAmount;
    const oldRemaining = editOrder.amount - editOrder.paidAmount;
    const newRemaining = newAmount - newPaidAmount;
    const diff = newRemaining - oldRemaining;
    setOrders(orders.map((o) => o.id === editOrder.id ? { ...o, date: editOrderForm.date, amount: newAmount, paidAmount: newPaidAmount, items: editOrderForm.items, status: newStatus } : o));
    if (diff !== 0 && detailCustomer) {
      setCustomers(customers.map((c) => c.id === detailCustomer.id ? { ...c, outstanding: Math.max(0, c.outstanding + diff) } : c));
      setDetailCustomer((prev) => prev ? { ...prev, outstanding: Math.max(0, prev.outstanding + diff) } : prev);
    }
    setEditOrder(null);
    toast.success("Purchase updated");
  }

  function markOrderPaid(orderId: string, customerId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === "Paid") return;
    const remaining = order.amount - order.paidAmount;
    setOrders(orders.map((o) => o.id === orderId ? { ...o, paidAmount: o.amount, status: "Paid" } : o));
    setCustomers(customers.map((c) => c.id === customerId ? { ...c, outstanding: Math.max(0, c.outstanding - remaining) } : c));
    if (detailCustomer?.id === customerId) {
      setDetailCustomer((prev) => prev ? { ...prev, outstanding: Math.max(0, prev.outstanding - remaining) } : prev);
    }
    toast.success("Fully paid", { description: `${orderId} marked as Paid` });
  }

  // Stats
  const detailOrders = detailCustomer ? orders.filter((o) => o.customerId === detailCustomer.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const detailPayments = detailCustomer ? payments.filter((p) => p.customerId === detailCustomer.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const detailTotalSpent = detailOrders.reduce((s, o) => s + o.amount, 0);
  const detailTotalPaid = detailOrders.reduce((s, o) => s + o.paidAmount, 0);
  const detailPending = detailOrders.reduce((s, o) => s + (o.amount - o.paidAmount), 0);
  const detailTotalPaymentsReceived = detailPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <PageShell
      title="Customers"
      description="Distributors and dealers, with purchase history and outstanding balances."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New customer
        </Button>
      }
    >
      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat label="Total customers" value={String(customers.length)} />
        <Stat label="With outstanding" value={String(customers.filter((c) => c.outstanding > 0).length)} />
        <Stat label="Total outstanding" value={fmtINR(totalOutstanding)} accent />
        <Stat label="Orders this month" value={String(orders.length)} />
      </div>

      {/* Customer table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 h-14 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold mr-auto">All customers</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input className="pl-7 h-8 w-40 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={outstandingFilter} onValueChange={setOutstandingFilter}>
              <SelectTrigger className="h-8 w-32 text-sm shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="outstanding">Has outstanding</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => {
                const cOrders = orders.filter((o) => o.customerId === c.id);
                const totalSpent = cOrders.reduce((s, o) => s + o.amount, 0);
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetailCustomer(c)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {c.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {c.name}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                      </div>
                    </TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell className="text-right tabular-nums">{cOrders.length}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmtINR(totalSpent)}</TableCell>
                    <TableCell className="text-right">
                      {c.outstanding === 0 ? (
                        <Badge variant="outline" className="bg-success/15 text-success border-transparent">Settled</Badge>
                      ) : (
                        <span className="font-semibold tabular-nums text-warning">{fmtINR(c.outstanding)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.lastOrder}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!detailCustomer} onOpenChange={(o) => { if (!o) { setDetailCustomer(null); setDetailTab("purchases"); } }}>
        <DialogContent className="w-[95vw] max-w-none sm:max-w-4xl max-h-[90vh] overflow-y-auto !p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {detailCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {detailCustomer && (
            <div className="space-y-4 py-1 w-full min-w-0">
              {/* Contact info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{detailCustomer.city}</span>
                {detailCustomer.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{detailCustomer.phone}</span>
                )}
                {detailCustomer.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{detailCustomer.email}</span>
                )}
              </div>

              {/* Summary strip */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <div className="flex-1 min-w-0 bg-muted/30 px-3 py-2.5 border-r border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total billed</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{fmtINR(detailTotalSpent)}</p>
                  <p className="text-[11px] text-muted-foreground">{detailOrders.length} invoices</p>
                </div>
                <div className="flex-1 min-w-0 bg-success/10 px-3 py-2.5 border-r border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Received</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-success">{fmtINR(detailTotalPaymentsReceived)}</p>
                  <p className="text-[11px] text-muted-foreground">{detailPayments.length} payments</p>
                </div>
                <div className={`flex-1 min-w-0 px-3 py-2.5 ${detailPending > 0 ? "bg-warning/10" : "bg-muted/30"}`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Outstanding</p>
                  <p className={`mt-0.5 text-sm font-semibold tabular-nums ${detailPending > 0 ? "text-warning" : ""}`}>{fmtINR(detailCustomer.outstanding)}</p>
                  <p className="text-[11px] text-muted-foreground">{detailOrders.filter((o) => o.status !== "Paid").length} unpaid</p>
                </div>
              </div>

              {/* Tab toggle */}
              <div className="flex items-center rounded-full border border-border bg-muted/20 p-1 w-fit">
                <button
                  onClick={() => setDetailTab("purchases")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${detailTab === "purchases" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Purchases
                </button>
                <button
                  onClick={() => setDetailTab("payments")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${detailTab === "payments" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Payments
                </button>
              </div>

              {/* Purchases tab */}
              {detailTab === "purchases" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">All invoices for this customer</p>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs shrink-0" onClick={() => setAddOrderOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add purchase
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Invoice</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="w-28 whitespace-nowrap" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailOrders.map((o) => {
                          const remaining = o.amount - o.paidAmount;
                          return (
                            <TableRow key={o.id}>
                              <TableCell>
                                <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {o.id}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{o.date}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={o.items}>{o.items}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <p className="tabular-nums font-semibold">{fmtINR(o.amount)}</p>
                                {o.status !== "Paid" && o.paidAmount > 0 && (
                                  <p className="text-[11px] text-muted-foreground tabular-nums">{fmtINR(remaining)} left</p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    o.status === "Paid" ? "bg-success/15 text-success border-transparent" :
                                    o.status === "Partial" ? "bg-primary/10 text-primary border-primary/30" :
                                    "border-warning/40 text-warning"
                                  }
                                >
                                  {o.status === "Partial" ? `Partial · ${fmtINR(o.paidAmount)} paid` : o.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditOrder(o)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  {o.status !== "Paid" && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs whitespace-nowrap" onClick={() => { setPayOrder(o); setPayAmount(""); }}>
                                      Record payment
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {detailOrders.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No purchases yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Payments tab */}
              {detailTab === "payments" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Each row is a payment received from this customer</p>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs shrink-0" onClick={() => setAddPaymentOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add payment
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Payment ID</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount received</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailPayments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {p.id}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{p.date}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.note}</TableCell>
                            <TableCell className="text-right">
                              <span className="tabular-nums font-semibold text-success">{fmtINR(p.amount)}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {detailPayments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">No payments recorded yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {detailPayments.length > 0 && (
                    <div className="mt-2 flex justify-end">
                      <p className="text-xs text-muted-foreground">Total received: <span className="font-semibold text-foreground tabular-nums">{fmtINR(detailTotalPaymentsReceived)}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailCustomer(null); setDetailTab("purchases"); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Purchase Dialog */}
      <Dialog open={addOrderOpen} onOpenChange={(o) => !o && setAddOrderOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Add Purchase — {detailCustomer?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={addOrderForm.date} onChange={(e) => setAddOrderForm({ ...addOrderForm, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="e.g. 15000" value={addOrderForm.amount} onChange={(e) => setAddOrderForm({ ...addOrderForm, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Items purchased</Label>
              <Input placeholder="e.g. Sunflower Oil 1L ×30, Rice 5kg ×20" value={addOrderForm.items} onChange={(e) => setAddOrderForm({ ...addOrderForm, items: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select value={addOrderForm.status} onValueChange={(v) => setAddOrderForm({ ...addOrderForm, status: v as "Paid" | "Pending" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOrderOpen(false)}>Cancel</Button>
            <Button onClick={handleAddOrder} disabled={!addOrderForm.date || !addOrderForm.amount}>Add purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!payOrder} onOpenChange={(o) => !o && setPayOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment — {payOrder?.id}</DialogTitle>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice total</span>
                  <span className="font-medium tabular-nums">{fmtINR(payOrder.amount)}</span>
                </div>
                {payOrder.paidAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already paid</span>
                    <span className="font-medium tabular-nums text-success">{fmtINR(payOrder.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1 mt-1">
                  <span className="font-medium">Remaining</span>
                  <span className="font-semibold tabular-nums text-warning">{fmtINR(payOrder.amount - payOrder.paidAmount)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount received (₹)</Label>
                <Input
                  type="number"
                  placeholder={`Max ${fmtINR(payOrder.amount - payOrder.paidAmount)}`}
                  value={payAmount}
                  max={payOrder.amount - payOrder.paidAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  autoFocus
                />
                {payAmount && Number(payAmount) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Remaining after this payment:{" "}
                    <span className={Number(payAmount) >= payOrder.amount - payOrder.paidAmount ? "text-success font-medium" : "text-warning font-medium"}>
                      {Number(payAmount) >= payOrder.amount - payOrder.paidAmount
                        ? "Fully paid"
                        : fmtINR(payOrder.amount - payOrder.paidAmount - Number(payAmount))}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOrder(null)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={!payAmount || Number(payAmount) <= 0}>
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentOpen} onOpenChange={(o) => !o && setAddPaymentOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Add Payment — {detailCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {detailCustomer && (
            <div className="space-y-4 py-2">
              {detailCustomer.outstanding > 0 && (
                <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Outstanding balance: </span>
                  <span className="font-semibold text-warning tabular-nums">{fmtINR(detailCustomer.outstanding)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Payment date</Label>
                  <Input type="date" value={addPaymentForm.date} onChange={(e) => setAddPaymentForm({ ...addPaymentForm, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount received (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 10000"
                    value={addPaymentForm.amount}
                    onChange={(e) => setAddPaymentForm({ ...addPaymentForm, amount: e.target.value })}
                    autoFocus
                  />
                </div>
              </div>
              {addPaymentForm.amount && Number(addPaymentForm.amount) > 0 && detailCustomer.outstanding > 0 && (
                <p className="text-xs text-muted-foreground">
                  Outstanding after this payment:{" "}
                  <span className={Number(addPaymentForm.amount) >= detailCustomer.outstanding ? "text-success font-medium" : "text-warning font-medium"}>
                    {Number(addPaymentForm.amount) >= detailCustomer.outstanding
                      ? "Fully settled"
                      : fmtINR(detailCustomer.outstanding - Number(addPaymentForm.amount))}
                  </span>
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. Cash payment, UPI transfer, Cheque #1234"
                  value={addPaymentForm.note}
                  onChange={(e) => setAddPaymentForm({ ...addPaymentForm, note: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={!addPaymentForm.date || !addPaymentForm.amount || Number(addPaymentForm.amount) <= 0}>
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Dialog */}
      <Dialog open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Purchase — {editOrder?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={editOrderForm.date} onChange={(e) => setEditOrderForm({ ...editOrderForm, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input type="number" value={editOrderForm.amount} onChange={(e) => setEditOrderForm({ ...editOrderForm, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Items purchased</Label>
              <Input value={editOrderForm.items} onChange={(e) => setEditOrderForm({ ...editOrderForm, items: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select value={editOrderForm.status} onValueChange={(v) => setEditOrderForm({ ...editOrderForm, status: v as "Paid" | "Pending" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button onClick={handleSaveEditOrder} disabled={!editOrderForm.date || !editOrderForm.amount}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name || !editForm.city}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input placeholder="e.g. Metro General Store" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input placeholder="e.g. Bengaluru" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                <Input type="email" placeholder="contact@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.city}>Add customer</Button>
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
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 font-display text-2xl font-semibold ${accent ? "text-primary" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
