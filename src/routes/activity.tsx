import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle, ArrowUpCircle, IndianRupee, LogIn, LogOut, Package,
  PencilRuler, ShieldAlert, ShoppingCart, Tags, Trash2, UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchActivity, fetchActivityActions, type ActivityEntry } from "@/lib/activity.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity Log · ShopOS" }] }),
  // The audit trail answers "who changed this price" and "who deleted that
  // bill", so it must not be readable by the people it records.
  beforeLoad: ({ context }) => {
    if (context.user && context.user.role !== "admin") throw redirect({ to: "/" });
  },
  loader: async () => {
    try {
      const [entries, actions] = await Promise.all([fetchActivity({ data: {} }), fetchActivityActions()]);
      return { entries, actions, loadError: null as string | null };
    } catch (err) {
      return {
        entries: [] as ActivityEntry[],
        actions: [] as string[],
        loadError: err instanceof Error ? err.message : "Could not load the activity log.",
      };
    }
  },
  component: ActivityPage,
});

// How each recorded action is presented.
const ACTION_META: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  "auth.login":         { label: "Signed in",        icon: <LogIn className="h-3.5 w-3.5" />,        tone: "text-muted-foreground" },
  "auth.logout":        { label: "Signed out",       icon: <LogOut className="h-3.5 w-3.5" />,       tone: "text-muted-foreground" },
  "auth.login_failed":  { label: "Failed sign-in",   icon: <ShieldAlert className="h-3.5 w-3.5" />,  tone: "text-warning" },
  "auth.admin_created": { label: "Owner created",    icon: <UserPlus className="h-3.5 w-3.5" />,     tone: "text-primary" },
  "sale.create":        { label: "Sale recorded",    icon: <ShoppingCart className="h-3.5 w-3.5" />, tone: "text-success" },
  "sale.delete":        { label: "Sale deleted",     icon: <Trash2 className="h-3.5 w-3.5" />,       tone: "text-destructive" },
  "stock.in":           { label: "Stock received",   icon: <ArrowUpCircle className="h-3.5 w-3.5" />,tone: "text-success" },
  "product.create":     { label: "Product added",    icon: <Package className="h-3.5 w-3.5" />,      tone: "text-primary" },
  "product.update":     { label: "Product edited",   icon: <PencilRuler className="h-3.5 w-3.5" />,  tone: "text-muted-foreground" },
  "product.price_change": { label: "Price changed",  icon: <IndianRupee className="h-3.5 w-3.5" />,  tone: "text-warning" },
  "product.delete":     { label: "Product deleted",  icon: <Trash2 className="h-3.5 w-3.5" />,       tone: "text-destructive" },
  "master.add":         { label: "Option added",     icon: <Tags className="h-3.5 w-3.5" />,         tone: "text-muted-foreground" },
  "master.rename":      { label: "Option renamed",   icon: <Tags className="h-3.5 w-3.5" />,         tone: "text-muted-foreground" },
  "master.delete":      { label: "Option deleted",   icon: <Tags className="h-3.5 w-3.5" />,         tone: "text-destructive" },
};

function meta(action: string) {
  return ACTION_META[action] ?? { label: action, icon: <Package className="h-3.5 w-3.5" />, tone: "text-muted-foreground" };
}

/** Turns the stored JSON into a sentence a shop owner can read at a glance. */
function summarise(e: ActivityEntry): string {
  const d = e.detail as Record<string, string | number | boolean | null | Array<string | number>>;
  const num = (v: unknown) => `₹${Number(v).toLocaleString("en-IN")}`;

  switch (e.action) {
    case "sale.create":
      return `${d.saleNumber ?? ""} · ${num(d.total)} · ${d.items ?? 0} item${Number(d.items) === 1 ? "" : "s"} · ${d.payment ?? ""}`;
    case "sale.delete":
      return `${d.saleNumber ?? ""} · ${num(d.total)}${d.restocked ? " · stock returned" : ""}`;
    case "stock.in":
      return `${d.name ?? ""} · +${d.added} (${d.from} → ${d.to})${d.reference ? ` · ${d.reference}` : ""}`;
    case "product.price_change": {
      const mrp = d.mrp as unknown as [number, number] | undefined;
      const sell = d.sellingPrice as unknown as [number, number] | undefined;
      const parts: string[] = [];
      if (mrp && mrp[0] !== mrp[1]) parts.push(`MRP ${num(mrp[0])} → ${num(mrp[1])}`);
      if (sell && sell[0] !== sell[1]) parts.push(`Price ${num(sell[0])} → ${num(sell[1])}`);
      return `${d.name ?? ""} · ${parts.join(" · ")}`;
    }
    case "product.create":
    case "product.update":
    case "product.delete":
      return [d.name, d.sku].filter(Boolean).join(" · ");
    case "master.add":
    case "master.rename":
    case "master.delete":
      return `${String(d.kind ?? "").replace(/_/g, " ")} · ${d.value ?? ""}`;
    case "auth.login":
    case "auth.login_failed":
      return d.method === "pin" ? "PIN" : d.method === "password" ? "Password" : "";
    default:
      return "";
  }
}

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  const rel = mins < 1 ? "just now"
    : mins < 60 ? `${mins} min ago`
    : mins < 1440 ? `${Math.floor(mins / 60)} hr ago`
    : `${Math.floor(mins / 1440)} d ago`;
  return {
    rel,
    exact: d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

function ActivityPage() {
  const { entries, actions, loadError } = Route.useLoaderData() as {
    entries: ActivityEntry[]; actions: string[]; loadError: string | null;
  };
  const [filter, setFilter] = useState("all");

  const shown = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.action === filter)),
    [entries, filter],
  );

  // Surface the things an owner actually watches for.
  const alerts = entries.filter((e) => e.action === "sale.delete" || e.action === "auth.login_failed").length;
  const priceChanges = entries.filter((e) => e.action === "product.price_change").length;

  return (
    <PageShell
      title="Activity Log"
      description="Who did what — sign-ins, sales, stock, price changes and deletions."
      actions={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-52 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>{meta(a).label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {loadError && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="text-sm">
              <p className="font-semibold">Couldn’t load the activity log</p>
              <p className="text-muted-foreground">{loadError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Recorded events" value={String(entries.length)} />
        <Stat label="Price changes" value={String(priceChanges)} />
        <Stat label="Deletions & failed sign-ins" value={String(alerts)} tone={alerts > 0 ? "warning" : undefined} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <h2 className="font-display text-lg font-semibold">
              {filter === "all" ? "Everything" : meta(filter).label}
            </h2>
            <p className="ml-auto text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{shown.length}</span> entries
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Action</TableHead>
                  <TableHead className="w-36">Who</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-36 text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      Nothing recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {shown.map((e) => {
                  const m = meta(e.action);
                  const t = when(e.createdAt);
                  const summary = summarise(e);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", m.tone)}>
                          {m.icon}{m.label}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{e.staffName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{summary || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground" title={t.exact}>
                        {t.rel}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("mt-2 font-display text-2xl font-bold", tone === "warning" && "text-warning")}>{value}</p>
      </CardContent>
    </Card>
  );
}
