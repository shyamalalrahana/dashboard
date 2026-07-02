import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { optionValues } from "@/server/db/schema/options";
import { products } from "@/server/db/schema/products";

export type OptionKind =
  | "category" | "product_type" | "brand" | "unit"
  | "tax_profile" | "warehouse";

export type OptionMeta = Record<string, string | number | boolean | null>;

export type OptionValue = {
  id: string;
  kind: OptionKind;
  value: string;
  meta: OptionMeta;
};

export type OptionsByKind = Record<string, OptionValue[]>;

// Which products column each option kind is stored against — used to check "in use" before delete.
const KIND_TO_COLUMN = {
  category:     products.category,
  product_type: products.productType,
  brand:        products.brand,
  unit:         products.unit,
  tax_profile:  products.taxProfile,
  warehouse:    products.warehouse,
} as const;

// All active option values, grouped by kind — loaded once per page
export const fetchAllOptions = createServerFn({ method: "GET" }).handler(async (): Promise<OptionsByKind> => {
  const rows = await db
    .select()
    .from(optionValues)
    .where(eq(optionValues.active, true))
    .orderBy(asc(optionValues.sort), asc(optionValues.createdAt));
  const grouped: OptionsByKind = {};
  for (const r of rows) {
    (grouped[r.kind] ??= []).push({
      id: r.id,
      kind: r.kind as OptionKind,
      value: r.value,
      meta: (r.meta ?? {}) as OptionMeta,
    });
  }
  return grouped;
});

// Always resolves to a real, persisted row — even if the value already exists
// (e.g. because the client's local option list was stale), so the caller can
// always select it. Never returns null.
export const addOption = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: OptionKind; value: string; meta?: OptionMeta }) => data)
  .handler(async (ctx) => {
    const value = ctx.data.value.trim();
    const [inserted] = await db
      .insert(optionValues)
      .values({ kind: ctx.data.kind, value, meta: ctx.data.meta ?? {}, sort: 999 })
      .onConflictDoNothing()
      .returning();

    const row = inserted ?? (await db
      .select()
      .from(optionValues)
      .where(and(eq(optionValues.kind, ctx.data.kind), eq(optionValues.value, value)))
      .limit(1))[0];

    if (!row) return null; // should not happen, but keep the type honest
    return { id: row.id, kind: row.kind as OptionKind, value: row.value, meta: (row.meta ?? {}) as OptionMeta };
  });

export const renameOption = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; value: string }) => data)
  .handler(async (ctx) => {
    const [row] = await db
      .update(optionValues)
      .set({ value: ctx.data.value.trim() })
      .where(eq(optionValues.id, ctx.data.id))
      .returning();
    return { ok: !!row };
  });

// Blocks deletion if any product still references this value for its kind.
export const deleteOption = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async (ctx) => {
    const [existing] = await db.select().from(optionValues).where(eq(optionValues.id, ctx.data.id)).limit(1);
    if (!existing) return { ok: true };

    const column = KIND_TO_COLUMN[existing.kind as OptionKind];
    if (column) {
      const [{ value: inUseCount }] = await db.select({ value: count() }).from(products).where(eq(column, existing.value));
      if (Number(inUseCount) > 0) {
        return { ok: false, inUseCount: Number(inUseCount), value: existing.value };
      }
    }

    await db.delete(optionValues).where(eq(optionValues.id, ctx.data.id));
    return { ok: true };
  });
