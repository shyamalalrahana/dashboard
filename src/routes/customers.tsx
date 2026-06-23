import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Plus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customers as initialCustomers, fmtINR } from "@/lib/mock-data";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers · Vaidya Ayur ERP" },
      { name: "description", content: "Distributors, dealers and direct customers." },
    ],
  }),
  component: CustomersPage,
});

type Customer = { id: string; name: string; city: string; outstanding: number; lastOrder: string };

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", phone: "", email: "" });

  const totalOutstanding = customers.reduce((a, c) => a + c.outstanding, 0);

  function handleSubmit() {
    if (!form.name || !form.city) return;
    const next: Customer = {
      id: "C-" + String(customers.length + 1).padStart(3, "0"),
      name: form.name,
      city: form.city,
      outstanding: 0,
      lastOrder: "—",
    };
    setCustomers([...customers, next]);
    setForm({ name: "", city: "", phone: "", email: "" });
    setOpen(false);
    toast.success("Customer added", { description: `${next.id} · ${next.name}, ${next.city}` });
  }

  return (
    <PageShell
      title="Customers"
      description="Distributors and dealers, with outstanding balances."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New customer
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total customers" value={String(customers.length)} />
        <Stat label="With outstanding" value={String(customers.filter((c) => c.outstanding > 0).length)} />
        <Stat label="Total outstanding" value={fmtINR(totalOutstanding)} accent />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All customers</h2>
            <span className="text-sm text-muted-foreground">{customers.length} records</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {c.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.city}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastOrder}</TableCell>
                  <TableCell className="text-right">
                    {c.outstanding === 0 ? (
                      <Badge variant="outline" className="bg-success/15 text-success border-transparent">
                        Settled
                      </Badge>
                    ) : (
                      <span className="font-semibold tabular-nums text-warning">
                        {fmtINR(c.outstanding)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input
                placeholder="e.g. Ayur Wellness Pvt Ltd"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                placeholder="e.g. Bengaluru"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.city}>
              Add customer
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
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 font-display text-2xl font-semibold ${accent ? "text-primary" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
