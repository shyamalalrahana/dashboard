// Manage staff accounts from the terminal — useful for recovery when nobody
// can sign in (forgotten admin password, locked out, first staff member).
//
//   node scripts/staff.mjs list
//   node scripts/staff.mjs add "Priya" priya@shop.com staff --pin 1234
//   node scripts/staff.mjs add "Owner" owner@shop.com admin --password "secret123"
//   node scripts/staff.mjs set-pin priya@shop.com 4321
//   node scripts/staff.mjs set-password owner@shop.com "newsecret"
//   node scripts/staff.mjs unlock owner@shop.com
//   node scripts/staff.mjs remove priya@shop.com

import Database from "better-sqlite3";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { homedir } from "node:os";

const DB_PATH = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// Must stay identical to src/server/lib/password.ts
const COST = 2 ** 15, BLOCK_SIZE = 8, PARALLEL = 1, KEY_LEN = 64;

async function hash(secret) {
  const salt = randomBytes(16);
  const derived = await derive(secret.normalize("NFKC"), salt, KEY_LEN);
  return ["scrypt", COST, BLOCK_SIZE, PARALLEL, salt.toString("hex"), derived.toString("hex")].join("$");
}
function derive(secret, salt, keylen) {
  return new Promise((res, rej) =>
    scrypt(secret, salt, keylen, { N: COST, r: BLOCK_SIZE, p: PARALLEL, maxmem: 256 * 1024 * 1024 },
      (e, d) => (e ? rej(e) : res(d))));
}

const [cmd, ...args] = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));

const roleId = (name) => db.prepare("SELECT id FROM roles WHERE name = ?").get(name)?.id;

switch (cmd) {
  case "list": {
    const rows = db.prepare(`
      SELECT s.name, s.email, s.status, r.name AS role,
             s.password_hash IS NOT NULL AS has_password,
             s.pin_hash IS NOT NULL AS has_pin,
             s.locked_until
      FROM staff s LEFT JOIN roles r ON s.role_id = r.id
      ORDER BY s.name
    `).all();
    if (rows.length === 0) { console.log("No staff accounts yet."); break; }
    for (const r of rows) {
      const creds = [r.has_password && "password", r.has_pin && "PIN"].filter(Boolean).join(" + ") || "no credentials";
      const locked = r.locked_until && r.locked_until * 1000 > Date.now() ? "  [LOCKED]" : "";
      console.log(`${r.name.padEnd(20)} ${r.email.padEnd(28)} ${(r.role ?? "-").padEnd(7)} ${r.status.padEnd(9)} ${creds}${locked}`);
    }
    break;
  }

  case "add": {
    const [name, email, role = "staff"] = positional;
    if (!name || !email) { console.error('Usage: add "Name" email@shop.com [admin|staff] --pin 1234 | --password secret'); process.exit(1); }
    const rid = roleId(role);
    if (!rid) { console.error(`Unknown role "${role}". Run scripts/seed.mjs first.`); process.exit(1); }

    const pin = flag("pin"), password = flag("password");
    if (!pin && !password) { console.error("Provide --pin (staff) or --password (admin)."); process.exit(1); }
    if (pin && !/^\d{4,6}$/.test(pin)) { console.error("PIN must be 4–6 digits."); process.exit(1); }
    if (password && password.length < 8) { console.error("Password must be at least 8 characters."); process.exit(1); }

    db.prepare(`
      INSERT INTO staff (id, name, email, role_id, status, join_date, password_hash, pin_hash, must_reset, failed_attempts, created_at)
      VALUES (?, ?, ?, ?, 'Active', ?, ?, ?, 0, 0, ?)
    `).run(
      crypto.randomUUID(), name, email.toLowerCase(), rid,
      new Date().toISOString().slice(0, 10),
      password ? await hash(password) : null,
      pin ? await hash(pin) : null,
      Math.floor(Date.now() / 1000),
    );
    console.log(`Added ${name} (${role}).`);
    break;
  }

  case "set-pin": {
    const [email, pin] = positional;
    if (!/^\d{4,6}$/.test(pin ?? "")) { console.error("PIN must be 4–6 digits."); process.exit(1); }
    const res = db.prepare("UPDATE staff SET pin_hash = ?, failed_attempts = 0, locked_until = NULL WHERE email = ?")
      .run(await hash(pin), email.toLowerCase());
    console.log(res.changes ? `PIN updated for ${email}.` : `No account found for ${email}.`);
    break;
  }

  case "set-password": {
    const [email, password] = positional;
    if (!password || password.length < 8) { console.error("Password must be at least 8 characters."); process.exit(1); }
    const res = db.prepare("UPDATE staff SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE email = ?")
      .run(await hash(password), email.toLowerCase());
    console.log(res.changes ? `Password updated for ${email}.` : `No account found for ${email}.`);
    break;
  }

  case "unlock": {
    const [email] = positional;
    const res = db.prepare("UPDATE staff SET failed_attempts = 0, locked_until = NULL WHERE email = ?").run(email.toLowerCase());
    console.log(res.changes ? `Unlocked ${email}.` : `No account found for ${email}.`);
    break;
  }

  case "remove": {
    const [email] = positional;
    const res = db.prepare("DELETE FROM staff WHERE email = ?").run(email.toLowerCase());
    console.log(res.changes ? `Removed ${email}.` : `No account found for ${email}.`);
    break;
  }

  default:
    console.log(`Usage:
  node scripts/staff.mjs list
  node scripts/staff.mjs add "Name" email@shop.com [admin|staff] --pin 1234 | --password secret
  node scripts/staff.mjs set-pin email@shop.com 4321
  node scripts/staff.mjs set-password email@shop.com newsecret
  node scripts/staff.mjs unlock email@shop.com
  node scripts/staff.mjs remove email@shop.com`);
}

db.close();
