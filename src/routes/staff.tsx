import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Shield, Trash2, UserCheck, UserCog, Users } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff · ShopOS" },
      { name: "description", content: "Manage staff, salaries, and role-based access." },
    ],
  }),
  component: StaffPage,
});

type Section = { key: string; label: string; description: string; builtIn: boolean };

const INITIAL_SECTIONS: Section[] = [
  { key: "dashboard", label: "Dashboard", description: "Overview, KPIs, charts", builtIn: true },
  { key: "sales", label: "Sales", description: "Create and view invoices", builtIn: true },
  { key: "expenses", label: "Expenses", description: "Record and track expenses", builtIn: true },
  { key: "products", label: "Products", description: "Product catalogue and pricing", builtIn: true },
  { key: "inventory", label: "Inventory", description: "Stock levels and alerts", builtIn: true },
  { key: "customers", label: "Customers", description: "Customer list and credit", builtIn: true },
  { key: "batches", label: "Batches", description: "Batch and expiry tracking", builtIn: true },
  { key: "reports", label: "Reports", description: "P&L, GST, and financial reports", builtIn: true },
  { key: "staff", label: "Staff", description: "Manage staff and roles", builtIn: true },
  { key: "settings", label: "Settings", description: "Business settings and configuration", builtIn: true },
];

type Permissions = Record<string, boolean>;

type Role = {
  id: string;
  name: string;
  color: string;
  permissions: Permissions;
};

type Staff = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  joinDate: string;
  status: "Active" | "Inactive";
};

const defaultPermissions = (keys: string[]): Permissions =>
  Object.fromEntries(INITIAL_SECTIONS.map((s) => [s.key, keys.includes(s.key)]));

const initialRoles: Role[] = [
  {
    id: "owner",
    name: "Owner",
    color: "bg-purple-500",
    permissions: defaultPermissions(INITIAL_SECTIONS.map((s) => s.key)),
  },
  {
    id: "manager",
    name: "Manager",
    color: "bg-blue-500",
    permissions: defaultPermissions(["dashboard", "sales", "expenses", "products", "inventory", "customers", "batches", "reports"]),
  },
  {
    id: "cashier",
    name: "Cashier",
    color: "bg-green-500",
    permissions: defaultPermissions(["dashboard", "sales", "customers"]),
  },
  {
    id: "inventory_staff",
    name: "Inventory Staff",
    color: "bg-orange-500",
    permissions: defaultPermissions(["dashboard", "products", "inventory", "batches"]),
  },
  {
    id: "accountant",
    name: "Accountant",
    color: "bg-teal-500",
    permissions: defaultPermissions(["dashboard", "sales", "expenses", "reports"]),
  },
];

const initialStaff: Staff[] = [
  { id: "STF-001", name: "Ravi Kumar", phone: "9876543210", email: "ravi@shop.com", role: "manager", salary: 28000, joinDate: "2024-01-15", status: "Active" },
  { id: "STF-002", name: "Priya Sharma", phone: "9123456780", email: "priya@shop.com", role: "cashier", salary: 18000, joinDate: "2024-03-01", status: "Active" },
  { id: "STF-003", name: "Arjun Nair", phone: "9988776655", email: "arjun@shop.com", role: "inventory_staff", salary: 20000, joinDate: "2024-05-10", status: "Active" },
  { id: "STF-004", name: "Meena Pillai", phone: "9001122334", email: "meena@shop.com", role: "accountant", salary: 25000, joinDate: "2023-11-20", status: "Active" },
  { id: "STF-005", name: "Suresh Das", phone: "9444555666", email: "suresh@shop.com", role: "cashier", salary: 17500, joinDate: "2025-02-01", status: "Inactive" },
];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500",
  manager: "bg-blue-500",
  cashier: "bg-green-500",
  inventory_staff: "bg-orange-500",
  accountant: "bg-teal-500",
};

