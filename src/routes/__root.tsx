import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, Plus, Search, ShoppingCart, Receipt, Boxes, FlaskConical, UserCog } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";

type Notif = {
  id: string;
  type: "alert" | "action" | "info";
  icon: "warning" | "success" | "info" | "sales" | "expense" | "inventory" | "batch" | "staff";
  title: string;
  body: string;
  person?: string;
  personRole?: string;
  personColor?: string;
  time: string;
  read: boolean;
};

const INITIAL_NOTIFS: Notif[] = [
  { id: "n1", type: "alert", icon: "warning", title: "Low stock alert", body: "3 items are below reorder level: Sunflower Oil 1L, Toor Dal 1kg, Wheat Flour 10kg.", time: "2 min ago", read: false },
  { id: "n2", type: "action", icon: "sales", title: "Invoice created", body: "INV-2041 · Metro General Store · ₹18,500 marked as Pending.", person: "Ravi Kumar", personRole: "Manager", personColor: "bg-blue-500", time: "14 min ago", read: false },
  { id: "n3", type: "action", icon: "expense", title: "Expense recorded", body: "EXP-312 · Raw Materials · ₹14,200 added.", person: "Meena Pillai", personRole: "Accountant", personColor: "bg-teal-500", time: "1 hr ago", read: false },
  { id: "n4", type: "alert", icon: "batch", title: "Batches expiring soon", body: "2 batches expire within 180 days. Review your batch list.", time: "3 hrs ago", read: false },
  { id: "n5", type: "action", icon: "inventory", title: "Stock updated", body: "Sunflower Oil 1L restocked +50 btl (FG-101).", person: "Arjun Nair", personRole: "Inventory Staff", personColor: "bg-orange-500", time: "5 hrs ago", read: true },
  { id: "n6", type: "action", icon: "sales", title: "Payment updated", body: "INV-2038 status changed from Pending → Paid.", person: "Priya Sharma", personRole: "Cashier", personColor: "bg-green-500", time: "Yesterday", read: true },
  { id: "n7", type: "action", icon: "staff", title: "New staff added", body: "Suresh Das joined as Cashier.", person: "Ravi Kumar", personRole: "Manager", personColor: "bg-blue-500", time: "2 days ago", read: true },
  { id: "n8", type: "info", icon: "info", title: "Pending approvals", body: "6 expense entries are awaiting approval this month.", time: "3 days ago", read: true },
];

const ICON_MAP = {
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
  sales: <ShoppingCart className="h-4 w-4 text-primary" />,
  expense: <Receipt className="h-4 w-4 text-primary" />,
  inventory: <Boxes className="h-4 w-4 text-primary" />,
  batch: <FlaskConical className="h-4 w-4 text-warning" />,
  staff: <UserCog className="h-4 w-4 text-primary" />,
};

function NotificationPanel() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);
  const [open, setOpen] = useState(false);

  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs(notifs.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 shadow-xl" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}
            >
              <div className="mt-0.5 shrink-0">{ICON_MAP[n.icon]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                {n.person && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`h-4 w-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0 ${n.personColor}`}>
                      {n.person.charAt(0)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{n.person}</span> · {n.personRole}
                    </span>
                  </div>
                )}
              </div>
              {!n.read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border px-4 py-2.5 text-center">
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all activity
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing the page.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ShopOS · Multi-Shop ERP" },
      {
        name: "description",
        content:
          "Run your shop — sales, expenses, inventory, batches, and profit at a glance.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <div className="relative hidden flex-1 max-w-md md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products, invoices, customers…"
                  className="h-9 pl-9"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <NotificationPanel />
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New entry
                </Button>
              </div>
            </header>
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
