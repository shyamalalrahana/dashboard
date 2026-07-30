import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Delete, KeyRound, Loader2, Lock, Mail, Store, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchCurrentUser, fetchPinAccounts, loginAdmin, loginWithPin, needsSetup,
} from "@/lib/auth.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · ShopOS" }] }),
  beforeLoad: async () => {
    // Send a brand-new install to setup, and an already-signed-in user home.
    const [{ needsSetup: setupRequired }, user] = await Promise.all([needsSetup(), fetchCurrentUser()]);
    if (setupRequired) throw redirect({ to: "/setup" });
    if (user) throw redirect({ to: "/" });
  },
  loader: async () => ({ pinAccounts: await fetchPinAccounts() }),
  component: LoginPage,
});

type Mode = "pin" | "admin";

function LoginPage() {
  const router = useRouter();
  const { pinAccounts } = Route.useLoaderData();

  // Counter staff are the common case, so default to the PIN pad when any
  // PIN account exists.
  const [mode, setMode] = useState<Mode>(pinAccounts.length > 0 ? "pin" : "admin");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">ShopOS</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {mode === "pin"
              ? <PinLogin accounts={pinAccounts} busy={busy} setBusy={setBusy} onDone={() => router.navigate({ to: "/" })} />
              : <AdminLogin busy={busy} setBusy={setBusy} onDone={() => router.navigate({ to: "/" })} />}
          </CardContent>
        </Card>

        {pinAccounts.length > 0 && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMode(mode === "pin" ? "admin" : "pin")}
              disabled={busy}
            >
              {mode === "pin" ? "Sign in as admin instead" : "Use counter PIN instead"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PIN pad — built for quick repeated use at the counter ─────────────────────

function PinLogin({ accounts, busy, setBusy, onDone }: {
  accounts: Array<{ id: string; name: string; role: string }>;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onDone: () => void;
}) {
  const [staffId, setStaffId] = useState(accounts.length === 1 ? accounts[0].id : "");
  const [pin, setPin] = useState("");
  const selected = accounts.find((a) => a.id === staffId);

  async function submit(value: string) {
    if (!staffId || busy) return;
    setBusy(true);
    try {
      const user = await loginWithPin({ data: { staffId, pin: value } });
      toast.success(`Welcome back, ${user.name}`);
      onDone();
    } catch (err) {
      setPin("");
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  function press(digit: string) {
    if (busy || pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 6) void submit(next);   // 6 digits auto-submits
  }

  if (!staffId) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Who's at the counter?</p>
        <div className="space-y-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setStaffId(a.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <UserRound className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{a.name}</span>
                <span className="block text-xs capitalize text-muted-foreground">{a.role}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selected?.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{selected?.role}</p>
        </div>
        {accounts.length > 1 && (
          <button
            type="button"
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setStaffId(""); setPin(""); }}
            disabled={busy}
          >
            Change
          </button>
        )}
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-2.5 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-3 rounded-full border transition-colors",
              i < pin.length ? "border-primary bg-primary" : "border-border bg-transparent",
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Button key={d} type="button" variant="outline" className="h-12 text-lg font-medium" onClick={() => press(d)} disabled={busy}>
            {d}
          </Button>
        ))}
        <Button type="button" variant="ghost" className="h-12" onClick={() => setPin("")} disabled={busy || !pin}>
          Clear
        </Button>
        <Button type="button" variant="outline" className="h-12 text-lg font-medium" onClick={() => press("0")} disabled={busy}>
          0
        </Button>
        <Button type="button" variant="ghost" className="h-12" onClick={() => setPin(pin.slice(0, -1))} disabled={busy || !pin}>
          <Delete className="h-4 w-4" />
        </Button>
      </div>

      <Button className="w-full gap-2" onClick={() => submit(pin)} disabled={busy || pin.length < 4}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <><KeyRound className="h-4 w-4" /> Sign in</>}
      </Button>
      <p className="text-center text-xs text-muted-foreground">4–6 digit PIN</p>
    </div>
  );
}

// ── Admin email + password ────────────────────────────────────────────────────

function AdminLogin({ busy, setBusy, onDone }: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !email || !password) return;
    setBusy(true);
    try {
      const user = await loginAdmin({ data: { email, password } });
      toast.success(`Welcome back, ${user.name}`);
      onDone();
    } catch (err) {
      setPassword("");
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email" ref={emailRef} type="email" autoComplete="username"
            className="pl-9" placeholder="owner@shop.com"
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password" type="password" autoComplete="current-password"
            className="pl-9" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy}
          />
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={busy || !email || !password}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
      </Button>
    </form>
  );
}
