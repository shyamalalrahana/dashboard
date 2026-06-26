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
  { name: "Purchases", value: 165000 },
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
  pendingPayments: 82000,
  totalOrders: 164,
};

export const salesTrend = [
  { month: "Jan", revenue: 320000, profit: 98000 },
  { month: "Feb", revenue: 285000, profit: 82000 },
  { month: "Mar", revenue: 410000, profit: 128000 },
  { month: "Apr", revenue: 375000, profit: 112000 },
  { month: "May", revenue: 460000, profit: 145000 },
  { month: "Jun", revenue: 500000, profit: 158000 },
];

export const topProducts = [
  { name: "Sunflower Oil 1L", sales: 50000, cost: 30000, profit: 20000, sold: 240 },
  { name: "Basmati Rice 5kg", sales: 38000, cost: 19000, profit: 19000, sold: 420 },
  { name: "Wheat Flour 10kg", sales: 25000, cost: 12000, profit: 13000, sold: 310 },
  { name: "Toor Dal 1kg", sales: 22000, cost: 11500, profit: 10500, sold: 280 },
  { name: "Coconut Oil 500ml", sales: 18000, cost: 9500, profit: 8500, sold: 90 },
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

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  openingStock: number;
  minimumStock: number;
  currentStock: number;
};

export type StockTransaction = {
  id: string;
  itemId: string;
  type: "Stock In" | "Usage";
  quantity: number;
  date: string;
  notes: string;
  balance: number;
};

export const inventoryItems: InventoryItem[] = [
  { id: "ITM-001", name: "Turmeric Powder",    category: "Raw Material",  unit: "kg",  openingStock: 150, minimumStock: 30,  currentStock: 130 },
  { id: "ITM-002", name: "Sunflower Oil (bulk)",category: "Raw Material",  unit: "L",   openingStock: 500, minimumStock: 100, currentStock: 380 },
  { id: "ITM-003", name: "Basmati Rice (bulk)", category: "Raw Material",  unit: "kg",  openingStock: 800, minimumStock: 200, currentStock: 620 },
  { id: "ITM-004", name: "Cardboard Boxes",     category: "Packaging",     unit: "pcs", openingStock: 300, minimumStock: 50,  currentStock: 210 },
  { id: "ITM-005", name: "Polythene Bags",      category: "Packaging",     unit: "roll",openingStock: 15,  minimumStock: 20,  currentStock: 12 },
  { id: "ITM-006", name: "Sunflower Oil 1L",    category: "Finished",      unit: "btl", openingStock: 220, minimumStock: 100, currentStock: 185 },
  { id: "ITM-007", name: "Basmati Rice 5kg",    category: "Finished",      unit: "bag", openingStock: 80,  minimumStock: 60,  currentStock: 18 },
  { id: "ITM-008", name: "Wheat Flour 10kg",    category: "Finished",      unit: "bag", openingStock: 200, minimumStock: 100, currentStock: 340 },
  { id: "ITM-009", name: "Toor Dal 1kg",        category: "Finished",      unit: "pkt", openingStock: 120, minimumStock: 100, currentStock: 95 },
  { id: "ITM-010", name: "Coconut Oil 500ml",   category: "Finished",      unit: "btl", openingStock: 60,  minimumStock: 50,  currentStock: 42 },
];

