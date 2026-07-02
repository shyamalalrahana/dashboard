// Add Product — dynamic product master.
// Every dropdown is master data from Settings (option_values table): add / rename / delete inline.
// Advanced sections are module-driven: only enabled modules show their fields.

import { Check, ChevronDown, Image as ImageIcon, Pencil, Plus, Settings2, Tag, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_IMAGES, EMPTY_MODULES, EMPTY_VARIANTS, NO_OFFER, OFFER_PRESETS,
  type Product, type ProductAttribute, type ProductModules, type ProductStatus,
  type VariantGroup, type VariantItem,
  generateSku, fmtINR,
} from "@/lib/product-types";
import { cn } from "@/lib/utils";

// ── Master option shape (mirrors option_values rows) ──────────────────────────

export type MasterOption = { id: string; value: string; meta: Record<string, string | number | boolean | null> };
export type MasterOptions = Record<string, MasterOption[]>;

export type OptionHandlers = {
  onAddOption: (kind: string, value: string) => Promise<MasterOption | null>;
  onRenameOption: (kind: string, id: string, value: string) => Promise<void>;
  onDeleteOption: (kind: string, id: string) => Promise<{ ok: boolean }>;
};

// ── Editable master-data dropdown: select + add + rename + delete ──────────────

function MasterSelect({
  kind, label, required, value, options, onValueChange, handlers, placeholder,
}: {
  kind: string;
  label: string;
  required?: boolean;
  value: string;
  options: MasterOption[];
  onValueChange: (v: string) => void;
  handlers: OptionHandlers;
  placeholder?: string;
}) {
  const [managing, setManaging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function handleAdd() {
    const v = newValue.trim();
    if (!v || options.some((o) => o.value === v)) return;
    const created = await handlers.onAddOption(kind, v);
    if (created) onValueChange(created.value);
    setNewValue("");
    setAdding(false);
  }

  async function handleRename(id: string) {
    const v = editValue.trim();
    const old = options.find((o) => o.id === id);
    if (!v || !old || options.some((o) => o.value === v && o.id !== id)) { setEditingId(null); return; }
    await handlers.onRenameOption(kind, id, v);
    if (value === old.value) onValueChange(v);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const old = options.find((o) => o.id === id);
    const result = await handlers.onDeleteOption(kind, id);
    if (result.ok && old && value === old.value) onValueChange("");
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          onClick={() => setManaging(!managing)}
        >
          <Settings2 className="h-3 w-3" /> {managing ? "Done" : "Manage"}
        </button>
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}…`} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
        </SelectContent>
      </Select>

      {!managing && !adding && (
        <button type="button" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3" /> Add {label.toLowerCase()}
        </button>
      )}

      {adding && (
        <div className="flex gap-1.5">
          <Input
            className="h-8 text-sm"
            placeholder={`New ${label.toLowerCase()}…`}
            value={newValue}
            autoFocus
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } if (e.key === "Escape") setAdding(false); }}
          />
          <Button type="button" size="sm" className="h-8" onClick={handleAdd} disabled={!newValue.trim()}>Add</Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {managing && (
        <div className="rounded-lg border border-border divide-y divide-border max-h-44 overflow-y-auto">
          {options.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No values yet.</p>}
          {options.map((o) => (
            <div key={o.id} className="flex items-center gap-1.5 px-2.5 py-1.5">
              {editingId === o.id ? (
                <>
                  <Input
                    className="h-7 text-sm"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRename(o.id); } if (e.key === "Escape") setEditingId(null); }}
                  />
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => handleRename(o.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm flex-1 truncate">{o.value}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => { setEditingId(o.id); setEditValue(o.value); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(o.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
          {!adding ? (
            <button type="button" className="w-full px-3 py-1.5 text-left text-xs text-primary hover:bg-muted/50 inline-flex items-center gap-1"
              onClick={() => setAdding(true)}>
              <Plus className="h-3 w-3" /> Add new
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="pt-1">
      <h3 className="font-display text-sm font-semibold">{index}. {children}</h3>
      <div className="mt-2 border-b border-border" />
    </div>
  );
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className={cn("grid gap-3", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4")}>{children}</div>;
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
        {hint && <span className="text-muted-foreground text-xs font-normal ml-1">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { key: "basic",      label: "Basic Information" },
  { key: "classify",   label: "Classification" },
  { key: "unit",       label: "Units & Packaging" },
  { key: "pricing",    label: "Pricing" },
  { key: "tax",        label: "Tax" },
  { key: "inventory",  label: "Inventory" },
  { key: "attributes", label: "Custom Attributes" },
  { key: "variants",   label: "Variants" },
  { key: "supplier",   label: "Supplier" },
  { key: "images",     label: "Images" },
  { key: "modules",    label: "Additional Settings" },
  { key: "offers",     label: "Offers" },
  { key: "notes",      label: "Notes" },
] as const;

type SectionKey = typeof NAV_SECTIONS[number]["key"];

type FormState = {
  name: string; skuMode: "auto" | "manual"; sku: string; barcode: string; description: string; status: ProductStatus;
  category: string; brand: string; productType: string;
  unit: string; packSize: string; packUnit: string; packDisplayName: string;
  costPrice: string; sellingPrice: string; mrp: string; minSellingPrice: string; wholesalePrice: string; distributorPrice: string;
  gstEnabled: boolean; taxMode: string; taxProfile: string; hsn: string;
  openingStock: string; minStock: string; maxStock: string; reorderLevel: string; warehouse: string; location: string; rack: string; bin: string;
  attributes: ProductAttribute[];
  hasVariants: boolean; variantGroups: VariantGroup[]; variantItems: VariantItem[];
  supplierName: string; supplierCode: string; leadTime: string; minOrder: string;
  primaryImage: string; gallery: string[];
  modules: ProductModules;
  mfgDate: string; warranty: string;
  expiryTracking: boolean; shelfLife: string; expiryDate: string;
  offerEnabled: boolean; offerType: "percent" | "flat"; offerValue: string; offerLabel: string;
  notes: string;
};

function buildDefaultForm(): FormState {
  return {
    name: "", skuMode: "auto", sku: "", barcode: "", description: "", status: "Active",
    category: "", brand: "", productType: "Goods",
    unit: "Piece", packSize: "", packUnit: "", packDisplayName: "",
    costPrice: "", sellingPrice: "", mrp: "", minSellingPrice: "", wholesalePrice: "", distributorPrice: "",
    gstEnabled: true, taxMode: "Exclusive", taxProfile: "", hsn: "",
    openingStock: "", minStock: "", maxStock: "", reorderLevel: "", warehouse: "", location: "", rack: "", bin: "",
    attributes: [],
    hasVariants: false, variantGroups: [], variantItems: [],
    supplierName: "", supplierCode: "", leadTime: "", minOrder: "",
    primaryImage: "", gallery: [],
    modules: { ...EMPTY_MODULES },
    mfgDate: "", warranty: "",
    expiryTracking: false, shelfLife: "", expiryDate: "",
    offerEnabled: false, offerType: "percent", offerValue: "", offerLabel: "",
    notes: "",
  };
}

function buildFormFromProduct(p: Product): FormState {
  return {
    name: p.name, skuMode: "manual", sku: p.sku, barcode: p.barcode, description: p.description, status: p.status,
    category: p.category, brand: p.brand, productType: p.productType,
    unit: p.unit, packSize: p.packSize, packUnit: p.packUnit, packDisplayName: p.packDisplayName,
    costPrice: p.costPrice ? String(p.costPrice) : "",
    sellingPrice: p.sellingPrice ? String(p.sellingPrice) : "",
    mrp: p.mrp ? String(p.mrp) : "",
    minSellingPrice: p.minSellingPrice ? String(p.minSellingPrice) : "",
    wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice) : "",
    distributorPrice: p.distributorPrice ? String(p.distributorPrice) : "",
    gstEnabled: p.gstEnabled, taxMode: p.taxMode, taxProfile: p.taxProfile, hsn: p.hsn,
    openingStock: p.qty ? String(p.qty) : "",
    minStock: p.minStock ? String(p.minStock) : "",
    maxStock: p.maxStock ? String(p.maxStock) : "",
    reorderLevel: p.reorderLevel ? String(p.reorderLevel) : "",
    warehouse: p.warehouse, location: p.location, rack: p.rack, bin: p.bin,
    attributes: p.attributes.length ? p.attributes : [],
    hasVariants: p.hasVariants,
    variantGroups: p.variants.groups.length ? p.variants.groups : [],
    variantItems: p.variants.items.length ? p.variants.items : [],
    supplierName: p.supplierName, supplierCode: p.supplierCode, leadTime: p.leadTime, minOrder: p.minOrder,
    primaryImage: p.images.primary, gallery: p.images.gallery.length ? p.images.gallery : [],
    modules: { ...EMPTY_MODULES, ...p.modules },
    mfgDate: p.mfgDate, warranty: p.warranty,
    expiryTracking: p.expiryTracking, shelfLife: p.shelfLife, expiryDate: p.expiryDate,
    offerEnabled: p.offer.enabled, offerType: p.offer.type,
    offerValue: p.offer.value > 0 ? String(p.offer.value) : "",
    offerLabel: p.offer.label,
    notes: p.notes,
  };
}

function cartesian(groups: VariantGroup[]): string[] {
  const lists = groups.filter((g) => g.values.length > 0).map((g) => g.values);
  if (lists.length === 0) return [];
  return lists.reduce<string[]>((acc, list) =>
    acc.length === 0 ? [...list] : acc.flatMap((a) => list.map((b) => `${a} / ${b}`)), []);
}

// ── Dialog ─────────────────────────────────────────────────────────────────────

export function AddProductDialog({
  open, onClose, onSave, editProduct, options, handlers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editProduct?: Product | null;
  options: MasterOptions;
  handlers: OptionHandlers;
}) {
  const isEdit = !!editProduct;
  const [form, setForm] = useState<FormState>(() => editProduct ? buildFormFromProduct(editProduct) : buildDefaultForm());
  const [activeSection, setActiveSection] = useState<SectionKey>("basic");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (open) {
      setForm(editProduct ? buildFormFromProduct(editProduct) : buildDefaultForm());
      setActiveSection("basic");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editProduct?.id]);

  useEffect(() => {
    if (form.skuMode === "auto" && form.name) {
      setForm((f) => ({ ...f, sku: generateSku(f.name, f.category) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, form.category, form.skuMode]);

  // Auto pack display name — skip the render right after (re)opening so an
  // existing product's saved display name isn't silently overwritten.
  const skipPackAutoRef = useRef(true);
  useEffect(() => {
    skipPackAutoRef.current = true;
  }, [open, editProduct?.id]);
  useEffect(() => {
    if (skipPackAutoRef.current) { skipPackAutoRef.current = false; return; }
    if (form.packSize && form.packUnit) {
      setForm((f) => ({ ...f, packDisplayName: `${f.packSize} ${f.packUnit} ${f.unit}`.trim() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.packSize, form.packUnit, form.unit]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function scrollTo(key: SectionKey) {
    setActiveSection(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const taxProfiles = options.tax_profile ?? [];
  const selectedProfile = taxProfiles.find((p) => p.value === form.taxProfile);
  const taxRate = Number((selectedProfile?.meta as { rate?: number })?.rate ?? 0);

  const canSave = form.name.trim().length > 0 && Number(form.mrp) > 0 && !!form.category;

  const missingReason = !form.name.trim()
    ? "Product name is required."
    : !form.category ? "Category is required."
    : !(Number(form.mrp) > 0) ? "MRP is required."
    : "";

  function generateVariants() {
    const names = cartesian(form.variantGroups);
    const items: VariantItem[] = names.map((n) => {
      const existing = form.variantItems.find((it) => it.name === n);
      return existing ?? { name: n, sku: generateSku(`${form.name} ${n}`, form.category), price: Number(form.sellingPrice) || 0, stock: 0 };
    });
    set("variantItems", items);
  }

  function handleSave() {
    if (!canSave) return;
    const product: Product = {
      id: editProduct?.id ?? "", // "" for a new product — the DB assigns one on insert
      name: form.name.trim(),
      sku: form.sku || generateSku(form.name, form.category),
      barcode: form.barcode,
      description: form.description,
      status: form.status,
      category: form.category,
      brand: form.brand,
      productType: form.productType,
      unit: form.unit,
      packSize: form.packSize,
      packUnit: form.packUnit,
      packDisplayName: form.packDisplayName,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || Number(form.mrp) || 0,
      mrp: Number(form.mrp) || 0,
      minSellingPrice: Number(form.minSellingPrice) || 0,
      wholesalePrice: Number(form.wholesalePrice) || 0,
      distributorPrice: Number(form.distributorPrice) || 0,
      gstEnabled: form.gstEnabled,
      taxMode: form.taxMode,
      gstRate: String(taxRate),
      taxProfile: form.taxProfile,
      hsn: form.hsn,
      qty: Number(form.openingStock) || 0,
      minStock: Number(form.minStock) || 0,
      maxStock: Number(form.maxStock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      warehouse: form.warehouse,
      location: form.location,
      rack: form.rack,
      bin: form.bin,
      attributes: form.attributes.filter((a) => a.name.trim()),
      hasVariants: form.hasVariants && form.variantItems.length > 0,
      variants: form.hasVariants
        ? { groups: form.variantGroups.filter((g) => g.name.trim()), items: form.variantItems }
        : { ...EMPTY_VARIANTS },
      supplierName: form.supplierName,
      supplierCode: form.supplierCode,
      leadTime: form.leadTime,
      minOrder: form.minOrder,
      images: form.primaryImage || form.gallery.length
        ? { primary: form.primaryImage, gallery: form.gallery.filter(Boolean) }
        : { ...EMPTY_IMAGES },
      modules: form.modules,
      mfgDate: form.mfgDate,
      warranty: form.warranty,
      expiryTracking: form.expiryTracking,
      shelfLife: form.shelfLife,
      expiryDate: form.expiryDate,
      offer: form.offerEnabled && Number(form.offerValue) > 0
        ? { enabled: true, type: form.offerType, value: Number(form.offerValue), label: form.offerLabel }
        : { ...NO_OFFER },
      notes: form.notes,
      createdAt: editProduct?.createdAt ?? new Date().toISOString(),
    };
    onSave(product);
  }

  // Offer preview
  const offerBase = Number(form.sellingPrice) || Number(form.mrp) || 0;
  const offerVal = Number(form.offerValue) || 0;
  const offerPrice = form.offerEnabled && offerVal > 0
    ? (form.offerType === "percent" ? Math.round(offerBase * (1 - offerVal / 100)) : Math.max(0, offerBase - offerVal))
    : offerBase;

  const enabledModuleCount = useMemo(
    () => Object.values(form.modules).filter(Boolean).length + (form.expiryTracking ? 1 : 0),
    [form.modules, form.expiryTracking],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle>{isEdit ? `Edit Product — ${editProduct?.name}` : "Add Product"}</DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Dynamic product master — dropdowns are managed master data; enable only the modules you need.
          </p>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left nav */}
          <nav className="w-44 shrink-0 border-r border-border overflow-y-auto py-3 hidden sm:block">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => scrollTo(s.key)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  activeSection === s.key
                    ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {s.label}
                {s.key === "modules" && enabledModuleCount > 0 && (
                  <span className="ml-1.5 text-xs rounded-full bg-primary/15 text-primary px-1.5">{enabledModuleCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Form body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* 1. Basic Information */}
            <div ref={(el) => { sectionRefs.current.basic = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={1}>Basic Information</SectionHeader>
              <Field label="Product Name" required>
                <Input placeholder="e.g. Ashwagandha Churna 100 g" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <FieldRow>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">SKU</Label>
                    <button type="button" className="text-xs text-primary hover:underline"
                      onClick={() => set("skuMode", form.skuMode === "auto" ? "manual" : "auto")}>
                      {form.skuMode === "auto" ? "Switch to manual" : "Switch to auto"}
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. AYASHW-101"
                    value={form.sku}
                    disabled={form.skuMode === "auto"}
                    onChange={(e) => set("sku", e.target.value)}
                  />
                </div>
                <Field label="Barcode" hint="optional">
                  <Input placeholder="Scan or type…" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as ProductStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div />
              </FieldRow>
              <Field label="Description" hint="optional">
                <Textarea rows={2} placeholder="Short product description…" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>

            {/* 2. Classification */}
            <div ref={(el) => { sectionRefs.current.classify = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={2}>Product Classification</SectionHeader>
              <FieldRow>
                <MasterSelect kind="category" label="Category" required value={form.category}
                  options={options.category ?? []} onValueChange={(v) => set("category", v)} handlers={handlers} />
                <MasterSelect kind="brand" label="Brand" value={form.brand}
                  options={options.brand ?? []} onValueChange={(v) => set("brand", v)} handlers={handlers} />
              </FieldRow>
              <FieldRow>
                <MasterSelect kind="product_type" label="Product Type" required value={form.productType}
                  options={options.product_type ?? []} onValueChange={(v) => set("productType", v)} handlers={handlers} />
                <div />
              </FieldRow>
            </div>

            {/* 3. Units & Packaging */}
            <div ref={(el) => { sectionRefs.current.unit = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={3}>Units & Packaging</SectionHeader>
              <FieldRow>
                <MasterSelect kind="unit" label="Primary Unit" required value={form.unit}
                  options={options.unit ?? []} onValueChange={(v) => set("unit", v)} handlers={handlers} />
                <div />
              </FieldRow>
              <FieldRow cols={3}>
                <Field label="Pack Size">
                  <Input placeholder="e.g. 500" value={form.packSize} onChange={(e) => set("packSize", e.target.value)} />
                </Field>
                <Field label="Pack Unit">
                  <Input placeholder="e.g. mL" value={form.packUnit} onChange={(e) => set("packUnit", e.target.value)} />
                </Field>
                <Field label="Display Name">
                  <Input placeholder="500 mL Bottle" value={form.packDisplayName} onChange={(e) => set("packDisplayName", e.target.value)} />
                </Field>
              </FieldRow>
            </div>

            {/* 4. Pricing */}
            <div ref={(el) => { sectionRefs.current.pricing = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={4}>Pricing</SectionHeader>
              <FieldRow>
                <Field label="Purchase Price (₹)" hint="cost">
                  <Input type="number" min="0" placeholder="0.00" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
                </Field>
                <Field label="Selling Price (₹)">
                  <Input type="number" min="0" placeholder="0.00" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="MRP (₹)" required>
                  <Input type="number" min="0" placeholder="0.00" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
                </Field>
                <Field label="Minimum Selling Price (₹)" hint="optional">
                  <Input type="number" min="0" placeholder="0.00" value={form.minSellingPrice} onChange={(e) => set("minSellingPrice", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="Wholesale Price (₹)" hint="optional">
                  <Input type="number" min="0" placeholder="0.00" value={form.wholesalePrice} onChange={(e) => set("wholesalePrice", e.target.value)} />
                </Field>
                <Field label="Distributor Price (₹)" hint="optional">
                  <Input type="number" min="0" placeholder="0.00" value={form.distributorPrice} onChange={(e) => set("distributorPrice", e.target.value)} />
                </Field>
              </FieldRow>
            </div>

            {/* 5. Tax */}
            <div ref={(el) => { sectionRefs.current.tax = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={5}>Tax</SectionHeader>
              <div className="flex items-center gap-3">
                <Switch id="tax-switch" checked={form.gstEnabled} onCheckedChange={(v) => set("gstEnabled", v)} />
                <Label htmlFor="tax-switch" className="cursor-pointer">Tax Applicable</Label>
              </div>
              {form.gstEnabled && (
                <>
                  <FieldRow>
                    <MasterSelect kind="tax_profile" label="Tax Profile" value={form.taxProfile}
                      options={taxProfiles} onValueChange={(v) => set("taxProfile", v)} handlers={handlers} />
                    <Field label="Tax Mode">
                      <Select value={form.taxMode} onValueChange={(v) => set("taxMode", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Exclusive">Exclusive (added on top)</SelectItem>
                          <SelectItem value="Inclusive">Inclusive (built into price)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="HSN / SAC Code" hint="optional">
                      <Input placeholder="e.g. 30049099" value={form.hsn} onChange={(e) => set("hsn", e.target.value)} />
                    </Field>
                    <div className="flex items-end pb-2">
                      {form.taxProfile && (
                        <p className="text-xs text-muted-foreground">Effective rate: <span className="font-semibold text-foreground">{taxRate}%</span></p>
                      )}
                    </div>
                  </FieldRow>
                </>
              )}
            </div>

            {/* 6. Inventory */}
            <div ref={(el) => { sectionRefs.current.inventory = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={6}>Inventory</SectionHeader>
              <FieldRow cols={4}>
                <Field label="Opening Stock">
                  <Input type="number" min="0" placeholder="0" value={form.openingStock} onChange={(e) => set("openingStock", e.target.value)} />
                </Field>
                <Field label="Minimum Stock">
                  <Input type="number" min="0" placeholder="0" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} />
                </Field>
                <Field label="Maximum Stock">
                  <Input type="number" min="0" placeholder="0" value={form.maxStock} onChange={(e) => set("maxStock", e.target.value)} />
                </Field>
                <Field label="Reorder Level">
                  <Input type="number" min="0" placeholder="0" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow cols={4}>
                <div className="col-span-2">
                  <MasterSelect kind="warehouse" label="Warehouse" value={form.warehouse}
                    options={options.warehouse ?? []} onValueChange={(v) => set("warehouse", v)} handlers={handlers} />
                </div>
                <Field label="Rack">
                  <Input placeholder="e.g. R-12" value={form.rack} onChange={(e) => set("rack", e.target.value)} />
                </Field>
                <Field label="Bin">
                  <Input placeholder="e.g. B-3" value={form.bin} onChange={(e) => set("bin", e.target.value)} />
                </Field>
              </FieldRow>
              <Field label="Location" hint="optional">
                <Input placeholder="Aisle / floor / shop area…" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </Field>
            </div>

            {/* 7. Custom Attributes */}
            <div ref={(el) => { sectionRefs.current.attributes = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={7}>Custom Attributes</SectionHeader>
              <p className="text-xs text-muted-foreground -mt-2">
                Define your own fields — Potency, Dosage, Fabric, Voltage, Purity… whatever this business needs.
              </p>
              {form.attributes.map((attr, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input className="flex-1" placeholder="Attribute (e.g. Potency)" value={attr.name}
                    onChange={(e) => set("attributes", form.attributes.map((a, j) => j === i ? { ...a, name: e.target.value } : a))} />
                  <Input className="flex-1" placeholder="Value (e.g. 500 mg)" value={attr.value}
                    onChange={(e) => set("attributes", form.attributes.map((a, j) => j === i ? { ...a, value: e.target.value } : a))} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => set("attributes", form.attributes.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1.5"
                onClick={() => set("attributes", [...form.attributes, { name: "", value: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Add Attribute
              </Button>
            </div>

            {/* 8. Variants */}
            <div ref={(el) => { sectionRefs.current.variants = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={8}>Variants</SectionHeader>
              <div className="flex items-center gap-3">
                <Switch id="variants-switch" checked={form.hasVariants} onCheckedChange={(v) => set("hasVariants", v)} />
                <Label htmlFor="variants-switch" className="cursor-pointer">Product has variants</Label>
              </div>
              {form.hasVariants && (
                <>
                  {form.variantGroups.map((g, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input className="w-40" placeholder="Group (e.g. Size)" value={g.name}
                          onChange={(e) => set("variantGroups", form.variantGroups.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                        <Input className="flex-1" placeholder="Values, comma separated (e.g. 500 mL, 1 L, 5 L)"
                          value={g.values.join(", ")}
                          onChange={(e) => set("variantGroups", form.variantGroups.map((x, j) =>
                            j === i ? { ...x, values: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x))} />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => set("variantGroups", form.variantGroups.filter((_, j) => j !== i))}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5"
                      onClick={() => set("variantGroups", [...form.variantGroups, { name: "", values: [] }])}>
                      <Plus className="h-3.5 w-3.5" /> Add Variant Group
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="gap-1.5"
                      disabled={form.variantGroups.every((g) => g.values.length === 0)}
                      onClick={generateVariants}>
                      <ChevronDown className="h-3.5 w-3.5" /> Generate Variants
                    </Button>
                  </div>
                  {form.variantItems.length > 0 && (
                    <div className="rounded-lg border border-border divide-y divide-border">
                      <div className="grid grid-cols-[1fr_120px_90px_80px_32px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                        <span>Variant</span><span>SKU</span><span>Price ₹</span><span>Stock</span><span />
                      </div>
                      {form.variantItems.map((it, i) => (
                        <div key={i} className="grid grid-cols-[1fr_120px_90px_80px_32px] gap-2 px-3 py-1.5 items-center">
                          <span className="text-sm truncate">{it.name}</span>
                          <Input className="h-7 text-xs" value={it.sku}
                            onChange={(e) => set("variantItems", form.variantItems.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))} />
                          <Input className="h-7 text-xs" type="number" value={it.price || ""}
                            onChange={(e) => set("variantItems", form.variantItems.map((x, j) => j === i ? { ...x, price: Number(e.target.value) || 0 } : x))} />
                          <Input className="h-7 text-xs" type="number" value={it.stock || ""}
                            onChange={(e) => set("variantItems", form.variantItems.map((x, j) => j === i ? { ...x, stock: Number(e.target.value) || 0 } : x))} />
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => set("variantItems", form.variantItems.filter((_, j) => j !== i))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 9. Supplier */}
            <div ref={(el) => { sectionRefs.current.supplier = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={9}>Supplier</SectionHeader>
              <FieldRow>
                <Field label="Default Supplier" hint="optional">
                  <Input placeholder="Supplier name…" value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} />
                </Field>
                <Field label="Supplier Code" hint="optional">
                  <Input placeholder="e.g. SUP-014" value={form.supplierCode} onChange={(e) => set("supplierCode", e.target.value)} />
                </Field>
              </FieldRow>
              <FieldRow>
                <Field label="Lead Time" hint="optional">
                  <Input placeholder="e.g. 7 days" value={form.leadTime} onChange={(e) => set("leadTime", e.target.value)} />
                </Field>
                <Field label="Minimum Order" hint="optional">
                  <Input placeholder="e.g. 50 units" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} />
                </Field>
              </FieldRow>
            </div>

            {/* 10. Images */}
            <div ref={(el) => { sectionRefs.current.images = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={10}>Images</SectionHeader>
              <Field label="Primary Image URL" hint="optional">
                <Input placeholder="https://…" value={form.primaryImage} onChange={(e) => set("primaryImage", e.target.value)} />
              </Field>
              {form.primaryImage && (
                <div className="h-24 w-24 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.primaryImage} alt="Primary" className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              {form.gallery.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="flex-1" placeholder="https://…" value={url}
                    onChange={(e) => set("gallery", form.gallery.map((g, j) => j === i ? e.target.value : g))} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => set("gallery", form.gallery.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => set("gallery", [...form.gallery, ""])}>
                <ImageIcon className="h-3.5 w-3.5" /> Add Gallery Image
              </Button>
            </div>

            {/* 11. Additional Settings (modules) */}
            <div ref={(el) => { sectionRefs.current.modules = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={11}>Additional Settings</SectionHeader>
              <p className="text-xs text-muted-foreground -mt-2">Enable only the modules this product needs. Enabled modules reveal their fields.</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["batch", "Batch Tracking"],
                  ["serial", "Serial Number"],
                  ["warranty", "Warranty"],
                  ["manufacturing", "Manufacturing"],
                  ["service", "Service Item"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                    <Switch id={`mod-${key}`} checked={form.modules[key]}
                      onCheckedChange={(v) => set("modules", { ...form.modules, [key]: v })} />
                    <Label htmlFor={`mod-${key}`} className="cursor-pointer text-sm">{label}</Label>
                  </div>
                ))}
                <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                  <Switch id="mod-expiry" checked={form.expiryTracking} onCheckedChange={(v) => set("expiryTracking", v)} />
                  <Label htmlFor="mod-expiry" className="cursor-pointer text-sm">Expiry Tracking</Label>
                </div>
              </div>

              {form.expiryTracking && (
                <FieldRow cols={3}>
                  <Field label="Shelf Life">
                    <Input placeholder="e.g. 24 Months" value={form.shelfLife} onChange={(e) => set("shelfLife", e.target.value)} />
                  </Field>
                  <Field label="Manufacturing Date">
                    <Input type="date" value={form.mfgDate} onChange={(e) => set("mfgDate", e.target.value)} />
                  </Field>
                  <Field label="Expiry Date">
                    <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
                  </Field>
                </FieldRow>
              )}
              {form.modules.manufacturing && !form.expiryTracking && (
                <FieldRow>
                  <Field label="Manufacturing Date">
                    <Input type="date" value={form.mfgDate} onChange={(e) => set("mfgDate", e.target.value)} />
                  </Field>
                  <div />
                </FieldRow>
              )}
              {form.modules.warranty && (
                <FieldRow>
                  <Field label="Warranty Period">
                    <Input placeholder="e.g. 12 Months" value={form.warranty} onChange={(e) => set("warranty", e.target.value)} />
                  </Field>
                  <div />
                </FieldRow>
              )}
            </div>

            {/* 12. Offers */}
            <div ref={(el) => { sectionRefs.current.offers = el; }} className="space-y-4 scroll-mt-4">
              <SectionHeader index={12}>Offers</SectionHeader>
              <div className="flex items-center gap-3">
                <Switch id="offer-switch" checked={form.offerEnabled} onCheckedChange={(v) => set("offerEnabled", v)} />
                <Label htmlFor="offer-switch" className="cursor-pointer">Enable Offer for this product</Label>
              </div>
              {form.offerEnabled && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Quick presets (% off)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {OFFER_PRESETS.map((pct) => (
                        <button key={pct} type="button"
                          onClick={() => { set("offerType", "percent"); set("offerValue", String(pct)); }}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full border transition-colors",
                            form.offerValue === String(pct) && form.offerType === "percent"
                              ? "bg-orange-500 text-white border-orange-500"
                              : "border-border text-muted-foreground hover:border-orange-400 hover:text-orange-500",
                          )}>
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <FieldRow cols={3}>
                    <Field label="Discount Type">
                      <Select value={form.offerType} onValueChange={(v) => set("offerType", v as "percent" | "flat")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">% Percentage</SelectItem>
                          <SelectItem value="flat">₹ Flat amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Value">
                      <Input type="number" min="0" placeholder="e.g. 10" value={form.offerValue} onChange={(e) => set("offerValue", e.target.value)} />
                    </Field>
                    <Field label="Label" hint="optional">
                      <Input placeholder="e.g. Festive Sale" value={form.offerLabel} onChange={(e) => set("offerLabel", e.target.value)} />
                    </Field>
                  </FieldRow>
                  {offerBase > 0 && offerVal > 0 && (
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 px-3 py-2.5 flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-orange-500" />
                      <span className="text-muted-foreground line-through">{fmtINR(offerBase)}</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{fmtINR(offerPrice)}</span>
                      <span className="text-xs text-muted-foreground">effective price after offer</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 13. Notes */}
            <div ref={(el) => { sectionRefs.current.notes = el; }} className="space-y-4 scroll-mt-4 pb-6">
              <SectionHeader index={13}>Notes</SectionHeader>
              <Field label="Internal Notes" hint="not shown to customers">
                <Textarea rows={3} placeholder="Anything the team should know…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0 sm:justify-between items-center">
          <p className="text-xs text-muted-foreground">{missingReason || "Ready to save."}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave}>{isEdit ? "Save Changes" : "Save Product"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
