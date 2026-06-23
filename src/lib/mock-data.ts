export const fmtINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

export const financials = {
  revenue: 500000,
  expenses: 350000,
  get profit() {
    return this.revenue - this.expenses;
  },
  get margin() {
    return (this.profit / this.revenue) * 100;
  },
};

export const expenseBreakdown = [
  { name: "Raw Materials", value: 165000 },
  { name: "Salaries & Wages", value: 82000 },
  { name: "Electricity", value: 24000 },
  { name: "Rent", value: 35000 },
  { name: "Transportation", value: 28000 },
  { name: "Miscellaneous", value: 16000 },
];

export const monthlyTrend = [
  { month: "Apr", revenue: 320000, expenses: 240000 },
  { month: "May", revenue: 380000, expenses: 265000 },
  { month: "Jun", revenue: 410000, expenses: 290000 },
  { month: "Jul", revenue: 445000, expenses: 305000 },
  { month: "Aug", revenue: 470000, expenses: 320000 },
  { month: "Sep", revenue: 500000, expenses: 350000 },
];

export const salesOverview = {
  today: 18400,
  week: 112500,
  month: 500000,
};

export const topProducts = [
  { name: "Chyawanprash 500g", sales: 50000, cost: 30000, profit: 20000, sold: 240 },
  { name: "Herbal Hair Oil", sales: 25000, cost: 12000, profit: 13000, sold: 310 },
  { name: "Ashwagandha Churna", sales: 38000, cost: 19000, profit: 19000, sold: 420 },
  { name: "Triphala Tablets", sales: 22000, cost: 11500, profit: 10500, sold: 280 },
  { name: "Brahmi Ghrita", sales: 18000, cost: 9500, profit: 8500, sold: 90 },
];

export const production = {
  manufactured: 1840,
  sold: 1560,
  inventory: 720,
  lowStock: 4,
};

export const cashFlow = {
  received: 412000,
  pending: 88000,
  supplierDue: 64000,
  customerDue: 88000,
};

export const inventory = [
  { sku: "RM-001", name: "Amla (Raw)", type: "Raw Material", qty: 120, unit: "kg", reorder: 50 },
  { sku: "RM-002", name: "Ashwagandha Root", type: "Raw Material", qty: 32, unit: "kg", reorder: 40 },
  { sku: "RM-003", name: "Sesame Oil (Base)", type: "Raw Material", qty: 210, unit: "L", reorder: 80 },
  { sku: "FG-101", name: "Chyawanprash 500g", type: "Finished", qty: 220, unit: "jar", reorder: 100 },
  { sku: "FG-102", name: "Herbal Hair Oil 200ml", type: "Finished", qty: 18, unit: "btl", reorder: 60 },
  { sku: "FG-103", name: "Ashwagandha Churna 100g", type: "Finished", qty: 340, unit: "pkt", reorder: 100 },
  { sku: "FG-104", name: "Triphala Tablets 60ct", type: "Finished", qty: 95, unit: "box", reorder: 100 },
];

export const customers = [
  { id: "C-001", name: "Vedic Wellness Mart", city: "Pune", outstanding: 24000, lastOrder: "2025-09-21" },
  { id: "C-002", name: "Ayur Bazaar", city: "Mumbai", outstanding: 0, lastOrder: "2025-09-28" },
  { id: "C-003", name: "Himalaya Stores", city: "Delhi", outstanding: 41500, lastOrder: "2025-09-12" },
  { id: "C-004", name: "Patanjali Distributor", city: "Lucknow", outstanding: 8500, lastOrder: "2025-09-30" },
  { id: "C-005", name: "Kerala Naturals", city: "Kochi", outstanding: 14000, lastOrder: "2025-09-25" },
];

export const recentSales = [
  { id: "INV-2041", customer: "Ayur Bazaar", date: "2025-09-30", amount: 18400, status: "Paid" },
  { id: "INV-2040", customer: "Vedic Wellness Mart", date: "2025-09-29", amount: 22000, status: "Pending" },
  { id: "INV-2039", customer: "Kerala Naturals", date: "2025-09-28", amount: 14000, status: "Pending" },
  { id: "INV-2038", customer: "Patanjali Distributor", date: "2025-09-27", amount: 31500, status: "Paid" },
  { id: "INV-2037", customer: "Himalaya Stores", date: "2025-09-26", amount: 9800, status: "Paid" },
];

export const recentExpenses = [
  { id: "EXP-309", category: "Raw Materials", note: "Amla procurement — 40kg", date: "2025-09-29", amount: 12800 },
  { id: "EXP-308", category: "Electricity", note: "Sept bill — factory", date: "2025-09-28", amount: 8400 },
  { id: "EXP-307", category: "Salaries", note: "Production staff", date: "2025-09-27", amount: 42000 },
  { id: "EXP-306", category: "Transportation", note: "Dispatch to Mumbai", date: "2025-09-26", amount: 6200 },
  { id: "EXP-305", category: "Misc", note: "Packaging labels", date: "2025-09-25", amount: 3400 },
];

export const batches = [
  { batch: "CHY-25-09-A", product: "Chyawanprash 500g", mfg: "2025-09-05", expiry: "2027-09-04", qty: 220 },
  { batch: "OIL-25-09-B", product: "Herbal Hair Oil", mfg: "2025-09-12", expiry: "2027-03-11", qty: 180 },
  { batch: "ASH-25-08-C", product: "Ashwagandha Churna", mfg: "2025-08-22", expiry: "2026-08-21", qty: 340 },
];