export function StaffPage() {
  const [tab, setTab] = useState<"staff" | "roles">("staff");
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [addOpen, setAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({ name: "", phone: "", email: "", role: "cashier", salary: "", status: "Active" as Staff["status"] });
  const [selectedRole, setSelectedRole] = useState<Role>(roles[1]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "cashier", salary: "", joinDate: "", status: "Active" as Staff["status"] });

  // Confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{ type: "staff"; id: string; label: string } | { type: "role"; id: string; label: string } | null>(null);

  // Add/Edit Role dialog
  const [roleDialog, setRoleDialog] = useState<{ mode: "add" | "edit"; id?: string } | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", color: "bg-blue-500" });

  const COLOR_OPTIONS = [
    { label: "Blue", value: "bg-blue-500" },
    { label: "Green", value: "bg-green-500" },
    { label: "Orange", value: "bg-orange-500" },
    { label: "Red", value: "bg-red-500" },
    { label: "Pink", value: "bg-pink-500" },
    { label: "Teal", value: "bg-teal-500" },
    { label: "Yellow", value: "bg-yellow-500" },
    { label: "Indigo", value: "bg-indigo-500" },
  ];

  const [staffSearch, setStaffSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStaff = staff.filter((s) => {
    const q = staffSearch.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.id.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const active = staff.filter((s) => s.status === "Active");
  const totalSalary = staff.filter((s) => s.status === "Active").reduce((sum, s) => sum + s.salary, 0);

  function getRoleName(roleId: string) {
    return roles.find((r) => r.id === roleId)?.name ?? roleId;
  }

  function handleAddStaff() {
    if (!form.name || !form.phone || !form.salary) return;
    const next: Staff = {
      id: `STF-${String(staff.length + 1).padStart(3, "0")}`,
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: form.role,
      salary: Number(form.salary),
      joinDate: form.joinDate || new Date().toISOString().split("T")[0],
      status: form.status,
    };
    setStaff([...staff, next]);
    setForm({ name: "", phone: "", email: "", role: "cashier", salary: "", joinDate: "", status: "Active" });
    setAddOpen(false);
    toast.success("Staff added", { description: `${next.name} · ${getRoleName(next.role)}` });
  }

  function openEditStaff(s: Staff) {
    setEditStaff(s);
    setEditStaffForm({ name: s.name, phone: s.phone, email: s.email, role: s.role, salary: String(s.salary), status: s.status });
  }
  function handleSaveEditStaff() {
    if (!editStaff || !editStaffForm.name || !editStaffForm.phone || !editStaffForm.salary) return;
    setStaff(staff.map((s) => s.id === editStaff.id ? { ...s, name: editStaffForm.name, phone: editStaffForm.phone, email: editStaffForm.email, role: editStaffForm.role, salary: Number(editStaffForm.salary), status: editStaffForm.status } : s));
    setEditStaff(null);
    toast.success("Staff updated");
  }

  function handleRemoveStaff(id: string) {
    const member = staff.find((s) => s.id === id);
    if (member) setConfirmDelete({ type: "staff", id, label: member.name });
  }

  function handleRemoveRole(id: string) {
    const role = roles.find((r) => r.id === id);
    if (role) setConfirmDelete({ type: "role", id, label: role.name });
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "staff") {
      setStaff(staff.filter((s) => s.id !== confirmDelete.id));
      toast.success("Staff removed", { description: confirmDelete.label });
    } else if (confirmDelete.type === "role") {
      setStaff(staff.map((s) => s.role === confirmDelete.id ? { ...s, role: "cashier" } : s));
      const remaining = roles.filter((r) => r.id !== confirmDelete.id);
      setRoles(remaining);
      if (selectedRole.id === confirmDelete.id) setSelectedRole(remaining[0]);
      toast.success("Role deleted", { description: confirmDelete.label });
    }
    setConfirmDelete(null);
  }

  function openAddRole() {
    setRoleForm({ name: "", color: "bg-blue-500" });
    setRoleDialog({ mode: "add" });
  }

  function openEditRole(role: Role) {
    setRoleForm({ name: role.name, color: role.color });
    setRoleDialog({ mode: "edit", id: role.id });
  }

  function handleSaveRole() {
    if (!roleForm.name.trim()) return;
    if (roleDialog?.mode === "add") {
      const id = roleForm.name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
      const newRole: Role = { id, name: roleForm.name.trim(), color: roleForm.color, permissions: defaultPermissions(["dashboard"]) };
      setRoles([...roles, newRole]);
      setSelectedRole(newRole);
      toast.success("Role created", { description: newRole.name });
    } else if (roleDialog?.mode === "edit" && roleDialog.id) {
      setRoles(roles.map((r) => r.id === roleDialog.id ? { ...r, name: roleForm.name.trim(), color: roleForm.color } : r));
      if (selectedRole.id === roleDialog.id) setSelectedRole((prev) => ({ ...prev, name: roleForm.name.trim(), color: roleForm.color }));
      toast.success("Role updated");
    }
    setRoleDialog(null);
  }

  function togglePermission(roleId: string, section: string) {
    setRoles(roles.map((r) =>
      r.id === roleId
        ? { ...r, permissions: { ...r.permissions, [section]: !r.permissions[section] } }
        : r
    ));
    // keep selected role in sync
    if (selectedRole.id === roleId) {
      setSelectedRole((prev) => ({
        ...prev,
        permissions: { ...prev.permissions, [section]: !prev.permissions[section] },
      }));
    }
    toast.success("Permission updated");
  }

  return (
    <PageShell
      title="Staff"
      description="Manage your team, salaries, and control which sections each role can access."
      actions={
        tab === "staff" ? (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5" onClick={openAddRole}>
            <Plus className="h-4 w-4" /> Add Role
          </Button>
        )
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total staff" value={`${staff.length} members`} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Active" value={`${active.length} members`} icon={<UserCheck className="h-4 w-4" />} />
        <StatCard label="Monthly salaries" value={`₹${totalSalary.toLocaleString("en-IN")}`} icon={<Shield className="h-4 w-4" />} />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {(["staff", "roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "staff" ? "Staff Members" : "Roles & Access"}
          </button>
        ))}
      </div>

      {/* ── STAFF TAB ── */}
      {tab === "staff" && (
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-4 h-14 flex items-center gap-3">
              <h2 className="font-display text-lg font-semibold mr-auto">All Staff</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input className="pl-7 h-8 w-36 text-sm" placeholder="Search…" value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 w-24 text-sm shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-24 text-sm shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Salary (₹)</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {s.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="tabular-nums">{s.phone}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.email || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${ROLE_COLORS[s.role] ?? "bg-muted"}`} />
                        <span className="text-sm">{getRoleName(s.role)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {s.salary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Active" ? "default" : "secondary"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditStaff(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveStaff(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── ROLES & ACCESS TAB ── */}
      {tab === "roles" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Role list */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-base font-semibold">Roles</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select a role to manage its access</p>
              </div>
              <div className="divide-y divide-border">
                {roles.map((role) => {
                  const count = staff.filter((s) => s.role === role.id).length;
                  const perms = Object.values(role.permissions).filter(Boolean).length;
                  const isOwner = role.id === "owner";
                  return (
                    <div
                      key={role.id}
                      className={`flex items-center gap-2 px-4 py-3 transition-colors hover:bg-muted/40 ${selectedRole.id === role.id ? "bg-muted/60" : ""}`}
                    >
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        onClick={() => setSelectedRole(role)}
                      >
                        <span className={`h-3 w-3 rounded-full shrink-0 ${role.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{count} staff · {perms}/{sections.length} sections</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditRole(role)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit role"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!isOwner && (
                          <button
                            onClick={() => handleRemoveRole(role.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete role"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Permissions panel */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="border-b border-border p-4 flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${selectedRole.color}`} />
                <div>
                  <h2 className="font-display text-base font-semibold">{selectedRole.name}</h2>
                  <p className="text-xs text-muted-foreground">Toggle sections this role can access</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                {sections.map((section) => {
                  const allowed = roles.find((r) => r.id === selectedRole.id)?.permissions[section.key] ?? false;
                  const isOwner = selectedRole.id === "owner";
                  return (
                    <div key={section.key} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                      <Switch
                        checked={allowed}
                        disabled={isOwner}
                        onCheckedChange={() => togglePermission(selectedRole.id, section.key)}
                      />
                    </div>
                  );
                })}
              </div>
              {selectedRole.id === "owner" && (
                <div className="px-6 py-3 bg-muted/40 text-xs text-muted-foreground border-t border-border">
                  Owner has full access to all sections and cannot be restricted.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ── */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmDelete?.type === "staff" ? "Remove Staff Member?" : "Delete Role?"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            {confirmDelete?.type === "staff" ? (
              <>Are you sure you want to remove <span className="font-semibold text-foreground">{confirmDelete.label}</span> from your team? This cannot be undone.</>
            ) : (
              <>Are you sure you want to delete the <span className="font-semibold text-foreground">{confirmDelete?.label}</span> role? Staff assigned to this role will be moved to Cashier.</>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {confirmDelete?.type === "staff" ? "Remove" : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD / EDIT ROLE DIALOG ── */}
      <Dialog open={!!roleDialog} onOpenChange={(o) => !o && setRoleDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{roleDialog?.mode === "add" ? "Add New Role" : "Edit Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g. Supervisor"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setRoleForm({ ...roleForm, color: c.value })}
                    className={`h-7 w-7 rounded-full ${c.value} transition-all ${roleForm.color === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-70 hover:opacity-100"}`}
                  />
                ))}
              </div>
            </div>
            {roleForm.name && (
              <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
                <span className={`h-3 w-3 rounded-full ${roleForm.color}`} />
                <span className="text-sm font-medium">{roleForm.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">preview</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={!roleForm.name.trim()}>
              {roleDialog?.mode === "add" ? "Create Role" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT STAFF DIALOG ── */}
      <Dialog open={!!editStaff} onOpenChange={(o) => !o && setEditStaff(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editStaffForm.name} onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input value={editStaffForm.phone} onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email (optional)</Label>
                <Input value={editStaffForm.email} onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editStaffForm.role} onValueChange={(v) => setEditStaffForm({ ...editStaffForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full inline-block ${r.color}`} />
                          {r.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Salary (₹)</Label>
                <Input type="number" value={editStaffForm.salary} onChange={(e) => setEditStaffForm({ ...editStaffForm, salary: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editStaffForm.status} onValueChange={(v) => setEditStaffForm({ ...editStaffForm, status: v as Staff["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStaff(null)}>Cancel</Button>
            <Button onClick={handleSaveEditStaff} disabled={!editStaffForm.name || !editStaffForm.phone || !editStaffForm.salary}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD STAFF DIALOG ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Ravi Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email (optional)</Label>
                <Input placeholder="staff@shop.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full inline-block ${r.color}`} />
                          {r.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Salary (₹)</Label>
                <Input type="number" placeholder="20000" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Join Date</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Staff["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStaff} disabled={!form.name || !form.phone || !form.salary}>
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}


function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
