// Restore the database from a backup.
//   npm run db:restore              → list available backups
//   npm run db:restore -- latest    → restore the newest daily backup
//   npm run db:restore -- <path>    → restore a specific file
//
// The current database is never simply overwritten: it is copied aside first,
// so a mistaken restore can itself be undone.

import Database from "better-sqlite3";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";

const DB_PATH = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");
const BACKUP_DIR =
  process.env.SHOPOS_BACKUP_DIR ||
  join(homedir(), "Library", "Mobile Documents", "com~apple~CloudDocs", "ShopOS Backups");

function listBackups() {
  const found = [];
  for (const sub of ["daily", "monthly"]) {
    const dir = join(BACKUP_DIR, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.startsWith("shopos-") && f.endsWith(".db")) {
        const full = join(dir, f);
        found.push({ path: full, kind: sub, mtime: statSync(full).mtime, size: statSync(full).size });
      }
    }
  }
  return found.sort((a, b) => b.mtime - a.mtime);
}

function describe(file) {
  const db = new Database(file, { readonly: true });
  try {
    const ok = db.pragma("integrity_check", { simple: true });
    const products = db.prepare("SELECT count(*) c FROM products").get().c;
    const sales = db.prepare("SELECT count(*) c FROM retail_sales").get().c;
    return { ok: ok === "ok", products, sales };
  } finally {
    db.close();
  }
}

const arg = process.argv[2];
const backups = listBackups();

if (!arg) {
  if (backups.length === 0) {
    console.log(`No backups found in ${BACKUP_DIR}`);
    console.log("Run: npm run db:backup");
    process.exit(0);
  }
  console.log(`Backups in ${BACKUP_DIR}:\n`);
  backups.slice(0, 20).forEach((b, i) => {
    const kb = (b.size / 1024).toFixed(0);
    console.log(`${String(i + 1).padStart(2)}. [${b.kind}] ${b.mtime.toLocaleString("en-IN")}  ${kb} KB`);
    console.log(`    ${b.path}`);
  });
  console.log(`\nRestore the newest:  npm run db:restore -- latest`);
  console.log(`Restore a specific:  npm run db:restore -- "<path from above>"`);
  process.exit(0);
}

const chosen = arg === "latest" ? backups[0]?.path : arg;
if (!chosen || !existsSync(chosen)) {
  console.error(arg === "latest" ? "No backups available to restore." : `File not found: ${arg}`);
  process.exit(1);
}

// Refuse to restore something that will not open.
let info;
try {
  info = describe(chosen);
} catch (err) {
  console.error(`That file is not a usable ShopOS database: ${err.message}`);
  process.exit(1);
}
if (!info.ok) {
  console.error("That backup fails its integrity check — refusing to restore it.");
  process.exit(1);
}

console.log(`About to restore:\n  ${chosen}`);
console.log(`  ${info.products} products · ${info.sales} sales\n`);
console.log(`This replaces the current database at:\n  ${DB_PATH}`);

if (existsSync(DB_PATH)) {
  const current = describe(DB_PATH);
  console.log(`  (currently ${current.products} products · ${current.sales} sales)\n`);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question('Type "restore" to continue: ')).trim();
rl.close();
if (answer !== "restore") {
  console.log("Cancelled — nothing was changed.");
  process.exit(0);
}

// Keep the outgoing database so this action is reversible.
if (existsSync(DB_PATH)) {
  const asideDir = join(homedir(), "ShopOS", "replaced");
  mkdirSync(asideDir, { recursive: true });
  const aside = join(asideDir, `shopos-replaced-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.db`);
  const live = new Database(DB_PATH, { readonly: true });
  try { live.exec(`VACUUM INTO '${aside.replace(/'/g, "''")}'`); } finally { live.close(); }
  console.log(`Previous database saved to:\n  ${aside}`);
}

copyFileSync(chosen, DB_PATH);
// Stale WAL/SHM files from the replaced database must not linger.
for (const suffix of ["-wal", "-shm"]) {
  const f = DB_PATH + suffix;
  if (existsSync(f)) {
    try { (await import("node:fs")).unlinkSync(f); } catch { /* already gone */ }
  }
}

const restored = describe(DB_PATH);
console.log(`\nRestored: ${restored.products} products · ${restored.sales} sales`);
console.log("Restart ShopOS so it picks up the restored database.");
