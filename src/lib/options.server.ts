import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { optionValues } from "@/server/db/schema/options";

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

export const addOption = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: OptionKind; value: string; meta?: OptionMeta }) => data)
  .handler(async (ctx) => {
    const [row] = await db
      .insert(optionValues)
      .values({ kind: ctx.data.kind, value: ctx.data.value.trim(), meta: ctx.data.meta ?? {}, sort: 999 })
      .onConflictDoNothing()
      .returning();
    return row
      ? { id: row.id, kind: row.kind as OptionKind, value: row.value, meta: (row.meta ?? {}) as OptionMeta }
      : null; // already existed
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

export const deleteOption = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async (ctx) => {
    await db.delete(optionValues).where(eq(optionValues.id, ctx.data.id));
    return { ok: true };
  });

// Convenience: delete by kind+value (used by inline editors that only know the label)
export const deleteOptionByValue = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: OptionKind; value: string }) => data)
  .handler(async (ctx) => {
    await db.delete(optionValues).where(
      and(eq(optionValues.kind, ctx.data.kind), eq(optionValues.value, ctx.data.value))
    );
    return { ok: true };
  });
