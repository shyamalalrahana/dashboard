import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { homedir } from "node:os";
import { join } from "node:path";

config({ path: ".env" });

// Keep in sync with DB_PATH in src/server/db/index.ts
const dbPath = process.env.SHOPOS_DB_PATH || join(homedir(), "ShopOS", "shopos.db");

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: dbPath },
});
