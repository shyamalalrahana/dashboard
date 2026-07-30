// Weekly database health check and optimisation.
//   npm run db:maintenance
//
// Run automatically by the scheduled maintenance job, and worth running by hand
// after a power cut or any time the app feels slow.

import Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DB_PATH = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

if (!existsSync(DB_PATH)) {
  console.error(`No database at ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("busy_timeout = 10000");

const before = statSync(DB_PATH).size;

// 1. Integrity — the check that actually matters after an unclean shutdown.
const integrity = db.pragma("integrity_check", { simple: true });
if (integrity !== "ok") {
  console.error(`INTEGRITY CHECK FAILED: ${integrity}`);
  console.error("Do not keep using this database. Restore the most recent good backup:");
  console.error("  npm run db:restore");
  db.close();
  process.exit(2);
}
log("Integrity check: ok");

// 2. Foreign keys — orphaned rows would mean sale items pointing at nothing.
const orphans = db.pragma("foreign_key_check");
if (orphans.length > 0) {
  log(`WARNING: ${orphans.length} foreign key violation(s) found`);
  for (const o of orphans.slice(0, 5)) log(`  ${o.table} row ${o.rowid} → ${o.parent}`);
} else {
  log("Foreign keys: ok");
}

// 3. Reclaim space and refresh query planner statistics.
db.exec("VACUUM");
db.exec("ANALYZE");
db.pragma("wal_checkpoint(TRUNCATE)");

const after = statSync(DB_PATH).size;
const saved = ((before - after) / 1024).toFixed(0);
log(`Optimised: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB${saved > 0 ? ` (freed ${saved} KB)` : ""}`);

// 4. A quick sense of scale, so growth is visible over time.
for (const t of ["products", "retail_sales", "retail_sale_items", "activity_log", "sessions"]) {
  try {
    log(`  ${t.padEnd(20)} ${db.prepare(`SELECT count(*) c FROM ${t}`).get().c} rows`);
  } catch { /* table may not exist in older databases */ }
}

// 5. Expired sessions serve no purpose once past their expiry.
try {
  const removed = db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Math.floor(Date.now() / 1000)).changes;
  if (removed) log(`Cleared ${removed} expired session(s)`);
} catch { /* sessions table may not exist yet */ }

db.close();
log("Maintenance complete.");
