import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env" });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

await sql`
  CREATE TABLE IF NOT EXISTS retail_sales (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number   text        NOT NULL UNIQUE,
    customer_name text,
    payment_method text       NOT NULL DEFAULT 'Cash',
    total_amount  integer     NOT NULL,
    status        text        NOT NULL DEFAULT 'Paid',
    created_at    timestamp   NOT NULL DEFAULT now()
  )
`;
console.log("✓ retail_sales");

await sql`
  CREATE TABLE IF NOT EXISTS retail_sale_items (
    id           uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id      uuid     NOT NULL REFERENCES retail_sales(id) ON DELETE CASCADE,
    product_name text     NOT NULL,
    product_sku  text,
    qty          integer  NOT NULL,
    unit_price   integer  NOT NULL,
    line_total   integer  NOT NULL
  )
`;
console.log("✓ retail_sale_items");

await sql`
  CREATE TABLE IF NOT EXISTS wholesale_invoices (
    id             uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text      NOT NULL UNIQUE,
    customer       text      NOT NULL,
    date           text      NOT NULL,
    amount         integer   NOT NULL,
    profit         integer   NOT NULL DEFAULT 0,
    status         text      NOT NULL DEFAULT 'Pending',
    payment_method text      NOT NULL DEFAULT 'Cash',
    due_date       text,
    created_at     timestamp NOT NULL DEFAULT now()
  )
`;
console.log("✓ wholesale_invoices");

await sql.end();
console.log("\nMigration complete — 3 tables created.");