export const stockTransactions: StockTransaction[] = [
  // Turmeric Powder (ITM-001) — opening 150
  { id: "TXN-001", itemId: "ITM-001", type: "Stock In", quantity: 50,  date: "2025-08-05", notes: "Supplier delivery",           balance: 200 },
  { id: "TXN-002", itemId: "ITM-001", type: "Usage",    quantity: 40,  date: "2025-08-12", notes: "Production batch Aug-01",      balance: 160 },
  { id: "TXN-003", itemId: "ITM-001", type: "Usage",    quantity: 30,  date: "2025-09-02", notes: "Production batch Sep-01",      balance: 130 },

  // Sunflower Oil bulk (ITM-002) — opening 500
  { id: "TXN-004", itemId: "ITM-002", type: "Usage",    quantity: 80,  date: "2025-08-10", notes: "Bottling run #14",             balance: 420 },
  { id: "TXN-005", itemId: "ITM-002", type: "Stock In", quantity: 100, date: "2025-08-20", notes: "Restock from distributor",     balance: 520 },
  { id: "TXN-006", itemId: "ITM-002", type: "Usage",    quantity: 140, date: "2025-09-08", notes: "Bottling run #15",             balance: 380 },

  // Basmati Rice bulk (ITM-003)
  { id: "TXN-007", itemId: "ITM-003", type: "Usage",    quantity: 100, date: "2025-08-15", notes: "Packing run Aug",              balance: 700 },
  { id: "TXN-008", itemId: "ITM-003", type: "Stock In", quantity: 200, date: "2025-08-28", notes: "Wholesale purchase",          balance: 900 },
  { id: "TXN-009", itemId: "ITM-003", type: "Usage",    quantity: 280, date: "2025-09-10", notes: "Packing run Sep",              balance: 620 },

  // Cardboard Boxes (ITM-004)
  { id: "TXN-010", itemId: "ITM-004", type: "Usage",    quantity: 120, date: "2025-08-18", notes: "Dispatch packaging",          balance: 180 },
  { id: "TXN-011", itemId: "ITM-004", type: "Stock In", quantity: 150, date: "2025-09-01", notes: "Box supplier order",          balance: 330 },
  { id: "TXN-012", itemId: "ITM-004", type: "Usage",    quantity: 120, date: "2025-09-20", notes: "Dispatch packaging",          balance: 210 },

  // Polythene Bags (ITM-005) — low stock
  { id: "TXN-013", itemId: "ITM-005", type: "Usage",    quantity: 5,   date: "2025-09-05", notes: "Retail packing",              balance: 10 },
  { id: "TXN-014", itemId: "ITM-005", type: "Stock In", quantity: 8,   date: "2025-09-15", notes: "Emergency restock",           balance: 18 },
  { id: "TXN-015", itemId: "ITM-005", type: "Usage",    quantity: 6,   date: "2025-09-25", notes: "Retail packing",              balance: 12 },

  // Sunflower Oil 1L (ITM-006)
  { id: "TXN-016", itemId: "ITM-006", type: "Stock In", quantity: 100, date: "2025-08-22", notes: "Production output",           balance: 320 },
  { id: "TXN-017", itemId: "ITM-006", type: "Usage",    quantity: 135, date: "2025-09-05", notes: "Sales dispatch — INV-2038",   balance: 185 },

  // Basmati Rice 5kg (ITM-007) — low stock
  { id: "TXN-018", itemId: "ITM-007", type: "Usage",    quantity: 50,  date: "2025-08-20", notes: "Sales dispatch — INV-2033",   balance: 30 },
  { id: "TXN-019", itemId: "ITM-007", type: "Stock In", quantity: 40,  date: "2025-09-01", notes: "Production batch",            balance: 70 },
  { id: "TXN-020", itemId: "ITM-007", type: "Usage",    quantity: 52,  date: "2025-09-18", notes: "Sales dispatch — INV-2041",   balance: 18 },

  // Wheat Flour 10kg (ITM-008)
  { id: "TXN-021", itemId: "ITM-008", type: "Stock In", quantity: 200, date: "2025-09-03", notes: "Production batch",            balance: 400 },
  { id: "TXN-022", itemId: "ITM-008", type: "Usage",    quantity: 60,  date: "2025-09-22", notes: "Sales dispatch",              balance: 340 },

  // Toor Dal 1kg (ITM-009) — near min
  { id: "TXN-023", itemId: "ITM-009", type: "Usage",    quantity: 30,  date: "2025-09-08", notes: "Sales dispatch",              balance: 90 },
  { id: "TXN-024", itemId: "ITM-009", type: "Stock In", quantity: 35,  date: "2025-09-16", notes: "Production output",           balance: 125 },
  { id: "TXN-025", itemId: "ITM-009", type: "Usage",    quantity: 30,  date: "2025-09-28", notes: "Sales dispatch",              balance: 95 },

  // Coconut Oil 500ml (ITM-010) — near min
  { id: "TXN-026", itemId: "ITM-010", type: "Usage",    quantity: 20,  date: "2025-09-10", notes: "Sales dispatch",              balance: 40 },
  { id: "TXN-027", itemId: "ITM-010", type: "Stock In", quantity: 22,  date: "2025-09-20", notes: "Production output",           balance: 62 },
  { id: "TXN-028", itemId: "ITM-010", type: "Usage",    quantity: 20,  date: "2025-09-29", notes: "Sales dispatch",              balance: 42 },
];

