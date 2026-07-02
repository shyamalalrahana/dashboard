import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { products } from "@/server/db/schema/products";
import { retailSaleItems, retailSales } from "@/server/db/schema/sales";

export type SaleItemInput = {
  productId?: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type SaleInput = {
  customer: string;
  customerPhone: string;
  customerEmail: string;
  payment: string;   // Cash | UPI | Card
  subtotal: number;
  gstAmount: number;
  total: number;
  items: SaleItemInput[];
};

export type SaleRecord = {
  id: string;        // sale number, e.g. SAL-011
  dbId: string;      // uuid
  customer: string;
  customerPhone: string;
  customerEmail: string;
  items: SaleItemInput[];
  total: number;
  payment: string;
  status: string;
  createdAt: string;
};

export const fetchSales = createServerFn({ method: "GET" }).handler(async (): Promise<SaleRecord[]> => {
  const sales = await db.select().from(retailSales).orderBy(desc(retailSales.createdAt));
  if (sales.length === 0) return [];
  const items = await db
    .select()
    .from(retailSaleItems)
    .where(inArray(retailSaleItems.saleId, sales.map((s) => s.id)));
  const bySale = new Map<string, SaleItemInput[]>();
  for (const it of items) {
    const list = bySale.get(it.saleId) ?? [];
    list.push({
      productId: it.productId ?? undefined,
      productName: it.productName,
      sku: it.productSku ?? "",
      qty: it.qty,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
    });
    bySale.set(it.saleId, list);
  }
  return sales.map((s) => ({
    id: s.saleNumber,
    dbId: s.id,
    customer: s.customerName ?? "Walk-in",
    customerPhone: s.customerPhone ?? "",
    customerEmail: s.customerEmail ?? "",
    items: bySale.get(s.id) ?? [],
    total: s.totalAmount,
    payment: s.paymentMethod,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  }));
});

export const createSale = createServerFn({ method: "POST" })
  .inputValidator((data: SaleInput) => data)
  .handler(async (ctx): Promise<SaleRecord> => {
    const data = ctx.data;

    // Next sale number from the current max
    const [{ maxNum }] = await db
      .select({ maxNum: sql<string | null>`max(${retailSales.saleNumber})` })
      .from(retailSales);
    const next = maxNum ? Number(maxNum.replace("SAL-", "")) + 1 : 1;
    const saleNumber = `SAL-${String(next).padStart(3, "0")}`;

    const [sale] = await db.insert(retailSales).values({
      saleNumber,
      customerName:  data.customer || null,
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      paymentMethod: data.payment,
      subtotal:      data.subtotal,
      gstAmount:     data.gstAmount,
      totalAmount:   data.total,
      status:        "Paid",
    }).returning();

    if (data.items.length > 0) {
      await db.insert(retailSaleItems).values(data.items.map((it) => ({
        saleId:      sale.id,
        productId:   it.productId ?? null,
        productName: it.productName,
        productSku:  it.sku || null,
        qty:         it.qty,
        unitPrice:   it.unitPrice,
        lineTotal:   it.lineTotal,
      })));

      // Decrement stock for catalogue products
      for (const it of data.items) {
        if (it.productId) {
          await db.update(products)
            .set({ stock: sql`greatest(${products.stock} - ${it.qty}, 0)` })
            .where(eq(products.id, it.productId));
        }
      }
    }

    return {
      id: sale.saleNumber,
      dbId: sale.id,
      customer: sale.customerName ?? "Walk-in",
      customerPhone: sale.customerPhone ?? "",
      customerEmail: sale.customerEmail ?? "",
      items: data.items,
      total: sale.totalAmount,
      payment: sale.paymentMethod,
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
    };
  });

export const deleteSale = createServerFn({ method: "POST" })
  .inputValidator((data: { dbId: string; restock: boolean }) => data)
  .handler(async (ctx) => {
    if (ctx.data.restock) {
      const items = await db.select().from(retailSaleItems).where(eq(retailSaleItems.saleId, ctx.data.dbId));
      for (const it of items) {
        if (it.productId) {
          await db.update(products)
            .set({ stock: sql`${products.stock} + ${it.qty}` })
            .where(eq(products.id, it.productId));
        }
      }
    }
    await db.delete(retailSales).where(eq(retailSales.id, ctx.data.dbId)); // items cascade
    return { ok: true };
  });

// Product list for the sale form dropdown — includes offer fields so the
// counter always sells at the product's current effective (discounted) price.
export const fetchSaleProducts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      mrp: products.mrp,
      sellingPrice: products.sellingPrice,
      stock: products.stock,
      offerEnabled: products.offerEnabled,
      offerType: products.offerType,
      offerValue: products.offerValue,
      offerLabel: products.offerLabel,
    })
    .from(products)
    .where(eq(products.status, "Active"))
    .orderBy(products.name);

  return rows.map((r) => {
    const base = r.sellingPrice || r.mrp;
    const offerValue = Number(r.offerValue ?? 0);
    const effectivePrice = r.offerEnabled && offerValue > 0
      ? (r.offerType === "percent" ? Math.round(base * (1 - offerValue / 100)) : Math.max(0, base - offerValue))
      : base;
    return {
      id: r.id, name: r.name, sku: r.sku, mrp: r.mrp, sellingPrice: r.sellingPrice, stock: r.stock,
      effectivePrice,
      offerEnabled: r.offerEnabled && offerValue > 0,
      offerLabel: r.offerLabel ?? "",
    };
  });
});
