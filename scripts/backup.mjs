// Backup of the local database.
//   npm run db:backup
//
// Uses SQLite's VACUUM INTO, which takes a consistent snapshot while the app is
// still running. A plain file copy can capture a half-written transaction and
// produce a backup that will not open.
//
// Keeps 30 daily snapshots plus one archive per month, and verifies every new
// backup opens before old ones are removed — an unverified backup is a guess.
//
// Destination: SHOPOS_BACKUP_DIR, or ~/Library/Mobile Documents/com~apple~CloudDocs/ShopOS Backups
// (iCloud Drive) so backups leave this machine automatically.

import Database from "better-sqlite3";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DB_PATH = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");
const BACKUP_DIR =
  process.env.SHOPOS_BACKUP_DIR ||
  join(homedir(), "Library", "Mobile Documents", "com~apple~CloudDocs", "ShopOS Backups");
const DAILY_DIR = join(BACKUP_DIR, "daily");
const MONTHLY_DIR = join(BACKUP_DIR, "monthly");
const KEEP_DAILY = Number(process.env.SHOPOS_BACKUP_KEEP ?? 30);
const KEEP_MONTHLY = Number(process.env.SHOPOS_BACKUP_KEEP_MONTHLY ?? 24);

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

if (!existsSync(DB_PATH)) {
  console.error(`No database at ${DB_PATH} — nothing to back up.`);
  process.exit(1);
}

mkdirSync(DAILY_DIR, { recursive: true });
mkdirSync(MONTHLY_DIR, { recursive: true });

const now = new Date();
const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
const target = join(DAILY_DIR, `shopos-${stamp}.db`);

// ── Snapshot ──────────────────────────────────────────────────────────────────
const source = new Database(DB_PATH, { readonly: true });
try {
  // Fail loudly if the live database is already damaged, rather than dutifully
  // backing up corruption over a good copy.
  const integrity = source.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") {
    console.error(`Live database failed its integrity check: ${integrity}`);
    console.error("Backup aborted so a healthy older copy is not rotated away.");
    process.exit(2);
  }
  // VACUUM INTO also compacts, so backups are smaller than the live file.
  source.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
} finally {
  source.close();
}

// ── Verify the backup actually opens ─────────────────────────────────────────
let products = 0, sales = 0;
const check = new Database(target, { readonly: true });
try {
  const verify = check.pragma("integrity_check", { simple: true });
  if (verify !== "ok") throw new Error(`integrity check returned "${verify}"`);
  products = check.prepare("SELECT count(*) c FROM products").get().c;
  sales = check.prepare("SELECT count(*) c FROM retail_sales").get().c;
} catch (err) {
  console.error(`Backup verification failed: ${err.message}`);
  try { unlinkSync(target); } catch { /* nothing to clean up */ }
  process.exit(3);
} finally {
  check.close();
}

const sizeKb = (statSync(target).size / 1024).toFixed(0);
log(`Backup verified: ${target} (${sizeKb} KB · ${products} products · ${sales} sales)`);

// ── Monthly archive — first backup of each calendar month is kept long-term ──
const monthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const monthlyTarget = join(MONTHLY_DIR, `shopos-${monthTag}.db`);
if (!existsSync(monthlyTarget)) {
  copyFileSync(target, monthlyTarget);
  log(`Monthly archive created: ${monthTag}`);
}

// ── Retention ────────────────────────────────────────────────────────────────
function prune(dir, keep, label) {
  const files = readdirSync(dir).filter((f) => f.startsWith("shopos-") && f.endsWith(".db")).sort().reverse();
  let removed = 0;
  for (const old of files.slice(keep)) {
    unlinkSync(join(dir, old));
    removed++;
  }
  log(`${label}: keeping ${Math.min(files.length, keep)}${removed ? `, removed ${removed}` : ""}`);
}

prune(DAILY_DIR, KEEP_DAILY, "Daily");
prune(MONTHLY_DIR, KEEP_MONTHLY, "Monthly");
