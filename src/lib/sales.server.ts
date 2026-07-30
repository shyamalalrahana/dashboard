import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "@/server/lib/supabase";

// Sales persistence goes through Supabase's REST API (PostgREST) over HTTPS —
// see products.server.ts for why raw TCP Postgres is not used here.

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
  const supabase = getSupabaseAdmin();

  const { data: sales, error: salesError } = await supabase
    .from("retail_sales")
    .select("*")
    .order("created_at", { ascending: false });
  if (salesError) throw new Error(`Could not load sales: ${salesError.message}`);
  if (!sales || sales.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("retail_sale_items")
    .select("*")
    .in("sale_id", sales.map((s) => s.id));
  if (itemsError) throw new Error(`Could not load sale items: ${itemsError.message}`);

  const bySale = new Map<string, SaleItemInput[]>();
  for (const it of items ?? []) {
    const list = bySale.get(it.sale_id) ?? [];
    list.push({
      productId: it.product_id ?? undefined,
      productName: it.product_name,
      sku: it.product_sku ?? "",
      qty: it.qty,
      unitPrice: it.unit_price,
      lineTotal: it.line_total,
    });
    bySale.set(it.sale_id, list);
  }

  return sales.map((s) => ({
    id: s.sale_number,
    dbId: s.id,
    customer: s.customer_name ?? "Walk-in",
    customerPhone: s.customer_phone ?? "",
    customerEmail: s.customer_email ?? "",
    items: bySale.get(s.id) ?? [],
    total: s.total_amount,
    payment: s.payment_method,
    status: s.status,
    createdAt: s.created_at,
  }));
});

export const createSale = createServerFn({ method: "POST" })
  .inputValidator((data: SaleInput) => data)
  .handler(async (ctx): Promise<SaleRecord> => {
    const supabase = getSupabaseAdmin();
    const data = ctx.data;

    // Next sale number from the current highest one
    const { data: latest, error: latestError } = await supabase
      .from("retail_sales")
      .select("sale_number")
      .order("sale_number", { ascending: false })
      .limit(1);
    if (latestError) throw new Error(`Could not save sale: ${latestError.message}`);
    const next = latest?.[0]?.sale_number
      ? Number(String(latest[0].sale_number).replace("SAL-", "")) + 1
      : 1;
    const saleNumber = `SAL-${String(next).padStart(3, "0")}`;

    const { data: sale, error: saleError } = await supabase
      .from("retail_sales")
      .insert({
        sale_number:    saleNumber,
        customer_name:  data.customer || null,
        customer_phone: data.customerPhone || null,
        customer_email: data.customerEmail || null,
        payment_method: data.payment,
        subtotal:       data.subtotal,
        gst_amount:     data.gstAmount,
        total_amount:   data.total,
        status:         "Paid",
      })
      .select()
      .single();
    if (saleError) throw new Error(`Could not save sale: ${saleError.message}`);

    if (data.items.length > 0) {
      const { error: itemsError } = await supabase.from("retail_sale_items").insert(
        data.items.map((it) => ({
          sale_id:      sale.id,
          product_id:   it.productId ?? null,
          product_name: it.productName,
          product_sku:  it.sku || null,
          qty:          it.qty,
          unit_price:   it.unitPrice,
          line_total:   it.lineTotal,
        })),
      );
      if (itemsError) throw new Error(`Could not save sale items: ${itemsError.message}`);

      await adjustStock(data.items, "decrement");
    }

    return {
      id: sale.sale_number,
      dbId: sale.id,
      customer: sale.customer_name ?? "Walk-in",
      customerPhone: sale.customer_phone ?? "",
      customerEmail: sale.customer_email ?? "",
      items: data.items,
      total: sale.total_amount,
      payment: sale.payment_method,
      status: sale.status,
      createdAt: sale.created_at,
    };
  });

export const deleteSale = createServerFn({ method: "POST" })
  .inputValidator((data: { dbId: string; restock: boolean }) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();

    if (ctx.data.restock) {
      const { data: items, error } = await supabase
        .from("retail_sale_items")
        .select("product_id, qty")
        .eq("sale_id", ctx.data.dbId);
      if (error) throw new Error(`Could not delete sale: ${error.message}`);
      await adjustStock(
        (items ?? []).map((it) => ({ productId: it.product_id ?? undefined, qty: it.qty })),
        "increment",
      );
    }

    // retail_sale_items rows cascade on delete
    const { error: deleteError } = await supabase.from("retail_sales").delete().eq("id", ctx.data.dbId);
    if (deleteError) throw new Error(`Could not delete sale: ${deleteError.message}`);
    return { ok: true };
  });

// Adds or removes sold quantities from product stock. PostgREST has no
// expression update, so each affected product is read then written back.
async function adjustStock(
  items: Array<{ productId?: string; qty: number }>,
  direction: "increment" | "decrement",
) {
  const supabase = getSupabaseAdmin();
  const withIds = items.filter((it) => it.productId);
  if (withIds.length === 0) return;

  const { data: rows, error } = await supabase
    .from("products")
    .select("id, stock")
    .in("id", withIds.map((it) => it.productId!));
  if (error || !rows) return; // stock adjustment is best-effort; the sale itself is already recorded

  const stockById = new Map(rows.map((r) => [r.id, r.stock ?? 0]));
  for (const it of withIds) {
    const current = stockById.get(it.productId!);
    if (current === undefined) continue;
    const next = direction === "decrement"
      ? Math.max(0, current - it.qty)
      : current + it.qty;
    await supabase.from("products").update({ stock: next }).eq("id", it.productId!);
  }
}

// Product list for the sale form dropdown — includes offer fields so the
// counter always sells at the product's current effective (discounted) price.
export const fetchSaleProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, mrp, selling_price, stock, offer_enabled, offer_type, offer_value, offer_label")
    .eq("status", "Active")
    .order("name", { ascending: true });
  if (error) throw new Error(`Could not load products: ${error.message}`);

  return (data ?? []).map((r) => {
    const sellingPrice = r.selling_price ?? 0;
    const mrp = r.mrp ?? 0;
    const base = sellingPrice || mrp;
    const offerValue = Number(r.offer_value ?? 0);
    const effectivePrice = r.offer_enabled && offerValue > 0
      ? (r.offer_type === "percent" ? Math.round(base * (1 - offerValue / 100)) : Math.max(0, base - offerValue))
      : base;
    return {
      id: r.id, name: r.name, sku: r.sku, mrp, sellingPrice, stock: r.stock ?? 0,
      effectivePrice,
      offerEnabled: Boolean(r.offer_enabled) && offerValue > 0,
      offerLabel: r.offer_label ?? "",
    };
  });
});