// keep old inventory export for any remaining references
export const inventory = [
  { sku: "RM-001", name: "Cardboard Boxes (S)", type: "Raw Material", qty: 120, unit: "pcs", reorder: 50 },
  { sku: "RM-002", name: "Polythene Bags", type: "Raw Material", qty: 32, unit: "roll", reorder: 40 },
  { sku: "RM-003", name: "Bubble Wrap", type: "Raw Material", qty: 210, unit: "m", reorder: 80 },
  { sku: "FG-101", name: "Sunflower Oil 1L", type: "Finished", qty: 220, unit: "btl", reorder: 100 },
  { sku: "FG-102", name: "Basmati Rice 5kg", type: "Finished", qty: 18, unit: "bag", reorder: 60 },
  { sku: "FG-103", name: "Wheat Flour 10kg", type: "Finished", qty: 340, unit: "bag", reorder: 100 },
  { sku: "FG-104", name: "Toor Dal 1kg", type: "Finished", qty: 95, unit: "pkt", reorder: 100 },
];

export const customers = [
  { id: "C-001", name: "Metro General Store", city: "Pune", phone: "9823456701", email: "metro@example.com", outstanding: 24000, lastOrder: "2025-09-21" },
  { id: "C-002", name: "City Mart", city: "Mumbai", phone: "9812345678", email: "citymart@example.com", outstanding: 0, lastOrder: "2025-09-28" },
  { id: "C-003", name: "Star Supermarket", city: "Delhi", phone: "9811223344", email: "star@example.com", outstanding: 41500, lastOrder: "2025-09-12" },
  { id: "C-004", name: "Raja Wholesale", city: "Lucknow", phone: "9933445566", email: "raja@example.com", outstanding: 8500, lastOrder: "2025-09-30" },
  { id: "C-005", name: "Fresh Daily Stores", city: "Kochi", phone: "9744556677", email: "fresh@example.com", outstanding: 14000, lastOrder: "2025-09-25" },
];

export type CustomerOrder = {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  paidAmount: number;
  status: "Paid" | "Partial" | "Pending";
  items: string;
};

