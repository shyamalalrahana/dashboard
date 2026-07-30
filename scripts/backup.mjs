// Daily backup of the local database.
//   node scripts/backup.mjs
//
// Uses SQLite's VACUUM INTO, which takes a consistent snapshot while the app is
// still running. A plain file copy can capture a half-written transaction and
// produce a backup that will not open.
//
// Destination: SHOPOS_BACKUP_DIR, or ~/Library/Mobile Documents/com~apple~CloudDocs/ShopOS Backups
// (iCloud Drive) so backups land off this machine automatically.

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DB_PATH = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");
const BACKUP_DIR =
  process.env.SHOPOS_BACKUP_DIR ||
  join(homedir(), "Library", "Mobile Documents", "com~apple~CloudDocs", "ShopOS Backups");
const KEEP_DAYS = Number(process.env.SHOPOS_BACKUP_KEEP ?? 30);

if (!existsSync(DB_PATH)) {
  console.error(`No database at ${DB_PATH} — nothing to back up.`);
  process.exit(1);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const target = join(BACKUP_DIR, `shopos-${stamp}.db`);

const db = new Database(DB_PATH, { readonly: true });
try {
  // VACUUM INTO also compacts, so backups are smaller than the live file.
  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
} finally {
  db.close();
}

const size = (statSync(target).size / 1024).toFixed(0);
console.log(`Backup written: ${target} (${size} KB)`);

// Retention — keep the most recent KEEP_DAYS snapshots.
const backups = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith("shopos-") && f.endsWith(".db"))
  .sort()
  .reverse();

let removed = 0;
for (const old of backups.slice(KEEP_DAYS)) {
  unlinkSync(join(BACKUP_DIR, old));
  removed++;
}
console.log(`Kept ${Math.min(backups.length, KEEP_DAYS)} backup(s)${removed ? `, removed ${removed} older` : ""}.`);
