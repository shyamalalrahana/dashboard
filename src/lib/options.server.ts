import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "@/server/lib/supabase";

// Master data access goes through Supabase's REST API (HTTPS) — see
// products.server.ts for why raw TCP Postgres is not used here.

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
const KIND_TO_COLUMN: Record<OptionKind, string> = {
  category:     "category",
  product_type: "product_type",
  brand:        "brand",
  unit:         "unit",
  tax_profile:  "tax_profile",
  warehouse:    "warehouse",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): OptionValue {
  return { id: r.id, kind: r.kind as OptionKind, value: r.value, meta: (r.meta ?? {}) as OptionMeta };
}

// All active option values, grouped by kind — loaded once per page
export const fetchAllOptions = createServerFn({ method: "GET" }).handler(async (): Promise<OptionsByKind> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("option_values")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load master data: ${error.message}`);
  const grouped: OptionsByKind = {};
  for (const r of data ?? []) {
    (grouped[r.kind] ??= []).push(fromRow(r));
  }
  return grouped;
});

// Always resolves to a real, persisted row — even if the value already exists
// (e.g. because the client's local option list was stale), so the caller can
// always select it. Never returns null in practice.
export const addOption = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: OptionKind; value: string; meta?: OptionMeta }) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();
    const value = ctx.data.value.trim();

    const { data: inserted, error: insertError } = await supabase
      .from("option_values")
      .upsert(
        { kind: ctx.data.kind, value, meta: ctx.data.meta ?? {}, sort: 999 },
        { onConflict: "kind,value", ignoreDuplicates: true },
      )
      .select();
    if (insertError) throw new Error(`Could not add option: ${insertError.message}`);
    if (inserted && inserted.length > 0) return fromRow(inserted[0]);

    // Value already existed — fetch and return the existing row.
    const { data: existing, error: fetchError } = await supabase
      .from("option_values")
      .select("*")
      .eq("kind", ctx.data.kind)
      .eq("value", value)
      .limit(1);
    if (fetchError) throw new Error(`Could not add option: ${fetchError.message}`);
    return existing && existing.length > 0 ? fromRow(existing[0]) : null;
  });

export const renameOption = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; value: string }) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("option_values")
      .update({ value: ctx.data.value.trim() })
      .eq("id", ctx.data.id);
    if (error) throw new Error(`Could not rename option: ${error.message}`);
    return { ok: true };
  });

// Blocks deletion if any product still references this value for its kind.
export const deleteOption = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async (ctx) => {
    const supabase = getSupabaseAdmin();

    const { data: existingRows, error: fetchError } = await supabase
      .from("option_values")
      .select("*")
      .eq("id", ctx.data.id)
      .limit(1);
    if (fetchError) throw new Error(`Could not delete option: ${fetchError.message}`);
    const existing = existingRows?.[0];
    if (!existing) return { ok: true };

    const column = KIND_TO_COLUMN[existing.kind as OptionKind];
    if (column) {
      const { count, error: countError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq(column, existing.value);
      if (countError) throw new Error(`Could not delete option: ${countError.message}`);
      if ((count ?? 0) > 0) {
        return { ok: false, inUseCount: count ?? 0, value: existing.value };
      }
    }

    const { error } = await supabase.from("option_values").delete().eq("id", ctx.data.id);
    if (error) throw new Error(`Could not delete option: ${error.message}`);
    return { ok: true };
  });
