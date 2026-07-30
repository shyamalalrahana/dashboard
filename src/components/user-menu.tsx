import { useRouter } from "@tanstack/react-router";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/auth.server";
import type { CurrentUser } from "@/lib/auth-types";

export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  async function signOut() {
    setBusy(true);
    try {
      await logout();
      toast.success("Signed out");
      // Full reload clears any cached loader data from the previous session.
      window.location.href = "/login";
    } catch {
      setBusy(false);
      toast.error("Could not sign out.");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-8 items-center gap-2 rounded-full border border-border pl-1 pr-2.5 transition-colors hover:bg-muted"
          aria-label="Account"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {initials || <UserRound className="h-3 w-3" />}
          </span>
          <span className="hidden max-w-[8rem] truncate text-xs font-medium sm:block">{user.name}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-60 p-0">
        <div className="px-3 py-3">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">
            {user.role === "admin" && <ShieldCheck className="h-3 w-3 text-primary" />}
            {user.role}
          </span>
        </div>
        <Separator />
        <div className="p-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={signOut}
            disabled={busy}
          >
            <LogOut className="h-4 w-4" />
            {busy ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