export const customerOrders: CustomerOrder[] = [
  // Metro General Store — C-001
  { id: "INV-2040", customerId: "C-001", date: "2025-09-21", amount: 22000, paidAmount: 0, status: "Pending", items: "Sunflower Oil 1L ×40, Wheat Flour 10kg ×20" },
  { id: "INV-2031", customerId: "C-001", date: "2025-09-10", amount: 18500, paidAmount: 18500, status: "Paid", items: "Basmati Rice 5kg ×30, Toor Dal 1kg ×50" },
  { id: "INV-2022", customerId: "C-001", date: "2025-08-28", amount: 24000, paidAmount: 0, status: "Pending", items: "Sunflower Oil 1L ×60, Coconut Oil 500ml ×20" },
  { id: "INV-2015", customerId: "C-001", date: "2025-08-15", amount: 14800, paidAmount: 14800, status: "Paid", items: "Wheat Flour 10kg ×30, Toor Dal 1kg ×40" },
  { id: "INV-2006", customerId: "C-001", date: "2025-07-31", amount: 19200, paidAmount: 19200, status: "Paid", items: "Basmati Rice 5kg ×25, Sunflower Oil 1L ×20" },

  // City Mart — C-002
  { id: "INV-2041", customerId: "C-002", date: "2025-09-28", amount: 18400, paidAmount: 18400, status: "Paid", items: "Sunflower Oil 1L ×30, Wheat Flour 10kg ×15" },
  { id: "INV-2033", customerId: "C-002", date: "2025-09-14", amount: 31000, paidAmount: 31000, status: "Paid", items: "Basmati Rice 5kg ×50, Coconut Oil 500ml ×30" },
  { id: "INV-2024", customerId: "C-002", date: "2025-08-30", amount: 22500, paidAmount: 22500, status: "Paid", items: "Sunflower Oil 1L ×50, Toor Dal 1kg ×30" },
  { id: "INV-2017", customerId: "C-002", date: "2025-08-18", amount: 17200, paidAmount: 17200, status: "Paid", items: "Wheat Flour 10kg ×20, Basmati Rice 5kg ×15" },

  // Star Supermarket — C-003
  { id: "INV-2037", customerId: "C-003", date: "2025-09-12", amount: 9800, paidAmount: 9800, status: "Paid", items: "Coconut Oil 500ml ×40, Toor Dal 1kg ×20" },
  { id: "INV-2029", customerId: "C-003", date: "2025-09-03", amount: 41500, paidAmount: 0, status: "Pending", items: "Sunflower Oil 1L ×80, Basmati Rice 5kg ×40, Wheat Flour 10kg ×30" },
  { id: "INV-2020", customerId: "C-003", date: "2025-08-22", amount: 28000, paidAmount: 28000, status: "Paid", items: "Basmati Rice 5kg ×60, Toor Dal 1kg ×50" },
  { id: "INV-2011", customerId: "C-003", date: "2025-08-05", amount: 16500, paidAmount: 16500, status: "Paid", items: "Sunflower Oil 1L ×30, Coconut Oil 500ml ×25" },

  // Raja Wholesale — C-004
  { id: "INV-2038", customerId: "C-004", date: "2025-09-27", amount: 31500, paidAmount: 31500, status: "Paid", items: "Sunflower Oil 1L ×70, Basmati Rice 5kg ×20" },
  { id: "INV-2032", customerId: "C-004", date: "2025-09-11", amount: 8500, paidAmount: 0, status: "Pending", items: "Wheat Flour 10kg ×15, Toor Dal 1kg ×20" },
  { id: "INV-2025", customerId: "C-004", date: "2025-08-29", amount: 24000, paidAmount: 24000, status: "Paid", items: "Basmati Rice 5kg ×35, Sunflower Oil 1L ×25" },
  { id: "INV-2016", customerId: "C-004", date: "2025-08-17", amount: 11000, paidAmount: 11000, status: "Paid", items: "Coconut Oil 500ml ×30, Toor Dal 1kg ×30" },

  // Fresh Daily Stores — C-005
  { id: "INV-2039", customerId: "C-005", date: "2025-09-25", amount: 14000, paidAmount: 0, status: "Pending", items: "Sunflower Oil 1L ×25, Wheat Flour 10kg ×10" },
  { id: "INV-2030", customerId: "C-005", date: "2025-09-07", amount: 19500, paidAmount: 19500, status: "Paid", items: "Basmati Rice 5kg ×30, Coconut Oil 500ml ×20" },
  { id: "INV-2021", customerId: "C-005", date: "2025-08-25", amount: 12800, paidAmount: 12800, status: "Paid", items: "Toor Dal 1kg ×40, Wheat Flour 10kg ×12" },
  { id: "INV-2012", customerId: "C-005", date: "2025-08-08", amount: 22000, paidAmount: 22000, status: "Paid", items: "Sunflower Oil 1L ×45, Basmati Rice 5kg ×20" },
];

export type CustomerPayment = {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  note: string;
};

