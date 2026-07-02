import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Always go through Supabase's transaction pooler (port 6543), never the
// direct port 5432. Serverless/edge runtimes like Cloudflare Workers can spin
// up a fresh isolate per request, and a direct connection has no server-side
// pooling — under real traffic it exhausts Postgres' connection limit and
// requests start failing intermittently ("This page didn't load").
// The port is rewritten here so the fix holds even where the deployment
// platform's DATABASE_URL secret still points at 5432.
const connectionString = process.env.DATABASE_URL!.replace(
  /(supabase\.co):5432\//,
  "$1:6543/",
);

// `max: 1` keeps each isolate to a single connection; PgBouncer pools server-side.
const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
