import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Calculator,
  Check,
  Crown,
  FileText,
  Package,
  Percent,
  Shield,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ShopOS" },
      { name: "description", content: "Business profile, taxes, invoices and preferences." },
    ],
  }),
  component: SettingsPage,
});

type SectionKey =
  | "business"
  | "financial"
  | "taxes"
  | "invoice"
  | "inventory"
  | "notifications"
  | "security"
  | "subscription";

const NAV_GROUPS: { label: string; items: { key: SectionKey; icon: React.ComponentType<{ className?: string }>; label: string }[] }[] = [
  {
    label: "General",
    items: [
      { key: "business",      icon: Building2,  label: "Business"      },
      { key: "financial",     icon: Calculator, label: "Financial"     },
      { key: "taxes",         icon: Percent,    label: "Taxes"         },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "invoice",       icon: FileText,   label: "Invoice"       },
      { key: "inventory",     icon: Package,    label: "Inventory"     },
    ],
  },
  {
    label: "Preferences",
    items: [
      { key: "notifications", icon: Bell,       label: "Notifications" },
      { key: "security",      icon: Shield,     label: "Security"      },
      { key: "subscription",  icon: Crown,      label: "Subscription"  },
    ],
  },
];

function SettingsPage() {
  const [section, setSection] = useState<SectionKey>("business");

  const [business, setBusiness] = useState({
    name: "My Business",
    type: "Retail",
    gstin: "27ABCDE1234F1Z5",
    phone: "+91 20 2712 4500",
    email: "accounts@vaidyaayur.in",
    address: "Plot 14, MIDC, Pune 411019",
    country: "India",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "English",
  });

  const [financial, setFinancial] = useState({
    fyStart: "April",
    currency: "INR",
    decimal: "2",
  });

  const [taxes, setTaxes] = useState({
    gstEnabled: true,
    gstin: "27ABCDE1234F1Z5",
    defaultRate: "18",
    taxMode: "Exclusive",
    returnFreq: "Monthly",
    hsnRequired: true,
  });

  const [invoice, setInvoice] = useState({
    prefix: "INV-",
    nextNumber: "2042",
    format: "A4",
    terms: "Goods once sold will not be returned. Payment due within 30 days.",
    qrCode: true,
    signature: false,
  });

  const [inventory, setInventory] = useState({
    lowStockThreshold: "20",
    allowNegative: false,
    barcodeAuto: true,
    expiryTracking: true,
    batchTracking: true,
  });

  const [notifs, setNotifs] = useState({
    email: true,
    sms: false,
    whatsapp: false,
    lowStock: true,
    batchExpiry: true,
    dailySummary: true,
    weeklyReport: true,
    gstAutoReport: false,
  });

  function save() {
    toast.success("Settings saved", { description: "Your changes have been applied." });
  }

  return (
    <div className="flex min-h-full">
      {/* ── Sidebar nav ── */}
      <nav className="hidden md:flex w-52 shrink-0 flex-col gap-5 border-r border-border p-3 pt-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSection(key)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                    section === key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Mobile section picker ── */}
      <div className="md:hidden border-b border-border px-4 py-3 bg-background sticky top-0 z-10">
        <Select value={section} onValueChange={(v) => setSection(v as SectionKey)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NAV_GROUPS.flatMap((g) => g.items).map(({ key, label }) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-2xl space-y-8">
          {section === "business"      && <BusinessSection      s={business}   setS={setBusiness}   onSave={save} />}
          {section === "financial"     && <FinancialSection     s={financial}  setS={setFinancial}  onSave={save} />}
          {section === "taxes"         && <TaxesSection         s={taxes}      setS={setTaxes}      onSave={save} />}
          {section === "invoice"       && <InvoiceSection       s={invoice}    setS={setInvoice}    onSave={save} />}
          {section === "inventory"     && <InventorySection     s={inventory}  setS={setInventory}  onSave={save} />}
          {section === "notifications" && <NotificationsSection s={notifs}     setS={setNotifs}     onSave={save} />}
          {section === "security"      && <SecuritySection />}
          {section === "subscription"  && <SubscriptionSection />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Business
// ─────────────────────────────────────────────
function BusinessSection({
  s, setS, onSave,
}: {
  s: { name: string; type: string; gstin: string; phone: string; email: string; address: string; country: string; currency: string; timezone: string; language: string };
  setS: (v: typeof s) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Business" description="Your shop's legal identity, contact details, and regional settings." />

      {/* Logo */}
      <div className="space-y-2">
        <Label>Business Logo</Label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Upload Logo
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG or JPG · Max 2 MB · Appears on invoices</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Identity */}
      <div className="grid grid-cols-2 gap-4">
        <F label="Business Name" value={s.name} onChange={(v) => setS({ ...s, name: v })} />
        <div className="space-y-1.5">
          <Label>Business Type</Label>
          <Select value={s.type} onValueChange={(v) => setS({ ...s, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Wholesale">Wholesale</SelectItem>
              <SelectItem value="Both">Retail + Wholesale</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <F label="GSTIN / VAT Number" value={s.gstin} onChange={(v) => setS({ ...s, gstin: v })} placeholder="27ABCDE1234F1Z5" />
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={s.country} onValueChange={(v) => setS({ ...s, country: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="UAE">UAE</SelectItem>
              <SelectItem value="Oman">Oman</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <F label="Phone" value={s.phone} onChange={(v) => setS({ ...s, phone: v })} />
        <F label="Email" type="email" value={s.email} onChange={(v) => setS({ ...s, email: v })} />
      </div>
      <F label="Address" value={s.address} onChange={(v) => setS({ ...s, address: v })} />

      <Separator />

      {/* Regional */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={s.currency} onValueChange={(v) => setS({ ...s, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">₹ INR — Indian Rupee</SelectItem>
              <SelectItem value="AED">د.إ AED — UAE Dirham</SelectItem>
              <SelectItem value="OMR">﷼ OMR — Omani Rial</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Select value={s.timezone} onValueChange={(v) => setS({ ...s, timezone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Kolkata">IST — Asia/Kolkata</SelectItem>
              <SelectItem value="Asia/Dubai">GST — Asia/Dubai</SelectItem>
              <SelectItem value="Asia/Muscat">+04 — Asia/Muscat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select value={s.language} onValueChange={(v) => setS({ ...s, language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Financial
// ─────────────────────────────────────────────
const FY_HISTORY = [
  { year: "2023–24", status: "Closed" as const },
  { year: "2024–25", status: "Closed" as const },
  { year: "2025–26", status: "Active" as const },
  { year: "2026–27", status: "Upcoming" as const },
];
const FY_STATUS_STYLE: Record<"Closed" | "Active" | "Upcoming", string> = {
  Closed:   "text-muted-foreground bg-muted border-transparent",
  Active:   "text-success bg-success/15 border-transparent",
  Upcoming: "text-primary bg-primary/10 border-transparent",
};

function FinancialSection({
  s, setS, onSave,
}: {
  s: { fyStart: string; currency: string; decimal: string };
  setS: (v: typeof s) => void;
  onSave: () => void;
}) {
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="space-y-6">
      <SectionHeader title="Financial" description="Financial year, base currency, and fiscal calendar." />

      {/* Active FY card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Active Financial Year</p>
            <p className="text-2xl font-bold">2025 – 2026</p>
            <p className="text-sm text-muted-foreground">1 April 2025 → 31 March 2026</p>
          </div>
          <Badge variant="outline" className="text-success bg-success/15 border-transparent">Active</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>FY Starts In</Label>
          <Select value={s.fyStart} onValueChange={(v) => setS({ ...s, fyStart: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Base Currency</Label>
          <Select value={s.currency} onValueChange={(v) => setS({ ...s, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">₹ INR</SelectItem>
              <SelectItem value="AED">د.إ AED</SelectItem>
              <SelectItem value="OMR">﷼ OMR</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Decimal Places</Label>
          <Select value={s.decimal} onValueChange={(v) => setS({ ...s, decimal: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 — ₹500</SelectItem>
              <SelectItem value="2">2 — ₹500.00</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* FY history */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Fiscal Year History</h3>
        <div className="space-y-2">
          {FY_HISTORY.map((fy) => (
            <div key={fy.year} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
              <span className="text-sm font-medium">{fy.year}</span>
              <Badge variant="outline" className={FY_STATUS_STYLE[fy.status]}>{fy.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Taxes
// ─────────────────────────────────────────────
const GST_RATES = ["0", "5", "12", "18", "28"];

function TaxesSection({
  s, setS, onSave,
}: {
  s: { gstEnabled: boolean; gstin: string; defaultRate: string; taxMode: string; returnFreq: string; hsnRequired: boolean };
  setS: (v: typeof s) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Taxes" description="Configure GST for India or VAT for Gulf businesses. Switch country in Business settings." />

      {/* GST toggle card */}
      <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">GST — Goods & Services Tax</p>
            <p className="text-xs text-muted-foreground">India · Multiple slab rates</p>
          </div>
        </div>
        <Switch checked={s.gstEnabled} onCheckedChange={(v) => setS({ ...s, gstEnabled: v })} />
      </div>

      {s.gstEnabled && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <F label="GSTIN" value={s.gstin} onChange={(v) => setS({ ...s, gstin: v })} placeholder="27ABCDE1234F1Z5" />
            <div className="space-y-1.5">
              <Label>GST Return Frequency</Label>
              <Select value={s.returnFreq} onValueChange={(v) => setS({ ...s, returnFreq: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly (GSTR-1)</SelectItem>
                  <SelectItem value="Quarterly">Quarterly (QRMP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GST Rate selector */}
          <div className="space-y-2">
            <Label>Default GST Rate</Label>
            <div className="flex gap-2">
              {GST_RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setS({ ...s, defaultRate: r })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-bold transition-colors ${
                    s.defaultRate === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Tax mode */}
          <div className="space-y-2">
            <Label>Tax Mode</Label>
            <div className="flex gap-2">
              {["Inclusive", "Exclusive"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setS({ ...s, taxMode: m })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    s.taxMode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {s.taxMode === "Inclusive"
                ? "Tax is already included in the listed price."
                : "Tax is added on top of the listed price."}
            </p>
          </div>

          <ToggleRow
            label="HSN / SAC Code Required"
            description="Mandatory HSN/SAC on every invoice line item (required for turnover > ₹5 Cr)"
            checked={s.hsnRequired}
            onChange={() => setS({ ...s, hsnRequired: !s.hsnRequired })}
          />
        </div>
      )}

      <SaveBar onSave={onSave} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Invoice
// ─────────────────────────────────────────────
const PRINT_FORMATS = ["Thermal 58mm", "Thermal 80mm", "A5", "A4"];

function InvoiceSection({
  s, setS, onSave,
}: {
  s: { prefix: string; nextNumber: string; format: string; terms: string; qrCode: boolean; signature: boolean };
  setS: (v: typeof s) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Invoice & Billing" description="Numbering, print format, and what appears on customer bills." />

      <div className="grid grid-cols-2 gap-4">
        <F label="Invoice Prefix" value={s.prefix} placeholder="INV-" onChange={(v) => setS({ ...s, prefix: v })} />
        <F label="Next Invoice Number" type="number" value={s.nextNumber} onChange={(v) => setS({ ...s, nextNumber: v })} />
      </div>

      {/* Print format */}
      <div className="space-y-2">
        <Label>Print Format</Label>
        <div className="flex gap-2">
          {PRINT_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setS({ ...s, format: f })}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                s.format === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-1.5">
        <Label>Terms & Conditions</Label>
        <Textarea
          rows={3}
          className="resize-none"
          placeholder="Goods once sold will not be returned..."
          value={s.terms}
          onChange={(e) => setS({ ...s, terms: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Printed at the bottom of every invoice.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ToggleRow
          label="QR Code on Invoice"
          description="UPI payment QR code printed on bill"
          checked={s.qrCode}
          onChange={() => setS({ ...s, qrCode: !s.qrCode })}
        />
        <ToggleRow
          label="Signature Line"
          description="Authorised signatory line at the bottom"
          checked={s.signature}
          onChange={() => setS({ ...s, signature: !s.signature })}
        />
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Inventory
// ─────────────────────────────────────────────
function InventorySection({
  s, setS, onSave,
}: {
  s: { lowStockThreshold: string; allowNegative: boolean; barcodeAuto: boolean; expiryTracking: boolean; batchTracking: boolean };
  setS: (v: typeof s) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Inventory" description="Stock alert thresholds, tracking options, and barcode settings." />

      <div className="space-y-1.5">
        <Label>Low Stock Alert Threshold</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            className="w-32"
            value={s.lowStockThreshold}
            onChange={(e) => setS({ ...s, lowStockThreshold: e.target.value })}
          />
          <span className="text-sm text-muted-foreground">units</span>
        </div>
        <p className="text-xs text-muted-foreground">Alert when any SKU stock falls at or below this number.</p>
      </div>

      <div className="space-y-2">
        <ToggleRow
          label="Allow Negative Stock"
          description="Allow sales even when stock is zero or goes negative"
          checked={s.allowNegative}
          onChange={() => setS({ ...s, allowNegative: !s.allowNegative })}
        />
        <ToggleRow
          label="Auto-generate Barcode"
          description="Automatically assign EAN-13 barcodes to new products"
          checked={s.barcodeAuto}
          onChange={() => setS({ ...s, barcodeAuto: !s.barcodeAuto })}
        />
        <ToggleRow
          label="Expiry Date Tracking"
          description="Track and alert for products nearing expiry date"
          checked={s.expiryTracking}
          onChange={() => setS({ ...s, expiryTracking: !s.expiryTracking })}
        />
        <ToggleRow
          label="Batch Tracking"
          description="Track individual manufacturing batches per product"
          checked={s.batchTracking}
          onChange={() => setS({ ...s, batchTracking: !s.batchTracking })}
        />
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Notifications
// ─────────────────────────────────────────────
function NotificationsSection({
  s, setS, onSave,
}: {
  s: { email: boolean; sms: boolean; whatsapp: boolean; lowStock: boolean; batchExpiry: boolean; dailySummary: boolean; weeklyReport: boolean; gstAutoReport: boolean };
  setS: (v: typeof s) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" description="Choose how and when you receive alerts and reports." />

      <div>
        <h3 className="text-sm font-semibold mb-2.5">Channels</h3>
        <div className="space-y-2">
          <ToggleRow label="Email" description="Receive alerts and reports by email" checked={s.email} onChange={() => setS({ ...s, email: !s.email })} />
          <ToggleRow label="SMS" description="Critical alerts via SMS (carrier charges apply)" checked={s.sms} onChange={() => setS({ ...s, sms: !s.sms })} />
          <ToggleRow label="WhatsApp" description="Receive alerts on WhatsApp Business" checked={s.whatsapp} onChange={() => setS({ ...s, whatsapp: !s.whatsapp })} />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-2.5">Alert Types</h3>
        <div className="space-y-2">
          <ToggleRow label="Low Stock Alert" description="When a product falls below the reorder threshold" checked={s.lowStock} onChange={() => setS({ ...s, lowStock: !s.lowStock })} />
          <ToggleRow label="Batch Expiry Reminder" description="30-day advance notice for batches nearing expiry" checked={s.batchExpiry} onChange={() => setS({ ...s, batchExpiry: !s.batchExpiry })} />
          <ToggleRow label="Daily Sales Summary" description="End-of-day revenue, invoices, and profit snapshot" checked={s.dailySummary} onChange={() => setS({ ...s, dailySummary: !s.dailySummary })} />
          <ToggleRow label="Weekly Report" description="Revenue and expense summary every Monday morning" checked={s.weeklyReport} onChange={() => setS({ ...s, weeklyReport: !s.weeklyReport })} />
          <ToggleRow label="GST Auto-report" description="Auto-prepare GSTR-1 on the 5th of each month" checked={s.gstAutoReport} onChange={() => setS({ ...s, gstAutoReport: !s.gstAutoReport })} />
        </div>
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Security (stub)
// ─────────────────────────────────────────────
function SecuritySection() {
  const ITEMS = [
    { label: "Change Password", desc: "Update your account password" },
    { label: "Two-Factor Authentication", desc: "Add an extra layer of security via OTP" },
    { label: "Active Sessions", desc: "View and revoke logged-in devices" },
    { label: "Login History", desc: "See recent sign-in activity" },
    { label: "Data Backup", desc: "Download a full backup of your business data" },
    { label: "Delete Account", desc: "Permanently remove your account and data" },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader title="Security" description="Password, two-factor authentication, session management, and account actions." />
      <div className="space-y-2">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <Badge variant="outline" className="text-xs text-muted-foreground">Coming soon</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section: Subscription (stub)
// ─────────────────────────────────────────────
function SubscriptionSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Subscription" description="Your current plan, usage limits, and upgrade options." />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Growth Plan</span>
              </div>
              <p className="text-2xl font-bold">Free Trial</p>
              <p className="text-sm text-muted-foreground mt-0.5">Expires 26 July 2026</p>
            </div>
            <Badge variant="outline" className="text-success bg-success/15 border-transparent">Active</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["1", "Shop"], ["5", "Users"], ["∞", "Invoices"]].map(([val, lbl]) => (
              <div key={lbl} className="rounded-lg bg-background/60 border border-border/50 py-3">
                <p className="text-xl font-bold">{val}</p>
                <p className="text-xs text-muted-foreground">{lbl}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">Pro Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">3 Shops · 25 Users · Priority Support · Advanced Reports</p>
          </div>
          <Badge variant="outline">Popular</Badge>
        </div>
        <Button size="sm" className="gap-1.5 w-full">
          <Crown className="h-3.5 w-3.5" /> View All Plans & Pricing
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h1 className="font-display text-xl font-bold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">Changes apply immediately after saving.</p>
      <Button onClick={onSave} className="gap-1.5">
        <Check className="h-3.5 w-3.5" /> Save Changes
      </Button>
    </div>
  );
}

function F({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-3 gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
