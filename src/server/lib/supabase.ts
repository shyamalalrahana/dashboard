import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The client is created lazily so a missing env var surfaces as a clear,
// catchable error on the request that needs it — not an import-time crash
// that takes down the whole Worker (Cloudflare error 1101).

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Supabase is not configured: missing ${[!url && "SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", ")} in the server environment.`,
    );
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}
