import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ShopOS" },
      { name: "description", content: "Business profile, tax and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "My Business",
    gst: "27ABCDE1234F1Z5",
    address: "Plot 14, MIDC, Pune 411019",
    phone: "+91 20 2712 4500",
    email: "accounts@vaidyaayur.in",
    fy: "2025-26",
    unit: "Unit A",
  });

  const [prefs, setPrefs] = useState({
    lowStock: true,
    dailySales: true,
    batchExpiry: true,
    gstAuto: false,
    weeklyReport: true,
    smsAlerts: false,
  });

  function handleSave() {
    toast.success("Settings saved", { description: "Your changes have been applied." });
  }

  function togglePref(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <PageShell title="Settings" description="Business profile and preferences.">
      <Card>
        <CardContent className="space-y-8 p-6">

          {/* Business profile */}
          <Section title="Business profile" description="Your shop's legal and contact details.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                id="biz"
                label="Unit name"
                value={profile.name}
                onChange={(v) => setProfile({ ...profile, name: v })}
              />
              <Field
                id="gst"
                label="GSTIN"
                value={profile.gst}
                onChange={(v) => setProfile({ ...profile, gst: v })}
              />
              <Field
                id="phone"
                label="Phone"
                value={profile.phone}
                onChange={(v) => setProfile({ ...profile, phone: v })}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                value={profile.email}
                onChange={(v) => setProfile({ ...profile, email: v })}
              />
              <div className="md:col-span-2">
                <Field
                  id="addr"
                  label="Address"
                  value={profile.address}
                  onChange={(v) => setProfile({ ...profile, address: v })}
                />
              </div>
            </div>
          </Section>

          <Separator />

          {/* Financial year */}
          <Section title="Financial period" description="Active financial year and unit reference.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                id="fy"
                label="Financial year"
                value={profile.fy}
                onChange={(v) => setProfile({ ...profile, fy: v })}
              />
              <Field
                id="unit"
                label="Unit"
                value={profile.unit}
                onChange={(v) => setProfile({ ...profile, unit: v })}
              />
            </div>
          </Section>

          <Separator />

          {/* Notifications */}
          <Section title="Notifications" description="Control when and how you receive alerts.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Toggle
                label="Low-stock email alerts"
                description="Alert when SKU falls below reorder level"
                checked={prefs.lowStock}
                onChange={() => togglePref("lowStock")}
              />
              <Toggle
                label="Daily sales summary"
                description="End-of-day revenue and invoice count"
                checked={prefs.dailySales}
                onChange={() => togglePref("dailySales")}
              />
              <Toggle
                label="Batch expiry reminders"
                description="30-day advance notice for expiring stock"
                checked={prefs.batchExpiry}
                onChange={() => togglePref("batchExpiry")}
              />
              <Toggle
                label="GST report auto-generate"
                description="Auto-prepare GSTR-1 on the 5th of each month"
                checked={prefs.gstAuto}
                onChange={() => togglePref("gstAuto")}
              />
              <Toggle
                label="Weekly report email"
                description="Revenue and expense summary every Monday"
                checked={prefs.weeklyReport}
                onChange={() => togglePref("weeklyReport")}
              />
              <Toggle
                label="SMS alerts"
                description="Critical alerts via SMS (carrier charges apply)"
                checked={prefs.smsAlerts}
                onChange={() => togglePref("smsAlerts")}
              />
            </div>
          </Section>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Last saved: today at {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
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