export const customerPayments: CustomerPayment[] = [
  { id: "PAY-001", customerId: "C-001", date: "2025-09-15", amount: 10000, note: "Cash payment towards INV-2031" },
  { id: "PAY-002", customerId: "C-001", date: "2025-09-20", amount: 8500, note: "UPI transfer" },
  { id: "PAY-003", customerId: "C-003", date: "2025-09-10", amount: 20000, note: "Cheque — partial advance" },
  { id: "PAY-004", customerId: "C-004", date: "2025-09-20", amount: 15000, note: "Cash" },
  { id: "PAY-005", customerId: "C-005", date: "2025-09-18", amount: 12000, note: "UPI payment" },
];

export const recentSales = [
  { id: "INV-2041", customer: "City Mart", date: "2025-09-30", amount: 18400, status: "Paid" },
  { id: "INV-2040", customer: "Metro General Store", date: "2025-09-29", amount: 22000, status: "Pending" },
  { id: "INV-2039", customer: "Fresh Daily Stores", date: "2025-09-28", amount: 14000, status: "Pending" },
  { id: "INV-2038", customer: "Raja Wholesale", date: "2025-09-27", amount: 31500, status: "Paid" },
  { id: "INV-2037", customer: "Star Supermarket", date: "2025-09-26", amount: 9800, status: "Paid" },
];

export const recentExpenses = [
  { id: "EXP-309", category: "Purchases", note: "Rice procurement — 200kg", date: "2025-09-29", amount: 12800 },
  { id: "EXP-308", category: "Electricity", note: "Sept bill — shop", date: "2025-09-28", amount: 8400 },
  { id: "EXP-307", category: "Salaries", note: "Shop staff — September", date: "2025-09-27", amount: 42000 },
  { id: "EXP-306", category: "Transportation", note: "Delivery to Mumbai", date: "2025-09-26", amount: 6200 },
  { id: "EXP-305", category: "Misc", note: "Packaging supplies", date: "2025-09-25", amount: 3400 },
];

export type ExpenseEntry = {
  id: string;
  category: string;
  note: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Approved" | "Rejected";
  vendor: string;
  paymentMethod: "Cash" | "Bank Transfer" | "UPI" | "Credit Card" | "Cheque";
  hasAttachment: boolean;
};

