// Typed settings store backed by localStorage.
// Settings page writes here; other pages read from here.

export type BusinessSettings = {
  name: string;
  type: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  currency: string;
  timezone: string;
  language: string;
};

export type FinancialSettings = {
  fyStart: string;
  currency: string;
  decimal: string;
};

export type TaxSettings = {
  gstEnabled: boolean;
  gstin: string;
  defaultRate: string;   // "0" | "5" | "12" | "18" | "28"
  taxMode: string;       // "Inclusive" | "Exclusive"
  returnFreq: string;
  hsnRequired: boolean;
};

export type InvoiceSettings = {
  prefix: string;
  nextNumber: string;
  format: string;
  terms: string;
  qrCode: boolean;
  signature: boolean;
};

export type InventorySettings = {
  lowStockThreshold: string;
  allowNegative: boolean;
  barcodeAuto: boolean;
  expiryTracking: boolean;
  batchTracking: boolean;
};

export type NotifSettings = {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  lowStock: boolean;
  batchExpiry: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  gstAutoReport: boolean;
};

export type AllSettings = {
  business: BusinessSettings;
  financial: FinancialSettings;
  taxes: TaxSettings;
  invoice: InvoiceSettings;
  inventory: InventorySettings;
  notifs: NotifSettings;
};

const DEFAULTS: AllSettings = {
  business: {
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
  },
  financial: {
    fyStart: "April",
    currency: "INR",
    decimal: "2",
  },
  taxes: {
    gstEnabled: true,
    gstin: "27ABCDE1234F1Z5",
    defaultRate: "18",
    taxMode: "Exclusive",
    returnFreq: "Monthly",
    hsnRequired: true,
  },
  invoice: {
    prefix: "INV-",
    nextNumber: "2042",
    format: "A4",
    terms: "Goods once sold will not be returned. Payment due within 30 days.",
    qrCode: true,
    signature: false,
  },
  inventory: {
    lowStockThreshold: "20",
    allowNegative: false,
    barcodeAuto: true,
    expiryTracking: true,
    batchTracking: true,
  },
  notifs: {
    email: true,
    sms: false,
    whatsapp: false,
    lowStock: true,
    batchExpiry: true,
    dailySummary: true,
    weeklyReport: true,
    gstAutoReport: false,
  },
};

const KEY = "shopos_settings";

export function loadSettings(): AllSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    // Deep merge so new keys added to DEFAULTS are always present
    const saved = JSON.parse(raw) as Partial<AllSettings>;
    return {
      business:  { ...DEFAULTS.business,  ...(saved.business  ?? {}) },
      financial: { ...DEFAULTS.financial, ...(saved.financial ?? {}) },
      taxes:     { ...DEFAULTS.taxes,     ...(saved.taxes     ?? {}) },
      invoice:   { ...DEFAULTS.invoice,   ...(saved.invoice   ?? {}) },
      inventory: { ...DEFAULTS.inventory, ...(saved.inventory ?? {}) },
      notifs:    { ...DEFAULTS.notifs,    ...(saved.notifs    ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: AllSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function loadTaxSettings(): TaxSettings {
  return loadSettings().taxes;
}

export function loadBusinessSettings(): BusinessSettings {
  return loadSettings().business;
}

export function loadInvoiceSettings(): InvoiceSettings {
  return loadSettings().invoice;
}

/** Compute GST amounts given a subtotal and tax config. */
export function computeGST(
  subtotal: number,
  tax: TaxSettings
): { taxable: number; gstAmount: number; total: number; rateLabel: string } {
  if (!tax.gstEnabled || tax.defaultRate === "0") {
    return { taxable: subtotal, gstAmount: 0, total: subtotal, rateLabel: "" };
  }
  const rate = Number(tax.defaultRate) / 100;
  const rateLabel = `GST ${tax.defaultRate}%`;
  if (tax.taxMode === "Inclusive") {
    // Price already includes tax
    const taxable = Math.round(subtotal / (1 + rate));
    const gstAmount = subtotal - taxable;
    return { taxable, gstAmount, total: subtotal, rateLabel: `${rateLabel} incl.` };
  } else {
    // Exclusive: add tax on top
    const gstAmount = Math.round(subtotal * rate);
    return { taxable: subtotal, gstAmount, total: subtotal + gstAmount, rateLabel };
  }
}
