import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { activityLog } from "@/server/db/schema/staff";
import { requireAdmin } from "@/server/lib/session";

// Values must be JSON-serialisable for the server-function boundary, so the
// detail payload is typed concretely rather than as `unknown`.
export type DetailValue = string | number | boolean | null | Array<string | number>;
export type ActivityDetail = Record<string, DetailValue>;

export type ActivityEntry = {
  id: string;
  staffName: string;
  action: string;
  entity: string;
  entityId: string;
  detail: ActivityDetail;
  createdAt: string;
};

/**
 * The audit trail is admin-only: it is what answers "who changed this price"
 * or "who deleted that bill", so staff must not be able to read or edit it.
 */
export const fetchActivity = createServerFn({ method: "GET" })
  .inputValidator((data: { action?: string; limit?: number } | undefined) => data ?? {})
  .handler(async (ctx): Promise<ActivityEntry[]> => {
    await requireAdmin();
    const limit = Math.min(ctx.data.limit ?? 200, 500);

    const base = db.select().from(activityLog);
    const rows = ctx.data.action
      ? await base.where(eq(activityLog.action, ctx.data.action)).orderBy(desc(activityLog.createdAt)).limit(limit)
      : await base.orderBy(desc(activityLog.createdAt)).limit(limit);

    return rows.map((r) => ({
      id: r.id,
      staffName: r.staffName ?? "—",
      action: r.action,
      entity: r.entity ?? "",
      entityId: r.entityId ?? "",
      detail: (r.detail ?? {}) as ActivityDetail,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    }));
  });

/** Distinct actions present in the log, for the filter dropdown. */
export const fetchActivityActions = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  await requireAdmin();
  const rows = await db.selectDistinct({ action: activityLog.action }).from(activityLog);
  return rows.map((r) => r.action).sort();
});