export const expenseEntries: ExpenseEntry[] = [
  // Today — 2026-06-26
  { id: "EXP-401", category: "Purchases",      note: "Sunflower Oil bulk — 200L",      date: "2026-06-26", amount: 18400, status: "Pending",  vendor: "Sri Traders",       paymentMethod: "Bank Transfer", hasAttachment: true  },
  { id: "EXP-402", category: "Transportation",  note: "Delivery run — Pune",            date: "2026-06-26", amount: 3200,  status: "Paid",     vendor: "Fast Logistics",    paymentMethod: "Cash",          hasAttachment: false },

  // This week — 2026-06-23 to 2026-06-25
  { id: "EXP-400", category: "Electricity",     note: "June electricity bill",          date: "2026-06-25", amount: 9100,  status: "Paid",     vendor: "MSEDCL",            paymentMethod: "UPI",           hasAttachment: true  },
  { id: "EXP-399", category: "Misc",            note: "Stationery and office supplies", date: "2026-06-24", amount: 1850,  status: "Approved", vendor: "Office Depot",      paymentMethod: "Cash",          hasAttachment: false },
  { id: "EXP-398", category: "Purchases",       note: "Toor Dal — 300kg",               date: "2026-06-23", amount: 24000, status: "Approved", vendor: "Ravi Agro",         paymentMethod: "Cheque",        hasAttachment: true  },

  // This month (June 2026) — earlier
  { id: "EXP-397", category: "Rent",            note: "Shop rent — June",               date: "2026-06-10", amount: 35000, status: "Paid",     vendor: "Property Owner",    paymentMethod: "Bank Transfer", hasAttachment: false },
  { id: "EXP-396", category: "Salaries",        note: "Staff salaries — June advance",  date: "2026-06-07", amount: 42000, status: "Paid",     vendor: "Internal",          paymentMethod: "Bank Transfer", hasAttachment: false },
  { id: "EXP-395", category: "Purchases",       note: "Rice — 500kg bulk",              date: "2026-06-05", amount: 32000, status: "Pending",  vendor: "Annapoorna Traders",paymentMethod: "Cheque",        hasAttachment: true  },
  { id: "EXP-394", category: "Transportation",  note: "Truck hire — weekly run",        date: "2026-06-03", amount: 7500,  status: "Paid",     vendor: "Shree Transport",   paymentMethod: "Cash",          hasAttachment: false },
  { id: "EXP-393", category: "Misc",            note: "Website hosting renewal",        date: "2026-06-01", amount: 4200,  status: "Approved", vendor: "GoDaddy",           paymentMethod: "Credit Card",   hasAttachment: true  },

  // Older entries
  { id: "EXP-392", category: "Purchases",       note: "Wheat Flour — 400kg",            date: "2026-05-28", amount: 22000, status: "Paid",     vendor: "Golden Grains",     paymentMethod: "Bank Transfer", hasAttachment: true  },
  { id: "EXP-391", category: "Salaries",        note: "Staff salaries — May",           date: "2026-05-27", amount: 42000, status: "Paid",     vendor: "Internal",          paymentMethod: "Bank Transfer", hasAttachment: false },
  { id: "EXP-390", category: "Electricity",     note: "May electricity bill",           date: "2026-05-26", amount: 8700,  status: "Paid",     vendor: "MSEDCL",            paymentMethod: "UPI",           hasAttachment: true  },
  { id: "EXP-389", category: "Rent",            note: "Shop rent — May",                date: "2026-05-10", amount: 35000, status: "Paid",     vendor: "Property Owner",    paymentMethod: "Bank Transfer", hasAttachment: false },
  { id: "EXP-388", category: "Purchases",       note: "Coconut Oil — 100L",             date: "2026-05-08", amount: 14500, status: "Rejected", vendor: "Coastal Oils",      paymentMethod: "UPI",           hasAttachment: false },
  { id: "EXP-387", category: "Transportation",  note: "Delivery — Nashik route",        date: "2026-05-05", amount: 5800,  status: "Paid",     vendor: "Fast Logistics",    paymentMethod: "Cash",          hasAttachment: true  },
];

export const recentActivity = [
  { time: "10:25", type: "payment",  label: "Payment received from City Mart",        sub: "₹18,400 · INV-2041" },
  { time: "10:18", type: "stock",    label: "Stock updated — Sunflower Oil 1L",        sub: "+40 bottles added" },
  { time: "10:16", type: "expense",  label: "Expense added — Delivery run Pune",        sub: "₹3,200 · Transportation" },
  { time: "10:12", type: "invoice",  label: "Invoice #2041 created for City Mart",      sub: "₹18,400" },
  { time: "09:54", type: "customer", label: "New customer added — Sunrise Stores",      sub: "" },
  { time: "09:40", type: "invoice",  label: "Invoice #2040 created for Metro General",  sub: "₹22,000 · Pending" },
];

export const productCatalog = [
  "Sunflower Oil 1L",
  "Basmati Rice 5kg",
  "Wheat Flour 10kg",
  "Shampoo 200ml",
  "Detergent Powder 1kg",
  "Toor Dal 1kg",
];

export const batches = [
  { batch: "OIL-25-09-A", product: "Sunflower Oil 1L", mfg: "2025-09-05", expiry: "2027-09-04", qty: 220 },
  { batch: "RIC-25-09-B", product: "Basmati Rice 5kg", mfg: "2025-09-12", expiry: "2027-03-11", qty: 180 },
  { batch: "FLR-25-08-C", product: "Wheat Flour 10kg", mfg: "2025-08-22", expiry: "2026-08-21", qty: 340 },
];
