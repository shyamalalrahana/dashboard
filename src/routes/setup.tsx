import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Check, Loader2, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFirstAdmin, needsSetup } from "@/lib/auth.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Set up ShopOS" }] }),
  beforeLoad: async () => {
    // Once an owner account exists this page must never be reachable again.
    const { needsSetup: setupRequired } = await needsSetup();
    if (!setupRequired) throw redirect({ to: "/login" });
  },
  component: SetupPage,
});

function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const longEnough = password.length >= 8;
  const matches = password.length > 0 && password === confirm;
  const canSubmit = name.trim() && email.trim() && longEnough && matches && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const admin = await createFirstAdmin({ data: { name: name.trim(), email: email.trim(), password } });
      toast.success(`Welcome, ${admin.name}`, { description: "Your owner account is ready." });
      router.navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Welcome to ShopOS</h1>
            <p className="text-sm text-muted-foreground">
              Create the owner account. This is the only account that can manage products, prices and staff.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" placeholder="e.g. Shyam Lal" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} autoFocus />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="username" placeholder="owner@shop.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
                <p className="text-xs text-muted-foreground">Used to sign in — it doesn’t need to receive mail.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" autoComplete="new-password" placeholder="Type it again" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy} />
              </div>

              <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                <Rule ok={longEnough} label="At least 8 characters" />
                <Rule ok={matches} label="Both passwords match" />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create owner account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your data stays on this computer. Nothing is sent to the internet.
        </p>
      </div>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn(
        "flex h-4 w-4 items-center justify-center rounded-full",
        ok ? "bg-success/15 text-success" : "bg-muted-foreground/15 text-muted-foreground",
      )}>
        <Check className="h-3 w-3" />
      </span>
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
