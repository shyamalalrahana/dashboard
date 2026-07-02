import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Connects through Supabase's transaction pooler (port 6543), not the direct
// port 5432. Serverless/edge runtimes like Cloudflare Workers can spin up a
// fresh isolate per request, and a direct connection has no server-side
// pooling — under real traffic it exhausts Postgres' connection limit and
// requests start failing intermittently. `max: 1` keeps each isolate to a
// single connection since PgBouncer already pools on the server side.
const client = postgres(connectionString, { prepare: false, max: 1, idle_timeout: 20 });

export const db = drizzle(client, { schema });
