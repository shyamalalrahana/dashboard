import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// promisify() resolves to scrypt's 3-argument overload, which drops the tuning
// options, so the callback form is wrapped by hand instead.
function scryptAsync(secret: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(secret, salt, keylen, options, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

// scrypt is used rather than bcrypt/argon2 because it is built into Node and
// needs no native module — this project already hit a native-module crash with
// the SQLite driver, and a shop machine should not depend on a compile step to
// let people log in. scrypt is memory-hard, so it resists GPU cracking the same
// way argon2 does.
const KEY_LEN = 64;
const COST = 2 ** 15;   // ~50ms per hash on a modern Mac
const BLOCK_SIZE = 8;
const PARALLEL = 1;

/** Produces `scrypt$N$r$p$salt$hash`, all parameters embedded so they can change later. */
export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(secret.normalize("NFKC"), salt, KEY_LEN, {
    N: COST, r: BLOCK_SIZE, p: PARALLEL, maxmem: 256 * 1024 * 1024,
  });
  return ["scrypt", COST, BLOCK_SIZE, PARALLEL, salt.toString("hex"), derived.toString("hex")].join("$");
}

/** Constant-time verification. Returns false rather than throwing on a malformed hash. */
export async function verifySecret(secret: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  try {
    const derived = await scryptAsync(secret.normalize("NFKC"), Buffer.from(saltHex, "hex"), hashHex.length / 2, {
      N: Number(nRaw), r: Number(rRaw), p: Number(pRaw), maxmem: 256 * 1024 * 1024,
    });
    const expected = Buffer.from(hashHex, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Opaque, unguessable session token. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}
