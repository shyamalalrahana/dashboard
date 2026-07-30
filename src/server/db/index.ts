import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import * as schema from "./schema";

// The database is a single file on this computer. Nothing leaves the machine,
// and the shop keeps billing even with no internet.
// Override the location with SHOPOS_DB_PATH (used by backup/restore tooling).
export const DB_PATH =
  process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");

mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);

// WAL lets reads continue while a write is in progress — important when the
// counter is billing and a report is being viewed at the same time.
sqlite.pragma("journal_mode = WAL");
// Wait rather than fail instantly if another connection holds a write lock.
sqlite.pragma("busy_timeout = 5000");
// ON DELETE CASCADE is off by default in SQLite; sale items rely on it.
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export const sqliteConnection = sqlite;
